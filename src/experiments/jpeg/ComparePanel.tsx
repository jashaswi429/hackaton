import { cx } from '../../lib/cx';
import { PixelMatrix } from './PixelMatrix';
import type { ErrorStats } from './math';
import type { BlockRef } from './types';
import styles from './lab.module.css';

const pad2 = (n: number) => String(n).padStart(2, '0');

type ComparePanelProps = {
  block: BlockRef;
  pixels: number[];
  reconstructed: number[];
  difference: number[];
  showValues: boolean;
  onToggleValues: () => void;
  stats: ErrorStats | null;
};

/** Enlarged block comparison: original, reconstructed and pixel difference. */
export function ComparePanel({
  block,
  pixels,
  reconstructed,
  difference,
  showValues,
  onToggleValues,
  stats,
}: ComparePanelProps) {
  return (
    <div className={styles.stack}>
      <div className={styles.panelHead}>
        <h2 className={cx('mono', styles.panelTitle)}>BLOCK COMPARISON</h2>
        <span className={cx('mono', styles.blockReadout)}>
          BLOCK X: {pad2(block.bx)} | BLOCK Y: {pad2(block.by)}
        </span>
      </div>

      <div className={styles.ctrlRow}>
        <button
          type="button"
          className={cx(styles.ctrl, showValues && styles.ctrlOn)}
          aria-pressed={showValues}
          onClick={onToggleValues}
        >
          SHOW VALUES
        </button>
        {stats && (
          <span className={cx('mono', styles.muted)}>
            WHOLE IMAGE · MEAN ERROR {stats.mae.toFixed(2)} · MAX {stats.max} · PSNR{' '}
            {Number.isFinite(stats.psnr) ? `${stats.psnr.toFixed(2)} DB` : '∞'}
          </span>
        )}
      </div>

      <div className={styles.zoomRow}>
        <div className={styles.matrixBox}>
          <span className={cx('mono', styles.matrixLabel)}>ORIGINAL PIXELS</span>
          <PixelMatrix
            values={pixels}
            mode="pixel"
            size="zoom"
            showValues={showValues}
            ariaLabel="Original pixels of the selected block, enlarged"
          />
        </div>

        <div className={styles.matrixBox}>
          <span className={cx('mono', styles.matrixLabel)}>RECONSTRUCTED PIXELS</span>
          <PixelMatrix
            values={reconstructed}
            mode="pixel"
            size="zoom"
            showValues={showValues}
            ariaLabel="Reconstructed pixels of the selected block, enlarged"
          />
        </div>

        <div className={styles.matrixBox}>
          <span className={cx('mono', styles.matrixLabel)}>PIXEL DIFFERENCE</span>
          <PixelMatrix
            values={difference}
            mode="difference"
            size="zoom"
            showValues={showValues}
            ariaLabel="Pixel difference of the selected block, enlarged"
          />
        </div>
      </div>

      <p className={styles.explain}>
        Reconstructed values come from the real inverse transform. The difference
        is the true arithmetic error — brighter means the reconstruction drifted
        further from the original sample.
      </p>
    </div>
  );
}
