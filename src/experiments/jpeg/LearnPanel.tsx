import { cx } from '../../lib/cx';
import { GLOSSARY } from './glossary';
import styles from './lab.module.css';

/** LEARN panel: the full glossary as compact, scannable cards. */
export function LearnPanel() {
  return (
    <div className={styles.stack}>
      <div className={styles.panelHead}>
        <h2 className={cx('mono', styles.panelTitle)}>HOW IT WORKS</h2>
        <span className={cx('mono', styles.muted)}>BEGINNER-FRIENDLY NOTES</span>
      </div>

      <div className={styles.glossary}>
        {GLOSSARY.map((entry) => (
          <article key={entry.id} className={styles.glossaryItem}>
            <h3 className={cx('mono', styles.glossaryTerm)}>{entry.term}</h3>
            <p className={styles.glossaryShort}>{entry.short}</p>
            <p className={styles.glossaryBody}>{entry.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
