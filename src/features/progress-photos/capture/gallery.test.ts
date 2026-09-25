import { parseExifDate } from './gallery';

jest.mock('expo-image-picker', () => ({ UIImagePickerPreferredAssetRepresentationMode: {} }));
jest.mock('expo-media-library', () => ({}));

describe('parseExifDate', () => {
  it('reads Android-style flat EXIF', () => {
    expect(parseExifDate({ DateTimeOriginal: '2026:03:14 07:45:10' })).toEqual(
      new Date(2026, 2, 14, 7, 45, 10),
    );
  });

  it('reads iOS-style nested EXIF', () => {
    expect(parseExifDate({ '{Exif}': { DateTimeOriginal: '2025:12:31 23:59:59' } })).toEqual(
      new Date(2025, 11, 31, 23, 59, 59),
    );
  });

  it('falls back to DateTime', () => {
    expect(parseExifDate({ DateTime: '2026:01:02 03:04:05' })).toEqual(
      new Date(2026, 0, 2, 3, 4, 5),
    );
  });

  it('ignores missing or bogus values', () => {
    expect(parseExifDate(null)).toBeNull();
    expect(parseExifDate({})).toBeNull();
    expect(parseExifDate({ DateTimeOriginal: '0000:00:00 00:00:00' })).toBeNull();
    expect(parseExifDate({ DateTimeOriginal: 'yesterday' })).toBeNull();
  });
});
