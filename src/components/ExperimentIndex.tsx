import {
  FEATURED_EXPERIMENT,
  PLACEHOLDER_EXPERIMENTS,
  SECOND_EXPERIMENT,
  SECTION_IDS,
} from '../lib/content';
import { ExperimentCard } from './ExperimentCard';
import { Eyebrow } from './ui/Eyebrow';
import { Reveal } from './ui/Reveal';
import { Section } from './ui/Section';
import styles from './ExperimentIndex.module.css';

/**
 * The lab index. Renders the experiment list; for the first release there is
 * a single, still-unannounced slot. Future PRDs add entries to the list —
 * no structural change required here.
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
          {PLACEHOLDER_EXPERIMENTS.map((experiment) => (
            <ExperimentCard key={experiment.number} {...experiment} />
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
