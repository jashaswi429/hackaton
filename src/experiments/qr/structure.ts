/*
 * QR structure geometry.
 *
 * Everything here is derived from the QR specification for a given version —
 * finder/separator positions, timing lines, format-information strips,
 * version-information blocks and alignment-pattern centres are all defined
 * deterministically by the version number, so they can be mapped exactly.
 *
 * The one thing that cannot be mapped exactly is which module belongs to a
 * *data* codeword versus an *error-correction* codeword: the standard
 * interleaves them, and the encoder does not expose the block layout. Those
 * modules are reported as a single "data region" and the UI labels it as an
 * educational approximation.
 */

import type { RegionLayer } from './types';

/** Region codes stored per module. */
export const REGION = {
  DATA: 0,
  FINDER: 1,
  SEPARATOR: 2,
  TIMING: 3,
  ALIGNMENT: 4,
  FORMAT: 5,
  VERSION: 6,
  DARK: 7,
} as const;

export type RegionCode = (typeof REGION)[keyof typeof REGION];

export const REGION_LABEL: Record<number, string> = {
  [REGION.DATA]: 'DATA / EC',
  [REGION.FINDER]: 'FINDER',
  [REGION.SEPARATOR]: 'SEPARATOR',
  [REGION.TIMING]: 'TIMING',
  [REGION.ALIGNMENT]: 'ALIGNMENT',
  [REGION.FORMAT]: 'FORMAT',
  [REGION.VERSION]: 'VERSION',
  [REGION.DARK]: 'FIXED DARK',
};

/** Layer explanations surfaced when a structure is selected. */
export const LAYER_INFO: Partial<
  Record<RegionLayer, { title: string; body: string }>
> = {
  finder: {
    title: 'FINDER PATTERN',
    body: 'These three large corner patterns help a scanner locate the QR code and determine its orientation.',
  },
  alignment: {
    title: 'ALIGNMENT PATTERN',
    body: 'Smaller corner-like squares that let a scanner correct for the distortion of a curved or angled surface. Higher versions need more of them.',
  },
  timing: {
    title: 'TIMING PATTERN',
    body: 'Alternating modules help establish the grid spacing.',
  },
  format: {
    title: 'FORMAT INFORMATION',
    body: 'A small copy of the error-correction level and the mask pattern, so a scanner knows how to read the rest of the symbol.',
  },
  version: {
    title: 'VERSION INFORMATION',
    body: 'Present from version 7 upward, these blocks tell the scanner which version of the standard the code uses.',
  },
  data: {
    title: 'DATA REGION',
    body: 'The remaining encoded information is placed through the matrix in a defined pattern.',
  },
  ec: {
    title: 'ERROR CORRECTION REGION',
    body: 'Additional encoded information makes it possible to recover data when some modules cannot be read.',
  },
};

/**
 * Alignment-pattern centre coordinates for a version.
 * Standard algorithm; version 1 has no alignment patterns.
 */
export function alignmentPositions(version: number): number[] {
  if (version <= 1) return [];
  const numAlign = Math.floor(version / 7) + 2;
  const step =
    version === 32
      ? 26
      : Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
  const result: number[] = [6];
  for (let pos = version * 4 + 10; result.length < numAlign; pos -= step) {
    result.splice(1, 0, pos);
  }
  return result;
}

/**
 * Number of modules available for data + error-correction codewords.
 * Standard formula (matches Nayuki's reference implementation) — used to
 * report total codewords and to cross-check the structure map.
 */
export function getNumRawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

/**
 * Classify every module of a version into a structural region.
 * The returned map is row-major (index = row * size + col).
 */
export function classifyModules(version: number): Uint8Array {
  const size = version * 4 + 17;
  const map = new Uint8Array(size * size); // defaults to DATA
  const set = (r: number, c: number, code: RegionCode) => {
    if (r < 0 || c < 0 || r >= size || c >= size) return;
    map[r * size + c] = code;
  };

  // Finder patterns and their separators (three corners).
  const corners: [number, number][] = [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ];
  for (const [r0, c0] of corners) {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const inFinder = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        set(r0 + dr, c0 + dc, inFinder ? REGION.FINDER : REGION.SEPARATOR);
      }
    }
  }

  // Alignment patterns — every centre pair except the three finder corners.
  const pos = alignmentPositions(version);
  const last = pos[pos.length - 1];
  for (const r of pos) {
    for (const c of pos) {
      const isFinderCorner =
        (r === 6 && c === 6) || (r === 6 && c === last) || (r === last && c === 6);
      if (isFinderCorner) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) set(r + dr, c + dc, REGION.ALIGNMENT);
      }
    }
  }

  // Timing patterns run along row 6 and column 6, between the finders.
  for (let i = 8; i <= size - 9; i++) {
    if (map[6 * size + i] === REGION.DATA) set(6, i, REGION.TIMING);
    if (map[i * size + 6] === REGION.DATA) set(i, 6, REGION.TIMING);
  }

  // Format information: two 15-module strips around the finders.
  for (let i = 0; i <= 8; i++) {
    if (i === 6) continue; // (8,6) and (6,8) belong to the timing lines
    if (map[8 * size + i] === REGION.DATA) set(8, i, REGION.FORMAT);
    if (map[i * size + 8] === REGION.DATA) set(i, 8, REGION.FORMAT);
  }
  for (let i = size - 8; i <= size - 1; i++) {
    if (map[8 * size + i] === REGION.DATA) set(8, i, REGION.FORMAT);
    if (map[i * size + 8] === REGION.DATA) set(i, 8, REGION.FORMAT);
  }

  // Version information: two 3×6 blocks, only for versions 7 and above.
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        set(size - 11 + j, i, REGION.VERSION); // bottom-left block
        set(i, size - 11 + j, REGION.VERSION); // top-right block
      }
    }
  }

  // The fixed dark module (always dark, next to the lower-left finder).
  set(size - 8, 8, REGION.DARK);

  return map;
}

/** Count modules per region code. */
export function regionCounts(map: Uint8Array): Record<number, number> {
  const counts: Record<number, number> = {};
  for (let i = 0; i < map.length; i++) {
    counts[map[i]] = (counts[map[i]] ?? 0) + 1;
  }
  return counts;
}

/** True when none of the eight modules of a finder core region are damaged. */
export function finderRegionsIntact(version: number, damaged: Uint8Array | null): boolean {
  if (!damaged) return true;
  const size = version * 4 + 17;
  const corners: [number, number][] = [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ];
  for (const [r0, c0] of corners) {
    for (let dr = 0; dr <= 6; dr++) {
      for (let dc = 0; dc <= 6; dc++) {
        if (damaged[(r0 + dr) * size + (c0 + dc)]) return false;
      }
    }
  }
  return true;
}
