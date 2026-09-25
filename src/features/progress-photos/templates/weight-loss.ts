import type { TimelineTemplate } from './types';

const body = { camera: 'back', captureMode: 'timer', aspectRatio: '9:16' } as const;
const detail = {
  camera: 'back',
  captureMode: 'timer',
  aspectRatio: '3:4',
  optional: true,
} as const;

export const weightLossTemplate: TimelineTemplate = {
  key: 'weight_loss',
  icon: 'body',
  color: '#F97316',
  angles: [
    { key: 'body_front', overlay: 'body-front', ...body },
    { key: 'body_back', overlay: 'body-back', ...body },
    { key: 'body_left', overlay: 'body-side', ...body },
    { key: 'body_right', overlay: 'body-side', mirrorOverlay: true, ...body },
    { key: 'torso', overlay: 'body-torso', ...detail },
    { key: 'arms_relaxed', overlay: 'body-arms', ...detail },
    { key: 'arms_flexed', overlay: 'body-arms', ...detail },
    { key: 'legs', overlay: 'body-legs', ...detail },
    { key: 'glutes', overlay: 'body-back', ...detail },
  ],
  metrics: [
    { key: 'weight', unit: 'kg' },
    { key: 'waist', unit: 'cm' },
    { key: 'hip', unit: 'cm' },
    { key: 'body_fat', unit: '%', optional: true },
  ],
  tips: ['sameTime', 'sameConditions', 'distance', 'posture'],
  reminderIntervalDays: 7,
};
