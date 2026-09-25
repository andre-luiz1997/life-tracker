import {
  applyEdit,
  centeredCrop,
  colorMatrix,
  type EditState,
  initialEditState,
  isIdentityColor,
  outputSize,
  panZoomCrop,
  rectFromPoints,
  rotateRectCW,
} from './edit-state';

const landscape = { width: 4000, height: 3000 };
const portrait = { width: 3000, height: 4000 };

const pixelAspect = (state: EditState, image: { width: number; height: number }) => {
  const size = outputSize(image, state, 100_000);
  return size.width / size.height;
};

describe('edit-state', () => {
  it('centers the largest crop with the requested aspect', () => {
    expect(centeredCrop(portrait, '3:4')).toEqual({ x: 0, y: 0, w: 1, h: 1 });
    const square = centeredCrop(portrait, '1:1');
    expect(square).toEqual({ x: 0, y: 0.125, w: 1, h: 0.75 });
    const tall = centeredCrop(landscape, '9:16');
    expect(tall.h).toBe(1);
    expect(tall.x + tall.w / 2).toBeCloseTo(0.5);
  });

  it('computes output size capped to the max side', () => {
    const state = initialEditState(portrait, '3:4');
    expect(outputSize(portrait, state, 2560)).toEqual({ width: 1920, height: 2560 });
    expect(outputSize(portrait, { ...state, rotation: 90 }, 2560)).toEqual({
      width: 2560,
      height: 1920,
    });
  });

  it('zooms around the center and pans, keeping the crop inside the image', () => {
    const zoomed = panZoomCrop({ x: 0, y: 0, w: 1, h: 1 }, { zoom: 2 });
    expect(zoomed).toEqual({ x: 0.25, y: 0.25, w: 0.5, h: 0.5 });
    // Dragging the image right by a quarter of the frame moves the crop left.
    expect(panZoomCrop(zoomed, { dx: 0.25 })).toEqual({ x: 0.125, y: 0.25, w: 0.5, h: 0.5 });
    // Can't pan past the edge.
    expect(panZoomCrop(zoomed, { dx: 10 }).x).toBe(0);
    // Can't zoom out past the whole image; aspect is kept.
    const out = panZoomCrop({ x: 0, y: 0.1, w: 1, h: 0.8 }, { zoom: 0.5 });
    expect(out.w).toBe(1);
    expect(out.h).toBeCloseTo(0.8);
  });

  it('keeps a fixed aspect when rotating', () => {
    let state = initialEditState(portrait, '3:4');
    state = applyEdit(state, { type: 'rotate' }, portrait);
    expect(state.rotation).toBe(90);
    expect(pixelAspect(state, portrait)).toBeCloseTo(3 / 4);
    for (let i = 0; i < 3; i++) state = applyEdit(state, { type: 'rotate' }, portrait);
    expect(state.rotation).toBe(0);
  });

  it('rotating four times returns rects to where they started', () => {
    const rect = { x: 0.1, y: 0.2, w: 0.3, h: 0.4 };
    const back = [1, 2, 3, 4].reduce((r) => rotateRectCW(r), rect);
    Object.entries(rect).forEach(([k, v]) => expect(back[k as keyof typeof rect]).toBeCloseTo(v));
  });

  it('moves censors with rotation and flip, but not with re-cropping', () => {
    const censor = { id: 'c', kind: 'blur' as const, x: 0, y: 0, w: 0.2, h: 0.1 };
    let state = applyEdit(
      initialEditState(portrait, 'free'),
      { type: 'addCensor', censor },
      portrait,
    );
    state = applyEdit(state, { type: 'panZoom', zoom: 2 }, portrait);
    expect(state.censors[0]).toMatchObject({ x: 0, y: 0 });

    state = applyEdit(state, { type: 'flip' }, portrait);
    expect(state.censors[0]!.x).toBeCloseTo(0.8);

    state = applyEdit(state, { type: 'rotate' }, portrait);
    expect(state.censors[0]).toMatchObject({ w: 0.1, h: 0.2 });
  });

  it('ignores tiny censors (accidental taps) and removes by id', () => {
    const base = initialEditState(portrait, 'free');
    const tiny = { id: 't', kind: 'solid' as const, x: 0.5, y: 0.5, w: 0.001, h: 0.2 };
    expect(applyEdit(base, { type: 'addCensor', censor: tiny }, portrait).censors).toHaveLength(0);
    const real = { ...tiny, w: 0.2 };
    const added = applyEdit(base, { type: 'addCensor', censor: real }, portrait);
    expect(applyEdit(added, { type: 'removeCensor', id: 't' }, portrait).censors).toHaveLength(0);
  });

  it('builds rects from drags in any direction', () => {
    expect(rectFromPoints({ x: 0.8, y: 0.9 }, { x: 0.2, y: 0.1 })).toEqual({
      x: 0.2,
      y: 0.1,
      w: 0.6000000000000001,
      h: 0.8,
    });
    expect(rectFromPoints({ x: -1, y: 0.5 }, { x: 2, y: 0.5 })).toEqual({
      x: 0,
      y: 0.5,
      w: 1,
      h: 0,
    });
  });

  it('produces an identity color matrix at zero and clamps values', () => {
    expect(colorMatrix(0, 0)).toEqual([1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0]);
    expect(isIdentityColor({ brightness: 0, contrast: 0 })).toBe(true);
    const bright = colorMatrix(1, 0);
    expect(bright[4]).toBeCloseTo(0.35);
    // Mid-grey stays put when only contrast changes.
    const m = colorMatrix(0, 0.5);
    expect(m[0]! * 0.5 + m[4]!).toBeCloseTo(0.5);
    expect(colorMatrix(5, 0)).toEqual(colorMatrix(1, 0));
  });
});
