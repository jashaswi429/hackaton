import { SECTION_IDS } from '../lib/content';
import { Reveal } from './ui/Reveal';
import { Section } from './ui/Section';
import styles from './Philosophy.module.css';

/** Philosophy — deliberately sparse and typographic to contrast the lab index. */
export function Philosophy() {
  return (
    <Section id={SECTION_IDS.about} tone="surface" labelledBy="about-title">
      <div className={styles.layout}>
        <Reveal>
          <span className={styles.accent} aria-hidden="true" />
        </Reveal>

        <Reveal delay={100}>
          <h2 id="about-title" className={styles.title}>
            The internet explains everything.
            <br />
            Almost nothing lets you experience it.
          </h2>
        </Reveal>

        <Reveal delay={200}>
          <p className={styles.body}>
            QRYX is built around exploration. Every experiment turns an
            abstract concept into something you can see, manipulate and
            understand.
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
