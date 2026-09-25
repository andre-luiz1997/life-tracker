import type { IconName } from '@/shared/ui';

import type { LevelTarget } from '../capture/level';

import type { TemplateKey } from '../db/progress-photos.schema';

export type CameraFacing = 'front' | 'back';

/**
 * - standard: the user sees the preview and taps the shutter.
 * - timer: phone propped up; countdown with beeps.
 * - hands-free: the user can't see the screen (crown/nape); the level sensor guides with
 *   vibration and fires a burst automatically.
 */
export type CaptureMode = 'standard' | 'timer' | 'hands-free';

export type AspectRatio = '3:4' | '1:1' | '9:16';

/** Silhouette drawn over the camera preview. SVGs arrive in F2. */
export type OverlayKey =
  | 'body-front'
  | 'body-back'
  | 'body-side'
  | 'body-torso'
  | 'body-arms'
  | 'body-legs'
  | 'head-front'
  | 'head-temple'
  | 'head-top'
  | 'head-back'
  | 'face-front'
  | 'face-45'
  | 'face-profile';

export type TemplateAngle = {
  /** Stable key; also the i18n key under `photos:angles`. */
  key: string;
  overlay?: OverlayKey;
  /** Mirror the overlay horizontally (left/right variants share one SVG). */
  mirrorOverlay?: boolean;
  camera: CameraFacing;
  captureMode: CaptureMode;
  /** Pose the level indicator aims for (default: upright). */
  level?: LevelTarget;
  aspectRatio: AspectRatio;
  /** Created but disabled; the user can enable it later. */
  optional?: boolean;
};

export type TemplateMetric = {
  /** Stable key; also the i18n key under `photos:metrics`. */
  key: string;
  unit: string;
  /** Only offered as a suggestion; not created with the timeline. */
  optional?: boolean;
};

export type TimelineTemplate = {
  key: TemplateKey;
  icon: IconName;
  color: string;
  angles: TemplateAngle[];
  metrics: TemplateMetric[];
  /** i18n keys under `photos:tips.<template>`. */
  tips: string[];
  reminderIntervalDays: number | null;
};
