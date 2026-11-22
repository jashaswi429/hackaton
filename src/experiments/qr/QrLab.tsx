import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { cx } from '../../lib/cx';
import { QrHeader } from './QrHeader';
import { QrHero } from './QrHero';
import { QrInput } from './QrInput';
import { QrMatrix } from './QrMatrix';
import { StructureExplorer } from './StructureExplorer';
import { EncodingPanel } from './EncodingPanel';
import { ErrorCorrectionPanel } from './ErrorCorrectionPanel';
import { DamageSimulator } from './DamageSimulator';
import { DecodePanel, type DecodeAttempt } from './DecodePanel';
import { ComparisonView } from './ComparisonView';
import { ObservationPanel } from './ObservationPanel';
import { GuidedTutorial } from './GuidedTutorial';
import { DEFAULT_TEXT, EC_LEVELS, detectMode, encodeQr } from './qr';
import {
  REGION,
  REGION_LABEL,
  alignmentPositions,
  classifyModules,
  finderRegionsIntact,
  getNumRawDataModules,
} from './structure';
import { applyDamage } from './damage';
import { decodeModules } from './decode';
import { GUIDED_STEPS } from './guided';
import type {
  DamagePosition,
  DamageShape,
  EcLevel,
  LabMode,
  ModuleRef,
  QrMode,
  QrTab,
  RegionLayer,
} from './types';
import styles from './qrlab.module.css';

const NUMERIC_RE = /^[0-9]+$/;
const ALPHANUMERIC_RE = /^[0-9A-Z $%*+\-./:]+$/;

const TABS: { id: QrTab; label: string }[] = [
  { id: 'structure', label: 'STRUCTURE' },
  { id: 'encoding', label: 'ENCODING' },
  { id: 'correction', label: 'ERROR CORRECTION' },
  { id: 'compare', label: 'COMPARE' },
];

const DEFAULT_AMOUNT = 20;

/** Experiment 002 — The QR Lab. */
export function QrLab() {
  /* ---- entry + mode + tutorial ---- */
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<LabMode>('explore');
  const [guidedStep, setGuidedStep] = useState(0);

  /* ---- input ---- */
  const [text, setText] = useState(DEFAULT_TEXT);
  const deferredText = useDeferredValue(text);
  const [forcedMode, setForcedMode] = useState<QrMode | null>(null);
  const [ec, setEc] = useState<EcLevel>('M');

  /* ---- inspection ---- */
  const [tab, setTab] = useState<QrTab>('structure');
  const [layers, setLayers] = useState<Set<RegionLayer>>(() => new Set());
  const [activeLayer, setActiveLayer] = useState<RegionLayer>('finder');
  const [selected, setSelected] = useState<ModuleRef | null>(null);

  /* ---- damage ---- */
  const [damageEnabled, setDamageEnabled] = useState(false);
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [shape, setShape] = useState<DamageShape>('square');
  const [position, setPosition] = useState<DamagePosition>('center');
  const [seed, setSeed] = useState(1);
  const [origin, setOrigin] = useState<ModuleRef | null>(null);

  /* ---- decode ---- */
  const [attempts, setAttempts] = useState<DecodeAttempt[] | null>(null);

  /* ---------------- encoding ---------------- */
  const detected = useMemo(() => detectMode(text), [text]);

  const modeAllowed = useMemo(
    (): Record<QrMode, boolean> => ({
      Numeric: text.length > 0 && NUMERIC_RE.test(text),
      Alphanumeric: text.length > 0 && ALPHANUMERIC_RE.test(text),
      Byte: text.length > 0,
    }),
    [text],
  );

  const effectiveMode = forcedMode && modeAllowed[forcedMode] ? forcedMode : undefined;

  const matrix = useMemo(
    () => encodeQr(deferredText, ec, effectiveMode),
    [deferredText, ec, effectiveMode],
  );

  const regionMap = useMemo(
    () => (matrix ? classifyModules(matrix.version) : null),
    [matrix],
  );

  const alignmentCount = matrix ? alignmentPositions(matrix.version).length : 0;

  /* ---------------- damage ---------------- */
  const damaged = useMemo(() => {
    if (!matrix || !damageEnabled || amount <= 0) return null;
    return applyDamage(matrix.modules, matrix.size, {
      amount,
      shape,
      position,
      seed,
      origin,
    });
  }, [matrix, damageEnabled, amount, shape, position, seed, origin]);

  /* ---------------- error-correction comparison ---------------- */
  const ecComparison = useMemo(
    () =>
      EC_LEVELS.map((level) => {
        const m = encodeQr(deferredText, level, effectiveMode);
        return m
          ? { level, version: m.version, size: m.size, ok: true }
          : { level, version: 0, size: 0, ok: false };
      }),
    [deferredText, effectiveMode],
  );

  /* ---------------- guided wiring ---------------- */
  useEffect(() => {
    if (mode !== 'guided') return;
    const s = GUIDED_STEPS[guidedStep];
    setTab(s.tab);
    if (s.actionKey === 'toggle-finder') {
      setLayers((prev) => new Set(prev).add('finder'));
      setActiveLayer('finder');
    }
    if (s.actionKey === 'damage-decode') {
      setDamageEnabled(true);
    }
  }, [mode, guidedStep]);

  const changeMode = useCallback((next: LabMode) => {
    setMode(next);
    if (next === 'guided') setGuidedStep(0);
  }, []);

  /* ---------------- actions ---------------- */
  const toggleLayer = useCallback((layer: RegionLayer) => {
    setLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  }, []);

  const handleDecode = useCallback(() => {
    if (!matrix) return;
    const next: DecodeAttempt[] = [
      {
        target: 'original',
        result: decodeModules(matrix.modules, matrix.size),
        finderIntact: true,
      },
    ];
    if (damaged) {
      next.push({
        target: 'damaged',
        result: decodeModules(damaged.modules, matrix.size),
        finderIntact: finderRegionsIntact(matrix.version, damaged.mask),
      });
    }
    setAttempts(next);
  }, [matrix, damaged]);

  const resetDamage = useCallback(() => {
    setAmount(DEFAULT_AMOUNT);
    setShape('square');
    setPosition('center');
    setOrigin(null);
    setSeed(1);
    setDamageEnabled(false);
    setAttempts(null);
  }, []);

  const hardReset = useCallback(() => {
    setText(DEFAULT_TEXT);
    setForcedMode(null);
    setEc('M');
    setTab('structure');
    setLayers(new Set());
    setActiveLayer('finder');
    setSelected(null);
    resetDamage();
    setMode('explore');
    setGuidedStep(0);
  }, [resetDamage]);

  const selectModule = useCallback((m: ModuleRef) => setSelected(m), []);

  const placeDamage = useCallback((m: ModuleRef) => {
    setOrigin(m);
    setPosition('user');
  }, []);

  /* ---------------- guided completion ---------------- */
  const guidedCompleted = useMemo(() => {
    switch (GUIDED_STEPS[guidedStep].actionKey) {
      case 'edit-text':
        return text !== DEFAULT_TEXT;
      case 'inspect':
        return selected !== null;
      case 'toggle-finder':
        return layers.has('finder');
      case 'damage-decode':
        return damageEnabled && attempts !== null;
      case 'compare':
        return attempts !== null;
      default:
        return false;
    }
  }, [guidedStep, text, selected, layers, damageEnabled, attempts]);

  /* ---------------- observations (all state-derived) ---------------- */
  const observations = useMemo(() => {
    const out: string[] = [];
    if (!matrix) return ['Enter a message to generate a QR code.'];

    out.push(
      `Your message is currently encoded in a Version ${matrix.version} QR code (${matrix.size} × ${matrix.size} modules).`,
    );

    const sizes = new Set(ecComparison.filter((c) => c.ok).map((c) => c.version));
    if (sizes.size > 1) {
      out.push('Changing error correction may require a larger QR version for this message.');
    }

    out.push(
      `Your input is written in ${matrix.mode.toLowerCase()} mode — the encoder confirmed this segment.`,
    );

    if (alignmentCount > 0) {
      out.push(
        `${alignmentCount} alignment pattern${alignmentCount === 1 ? '' : 's'} let a scanner correct for surface distortion.`,
      );
    }

    if (damaged) {
      const intact = finderRegionsIntact(matrix.version, damaged.mask);
      out.push(
        intact
          ? 'Your damage has not touched the finder patterns, so the scanner can still locate the code.'
          : 'Damage to finder patterns may prevent the scanner from locating the code.',
      );
    }

    const damagedAttempt = attempts?.find((a) => a.target === 'damaged');
    if (damagedAttempt) {
      out.push(
        damagedAttempt.result.ok
          ? 'Some damaged QR codes can still recover their original content.'
          : damagedAttempt.finderIntact
            ? 'The scanner located the code but could not error-correct this much damage.'
            : 'The symbol was too disrupted for the scanner to find it.',
      );
    }

    const codewords = Math.floor(getNumRawDataModules(matrix.version) / 8);
    out.push(`This symbol carries about ${codewords} codewords in total — data and error correction together.`);

    return out;
  }, [matrix, ecComparison, alignmentCount, damaged, attempts]);

  /* ---------------- module readout ---------------- */
  const readout = useMemo(() => {
    if (!matrix || !regionMap || !selected) return null;
    const idx = selected.row * matrix.size + selected.col;
    const code = regionMap[idx];
    const displayGrid = damaged ? damaged.modules : matrix.modules;
    return {
      coord: `X ${selected.col} · Y ${selected.row}`,
      type: REGION_LABEL[code] ?? 'DATA / EC',
      functional: code !== REGION.DATA,
      state: displayGrid[idx] ? 'DARK' : 'LIGHT',
      damaged: damaged?.mask[idx] === 1,
    };
  }, [matrix, regionMap, selected, damaged]);

  const displayModules = damaged ? damaged.modules : matrix?.modules ?? null;
  const hasError = text.length > 0 && !matrix;

  return (
    <div className={styles.page}>
      <QrHeader mode={mode} onModeChange={changeMode} onReset={hardReset} />

      {!started ? (
        <QrHero preview={matrix} onStart={() => setStarted(true)} />
      ) : (
        <main className={cx('container', styles.main)}>
          <div className={styles.workspace}>
            <div className={styles.stageCol}>
              <section className={cx(styles.panel, styles.stageCard)} aria-label="QR visualization">
                <div className={styles.panelHead}>
                  <span className={cx('mono', styles.panelTitle)}>QR MATRIX</span>
                  <span className={cx('mono', styles.panelMeta)}>
                    {matrix ? `V${matrix.version} · ${matrix.size}×${matrix.size} · EC ${matrix.ec}` : '—'}
                  </span>
                </div>

                {hasError && (
                  <div className={styles.stageError}>
                    MESSAGE COULD NOT BE ENCODED
                    <div className={cx('mono', styles.muted)} style={{ marginTop: 10 }}>
                      IT MAY BE TOO LONG FOR A VERSION-40 CODE.
                    </div>
                  </div>
                )}

                {!hasError && matrix && displayModules && regionMap && (
                  <QrMatrix
                    size={matrix.size}
                    display={displayModules}
                    mask={damaged ? damaged.mask : null}
                    regionMap={regionMap}
                    layers={layers}
                    selected={selected}
                    onSelect={selectModule}
                    placing={damageEnabled && position === 'user'}
                    onPlace={placeDamage}
                    label={`QR code, version ${matrix.version}`}
                  />
                )}

                {!hasError && !matrix && <div className={styles.stageEmpty}>ENTER A MESSAGE TO BEGIN</div>}

                <div className={styles.stageControls}>
                  <span className={cx('mono', styles.quietNote)}>
                    QUIET ZONE: 4 MODULES · CLICK A MODULE TO INSPECT IT
                  </span>
                  {damaged && (
                    <span className={cx('mono', styles.badge, styles.badgeWarn)}>VIEWING DAMAGED RENDER</span>
                  )}
                </div>
              </section>

              <section className={styles.panel} aria-label="Module readout" aria-live="polite">
                <div className={styles.panelHead}>
                  <span className={cx('mono', styles.panelTitle)}>SELECTED MODULE</span>
                </div>
                {readout ? (
                  <dl className={styles.readoutGrid}>
                    <dt className={cx('mono', styles.readoutKey)}>COORDINATE</dt>
                    <dd className={cx('mono', styles.readoutVal)}>{readout.coord}</dd>
                    <dt className={cx('mono', styles.readoutKey)}>TYPE</dt>
                    <dd className={cx('mono', styles.readoutVal, styles.readoutTag)}>{readout.type}</dd>
                    <dt className={cx('mono', styles.readoutKey)}>ROLE</dt>
                    <dd className={cx('mono', styles.readoutVal)}>
                      {readout.functional ? 'FUNCTIONAL PATTERN' : 'DATA / EC REGION'}
                    </dd>
                    <dt className={cx('mono', styles.readoutKey)}>STATE</dt>
                    <dd className={cx('mono', styles.readoutVal)}>
                      {readout.state}
                      {readout.damaged ? ' · DAMAGED' : ''}
                    </dd>
                  </dl>
                ) : (
                  <p className={cx('mono', styles.muted)} style={{ marginTop: 10 }}>
                    CLICK ANY MODULE ON THE QR CODE TO READ ITS PROPERTIES.
                  </p>
                )}
              </section>
            </div>

            <aside className={styles.sideCol}>
              {mode === 'guided' && (
                <GuidedTutorial
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

              <QrInput
                value={text}
                onChange={(v) => {
                  setText(v);
                  setSelected(null);
                  setAttempts(null);
                }}
                onClear={() => {
                  setText('');
                  setSelected(null);
                  setAttempts(null);
                }}
              />

              <DamageSimulator
                amount={amount}
                onAmount={setAmount}
                shape={shape}
                onShape={setShape}
                position={position}
                onPosition={setPosition}
                enabled={damageEnabled}
                onToggle={() => setDamageEnabled((v) => !v)}
                onReseed={() => setSeed((s) => s + 1)}
                onReset={resetDamage}
                damagedCount={damaged?.count ?? 0}
                totalModules={matrix ? matrix.size * matrix.size : 0}
                placing={damageEnabled && position === 'user'}
              />

              <DecodePanel
                attempts={attempts}
                onDecode={handleDecode}
                canDecode={Boolean(matrix)}
                hasDamage={damageEnabled}
              />

              <ObservationPanel observations={observations} />
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
              {!matrix && <p className={cx('mono', styles.muted)}>WAITING FOR A VALID MESSAGE…</p>}

              {matrix && regionMap && tab === 'structure' && (
                <StructureExplorer
                  layers={layers}
                  onToggle={toggleLayer}
                  regionMap={regionMap}
                  active={activeLayer}
                  onActive={setActiveLayer}
                  version={matrix.version}
                  alignmentCount={alignmentCount}
                  hasVersionInfo={matrix.version >= 7}
                />
              )}

              {matrix && tab === 'encoding' && (
                <EncodingPanel
                  text={text}
                  mode={matrix.mode}
                  detected={detected}
                  onModeChange={setForcedMode}
                  modeAllowed={modeAllowed}
                  version={matrix.version}
                  size={matrix.size}
                  ec={matrix.ec}
                />
              )}

              {matrix && tab === 'correction' && (
                <ErrorCorrectionPanel ec={ec} onEcChange={setEc} comparison={ecComparison} />
              )}

              {matrix && regionMap && tab === 'compare' && (
                <ComparisonView
                  matrix={matrix}
                  damaged={damaged}
                  regionMap={regionMap}
                  ec={ec}
                  amount={amount}
                  decodeAttempts={attempts}
                  onResetDamage={resetDamage}
                  onEnableDamage={() => setDamageEnabled(true)}
                />
              )}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
