/*
 * Beginner-friendly explanations used both as inline tooltips and as the
 * LEARN panel. Kept short and jargon-light per PRD §15.
 * Purely presentational content — no maths lives here.
 */

export type GlossaryEntry = {
  id: string;
  term: string;
  /** One-line summary shown in tooltips. */
  short: string;
  /** Slightly longer explanation shown in the LEARN panel. */
  body: string;
};

export const GLOSSARY: GlossaryEntry[] = [
  {
    id: 'dct',
    term: 'DCT',
    short: 'The Discrete Cosine Transform — turns pixels into frequency coefficients.',
    body:
      'The DCT rewrites a block of pixels as a mix of wave patterns. Instead of storing 64 pixel values, it stores how much of each wave is present. It rearranges information; by itself it loses nothing.',
  },
  {
    id: 'block',
    term: 'Block',
    short: 'JPEG processes the image in small 8 x 8 squares.',
    body:
      'Compression is applied to 8 x 8 pixel tiles rather than the whole image, so the maths stays small and local. Every tile is transformed, quantized and rebuilt independently.',
  },
  {
    id: 'level-shift',
    term: 'Level shift',
    short: 'Subtracting 128 so pixel values are centred on zero.',
    body:
      'Pixel values run from 0 to 255. Level shifting centres them around zero (−128 to +127) before the transform, which is how JPEG prepares the data for the DCT.',
  },
  {
    id: 'dc',
    term: 'DC coefficient',
    short: "The block's average intensity after level shifting.",
    body:
      'The coefficient at the top-left corner. It carries the overall brightness of the block and usually the largest value. Change it and the whole tile gets lighter or darker.',
  },
  {
    id: 'ac',
    term: 'AC coefficients',
    short: 'All the other coefficients — the detail and pattern information.',
    body:
      'The remaining 63 coefficients describe how the block varies rather than its average level. They encode patterns, textures and edges, and are ordered from coarse to fine.',
  },
  {
    id: 'frequency',
    term: 'Spatial frequency',
    short: 'How fast brightness changes across a block.',
    body:
      'Low frequencies describe slow, broad changes like a smooth gradient. High frequencies describe rapid changes such as fine textures, small details and sharp transitions.',
  },
  {
    id: 'high-frequency',
    term: 'High frequency',
    short: 'Rapid changes: fine textures, small details, sharp transitions.',
    body:
      'Rapid changes in an image, such as fine textures, small details and sharp transitions. These live in the bottom-right of the coefficient grid and are the first thing compression discards.',
  },
  {
    id: 'quantization',
    term: 'Quantization',
    short: 'Reducing numerical precision to throw information away.',
    body:
      'Reducing numerical precision. JPEG uses this step to discard information that is generally less noticeable to human vision. Each coefficient is divided by a quantization value and rounded to a whole number, so small differences disappear.',
  },
  {
    id: 'quant-table',
    term: 'Quantization table',
    short: 'The grid of divisors that decides how much precision each frequency keeps.',
    body:
      'A grid of 64 divisors, one per coefficient. Small divisors (top-left) preserve precision; large divisors (bottom-right) crush high frequencies towards zero. The quality setting scales this whole table.',
  },
  {
    id: 'reconstruction',
    term: 'Reconstruction',
    short: 'Rebuilding the image from the quantized coefficients.',
    body:
      'The quantized coefficients are multiplied back by the table and passed through the inverse DCT to recreate pixels. Because precision was discarded, the rebuilt block is a close approximation of the original — never identical.',
  },
  {
    id: 'artifacts',
    term: 'Compression artifacts',
    short: 'The visible traces left behind by discarded information.',
    body:
      'Because every block is compressed separately, errors show up as blocky seams, smeared detail and ringing around edges. Lower quality means larger, more visible artifacts.',
  },
];

export const GLOSSARY_MAP: Record<string, GlossaryEntry> = Object.fromEntries(
  GLOSSARY.map((entry) => [entry.id, entry]),
);
