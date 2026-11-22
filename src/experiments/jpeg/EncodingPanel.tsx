import { useState } from 'react';
import { cx } from '../../lib/cx';
import { getNumRawDataModules } from './structure';
import type { QrMode } from './types';
import styles from './qrlab.module.css';

type StageId = 'input' | 'encoding' | 'codewords' | 'correction' | 'matrix';

const STAGES: { id: StageId; label: string; title: string; body: string }[] = [
  {
    id: 'input',
    label: 'INPUT',
    title: 'INPUT',
    body: 'The raw characters you typed. A scanner has no idea what they mean yet — they are just symbols that must be represented as bits.',
  },
  {
    id: 'encoding',
    label: 'ENCODING',
    title: 'ENCODING',
    body: 'The characters are packed into a bit stream using a segment mode. Numeric packs digits tightly, alphanumeric packs the 45-character set, and byte mode stores raw bytes.',
  },
  {
    id: 'codewords',
    label: 'CODEWORDS',
    title: 'CODEWORDS',
    body: 'The bit stream is sliced into 8-bit codewords and padded to fill the symbol exactly. These codewords are the payload the matrix will carry.',
  },
  {
    id: 'correction',
    label: 'ERROR CORRECTION',
    title: 'ERROR CORRECTION',
    body: 'Reed–Solomon parity codewords are computed from the data codewords and interleaved with them, so a scanner can rebuild a damaged region.',
  },
  {
    id: 'matrix',
    label: 'MATRIX',
    title: 'MATRIX',
    body: 'Codewords are placed into the grid in a defined zig-zag order, then a mask is applied and the fixed functional patterns are drawn around them.',
  },
];

const MODE_NOTE: Record<QrMode, string> = {
  Numeric: 'Digits only — the most compact mode.',
  Alphanumeric: 'Digits and the 45-character set (A–Z, 0–9, space, $ % * + - . / :).',
  Byte: 'Any characters, stored as UTF-8 bytes. Always available.',
};

const MODE_ORDER: QrMode[] = ['Numeric', 'Alphanumeric', 'Byte'];

type EncodingPanelProps = {
  text: string;
  mode: QrMode;
  detected: QrMode;
  onModeChange: (mode: QrMode | null) => void;
  modeAllowed: Record<QrMode, boolean>;
  version: number;
  size: number;
  ec: string;
};

/** ENCODING tab — how the message becomes a bit stream, and the flow to a matrix. */
export function EncodingPanel({
  text,
  mode,
  detected,
  onModeChange,
  modeAllowed,
  version,
  size,
  ec,
}: EncodingPanelProps) {
  const [stage, setStage] = useState<StageId>('input');
  const current = STAGES.find((s) => s.id === stage) ?? STAGES[0];
  const codewords = Math.floor(getNumRawDataModules(version) / 8);

  return (
    <div className={styles.stack}>
      <div className={styles.infoGrid}>
        <div className={styles.infoCell}>
          <span className={cx('mono', styles.infoKey)}>ENCODING MODE</span>
          <span className={styles.infoVal}>{mode}</span>
          <span className={cx('mono', styles.infoSub)}>
            {mode === detected ? 'DETECTED FROM INPUT' : `FORCED (DETECTED: ${detected.toUpperCase()})`}
          </span>
        </div>
        <div className={styles.infoCell}>
          <span className={cx('mono', styles.infoKey)}>QR VERSION</span>
          <span className={styles.infoVal}>{version}</span>
          <span className={cx('mono', styles.infoSub)}>{size} × {size} MODULES</span>
        </div>
        <div className={styles.infoCell}>
          <span className={cx('mono', styles.infoKey)}>ERROR CORRECTION</span>
          <span className={styles.infoVal}>{ec}</span>
          <span className={cx('mono', styles.infoSub)}>LEVEL</span>
        </div>
        <div className={styles.infoCell}>
          <span className={cx('mono', styles.infoKey)}>CODEWORDS</span>
          <span className={styles.infoVal}>≈{codewords}</span>
          <span className={cx('mono', styles.infoSub)}>DATA + EC (APPROX.)</span>
        </div>
      </div>

      <div className={styles.field}>
        <span className={cx('mono', styles.fieldLabel)}>SEGMENT MODE</span>
        <div className={styles.chipRow} role="group" aria-label="Segment mode">
          {MODE_ORDER.map((m) => {
            const allowed = modeAllowed[m];
            return (
              <button
                key={m}
                type="button"
                className={cx(styles.ctrl, mode === m && styles.ctrlOn)}
                aria-pressed={mode === m}
                disabled={!allowed}
                title={allowed ? MODE_NOTE[m] : `${m} mode cannot represent this input`}
                onClick={() => onModeChange(m === detected ? null : m)}
              >
                {m.toUpperCase()}
              </button>
            );
          })}
        </div>
        <p className={cx('mono', styles.infoSub)}>{MODE_NOTE[mode]}</p>
      </div>

      <div className={styles.flow} role="tablist" aria-label="Encoding flow">
        {STAGES.map((s, i) => (
          <span key={s.id} className={styles.flowItem}>
            {i > 0 && (
              <span className={styles.flowArrow} aria-hidden="true">
                ↓
              </span>
            )}
            <button
              type="button"
              role="tab"
              aria-selected={stage === s.id}
              className={cx(styles.flowStage, stage === s.id && styles.flowStageOn)}
              onClick={() => setStage(s.id)}
            >
              {s.label}
            </button>
          </span>
        ))}
      </div>

      <div className={styles.flowBody}>
        <span className={cx('mono', styles.flowBodyTitle)}>{current.title}</span>
        <p style={{ marginTop: 6 }}>{current.body}</p>
      </div>

      <div className={styles.compareCell}>
        <span className={cx('mono', styles.compareCellKey)}>CONTENT</span>
        <span className={styles.resultText}>{text}</span>
      </div>

      <p className={cx('mono', styles.note)}>
        ASCII TEXT AND STANDARD URLS MATCH THE QR SPECIFICATION CHARACTER FOR CHARACTER. NON-ASCII
        INPUT IS ENCODED AS UTF-8 BYTES.
      </p>
    </div>
  );
}
