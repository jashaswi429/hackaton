import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './Eyebrow.module.css';

/** Small monospace section label with an accent marker. */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cx(styles.eyebrow, className)}>
      <span className={styles.mark} aria-hidden="true" />
      {children}
    </span>
  );
}
