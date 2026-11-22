/** Shared view-model types for the JPEG Lab UI. */

export type ViewMode = 'original' | 'reconstructed' | 'side-by-side' | 'difference';

export type LabMode = 'guided' | 'explore';

export type TabId = 'pixels' | 'dct' | 'quantize' | 'compare' | 'learn';

/** The six annotated stages of the experiment pipeline. */
export type PipeId = 'image' | 'blocks' | 'dct' | 'quantize' | 'idct' | 'result';

/** A block selected on the 8x8 grid, in block coordinates. */
export type BlockRef = { bx: number; by: number };

/** A coefficient selected inside a block (u = horizontal, v = vertical). */
export type CoeffRef = { u: number; v: number };

/** A cell hovered inside an 8x8 pixel block. */
export type CellRef = { x: number; y: number };
