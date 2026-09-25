import { templates } from '..';
import { angleIllustration, FIGURE_GENDERS } from '.';

describe('angle illustrations', () => {
  const predefined = templates.filter((t) => t.key !== 'custom');

  it.each(
    predefined.flatMap((t) =>
      t.angles.flatMap((a) => FIGURE_GENDERS.map((g) => [t.key, a.key, g] as const)),
    ),
  )('%s/%s (%s) has a well-formed guide', (templateKey, angleKey, gender) => {
    const xml = angleIllustration(templateKey, angleKey, gender);
    expect(xml).toMatch(/^<svg [^>]*viewBox="0 0 200 200"/);
    expect(xml).toMatch(/<\/svg>$/);
    expect(xml).not.toMatch(/undefined|NaN/);
    // Balanced groups (mirror/zoom wrappers).
    expect(xml!.match(/<g /g)?.length ?? 0).toBe(xml!.match(/<\/g>/g)?.length ?? 0);
  });

  it('draws each style differently', () => {
    const [f, m, n] = FIGURE_GENDERS.map((g) => angleIllustration('weight_loss', 'body_front', g));
    expect(new Set([f, m, n]).size).toBe(3);
  });

  it('has no guide for custom angles', () => {
    expect(angleIllustration('custom', 'main', 'neutral')).toBeNull();
    expect(angleIllustration('hair', 'custom_123', 'neutral')).toBeNull();
  });

  it('mirrors left/right variants from the same drawing', () => {
    expect(angleIllustration('face', 'profile_right', 'feminine')).toContain('scale(-1 1)');
    expect(angleIllustration('face', 'profile_left', 'feminine')).not.toContain('scale(-1 1)');
  });
});
