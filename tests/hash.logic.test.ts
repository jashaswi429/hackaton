/*
 * Logic tests for Experiment 003 — The Hash Lab.
 *
 * The lab keeps all non-React logic in the pure `hash` module. This script
 * exercises it directly — including the official SHA-256 test vectors — and is
 * bundled with esbuild and run by Node (see the `test` script in package.json),
 * so it can import the TypeScript source without adding a test framework.
 */

import assert from 'node:assert/strict';
import {
  DIGEST_BITS,
  DIGEST_BYTES,
  bitDiff,
  bytesToBits,
  flipBit,
  groupDigits,
  hammingDistance,
  hasLeadingZeroNibbles,
  popcount,
  sha256,
  sha256Hex,
  toHex,
  utf8Bytes,
} from '../src/experiments/hash/hash';

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('Hash Lab — logic tests');

/* ---------------- known-answer vectors (FIPS 180-4) ---------------- */

check('SHA-256("") matches the standard vector', () => {
  assert.equal(
    sha256Hex(''),
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  );
});

check('SHA-256("abc") matches the standard vector', () => {
  assert.equal(
    sha256Hex('abc'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  );
});

check('SHA-256 of a longer sentence matches the standard vector', () => {
  assert.equal(
    sha256Hex('The quick brown fox jumps over the lazy dog'),
    'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592',
  );
});

check('the digest is always 32 bytes / 256 bits', () => {
  assert.equal(DIGEST_BYTES, 32);
  assert.equal(DIGEST_BITS, 256);
  for (const text of ['', 'a', 'x'.repeat(1000)]) {
    const d = sha256(utf8Bytes(text));
    assert.equal(d.length, DIGEST_BYTES);
    assert.equal(toHex(d).length, DIGEST_BITS / 4);
  }
});

check('the same input always produces the same digest', () => {
  assert.equal(sha256Hex('QRYX'), sha256Hex('QRYX'));
});

check('a one-character change rewrites the whole digest', () => {
  const a = sha256Hex('QRYX');
  const b = sha256Hex('QRYY');
  assert.notEqual(a, b);
});

/* ---------------- bit helpers ---------------- */

check('bytesToBits expands one byte to eight bits', () => {
  const bits = bytesToBits(new Uint8Array([0b10110001]));
  assert.deepEqual([...bits], [1, 0, 1, 1, 0, 0, 0, 1]);
  assert.equal(bytesToBits(sha256(utf8Bytes('x'))).length, DIGEST_BITS);
});

check('popcount counts set bits correctly', () => {
  assert.equal(popcount(new Uint8Array([0, 0])), 0);
  assert.equal(popcount(new Uint8Array([0xff, 0xff])), 16);
  assert.equal(popcount(new Uint8Array([0b10101010])), 4);
});

check('hammingDistance equals the number of differing bits', () => {
  assert.equal(hammingDistance(new Uint8Array([0]), new Uint8Array([0])), 0);
  assert.equal(hammingDistance(new Uint8Array([0xff]), new Uint8Array([0x00])), 8);
});

check('bitDiff marks exactly the differing bits', () => {
  const a = new Uint8Array([0b00000000]);
  const b = new Uint8Array([0b10100000]);
  assert.deepEqual([...bitDiff(a, b)], [1, 0, 1, 0, 0, 0, 0, 0]);
});

check('flipBit changes exactly one bit', () => {
  const src = new Uint8Array([0x00, 0x00]);
  const out = flipBit(src, 12);
  assert.deepEqual([...src], [0, 0], 'the source must not be mutated');
  assert.equal(hammingDistance(src, out), 1);
});

/* ---------------- avalanche effect ---------------- */

check('flipping one input bit changes a large fraction of the output', () => {
  const base = sha256(utf8Bytes('QRYX'));
  let minChanged = DIGEST_BITS;
  for (let bit = 0; bit < 8; bit++) {
    const flipped = sha256(flipBit(utf8Bytes('QRYX'), bit));
    minChanged = Math.min(minChanged, hammingDistance(base, flipped));
  }
  // A healthy hash flips ~128 of 256 bits; anything under 64 would be alarming.
  assert.ok(minChanged > 64, `expected a wide avalanche, smallest was ${minChanged}`);
});

/* ---------------- proof-of-work target ---------------- */

check('hasLeadingZeroNibbles respects the required prefix', () => {
  const digest = new Uint8Array(32);
  digest[0] = 0x00;
  digest[1] = 0x0f;
  assert.equal(hasLeadingZeroNibbles(digest, 1), true);
  assert.equal(hasLeadingZeroNibbles(digest, 2), true);
  assert.equal(hasLeadingZeroNibbles(digest, 3), true); // third nibble: high half of 0x0f
  assert.equal(hasLeadingZeroNibbles(digest, 4), false); // fourth nibble is 0xf
});

check('a zero-nibble target is always satisfied', () => {
  assert.equal(hasLeadingZeroNibbles(sha256(utf8Bytes('anything')), 0), true);
});

check('the miner can find a 2-nibble target by guessing and checking', () => {
  let nonce = -1;
  for (let i = 0; i < 200000; i++) {
    if (hasLeadingZeroNibbles(sha256(utf8Bytes(`QRYX#${i}`)), 2)) {
      nonce = i;
      break;
    }
  }
  assert.ok(nonce >= 0, 'expected to find a 2-nibble target within 200k attempts');
});

/* ---------------- formatting ---------------- */

check('groupDigits inserts thousands separators', () => {
  assert.equal(groupDigits(0), '0');
  assert.equal(groupDigits(1000), '1,000');
  assert.equal(groupDigits(1048576), '1,048,576');
});

console.log(`\n${passed} checks passed.`);
