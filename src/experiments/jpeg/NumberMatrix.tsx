import { Fragment } from 'react';
import { cx } from '../../lib/cx';
import { coeffCell, intensityCell, normalize } from './color';
import type { CoeffRef } from './types';
import styles from './lab.module.css';

const AXIS = [0, 1, 2, 3, 4, 5, 6, 7];

type NumberMatrixProps = {
  /** 64 values, row-major (index = v * 8 + u). */
  values: ArrayLike<number>;
  /** Normalisation maximum for the colour scale. */
  max: number;
  scale: 'coeff' | 'intensity';
  showValues: boolean;
  /** Ring cells whose value is exactly zero (accent the ones compression killed). */
  highlightZero?: boolean;
  selected?: CoeffRef | null;
  hovered?: CoeffRef | null;
  onHover?: (c: CoeffRef | null) => void;
  onSelect?: (c: CoeffRef) => void;
  format?: (value: number) => string;
  ariaLabel: string;
};

/**
 * An 8 x 8 matrix of numbers rendered as a real heatmap.
 * Colour is derived from the actual values; zeros can be flagged to show
 * exactly which coefficients quantization discarded.
 */
export function NumberMatrix({
  values,
  max,
  scale,
  showValues,
  highlightZero = false,
  selected,
  hovered,
  onHover,
  onSelect,
  format,
  ariaLabel,
}: NumberMatrixProps) {
  return (
    <div className={styles.matrixGrid} role="grid" aria-label={ariaLabel}>
      <div className={styles.axisCell} aria-hidden="true" />
      {AXIS.map((u) => (
        <div key={`cu${u}`} className={styles.axisCell} aria-hidden="true">
          {u}
        </div>
      ))}

      {AXIS.map((v) => (
        <Fragment key={`row${v}`}>
          <div className={styles.axisCell} aria-hidden="true">
            {v}
          </div>
          {AXIS.map((u) => {
            const i = v * 8 + u;
            const value = values[i];
            const cell =
              scale === 'coeff' ? coeffCell(value, max) : intensityCell(normalize(value, max));
            const isSel = selected?.u === u && selected?.v === v;
            const isHover = hovered?.u === u && hovered?.v === v;
            const isZero = highlightZero && value === 0;
            return (
              <div
                key={`c${u}-${v}`}
                role="gridcell"
                tabIndex={onSelect ? 0 : undefined}
                className={cx(
                  styles.numCell,
                  isZero && styles.cellZero,
                  isSel && styles.cellSelected,
                  isHover && styles.cellHover,
                )}
                style={cell}
                onPointerEnter={() => onHover?.({ u, v })}
                onPointerLeave={() => onHover?.(null)}
                onClick={() => onSelect?.({ u, v })}
                onKeyDown={(e) => {
                  if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onSelect({ u, v });
                  }
                }}
                title={`u=${u} v=${v} → ${format ? format(value) : value}`}
              >
                {showValues ? (format ? format(value) : value) : ''}
              </div>
            );
          })}
        </Fragment>
      ))}
    </div>
  );
}
