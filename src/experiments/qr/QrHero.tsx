import { cx } from '../../lib/cx';
import { Button } from '../../components/ui/Button';
import { QrMatrix } from './QrMatrix';
import type { QrMatrix as QrMatrixType } from './qr';
import styles from './qrlab.module.css';

type QrHeroProps = {
  preview: QrMatrixType | null;
  onStart: () => void;
};

/** The entry screen: a normal preview, a short pitch, and a single clear action. */
export function QrHero({ preview, onStart }: QrHeroProps) {
  return (
    <section className={styles.hero} aria-label="Introduction">
      <div className={cx('container', styles.heroInner)}>
        <div className={styles.heroCopy}>
          <span className={cx('mono', styles.heroTag)}>EXPERIMENT 002 — THE QR LAB</span>
          <h2 className={styles.heroTitle}>An entire message. Hidden in a grid.</h2>
          <p className={styles.heroSupport}>
            Explore how QR codes transform information into patterns, and how those
            patterns remain readable even when they're damaged.
          </p>
          <div className={styles.heroCta}>
            <Button variant="primary" size="lg" onClick={onStart}>
              START EXPERIMENT <span aria-hidden="true">→</span>
            </Button>
            <span className={cx('mono', styles.heroHint)}>
              TYPE A MESSAGE · INSPECT IT · BREAK IT · DECODE IT
            </span>
          </div>
        </div>

        <div className={styles.heroPreview}>
          <div className={styles.heroPreviewFrame}>
            {preview && (
              <QrMatrix
                size={preview.size}
                display={preview.modules}
                mask={null}
                regionMap={new Uint8Array(preview.modules.length)}
                layers={new Set()}
                selected={null}
                onSelect={() => {}}
                placing={false}
                label="QR code preview"
              />
            )}
          </div>
          <span className={cx('mono', styles.heroPreviewLabel)}>
            LIVE PREVIEW — VERSION {preview?.version ?? '—'}
          </span>
        </div>
      </div>
    </section>
  );
}
