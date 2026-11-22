import { cx } from '../../lib/cx';
import { BrandMark } from '../../components/ui/BrandMark';
import { ROUTES } from '../../lib/router';
import type { LabMode } from './types';
import styles from './lab.module.css';

type LabHeaderProps = {
  mode: LabMode;
  onModeChange: (mode: LabMode) => void;
  onReset: () => void;
};

/** Experiment header: identity, back navigation, title, mode selector, reset. */
export function LabHeader({ mode, onModeChange, onReset }: LabHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={cx('container', styles.headerInner)}>
        <div className={styles.headTop}>
          <a className={styles.back} href={ROUTES.landing}>
            <span aria-hidden="true">←</span> BACK TO LAB
          </a>

          <span className={cx('mono', styles.brand)}>
            <BrandMark size={16} />
            QRYX
          </span>

          <div className={styles.headActions}>
            <div className={styles.modeSwitch} role="group" aria-label="Mode">
              {(['guided', 'explore'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={cx(styles.modeBtn, mode === m && styles.modeBtnActive)}
                  aria-pressed={mode === m}
                  onClick={() => onModeChange(m)}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
            <button type="button" className={styles.resetBtn} onClick={onReset}>
              RESET
            </button>
          </div>
        </div>

        <div className={styles.headTitle}>
          <span className={cx('mono', styles.experiment)}>EXPERIMENT 001</span>
          <h1 className={styles.title}>THE JPEG LAB</h1>
          <p className={styles.tagline}>
            What does your image sacrifice to become smaller?
          </p>
        </div>

        <p className={cx('mono', styles.disclaimer)}>
          A DCT + quantization explorer — not a complete JPEG encoder. No Huffman
          coding, chroma subsampling or file-size measurement.
        </p>
      </div>
    </header>
  );
}
