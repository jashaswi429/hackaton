import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import styles from './Button.module.css';

type ButtonProps = {
  children: ReactNode;
  variant?: 'primary' | 'ghost';
  size?: 'md' | 'lg';
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
  className?: string;
};

/**
 * Technical CTA button. Renders an <a> when `href` is provided,
 * otherwise a real <button> so keyboard + semantics stay correct.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  href,
  disabled = false,
  title,
  ariaLabel,
  className,
}: ButtonProps) {
  const classes = cx(
    styles.btn,
    styles[variant],
    size === 'lg' && styles.lg,
    disabled && styles.disabled,
    className,
  );

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        title={title}
        onClick={onClick}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  );
}
