import { cx } from '../../lib/cx';
import type { DamagePosition, DamageShape } from './types';
import styles from './qrlab.module.css';

type DamageSimulatorProps = {
  amount: number;
  onAmount: (n: number) => void;
  shape: DamageShape;
  onShape: (s: DamageShape) => void;
  position: DamagePosition;
  onPosition: (p: DamagePosition) => void;
  enabled: boolean;
  onToggle: () => void;
  onReseed: () => void;
  onReset: () => void;
  /** Number of modules actually flipped at the current settings. */
  damagedCount: number;
  totalModules: number;
  placing: boolean;
};

const SHAPES: DamageShape[] = ['square', 'circle'];
const POSITIONS: DamagePosition[] = ['center', 'random', 'user'];

/** DAMAGE SIMULATOR — introduce controlled, reproducible damage to the render only. */
export function DamageSimulator({
  amount,
  onAmount,
  shape,
  onShape,
  position,
  onPosition,
  enabled,
  onToggle,
  onReseed,
  onReset,
  damagedCount,
  totalModules,
  placing,
}: DamageSimulatorProps) {
  const pct = totalModules > 0 ? (damagedCount / totalModules) * 100 : 0;

  return (
    <section className={styles.panel} aria-label="Damage simulator">
      <div className={styles.panelHead}>
        <span className={cx('mono', styles.panelTitle)}>DAMAGE SIMULATOR</span>
        <button
          type="button"
          className={cx(styles.ctrl, enabled && styles.ctrlOn)}
          aria-pressed={enabled}
          onClick={onToggle}
        >
          {enabled ? 'DAMAGE: ON' : 'DAMAGE: OFF'}
        </button>
      </div>

      <div className={styles.sliderHead} style={{ marginTop: 14 }}>
        <label className={cx('mono', styles.fieldLabel)} htmlFor="damage-amount">
          AMOUNT
        </label>
        <span className={cx('mono', styles.sliderValue)}>{amount}%</span>
      </div>
      <input
        id="damage-amount"
        className={styles.slider}
        type="range"
        min={0}
        max={60}
        step={1}
        value={amount}
        disabled={!enabled}
        onChange={(e) => onAmount(Number(e.target.value))}
        aria-valuetext={`${amount} percent`}
      />
      <div className={cx('mono', styles.sliderScale)}>
        <span>0%</span>
        <span>{damagedCount} / {totalModules} MODULES ({pct.toFixed(0)}%)</span>
        <span>60%</span>
      </div>

      <div className={styles.field} style={{ marginTop: 14 }}>
        <span className={cx('mono', styles.fieldLabel)}>SHAPE</span>
        <div className={styles.chipRow} role="group" aria-label="Damage shape">
          {SHAPES.map((s) => (
            <button
              key={s}
              type="button"
              className={cx(styles.ctrl, shape === s && styles.ctrlOn)}
              aria-pressed={shape === s}
              disabled={!enabled}
              onClick={() => onShape(s)}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field} style={{ marginTop: 12 }}>
        <span className={cx('mono', styles.fieldLabel)}>POSITION</span>
        <div className={styles.chipRow} role="group" aria-label="Damage position">
          {POSITIONS.map((p) => (
            <button
              key={p}
              type="button"
              className={cx(styles.ctrl, position === p && styles.ctrlOn)}
              aria-pressed={position === p}
              disabled={!enabled}
              onClick={() => onPosition(p)}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
        {position === 'user' && enabled && (
          <p className={cx('mono', styles.infoSub)}>
            {placing ? 'CLICK A MODULE ON THE QR TO PLACE THE DAMAGE CENTRE.' : 'PLACEMENT ACTIVE.'}
          </p>
        )}
      </div>

      <div className={styles.ctrlRow} style={{ marginTop: 14 }}>
        <button type="button" className={styles.ctrl} onClick={onReseed} disabled={!enabled || position !== 'random'}>
          NEW RANDOM SEED
        </button>
        <button type="button" className={styles.ctrl} onClick={onReset}>
          RESET DAMAGE
        </button>
      </div>

      <p className={cx('mono', styles.note)} style={{ marginTop: 14 }}>
        DAMAGE FLIPS MODULES IN THE RENDER ONLY — THE ORIGINAL ENCODED DATA IS NEVER CHANGED.
        ERROR CORRECTION WORKS ON CODEWORDS, NOT RAW PIXEL PERCENTAGES, AND PLACEMENT MATTERS:
        HITTING A FINDER PATTERN CAN BREAK DETECTION EVEN AT LOW DAMAGE.
      </p>
    </section>
  );
}
