import { cx } from '../../lib/cx';
import { EC_INFO, EC_LEVELS } from './qr';
import type { EcLevel } from './types';
import styles from './qrlab.module.css';

type EcComparison = { level: EcLevel; version: number; size: number; ok: boolean };

type ErrorCorrectionPanelProps = {
  ec: EcLevel;
  onEcChange: (ec: EcLevel) => void;
  comparison: EcComparison[];
};

/**
 * ERROR CORRECTION tab — choose the protection level and see the real cost.
 * Every comparison figure comes from re-encoding the same input at each level.
 */
export function ErrorCorrectionPanel({ ec, onEcChange, comparison }: ErrorCorrectionPanelProps) {
  const byLevel = new Map(comparison.map((c) => [c.level, c]));
  const current = byLevel.get(ec);

  return (
    <div className={styles.stack}>
      <p className={styles.explain}>
        QR codes carry <b>redundant</b> information so a scanner can rebuild missing
        parts. A higher level of error correction recovers more damage, but every
        parity codeword takes space that could hold your data — so the symbol may
        need a <b>larger version</b> for the same message.
      </p>

      <div className={styles.ecGrid} role="radiogroup" aria-label="Error correction level">
        {EC_LEVELS.map((level) => {
          const info = EC_INFO[level];
          const row = byLevel.get(level);
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={ec === level}
              className={cx(styles.ecCard, ec === level && styles.ecCardOn)}
              onClick={() => onEcChange(level)}
            >
              <span className={styles.ecLevel}>{level}</span>
              <span className={cx('mono', styles.ecName)}>{info.name}</span>
              <span className={styles.ecTag}>{info.tagline}</span>
              <span className={cx('mono', styles.ecRedundancy)}>{info.redundancy}</span>
              <span className={cx('mono', styles.ecRedundancy)}>
                {row?.ok ? `VERSION ${row.version} · ${row.size}×${row.size}` : 'DOES NOT FIT'}
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.compareRow}>
        <div className={styles.compareCell}>
          <span className={cx('mono', styles.compareCellKey)}>SELECTED LEVEL</span>
          <span className={styles.compareCellVal}>{ec} — {EC_INFO[ec].name}</span>
        </div>
        <div className={styles.compareCell}>
          <span className={cx('mono', styles.compareCellKey)}>CURRENT VERSION</span>
          <span className={styles.compareCellVal}>
            {current?.ok ? `${current.version} · ${current.size}×${current.size}` : '—'}
          </span>
        </div>
        <div className={styles.compareCell}>
          <span className={cx('mono', styles.compareCellKey)}>REDUNDANCY</span>
          <span className={styles.compareCellVal}>{EC_INFO[ec].redundancy}</span>
        </div>
      </div>

      <div className={styles.flowBody}>
        <span className={cx('mono', styles.flowBodyTitle)}>REED–SOLOMON ERROR CORRECTION</span>
        <p style={{ marginTop: 6 }}>
          The data codewords are split into blocks. For each block, a
          Reed–Solomon algorithm computes parity codewords. Those parity bytes are
          the redundancy: if a scanner cannot read some codewords, the parity lets
          it solve for the missing values — up to a limit set by the level you
          chose. The encoder library performs this computation; the lab never
          fakes it.
        </p>
      </div>

      <p className={cx('mono', styles.note)}>
        THE RECOVERY FIGURES ARE APPROXIMATE CAPACITIES FROM THE QR STANDARD (L≈7%, M≈15%, Q≈25%,
        H≈30% OF CODEWORDS). ACTUAL RECOVERY DEPENDS ON WHERE THE DAMAGE FALLS.
      </p>
    </div>
  );
}
