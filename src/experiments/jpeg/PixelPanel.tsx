import { useState } from 'react';
import { cx } from '../../lib/cx';
import { PixelMatrix } from './PixelMatrix';
import { Term } from './Term';
import type { BlockRef, CellRef } from './types';
import styles from './lab.module.css';

const pad2 = (n: number) => String(n).padStart(2, '0');

type PixelPanelProps = {
  block: BlockRef;
  pixels: number[];
  shifted: Float64Array;
  showValues: boolean;
  onToggleValues: () => void;
};

/** Pixel inspector: the selected block as real 8x8 samples, plus level shifting. */
export function PixelPanel({
  block,
  pixels,
  shifted,
  showValues,
  onToggleValues,
}: PixelPanelProps) {
  const [hovered, setHovered] = useState<CellRef | null>(null);

  const uv = hovered ?? { x: 0, y: 0 };
  const original = pixels[uv.y * 8 + uv.x];
  const shiftedValue = shifted[uv.y * 8 + uv.x];

  return (
    <div className={styles.stack}>
      <div className={styles.panelHead}>
        <h2 className={cx('mono', styles.panelTitle)}>PIXEL INSPECTOR</h2>
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
        <span className={cx('mono', styles.muted)}>
          HOVER A CELL → x{uv.x} y{uv.y} = {original} · <Term id="level-shift">SHIFTED</Term>{' '}
          = {shiftedValue}
        </span>
      </div>

      <div className={styles.matrixPair}>
        <div className={styles.matrixBox}>
          <span className={cx('mono', styles.matrixLabel)}>ORIGINAL PIXELS · 0–255</span>
          <PixelMatrix
            values={pixels}
            mode="pixel"
            showValues={showValues}
            hovered={hovered}
            onHover={setHovered}
            ariaLabel="Original pixel values of the selected block"
          />
        </div>

        <div className={styles.matrixBox}>
          <span className={cx('mono', styles.matrixLabel)}>LEVEL SHIFTED · −128 to +127</span>
          <PixelMatrix
            values={shifted}
            mode="shifted"
            showValues={showValues}
            hovered={hovered}
            onHover={setHovered}
            ariaLabel="Level-shifted values of the selected block"
          />
        </div>
      </div>

      <p className={styles.explain}>
        <code className={styles.formula}>f(x,y) = pixel(x,y) − 128</code>
        Level shifting centers pixel values around zero before the transform.
        Hovered pixel: <b>{original}</b> − 128 = <b>{shiftedValue}</b>.
      </p>
    </div>
  );
}
