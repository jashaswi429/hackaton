/*
 * Damage simulation.
 *
 * Damage is modelled as *flipped modules* — a module a scanner would read
 * incorrectly. It is applied to a copy of the module grid: the original
 * encoded data is never modified, which keeps the ORIGINAL and DAMAGED views
 * genuinely independent.
 *
 * Placement is deterministic for a given seed, so results are reproducible.
 */

import type { DamagePosition, DamageShape } from './types';

export type DamageSpec = {
  /** Percentage of the total module count to damage (0–60). */
  amount: number;
  shape: DamageShape;
  position: DamagePosition;
  /** Seed for the random-placement mode. */
  seed: number;
  /** Centre in module coordinates, used when position is 'user'. */
  origin?: { row: number; col: number } | null;
};

export type DamageBounds = { row0: number; col0: number; row1: number; col1: number };

export type DamageResult = {
  /** The damaged module grid (a copy of the original with flips applied). */
  modules: Uint8Array;
  /** 1 where a module was damaged. */
  mask: Uint8Array;
  count: number;
  bounds: DamageBounds | null;
};

/** Small deterministic PRNG (mulberry32). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Apply damage to a copy of `base`.
 * Never mutates the input grid.
 */
export function applyDamage(
  base: Uint8Array,
  size: number,
  spec: DamageSpec,
): DamageResult {
  const modules = Uint8Array.from(base);
  const mask = new Uint8Array(size * size);
  const total = size * size;
  const target = Math.round((Math.max(0, Math.min(60, spec.amount)) / 100) * total);

  if (target === 0) {
    return { modules, mask, count: 0, bounds: null };
  }

  // Resolve the damage centre.
  let centreRow = (size - 1) / 2;
  let centreCol = (size - 1) / 2;
  if (spec.position === 'random') {
    const rand = mulberry32(spec.seed);
    centreRow = rand() * (size - 1);
    centreCol = rand() * (size - 1);
  } else if (spec.position === 'user' && spec.origin) {
    centreRow = spec.origin.row;
    centreCol = spec.origin.col;
  }

  // Convert the target area into a half-extent for the chosen shape.
  const halfExtent =
    spec.shape === 'square'
      ? Math.sqrt(target) / 2
      : Math.sqrt(target / Math.PI);

  let count = 0;
  let row0 = Infinity;
  let col0 = Infinity;
  let row1 = -Infinity;
  let col1 = -Infinity;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const dr = r - centreRow;
      const dc = c - centreCol;
      const inside =
        spec.shape === 'square'
          ? Math.abs(dr) <= halfExtent && Math.abs(dc) <= halfExtent
          : dr * dr + dc * dc <= halfExtent * halfExtent;
      if (!inside) continue;

      const idx = r * size + c;
      mask[idx] = 1;
      modules[idx] = modules[idx] ? 0 : 1;
      count++;
      if (r < row0) row0 = r;
      if (c < col0) col0 = c;
      if (r > row1) row1 = r;
      if (c > col1) col1 = c;
    }
  }

  const bounds = count > 0 ? { row0, col0, row1, col1 } : null;
  return { modules, mask, count, bounds };
}
