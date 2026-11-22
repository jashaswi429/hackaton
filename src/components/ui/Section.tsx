import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './Section.module.css';

type SectionProps = {
  id?: string;
  /** `surface` gives a slightly lighter background — used to set Philosophy apart. */
  tone?: 'base' | 'surface';
  className?: string;
  innerClassName?: string;
  labelledBy?: string;
  children: ReactNode;
};

/** Shared section shell: consistent vertical rhythm + centred container. */
export function Section({
  id,
  tone = 'base',
  className,
  innerClassName,
  labelledBy,
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cx(styles.section, styles[tone], className)}
    >
      <div className={cx('container', innerClassName)}>{children}</div>
    </section>
  );
}
