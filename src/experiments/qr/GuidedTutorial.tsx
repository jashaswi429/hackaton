import { cx } from '../../lib/cx';
import { GUIDED_END, type GuidedStep } from './guided';
import styles from './qrlab.module.css';

type GuidedTutorialProps = {
  step: GuidedStep;
  index: number;
  total: number;
  /** True once the learner has performed this step's interaction. */
  completed: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSkip: () => void;
  onExit: () => void;
};

/**
 * The non-blocking guided tour. It reads live lab state to confirm whether the
 * learner has actually performed each action, but never blocks navigation.
 */
export function GuidedTutorial({
  step,
  index,
  total,
  completed,
  onPrev,
  onNext,
  onSkip,
  onExit,
}: GuidedTutorialProps) {
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <aside className={styles.guidedCard} aria-label="Guided tutorial">
      <div className={styles.guidedHead}>
        <span className={cx('mono', styles.guidedStep)}>
          GUIDED {step.n} / {String(total).padStart(2, '0')}
        </span>
        <button type="button" className={styles.guidedExit} onClick={onExit}>
          EXIT GUIDED
        </button>
      </div>

      <div className={styles.guidedDots} aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={cx(
              styles.guidedDot,
              i < index && styles.guidedDotOn,
              i === index && styles.guidedDotNow,
            )}
          />
        ))}
      </div>

      <h3 className={styles.guidedTitle}>{step.title}</h3>
      <p className={styles.guidedBody}>{step.body}</p>

      <p className={cx('mono', styles.guidedAction, completed && styles.guidedActionDone)}>
        <span aria-hidden="true">{completed ? '✓' : '→'}</span>
        {step.action}
      </p>

      <div className={styles.guidedNav}>
        <button type="button" className={styles.ctrl} onClick={onPrev} disabled={isFirst}>
          ← PREVIOUS
        </button>
        {!isLast ? (
          <button type="button" className={cx(styles.ctrl, styles.ctrlPrimary)} onClick={onNext}>
            NEXT →
          </button>
        ) : (
          <button type="button" className={cx(styles.ctrl, styles.ctrlPrimary)} onClick={onExit}>
            ENTER EXPLORE MODE
          </button>
        )}
        {!isLast && (
          <button type="button" className={styles.guidedSkip} onClick={onSkip}>
            SKIP
          </button>
        )}
      </div>

      {isLast && (
        <p className={cx('mono', styles.guidedEnd)}>
          {GUIDED_END}
        </p>
      )}
    </aside>
  );
}
