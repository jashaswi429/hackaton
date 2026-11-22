import { useEffect, useRef } from 'react';
import { cx } from '../../lib/cx';
import type { ErrorStats } from './math';
import type { GrayImage } from './image';
import type { BlockRef, ViewMode } from './types';
import styles from './lab.module.css';

const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: 'original', label: 'ORIGINAL' },
  { id: 'reconstructed', label: 'RECONSTRUCTED' },
  { id: 'side-by-side', label: 'SIDE-BY-SIDE' },
  { id: 'difference', label: 'DIFFERENCE' },
];

type ImageStageProps = {
  gray: GrayImage | null;
  originalData: ImageData | null;
  reconData: ImageData | null;
  diffData: ImageData | null;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  selected: BlockRef;
  hovered: BlockRef | null;
  onHoverBlock: (block: BlockRef | null) => void;
  onSelectBlock: (block: BlockRef) => void;
  stats: ErrorStats | null;
  diffGain: number;
  error: string | null;
  loading: boolean;
  sourceName: string;
  onUpload: (file: File) => void;
  onSample: () => void;
  onResetImage: () => void;
};

function StagePanel({
  data,
  label,
  width,
  height,
  cols,
  rows,
  showGrid,
  selected,
  hovered,
  onHover,
  onSelect,
  accent,
}: {
  data: ImageData;
  label: string;
  width: number;
  height: number;
  cols: number;
  rows: number;
  showGrid: boolean;
  selected: BlockRef;
  hovered: BlockRef | null;
  onHover: (b: BlockRef | null) => void;
  onSelect: (b: BlockRef) => void;
  accent?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.putImageData(data, 0, 0);
  }, [data, width, height]);

  const blockFromEvent = (e: {
    currentTarget: SVGSVGElement;
    clientX: number;
    clientY: number;
  }): BlockRef | null => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    const bx = Math.floor(((e.clientX - rect.left) / rect.width) * cols);
    const by = Math.floor(((e.clientY - rect.top) / rect.height) * rows);
    if (bx < 0 || by < 0 || bx >= cols || by >= rows) return null;
    return { bx, by };
  };

  const vLines = Array.from({ length: cols + 1 }, (_, i) => i * 8);
  const hLines = Array.from({ length: rows + 1 }, (_, i) => i * 8);

  return (
    <figure className={styles.stagePanel}>
      <div className={styles.frame}>
        <canvas ref={canvasRef} width={width} height={height} className={styles.canvas} />
        <svg
          className={styles.overlay}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          onPointerMove={(e) => onHover(blockFromEvent(e))}
          onPointerLeave={() => onHover(null)}
          onClick={(e) => {
            const b = blockFromEvent(e);
            if (b) onSelect(b);
          }}
        >
          {showGrid && (
            <g className={styles.gridLines}>
              {vLines.map((x) => (
                <line key={`v${x}`} x1={x} y1={0} x2={x} y2={height} vectorEffect="non-scaling-stroke" />
              ))}
              {hLines.map((y) => (
                <line key={`h${y}`} x1={0} y1={y} x2={width} y2={y} vectorEffect="non-scaling-stroke" />
              ))}
            </g>
          )}

          {hovered && (
            <rect
              className={styles.hoverRect}
              x={hovered.bx * 8}
              y={hovered.by * 8}
              width={8}
              height={8}
              vectorEffect="non-scaling-stroke"
            />
          )}

          <rect
            className={cx(styles.selRect, accent && styles.selRectAccent)}
            x={selected.bx * 8}
            y={selected.by * 8}
            width={8}
            height={8}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
      <figcaption className={cx('mono', styles.stageLabel)}>{label}</figcaption>
    </figure>
  );
}

/** The image workspace: comparison modes, real block grid, local image sources. */
export function ImageStage(props: ImageStageProps) {
  const {
    gray,
    originalData,
    reconData,
    diffData,
    viewMode,
    onViewModeChange,
    showGrid,
    onToggleGrid,
    selected,
    hovered,
    onHoverBlock,
    onSelectBlock,
    stats,
    diffGain,
    error,
    loading,
    sourceName,
    onUpload,
    onSample,
    onResetImage,
  } = props;

  const fileRef = useRef<HTMLInputElement>(null);
  const cols = gray ? gray.width / 8 : 1;
  const rows = gray ? gray.height / 8 : 1;

  const panelProps = {
    width: gray?.width ?? 0,
    height: gray?.height ?? 0,
    cols,
    rows,
    showGrid,
    selected,
    hovered,
    onHover: onHoverBlock,
    onSelect: onSelectBlock,
  };

  const showSideBySide = viewMode === 'side-by-side';

  return (
    <section className={cx(styles.panel, styles.stageCard)} aria-label="Image workspace">
      <div className={styles.panelHead}>
        <h2 className={cx('mono', styles.panelTitle)}>IMAGE WORKSPACE</h2>
        <span className={cx('mono', styles.panelMeta)}>
          {gray ? `${gray.width} × ${gray.height} PX` : 'NO SOURCE'}
          {gray?.resized ? ' · RESIZED' : ''}
        </span>
      </div>

      <div className={styles.viewTabs} role="group" aria-label="Comparison mode">
        {VIEW_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            className={cx(styles.viewTab, viewMode === m.id && styles.viewTabActive)}
            aria-pressed={viewMode === m.id}
            onClick={() => onViewModeChange(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className={styles.stageBody}>
        {loading && <div className={styles.stageEmpty}>LOADING IMAGE…</div>}
        {!loading && error && <div className={styles.stageError}>{error}</div>}

        {!loading && !error && gray && (
          <div className={cx(styles.stageCompare, showSideBySide && styles.stageCompareSplit)}>
            {(viewMode === 'original' || showSideBySide) && originalData && (
              <StagePanel {...panelProps} data={originalData} label="ORIGINAL" />
            )}
            {(viewMode === 'reconstructed' || showSideBySide) && reconData && (
              <StagePanel {...panelProps} data={reconData} label="RECONSTRUCTED" accent />
            )}
            {viewMode === 'difference' && diffData && (
              <StagePanel {...panelProps} data={diffData} label="DIFFERENCE" />
            )}
          </div>
        )}

        {!loading && !error && gray && viewMode === 'difference' && (
          <div className={styles.diffLegend}>
            <span className={cx('mono', styles.diffLegendLabel)}>
              |RECONSTRUCTED − ORIGINAL| ×{diffGain} — FIXED SCALE
            </span>
            <span className={styles.diffBar} aria-hidden="true" />
            {stats && (
              <span className={cx('mono', styles.diffStats)}>
                MEAN {stats.mae.toFixed(2)} · MAX {stats.max} · PSNR{' '}
                {Number.isFinite(stats.psnr) ? `${stats.psnr.toFixed(2)} DB` : '∞'}
              </span>
            )}
          </div>
        )}
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={cx(styles.ctrl, showGrid && styles.ctrlOn)}
          aria-pressed={showGrid}
          onClick={onToggleGrid}
        >
          GRID {showGrid ? 'ON' : 'OFF'}
        </button>

        <button type="button" className={styles.ctrl} onClick={() => fileRef.current?.click()}>
          UPLOAD IMAGE
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className={styles.hiddenInput}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = '';
          }}
        />

        <button type="button" className={styles.ctrl} onClick={onSample}>
          SAMPLE
        </button>
        <button type="button" className={styles.ctrl} onClick={onResetImage}>
          RESET IMAGE
        </button>

        <span className={cx('mono', styles.sourceName)} title={sourceName}>
          {sourceName}
        </span>
      </div>
    </section>
  );
}
