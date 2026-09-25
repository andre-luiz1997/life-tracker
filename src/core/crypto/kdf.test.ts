import { hashSecret, verifySecret } from './kdf';

// Low iteration count keeps the test fast; production uses PBKDF2_ITERATIONS.
const ITER = 1000;

describe('kdf', () => {
  it('verifies the correct secret', async () => {
    const record = await hashSecret('123456', ITER);
    expect(record).toMatch(/^pbkdf2-sha256\$1000\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
    await expect(verifySecret('123456', record)).resolves.toBe(true);
  });

  it('rejects a wrong secret', async () => {
    const record = await hashSecret('123456', ITER);
    await expect(verifySecret('654321', record)).resolves.toBe(false);
  });

  it('salts each hash', async () => {
    expect(await hashSecret('1234', ITER)).not.toBe(await hashSecret('1234', ITER));
  });

  it('rejects malformed records', async () => {
    await expect(verifySecret('1234', 'garbage')).resolves.toBe(false);
  });
});
