import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { cx } from '../../lib/cx';
import { HashHeader } from './HashHeader';
import { HashHero } from './HashHero';
import { HashInput } from './HashInput';
import { HashGuided } from './HashGuided';
import { HashObservations } from './HashObservations';
import { DigestGrid } from './DigestGrid';
import { DigestPanel } from './DigestPanel';
import { AvalanchePanel } from './AvalanchePanel';
import { WorkPanel } from './WorkPanel';
import { bytesToBits, sha256, toHex, utf8Bytes } from './hash';
import { GUIDED_STEPS } from './guided';
import type { BitRef, HashTab, LabMode } from './types';
import styles from './hashlab.module.css';

const DEFAULT_TEXT = 'QRYX';

const TABS: { id: HashTab; label: string }[] = [
  { id: 'digest', label: 'DIGEST' },
  { id: 'avalanche', label: 'AVALANCHE' },
  { id: 'work', label: 'WORK' },
];

/** Experiment 003 — The Hash Lab. */
export function HashLab() {
  /* ---- entry + mode + tutorial ---- */
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<LabMode>('explore');
  const [guidedStep, setGuidedStep] = useState(0);

  /* ---- input ---- */
  const [text, setText] = useState(DEFAULT_TEXT);
  const deferredText = useDeferredValue(text);

  /* ---- inspection ---- */
  const [tab, setTab] = useState<HashTab>('digest');
  const [selected, setSelected] = useState<BitRef | null>(null);

  /* ---- guided progress ---- */
  const [hasFlipped, setHasFlipped] = useState(false);
  const [hasMined, setHasMined] = useState(false);

  /* ---------------- hashing ---------------- */
  const inputBytes = useMemo(() => utf8Bytes(deferredText), [deferredText]);
  const digest = useMemo(() => sha256(inputBytes), [inputBytes]);
  const hex = useMemo(() => toHex(digest), [digest]);
  const bits = useMemo(() => bytesToBits(digest), [digest]);
  const chunks = useMemo(() => hex.match(/.{1,8}/g) ?? [], [hex]);

  /* ---------------- guided wiring ---------------- */
  useEffect(() => {
    if (mode !== 'guided') return;
    setTab(GUIDED_STEPS[guidedStep].tab);
  }, [mode, guidedStep]);

  const changeMode = useCallback((next: LabMode) => {
    setMode(next);
    if (next === 'guided') setGuidedStep(0);
  }, []);

  const hardReset = useCallback(() => {
    setText(DEFAULT_TEXT);
    setTab('digest');
    setSelected(null);
    setHasFlipped(false);
    setHasMined(false);
    setMode('explore');
    setGuidedStep(0);
  }, []);

  const selectBit = useCallback((b: BitRef) => setSelected(b), []);

  /* ---------------- guided completion ---------------- */
  const guidedCompleted = useMemo(() => {
    switch (GUIDED_STEPS[guidedStep].actionKey) {
      case 'edit-text':
        return text !== DEFAULT_TEXT;
      case 'inspect':
        return selected !== null;
      case 'flip-bit':
        return hasFlipped;
      case 'mine':
        return hasMined;
      default:
        return true;
    }
  }, [guidedStep, text, selected, hasFlipped, hasMined]);

  /* ---------------- selected-bit readout ---------------- */
  const readout = useMemo(() => {
    if (!selected) return null;
    const pos = selected.byte * 8 + selected.bit;
    return {
      byte: `#${selected.byte} · 0x${selected.byte.toString(16).padStart(2, '0').toUpperCase()}`,
      bit: `${selected.bit} · MSB-FIRST`,
      pos: `${pos} / 255`,
      hexByte: digest[selected.byte].toString(16).padStart(2, '0').toUpperCase(),
      value: bits[pos] ? '1' : '0',
    };
  }, [selected, digest, bits]);

  /* ---------------- observations (all state-derived) ---------------- */
  const observations = useMemo(() => {
    const out: string[] = [];
    out.push(
      `SHA-256 hashed your ${inputBytes.length}-byte input into a fixed 256-bit digest — it begins ${hex.slice(0, 12)}…`,
    );
    if (text.length === 0) {
      out.push('The empty string has a well-defined digest too: e3b0c442… — hashing never needs “no answer”.');
    }
    out.push('The digest is always 32 bytes, whatever the input length. That fixed size is what makes it usable as an ID.');
    if (hasFlipped) {
      out.push('Flipping a single input bit changed about half of the output bits — the avalanche effect.');
    }
    if (hasMined) {
      out.push('You found a target prefix by guessing and checking, because a hash cannot be inverted directly.');
    }
    return out;
  }, [inputBytes.length, hex, text.length, hasFlipped, hasMined]);

  return (
    <div className={styles.page}>
      <HashHeader mode={mode} onModeChange={changeMode} onReset={hardReset} />

      {!started ? (
        <HashHero digest={digest} hex={hex} onStart={() => setStarted(true)} />
      ) : (
        <main className={cx('container', styles.main)}>
          <div className={styles.workspace}>
            <div className={styles.stageCol}>
              <section className={cx(styles.panel, styles.stageCard)} aria-label="Digest visualization">
                <div className={styles.panelHead}>
                  <span className={cx('mono', styles.panelTitle)}>SHA-256 DIGEST</span>
                  <span className={cx('mono', styles.panelMeta)}>
                    {inputBytes.length} BYTE INPUT · 256-BIT OUTPUT
                  </span>
                </div>

                <div className={styles.dgFrame}>
                  <DigestGrid
                    bits={bits}
                    selected={selected}
                    onSelect={selectBit}
                    label="SHA-256 digest, 256 bits"
                  />
                </div>

                <div className={styles.hexBlock} aria-label="Digest in hexadecimal">
                  {chunks.map((chunk, i) => (
                    <span key={i} className={styles.hexChunk}>
                      {chunk}
                    </span>
                  ))}
                </div>

                <div className={styles.stageControls}>
                  <span className={cx('mono', styles.quietNote)}>
                    CLICK ANY BIT TO INSPECT IT · ROW LABELS SHOW THE FIRST BYTE INDEX
                  </span>
                  <span className={cx('mono', styles.badge, styles.badgeAccent)}>
                    SHA-256
                  </span>
                </div>
              </section>

              <section className={styles.panel} aria-label="Selected bit readout" aria-live="polite">
                <div className={styles.panelHead}>
                  <span className={cx('mono', styles.panelTitle)}>SELECTED BIT</span>
                </div>
                {readout ? (
                  <dl className={styles.readoutGrid}>
                    <dt className={cx('mono', styles.readoutKey)}>BYTE</dt>
                    <dd className={cx('mono', styles.readoutVal)}>{readout.byte}</dd>
                    <dt className={cx('mono', styles.readoutKey)}>BIT</dt>
                    <dd className={cx('mono', styles.readoutVal)}>{readout.bit}</dd>
                    <dt className={cx('mono', styles.readoutKey)}>POSITION</dt>
                    <dd className={cx('mono', styles.readoutVal)}>{readout.pos}</dd>
                    <dt className={cx('mono', styles.readoutKey)}>BYTE VALUE</dt>
                    <dd className={cx('mono', styles.readoutVal, styles.readoutTag)}>0x{readout.hexByte}</dd>
                    <dt className={cx('mono', styles.readoutKey)}>VALUE</dt>
                    <dd className={cx('mono', styles.readoutVal)}>{readout.value}</dd>
                  </dl>
                ) : (
                  <p className={cx('mono', styles.muted)} style={{ marginTop: 10 }}>
                    CLICK ANY BIT IN THE DIGEST TO READ ITS POSITION AND VALUE.
                  </p>
                )}
              </section>
            </div>

            <aside className={styles.sideCol}>
              {mode === 'guided' && (
                <HashGuided
                  step={GUIDED_STEPS[guidedStep]}
                  index={guidedStep}
                  total={GUIDED_STEPS.length}
                  completed={guidedCompleted}
                  onPrev={() => setGuidedStep((s) => Math.max(0, s - 1))}
                  onNext={() => setGuidedStep((s) => Math.min(GUIDED_STEPS.length - 1, s + 1))}
                  onSkip={() => setGuidedStep(GUIDED_STEPS.length - 1)}
                  onExit={() => changeMode('explore')}
                />
              )}

              <HashInput
                value={text}
                onChange={(v) => {
                  setText(v);
                  setSelected(null);
                }}
                onClear={() => {
                  setText('');
                  setSelected(null);
                }}
              />

              <HashObservations observations={observations} />
            </aside>
          </div>

          <section className={styles.analysis} aria-label="Analysis">
            <div className={styles.tabs} role="tablist" aria-label="Analysis panels">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  className={cx(styles.tab, tab === t.id && styles.tabActive)}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className={styles.tabPanel} role="tabpanel">
              {tab === 'digest' && (
                <DigestPanel
                  text={text}
                  digest={digest}
                  hex={hex}
                  selected={selected}
                  onSelect={selectBit}
                />
              )}
              {tab === 'avalanche' && (
                <AvalanchePanel
                  text={text}
                  baseDigest={digest}
                  hasFlipped={hasFlipped}
                  onFlipped={() => setHasFlipped(true)}
                />
              )}
              {tab === 'work' && (
                <WorkPanel
                  text={text}
                  hasMined={hasMined}
                  onMined={() => setHasMined(true)}
                />
              )}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
