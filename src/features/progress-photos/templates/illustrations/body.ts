import { builds, type Build, type FigureGender } from './character';
import { C, circle, dot, ellipse, group, line, mirror, shape } from './parts';

/**
 * Full-body figures drawn from a tiny rig: each pose only sets elbow/hand/knee/foot positions,
 * and the build (per gender) sets the torso shape and clothes. 200×200 box, feet at y≈182.
 */

type P = [number, number];
type Arm = { elbow: P; hand: P; fist?: boolean };
type Leg = { knee: P; foot: P; toe?: boolean };
type Pose = {
  armL: Arm;
  armR: Arm;
  legL: Leg;
  legR: Leg;
  /** Hands tucked behind the head (arms drawn behind it). */
  behindHead?: boolean;
};

const Y = { neck: 55, shoulder: 62, waist: 86, hip: 104, crotch: 122 };
const W = 2.5;

const pt = ([x, y]: P) => `${x} ${y}`;
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Outlined limbs drawn in two passes (all ink, then all fills) so joints don't show seams. */
function limbs(segments: { d: string; width: number; fill: string }[]) {
  const ink = segments.map((s) => line(s.d, s.width + W * 2)).join('');
  const fill = segments.map((s) => line(s.d, s.width, s.fill)).join('');
  return ink + fill;
}

const shadow = `<ellipse cx="100" cy="188" rx="40" ry="5" fill="${C.ink}" opacity="0.07"/>`;
const blush = (x: number, y: number) =>
  `<circle cx="${x}" cy="${y}" r="2.8" fill="${C.cheek}" opacity="0.75"/>`;

// ─── Heads (small, for full-body figures) ───────────────────────────────────

function smallHeadFront(b: Build) {
  const face =
    dot(94.5, 36, 1.9) +
    dot(105.5, 36, 1.9) +
    line('M96.5 41.5 Q100 44.5 103.5 41.5', 2.1) +
    (b.blush ? blush(90, 40.5) + blush(110, 40.5) : '') +
    (b.brows >= 3 ? line('M91 31.5 L97 30.8', b.brows) + line('M103 30.8 L109 31.5', b.brows) : '');
  const ears = ellipse(84, 35, 3, 4, C.skin) + ellipse(116, 35, 3, 4, C.skin);
  const hair = {
    bun:
      circle(100, 12, 8, C.hair) +
      shape('M84 34 C81 12 119 12 116 34 C112 27 106 23 98 25 C92 25 87 28 84 34 Z', C.hair),
    short: shape('M84 31 C83 13 117 13 116 31 C113 25 108 21 101 22 C94 21 88 24 84 31 Z', C.hair),
    crop: shape(
      'M83 35 C79 11 121 11 117 35 C115 28 111 24 105 26 C101 30 94 30 89 27 C87 30 84 32 83 35 Z',
      C.hair,
    ),
  }[b.hair];
  return ears + circle(100, 34, 16.5, C.skin) + hair + face;
}

function smallHeadBack(b: Build) {
  const ears = ellipse(84, 35, 3, 4, C.skin) + ellipse(116, 35, 3, 4, C.skin);
  const hair = {
    bun: circle(100, 12, 8, C.hair) + circle(100, 34, 16.5, C.hair),
    short:
      circle(100, 34, 16.5, C.skin) +
      shape(
        'M83.5 34 C81 13 119 13 116.5 34 C117 41 113 47 108 49 L92 49 C87 47 83 41 83.5 34 Z',
        C.hair,
      ),
    crop:
      circle(100, 34, 16.5, C.skin) +
      shape(
        'M83 34 C80 11 120 11 117 34 C118 42 114 49 108 51 L92 51 C86 49 82 42 83 34 Z',
        C.hair,
      ),
  }[b.hair];
  return ears + hair;
}

// ─── Front / back figure ────────────────────────────────────────────────────

function torsoPath(b: Build) {
  const { shoulder: s, waist: w, hip: h } = b;
  return (
    `M${100 - s + 2} 58 Q100 53 ${100 + s - 2} 58 ` +
    `C${100 + s + 3} 62 ${100 + s + 1} 74 ${100 + w} ${Y.waist} ` +
    `C${100 + w} 95 ${100 + h} 99 ${100 + h} ${Y.hip + 8} L${100 - h} ${Y.hip + 8} ` +
    `C${100 - h} 99 ${100 - w} 95 ${100 - w} ${Y.waist} ` +
    `C${100 - s - 1} 74 ${100 - s - 3} 62 ${100 - s + 2} 58 Z`
  );
}

function figure(b: Build, pose: Pose, view: 'front' | 'back') {
  const shL: P = [100 - b.shoulder + 3, Y.shoulder];
  const shR: P = [100 + b.shoulder - 3, Y.shoulder];
  const hipL: P = [100 - b.hip * 0.5, 116];
  const hipR: P = [100 + b.hip * 0.5, 116];
  const legFill = b.bottom === 'leggings' ? b.bottomColor : C.skin;

  const arm = (sh: P, a: Arm) => `M${pt(sh)} L${pt(a.elbow)} L${pt(a.hand)}`;
  const leg = (hip: P, l: Leg) => `M${pt(hip)} L${pt(l.knee)} L${pt(l.foot)}`;

  const hands = [pose.armL, pose.armR]
    .filter((a) => a.fist)
    .map((a) => circle(a.hand[0], a.hand[1], 6, C.skin))
    .join('');
  const foot = (l: Leg, side: -1 | 1) =>
    l.toe
      ? ellipse(l.foot[0], l.foot[1] + 2, 4.5, 3.5, C.skin)
      : ellipse(l.foot[0] + side * 3, l.foot[1] + 2, 8, 3.8, C.skin);

  // Shorts: a sleeve on each thigh (the hip block is the waistband below).
  const shorts =
    b.bottom === 'shorts'
      ? limbs([
          {
            d: `M${pt(hipL)} L${pt(lerp(hipL, pose.legL.knee, 0.62))}`,
            width: 17,
            fill: b.bottomColor,
          },
          {
            d: `M${pt(hipR)} L${pt(lerp(hipR, pose.legR.knee, 0.62))}`,
            width: 17,
            fill: b.bottomColor,
          },
        ])
      : '';
  const waistband = shape(
    `M${100 - b.hip - 1} ${Y.hip - 2} L${100 + b.hip + 1} ${Y.hip - 2} L${100 + b.hip + 2} ${Y.crotch} Q100 ${Y.crotch + 6} ${100 - b.hip - 2} ${Y.crotch} Z`,
    b.bottomColor,
  );

  const torso = shape(torsoPath(b), b.top === 'sportsTop' ? C.skin : b.topColor);
  const s = b.shoulder;
  const sportsTop =
    b.top === 'sportsTop'
      ? shape(
          `M${100 - s + 2} 58 Q100 53 ${100 + s - 2} 58 C${100 + s + 3} 62 ${100 + s + 1} 72 ${100 + s - 2} 80 Q100 84 ${100 - s + 2} 80 C${100 - s - 1} 72 ${100 - s - 3} 62 ${100 - s + 2} 58 Z`,
          b.topColor,
        ) + (view === 'front' ? line('M100 94 L100 96.5', 1.8) : '')
      : '';
  const sleeves =
    b.top === 'tee'
      ? limbs([
          {
            d: `M${pt(shL)} L${pt(lerp(shL, pose.armL.elbow, 0.34))}`,
            width: 13,
            fill: b.topColor,
          },
          {
            d: `M${pt(shR)} L${pt(lerp(shR, pose.armR.elbow, 0.34))}`,
            width: 13,
            fill: b.topColor,
          },
        ])
      : '';
  const neckline =
    view === 'front' && b.top !== 'sportsTop' ? shape('M93 57 Q100 65 107 57 Z', C.skin) : '';
  const backDetails =
    view === 'back'
      ? line(
          `M100 ${b.top === 'sportsTop' ? 82 : 62} L100 ${Y.hip - 4}`,
          1.6,
          '#8a7440',
          'opacity="0.6"',
        ) +
        line(
          `M${100 - b.hip + 3} ${Y.crotch - 4} C${100 - b.hip + 5} ${Y.crotch + 10} 97 ${Y.crotch + 10} 100 ${Y.crotch + 1} C103 ${Y.crotch + 10} ${100 + b.hip - 5} ${Y.crotch + 10} ${100 + b.hip - 3} ${Y.crotch - 4}`,
          1.8,
          '#5c5c5c',
          'opacity="0.45"',
        )
      : '';

  const neck = limbs([{ d: `M100 48 L100 ${Y.neck + 2}`, width: 7, fill: C.skin }]);
  const head = view === 'front' ? smallHeadFront(b) : smallHeadBack(b);

  const lower =
    limbs([
      { d: leg(hipL, pose.legL), width: 13, fill: legFill },
      { d: leg(hipR, pose.legR), width: 13, fill: legFill },
    ]) +
    shorts +
    waistband +
    foot(pose.legL, -1) +
    foot(pose.legR, 1);
  const upper = torso + sportsTop + neckline + backDetails;
  const arms =
    limbs([
      { d: arm(shL, pose.armL), width: 10, fill: C.skin },
      { d: arm(shR, pose.armR), width: 10, fill: C.skin },
    ]) +
    sleeves +
    hands;

  // Hands behind the head: arms over the torso but behind the head.
  return (
    shadow + lower + (pose.behindHead ? upper + arms + neck + head : arms + upper + neck + head)
  );
}

/** Everything slightly enlarged to fill the card. */
const fit = (content: string) => group(content, 'translate(-6 -2) scale(1.06)');

// ─── Poses ──────────────────────────────────────────────────────────────────

/** Athletic front stance: feet apart, arms slightly out showing the lats. */
const frontStance = (b: Build): Pose => ({
  armL: { elbow: [100 - b.shoulder - 11, 84], hand: [100 - b.shoulder - 13, 106] },
  armR: { elbow: [100 + b.shoulder + 11, 84], hand: [100 + b.shoulder + 13, 106] },
  legL: { knee: [89, 150], foot: [84, 180] },
  legR: { knee: [111, 150], foot: [116, 180] },
});

/** Front double biceps. */
const doubleBiceps = (b: Build): Pose => ({
  armL: { elbow: [100 - b.shoulder - 21, 66], hand: [100 - b.shoulder - 16, 40], fist: true },
  armR: { elbow: [100 + b.shoulder + 21, 66], hand: [100 + b.shoulder + 16, 40], fist: true },
  legL: { knee: [90, 150], foot: [86, 180] },
  legR: { knee: [110, 150], foot: [114, 180] },
});

/** Abs pose: hands behind the head, one leg forward. */
const absPose = (b: Build): Pose => ({
  armL: { elbow: [100 - b.shoulder - 13, 38], hand: [92, 26] },
  armR: { elbow: [100 + b.shoulder + 13, 38], hand: [108, 26] },
  behindHead: true,
  legL: { knee: [90, 150], foot: [87, 180] },
  legR: { knee: [113, 148], foot: [114, 178] },
});

/** Quads: hands on hips, front leg forward and turned out. */
const quadPose = (b: Build): Pose => ({
  armL: { elbow: [100 - b.shoulder - 14, 84], hand: [100 - b.waist - 3, 94] },
  armR: { elbow: [100 + b.shoulder + 14, 84], hand: [100 + b.waist + 3, 94] },
  legL: { knee: [86, 150], foot: [80, 180] },
  legR: { knee: [114, 148], foot: [120, 178] },
});

/** Lat spread: hands on the waist, elbows wide (front and back). */
const latSpread = (b: Build, stance: Pick<Pose, 'legL' | 'legR'>): Pose => ({
  armL: { elbow: [100 - b.shoulder - 19, 78], hand: [100 - b.waist - 2, 92] },
  armR: { elbow: [100 + b.shoulder + 19, 78], hand: [100 + b.waist + 2, 92] },
  ...stance,
});

const frontLatSpread = (b: Build) =>
  latSpread(b, {
    legL: { knee: [89, 150], foot: [84, 180] },
    legR: { knee: [111, 150], foot: [116, 180] },
  });

/** Back lat spread with one heel up. */
const backStance = (b: Build): Pose => ({
  ...latSpread(b, {
    legL: { knee: [90, 150], foot: [86, 180] },
    legR: { knee: [108, 150], foot: [111, 178], toe: true },
  }),
});

/** Glutes: hands on hips, one leg stepped back on the toes. */
const glutePose = (b: Build): Pose => ({
  armL: { elbow: [100 - b.shoulder - 14, 84], hand: [100 - b.waist - 3, 96] },
  armR: { elbow: [100 + b.shoulder + 14, 84], hand: [100 + b.waist + 3, 96] },
  legL: { knee: [91, 150], foot: [87, 180] },
  legR: { knee: [112, 152], foot: [118, 176], toe: true },
});

// ─── Side (profile facing right) ────────────────────────────────────────────

/** Side chest pose: chest up, near arm bent in front, near knee forward on the toes. */
function sideChest(b: Build) {
  const chest = b.top === 'sportsTop' ? 8 : b.shoulder > 20 ? 10 : 7;
  const glute = b.hip > 16 ? 4 : 2;
  // One continuous silhouette: back, waist, glutes, thigh top, belly, chest, neck.
  const silhouette = `M95 56 C90 58 87 64 87 72 C87 80 89 86 90 92 C${89 - glute} 100 ${87 - glute} 112 ${91 - glute / 2} 121 C94 126 104 126 109 122 C110 114 109 106 108 98 C107 94 108 90 109 86 C${111 + chest} 80 ${112 + chest} 68 106 60 C104 57 100 55 95 56 Z`;
  const cutY = b.top === 'sportsTop' ? 80 : 97;
  const upper = `M95 56 C90 58 87 64 87 72 C87 80 89 86 90 ${cutY - 4} L108 ${cutY - 4} C${111 + chest} 80 ${112 + chest} 68 106 60 C104 57 100 55 95 56 Z`;

  const legFill = b.bottom === 'leggings' ? b.bottomColor : C.skin;
  const legs = limbs([
    { d: 'M103 116 L112 148 L108 176', width: 13, fill: legFill },
    { d: 'M96 116 L97 150 L96 180', width: 13.5, fill: legFill },
  ]);
  const shorts =
    b.bottom === 'shorts'
      ? limbs([
          { d: 'M103 116 L109 136', width: 17, fill: b.bottomColor },
          { d: 'M96 116 L96.6 138', width: 17.5, fill: b.bottomColor },
        ])
      : '';
  const body =
    shape(silhouette, b.bottom === 'shorts' || b.bottom === 'leggings' ? b.bottomColor : C.skin) +
    (b.top === 'sportsTop'
      ? shape(`M90 80 L108 80 C107 86 107 92 108 97 L91 97 C90 92 90 86 90 80 Z`, C.skin)
      : '') +
    shape(upper, b.topColor) +
    (b.top === 'sportsTop' ? line('M89.5 96.5 L108.5 96.5', 2.2) : '');
  const feet = ellipse(99, 182, 10, 3.8, C.skin) + ellipse(109, 178, 4.5, 3.5, C.skin);
  const arm =
    limbs([{ d: 'M98 64 L101 88 L119 76', width: 10, fill: C.skin }]) +
    (b.top === 'tee' ? limbs([{ d: 'M98 64 L99 73', width: 13, fill: b.topColor }]) : '') +
    circle(120, 75, 6, C.skin);

  const face =
    dot(110, 35, 1.9) +
    line('M117.5 33 L120 38 L116.5 39', 2) +
    line('M108.5 42.5 Q112 43.5 114.5 41', 2) +
    (b.blush ? blush(106, 39.5) : '') +
    (b.brows >= 3 ? line('M106 30.5 L112 30', b.brows) : '');
  const hair = {
    bun:
      circle(84, 19, 7.5, C.hair) +
      shape('M86 40 C80 22 94 13 108 17 C113 19 117 23 118 29 C108 24 97 27 93 42 Z', C.hair),
    short: shape('M87 38 C82 22 94 15 107 17 C113 18 117 22 118 28 C108 24 98 26 94 36 Z', C.hair),
    crop: shape(
      'M86 42 C79 22 94 13 108 16 C114 18 118 23 119 30 C112 26 104 26 98 30 C96 34 92 40 86 42 Z',
      C.hair,
    ),
  }[b.hair];
  const head = ellipse(93, 36, 3, 4, C.skin) + circle(102, 34, 16.5, C.skin) + hair + face;
  const neck = limbs([{ d: 'M100 48 L99 57', width: 7, fill: C.skin }]);

  return shadow + legs + shorts + feet + body + neck + head + arm;
}

/**
 * Detail shot: the figure zoomed onto a region, with a dashed frame marking the crop.
 * `cy` is the region center (in figure coordinates) and `zoom` the magnification.
 */
export function detail(content: string, cy: number, zoom: number) {
  const tx = 100 - 100 * zoom;
  const ty = 100 - cy * zoom;
  const frame = `<rect x="16" y="16" width="168" height="168" rx="28" fill="none" stroke="${C.ink}" stroke-width="2" stroke-dasharray="6 7" opacity="0.3"/>`;
  return group(content, `translate(${tx} ${ty}) scale(${zoom})`) + frame;
}

const front = (g: FigureGender, pose: (b: Build) => Pose) => {
  const b = builds[g];
  return fit(figure(b, pose(b), 'front'));
};
const back = (g: FigureGender, pose: (b: Build) => Pose) => {
  const b = builds[g];
  return fit(figure(b, pose(b), 'back'));
};
const side = (g: FigureGender) => fit(sideChest(builds[g]));

export const bodyIllustrations: Record<string, (g: FigureGender) => string> = {
  body_front: (g) => front(g, frontLatSpread),
  body_back: (g) => back(g, backStance),
  body_left: (g) => side(g),
  body_right: (g) => mirror(side(g)),
  torso: (g) => detail(front(g, absPose), 84, 1.75),
  arms_relaxed: (g) => detail(front(g, frontStance), 76, 1.55),
  arms_flexed: (g) => detail(front(g, doubleBiceps), 62, 1.55),
  legs: (g) => detail(front(g, quadPose), 148, 1.7),
  glutes: (g) => detail(back(g, glutePose), 132, 1.8),
};
