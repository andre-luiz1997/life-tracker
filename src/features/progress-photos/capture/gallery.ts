import {
  launchImageLibraryAsync,
  UIImagePickerPreferredAssetRepresentationMode,
} from 'expo-image-picker';

import { withExternalActivity } from '@/core/lifecycle';

export type PickedImage = {
  uri: string;
  /** Capture date from EXIF, used as the suggested entry date. */
  takenAt: Date | null;
};

/** Parses EXIF "YYYY:MM:DD HH:MM:SS" (local time, no zone) into a Date. */
export function parseExifDate(exif: Record<string, unknown> | null | undefined): Date | null {
  if (!exif) return null;
  // iOS nests EXIF fields under {Exif}; Android returns them flat.
  const nested = (exif['{Exif}'] ?? {}) as Record<string, unknown>;
  const raw = nested.DateTimeOriginal ?? exif.DateTimeOriginal ?? exif.DateTime;
  if (typeof raw !== 'string') return null;
  const m = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(raw.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m.map(Number) as number[];
  const date = new Date(y!, mo! - 1, d!, h, mi, s);
  return Number.isNaN(date.getTime()) || y! < 1990 ? null : date;
}

export async function pickImage(): Promise<PickedImage | null> {
  const result = await withExternalActivity(() =>
    launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      exif: true,
      quality: 1,
      // HEIC → JPEG on iOS, which the manipulator and every viewer handle.
      preferredAssetRepresentationMode: UIImagePickerPreferredAssetRepresentationMode.Compatible,
    }),
  );
  const asset = result.assets?.[0];
  if (result.canceled || !asset) return null;
  return {
    uri: asset.uri,
    takenAt: parseExifDate(asset.exif),
  };
}
