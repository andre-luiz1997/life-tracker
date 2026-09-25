/**
 * @jest-environment node
 *
 * Runs the real Skia renderer on CanvasKit (WASM) to check geometry pixel by pixel.
 */
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/commonjs/web/LoadSkiaWeb';

import { applyEdit, type EditState, initialEditState, type Size } from './edit-state';

jest.mock('@shopify/react-native-skia', () => {
  const headless = jest.requireActual('@shopify/react-native-skia/lib/commonjs/headless');
  return {
    ...headless,
    get Skia() {
      return headless.getSkiaExports().Skia;
    },
  };
});

// Imported after the mock so it binds to the headless Skia.
// eslint-disable-next-line import/first
import { renderEdit } from './renderer';

type RGB = [number, number, number];
const R: RGB = [255, 0, 0];
const G: RGB = [0, 255, 0];
const B: RGB = [0, 0, 255];
const W: RGB = [255, 255, 255];
const K: RGB = [0, 0, 0];
const Y: RGB = [255, 255, 0];

/** Source image 2 wide × 3 tall:  R G / B W / K Y  (scaled ×10 to avoid edge blending). */
const SRC = [
  [R, G],
  [B, W],
  [K, Y],
];
const CELL = 10;

async function makeSource() {
  const { Skia } = jest.requireMock('@shopify/react-native-skia');
  const surface = Skia.Surface.MakeOffscreen(2 * CELL, 3 * CELL);
  const canvas = surface.getCanvas();
  SRC.forEach((row, y) =>
    row.forEach(([r, g, b], x) => {
      const paint = Skia.Paint();
      paint.setColor(Skia.Color(`rgb(${r},${g},${b})`));
      canvas.drawRect(Skia.XYWHRect(x * CELL, y * CELL, CELL, CELL), paint);
    }),
  );
  surface.flush();
  return surface.makeImageSnapshot();
}

/** Samples the center of each cell of the rendered output as a grid of colors. */
function grid(
  image: { width(): number; height(): number; readPixels(): unknown },
  cols: number,
  rows: number,
) {
  const pixels = image.readPixels() as Uint8Array;
  const w = image.width();
  const h = image.height();
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => {
      const x = Math.floor(((col + 0.5) * w) / cols);
      const y = Math.floor(((row + 0.5) * h) / rows);
      const i = (y * w + x) * 4;
      return [pixels[i], pixels[i + 1], pixels[i + 2]].map((v) => (v! > 127 ? 255 : 0));
    }),
  );
}

const size: Size = { width: 2 * CELL, height: 3 * CELL };
const edit = (state: EditState, ...actions: Parameters<typeof applyEdit>[1][]) =>
  actions.reduce((s, a) => applyEdit(s, a, size), state);

describe('renderEdit (CanvasKit)', () => {
  beforeAll(async () => {
    await LoadSkiaWeb();
  });

  it('renders the source unchanged by default', async () => {
    const out = renderEdit(await makeSource(), initialEditState(size, 'free'), 1000)!;
    expect([out.width(), out.height()]).toEqual([20, 30]);
    expect(grid(out, 2, 3)).toEqual(SRC);
  });

  it('rotates 90° clockwise', async () => {
    const out = renderEdit(
      await makeSource(),
      edit(initialEditState(size, 'free'), { type: 'rotate' }),
      1000,
    )!;
    expect([out.width(), out.height()]).toEqual([30, 20]);
    expect(grid(out, 3, 2)).toEqual([
      [K, B, R],
      [Y, W, G],
    ]);
  });

  it('rotates the visible image clockwise even when flipped', async () => {
    const flippedThenRotated = edit(
      initialEditState(size, 'free'),
      { type: 'flip' },
      { type: 'rotate' },
    );
    // Flipped: G R / W B / Y K → rotated 90° CW: Y W G / K B R.
    expect(grid(renderEdit(await makeSource(), flippedThenRotated, 1000)!, 3, 2)).toEqual([
      [Y, W, G],
      [K, B, R],
    ]);
  });

  it('rotates 180° and 270°', async () => {
    const src = await makeSource();
    const r180 = renderEdit(
      src,
      edit(initialEditState(size, 'free'), { type: 'rotate' }, { type: 'rotate' }),
      1000,
    )!;
    expect(grid(r180, 2, 3)).toEqual([
      [Y, K],
      [W, B],
      [G, R],
    ]);
    const r270 = renderEdit(
      src,
      edit(
        initialEditState(size, 'free'),
        { type: 'rotate' },
        { type: 'rotate' },
        { type: 'rotate' },
      ),
      1000,
    )!;
    expect(grid(r270, 3, 2)).toEqual([
      [G, W, Y],
      [R, B, K],
    ]);
  });

  it('flips horizontally', async () => {
    const out = renderEdit(
      await makeSource(),
      edit(initialEditState(size, 'free'), { type: 'flip' }),
      1000,
    )!;
    expect(grid(out, 2, 3)).toEqual([
      [G, R],
      [W, B],
      [Y, K],
    ]);
  });

  it('crops to the requested region', async () => {
    const state = edit(initialEditState(size, 'free'), {
      type: 'setCrop',
      crop: { x: 0.5, y: 1 / 3, w: 0.5, h: 2 / 3 },
    });
    const out = renderEdit(await makeSource(), state, 1000)!;
    expect([out.width(), out.height()]).toEqual([10, 20]);
    expect(grid(out, 1, 2)).toEqual([[W], [Y]]);
  });

  it('crops after rotating, in the rotated space', async () => {
    // After a 90° rotation the image is K B R / Y W G; take the right third.
    const state = edit(
      initialEditState(size, 'free'),
      { type: 'rotate' },
      { type: 'setCrop', crop: { x: 2 / 3, y: 0, w: 1 / 3, h: 1 } },
    );
    expect(grid(renderEdit(await makeSource(), state, 1000)!, 1, 2)).toEqual([[R], [G]]);
  });

  it('paints solid censors over the region', async () => {
    const state = edit(initialEditState(size, 'free'), {
      type: 'addCensor',
      censor: { id: 'c', kind: 'solid', x: 0, y: 0, w: 0.5, h: 1 / 3 },
    });
    expect(grid(renderEdit(await makeSource(), state, 1000)!, 2, 3)[0]).toEqual([K, G]);
  });

  it('keeps censors on the same image content through flip + rotate', async () => {
    // Censor the W cell (x 0.5..1, y 1/3..2/3) in the original orientation, then flip and rotate.
    const state = edit(
      initialEditState(size, 'free'),
      { type: 'addCensor', censor: { id: 'c', kind: 'solid', x: 0.5, y: 1 / 3, w: 0.5, h: 1 / 3 } },
      { type: 'flip' },
      { type: 'rotate' },
    );
    const out = grid(renderEdit(await makeSource(), state, 1000)!, 3, 2);
    // Flipped: G R / W B / Y K → rotated 90°: Y W G / K B R. The W cell must be blacked out.
    expect(out).toEqual([
      [Y, K, G],
      [K, B, R],
    ]);
  });

  it('applies brightness', async () => {
    const state = edit(initialEditState(size, 'free'), { type: 'setBrightness', value: 1 });
    const pixels = renderEdit(await makeSource(), state, 1000)!.readPixels() as Uint8Array;
    // The black cell (bottom-left) is lifted.
    const i = (25 * 20 + 5) * 4;
    expect(pixels[i]).toBeGreaterThan(60);
  });

  it('pixelates and blurs without leaking outside the region', async () => {
    const src = await makeSource();
    for (const kind of ['pixelate', 'blur'] as const) {
      const state = edit(initialEditState(size, 'free'), {
        type: 'addCensor',
        censor: { id: kind, kind, x: 0, y: 2 / 3, w: 1, h: 1 / 3 },
      });
      const out = grid(renderEdit(src, state, 1000)!, 2, 3);
      expect(out.slice(0, 2)).toEqual(SRC.slice(0, 2));
    }
  });

  it('caps the output size', async () => {
    const out = renderEdit(await makeSource(), initialEditState(size, 'free'), 15)!;
    expect([out.width(), out.height()]).toEqual([10, 15]);
  });
});
