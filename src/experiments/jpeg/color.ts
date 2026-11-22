/*
 * Heatmap colour helpers for the coefficient / quantization matrices.
 * Values are mapped to background colours with an automatically chosen
 * foreground ink so numbers stay readable — the scale itself is data-driven.
 */

type RGB = [number, number, number];

const PANEL: RGB = [21, 24, 27];
const ACCENT: RGB = [198, 255, 85];
const COOL: RGB = [72, 164, 198];

function mix(a: RGB, b: RGB, t: number): RGB {
  const k = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
  ];
}

function ink(rgb: RGB): string {
  // Perceptual luminance — pick dark ink on bright cells, light ink otherwise.
  const luminance = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  return luminance > 0.62 ? '#0a0c06' : '#f4f2ec';
}

export type CellStyle = { background: string; color: string };

/**
 * Signed coefficient scale: negative values cool, positive values accent,
 * near-zero values blend into the panel. `maxAbs` is the largest absolute
 * coefficient in the matrix so the strongest cell is always full colour.
 */
export function coeffCell(value: number, maxAbs: number): CellStyle {
  const amp = maxAbs > 1e-9 ? Math.min(1, Math.abs(value) / maxAbs) : 0;
  const t = Math.sqrt(amp); // sqrt keeps small coefficients visible
  const target = value < 0 ? COOL : ACCENT;
  const rgb = mix(PANEL, target, value === 0 ? 0 : 0.85 * t + 0.15);
  return { background: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`, color: ink(rgb) };
}

/** Single-hue intensity scale where `t` in 0..1 maps panel -> accent. */
export function intensityCell(t: number): CellStyle {
  const rgb = mix(PANEL, ACCENT, t);
  return { background: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`, color: ink(rgb) };
}

/** Normalise a positive value into 0..1 using a maximum (guard against 0). */
export function normalize(value: number, max: number): number {
  if (!(max > 0)) return 0;
  return Math.max(0, Math.min(1, value / max));
}
