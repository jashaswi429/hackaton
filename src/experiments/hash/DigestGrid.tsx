import { useMemo, useState } from 'react';
import { cx } from '../../lib/cx';
import type { BitRef } from './types';
import styles from './hashlab.module.css';

/*
 * DigestGrid — the visualization centrepiece.
 *
 * A SHA-256 digest is exactly 256 bits, so the grid is fixed: 32 bytes of
 * eight bits, wrapped four bytes to a line. Each module is one bit and can be
 * hovered and selected. In "diff" mode the same layout is reused to show which
 * bits changed between two digests.
 */

const BYTES = 32;
const BITS = 8;
const BYTES_PER_ROW = 4;
const ROWS = BYTES / BYTES_PER_ROW; // 8

const CELL = 1;
const BYTE_GAP = 0.6;
const ROW_GAP = 0.7;

const GRID_W = BYTES_PER_ROW * (BITS * CELL + BYTE_GAP) - BYTE_GAP;
const GRID_H = ROWS * (CELL + ROW_GAP) - ROW_GAP;
const AXIS_W = 3;
const PAD = 0.3;

const VIEW_W = AXIS_W + GRID_W + PAD * 2;
const VIEW_H = GRID_H + PAD * 2;

type Cell = { i: number; x: number; y: number; byte: number; bit: number };

function buildCells(): Cell[] {
  const cells: Cell[] = [];
  for (let i = 0; i < BYTES * BITS; i++) {
    const row = Math.floor(i / (BYTES_PER_ROW * BITS));
    const col = i % (BYTES_PER_ROW * BITS);
    const byteInRow = Math.floor(col / BITS);
    const bitInByte = col % BITS;
    const x = PAD + AXIS_W + byteInRow * (BITS * CELL + BYTE_GAP) + bitInByte * CELL;
    const y = PAD + row * (CELL + ROW_GAP);
    cells.push({ i, x, y, byte: i >> 3, bit: i & 7 });
  }
  return cells;
}

const CELLS = buildCells();

type DigestGridProps = {
  /** 256 bits, one 0/1 per module (MSB-first within each byte). */
  bits: Uint8Array;
  /** When present, colour by difference instead of value (1 = changed). */
  diff?: Uint8Array | null;
  selected: BitRef | null;
  onSelect: (b: BitRef) => void;
  label: string;
};

export function DigestGrid({ bits, diff, selected, onSelect, label }: DigestGridProps) {
  const [hover, setHover] = useState<number | null>(null);

  const selectedIndex = useMemo(
    () => (selected ? selected.byte * BITS + selected.bit : -1),
    [selected],
  );

  const rowLabel = (row: number) => String(row * BYTES_PER_ROW).padStart(2, '0');

  return (
    <svg
      className={cx('mono', styles.dgSvg)}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label={label}
      onPointerLeave={() => setHover(null)}
    >
      {Array.from({ length: ROWS }, (_, row) => (
        <text
          key={row}
          className={styles.dgAxis}
          x={PAD}
          y={PAD + row * (CELL + ROW_GAP) + CELL * 0.78}
        >
          {rowLabel(row)}
        </text>
      ))}

      {CELLS.map((c) => {
        const isDiff = diff ? diff[c.i] === 1 : null;
        const cellClass =
          diff !== undefined && diff !== null
            ? isDiff
              ? styles.dgBitDiff
              : styles.dgBitSame
            : bits[c.i]
              ? styles.dgBit1
              : styles.dgBit0;
        return (
          <rect
            key={c.i}
            className={cellClass}
            x={c.x}
            y={c.y}
            width={CELL}
            height={CELL}
            rx={0.12}
            onPointerEnter={() => setHover(c.i)}
            onClick={() => onSelect({ byte: c.byte, bit: c.bit })}
          />
        );
      })}

      {hover !== null && (
        <rect
          className={styles.dgHover}
          x={CELLS[hover].x - 0.12}
          y={CELLS[hover].y - 0.12}
          width={CELL + 0.24}
          height={CELL + 0.24}
          rx={0.18}
        />
      )}

      {selectedIndex >= 0 && (
        <rect
          className={styles.dgSel}
          x={CELLS[selectedIndex].x - 0.14}
          y={CELLS[selectedIndex].y - 0.14}
          width={CELL + 0.28}
          height={CELL + 0.28}
          rx={0.2}
        />
      )}
    </svg>
  );
}
