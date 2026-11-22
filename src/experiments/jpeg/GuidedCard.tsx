import { cx } from '../../lib/cx';
import type { GuidedStep } from './guided';
import styles from './lab.module.css';

type GuidedCardProps = {
  step: GuidedStep;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
  onExit: () => void;
};

/**
 * The guided tutorial card. Deliberately a side panel rather than a modal so
 * the experiment stays fully interactive while the tour is running.
 */
export function GuidedCard({
  step,
  index,
  total,
  onPrev,
  onNext,
  onSkip,
  onExit,
}: GuidedCardProps) {
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <aside className={styles.guidedCard} aria-label="Guided tutorial">
      <div className={styles.guidedHead}>
        <span className={cx('mono', styles.guidedStep)}>
          STEP {step.n} / {String(total).padStart(2, '0')}
        </span>
        <button type="button" className={styles.guidedExit} onClick={onExit}>
          EXIT GUIDED
        </button>
      </div>

      <div className={styles.guidedDots} aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cx(styles.guidedDot, i <= index && styles.guidedDotOn, i === index && styles.guidedDotNow)}
          />
        ))}
      </div>

      <h3 className={styles.guidedTitle}>{step.title}</h3>
      <p className={styles.guidedBody}>{step.body}</p>
      <p className={cx('mono', styles.guidedHint)}>{step.hint}</p>

      <div className={styles.guidedNav}>
        <button
          type="button"
          className={styles.ctrl}
          onClick={onPrev}
          disabled={isFirst}
        >
          ← PREVIOUS
        </button>
        {!isLast ? (
          <button type="button" className={cx(styles.ctrl, styles.ctrlPrimary)} onClick={onNext}>
            NEXT →
          </button>
        ) : (
          <button type="button" className={cx(styles.ctrl, styles.ctrlPrimary)} onClick={onExit}>
            EXPLORE FREELY →
          </button>
        )}
        {!isLast && (
          <button type="button" className={styles.guidedSkip} onClick={onSkip}>
            SKIP
          </button>
        )}
      </div>
    </aside>
  );
}
