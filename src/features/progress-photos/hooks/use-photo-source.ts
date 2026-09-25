import { useEffect, useState } from 'react';

import { secureFileStore } from '@/core/storage';
import { LruCache } from '@/shared/lib/lru-cache';

/** Decrypted thumbnails (data URIs) kept in memory only. ~60 × ≤40 KB. */
const thumbCache = new LruCache<string, string>(60);

/** Drops every decrypted image (memory + temp files). Call on lock/background. */
export function clearDecryptedPhotos() {
  thumbCache.clear();
  secureFileStore.clearDecryptedCache();
}

type Loaded = { name: string; uri: string } | null;

/** Data URI of an encrypted thumbnail, or null while decrypting. */
export function useThumbnail(thumbFileName: string | null | undefined): string | null {
  const [loaded, setLoaded] = useState<Loaded>(null);

  useEffect(() => {
    if (!thumbFileName || thumbCache.get(thumbFileName)) return;
    let active = true;
    secureFileStore
      .readAsDataUri('thumbs', thumbFileName)
      .then((uri) => {
        thumbCache.set(thumbFileName, uri);
        if (active) setLoaded({ name: thumbFileName, uri });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [thumbFileName]);

  if (!thumbFileName) return null;
  return thumbCache.get(thumbFileName) ?? (loaded?.name === thumbFileName ? loaded.uri : null);
}

/**
 * Full-size photo decrypted to a temp file (large images shouldn't live in JS memory as base64).
 * The file is removed by clearDecryptedPhotos().
 */
export function useFullPhoto(fileName: string | null | undefined): string | null {
  const [loaded, setLoaded] = useState<Loaded>(null);

  useEffect(() => {
    if (!fileName) return;
    let active = true;
    secureFileStore
      .decryptToCache('photos', fileName)
      .then((uri) => active && setLoaded({ name: fileName, uri }))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [fileName]);

  return fileName && loaded?.name === fileName ? loaded.uri : null;
}
