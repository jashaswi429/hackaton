import { cx } from '../../lib/cx';
import { Button } from '../../components/ui/Button';
import { DigestGrid } from './DigestGrid';
import { bytesToBits } from './hash';
import styles from './hashlab.module.css';

type HashHeroProps = {
  digest: Uint8Array;
  hex: string;
  onStart: () => void;
};

/** The entry screen: a live fingerprint preview, a short pitch, one clear action. */
export function HashHero({ digest, hex, onStart }: HashHeroProps) {
  return (
    <section className={styles.hero} aria-label="Introduction">
      <div className={cx('container', styles.heroInner)}>
        <div className={styles.heroCopy}>
          <span className={cx('mono', styles.heroTag)}>EXPERIMENT 003 — THE HASH LAB</span>
          <h2 className={styles.heroTitle}>Any input. One fixed fingerprint.</h2>
          <p className={styles.heroSupport}>
            A hash function squeezes any amount of data into a fingerprint of
            exactly 256 bits — and changes all of it the moment you change one
            character. Explore how that works, and why it is so hard to reverse.
          </p>
          <div className={styles.heroCta}>
            <Button variant="primary" size="lg" onClick={onStart}>
              START EXPERIMENT <span aria-hidden="true">→</span>
            </Button>
            <span className={cx('mono', styles.heroHint)}>
              HASH IT · FLIP A BIT · HUNT A TARGET
            </span>
          </div>
        </div>

        <div className={styles.heroPreview}>
          <div className={styles.heroDigestFrame}>
            <DigestGrid
              bits={bytesToBits(digest)}
              selected={null}
              onSelect={() => {}}
              label="Preview of a SHA-256 digest"
            />
          </div>
          <span className={cx('mono', styles.heroPreviewLabel)}>
            SHA-256 · {hex.slice(0, 24)}…
          </span>
        </div>
      </div>
    </section>
  );
}
