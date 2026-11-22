import { cx } from '../../lib/cx';
import { LAYER_INFO, REGION, regionCounts } from './structure';
import type { RegionLayer } from './types';
import styles from './qrlab.module.css';

const LAYER_ORDER: RegionLayer[] = [
  'finder',
  'alignment',
  'timing',
  'format',
  'version',
  'data',
  'ec',
];

/** Legend colours — must match QrMatrix's overlay colours. */
const SWATCH: Record<RegionLayer, string> = {
  finder: '#c6ff55',
  alignment: '#4fd6ff',
  timing: '#ff8a3d',
  format: '#c98bff',
  version: '#ffd23d',
  data: '#4f7dff',
  ec: '#ff5d5d',
};

const SHORT: Record<RegionLayer, string> = {
  finder: 'FINDER PATTERNS',
  alignment: 'ALIGNMENT PATTERNS',
  timing: 'TIMING PATTERNS',
  format: 'FORMAT INFORMATION',
  version: 'VERSION INFORMATION',
  data: 'DATA REGION',
  ec: 'ERROR CORRECTION REGION',
};

type StructureExplorerProps = {
  layers: Set<RegionLayer>;
  onToggle: (layer: RegionLayer) => void;
  regionMap: Uint8Array | null;
  /** The layer currently explained in the detail box. */
  active: RegionLayer;
  onActive: (layer: RegionLayer) => void;
  version: number;
  alignmentCount: number;
  /** True when the symbol is too low a version to contain a structure. */
  hasVersionInfo: boolean;
};

/**
 * STRUCTURE tab — toggleable overlays that map the QR's fixed functional
 * patterns. Geometry is exact; the data / error-correction split is labelled
 * as an educational approximation because the standard interleaves them.
 */
export function StructureExplorer({
  layers,
  onToggle,
  regionMap,
  active,
  onActive,
  version,
  alignmentCount,
  hasVersionInfo,
}: StructureExplorerProps) {
  const counts = regionMap ? regionCounts(regionMap) : null;
  const info = LAYER_INFO[active];

  const countFor = (layer: RegionLayer): number => {
    if (!counts) return 0;
    if (layer === 'finder') return (counts[REGION.FINDER] ?? 0) + (counts[REGION.SEPARATOR] ?? 0);
    if (layer === 'alignment') return counts[REGION.ALIGNMENT] ?? 0;
    if (layer === 'timing') return counts[REGION.TIMING] ?? 0;
    if (layer === 'format') return counts[REGION.FORMAT] ?? 0;
    if (layer === 'version') return counts[REGION.VERSION] ?? 0;
    return counts[REGION.DATA] ?? 0; // data + ec share the same region
  };

  return (
    <div className={styles.stack}>
      <p className={styles.explain}>
        A QR code is not random noise. Its <b>functional patterns</b> are fixed by
        the standard so any scanner can find and orient it; everything else is
        encoded data. Toggle a layer to highlight where it lives.
      </p>

      <div className={styles.layerGrid} role="group" aria-label="Structure layers">
        {LAYER_ORDER.map((layer) => {
          const on = layers.has(layer);
          return (
            <button
              key={layer}
              type="button"
              aria-pressed={on}
              className={cx(styles.layerToggle, on && styles.layerToggleOn)}
              onClick={() => {
                onToggle(layer);
                onActive(layer);
              }}
            >
              <span
                className={styles.layerSwatch}
                style={{ background: SWATCH[layer] }}
                aria-hidden="true"
              />
              {SHORT[layer]}
              <span className={styles.layerCount}>{countFor(layer)}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.legend}>
        {LAYER_ORDER.map((layer) => (
          <span key={layer} className={cx('mono', styles.legendItem)}>
            <span
              className={styles.legendSwatch}
              style={{ background: SWATCH[layer] }}
              aria-hidden="true"
            />
            {layer.toUpperCase()}
          </span>
        ))}
      </div>

      {info && (
        <div className={styles.flowBody}>
          <span className={cx('mono', styles.flowBodyTitle)}>{info.title}</span>
          <p style={{ marginTop: 6 }}>{info.body}</p>
          {active === 'version' && !hasVersionInfo && (
            <p className={cx('mono', styles.note)} style={{ marginTop: 10 }}>
              THIS SYMBOL IS VERSION {version}. VERSION INFORMATION APPEARS FROM VERSION 7 UPWARD.
            </p>
          )}
          {active === 'alignment' && alignmentCount === 0 && (
            <p className={cx('mono', styles.note)} style={{ marginTop: 10 }}>
              VERSION 1 HAS NO ALIGNMENT PATTERNS — THE THREE FINDERS ARE ENOUGH.
            </p>
          )}
          {(active === 'data' || active === 'ec') && (
            <p className={cx('mono', styles.note)} style={{ marginTop: 10 }}>
              EDUCATIONAL APPROXIMATION — DATA AND ERROR-CORRECTION CODEWORDS ARE INTERLEAVED
              THROUGH THE MATRIX. THIS LAYER SHOWS THE COMBINED REGION, NOT AN EXACT BOUNDARY.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
