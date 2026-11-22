import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { cx } from '../lib/cx';
import { SECTION_IDS } from '../lib/content';
import { scrollToId } from '../lib/scroll';
import { Button } from './ui/Button';
import { Eyebrow } from './ui/Eyebrow';
import { HeroField } from './HeroField';
import styles from './Hero.module.css';

/**
 * Hero: asymmetric two-column opening.
 * Left = message + CTAs, right = the live interactive field.
 * Each block cascades in on mount; delays are explicit so the reading
 * order (label → title → description → actions → field) is intentional.
 */
export function Hero() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const anim = (delay: number, extra?: string) => ({
    className: cx(styles.item, extra, loaded && styles.in),
    style: { transitionDelay: `${delay}ms` } as CSSProperties,
  });

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={cx('container', styles.grid)}>
        <div className={styles.copy}>
          <div {...anim(80)}>
            <Eyebrow>INTERACTIVE KNOWLEDGE LAB / 001</Eyebrow>
          </div>

          <h1 id="hero-title" {...anim(180)}>
            <span className={styles.titleText}>
              Understand what&rsquo;s
              <br />
              happening beneath
              <br />
              the surface.
            </span>
          </h1>

          <p {...anim(320)}>
            <span className={styles.desc}>
              Explore the systems, algorithms and ideas shaping technology.
              Don&rsquo;t just read about them. Experiment.
            </span>
          </p>

          <div {...anim(440, styles.actions)}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => scrollToId(SECTION_IDS.experiments)}
            >
              ENTER THE LAB <span aria-hidden="true">↗</span>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => scrollToId(SECTION_IDS.howItWorks)}
            >
              HOW IT WORKS <span aria-hidden="true">↓</span>
            </Button>
          </div>
        </div>

        <div {...anim(560, styles.visual)}>
          <HeroField />
          <div className={styles.caption}>
            <span className="mono">FIG. 01 — PROXIMITY FIELD</span>
            <span className={cx('mono', styles.hint)}>
              <span className={styles.desktopHint}>MOVE YOUR CURSOR ↗</span>
              <span className={styles.touchHint}>DRAG TO PERTURB ↗</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
