/**
 * Building blocks for the angle illustrations: flat line art with ink outlines and pastel fills
 * (see the style references in the design discussion). Output is plain SVG markup so the same
 * figures render in the app (react-native-svg `SvgXml`) and in the preview script.
 */
export const C = {
  ink: '#212121',
  skin: '#FFFFFF',
  hair: '#212121',
  top: '#F7D786',
  pants: '#F4A6C8',
  mint: '#A8E6C3',
  blue: '#A9CBF5',
  cheek: '#F6A58F',
  phone: '#212121',
  accent: '#F7D786',
};

const W = 2.5;

/** Filled shape with an ink outline. */
export const shape = (d: string, fill: string, extra = '') =>
  `<path d="${d}" fill="${fill}" stroke="${C.ink}" stroke-width="${W}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;

/** Open ink line. */
export const line = (d: string, width = W, color = C.ink, extra = '') =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;

/** Outlined limb: a thick ink stroke with a thinner colored stroke on top. */
export const limb = (d: string, width: number, fill: string) =>
  line(d, width + W * 2, C.ink) + line(d, width, fill);

export const circle = (cx: number, cy: number, r: number, fill: string, stroke = true) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${
    stroke ? `stroke="${C.ink}" stroke-width="${W}"` : ''
  }/>`;

export const ellipse = (cx: number, cy: number, rx: number, ry: number, fill: string, extra = '') =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${C.ink}" stroke-width="${W}" ${extra}/>`;

export const dot = (cx: number, cy: number, r = 1.8) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.ink}"/>`;

export const group = (content: string, transform: string) =>
  `<g transform="${transform}">${content}</g>`;

/** Horizontal mirror inside a square viewBox of the given size. */
export const mirror = (content: string, size = 200) =>
  group(content, `translate(${size} 0) scale(-1 1)`);

/**
 * Small phone glyph showing where the camera goes. `rotate` in degrees; the lens is drawn on
 * the back so the glyph reads as "camera facing this way".
 */
export const phone = (x: number, y: number, rotate = 0, scale = 1) =>
  group(
    `<rect x="-9" y="-15" width="18" height="30" rx="4" fill="${C.phone}"/>` +
      `<rect x="-6.5" y="-11.5" width="13" height="21" rx="2" fill="${C.accent}"/>` +
      `<circle cx="0" cy="12" r="1.3" fill="${C.accent}"/>`,
    `translate(${x} ${y}) rotate(${rotate}) scale(${scale})`,
  );

/** Dashed arrow pointing from the phone to the subject. */
export const dashed = (d: string) => line(d, 2, C.ink, 'stroke-dasharray="4 5" opacity="0.55"');

export const svg = (content: string, size = 200) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">${content}</svg>`;
