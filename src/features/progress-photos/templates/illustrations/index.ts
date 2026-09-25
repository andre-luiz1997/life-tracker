import type { TemplateKey } from '../../db/progress-photos.schema';
import { bodyIllustrations } from './body';
import { faceIllustrations } from './face';
import { hairIllustrations } from './hair';
import { svg } from './parts';

const byTemplate: Partial<Record<TemplateKey, Record<string, () => string>>> = {
  weight_loss: bodyIllustrations,
  hair: hairIllustrations,
  face: faceIllustrations,
};

const cache = new Map<string, string>();

/**
 * SVG markup of the pose guide for a template angle, or null for custom angles/templates.
 * Built once per angle and cached (the markup is static).
 */
export function angleIllustration(templateKey: TemplateKey, angleKey: string): string | null {
  const build = byTemplate[templateKey]?.[angleKey];
  if (!build) return null;
  const id = `${templateKey}/${angleKey}`;
  let markup = cache.get(id);
  if (!markup) {
    markup = svg(build());
    cache.set(id, markup);
  }
  return markup;
}
