import { useEffect, useRef, useState } from 'react';

type RevealResult<T extends HTMLElement> = {
  ref: React.RefObject<T>;
  inView: boolean;
};

/**
 * Reveals an element once it scrolls into view.
 * Fires a single time (then disconnects) so we never re-run layout work.
 * Falls back to "always visible" where IntersectionObserver is unavailable.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.18,
): RevealResult<T> {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        }
      },
      { threshold, rootMargin: '0px 0px -6% 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}
