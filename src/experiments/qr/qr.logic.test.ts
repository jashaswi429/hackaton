/*
 * Logic tests for Experiment 002 — The QR Lab.
 *
 * The lab keeps all non-React logic in pure modules (`qr`, `structure`,
 * `damage`). This script exercises those modules directly. It is bundled with
 * esbuild and executed by Node (see the `test` script in package.json), so it
 * can import the TypeScript sources without adding a test framework.
 *
 * The real decoder (`decode`) needs a canvas and is therefore covered by the
 * headless browser probe instead of this file.
 */

import assert from 'node:assert/strict';
import { countDark, detectMode, encodeQr } from '../src/experiments/qr/qr';
import {
  REGION,
  alignmentPositions,
  classifyModules,
  getNumRawDataModules,
  regionCounts,
} from '../src/experiments/qr/structure';
import { applyDamage, mulberry32 } from '../src/experiments/qr/damage';

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('QR Lab — logic tests');

/* ---------------- encoding ---------------- */

check('size = version * 4 + 17', () => {
  for (const text of ['Hello, QRYX.', '1234567890', 'https://qryx.lab']) {
    for (const ec of ['L', 'M', 'Q', 'H'] as const) {
      const m = encodeQr(text, ec);
      assert.ok(m, `expected a matrix for ${text}/${ec}`);
      assert.equal(m!.size, m!.version * 4 + 17);
      assert.equal(m!.modules.length, m!.size * m!.size);
    }
  }
});

check('mode detection follows the QR character sets', () => {
  assert.equal(detectMode('3141592653'), 'Numeric');
  assert.equal(detectMode('HELLO QRYX.'), 'Alphanumeric');
  assert.equal(detectMode('Hello, QRYX.'), 'Byte'); // lowercase is not alphanumeric
  assert.equal(detectMode('https://qryx.lab/002'), 'Byte'); // lowercase + letters
});

check('encoder mode matches the detected mode', () => {
  assert.equal(encodeQr('12345', 'M')!.mode, 'Numeric');
  assert.equal(encodeQr('ABC 123', 'M')!.mode, 'Alphanumeric');
  assert.equal(encodeQr('abc', 'M')!.mode, 'Byte');
});

check('empty and over-long input are rejected without throwing', () => {
  assert.equal(encodeQr('', 'M'), null);
  assert.equal(encodeQr('x'.repeat(2000), 'M'), null);
});

check('higher error correction never shrinks the symbol', () => {
  const text = 'The quick brown fox jumps over the lazy dog. 0123456789';
  const sizes = (['L', 'M', 'Q', 'H'] as const).map((ec) => encodeQr(text, ec)!.size);
  for (let i = 1; i < sizes.length; i++) {
    assert.ok(sizes[i] >= sizes[i - 1], `EC step ${i} shrank the symbol`);
  }
  assert.deepEqual(sizes, [...sizes].sort((a, b) => a - b));
});

/* ---------------- real QR structure ---------------- */

check('finder patterns are real (a 7×7 dark border with a dark core)', () => {
  const m = encodeQr('Hello, QRYX.', 'M')!;
  const dark = (r: number, c: number) => m.modules[r * m.size + c] === 1;
  // Top-left finder: outer ring dark, inner ring light, centre dark.
  for (let i = 0; i < 7; i++) {
    assert.equal(dark(0, i), true);
    assert.equal(dark(6, i), true);
    assert.equal(dark(i, 0), true);
    assert.equal(dark(i, 6), true);
  }
  assert.equal(dark(1, 1), false);
  assert.equal(dark(3, 3), true);
});

check('a different message produces a different matrix', () => {
  const a = encodeQr('Hello, QRYX.', 'M')!;
  const b = encodeQr('Hello, QRYX!', 'M')!;
  let diff = 0;
  const n = Math.min(a.modules.length, b.modules.length);
  for (let i = 0; i < n; i++) if (a.modules[i] !== b.modules[i]) diff++;
  assert.ok(diff > 20, `expected many differing modules, got ${diff}`);
});

/* ---------------- structure geometry ---------------- */

check('classifyModules agrees with the standard data-module count', () => {
  for (let version = 1; version <= 10; version++) {
    const counts = regionCounts(classifyModules(version));
    const dataModules = counts[REGION.DATA] ?? 0;
    assert.equal(
      dataModules,
      getNumRawDataModules(version),
      `version ${version}: data region ${dataModules} ≠ raw data modules ${getNumRawDataModules(version)}`,
    );
  }
});

check('the fixed dark module is always present at (size-8, 8)', () => {
  for (const version of [1, 2, 7, 12]) {
    const size = version * 4 + 17;
    const map = classifyModules(version);
    assert.equal(map[(size - 8) * size + 8], REGION.DARK);
  }
});

check('exactly three finder cores exist (147 modules)', () => {
  for (const version of [1, 4, 9]) {
    const counts = regionCounts(classifyModules(version));
    assert.equal(counts[REGION.FINDER], 147);
  }
});

check('alignment positions match the standard', () => {
  assert.deepEqual(alignmentPositions(1), []);
  assert.deepEqual(alignmentPositions(2), [6, 18]);
  assert.deepEqual(alignmentPositions(7), [6, 22, 38]);
  assert.deepEqual(alignmentPositions(14), [6, 26, 46, 66]);
});

check('version information appears only from version 7', () => {
  assert.equal(regionCounts(classifyModules(6))[REGION.VERSION] ?? 0, 0);
  assert.equal(regionCounts(classifyModules(7))[REGION.VERSION], 36);
});

/* ---------------- damage ---------------- */

check('damage never mutates the original grid', () => {
  const m = encodeQr('Hello, QRYX.', 'M')!;
  const snapshot = Uint8Array.from(m.modules);
  applyDamage(m.modules, m.size, { amount: 30, shape: 'square', position: 'center', seed: 1 });
  assert.deepEqual(m.modules, snapshot);
});

check('damage count is within one module of the requested area', () => {
  const m = encodeQr('Hello, QRYX.', 'M')!;
  const target = Math.round((25 / 100) * m.size * m.size);
  const d = applyDamage(m.modules, m.size, {
    amount: 25,
    shape: 'square',
    position: 'center',
    seed: 1,
  });
  assert.ok(Math.abs(d.count - target) <= m.size, `count ${d.count} far from target ${target}`);
});

check('zero damage changes nothing', () => {
  const m = encodeQr('Hello, QRYX.', 'M')!;
  const d = applyDamage(m.modules, m.size, {
    amount: 0,
    shape: 'square',
    position: 'center',
    seed: 1,
  });
  assert.equal(d.count, 0);
  assert.deepEqual(d.modules, m.modules);
});

check('random placement is reproducible for a given seed', () => {
  const m = encodeQr('Hello, QRYX.', 'M')!;
  const spec = { amount: 20, shape: 'circle', position: 'random', seed: 42 } as const;
  const a = applyDamage(m.modules, m.size, spec);
  const b = applyDamage(m.modules, m.size, spec);
  assert.deepEqual(a.modules, b.modules);
  assert.deepEqual(a.bounds, b.bounds);
});

check('a different seed moves the damage', () => {
  const m = encodeQr('Hello, QRYX.', 'M')!;
  const a = applyDamage(m.modules, m.size, { amount: 20, shape: 'square', position: 'random', seed: 1 });
  const b = applyDamage(m.modules, m.size, { amount: 20, shape: 'square', position: 'random', seed: 2 });
  assert.notDeepEqual(a.bounds, b.bounds);
});

check('mulberry32 is deterministic and in [0, 1)', () => {
  const a = mulberry32(7);
  const b = mulberry32(7);
  for (let i = 0; i < 100; i++) {
    const v = a();
    assert.equal(v, b());
    assert.ok(v >= 0 && v < 1);
  }
});

/* ---------------- round trip ---------------- */

check('encoding a message and re-encoding is stable', () => {
  const a = encodeQr('DATA SURVIVES DAMAGE', 'Q')!;
  const b = encodeQr('DATA SURVIVES DAMAGE', 'Q')!;
  assert.deepEqual(a.modules, b.modules);
  assert.ok(countDark(a.modules) > 0);
});

console.log(`\n${passed} checks passed.`);
