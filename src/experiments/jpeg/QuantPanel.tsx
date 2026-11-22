import { useMemo, useState } from 'react';
import { cx } from '../../lib/cx';
import { NumberMatrix } from './NumberMatrix';
import { Term } from './Term';
import { frequencyClass } from './math';
import type { CoeffRef } from './types';
import styles from './lab.module.css';

type QuantPanelProps = {
  table: Float64Array;
  coefficients: Float64Array;
  quantized: Float64Array;
  dequantized: Float64Array;
  selected: CoeffRef;
  onSelect: (c: CoeffRef) => void;
  showValues: boolean;
  onToggleValues: () => void;
  highlightZeros: boolean;
  onToggleZeros: () => void;
};

/** The quantization lab — the quant table and the coefficient matrices. */
export function QuantPanel({
  table,
  coefficients,
  quantized,
  dequantized,
  selected,
  onSelect,
  showValues,
  onToggleValues,
  highlightZeros,
  onToggleZeros,
}: QuantPanelProps) {
  const [hovered, setHovered] = useState<CoeffRef | null>(null);

  const maxCoeff = useMemo(
    () => coefficients.reduce((m, v) => Math.max(m, Math.abs(v)), 0),
    [coefficients],
  );
  const maxQuant = useMemo(
    () => quantized.reduce((m, v) => Math.max(m, Math.abs(v)), 0),
    [quantized],
  );
  const zeros = useMemo(() => quantized.filter((v) => v === 0).length, [quantized]);

  const i = selected.v * 8 + selected.u;
  const coeffValue = coefficients[i];
  const step = table[i];
  const q = quantized[i];
  const dq = dequantized[i];
  const cls = frequencyClass(selected.u, selected.v);

  return (
    <div className={styles.stack}>
      <div className={styles.relationCard}>
        <span className={cx('mono', styles.relationTitle)}>
          SELECTED COEFFICIENT · U:{selected.u} V:{selected.v} · {cls}
        </span>
        <div className={styles.relationRow}>
          <span className={cx('mono', styles.relVal)}>{coeffValue.toFixed(2)}</span>
          <span className={styles.relOp}>÷</span>
          <span className={cx('mono', styles.relVal)}>{step}</span>
          <span className={styles.relOp}>→</span>
          <span className={cx('mono', styles.relVal, styles.relResult)}>{q}</span>
          <span className={styles.relOp}>×</span>
          <span className={cx('mono', styles.relVal)}>{step}</span>
          <span className={styles.relOp}>=</span>
          <span className={cx('mono', styles.relVal)}>{dq.toFixed(2)}</span>
        </div>
        <p className={cx('mono', styles.relationNote)}>
          DCT ÷ QUANT → QUANTIZED · QUANTIZED × QUANT → DEQUANTIZED
          {q === 0 ? '  ·  THIS COEFFICIENT WAS ZEROED' : ''}
        </p>
      </div>

      <div className={styles.ctrlRow}>
        <button
          type="button"
          className={cx(styles.ctrl, showValues && styles.ctrlOn)}
          aria-pressed={showValues}
          onClick={onToggleValues}
        >
          SHOW VALUES
        </button>
        <button
          type="button"
          className={cx(styles.ctrl, highlightZeros && styles.ctrlOn)}
          aria-pressed={highlightZeros}
          onClick={onToggleZeros}
        >
          HIGHLIGHT ZEROS
        </button>
        <span className={cx('mono', styles.muted)}>{zeros} / 64 ZEROED</span>
      </div>

      <div className={styles.matrixTrio}>
        <div className={styles.matrixBox}>
          <span className={cx('mono', styles.matrixLabel)}>
            <Term id="quant-table">QUANT TABLE</Term> · 1–255
          </span>
          <NumberMatrix
            values={table}
            max={255}
            scale="intensity"
            showValues={showValues}
            selected={selected}
            hovered={hovered}
            onHover={setHovered}
            onSelect={onSelect}
            format={(v) => String(v)}
            ariaLabel="Scaled quantization table"
          />
        </div>

        <div className={styles.matrixBox}>
          <span className={cx('mono', styles.matrixLabel)}>DCT COEFFICIENTS</span>
          <NumberMatrix
            values={coefficients}
            max={maxCoeff}
            scale="coeff"
            showValues={showValues}
            highlightZero={highlightZeros}
            selected={selected}
            hovered={hovered}
            onHover={setHovered}
            onSelect={onSelect}
            format={(v) => v.toFixed(1)}
            ariaLabel="DCT coefficients before quantization"
          />
        </div>

        <div className={styles.matrixBox}>
          <span className={cx('mono', styles.matrixLabel)}>QUANTIZED COEFFICIENTS</span>
          <NumberMatrix
            values={quantized}
            max={maxQuant}
            scale="intensity"
            showValues={showValues}
            highlightZero={highlightZeros}
            selected={selected}
            hovered={hovered}
            onHover={setHovered}
            onSelect={onSelect}
            format={(v) => String(v)}
            ariaLabel="Quantized coefficients"
          />
        </div>
      </div>

      <p className={styles.explain}>
        Every coefficient is divided by its <Term id="quant-table">quantization table</Term>{' '}
        value and rounded to a whole number. Small values round to zero — that is
        the information the image gives up.
      </p>
    </div>
  );
}
