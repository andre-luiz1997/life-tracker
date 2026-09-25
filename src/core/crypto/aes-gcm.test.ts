import { utf8Decode, utf8Encode } from '@/shared/lib/bytes';

import { decrypt, DecryptionError, encrypt, generateKey } from './aes-gcm';
import { HEADER_LENGTH, InvalidEnvelopeError } from './envelope';

describe('aes-gcm', () => {
  const plaintext = utf8Encode('foto de progresso 📸');

  it('round-trips data', () => {
    const key = generateKey();
    expect(utf8Decode(decrypt(key, encrypt(key, plaintext)))).toBe('foto de progresso 📸');
  });

  it('uses a fresh IV for each encryption', () => {
    const key = generateKey();
    const a = encrypt(key, plaintext);
    const b = encrypt(key, plaintext);
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
    expect(a.length).toBe(HEADER_LENGTH + plaintext.length);
  });

  it('rejects a wrong key', () => {
    const data = encrypt(generateKey(), plaintext);
    expect(() => decrypt(generateKey(), data)).toThrow(DecryptionError);
  });

  it('rejects tampered ciphertext', () => {
    const key = generateKey();
    const data = encrypt(key, plaintext);
    data[data.length - 1]! ^= 0xff;
    expect(() => decrypt(key, data)).toThrow(DecryptionError);
  });

  it('binds ciphertext to its AAD', () => {
    const key = generateKey();
    const data = encrypt(key, plaintext, utf8Encode('photos/a'));
    expect(utf8Decode(decrypt(key, data, utf8Encode('photos/a')))).toBe('foto de progresso 📸');
    expect(() => decrypt(key, data, utf8Encode('photos/b'))).toThrow(DecryptionError);
  });

  it('rejects unknown envelope versions', () => {
    const key = generateKey();
    const data = encrypt(key, plaintext);
    data[0] = 99;
    expect(() => decrypt(key, data)).toThrow(InvalidEnvelopeError);
  });

  it('rejects keys of the wrong size', () => {
    expect(() => encrypt(new Uint8Array(16), plaintext)).toThrow('32 bytes');
  });
});
