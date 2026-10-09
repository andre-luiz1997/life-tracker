import type { ImageSourcePropType } from 'react-native';

import type { TemplateKey } from '../../db/progress-photos.schema';
import type { FigureGender } from '../illustrations';
import { posePhotoFiles } from './registry';

/** Right-hand variants reuse the left photo, mirrored (same as the drawn guides). */
const MIRRORED: Record<string, string> = {
  body_right: 'body_left',
  temple_right: 'temple_left',
  face_45_right: 'face_45_left',
  profile_right: 'profile_left',
};

export type PosePhoto = { source: ImageSourcePropType; mirror: boolean };

/**
 * Realistic example photo for a template angle in the chosen style, or null when none was
 * imported (the drawn guide is used instead). Files come from `scripts/pose-photos.sh`.
 */
export function posePhoto(
  templateKey: TemplateKey,
  angleKey: string,
  gender: FigureGender,
  files: Record<string, ImageSourcePropType> = posePhotoFiles,
): PosePhoto | null {
  const base = MIRRORED[angleKey];
  const source = files[`${templateKey}/${base ?? angleKey}/${gender}`];
  return source ? { source, mirror: base !== undefined } : null;
}
