import { isInExternalActivity, withExternalActivity } from './external-activity';

describe('external activity', () => {
  it('is active during the call and for a short grace period after', async () => {
    let during = false;
    await withExternalActivity(async () => {
      during = isInExternalActivity();
    });
    expect(during).toBe(true);
    expect(isInExternalActivity()).toBe(true);
    expect(isInExternalActivity(Date.now() + 2000)).toBe(false);
  });

  it('ends even when the call throws', async () => {
    await expect(
      withExternalActivity(async () => {
        throw new Error('cancelled');
      }),
    ).rejects.toThrow('cancelled');
    expect(isInExternalActivity(Date.now() + 2000)).toBe(false);
  });
});
