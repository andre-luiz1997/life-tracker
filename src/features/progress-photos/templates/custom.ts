import type { TemplateAngle, TimelineTemplate } from './types';

/** Defaults for angles the user creates (no silhouette: grid + ghost only). */
export const customAngleDefaults: Omit<TemplateAngle, 'key'> = {
  camera: 'back',
  captureMode: 'standard',
  aspectRatio: '3:4',
};

export const customTemplate: TimelineTemplate = {
  key: 'custom',
  icon: 'sparkles',
  color: '#14B8A6',
  angles: [{ key: 'main', ...customAngleDefaults }],
  metrics: [],
  tips: ['consistency'],
  reminderIntervalDays: null,
};
