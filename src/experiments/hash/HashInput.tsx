import { cx } from '../../lib/cx';
import styles from './hashlab.module.css';

/** Generous ceiling — the hash handles any length, this just keeps the UI calm. */
export const MAX_INPUT = 512;

type Preset = { label: string; value: string };

const PRESETS: Preset[] = [
  { label: 'QRYX', value: 'QRYX' },
  { label: 'HELLO', value: 'hello world' },
  { label: 'PASSPHRASE', value: 'correct horse battery staple' },
  { label: 'SENTENCE', value: 'The quick brown fox jumps over the lazy dog.' },
];

type HashInputProps = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  disabled?: boolean;
};

/** Input editor for the message whose SHA-256 fingerprint is computed. */
export function HashInput({ value, onChange, onClear, disabled }: HashInputProps) {
  const over = value.length > MAX_INPUT;

  return (
    <section className={styles.panel} aria-label="Hash input">
      <div className={styles.panelHead}>
        <span className={cx('mono', styles.panelTitle)}>INPUT</span>
        <span className={cx('mono', styles.panelMeta)}>ANY TEXT, ANY LENGTH</span>
      </div>

      <label className={cx('mono', styles.fieldLabel)} htmlFor="hash-input">
        MESSAGE TO HASH
      </label>
      <textarea
        id="hash-input"
        className={styles.inputArea}
        value={value}
        disabled={disabled}
        spellCheck={false}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type anything to hash…"
        aria-describedby="hash-input-meta"
      />

      <div className={styles.inputMeta} id="hash-input-meta">
        <span className={cx('mono', styles.counter, over && styles.counterWarn)}>
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
        SAME INPUT → SAME DIGEST, EVERY TIME. CHANGE ONE CHARACTER AND EVERYTHING CHANGES.
      </p>
    </section>
  );
}
