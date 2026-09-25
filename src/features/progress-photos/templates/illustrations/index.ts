import type { TemplateKey } from '../../db/progress-photos.schema';
import { bodyIllustrations } from './body';
import type { FigureGender } from './character';
import { faceIllustrations } from './face';
import { hairIllustrations } from './hair';
import { svg } from './parts';

export { FIGURE_GENDERS, type FigureGender } from './character';

const byTemplate: Partial<Record<TemplateKey, Record<string, (g: FigureGender) => string>>> = {
  weight_loss: bodyIllustrations,
  hair: hairIllustrations,
  face: faceIllustrations,
};

const cache = new Map<string, string>();

/**
 * SVG markup of the pose guide for a template angle in the chosen figure style, or null for
 * custom angles/templates. Built once per (angle, style) and cached (the markup is static).
 */
export function angleIllustration(
  templateKey: TemplateKey,
  angleKey: string,
  gender: FigureGender,
): string | null {
  const build = byTemplate[templateKey]?.[angleKey];
  if (!build) return null;
  const id = `${templateKey}/${angleKey}/${gender}`;
  let markup = cache.get(id);
  if (!markup) {
    markup = svg(build(gender));
    cache.set(id, markup);
  }
  return markup;
}
