import { cx } from '../../lib/cx';
import { QrMatrix } from './QrMatrix';
import { EC_INFO, type QrMatrix as QrMatrixType } from './qr';
import type { DecodeAttempt } from './DecodePanel';
import type { DamageResult } from './damage';
import type { EcLevel } from './types';
import styles from './qrlab.module.css';

type ComparisonViewProps = {
  matrix: QrMatrixType;
  damaged: DamageResult | null;
  regionMap: Uint8Array;
  ec: EcLevel;
  amount: number;
  decodeAttempts: DecodeAttempt[] | null;
  onResetDamage: () => void;
  onEnableDamage: () => void;
};

const NOOP = () => {};

function DecodeBadge({ attempt }: { attempt: DecodeAttempt | undefined }) {
  if (!attempt) return <span className={cx('mono', styles.badge)}>NOT TESTED</span>;
  if (attempt.result.ok) return <span className={cx('mono', styles.badge, styles.badgeAccent)}>DECODED</span>;
  return (
    <span className={cx('mono', styles.badge, styles.badgeWarn)}>
      {attempt.finderIntact ? 'DECODE FAILED' : 'NOT LOCATED'}
    </span>
  );
}

/** COMPARE tab — the original and the damaged symbol, side by side, plus results. */
export function ComparisonView({
  matrix,
  damaged,
  regionMap,
  ec,
  amount,
  decodeAttempts,
  onResetDamage,
  onEnableDamage,
}: ComparisonViewProps) {
  const originalAttempt = decodeAttempts?.find((a) => a.target === 'original');
  const damagedAttempt = decodeAttempts?.find((a) => a.target === 'damaged');
  const emptyLayers = new Set<never>();

  return (
    <div className={styles.stack}>
      <div className={styles.compareGrid}>
        <figure className={styles.comparePanel}>
          <figcaption className={cx('mono', styles.compareLabel)}>
            ORIGINAL QR
            <DecodeBadge attempt={originalAttempt} />
          </figcaption>
          <QrMatrix
            size={matrix.size}
            display={matrix.modules}
            mask={null}
            regionMap={regionMap}
            layers={emptyLayers as Set<never>}
            selected={null}
            onSelect={NOOP}
            placing={false}
            label="Original QR code"
          />
        </figure>

        <figure className={styles.comparePanel}>
          <figcaption className={cx('mono', styles.compareLabel)}>
            DAMAGED QR
            <DecodeBadge attempt={damagedAttempt} />
          </figcaption>
          {damaged ? (
            <QrMatrix
              size={matrix.size}
              display={damaged.modules}
              mask={damaged.mask}
              regionMap={regionMap}
              layers={emptyLayers as Set<never>}
              selected={null}
              onSelect={NOOP}
              placing={false}
              label="Damaged QR code"
            />
          ) : (
            <div className={styles.stageEmpty}>
              NO DAMAGE APPLIED
              <div style={{ marginTop: 12 }}>
                <button type="button" className={styles.ctrl} onClick={onEnableDamage}>
                  ENABLE DAMAGE
                </button>
              </div>
            </div>
          )}
        </figure>
      </div>

      <div className={styles.compareRow}>
        <div className={styles.compareCell}>
          <span className={cx('mono', styles.compareCellKey)}>DAMAGE AMOUNT</span>
          <span className={styles.compareCellVal}>{damaged ? `${amount}%` : '—'}</span>
        </div>
        <div className={styles.compareCell}>
          <span className={cx('mono', styles.compareCellKey)}>MODULES DAMAGED</span>
          <span className={styles.compareCellVal}>{damaged ? damaged.count : 0}</span>
        </div>
        <div className={styles.compareCell}>
          <span className={cx('mono', styles.compareCellKey)}>ERROR CORRECTION</span>
          <span className={styles.compareCellVal}>{ec} — {EC_INFO[ec].name}</span>
        </div>
        <div className={styles.compareCell}>
          <span className={cx('mono', styles.compareCellKey)}>RESULT</span>
          <span className={styles.compareCellVal}>
            {damagedAttempt
              ? damagedAttempt.result.ok
                ? 'RECOVERED'
                : 'LOST'
              : 'NOT TESTED'}
          </span>
        </div>
      </div>

      <div className={styles.ctrlRow}>
        <button type="button" className={styles.ctrl} onClick={onResetDamage}>
          RESET DAMAGE
        </button>
      </div>

      <p className={cx('mono', styles.note)}>
        THERE IS NO UNIVERSAL "SAFE" DAMAGE PERCENTAGE. ERROR CORRECTION PROTECTS CODEWORDS, NOT
        PIXELS, AND A STRIKE THROUGH A FINDER PATTERN CAN DEFEAT DETECTION EVEN WHEN MUCH OF THE
        CODE IS INTACT.
      </p>
    </div>
  );
}
