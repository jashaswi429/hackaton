/*
 * Central content + anchor registry for the landing page.
 * Keeping copy and section ids here means future PRDs can restyle or
 * reorder without hunting through components.
 */

export const SECTION_IDS = {
  top: 'top',
  howItWorks: 'how-it-works',
  experiments: 'experiments',
  about: 'about',
} as const;

export type SectionId = (typeof SECTION_IDS)[keyof typeof SECTION_IDS];

export const NAV_LINKS: { id: SectionId; label: string }[] = [
  { id: SECTION_IDS.top, label: 'Lab' },
  { id: SECTION_IDS.experiments, label: 'Experiments' },
  { id: SECTION_IDS.about, label: 'About' },
];

/** The three-step explanation of how QRYX works. */
export const CONCEPT_STEPS = [
  {
    n: '01',
    key: 'EXPLORE',
    body: 'Enter a concept and examine how it works.',
  },
  {
    n: '02',
    key: 'INTERACT',
    body: 'Change parameters. Test ideas. Manipulate the system.',
  },
  {
    n: '03',
    key: 'UNDERSTAND',
    body: 'Observe the results and discover the underlying principles.',
  },
] as const;

/** Experiment 001 — the first live entry in the lab index. */
export const FEATURED_EXPERIMENT = {
  number: 'EXPERIMENT 001',
  title: 'THE JPEG LAB',
  description:
    'Discover how images are compressed. Explore pixels, the Discrete Cosine Transform, quantization and reconstruction.',
  category: 'IMAGE PROCESSING / COMPUTER SCIENCE',
  status: 'AVAILABLE',
  available: true,
  /** Hash route to the experiment; rendered as a real link so it deep-links. */
  href: '#/experiment/001',
} as const;

/**
 * Experiment 002 — the second live entry in the lab index.
 * Same prop shape as the featured experiment, so the index needs no changes.
 */
export const SECOND_EXPERIMENT = {
  number: 'EXPERIMENT 002',
  title: 'THE QR LAB',
  description:
    'A message hidden in a grid. Explore QR encoding, its fixed structures, and how error correction survives damage.',
  category: 'DATA / ENCODING / ERROR CORRECTION',
  status: 'AVAILABLE',
  available: true,
  href: '#/experiment/002',
} as const;

/**
 * Reserved slots for experiments that are not built yet. Rendered as clearly
 * labelled COMING SOON placeholders — never as fake interactive experiments.
 */
export const PLACEHOLDER_EXPERIMENTS = [
  {
    number: 'EXPERIMENT 003',
    title: 'TO BE ANNOUNCED',
    description: 'Reserved for a future experiment.',
    category: 'UNANNOUNCED',
    status: 'COMING SOON',
    available: false,
  },
] as const;
