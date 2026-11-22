import { cx } from '../../lib/cx';
import { Term } from './Term';
import styles from './lab.module.css';

type QualitySliderProps = {
  quality: number;
  onQualityChange: (q: number) => void;
};

/** The primary interactive control: JPEG quality, 1–100. */
export function QualitySlider({ quality, onQualityChange }: QualitySliderProps) {
  return (
    <section className={styles.qualityCard} aria-label="Quality">
      <div className={styles.qualityHead}>
        <label htmlFor="quality" className={cx('mono', styles.panelTitle)}>
          <Term id="quantization">QUALITY</Term>
        </label>
        <span className={cx('mono', styles.qualityValue)}>{quality}</span>
      </div>

      <input
        id="quality"
        type="range"
        min={1}
        max={100}
        step={1}
        value={quality}
        className={styles.slider}
        onChange={(e) => onQualityChange(Number(e.target.value))}
        aria-valuemin={1}
        aria-valuemax={100}
        aria-valuenow={quality}
      />

      <div className={cx('mono', styles.sliderScale)}>
        <span>1</span>
        <span>50</span>
        <span>100</span>
      </div>

      <p className={styles.explain}>
        Higher quality preserves more coefficient information. Lower quality removes
        more precision during quantization. Quality is not a direct file-size
        measurement.
      </p>
    </section>
  );
}
