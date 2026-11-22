import type { PipeId, TabId } from './types';

/** The five tutorial steps. Each drives the pipeline highlight and analysis tab. */
export type GuidedStep = {
  n: string;
  title: string;
  body: string;
  hint: string;
  stage: PipeId;
  tab: TabId;
};

export const GUIDED_STEPS: GuidedStep[] = [
  {
    n: '01',
    title: 'THE IMAGE',
    body: "JPEG begins with image information. Let's examine a small part of it.",
    hint: 'The image is shown as grayscale samples. Turn the grid on to see the tiles.',
    stage: 'image',
    tab: 'pixels',
  },
  {
    n: '02',
    title: 'THE BLOCK',
    body: 'An image is processed in small blocks. Select one and inspect its pixels.',
    hint: 'Click any tile on the image. Every panel follows the block you pick.',
    stage: 'blocks',
    tab: 'pixels',
  },
  {
    n: '03',
    title: 'THE TRANSFORM',
    body:
      'The DCT changes how information is represented, separating broad patterns from fine details.',
    hint: 'The coefficient grid now reflects your block — hover cells to inspect them.',
    stage: 'dct',
    tab: 'dct',
  },
  {
    n: '04',
    title: 'THE DECISION',
    body: 'Quantization reduces precision. Some information survives, while some is lost.',
    hint: 'Drag the quality slider and highlight the coefficients that round to zero.',
    stage: 'quantize',
    tab: 'quantize',
  },
  {
    n: '05',
    title: 'THE RESULT',
    body: 'Reconstruct the image. Compare what survived and what changed.',
    hint: 'Switch to SIDE-BY-SIDE or DIFFERENCE to see the cost of compression.',
    stage: 'result',
    tab: 'compare',
  },
];
