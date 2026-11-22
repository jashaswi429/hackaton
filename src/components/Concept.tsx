import { CONCEPT_STEPS, SECTION_IDS } from '../lib/content';
import { Eyebrow } from './ui/Eyebrow';
import { Reveal } from './ui/Reveal';
import { Section } from './ui/Section';
import styles from './Concept.module.css';

/** "You don't learn by watching." — explains the three-beat QRYX loop. */
export function Concept() {
  return (
    <Section id={SECTION_IDS.howItWorks} labelledBy="concept-title">
      <div className={styles.head}>
        <Reveal>
          <Eyebrow className={styles.eyebrow}>HOW IT WORKS</Eyebrow>
        </Reveal>
        <Reveal delay={80}>
          <h2 id="concept-title" className={styles.title}>
            You don&rsquo;t learn by watching.
            <br />
            You learn by messing with it.
          </h2>
        </Reveal>
        <Reveal delay={120}>
          <p className={styles.support}>
            Change a variable. Break a system. See what happens. Then
            understand why.
          </p>
        </Reveal>
      </div>

      <div className={styles.rail}>
        {CONCEPT_STEPS.map((step, i) => (
          <Reveal key={step.n} delay={i * 130} className={styles.step}>
            <div className={styles.stepHead}>
              <span className={styles.node} aria-hidden="true" />
              <span className={styles.num}>{step.n}</span>
            </div>
            <h3 className={styles.key}>{step.key}</h3>
            <p className={styles.body}>{step.body}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
