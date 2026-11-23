import { useEffect, useMemo, useState } from 'react';
import { cx } from '../../lib/cx';
import { DigestGrid } from './DigestGrid';
import { bitDiff, bytesToBits, flipBit, hammingDistance, sha256, utf8Bytes } from './hash';
import styles from './hashlab.module.css';

const TRIAL_COUNT = 24;

type AvalanchePanelProps = {
  text: string;
  baseDigest: Uint8Array;
  hasFlipped: boolean;
  onFlipped: () => void;
};

/**
 * The AVALANCHE tab: flip a single input bit and watch ~half the output flip.
 * A good hash has no "small change" — this is the avalanche effect.
 */
export function AvalanchePanel({ text, baseDigest, hasFlipped, onFlipped }: AvalanchePanelProps) {
  const inputBytes = useMemo(() => utf8Bytes(text), [text]);
  const numBits = inputBytes.length * 8;

  const [bitIndex, setBitIndex] = useState(0);
  const [showFlip, setShowFlip] = useState(false);
  const [trials, setTrials] = useState<number[] | null>(null);

  // Keep the chosen bit in range and hide the comparison when the input changes.
  useEffect(() => {
    setShowFlip(false);
    setTrials(null);
    setBitIndex((b) => Math.min(Math.max(0, b), Math.max(0, numBits - 1)));
  }, [numBits, text]);

  const activeBit = Math.min(bitIndex, Math.max(0, numBits - 1));

  const flipped = useMemo(() => {
    if (numBits === 0) return null;
    const flippedBytes = flipBit(inputBytes, activeBit);
    const digest = sha256(flippedBytes);
    const diff = bitDiff(baseDigest, digest);
    return { digest, diff, distance: hammingDistance(baseDigest, digest) };
  }, [inputBytes, activeBit, numBits, baseDigest]);

  const percent = flipped ? (flipped.distance / 256) * 100 : 0;

  const handleFlip = () => {
    setShowFlip((v) => !v);
    if (!hasFlipped) onFlipped();
  };

  const runTrials = () => {
    const out: number[] = [];
    for (let t = 0; t < TRIAL_COUNT; t++) {
      const idx = Math.floor(Math.random() * numBits);
      const digest = sha256(flipBit(inputBytes, idx));
      out.push((hammingDistance(baseDigest, digest) / 256) * 100);
    }
    setTrials(out);
  };

  const empty = numBits === 0;

  return (
    <div className={styles.stack}>
      <p className={styles.explain}>
        Change one bit of the input and a good hash does <b>not</b> change a little —
        it changes all of it. On average, exactly <b>half</b> of the 256 output bits
        flip, and there is no way to predict which. This is the <b>avalanche effect</b>.
      </p>

      <div className={styles.field}>
        <div className={styles.sliderHead}>
          <span className={cx('mono', styles.fieldLabel)}>INPUT BIT TO FLIP</span>
          <span className={styles.sliderValue}>{empty ? '—' : activeBit}</span>
        </div>
        <input
          className={styles.slider}
          type="range"
          min={0}
          max={Math.max(0, numBits - 1)}
          value={activeBit}
          step={1}
          disabled={empty}
          onChange={(e) => {
            setBitIndex(Number(e.target.value));
            setShowFlip(false);
          }}
          aria-label="Input bit to flip"
        />
        <div className={styles.sliderScale}>
          <span className="mono">BIT 0</span>
          <span className="mono">{empty ? '' : `BIT ${Math.max(0, numBits - 1)}`}</span>
        </div>
      </div>

      <div className={styles.ctrlRow}>
        <button
          type="button"
          className={cx(styles.ctrl, styles.ctrlPrimary)}
          onClick={handleFlip}
          disabled={empty}
        >
          {showFlip ? 'HIDE COMPARISON' : 'FLIP THIS BIT'}
        </button>
        <span className={cx('mono', styles.muted)}>
          {showFlip && flipped
            ? `${flipped.distance} OF 256 BITS CHANGED (${percent.toFixed(1)}%)`
            : 'FLIP A BIT TO COMPARE THE DIGESTS'}
        </span>
      </div>

      {showFlip && flipped && (
        <div className={styles.avGrid}>
          <div className={styles.avCol}>
            <span className={cx('mono', styles.avLabel)}>ORIGINAL DIGEST</span>
            <div className={styles.dgFrame}>
              <DigestGrid
                bits={bytesToBits(baseDigest)}
                selected={null}
                onSelect={() => {}}
                label="Original digest"
              />
            </div>
          </div>
          <div className={styles.avCol}>
            <span className={cx('mono', styles.avLabel)}>
              AFTER FLIPPING BIT {activeBit}
            </span>
            <div className={styles.dgFrame}>
              <DigestGrid
                bits={bytesToBits(flipped.digest)}
                selected={null}
                onSelect={() => {}}
                label="Digest after flipping one input bit"
              />
            </div>
          </div>
        </div>
      )}

      {showFlip && flipped && (
        <div>
          <div className={styles.avLabel} style={{ marginBottom: 10 }}>
            <span className={cx('mono')}>WHICH BITS CHANGED</span>
            <span className={cx('mono', styles.accentText)}>
              {flipped.distance} / 256
            </span>
          </div>
          <div className={styles.dgFrame}>
            <DigestGrid
              bits={bytesToBits(flipped.digest)}
              diff={flipped.diff}
              selected={null}
              onSelect={() => {}}
              label="Bits that changed between the two digests"
            />
          </div>
          <div className={styles.meter} style={{ marginTop: 12 }}>
            <div className={styles.meterFill} style={{ width: `${percent}%` }} />
          </div>
          <div className={cx('mono', styles.midLine)} style={{ marginTop: 8 }}>
            <span>0%</span>
            <span style={{ marginLeft: 'auto' }}>{percent.toFixed(1)}% CHANGED</span>
            <span style={{ marginLeft: 'auto' }}>≈ 50% EXPECTED</span>
          </div>
        </div>
      )}

      <div>
        <div className={styles.panelHead} style={{ marginBottom: 10 }}>
          <span className={cx('mono', styles.panelTitle)}>
            {TRIAL_COUNT} RANDOM SINGLE-BIT FLIPS
          </span>
          <button type="button" className={styles.ctrl} onClick={runTrials} disabled={empty}>
            RUN TRIALS
          </button>
        </div>
        {trials ? (
          <>
            <div className={styles.bars} aria-label="Percentage of bits changed per trial">
              {trials.map((p, i) => (
                <div
                  key={i}
                  className={styles.bar}
                  style={{ height: `${Math.max(2, p)}%` }}
                  title={`${p.toFixed(1)}%`}
                />
              ))}
            </div>
            <div className={cx('mono', styles.midLine)} style={{ marginTop: 8 }}>
              <span>
                AVERAGE {(
                  trials.reduce((a, b) => a + b, 0) / trials.length
                ).toFixed(1)}
                % — ALWAYS NEAR 50%
              </span>
            </div>
          </>
        ) : (
          <div className={styles.dgFrame}>
            <p className={cx('mono', styles.muted)} style={{ margin: 0, fontSize: '0.62rem', letterSpacing: '0.1em' }}>
              RUN THE TRIALS TO SEE HOW CONSISTENTLY HALF THE BITS CHANGE.
            </p>
          </div>
        )}
      </div>

      <p className={cx('mono', styles.note)}>
        CHANGE ONE CHARACTER OF THE INPUT AND THE ENTIRE FINGERPRINT IS UNRECOGNISABLE.
        THIS IS WHY HASHES DETECT TAMPERING INSTANTLY.
      </p>
    </div>
  );
}
