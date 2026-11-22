import { Fragment } from 'react';
import { cx } from '../../lib/cx';
import { DIFF_GAIN } from './image';
import type { CellRef } from './types';
import styles from './lab.module.css';

const AXIS = [0, 1, 2, 3, 4, 5, 6, 7];

type PixelMatrixProps = {
  /** 64 pixel samples, row-major (index = y * 8 + x). */
  values: ArrayLike<number>;
  /**
   * `pixel`    — raw 0..255 samples
   * `shifted`  — level-shifted samples, rendered after +128
   * `difference` — signed error, rendered as black (none) → white (large)
   */
  mode: 'pixel' | 'shifted' | 'difference';
  showValues: boolean;
  size?: 'inspector' | 'zoom';
  selected?: CellRef | null;
  hovered?: CellRef | null;
  onHover?: (cell: CellRef | null) => void;
  ariaLabel: string;
};

function inkFor(gray: number): string {
  return gray > 140 ? '#0a0c06' : '#f4f2ec';
}

function backgroundFor(value: number, mode: PixelMatrixProps['mode']): number {
  if (mode === 'pixel') return value;
  if (mode === 'shifted') return value + 128;
  return Math.abs(value) * DIFF_GAIN;
}

/**
 * A literal 8 x 8 pixel grid. Cell backgrounds are the real sample values, so
 * the matrix is an honest picture of the data — never decorative.
 */
export function PixelMatrix({
  values,
  mode,
  showValues,
  size = 'inspector',
  selected,
  hovered,
  onHover,
  ariaLabel,
}: PixelMatrixProps) {
  return (
    <div
      className={cx(styles.matrixGrid, size === 'zoom' && styles.matrixZoom)}
      role="grid"
      aria-label={ariaLabel}
    >
      <div className={styles.axisCell} aria-hidden="true" />
      {AXIS.map((x) => (
        <div key={`cx${x}`} className={styles.axisCell} aria-hidden="true">
          {x}
        </div>
      ))}

      {AXIS.map((y) => (
        <Fragment key={`row${y}`}>
          <div className={styles.axisCell} aria-hidden="true">
            {y}
          </div>
          {AXIS.map((x) => {
            const i = y * 8 + x;
            const value = values[i];
            const gray = Math.max(0, Math.min(255, Math.round(backgroundFor(value, mode))));
            const isSel = selected?.x === x && selected?.y === y;
            const isHover = hovered?.x === x && hovered?.y === y;
            return (
              <div
                key={`c${x}-${y}`}
                role="gridcell"
                className={cx(
                  styles.pixelCell,
                  isSel && styles.cellSelected,
                  isHover && styles.cellHover,
                )}
                style={{ background: `rgb(${gray}, ${gray}, ${gray})`, color: inkFor(gray) }}
                onPointerEnter={() => onHover?.({ x, y })}
                onPointerLeave={() => onHover?.(null)}
                title={`x=${x} y=${y} → ${value}`}
              >
                {showValues ? value : ''}
              </div>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}
