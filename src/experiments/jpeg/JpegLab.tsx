import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { cx } from '../../lib/cx';
import { LabHeader } from './LabHeader';
import { Pipeline } from './Pipeline';
import { ImageStage } from './ImageStage';
import { QualitySlider } from './QualitySlider';
import { PixelPanel } from './PixelPanel';
import { DctPanel } from './DctPanel';
import { QuantPanel } from './QuantPanel';
import { ComparePanel } from './ComparePanel';
import { LearnPanel } from './LearnPanel';
import { GuidedCard } from './GuidedCard';
import { GUIDED_STEPS } from './guided';
import {
  buildQuantTable,
  errorStats,
  extractBlock,
  processBlock,
  reconstructGrayscale,
  signedDifference,
} from './math';
import {
  SAMPLE_URL,
  blockCount,
  decodeImage,
  diffToImageData,
  grayToImageData,
  prepareGray,
  type GrayImage,
} from './image';
import type { BlockRef, CoeffRef, LabMode, PipeId, TabId, ViewMode } from './types';
import styles from './lab.module.css';

const DEFAULT_QUALITY = 75;
const pad2 = (n: number) => String(n).padStart(2, '0');

const TABS: { id: TabId; label: string }[] = [
  { id: 'pixels', label: 'PIXELS' },
  { id: 'dct', label: 'DCT' },
  { id: 'quantize', label: 'QUANTIZE' },
  { id: 'compare', label: 'COMPARE' },
  { id: 'learn', label: 'LEARN' },
];

const STAGE_TAB: Record<PipeId, TabId> = {
  image: 'pixels',
  blocks: 'pixels',
  dct: 'dct',
  quantize: 'quantize',
  idct: 'compare',
  result: 'compare',
};

/** Experiment 001 — The JPEG Lab. */
export function JpegLab() {
  /* ---- mode + tutorial ---- */
  const [mode, setMode] = useState<LabMode>('explore');
  const [step, setStep] = useState(0);

  /* ---- image ---- */
  const [gray, setGray] = useState<GrayImage | null>(null);
  const [sourceName, setSourceName] = useState('BUNDLED SAMPLE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---- controls ---- */
  const [quality, setQuality] = useState(DEFAULT_QUALITY);
  const deferredQuality = useDeferredValue(quality);
  const [viewMode, setViewMode] = useState<ViewMode>('side-by-side');
  const [showGrid, setShowGrid] = useState(true);
  const [showValues, setShowValues] = useState(false);
  const [highlightZeros, setHighlightZeros] = useState(false);

  /* ---- selection ---- */
  const [block, setBlock] = useState<BlockRef>({ bx: 0, by: 0 });
  const [hoveredBlock, setHoveredBlock] = useState<BlockRef | null>(null);
  const [coeff, setCoeff] = useState<CoeffRef>({ u: 0, v: 0 });

  /* ---- pipeline + analysis navigation ---- */
  const [tab, setTab] = useState<TabId>('pixels');
  const [stage, setStage] = useState<PipeId>('image');

  /* ---------------- image loading (all local) ---------------- */
  const loadImage = useCallback(async (source: Blob | string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const img = await decodeImage(source);
      const prepared = prepareGray(img);
      setGray(prepared);
      setSourceName(`${name} · ${prepared.width}×${prepared.height}`);
      const c = blockCount(prepared.width, prepared.height);
      setBlock({ bx: Math.floor(c.cols / 2), by: Math.floor(c.rows / 2) });
      setCoeff({ u: 0, v: 0 });
      setHoveredBlock(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load that image.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSample = useCallback(() => {
    void loadImage(SAMPLE_URL, 'BUNDLED SAMPLE');
  }, [loadImage]);

  useEffect(() => {
    void loadImage(SAMPLE_URL, 'BUNDLED SAMPLE');
  }, [loadImage]);

  const handleUpload = useCallback(
    (file: File) => {
      void loadImage(file, file.name.toUpperCase().slice(0, 40));
    },
    [loadImage],
  );

  /* ---------------- derived maths ---------------- */
  const table = useMemo(() => buildQuantTable(quality), [quality]);
  const imageTable = useMemo(() => buildQuantTable(deferredQuality), [deferredQuality]);

  const blockPipeline = useMemo(() => {
    if (!gray) return null;
    const samples = extractBlock(gray.data, gray.width, block.bx, block.by);
    return processBlock(samples, table);
  }, [gray, block.bx, block.by, table]);

  const reconGray = useMemo(() => {
    if (!gray) return null;
    return reconstructGrayscale(gray.data, gray.width, gray.height, imageTable);
  }, [gray, imageTable]);

  const diffGray = useMemo(
    () => (gray && reconGray ? signedDifference(gray.data, reconGray) : null),
    [gray, reconGray],
  );

  const stats = useMemo(
    () => (gray && reconGray ? errorStats(gray.data, reconGray) : null),
    [gray, reconGray],
  );

  const originalData = useMemo(
    () => (gray ? grayToImageData(gray.data, gray.width, gray.height) : null),
    [gray],
  );
  const reconData = useMemo(
    () => (gray && reconGray ? grayToImageData(reconGray, gray.width, gray.height) : null),
    [gray, reconGray],
  );
  const diffData = useMemo(
    () => (gray && diffGray ? diffToImageData(diffGray, gray.width, gray.height) : null),
    [gray, diffGray],
  );

  /* ---------------- guided mode wiring ---------------- */
  useEffect(() => {
    if (mode !== 'guided') return;
    const s = GUIDED_STEPS[step];
    setStage(s.stage);
    setTab(s.tab);
    if (step === 0) setShowGrid(true);
    if (step === 3) setHighlightZeros(true);
  }, [mode, step]);

  const changeMode = useCallback((next: LabMode) => {
    setMode(next);
    if (next === 'guided') setStep(0);
  }, []);

  const selectStage = useCallback((id: PipeId) => {
    setStage(id);
    setTab(STAGE_TAB[id]);
  }, []);

  /* ---------------- actions ---------------- */
  const resetAll = useCallback(() => {
    setQuality(DEFAULT_QUALITY);
    setViewMode('side-by-side');
    setShowGrid(true);
    setShowValues(false);
    setHighlightZeros(false);
    setCoeff({ u: 0, v: 0 });
    setHoveredBlock(null);
    setMode('explore');
    setStep(0);
    setTab('pixels');
    setStage('image');
    loadSample();
  }, [loadSample]);

  const resetImage = useCallback(() => {
    setViewMode('side-by-side');
    setShowGrid(true);
    setCoeff({ u: 0, v: 0 });
    setHoveredBlock(null);
    loadSample();
  }, [loadSample]);

  /* ---------------- render ---------------- */
  const zeros = blockPipeline ? blockPipeline.quantized.filter((v) => v === 0).length : 0;
  const dc = blockPipeline ? blockPipeline.coefficients[0] : 0;

  return (
    <div className={styles.page}>
      <LabHeader mode={mode} onModeChange={changeMode} onReset={resetAll} />

      <Pipeline active={stage} onSelect={selectStage} />

      <main className={cx('container', styles.main)}>
        <div className={styles.workspace}>
          <div className={styles.stageCol}>
            <ImageStage
              gray={gray}
              originalData={originalData}
              reconData={reconData}
              diffData={diffData}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              showGrid={showGrid}
              onToggleGrid={() => setShowGrid((v) => !v)}
              selected={block}
              hovered={hoveredBlock}
              onHoverBlock={setHoveredBlock}
              onSelectBlock={setBlock}
              stats={stats}
              diffGain={5}
              error={error}
              loading={loading}
              sourceName={sourceName}
              onUpload={handleUpload}
              onSample={loadSample}
              onResetImage={resetImage}
            />
          </div>

          <aside className={styles.sideCol}>
            <QualitySlider quality={quality} onQualityChange={setQuality} />

            {mode === 'guided' ? (
              <GuidedCard
                step={GUIDED_STEPS[step]}
                index={step}
                total={GUIDED_STEPS.length}
                onPrev={() => setStep((s) => Math.max(0, s - 1))}
                onNext={() => setStep((s) => Math.min(GUIDED_STEPS.length - 1, s + 1))}
                onSkip={() => setStep(GUIDED_STEPS.length - 1)}
                onExit={() => changeMode('explore')}
              />
            ) : (
              <section className={styles.selectionCard} aria-label="Current selection">
                <span className={cx('mono', styles.panelTitle)}>CURRENT SELECTION</span>
                <dl className={styles.selectionGrid}>
                  <dt className={cx('mono', styles.selKey)}>BLOCK</dt>
                  <dd className={cx('mono', styles.selVal)}>
                    X {pad2(block.bx)} · Y {pad2(block.by)}
                  </dd>
                  <dt className={cx('mono', styles.selKey)}>DC COEFF</dt>
                  <dd className={cx('mono', styles.selVal)}>{dc.toFixed(1)}</dd>
                  <dt className={cx('mono', styles.selKey)}>ZEROED</dt>
                  <dd className={cx('mono', styles.selVal)}>{zeros} / 64</dd>
                  <dt className={cx('mono', styles.selKey)}>PSNR</dt>
                  <dd className={cx('mono', styles.selVal)}>
                    {stats && Number.isFinite(stats.psnr) ? `${stats.psnr.toFixed(1)} DB` : '∞'}
                  </dd>
                </dl>
                <p className={cx('mono', styles.selHint)}>
                  CLICK A TILE ON THE IMAGE · DRAG THE SLIDER · OPEN A TAB BELOW
                </p>
              </section>
            )}
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
            {!blockPipeline && (
              <p className={cx('mono', styles.muted)}>WAITING FOR AN IMAGE…</p>
            )}

            {blockPipeline && tab === 'pixels' && (
              <PixelPanel
                block={block}
                pixels={blockPipeline.pixels}
                shifted={blockPipeline.shifted}
                showValues={showValues}
                onToggleValues={() => setShowValues((v) => !v)}
              />
            )}

            {blockPipeline && tab === 'dct' && (
              <DctPanel
                coefficients={blockPipeline.coefficients}
                selected={coeff}
                onSelect={setCoeff}
                showValues={showValues}
                onToggleValues={() => setShowValues((v) => !v)}
              />
            )}

            {blockPipeline && tab === 'quantize' && (
              <QuantPanel
                table={table}
                coefficients={blockPipeline.coefficients}
                quantized={blockPipeline.quantized}
                dequantized={blockPipeline.dequantized}
                selected={coeff}
                onSelect={setCoeff}
                showValues={showValues}
                onToggleValues={() => setShowValues((v) => !v)}
                highlightZeros={highlightZeros}
                onToggleZeros={() => setHighlightZeros((v) => !v)}
              />
            )}

            {blockPipeline && tab === 'compare' && (
              <ComparePanel
                block={block}
                pixels={blockPipeline.pixels}
                reconstructed={blockPipeline.reconstructed}
                difference={blockPipeline.difference}
                showValues={showValues}
                onToggleValues={() => setShowValues((v) => !v)}
                stats={stats}
              />
            )}

            {tab === 'learn' && <LearnPanel />}
          </div>
        </section>
      </main>
    </div>
  );
}
