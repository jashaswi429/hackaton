import { useEffect, useRef, useState } from 'react';
import { cx } from '../../lib/cx';
import {
  groupDigits,
  hasLeadingZeroNibbles,
  sha256,
  toHex,
  utf8Bytes,
} from './hash';
import type { MiningState } from './types';
import styles from './hashlab.module.css';

const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 5;
const DEFAULT_DIFFICULTY = 3;
/** Hard ceiling so an unlucky search always terminates. */
const MAX_ATTEMPTS = 8_000_000;
/** Attempts performed per animation frame — keeps the UI responsive. */
const CHUNK = 20_000;

const EMPTY: MiningState = {
  running: false,
  attempts: 0,
  nonce: null,
  digest: null,
  done: false,
  exhausted: false,
};

type WorkPanelProps = {
  text: string;
  hasMined: boolean;
  onMined: () => void;
};

/**
 * The WORK tab: proof-of-work by hand.
 * The only way to hit a target prefix is to keep hashing until you get lucky —
 * so the cost grows exponentially with the number of required zero nibbles.
 */
export function WorkPanel({ text, hasMined, onMined }: WorkPanelProps) {
  const [difficulty, setDifficulty] = useState(DEFAULT_DIFFICULTY);
  const [state, setState] = useState<MiningState>(EMPTY);
  const [elapsed, setElapsed] = useState(0);

  const timer = useRef<number | null>(null);
  const cancel = useRef(false);
  const startedAt = useRef(0);

  const clearTimer = () => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  // Abort any in-flight search and clear results when the problem changes.
  useEffect(() => {
    cancel.current = true;
    clearTimer();
    setState(EMPTY);
    setElapsed(0);
  }, [difficulty, text]);

  useEffect(
    () => () => {
      cancel.current = true;
      clearTimer();
    },
    [],
  );

  const expected = 16 ** difficulty;

  const mine = () => {
    clearTimer();
    cancel.current = false;
    startedAt.current = performance.now();
    setElapsed(0);
    setState({ ...EMPTY, running: true });

    let nonce = 0;
    const step = () => {
      if (cancel.current) return;
      const end = Math.min(nonce + CHUNK, MAX_ATTEMPTS);
      for (; nonce < end; nonce++) {
        const digest = sha256(utf8Bytes(`${text}#${nonce}`));
        if (hasLeadingZeroNibbles(digest, difficulty)) {
          setElapsed(performance.now() - startedAt.current);
          setState({
            running: false,
            attempts: nonce,
            nonce,
            digest: toHex(digest),
            done: true,
            exhausted: false,
          });
          onMined();
          return;
        }
      }
      setElapsed(performance.now() - startedAt.current);
      if (nonce >= MAX_ATTEMPTS) {
        setState({ ...EMPTY, attempts: nonce, exhausted: true });
        return;
      }
      setState((s) => ({ ...s, attempts: nonce }));
      timer.current = window.setTimeout(step, 0);
    };
    timer.current = window.setTimeout(step, 0);
  };

  const stop = () => {
    cancel.current = true;
    clearTimer();
    setState((s) => ({ ...s, running: false, exhausted: !s.done }));
  };

  const progress = state.done
    ? 1
    : Math.min(1, state.attempts / expected);

  const target = `${'0'.repeat(difficulty)}…`;

  return (
    <div className={styles.stack}>
      <p className={styles.explain}>
        Hashes are unpredictable, so you cannot <i>calculate</i> a fingerprint with a
        given prefix — you can only <b>guess and check</b>. Choosing more leading zeros
        makes the target 16× harder per digit. This is exactly how{' '}
        <b>proof-of-work</b> mining works.
      </p>

      <div className={styles.field}>
        <div className={styles.sliderHead}>
          <span className={cx('mono', styles.fieldLabel)}>DIFFICULTY — LEADING ZERO HEX DIGITS</span>
          <span className={styles.sliderValue}>{difficulty}</span>
        </div>
        <input
          className={styles.slider}
          type="range"
          min={MIN_DIFFICULTY}
          max={MAX_DIFFICULTY}
          step={1}
          value={difficulty}
          disabled={state.running}
          onChange={(e) => setDifficulty(Number(e.target.value))}
          aria-label="Difficulty (leading zero hex digits)"
        />
        <div className={styles.sliderScale}>
          <span className="mono">{MIN_DIFFICULTY} DIGIT</span>
          <span className="mono">{MAX_DIFFICULTY} DIGITS</span>
        </div>
      </div>

      <div className={styles.ctrlRow}>
        <span className={styles.targetChip}>
          TARGET <b>{target}</b>
        </span>
        {state.running ? (
          <button type="button" className={styles.ctrl} onClick={stop}>
            STOP
          </button>
        ) : (
          <button
            type="button"
            className={cx(styles.ctrl, styles.ctrlPrimary)}
            onClick={mine}
            disabled={text.length === 0}
          >
            START SEARCH
          </button>
        )}
        {hasMined && (
          <span className={cx('mono', styles.badge, styles.badgeAccent)}>TARGET FOUND</span>
        )}
      </div>

      <div className={styles.progressTrack} role="progressbar" aria-valuenow={Math.round(progress * 100)}>
        <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoCell}>
          <span className={cx('mono', styles.infoKey)}>ATTEMPTS</span>
          <span className={styles.infoVal}>{groupDigits(state.attempts)}</span>
          <span className={cx('mono', styles.infoSub)}>HASHES TRIED</span>
        </div>
        <div className={styles.infoCell}>
          <span className={cx('mono', styles.infoKey)}>EXPECTED</span>
          <span className={styles.infoVal}>{groupDigits(expected)}</span>
          <span className={cx('mono', styles.infoSub)}>16^{difficulty} AVERAGE</span>
        </div>
        <div className={styles.infoCell}>
          <span className={cx('mono', styles.infoKey)}>TIME</span>
          <span className={styles.infoVal}>{(elapsed / 1000).toFixed(2)}</span>
          <span className={cx('mono', styles.infoSub)}>SECONDS</span>
        </div>
      </div>

      {state.done && state.digest && (
        <div className={cx(styles.resultCard, styles.resultOk)} aria-live="polite">
          <span className={cx('mono', styles.resultStatus)}>
            ✓ TARGET FOUND AT NONCE {groupDigits(state.nonce ?? 0)}
          </span>
          <span className={styles.resultText}>
            <span className={styles.hexZero}>{state.digest.slice(0, difficulty)}</span>
            {state.digest.slice(difficulty)}
          </span>
          <span className={cx('mono', styles.resultMeta)}>
            HASH OF “{text}#{state.nonce}” — {groupDigits(state.attempts)} ATTEMPTS
          </span>
        </div>
      )}

      {state.exhausted && !state.done && (
        <div className={styles.resultCard} aria-live="polite">
          <span className={cx('mono', styles.resultStatus)} style={{ color: 'var(--text-2)' }}>
            SEARCH STOPPED — NO SOLUTION WITHIN {groupDigits(MAX_ATTEMPTS)} ATTEMPTS
          </span>
          <span className={cx('mono', styles.resultMeta)}>
            THAT IS THE POINT: MORE DIFFICULTY COSTS EXPONENTIALLY MORE WORK.
          </span>
        </div>
      )}

      <p className={cx('mono', styles.note)}>
        EVERY EXTRA REQUIRED ZERO MULTIPLIES THE EXPECTED WORK BY 16. THIS IS WHY MINING
        IS EXPENSIVE AND WHY VERIFYING THE RESULT IS INSTANT.
      </p>
    </div>
  );
}
