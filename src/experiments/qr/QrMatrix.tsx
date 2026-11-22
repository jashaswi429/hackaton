import { useMemo, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { REGION, type RegionCode } from './structure';
import type { ModuleRef, RegionLayer } from './types';
import styles from './qrlab.module.css';

/** Quiet zone width, in modules — the standard requires four. */
const QUIET = 4;

/** Colour per overlay layer. Kept legible against a white matrix. */
const LAYER_COLOR: Record<RegionLayer, string> = {
  finder: '#c6ff55',
  alignment: '#4fd6ff',
  timing: '#ff8a3d',
  format: '#c98bff',
  version: '#ffd23d',
  data: '#4f7dff',
  ec: '#ff5d5d',
};

/**
 * Which structured region codes correspond to each toggleable layer.
 * The data and error-correction codewords are interleaved in a real symbol and
 * cannot be separated module-by-module, so both layers point at the same
 * "data region" and the UI labels it as an educational approximation.
 */
const LAYER_REGIONS: Record<RegionLayer, RegionCode[]> = {
  finder: [REGION.FINDER, REGION.SEPARATOR],
  alignment: [REGION.ALIGNMENT],
  timing: [REGION.TIMING],
  format: [REGION.FORMAT],
  version: [REGION.VERSION],
  data: [REGION.DATA],
  ec: [REGION.DATA],
};

type Run = { r: number; c: number; len: number };

/** Merge horizontal runs of matching codes into as few rects as possible. */
function runsForCodes(
  regionMap: Uint8Array,
  size: number,
  codes: RegionCode[],
): Run[] {
  const wanted = new Set<number>(codes);
  const runs: Run[] = [];
  for (let r = 0; r < size; r++) {
    let c = 0;
    while (c < size) {
      if (!wanted.has(regionMap[r * size + c])) {
        c++;
        continue;
      }
      const start = c;
      while (c < size && wanted.has(regionMap[r * size + c])) c++;
      runs.push({ r, c: start, len: c - start });
    }
  }
  return runs;
}

/** Merge horizontal runs of dark modules into rects, so large symbols stay light. */
function darkRuns(modules: Uint8Array, size: number): Run[] {
  const runs: Run[] = [];
  for (let r = 0; r < size; r++) {
    let c = 0;
    while (c < size) {
      if (!modules[r * size + c]) {
        c++;
        continue;
      }
      const start = c;
      while (c < size && modules[r * size + c]) c++;
      runs.push({ r, c: start, len: c - start });
    }
  }
  return runs;
}

type QrMatrixProps = {
  size: number;
  /** The grid to display (original, or the damaged copy). */
  display: Uint8Array;
  /** 1 where a module has been damaged — drawn as a red tint. */
  mask: Uint8Array | null;
  regionMap: Uint8Array;
  layers: Set<RegionLayer>;
  selected: ModuleRef | null;
  onSelect: (m: ModuleRef) => void;
  /** Active when the damage tool is in "user placement" mode. */
  placing: boolean;
  onPlace?: (m: ModuleRef) => void;
  label: string;
};

/**
 * The visualization centrepiece: a real QR matrix rendered as crisp SVG
 * squares, with optional structural overlays and per-module inspection.
 */
export function QrMatrix({
  size,
  display,
  mask,
  regionMap,
  layers,
  selected,
  onSelect,
  placing,
  onPlace,
  label,
}: QrMatrixProps) {
  const [hover, setHover] = useState<ModuleRef | null>(null);
  const total = size + QUIET * 2;

  const base = useMemo(() => darkRuns(display, size), [display, size]);
  const damageRuns = useMemo(
    () => (mask ? runsForCodes(mask, size, [1]) : []),
    [mask, size],
  );

  const overlays = useMemo(() => {
    const out: { color: string; runs: Run[] }[] = [];
    for (const layer of layers) {
      out.push({
        color: LAYER_COLOR[layer],
        runs: runsForCodes(regionMap, size, LAYER_REGIONS[layer]),
      });
    }
    return out;
  }, [layers, regionMap, size]);

  const cellFromEvent = (e: ReactPointerEvent<SVGSVGElement>): ModuleRef | null => {
    const rect = e.currentTarget.getBoundingClientRect();
    const col = Math.floor(((e.clientX - rect.left) / rect.width) * total) - QUIET;
    const row = Math.floor(((e.clientY - rect.top) / rect.height) * total) - QUIET;
    if (row < 0 || col < 0 || row >= size || col >= size) return null;
    return { row, col };
  };

  const handleMove = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (e.pointerType === 'touch') return;
    setHover(cellFromEvent(e));
  };

  const handleDown = (e: ReactPointerEvent<SVGSVGElement>) => {
    const cell = cellFromEvent(e);
    if (!cell) return;
    onSelect(cell);
    if (placing) onPlace?.(cell);
  };

  return (
    <div className={styles.matrixFrame}>
      <svg
        className={styles.matrixSvg}
        viewBox={`0 0 ${total} ${total}`}
        role="img"
        aria-label={label}
        onPointerMove={handleMove}
        onPointerLeave={() => setHover(null)}
        onPointerDown={handleDown}
      >
        <rect x="0" y="0" width={total} height={total} fill="#ffffff" />

        <g>
          {base.map((run) => (
            <rect
              key={`m${run.r}-${run.c}`}
              x={run.c + QUIET}
              y={run.r + QUIET}
              width={run.len}
              height={1}
              className={styles.matrixModule}
              shapeRendering="crispEdges"
            />
          ))}
        </g>

        {damageRuns.length > 0 && (
          <g>
            {damageRuns.map((run) => (
              <rect
                key={`d${run.r}-${run.c}`}
                x={run.c + QUIET}
                y={run.r + QUIET}
                width={run.len}
                height={1}
                fill="#ff5d5d"
                fillOpacity={0.55}
                shapeRendering="crispEdges"
              />
            ))}
          </g>
        )}

        {overlays.map((layer, i) => (
          <g key={i} className={styles.overlayLayer}>
            {layer.runs.map((run) => (
              <rect
                key={`o${i}-${run.r}-${run.c}`}
                x={run.c + QUIET}
                y={run.r + QUIET}
                width={run.len}
                height={1}
                fill={layer.color}
                fillOpacity={0.5}
                shapeRendering="crispEdges"
              />
            ))}
          </g>
        ))}

        {hover && (
          <rect
            x={hover.col + QUIET}
            y={hover.row + QUIET}
            width="1"
            height="1"
            className={styles.hoverRect}
          />
        )}

        {selected && (
          <rect
            x={selected.col + QUIET - 0.14}
            y={selected.row + QUIET - 0.14}
            width="1.28"
            height="1.28"
            fill="none"
            className={styles.selRect}
          />
        )}
      </svg>
    </div>
  );
}
