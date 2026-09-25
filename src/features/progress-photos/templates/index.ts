import type { TemplateKey } from '../db/progress-photos.schema';
import { customAngleDefaults, customTemplate } from './custom';
import { faceTemplate } from './face';
import { hairTemplate } from './hair';
import type { TemplateAngle, TimelineTemplate } from './types';
import { weightLossTemplate } from './weight-loss';

export * from './types';
export { customAngleDefaults };

/** Display order in the template picker. */
export const templates: readonly TimelineTemplate[] = [
  weightLossTemplate,
  hairTemplate,
  faceTemplate,
  customTemplate,
];

const byKey = Object.fromEntries(templates.map((t) => [t.key, t])) as Record<
  TemplateKey,
  TimelineTemplate
>;

export function getTemplate(key: TemplateKey): TimelineTemplate {
  return byKey[key];
}

/** Capture settings for an angle: from its template, or custom defaults for user-created ones. */
export function resolveAngleConfig(templateKey: TemplateKey, angleKey: string): TemplateAngle {
  return (
    byKey[templateKey].angles.find((a) => a.key === angleKey) ?? {
      key: angleKey,
      ...customAngleDefaults,
    }
  );
}

/** Palette offered in the timeline form (template colors first). */
export const TIMELINE_COLORS = [
  '#F97316',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#3B82F6',
  '#22C55E',
  '#EAB308',
  '#EF4444',
] as const;
