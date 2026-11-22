import { SECTION_IDS } from '../lib/content';
import { scrollToId } from '../lib/scroll';
import { Button } from './ui/Button';
import { Reveal } from './ui/Reveal';
import { Section } from './ui/Section';
import styles from './FinalCta.module.css';

/** Closing call to action — returns the visitor to the experiment index. */
export function FinalCta() {
  return (
    <Section className={styles.section}>
      <div className={styles.inner}>
        <Reveal>
          <h2 className={styles.title}>Curiosity is the starting point.</h2>
        </Reveal>
        <Reveal delay={120}>
          <p className={styles.support}>Step inside. Start experimenting.</p>
        </Reveal>
        <Reveal delay={220}>
          <div className={styles.action}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => scrollToId(SECTION_IDS.experiments)}
            >
              EXPLORE EXPERIMENTS <span aria-hidden="true">↑</span>
            </Button>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
