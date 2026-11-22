/*
 * Shared types for Experiment 002 — The QR Lab.
 * Kept free of React/DOM so the logic modules stay testable in isolation.
 */

export type LabMode = 'guided' | 'explore';

/** Analysis tabs under the workspace. */
export type QrTab = 'structure' | 'encoding' | 'correction' | 'compare';

/** Overlay layers the STRUCTURE explorer can toggle. */
export type RegionLayer =
  | 'finder'
  | 'alignment'
  | 'timing'
  | 'format'
  | 'version'
  | 'data'
  | 'ec';

export type EcLevel = 'L' | 'M' | 'Q' | 'H';

export type QrMode = 'Numeric' | 'Alphanumeric' | 'Byte';

export type DamageShape = 'square' | 'circle';

export type DamagePosition = 'center' | 'random' | 'user';

export type ModuleRef = { row: number; col: number };
