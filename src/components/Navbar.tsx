import { useEffect, useState } from 'react';
import { useScrolled } from '../hooks/useScrolled';
import { cx } from '../lib/cx';
import { NAV_LINKS, SECTION_IDS } from '../lib/content';
import { scrollToId } from '../lib/scroll';
import { BrandMark } from './ui/BrandMark';
import styles from './Navbar.module.css';

/**
 * Fixed top navigation.
 * Transparent over the hero, then gains a surface + hairline once scrolled.
 * Collapses to a toggle menu under 820px.
 */
export function Navbar() {
  const scrolled = useScrolled(10);
  const [open, setOpen] = useState(false);

  // Close the mobile menu on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };

  return (
    <header className={cx(styles.nav, scrolled && styles.scrolled)}>
      <div className={cx('container', styles.inner)}>
        <button
          type="button"
          className={styles.brand}
          onClick={() => go(SECTION_IDS.top)}
          aria-label="QRYX — back to top"
        >
          <BrandMark />
          <span className={styles.wordmark}>QRYX</span>
        </button>

        <nav className={styles.links} aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              className={styles.link}
              onClick={() => go(link.id)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className={styles.actions}>
          <span className={styles.status} aria-label="System status: online">
            <span className={styles.statusDot} aria-hidden="true" />
            SYSTEM ONLINE
          </span>

          <button
            type="button"
            className={styles.burger}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className={cx(styles.burgerLine, open && styles.burgerTop)} />
            <span
              className={cx(styles.burgerLine, open && styles.burgerBottom)}
            />
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        className={cx(styles.mobileMenu, open && styles.mobileMenuOpen)}
      >
        {NAV_LINKS.map((link) => (
          <button
            key={link.id}
            type="button"
            className={styles.mobileLink}
            onClick={() => go(link.id)}
          >
            {link.label}
          </button>
        ))}
        <span className={cx('mono', styles.mobileStatus)}>
          <span className={styles.statusDot} aria-hidden="true" />
          SYSTEM ONLINE
        </span>
      </div>
    </header>
  );
}
