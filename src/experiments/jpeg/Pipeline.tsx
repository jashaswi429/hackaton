import { cx } from '../../lib/cx';
import type { PipeId } from './types';
import styles from './lab.module.css';

type Stage = { id: PipeId; label: string; note: string };

const STAGES: Stage[] = [
  { id: 'image', label: 'IMAGE', note: 'The source image, read as grayscale samples.' },
  { id: 'blocks', label: 'BLOCKS', note: 'Split into independent 8 x 8 tiles.' },
  { id: 'dct', label: 'DCT', note: 'Each block is rewritten as frequency coefficients.' },
  { id: 'quantize', label: 'QUANTIZE', note: 'Coefficients lose precision based on quality.' },
  { id: 'idct', label: 'IDCT', note: 'Coefficients are turned back into pixels.' },
  { id: 'result', label: 'RESULT', note: 'The rebuilt image — an approximation of the original.' },
];

/**
 * The experiment pipeline: IMAGE → BLOCKS → DCT → QUANTIZE → IDCT → RESULT.
 * Clicking a stage focuses its panel; the active stage is highlighted.
 */
export function Pipeline({
  active,
  onSelect,
}: {
  active: PipeId;
  onSelect: (id: PipeId) => void;
}) {
  const current = STAGES.find((s) => s.id === active) ?? STAGES[0];

  return (
    <div className={styles.pipeline}>
      <div className={cx('container', styles.pipelineInner)}>
        <div className={styles.pipeRow} role="tablist" aria-label="Experiment pipeline">
          {STAGES.map((stage, i) => (
            <span key={stage.id} className={styles.pipeItem}>
              {i > 0 && (
                <span className={styles.pipeArrow} aria-hidden="true">
                  →
                </span>
              )}
              <button
                type="button"
                role="tab"
                aria-selected={active === stage.id}
                className={cx(styles.pipeStage, active === stage.id && styles.pipeStageActive)}
                onClick={() => onSelect(stage.id)}
              >
                {stage.label}
              </button>
            </span>
          ))}
        </div>
        <p className={cx('mono', styles.pipeNote)}>{current.note}</p>
      </div>
    </div>
  );
}
