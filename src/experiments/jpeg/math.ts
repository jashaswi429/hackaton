/*
 * JPEG-style transform mathematics.
 *
 * Pure, dependency-free logic — deliberately kept free of React and any DOM
 * access so it can be unit tested and reasoned about like the maths it is.
 *
 * Pipeline modelled here:
 *   pixels -> level shift -> forward DCT-II -> quantize -> dequantize
 *          -> inverse DCT -> level shift back -> clamp -> pixels
 *
 * This is a mathematically accurate DCT + quantization explorer, NOT a
 * complete JPEG encoder (no Huffman coding, chroma subsampling or file sizing).
 */

export const BLOCK = 8;
export const BLOCK_AREA = BLOCK * BLOCK;

/**
 * Precomputed cosine basis: COS[k][n] = cos((2n + 1) * k * PI / 16).
 * Computed once at module load so the transform loops are multiply-only.
 */
export const COS: readonly (readonly number[])[] = (() => {
  const table: number[][] = [];
  for (let k = 0; k < BLOCK; k++) {
    const row: number[] = [];
    for (let n = 0; n < BLOCK; n++) {
      row.push(Math.cos(((2 * n + 1) * k * Math.PI) / 16));
    }
    table.push(row);
  }
  return table;
})();

/** DCT normalisation factor: C(0) = 1/sqrt(2), C(k) = 1 for k > 0. */
export const C: readonly number[] = (() => {
  const out: number[] = [];
  for (let k = 0; k < BLOCK; k++) out.push(k === 0 ? 1 / Math.SQRT2 : 1);
  return out;
})();

/**
 * Standard JPEG luminance quantization matrix (Annex K, table K.1),
 * stored row-major: index = v * 8 + u.
 */
export const BASE_LUMA_QUANT: readonly number[] = [
  16, 11, 10, 16, 24, 40, 51, 61,
  12, 12, 14, 19, 26, 58, 60, 55,
  14, 13, 16, 24, 40, 57, 69, 56,
  14, 17, 22, 29, 51, 87, 80, 62,
  18, 22, 37, 56, 68, 109, 103, 77,
  24, 35, 55, 64, 81, 104, 113, 92,
  49, 64, 78, 87, 103, 121, 120, 101,
  72, 92, 95, 98, 112, 100, 103, 99,
];

/** A flat 8x8 matrix of numbers, row-major (index = row * 8 + col). */
export type Matrix = Float64Array;

export function makeMatrix(): Matrix {
  return new Float64Array(BLOCK_AREA);
}

/** Clamp a quality value into the legal 1..100 range. */
export function clampQuality(quality: number): number {
  if (!Number.isFinite(quality)) return 75;
  return Math.min(100, Math.max(1, Math.floor(quality)));
}

/**
 * Build the scaled quantization table for a given quality (1..100) using the
 * conventional JPEG scaling formula:
 *   Q < 50  -> scale = 5000 / Q
 *   Q >= 50 -> scale = 200 - 2Q
 *   entry   = floor((base * scale + 50) / 100), clamped to 1..255.
 * At Q = 100 every entry collapses to 1 (lossless quantization).
 */
export function buildQuantTable(quality: number): Matrix {
  const q = clampQuality(quality);
  const scale = q < 50 ? 5000 / q : 200 - 2 * q;
  const out = makeMatrix();
  for (let i = 0; i < BLOCK_AREA; i++) {
    let value = Math.floor((BASE_LUMA_QUANT[i] * scale + 50) / 100);
    if (value < 1) value = 1;
    if (value > 255) value = 255;
    out[i] = value;
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Level shifting
 * ------------------------------------------------------------------ */

/** JPEG shifts 8-bit samples from 0..255 to a signed range by subtracting 128. */
export function levelShift(pixels: ArrayLike<number>): Matrix {
  const out = makeMatrix();
  for (let i = 0; i < BLOCK_AREA; i++) out[i] = pixels[i] - 128;
  return out;
}

/** Reverse level shift: bring the signed 0-centered block back to 0..255. */
export function levelUnshift(shifted: ArrayLike<number>): Matrix {
  const out = makeMatrix();
  for (let i = 0; i < BLOCK_AREA; i++) out[i] = shifted[i] + 128;
  return out;
}

/* ------------------------------------------------------------------ *
 * Forward / inverse DCT-II (orthonormal, separable)
 * ------------------------------------------------------------------ */

/**
 * 1D orthonormal DCT-II on a length-8 vector:
 *   out[u] = 0.5 * C(u) * sum_n in[n] * cos((2n+1) * u * PI / 16)
 */
function dct1d(input: Float64Array, out: Float64Array): void {
  for (let u = 0; u < BLOCK; u++) {
    const cosU = COS[u];
    let sum = 0;
    for (let n = 0; n < BLOCK; n++) sum += input[n] * cosU[n];
    out[u] = 0.5 * C[u] * sum;
  }
}

/**
 * 1D orthonormal inverse DCT-III:
 *   out[n] = 0.5 * sum_u C(u) * in[u] * cos((2n+1) * u * PI / 16)
 */
function idct1d(input: Float64Array, out: Float64Array): void {
  for (let n = 0; n < BLOCK; n++) {
    let sum = 0;
    for (let u = 0; u < BLOCK; u++) sum += C[u] * input[u] * COS[u][n];
    out[n] = 0.5 * sum;
  }
}

/**
 * 2D forward DCT-II, applied separably (rows then columns). Equivalent to
 *   F(u,v) = 1/4 * C(u) C(v) * sum_x sum_y f(x,y) cos((2x+1)u*PI/16) cos((2y+1)v*PI/16)
 * but ~4x cheaper because each pass is 1D.
 * Index convention: value at (row y, column x) lives at y * 8 + x;
 * coefficient at (v, u) lives at v * 8 + u.
 */
export function forwardDCT(block: ArrayLike<number>): Matrix {
  const rows = makeMatrix();
  const rowIn = new Float64Array(BLOCK);
  const rowOut = new Float64Array(BLOCK);

  for (let y = 0; y < BLOCK; y++) {
    for (let x = 0; x < BLOCK; x++) rowIn[x] = block[y * BLOCK + x];
    dct1d(rowIn, rowOut);
    for (let u = 0; u < BLOCK; u++) rows[y * BLOCK + u] = rowOut[u];
  }

  const out = makeMatrix();
  for (let u = 0; u < BLOCK; u++) {
    for (let y = 0; y < BLOCK; y++) rowIn[y] = rows[y * BLOCK + u];
    dct1d(rowIn, rowOut);
    for (let v = 0; v < BLOCK; v++) out[v * BLOCK + u] = rowOut[v];
  }
  return out;
}

/** 2D inverse DCT, separable (columns then rows) — the exact inverse of forwardDCT. */
export function inverseDCT(coeffs: ArrayLike<number>): Matrix {
  const cols = makeMatrix();
  const colIn = new Float64Array(BLOCK);
  const colOut = new Float64Array(BLOCK);

  for (let u = 0; u < BLOCK; u++) {
    for (let v = 0; v < BLOCK; v++) colIn[v] = coeffs[v * BLOCK + u];
    idct1d(colIn, colOut);
    for (let y = 0; y < BLOCK; y++) cols[y * BLOCK + u] = colOut[y];
  }

  const out = makeMatrix();
  for (let y = 0; y < BLOCK; y++) {
    for (let x = 0; x < BLOCK; x++) colIn[x] = cols[y * BLOCK + x];
    idct1d(colIn, colOut);
    for (let x = 0; x < BLOCK; x++) out[y * BLOCK + x] = colOut[x];
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Quantization
 * ------------------------------------------------------------------ */

/** Quantized(u,v) = round(DCT(u,v) / QuantTable(u,v)). */
export function quantize(coeffs: ArrayLike<number>, table: ArrayLike<number>): Matrix {
  const out = makeMatrix();
  for (let i = 0; i < BLOCK_AREA; i++) {
    out[i] = Math.round(coeffs[i] / table[i]);
  }
  return out;
}

/** Dequantized(u,v) = Quantized(u,v) * QuantTable(u,v). */
export function dequantize(quantized: ArrayLike<number>, table: ArrayLike<number>): Matrix {
  const out = makeMatrix();
  for (let i = 0; i < BLOCK_AREA; i++) out[i] = quantized[i] * table[i];
  return out;
}

/* ------------------------------------------------------------------ *
 * Single-block pipeline
 * ------------------------------------------------------------------ */

export type BlockPipeline = {
  /** Raw 0..255 pixel values of the block (row-major). */
  pixels: number[];
  /** Level-shifted values (-128..127). */
  shifted: Float64Array;
  /** Real DCT coefficients. */
  coefficients: Matrix;
  /** Rounding of coefficients / quantization table. */
  quantized: Matrix;
  /** Quantized values multiplied back by the table. */
  dequantized: Matrix;
  /** Reconstructed 0..255 pixel values after IDCT + unshift + round + clamp. */
  reconstructed: number[];
  /** reconstructed(x,y) - pixels(x,y). */
  difference: number[];
};

function clampByte(value: number): number {
  const v = Math.round(value);
  if (v < 0) return 0;
  if (v > 255) return 255;
  return v;
}

/**
 * Run the complete transform pipeline on a single 8x8 block of pixel values.
 * Every value returned is derived from real arithmetic — nothing is simulated.
 */
export function processBlock(
  pixels: ArrayLike<number>,
  table: ArrayLike<number>,
): BlockPipeline {
  const shifted = levelShift(pixels);
  const coefficients = forwardDCT(shifted);
  const quantized = quantize(coefficients, table);
  const dequantized = dequantize(quantized, table);
  const idct = inverseDCT(dequantized);
  const unshifted = levelUnshift(idct);

  const pixelArr = new Array<number>(BLOCK_AREA);
  const reconArr = new Array<number>(BLOCK_AREA);
  const diffArr = new Array<number>(BLOCK_AREA);

  for (let i = 0; i < BLOCK_AREA; i++) {
    const original = clampByte(pixels[i]);
    const reconstruction = clampByte(unshifted[i]);
    pixelArr[i] = original;
    reconArr[i] = reconstruction;
    diffArr[i] = reconstruction - original;
  }

  return {
    pixels: pixelArr,
    shifted,
    coefficients,
    quantized,
    dequantized,
    reconstructed: reconArr,
    difference: diffArr,
  };
}

/* ------------------------------------------------------------------ *
 * Block extraction
 * ------------------------------------------------------------------ */

/**
 * Copy the 8x8 block at grid position (bx, by) out of a row-major grayscale
 * image of the given width. Images are 8px-aligned so no bounds clipping is
 * needed, but we clamp reads as a safety net.
 */
export function extractBlock(
  gray: ArrayLike<number>,
  width: number,
  bx: number,
  by: number,
): Float64Array {
  const out = new Float64Array(BLOCK_AREA);
  for (let y = 0; y < BLOCK; y++) {
    const row = (by * BLOCK + y) * width + bx * BLOCK;
    for (let x = 0; x < BLOCK; x++) {
      const idx = row + x;
      out[y * BLOCK + x] = idx >= 0 && idx < gray.length ? gray[idx] : 0;
    }
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Full-image reconstruction
 * ------------------------------------------------------------------ */

/** Two-pass reconstruction of an 8x8-aligned grayscale image. */
export function reconstructGrayscale(
  gray: ArrayLike<number>,
  width: number,
  height: number,
  table: ArrayLike<number>,
): Float64Array {
  const out = new Float64Array(width * height);
  const blockIn = new Float64Array(BLOCK_AREA);
  const cols = Math.floor(width / BLOCK);
  const rows = Math.floor(height / BLOCK);

  for (let by = 0; by < rows; by++) {
    for (let bx = 0; bx < cols; bx++) {
      const x0 = bx * BLOCK;
      const y0 = by * BLOCK;

      for (let y = 0; y < BLOCK; y++) {
        const src = (y0 + y) * width + x0;
        const dst = y * BLOCK;
        for (let x = 0; x < BLOCK; x++) blockIn[dst + x] = gray[src + x];
      }

      const shifted = levelShift(blockIn);
      const coeffs = forwardDCT(shifted);
      const q = quantize(coeffs, table);
      const dq = dequantize(q, table);
      const idct = inverseDCT(dq);
      const unshifted = levelUnshift(idct);

      for (let y = 0; y < BLOCK; y++) {
        const dstRow = (y0 + y) * width + x0;
        const srcRow = y * BLOCK;
        // Round and clamp to valid 8-bit samples, matching the block pipeline.
        for (let x = 0; x < BLOCK; x++) out[dstRow + x] = clampByte(unshifted[srcRow + x]);
      }
    }
  }
  return out;
}

/**
 * Absolute per-pixel difference between two same-sized grayscale buffers.
 * Returns signed values (reconstructed - original) so callers can choose how
 * to map them to intensity.
 */
export function signedDifference(
  original: ArrayLike<number>,
  reconstructed: ArrayLike<number>,
): Float64Array {
  const out = new Float64Array(original.length);
  for (let i = 0; i < original.length; i++) out[i] = reconstructed[i] - original[i];
  return out;
}

/**
 * Statistics of the reconstruction error for a whole image:
 * mean absolute error, peak absolute error and PSNR in dB.
 */
export type ErrorStats = {
  mae: number;
  max: number;
  rmse: number;
  psnr: number;
};

export function errorStats(
  original: ArrayLike<number>,
  reconstructed: ArrayLike<number>,
): ErrorStats {
  let sumAbs = 0;
  let sumSq = 0;
  let max = 0;
  const n = original.length;
  for (let i = 0; i < n; i++) {
    const d = Math.abs(reconstructed[i] - original[i]);
    sumAbs += d;
    sumSq += d * d;
    if (d > max) max = d;
  }
  const mae = n ? sumAbs / n : 0;
  const rmse = n ? Math.sqrt(sumSq / n) : 0;
  const psnr = rmse > 0 ? 20 * Math.log10(255 / rmse) : Infinity;
  return { mae, max, rmse, psnr };
}

/* ------------------------------------------------------------------ *
 * Frequency classification (for the UI / explanations only)
 * ------------------------------------------------------------------ */

export type FrequencyClass = 'DC' | 'LOW' | 'MID' | 'HIGH';

/** Classify a coefficient by its position (u = horizontal, v = vertical). */
export function frequencyClass(u: number, v: number): FrequencyClass {
  if (u === 0 && v === 0) return 'DC';
  const radius = Math.sqrt(u * u + v * v);
  if (radius <= 2) return 'LOW';
  if (radius <= 4.5) return 'MID';
  return 'HIGH';
}
