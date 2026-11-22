import { Button } from './ui/Button';
import { cx } from '../lib/cx';
import styles from './ExperimentCard.module.css';

export type ExperimentCardProps = {
  number: string;
  title: string;
  description: string;
  category: string;
  status: string;
  /** When false the card is a placeholder: the launch control is disabled. */
  available: boolean;
  /** Route to the experiment. When set and available, Launch becomes a real link. */
  href?: string;
  /** Optional small caption under the control (e.g. an extra status hint). */
  note?: string;
};

/**
 * A single entry in the lab index.
 * Reusable across future experiments — content is entirely prop-driven so
 * a later PRD only needs to add data, not touch this component's structure.
 */
export function ExperimentCard({
  number,
  title,
  description,
  category,
  status,
  available,
  href,
  note,
}: ExperimentCardProps) {
  return (
    <article
      className={styles.card}
      aria-label={`${number} — ${title}`}
    >
      <div className={styles.preview}>
        <div className={styles.grid} aria-hidden="true" />
        <span className={cx('mono', styles.previewLabel)}>
          {available ? 'PREVIEW — READY' : 'PREVIEW — PENDING'}
        </span>
      </div>

      <div className={styles.meta}>
        <span className={cx('mono', styles.number)}>{number}</span>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.desc}>{description}</p>
        <span className={cx('mono', styles.category)}>{category}</span>
      </div>

      <div className={styles.action}>
        <span className={styles.status}>
          <span className={styles.dot} aria-hidden="true" />
          {status}
        </span>

        <Button
          variant={available ? 'primary' : 'ghost'}
          href={available ? href : undefined}
          disabled={!available}
          title={available ? undefined : 'Not yet available'}
          ariaLabel={available ? undefined : `${title} is not yet available`}
        >
          OPEN EXPERIMENT <span aria-hidden="true">↗</span>
        </Button>

        {note && <span className={cx('mono', styles.note)}>{note}</span>}
      </div>
    </article>
  );
}
