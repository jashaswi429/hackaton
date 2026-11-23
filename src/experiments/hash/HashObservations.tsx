import { cx } from '../../lib/cx';
import styles from './hashlab.module.css';

type HashObservationsProps = {
  observations: string[];
};

/**
 * OBSERVATIONS — short, technically accurate notes derived from the live state.
 * Nothing here is random or pre-written for effect.
 */
export function HashObservations({ observations }: HashObservationsProps) {
  return (
    <section className={styles.panel} aria-label="Observations">
      <div className={styles.panelHead}>
        <span className={cx('mono', styles.panelTitle)}>OBSERVATIONS</span>
        <span className={cx('mono', styles.panelMeta)}>LIVE</span>
      </div>
      <ul className={styles.obsList} style={{ marginTop: 12 }}>
        {observations.map((o) => (
          <li key={o} className={styles.obsItem}>
            <span className={styles.obsMark} aria-hidden="true">
              ▸
            </span>
            {o}
          </li>
        ))}
      </ul>
    </section>
  );
}
