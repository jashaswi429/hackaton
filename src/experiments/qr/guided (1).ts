/*
 * Guided-mode script for Experiment 002.
 * Each step names the panel it points at and the interaction the learner is
 * asked to perform, so the tutorial can react to real state rather than
 * advancing on a timer.
 */

import type { QrTab } from './types';

export type GuidedAction =
  | 'edit-text'
  | 'inspect'
  | 'toggle-finder'
  | 'damage-decode'
  | 'compare';

export type GuidedStep = {
  n: string;
  title: string;
  body: string;
  action: string;
  actionKey: GuidedAction;
  tab: QrTab;
};

export const GUIDED_STEPS: GuidedStep[] = [
  {
    n: '01',
    title: 'THE MESSAGE',
    body: 'Everything starts with information. A QR code must first convert your message into a format computers can represent.',
    action: 'Enter or change the message.',
    actionKey: 'edit-text',
    tab: 'encoding',
  },
  {
    n: '02',
    title: 'THE GRID',
    body: 'Your message is transformed into a pattern of black and white modules.',
    action: 'Inspect the generated QR code.',
    actionKey: 'inspect',
    tab: 'encoding',
  },
  {
    n: '03',
    title: 'FIND THE STRUCTURE',
    body: "Those large corner squares aren't decoration. They help a scanner locate and orient the code.",
    action: 'Toggle the FINDER PATTERNS layer.',
    actionKey: 'toggle-finder',
    tab: 'structure',
  },
  {
    n: '04',
    title: 'DAMAGE',
    body: 'QR codes contain redundancy. That extra information helps recover data when parts of the code are damaged.',
    action: 'Introduce controlled damage, then attempt to decode.',
    actionKey: 'damage-decode',
    tab: 'compare',
  },
  {
    n: '05',
    title: 'THE LIMIT',
    body: 'Error correction is powerful, but not unlimited. Damage to critical structures, severe distortion or too much missing information can make recovery impossible.',
    action: 'Compare the original and damaged QR codes.',
    actionKey: 'compare',
    tab: 'compare',
  },
];

export const GUIDED_END = 'Experiment complete. Now break it yourself.';
