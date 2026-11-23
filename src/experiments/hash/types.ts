/*
 * Shared types for Experiment 003 — The Hash Lab.
 * Kept free of React/DOM so the logic modules stay testable in isolation.
 */

export type LabMode = 'guided' | 'explore';

/** Analysis tabs under the workspace. */
export type HashTab = 'digest' | 'avalanche' | 'work';

/** A single bit selected inside the 256-bit digest. */
export type BitRef = { byte: number; bit: number };

/** Live state of the proof-of-work miner in the WORK panel. */
export type MiningState = {
  running: boolean;
  /** Attempts made so far (or at completion, the nonce that succeeded). */
  attempts: number;
  /** The nonce whose digest hit the target, once found. */
  nonce: number | null;
  /** Hex digest of the successful attempt. */
  digest: string | null;
  /** True once a target-satisfying nonce has been found. */
  done: boolean;
  /** True if the search was stopped before finding a solution. */
  exhausted: boolean;
};
