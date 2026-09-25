import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { ProcessedImage } from '../services/photo.service';

/** Longest side of stored photos (12–48 MP sources are downscaled before encryption). */
export const MAX_PHOTO_SIDE = 2560;
export const MAX_THUMB_SIDE = 400;
const PHOTO_QUALITY = 0.85;
const THUMB_QUALITY = 0.7;

/** Resize keeping aspect ratio so the longest side is at most `max` (never upscales). */
export function fitWithin(width: number, height: number, max: number) {
  if (width <= max && height <= max) return null;
  return width >= height ? { width: max, height: null } : { width: null, height: max };
}

/** Deletes a plaintext temp image (camera cache, picker copy, manipulator output). */
export function discardTempImage(uri: string) {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Not ours to delete (e.g. content:// URIs) or already gone.
  }
}

export type ImageSize = { width: number; height: number };

async function renderJpeg(uri: string, size: ImageSize | undefined, max: number, quality: number) {
  const context = ImageManipulator.manipulate(uri);
  // Without a known size, render once to read it (costly for huge images). Only pass sizes that
  // match the decoded orientation: camera results do; gallery sizes may ignore EXIF rotation.
  const known = size && size.width > 0 && size.height > 0 ? size : await context.renderAsync();
  const resize = fitWithin(known.width, known.height, max);
  if (resize) context.resize(resize);
  const image = await context.renderAsync();
  // saveAsync always writes to the cache; the bytes are read and the file removed right away.
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: quality });
  try {
    const bytes = await new File(saved.uri).bytes();
    return { bytes, width: saved.width, height: saved.height };
  } finally {
    discardTempImage(saved.uri);
    context.release();
  }
}

/** Produces the stored JPEG (≤ 2560 px, EXIF stripped by re-encoding) and its thumbnail. */
export async function processImage(uri: string, size?: ImageSize): Promise<ProcessedImage> {
  const full = await renderJpeg(uri, size, MAX_PHOTO_SIDE, PHOTO_QUALITY);
  // `full` has the decoded orientation and aspect ratio, which is all fitWithin needs.
  const thumb = await renderJpeg(uri, full, MAX_THUMB_SIDE, THUMB_QUALITY);
  return { full, thumb: { bytes: thumb.bytes } };
}

/**
 * Downscales a source to ≤ 2560 px (high quality) and returns its JPEG bytes for the editor,
 * so Skia never decodes a 48 MP image. The temp output is deleted right away.
 */
export async function prepareForEditing(uri: string, size?: ImageSize) {
  return renderJpeg(uri, size, MAX_PHOTO_SIDE, 0.95);
}
