/*
 * Guided-mode script for Experiment 003.
 * Each step names the panel it points at and the interaction the learner is
 * asked to perform, so the tutorial can react to real state rather than
 * advancing on a timer.
 */

import type { HashTab } from './types';

export type GuidedAction = 'edit-text' | 'inspect' | 'flip-bit' | 'mine' | 'read';

export type GuidedStep = {
  n: string;
  title: string;
  body: string;
  action: string;
  actionKey: GuidedAction;
  tab: HashTab;
};

export const GUIDED_STEPS: GuidedStep[] = [
  {
    n: '01',
    title: 'A FINGERPRINT',
    body: 'A hash function turns any amount of data into a short, fixed-size fingerprint. Feed it a word or a whole book — the output is always 256 bits.',
    action: 'Type a message and watch its 256-bit digest appear.',
    actionKey: 'edit-text',
    tab: 'digest',
  },
  {
    n: '02',
    title: 'READ THE BITS',
    body: 'The digest is 32 bytes — 256 individual bits. No two inputs are supposed to share a fingerprint, so every bit matters.',
    action: 'Click any bit in the digest to read its position and value.',
    actionKey: 'inspect',
    tab: 'digest',
  },
  {
    n: '03',
    title: 'THE AVALANCHE EFFECT',
    body: 'Change a single bit of the input and roughly half the output bits flip. The digest looks completely unrelated — there is no small change on the other side.',
    action: 'Flip one bit of the input and compare the two digests.',
    actionKey: 'flip-bit',
    tab: 'avalanche',
  },
  {
    n: '04',
    title: 'ONE-WAY WORK',
    body: 'Because the output is unpredictable, the only way to hit a target is to try many inputs. Finding a digest that starts with a few zeros already takes thousands of attempts.',
    action: 'Run the work meter and hunt for a leading-zero digest.',
    actionKey: 'mine',
    tab: 'work',
  },
  {
    n: '05',
    title: 'THE LIMIT',
    body: 'Those same properties make hashes useful for integrity and proof-of-work — and they are why collisions are astronomically unlikely rather than merely hard.',
    action: 'Review the observations and finish.',
    actionKey: 'read',
    tab: 'work',
  },
];

export const GUIDED_END = 'Experiment complete. Now hash it your way.';
