import {
  FEATURED_EXPERIMENT,
  SECOND_EXPERIMENT,
  THIRD_EXPERIMENT,
  SECTION_IDS,
} from '../lib/content';
import { ExperimentCard } from './ExperimentCard';
import { Eyebrow } from './ui/Eyebrow';
import { Reveal } from './ui/Reveal';
import { Section } from './ui/Section';
import styles from './ExperimentIndex.module.css';

/**
 * The lab index. Renders the experiment list; as new experiments ship, entries
 * are added here — no structural change required.
 */
export function ExperimentIndex() {
  return (
    <Section id={SECTION_IDS.experiments} labelledBy="lab-title">
      <div className={styles.head}>
        <Reveal>
          <Eyebrow>THE LAB / EXPERIMENTS</Eyebrow>
        </Reveal>
        <Reveal delay={100}>
          <h2 id="lab-title" className={styles.title}>
            Pick something.
            <br />
            Take it apart.
          </h2>
        </Reveal>
        <Reveal delay={180}>
          <p className={styles.support}>
            Every experiment is built to make an invisible process visible.
          </p>
        </Reveal>
      </div>

      <Reveal delay={120}>
        <div className={styles.list}>
          <ExperimentCard {...FEATURED_EXPERIMENT} />
          <ExperimentCard {...SECOND_EXPERIMENT} />
          <ExperimentCard {...THIRD_EXPERIMENT} />
        </div>
      </Reveal>
    </Section>
  );
}
