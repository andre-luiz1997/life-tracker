import { matchFont, Skia } from '@shopify/react-native-skia';
import { File, Paths } from 'expo-file-system';
import { shareAsync } from 'expo-sharing';
import { Platform } from 'react-native';

import { withExternalActivity } from '@/core/lifecycle';
import { secureFileStore } from '@/core/storage';
import { uuidv7 } from '@/shared/lib/id';

import { encodeJpeg, loadSkImage } from '../editor/renderer';
import { sideBySideLayout } from './compare';

type Side = { fileName: string; caption: string };

/**
 * Renders "before | after" with captions and opens the system share sheet. Only ever called
 * from an explicit user action. The plaintext JPEG exists only while the sheet is open.
 */
export async function shareComparison(before: Side, after: Side, dialogTitle: string) {
  const [a, b] = await Promise.all(
    [before, after].map(async (side) => {
      const image = loadSkImage(await secureFileStore.read('photos', side.fileName));
      if (!image) throw new Error('Could not decode photo');
      return image;
    }),
  );
  const layout = sideBySideLayout(
    { width: a!.width(), height: a!.height() },
    { width: b!.width(), height: b!.height() },
  );

  const surface = Skia.Surface.MakeOffscreen(layout.width, layout.height);
  if (!surface) throw new Error('Could not create surface');
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color('black'));

  const paint = Skia.Paint();
  for (const [image, rect] of [
    [a!, layout.left],
    [b!, layout.right],
  ] as const) {
    canvas.drawImageRect(
      image,
      Skia.XYWHRect(0, 0, image.width(), image.height()),
      Skia.XYWHRect(rect.x, rect.y, rect.width, rect.height),
      paint,
    );
  }

  const font = matchFont({
    fontFamily: Platform.select({ ios: 'Helvetica', default: 'sans-serif' }),
    fontSize: 36,
  });
  const white = Skia.Paint();
  white.setColor(Skia.Color('white'));
  const baseline = layout.captionTop + 48;
  canvas.drawText(before.caption, layout.left.x + 16, baseline, white, font);
  canvas.drawText(after.caption, layout.right.x + 16, baseline, white, font);

  surface.flush();
  const bytes = encodeJpeg(surface.makeImageSnapshot(), 0.9);

  const file = new File(Paths.cache, `comparison-${uuidv7()}.jpg`);
  file.create({ overwrite: true });
  file.write(bytes);
  try {
    await withExternalActivity(() =>
      shareAsync(file.uri, { mimeType: 'image/jpeg', dialogTitle, UTI: 'public.jpeg' }),
    );
  } finally {
    if (file.exists) file.delete();
  }
}
