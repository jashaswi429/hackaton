import { cx } from '../lib/cx';
import { NAV_LINKS } from '../lib/content';
import { scrollToId } from '../lib/scroll';
import { BrandMark } from './ui/BrandMark';
import styles from './Footer.module.css';

/** Understated footer: identity, one line of description, anchors, status. */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={cx('container', styles.inner)}>
        <div className={styles.brand}>
          <BrandMark size={20} />
          <div>
            <span className={styles.wordmark}>QRYX</span>
            <p className={styles.tagline}>INTERACTIVE KNOWLEDGE LAB</p>
          </div>
        </div>

        <nav className={styles.links} aria-label="Footer">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              type="button"
              className={styles.link}
              onClick={() => scrollToId(link.id)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className={styles.meta}>
          <span className="mono">© {year} QRYX</span>
          <span className={cx('mono', styles.status)}>
            EXPERIMENTS · BUILT FOR CURIOSITY
          </span>
        </div>
      </div>
    </footer>
  );
}
