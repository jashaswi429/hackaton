import { cx } from '../../lib/cx';
import { MAX_INPUT } from './qr';
import styles from './qrlab.module.css';

type Preset = { label: string; value: string };

const PRESETS: Preset[] = [
  { label: 'GREETING', value: 'Hello, QRYX.' },
  { label: 'URL', value: 'https://qryx.lab/experiment/002' },
  { label: 'NUMBERS', value: '31415926535897932384' },
  { label: 'MESSAGE', value: 'Data survives damage.' },
];

type QrInputProps = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  disabled?: boolean;
};

/** Input editor for the payload that becomes the QR code. */
export function QrInput({ value, onChange, onClear, disabled }: QrInputProps) {
  const over = value.length > MAX_INPUT;

  return (
    <section className={styles.panel} aria-label="QR input">
      <div className={styles.panelHead}>
        <span className={cx('mono', styles.panelTitle)}>INPUT</span>
        <span className={cx('mono', styles.panelMeta)}>TEXT · URL · NUMBERS</span>
      </div>

      <label className={cx('mono', styles.fieldLabel)} htmlFor="qr-input">
        MESSAGE TO ENCODE
      </label>
      <textarea
        id="qr-input"
        className={styles.inputArea}
        value={value}
        disabled={disabled}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type something to encode…"
        aria-describedby="qr-input-meta"
      />

      <div className={styles.inputMeta} id="qr-input-meta">
        <span
          className={cx('mono', styles.counter, over && styles.counterWarn)}
        >
          {value.length} / {MAX_INPUT} CHARACTERS
        </span>
        <button
          type="button"
          className={styles.ctrl}
          onClick={onClear}
          disabled={disabled || value.length === 0}
        >
          CLEAR
        </button>
      </div>

      <div className={styles.presetRow} role="group" aria-label="Example inputs">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className={styles.preset}
            onClick={() => onChange(p.value)}
            disabled={disabled}
          >
            {p.label}
          </button>
        ))}
      </div>

      <p className={cx('mono', styles.note)} style={{ marginTop: 12, border: 0, paddingLeft: 0 }}>
        LIMIT {MAX_INPUT} CHARACTERS — ENOUGH FOR ANY VERSION-40 BYTE-MODE PAYLOAD, AND FAST TO RENDER.
      </p>
    </section>
  );
}
