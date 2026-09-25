import { C, circle, dot, ellipse, group, limb, line, mirror, shape } from './parts';

/** Full-body character in a 200×200 box. Chunky, rounded shapes in the reference style. */

const shadow = `<ellipse cx="100" cy="187" rx="38" ry="5" fill="${C.ink}" opacity="0.07"/>`;
const cheeks = (a: number, b: number, y: number) =>
  `<circle cx="${a}" cy="${y}" r="3" fill="${C.cheek}" opacity="0.75"/>` +
  `<circle cx="${b}" cy="${y}" r="3" fill="${C.cheek}" opacity="0.75"/>`;

function headFront() {
  return (
    circle(100, 12, 8, C.hair) +
    circle(100, 33, 17, C.skin) +
    // Hair with a soft fringe swept to one side.
    shape('M83 34 C80 12 120 12 117 34 C113 27 106 23 98 25 C92 25 86 28 83 34 Z', C.hair) +
    dot(94, 36, 2) +
    dot(106, 36, 2) +
    line('M96 42 Q100 45.5 104 42', 2.2) +
    cheeks(89.5, 110.5, 41)
  );
}

function headBack() {
  return (
    circle(100, 12, 8, C.hair) +
    circle(100, 33, 17, C.hair) +
    line('M93 22 Q100 30 99 47', 1.6, '#4a4a4a') +
    line('M107 22 Q101 30 101 47', 1.6, '#4a4a4a')
  );
}

type Arms = 'relaxed' | 'flexed';

function arms(pose: Arms) {
  if (pose === 'flexed') {
    // Double-biceps: upper arms out, forearms up, fists by the head.
    return (
      limb('M86 62 C76 60 68 62 62 66 C58 58 57 50 58 42', 10, C.skin) +
      circle(58, 38, 6, C.skin) +
      limb('M114 62 C124 60 132 62 138 66 C142 58 143 50 142 42', 10, C.skin) +
      circle(142, 38, 6, C.skin)
    );
  }
  return (
    limb('M86 62 C79 72 76 86 75 103', 10, C.skin) +
    limb('M114 62 C121 72 124 86 125 103', 10, C.skin)
  );
}

const torso = shape(
  'M82 60 C90 53 110 53 118 60 C122 72 120 88 115 101 L85 101 C80 88 78 72 82 60 Z',
  C.top,
);
const neck = limb('M100 49 L100 55', 7, C.skin);
/** Wide trousers as one shape: two legs split at the crotch. */
const pants = shape(
  'M84 98 L116 98 C119 128 119 158 118 177 L103 177 C103 158 102 136 100 121 C98 136 97 158 97 177 L82 177 C81 158 81 128 84 98 Z',
  C.pants,
);
const shoes = ellipse(89, 181, 9, 4.2, C.skin) + ellipse(111, 181, 9, 4.2, C.skin);

/** Everything slightly enlarged to fill the card. */
const fit = (content: string) => group(content, 'translate(-6 -1) scale(1.06)');

export function bodyFront(pose: Arms = 'relaxed') {
  return fit(shadow + pants + shoes + arms(pose) + torso + neck + headFront());
}

export function bodyBack() {
  const details =
    line('M100 62 L100 98', 1.6, '#9c8347') +
    // Waistband and glute curves read as "seen from behind".
    line('M86 106 Q100 109 114 106', 1.8, '#b0658a') +
    line('M86 116 C90 124 97 124 100 117 C103 124 110 124 114 116', 1.8, '#b0658a');
  return fit(shadow + pants + shoes + arms('relaxed') + torso + details + neck + headBack());
}

/** Profile facing right (the subject's left side towards the camera). */
export function bodySide() {
  const head =
    circle(84, 19, 7.5, C.hair) +
    circle(102, 33, 17, C.skin) +
    shape('M86 40 C80 22 94 13 108 17 C113 19 117 23 118 29 C108 24 97 27 93 42 Z', C.hair) +
    dot(110, 35, 2) +
    line('M118.5 33 L121 38.5 L117 39.5', 2.2) +
    line('M108.5 43 Q112 44 114.5 41.5', 2.2) +
    `<circle cx="106" cy="40" r="3" fill="${C.cheek}" opacity="0.75"/>`;
  const body = shape(
    'M91 59 C98 52 108 53 112 60 C115 72 113 88 110 101 L90 101 C87 88 87 72 91 59 Z',
    C.top,
  );
  const legs =
    shape('M89 98 L111 98 C113 128 113 158 112 177 L88 177 C87 158 87 128 89 98 Z', C.pants) +
    line('M100 124 L100 176', 1.8, '#b0658a');
  const shoes = ellipse(96, 181, 11, 4.2, C.skin) + ellipse(107, 181, 9, 4.2, C.skin);
  const arm = limb('M101 62 C98 76 98 88 102 103', 10, C.skin);
  return fit(shadow + legs + shoes + body + limb('M101 49 L101 55', 7, C.skin) + head + arm);
}

/**
 * Detail shot: the full figure zoomed onto a region, with a dashed frame marking the crop.
 * `cy` is the region center (in figure coordinates) and `zoom` the magnification.
 */
export function detail(figure: string, cy: number, zoom: number) {
  const tx = 100 - 100 * zoom;
  const ty = 100 - cy * zoom;
  const frame = `<rect x="16" y="16" width="168" height="168" rx="28" fill="none" stroke="${C.ink}" stroke-width="2" stroke-dasharray="6 7" opacity="0.3"/>`;
  return group(figure, `translate(${tx} ${ty}) scale(${zoom})`) + frame;
}

export const bodyIllustrations = {
  body_front: () => bodyFront(),
  body_back: () => bodyBack(),
  body_left: () => bodySide(),
  body_right: () => mirror(bodySide()),
  torso: () => detail(bodyFront(), 86, 1.9),
  arms_relaxed: () => detail(bodyFront(), 72, 1.6),
  arms_flexed: () => detail(bodyFront('flexed'), 60, 1.6),
  legs: () => detail(bodyFront(), 150, 1.75),
  glutes: () => detail(bodyBack(), 118, 2.2),
};
