import type { TimelineTemplate } from './types';

const selfie = { camera: 'front', captureMode: 'standard', aspectRatio: '3:4' } as const;

export const faceTemplate: TimelineTemplate = {
  key: 'face',
  icon: 'face',
  color: '#F4B6C9',
  angles: [
    { key: 'face_front', overlay: 'face-front', ...selfie },
    { key: 'face_45_left', overlay: 'face-45', ...selfie },
    { key: 'face_45_right', overlay: 'face-45', mirrorOverlay: true, ...selfie },
    { key: 'profile_left', overlay: 'face-profile', ...selfie },
    { key: 'profile_right', overlay: 'face-profile', mirrorOverlay: true, ...selfie },
    { key: 'closeup', camera: 'back', captureMode: 'standard', aspectRatio: '1:1', optional: true },
  ],
  metrics: [{ key: 'self_rating', unit: '/5', optional: true }],
  tips: ['noMakeup', 'neutral', 'light', 'height'],
  reminderIntervalDays: 7,
};
