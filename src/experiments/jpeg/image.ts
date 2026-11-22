/*
 * Image ingestion + raster helpers for the JPEG Lab.
 *
 * Everything here runs locally in the browser: images are decoded with the
 * native browser decoder, drawn to an offscreen canvas and read back as
 * grayscale samples. Nothing is ever uploaded anywhere.
 */

/** Longest edge used for the analysis/reconstruction pipeline. */
export const MAX_PROCESS_DIM = 320;

/** Bundled, offline sample image (gradients, textures, edges, fine detail). */
export const SAMPLE_URL = `${import.meta.env.BASE_URL}samples/jpeg-sample.png`;

/** A source image reduced to an 8px-aligned grayscale sampling grid. */
export type GrayImage = {
  width: number;
  height: number;
  /** Grayscale samples 0..255, row-major, length = width * height. */
  data: Float64Array;
  sourceWidth: number;
  sourceHeight: number;
  /** True when the source was downscaled or 8px-aligned for processing. */
  resized: boolean;
};

/** Absolute magnitude gain applied to the difference view (a fixed scale). */
export const DIFF_GAIN = 5;

/**
 * Decode an image from a URL (bundled sample) or a user-provided file/blob.
 * Rejects with a readable message on any decode failure.
 */
export function decodeImage(source: Blob | string): Promise<HTMLImageElement> {
  const isBlob = typeof source !== 'string';
  const url = isBlob ? URL.createObjectURL(source) : source;

  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new Error('That file could not be read as an image.'));
    img.src = url;
  }).finally(() => {
    if (isBlob) URL.revokeObjectURL(url);
  });
}

/** Rec.601 luma, matching the coefficients JPEG uses for its Y channel. */
export function lumaFromRGBA(rgba: Uint8ClampedArray): Float64Array {
  const count = Math.floor(rgba.length / 4);
  const out = new Float64Array(count);
  for (let i = 0, j = 0; i < count; i++, j += 4) {
    out[i] = Math.round(0.299 * rgba[j] + 0.587 * rgba[j + 1] + 0.114 * rgba[j + 2]);
  }
  return out;
}

/**
 * Rasterise an image to an 8px-aligned grayscale grid, downscaling so the
 * longest edge does not exceed `maxDim`. Reports whether resizing happened.
 */
export function prepareGray(
  img: HTMLImageElement,
  maxDim: number = MAX_PROCESS_DIM,
): GrayImage {
  const sw = img.naturalWidth || img.width;
  const sh = img.naturalHeight || img.height;
  if (!sw || !sh) throw new Error('The image has no readable dimensions.');

  const scale = Math.min(1, maxDim / Math.max(sw, sh));
  const w = Math.max(8, Math.floor((sw * scale) / 8) * 8);
  const h = Math.max(8, Math.floor((sh * scale) / 8) * 8);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D is unavailable in this browser.');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  const { data } = ctx.getImageData(0, 0, w, h);
  return {
    width: w,
    height: h,
    data: lumaFromRGBA(data),
    sourceWidth: sw,
    sourceHeight: sh,
    resized: w !== sw || h !== sh,
  };
}

/** Build an ImageData from a grayscale buffer (0..255). */
export function grayToImageData(
  gray: ArrayLike<number>,
  width: number,
  height: number,
): ImageData {
  const image = new ImageData(width, height);
  const d = image.data;
  for (let i = 0, j = 0; i < gray.length; i++, j += 4) {
    const v = Math.max(0, Math.min(255, Math.round(gray[i])));
    d[j] = v;
    d[j + 1] = v;
    d[j + 2] = v;
    d[j + 3] = 255;
  }
  return image;
}

/**
 * Render a difference buffer with a fixed intensity scale: black means no
 * difference, brighter means a larger absolute error. The gain is constant so
 * the same error level always maps to the same brightness.
 */
export function diffToImageData(
  diff: ArrayLike<number>,
  width: number,
  height: number,
  gain: number = DIFF_GAIN,
): ImageData {
  const image = new ImageData(width, height);
  const d = image.data;
  for (let i = 0, j = 0; i < diff.length; i++, j += 4) {
    const v = Math.max(0, Math.min(255, Math.round(Math.abs(diff[i]) * gain)));
    d[j] = v;
    d[j + 1] = v;
    d[j + 2] = v;
    d[j + 3] = 255;
  }
  return image;
}

/** Convenience: number of 8x8 blocks across and down. */
export function blockCount(width: number, height: number) {
  return {
    cols: Math.floor(width / 8),
    rows: Math.floor(height / 8),
  };
}
