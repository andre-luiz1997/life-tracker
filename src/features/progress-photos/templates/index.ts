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

/** Pastel palette offered in the timeline form (template colors first). Ink icons/text on top. */
export const TIMELINE_COLORS = [
  '#F6A58F', // salmon
  '#B5BEF5', // lavender
  '#F4B6C9', // rose
  '#A8E6C3', // mint
  '#F7D786', // yellow
  '#A9D8F5', // sky
  '#F9C99B', // peach
  '#D6BCF2', // lilac
] as const;
