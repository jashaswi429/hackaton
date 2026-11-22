import type { CSSProperties, ReactNode } from 'react';
import { useReveal } from '../../hooks/useReveal';
import { cx } from '../../lib/cx';

type RevealProps = {
  children: ReactNode;
  /** Stagger delay in ms — lets a row of items cascade in. */
  delay?: number;
  className?: string;
};

/**
 * Declarative scroll-reveal wrapper.
 * Adds `.is-in` the first time it enters the viewport (see global.css).
 */
export function Reveal({ children, delay = 0, className }: RevealProps) {
  const { ref, inView } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cx('reveal', inView && 'is-in', className)}
      style={{ '--d': `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
