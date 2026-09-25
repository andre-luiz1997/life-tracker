import {
  ClipOp,
  FilterMode,
  ImageFormat,
  MipmapMode,
  type SkCanvas,
  type SkImage,
  Skia,
  TileMode,
} from '@shopify/react-native-skia';

import {
  colorMatrix,
  type EditState,
  isIdentityColor,
  type NormRect,
  orientedSize,
  outputSize,
  type Size,
} from './edit-state';

/** Pixel block size for pixelation, relative to the output's longest side. */
const PIXEL_BLOCK_RATIO = 0.03;
const BLUR_SIGMA_RATIO = 0.025;

export function loadSkImage(bytes: Uint8Array): SkImage | null {
  return Skia.Image.MakeImageFromEncoded(Skia.Data.fromBytes(bytes));
}

/** Maps the source image into output space: orientation, then crop scaled to `out`. */
function applyGeometry(canvas: SkCanvas, image: Size, state: EditState, out: Size) {
  const oriented = orientedSize(image, state.rotation);
  const scale = out.width / (state.crop.w * oriented.width);
  canvas.scale(scale, scale);
  canvas.translate(-state.crop.x * oriented.width, -state.crop.y * oriented.height);

  if (state.flipH) {
    canvas.translate(oriented.width, 0);
    canvas.scale(-1, 1);
  }
  // Rotation clockwise about the origin, then shifted back into positive coordinates.
  if (state.rotation === 90) canvas.translate(oriented.width, 0);
  if (state.rotation === 180) canvas.translate(oriented.width, oriented.height);
  if (state.rotation === 270) canvas.translate(0, oriented.height);
  if (state.rotation) canvas.rotate(state.rotation, 0, 0);
}

function basePaint(state: EditState) {
  const paint = Skia.Paint();
  if (!isIdentityColor(state)) {
    paint.setColorFilter(
      Skia.ColorFilter.MakeMatrix(colorMatrix(state.brightness, state.contrast)),
    );
  }
  return paint;
}

function drawImageLayer(
  canvas: SkCanvas,
  image: SkImage,
  state: EditState,
  out: Size,
  blurSigma = 0,
) {
  const paint = basePaint(state);
  if (blurSigma > 0)
    paint.setImageFilter(Skia.ImageFilter.MakeBlur(blurSigma, blurSigma, TileMode.Clamp, null));
  canvas.save();
  applyGeometry(canvas, { width: image.width(), height: image.height() }, state, out);
  canvas.drawImage(image, 0, 0, paint);
  canvas.restore();
}

/** Censor rect (oriented-image space) → output pixels. */
function censorRect(c: NormRect, crop: NormRect, out: Size) {
  return Skia.XYWHRect(
    ((c.x - crop.x) / crop.w) * out.width,
    ((c.y - crop.y) / crop.h) * out.height,
    (c.w / crop.w) * out.width,
    (c.h / crop.h) * out.height,
  );
}

/** Draws the full edit into `canvas` sized `out`. Used for both preview and export. */
export function drawEdit(canvas: SkCanvas, image: SkImage, state: EditState, out: Size) {
  drawImageLayer(canvas, image, state, out);

  const longest = Math.max(out.width, out.height);
  for (const censor of state.censors) {
    const rect = censorRect(censor, state.crop, out);
    if (rect.width <= 0 || rect.height <= 0) continue;

    if (censor.kind === 'solid') {
      const paint = Skia.Paint();
      paint.setColor(Skia.Color('black'));
      canvas.drawRect(rect, paint);
      continue;
    }

    canvas.save();
    canvas.clipRect(rect, ClipOp.Intersect, true);
    if (censor.kind === 'blur') {
      drawImageLayer(canvas, image, state, out, longest * BLUR_SIGMA_RATIO);
    } else {
      // Pixelate: render the region tiny, then scale it back up without smoothing.
      const block = Math.max(4, longest * PIXEL_BLOCK_RATIO);
      const small = {
        width: Math.max(1, Math.round(rect.width / block)),
        height: Math.max(1, Math.round(rect.height / block)),
      };
      const surface = Skia.Surface.MakeOffscreen(small.width, small.height);
      if (surface) {
        const c = surface.getCanvas();
        c.scale(small.width / rect.width, small.height / rect.height);
        c.translate(-rect.x, -rect.y);
        drawImageLayer(c, image, state, out);
        surface.flush();
        const tiny = surface.makeImageSnapshot();
        canvas.drawImageRectOptions(
          tiny,
          Skia.XYWHRect(0, 0, small.width, small.height),
          rect,
          FilterMode.Nearest,
          MipmapMode.None,
        );
      }
    }
    canvas.restore();
  }
}

/** Renders the edit offscreen at most `maxSide` pixels on the longest side. */
export function renderEdit(image: SkImage, state: EditState, maxSide: number): SkImage | null {
  const out = outputSize({ width: image.width(), height: image.height() }, state, maxSide);
  const surface = Skia.Surface.MakeOffscreen(out.width, out.height);
  if (!surface) return null;
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('black'));
  drawEdit(canvas, image, state, out);
  surface.flush();
  return surface.makeImageSnapshot();
}

export function encodeJpeg(image: SkImage, quality: number): Uint8Array {
  return image.encodeToBytes(ImageFormat.JPEG, Math.round(quality * 100));
}
