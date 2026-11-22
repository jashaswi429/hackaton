/*
 * Decoding — a real, offline QR decoder.
 *
 * The module grid is drawn to an offscreen canvas as pure black/white modules
 * (with the standard four-module quiet zone), then handed to the `jsqr`
 * library, which performs the full detection + error-correction pipeline.
 *
 * The decoder only ever sees rendered pixels — it is never given the original
 * text — so a decode result is genuine evidence, not a lookup.
 */

import jsQR from 'jsqr';

export type DecodeResult =
  | {
      ok: true;
      data: string;
      version: number;
      modes: string[];
    }
  | { ok: false };

const QUIET = 4;
const TARGET_PX = 720;

/** Draw a module grid and attempt to decode it. */
export function decodeModules(modules: Uint8Array, size: number): DecodeResult {
  if (typeof document === 'undefined') return { ok: false };

  const scale = Math.max(3, Math.round(TARGET_PX / (size + QUIET * 2)));
  const dim = (size + QUIET * 2) * scale;

  const canvas = document.createElement('canvas');
  canvas.width = dim;
  canvas.height = dim;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { ok: false };

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, dim, dim);
  ctx.fillStyle = '#000000';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r * size + c]) {
        ctx.fillRect((c + QUIET) * scale, (r + QUIET) * scale, scale, scale);
      }
    }
  }

  const image = ctx.getImageData(0, 0, dim, dim);
  const result = jsQR(image.data, dim, dim, { inversionAttempts: 'attemptBoth' });
  if (!result) return { ok: false };

  const chunks = result.chunks as unknown as Array<{ type?: { name?: string } }>;
  const modes = Array.from(
    new Set(
      chunks
        .map((chunk) => chunk.type?.name)
        .filter((name): name is string => typeof name === 'string'),
    ),
  );

  return { ok: true, data: result.data, version: result.version, modes };
}
