import { cx } from '../../lib/cx';
import type { DecodeResult } from './decode';
import styles from './qrlab.module.css';

export type DecodeAttempt = {
  target: 'original' | 'damaged';
  result: DecodeResult;
  /** Used to distinguish "could not locate" from a plain correction failure. */
  finderIntact: boolean;
};

type DecodePanelProps = {
  attempts: DecodeAttempt[] | null;
  onDecode: () => void;
  canDecode: boolean;
  hasDamage: boolean;
};

function StatusLine({ label, tone }: { label: string; tone: 'ok' | 'fail' }) {
  return (
    <span
      className={cx(
        'mono',
        styles.resultStatus,
        tone === 'ok' ? styles.resultStatusOk : styles.resultStatusFail,
      )}
    >
      {label}
    </span>
  );
}

function AttemptCard({ attempt }: { attempt: DecodeAttempt }) {
  const { result, target } = attempt;
  const heading = target === 'original' ? 'ORIGINAL QR' : 'DAMAGED QR';

  if (result.ok) {
    return (
      <div className={cx(styles.resultCard, styles.resultOk)}>
        <div className={styles.panelHead}>
          <span className={cx('mono', styles.panelMeta)}>{heading}</span>
          <StatusLine label="DECODE SUCCESS" tone="ok" />
        </div>
        <span className={styles.resultText}>{result.data}</span>
        <span className={cx('mono', styles.resultMeta)}>
          VERSION {result.version}
          {result.modes.length > 0 ? ` · MODE ${result.modes.join(', ').toUpperCase()}` : ''}
        </span>
      </div>
    );
  }

  const couldNotLocate = !attempt.finderIntact;
  return (
    <div className={cx(styles.resultCard, styles.resultFail)}>
      <div className={styles.panelHead}>
        <span className={cx('mono', styles.panelMeta)}>{heading}</span>
        <StatusLine
          label={couldNotLocate ? 'SCANNER COULD NOT LOCATE' : 'DECODE FAILED'}
          tone="fail"
        />
      </div>
      <span className={cx('mono', styles.resultMeta)}>
        {couldNotLocate
          ? 'THE FINDER PATTERNS ARE DAMAGED, SO THE SCANNER COULD NOT FIND THE SYMBOL.'
          : 'THE SCANNER FOUND THE SYMBOL BUT COULD NOT ERROR-CORRECT IT.'}
      </span>
    </div>
  );
}

/** DECODE — runs a real decoder against the rendered original and damaged matrices. */
export function DecodePanel({ attempts, onDecode, canDecode, hasDamage }: DecodePanelProps) {
  return (
    <section className={styles.panel} aria-label="Decode">
      <div className={styles.panelHead}>
        <span className={cx('mono', styles.panelTitle)}>DECODER</span>
        <span className={cx('mono', styles.panelMeta)}>REAL · OFFLINE</span>
      </div>

      <button
        type="button"
        className={styles.decodeBtn}
        style={{ marginTop: 12 }}
        onClick={onDecode}
        disabled={!canDecode}
      >
        ATTEMPT TO DECODE
      </button>

      <p className={cx('mono', styles.infoSub)} style={{ marginTop: 10 }}>
        THE DECODER ONLY RECEIVES THE RENDERED PIXELS — NEVER YOUR ORIGINAL TEXT. NO CAMERA IS USED.
      </p>

      {attempts && attempts.length > 0 ? (
        <div className={styles.stack} style={{ marginTop: 14, gap: 10 }}>
          {attempts.map((a) => (
            <AttemptCard key={a.target} attempt={a} />
          ))}
        </div>
      ) : (
        <p className={cx('mono', styles.muted)} style={{ marginTop: 12 }}>
          {hasDamage
            ? 'READY — WILL TEST THE ORIGINAL AND THE DAMAGED CODE.'
            : 'READY — ENABLE DAMAGE TO TEST RECOVERY UNDER STRESS.'}
        </p>
      )}
    </section>
  );
}
