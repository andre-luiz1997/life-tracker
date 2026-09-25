/**
 * Declarative, serializable description of an edit. Geometry is normalized (0..1) in the
 * *oriented* image space (after rotation/flip), so it survives resizing and is easy to test.
 * Pipeline order (docs/PLANO-MVP.md §6.3): orient → crop/align → brightness/contrast → censor.
 */
export type Rotation = 0 | 90 | 180 | 270;
export type AspectKey = '3:4' | '1:1' | '9:16' | 'free';
export type CensorKind = 'blur' | 'pixelate' | 'solid';

export type NormRect = { x: number; y: number; w: number; h: number };
export type Censor = NormRect & { id: string; kind: CensorKind };
export type Size = { width: number; height: number };

export type EditState = {
  rotation: Rotation;
  flipH: boolean;
  aspect: AspectKey;
  /** Visible region of the oriented image. */
  crop: NormRect;
  /** -1..1, 0 = unchanged. */
  brightness: number;
  contrast: number;
  /** Regions of the oriented image (not of the crop), so they stay put when re-cropping. */
  censors: Censor[];
};

export const FULL_RECT: NormRect = { x: 0, y: 0, w: 1, h: 1 };

export const ASPECT_RATIOS: Record<Exclude<AspectKey, 'free'>, number> = {
  '3:4': 3 / 4,
  '1:1': 1,
  '9:16': 9 / 16,
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function orientedSize(size: Size, rotation: Rotation): Size {
  return rotation % 180 === 0 ? size : { width: size.height, height: size.width };
}

/** Largest centered crop with the given aspect (width/height) inside an image. */
export function centeredCrop(image: Size, aspect: AspectKey): NormRect {
  if (aspect === 'free') return FULL_RECT;
  const target = ASPECT_RATIOS[aspect];
  const current = image.width / image.height;
  if (current > target) {
    const w = target / current;
    return { x: (1 - w) / 2, y: 0, w, h: 1 };
  }
  const h = current / target;
  return { x: 0, y: (1 - h) / 2, w: 1, h };
}

export function initialEditState(image: Size, aspect: AspectKey): EditState {
  return {
    rotation: 0,
    flipH: false,
    aspect,
    crop: centeredCrop(image, aspect),
    brightness: 0,
    contrast: 0,
    censors: [],
  };
}

/** Keeps a rect inside the image and at least `minSize` wide/high. */
export function clampRect(rect: NormRect, minSize = 0.05): NormRect {
  const w = clamp(rect.w, minSize, 1);
  const h = clamp(rect.h, minSize, 1);
  return { w, h, x: clamp(rect.x, 0, 1 - w), y: clamp(rect.y, 0, 1 - h) };
}

/**
 * Pan/zoom of the image under a fixed frame, expressed as a crop change. `zoom` > 1 shows less
 * of the image; `dx`/`dy` are in frame fractions (dragging right moves the image right, so the
 * crop moves left). Zoom is anchored at the frame center and keeps the crop's aspect.
 */
export function panZoomCrop(crop: NormRect, { zoom = 1, dx = 0, dy = 0 }): NormRect {
  let w = crop.w / zoom;
  let h = crop.h / zoom;
  const overflow = Math.max(w, h);
  if (overflow > 1) {
    w /= overflow;
    h /= overflow;
  }
  const cx = crop.x + crop.w / 2 - dx * crop.w;
  const cy = crop.y + crop.h / 2 - dy * crop.h;
  return clampRect({ x: cx - w / 2, y: cy - h / 2, w, h });
}

/** Rotating the image 90° clockwise remaps a rect into the new oriented space. */
export function rotateRectCW(r: NormRect): NormRect {
  return { x: 1 - r.y - r.h, y: r.x, w: r.h, h: r.w };
}

export function flipRectH(r: NormRect): NormRect {
  return { ...r, x: 1 - r.x - r.w };
}

/** Normalizes a rectangle drawn from two points (any drag direction) and clamps it. */
export function rectFromPoints(a: { x: number; y: number }, b: { x: number; y: number }): NormRect {
  const x1 = clamp(Math.min(a.x, b.x), 0, 1);
  const y1 = clamp(Math.min(a.y, b.y), 0, 1);
  const x2 = clamp(Math.max(a.x, b.x), 0, 1);
  const y2 = clamp(Math.max(a.y, b.y), 0, 1);
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

/** Converts a point in crop space (0..1 of the output) to oriented-image space. */
export function cropToImage(crop: NormRect, p: { x: number; y: number }) {
  return { x: crop.x + p.x * crop.w, y: crop.y + p.y * crop.h };
}

/** Output pixel size for a crop of the oriented image, capped to `maxSide`. */
export function outputSize(
  image: Size,
  state: Pick<EditState, 'rotation' | 'crop'>,
  maxSide: number,
): Size {
  const oriented = orientedSize(image, state.rotation);
  const w = oriented.width * state.crop.w;
  const h = oriented.height * state.crop.h;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * scale)), height: Math.max(1, Math.round(h * scale)) };
}

/**
 * 4×5 color matrix (row-major, offsets in 0..1 units) for brightness/contrast.
 * Contrast pivots around mid-grey.
 */
export function colorMatrix(brightness: number, contrast: number): number[] {
  const c = 1 + clamp(contrast, -1, 1) * 0.8; // 0.2..1.8
  const b = clamp(brightness, -1, 1) * 0.35;
  const t = (1 - c) / 2 + b;
  return [c, 0, 0, 0, t, 0, c, 0, 0, t, 0, 0, c, 0, t, 0, 0, 0, 1, 0];
}

export function isIdentityColor(state: Pick<EditState, 'brightness' | 'contrast'>) {
  return Math.abs(state.brightness) < 1e-3 && Math.abs(state.contrast) < 1e-3;
}

export type EditAction =
  | { type: 'rotate' }
  | { type: 'flip' }
  | { type: 'setAspect'; aspect: AspectKey }
  | { type: 'panZoom'; zoom?: number; dx?: number; dy?: number }
  | { type: 'setCrop'; crop: NormRect }
  | { type: 'setBrightness'; value: number }
  | { type: 'setContrast'; value: number }
  | { type: 'addCensor'; censor: Censor }
  | { type: 'removeCensor'; id: string };

/** `image` is the source size (before orientation). */
export function applyEdit(state: EditState, action: EditAction, image: Size): EditState {
  switch (action.type) {
    case 'rotate': {
      // The renderer applies the flip after the rotation. Rotating the *visible* image 90° CW
      // while flipped equals rotating the source the other way (R90 ∘ Fh = Fh ∘ R270).
      const rotation = ((state.rotation + (state.flipH ? 270 : 90)) % 360) as Rotation;
      // A fixed-aspect crop would flip its aspect when rotated: re-center it instead.
      const crop =
        state.aspect === 'free'
          ? rotateRectCW(state.crop)
          : centeredCrop(orientedSize(image, rotation), state.aspect);
      return {
        ...state,
        rotation,
        crop,
        censors: state.censors.map((c) => ({ ...c, ...rotateRectCW(c) })),
      };
    }
    case 'flip':
      return {
        ...state,
        flipH: !state.flipH,
        crop: flipRectH(state.crop),
        censors: state.censors.map((c) => ({ ...c, ...flipRectH(c) })),
      };
    case 'setAspect':
      return {
        ...state,
        aspect: action.aspect,
        crop: centeredCrop(orientedSize(image, state.rotation), action.aspect),
      };
    case 'panZoom':
      return { ...state, crop: panZoomCrop(state.crop, action) };
    case 'setCrop':
      return { ...state, crop: clampRect(action.crop) };
    case 'setBrightness':
      return { ...state, brightness: clamp(action.value, -1, 1) };
    case 'setContrast':
      return { ...state, contrast: clamp(action.value, -1, 1) };
    case 'addCensor':
      return action.censor.w > 0.01 && action.censor.h > 0.01
        ? { ...state, censors: [...state.censors, action.censor] }
        : state;
    case 'removeCensor':
      return { ...state, censors: state.censors.filter((c) => c.id !== action.id) };
  }
}
