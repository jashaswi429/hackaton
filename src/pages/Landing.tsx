import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Concept } from '../components/Concept';
import { ExperimentIndex } from '../components/ExperimentIndex';
import { Philosophy } from '../components/Philosophy';
import { FinalCta } from '../components/FinalCta';
import { Footer } from '../components/Footer';
import { SECTION_IDS } from '../lib/content';

/**
 * QRYX landing page (PAGE 01) — the lab index.
 * Section order is fixed by the PRD; each section lives in its own
 * component + stylesheet so experiment pages can reuse the patterns.
 */
export function Landing() {
  return (
    <>
      <a className="sr-only" href={`#${SECTION_IDS.experiments}`}>
        Skip to experiments
      </a>
      <Navbar />
      <main id={SECTION_IDS.top}>
        <Hero />
        <Concept />
        <ExperimentIndex />
        <Philosophy />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
