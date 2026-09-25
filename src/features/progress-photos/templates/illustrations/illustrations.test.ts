import { templates } from '..';
import { angleIllustration } from '.';

describe('angle illustrations', () => {
  const predefined = templates.filter((t) => t.key !== 'custom');

  it.each(predefined.flatMap((t) => t.angles.map((a) => [t.key, a.key] as const)))(
    '%s/%s has a well-formed guide',
    (templateKey, angleKey) => {
      const xml = angleIllustration(templateKey, angleKey);
      expect(xml).toMatch(/^<svg [^>]*viewBox="0 0 200 200"/);
      expect(xml).toMatch(/<\/svg>$/);
      expect(xml).not.toMatch(/undefined|NaN/);
      // Balanced groups (mirror/zoom wrappers).
      expect(xml!.match(/<g /g)?.length ?? 0).toBe(xml!.match(/<\/g>/g)?.length ?? 0);
    },
  );

  it('has no guide for custom angles', () => {
    expect(angleIllustration('custom', 'main')).toBeNull();
    expect(angleIllustration('hair', 'custom_123')).toBeNull();
  });

  it('mirrors left/right variants from the same drawing', () => {
    expect(angleIllustration('face', 'profile_right')).toContain('scale(-1 1)');
    expect(angleIllustration('face', 'profile_left')).not.toContain('scale(-1 1)');
  });
});
