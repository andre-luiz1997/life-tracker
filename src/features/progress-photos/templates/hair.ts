import type { TimelineTemplate } from './types';

// Front-facing views: the user sees the preview. Crown and nape can't be seen, so they use the
// hands-free mode guided by the motion sensor (see docs/PLANO-MVP.md §5.2).
const selfie = { camera: 'front', captureMode: 'standard', aspectRatio: '3:4' } as const;
const handsFree = { camera: 'back', captureMode: 'hands-free', aspectRatio: '1:1' } as const;

export const hairTemplate: TimelineTemplate = {
  key: 'hair',
  icon: 'hair',
  color: '#8B5CF6',
  angles: [
    { key: 'hairline', overlay: 'head-front', ...selfie },
    { key: 'temple_left', overlay: 'head-temple', ...selfie },
    { key: 'temple_right', overlay: 'head-temple', mirrorOverlay: true, ...selfie },
    { key: 'mid_scalp', overlay: 'head-top', ...handsFree },
    { key: 'crown', overlay: 'head-top', ...handsFree },
    { key: 'nape', overlay: 'head-back', ...handsFree },
  ],
  metrics: [{ key: 'self_rating', unit: '/5', optional: true }],
  tips: ['dryClean', 'sameLight', 'interval', 'crown'],
  reminderIntervalDays: 14,
};
