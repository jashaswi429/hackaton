import { useEffect, useState } from 'react';

/*
 * Minimal, dependency-free hash router.
 * QRYX has two surfaces — the lab index (landing) and individual experiments —
 * and hash routing keeps deep links working on any static host without adding
 * a routing library.
 */

export const ROUTES = {
  landing: '#/',
  jpegLab: '#/experiment/001',
  qrLab: '#/experiment/002',
} as const;

export type RouteName = 'landing' | 'jpegLab' | 'qrLab';

/** Map a location hash to a route name. Unknown hashes fall back to landing. */
export function routeFromHash(hash: string): RouteName {
  const clean = hash.replace(/^#/, '').replace(/\/+$/, '');
  if (clean === '/experiment/001') return 'jpegLab';
  if (clean === '/experiment/002') return 'qrLab';
  return 'landing';
}

/** Programmatic navigation (used by "Back to Lab" etc.). */
export function navigate(hash: string): void {
  if (typeof window === 'undefined') return;
  if (window.location.hash === hash) return;
  window.location.hash = hash;
}

/** Subscribe to the current route. */
export function useRoute(): RouteName {
  const [route, setRoute] = useState<RouteName>(() =>
    typeof window === 'undefined' ? 'landing' : routeFromHash(window.location.hash),
  );

  useEffect(() => {
    const onChange = () => setRoute(routeFromHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}
