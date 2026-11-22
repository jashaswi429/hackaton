import { useMemo, useState } from 'react';
import { cx } from '../../lib/cx';
import { frequencyClass } from './math';
import { NumberMatrix } from './NumberMatrix';
import { Term } from './Term';
import type { CoeffRef } from './types';
import styles from './lab.module.css';

const CLASS_TEXT: Record<string, string> = {
  DC: "The block's average intensity after level shifting.",
  LOW: 'Low frequency — broad, smooth changes across the block.',
  MID: 'Mid frequency — texture and moderate detail.',
  HIGH: 'High frequency — fine detail, sharp edges and rapid change.',
};

type DctPanelProps = {
  coefficients: Float64Array;
  selected: CoeffRef;
  onSelect: (c: CoeffRef) => void;
  showValues: boolean;
  onToggleValues: () => void;
};

/** DCT coefficient visualisation: a real heatmap plus a per-coefficient readout. */
export function DctPanel({
  coefficients,
  selected,
  onSelect,
  showValues,
  onToggleValues,
}: DctPanelProps) {
  const [hovered, setHovered] = useState<CoeffRef | null>(null);

  const maxAbs = useMemo(() => {
    let m = 0;
    for (let i = 0; i < coefficients.length; i++) m = Math.max(m, Math.abs(coefficients[i]));
    return m;
  }, [coefficients]);

  const focus = hovered ?? selected;
  const value = coefficients[focus.v * 8 + focus.u];
  const cls = frequencyClass(focus.u, focus.v);

  return (
    <div className={styles.stack}>
      <div className={styles.panelHead}>
        <h2 className={cx('mono', styles.panelTitle)}>DCT COEFFICIENTS</h2>
        <button
          type="button"
          className={cx(styles.ctrl, showValues && styles.ctrlOn)}
          aria-pressed={showValues}
          onClick={onToggleValues}
        >
          SHOW VALUES
        </button>
      </div>

      <div className={styles.matrixBox}>
        <NumberMatrix
          values={coefficients}
          max={maxAbs}
          scale="coeff"
          showValues={showValues}
          selected={selected}
          hovered={hovered}
          onHover={setHovered}
          onSelect={onSelect}
          format={(v) => v.toFixed(1)}
          ariaLabel="DCT coefficient matrix for the selected block"
        />
        <div className={styles.legendRow}>
          <span className={cx('mono', styles.legendLeft)}>LOW FREQUENCY · [0,0] = DC</span>
          <span className={styles.coeffLegend} aria-hidden="true" />
          <span className={cx('mono', styles.legendRight)}>HIGH FREQUENCY</span>
        </div>
      </div>

      <div className={styles.detailCard}>
        <div className={styles.detailHead}>
          <span className={cx('mono', styles.detailCoord)}>
            U:{focus.u} V:{focus.v}
          </span>
          <span className={cx('mono', styles.detailClass)}>{cls}</span>
        </div>
        <div className={styles.detailGrid}>
          <span className={styles.detailKey}>VALUE</span>
          <span className={cx('mono', styles.detailVal)}>{value.toFixed(3)}</span>
          <span className={styles.detailKey}>MAGNITUDE</span>
          <span className={cx('mono', styles.detailVal)}>{Math.abs(value).toFixed(3)}</span>
        </div>
        <p className={styles.detailNote}>
          {cls === 'HIGH' ? <Term id="high-frequency">HIGH FREQUENCY</Term> : null}
          {cls === 'DC' ? <Term id="dc">DC COEFFICIENT</Term> : null}
          {cls === 'LOW' || cls === 'MID' ? <Term id="ac">AC COEFFICIENT</Term> : null}
          {' — '}
          {CLASS_TEXT[cls]}
        </p>
      </div>

      <p className={styles.explain}>
        <Term id="dct">DCT</Term> rewrites the block as a mix of wave patterns. The
        top-left holds the average and the slowest changes; the bottom-right holds
        the fastest, finest detail.
      </p>
    </div>
  );
}
