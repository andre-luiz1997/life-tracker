import { create } from 'zustand';

export type PendingShot = { uri: string; width?: number; height?: number };

/** Photo(s) awaiting "use / retake" on the review screen. Plaintext temp files in the cache. */
export type PendingCapture = {
  angleId: string;
  source: 'camera' | 'gallery';
  /** One shot, or a hands-free burst to pick from. */
  shots: PendingShot[];
  /** Gallery only: EXIF date, used as the suggested entry date. */
  takenAt?: Date | null;
};

/**
 * Ephemeral state of a capture session (one entry, several angles). Persistent data lives in
 * SQLite; this only tracks which entry the next photos go into and what is under review.
 */
type CaptureSessionState = {
  timelineId: string | null;
  /** Set after the first photo of the session is saved. */
  entryId: string | null;
  pending: PendingCapture | null;

  start: (timelineId: string, entryId?: string | null) => void;
  setEntry: (entryId: string) => void;
  setPending: (pending: PendingCapture | null) => void;
  end: () => void;
};

export const useCaptureSession = create<CaptureSessionState>((set) => ({
  timelineId: null,
  entryId: null,
  pending: null,
  start: (timelineId, entryId = null) => set({ timelineId, entryId, pending: null }),
  setEntry: (entryId) => set({ entryId }),
  setPending: (pending) => set({ pending }),
  end: () => set({ timelineId: null, entryId: null, pending: null }),
}));
