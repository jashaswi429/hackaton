import type { ReactNode } from 'react';
import { GLOSSARY_MAP } from './glossary';
import styles from './lab.module.css';

/**
 * Inline term with a hover/focus tooltip pulled from the glossary.
 * Uses CSS-only visibility so it costs nothing until the reader shows interest.
 */
export function Term({ id, children }: { id: string; children?: ReactNode }) {
  const entry = GLOSSARY_MAP[id];
  if (!entry) return <>{children ?? id}</>;

  return (
    <span className={styles.term} tabIndex={0} aria-label={`${entry.term}: ${entry.short}`}>
      {children ?? entry.term}
      <span className={styles.termTip} role="tooltip">
        <b>{entry.term}</b>
        {entry.short}
      </span>
    </span>
  );
}
