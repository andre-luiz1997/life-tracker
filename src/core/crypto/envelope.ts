/**
 * Binary envelope for encrypted payloads: [version (1) | iv (12) | tag (16) | ciphertext].
 */
export const ENVELOPE_VERSION = 1;
export const IV_LENGTH = 12;
export const TAG_LENGTH = 16;
export const HEADER_LENGTH = 1 + IV_LENGTH + TAG_LENGTH;

export type Envelope = {
  iv: Uint8Array;
  tag: Uint8Array;
  ciphertext: Uint8Array;
};

export class InvalidEnvelopeError extends Error {
  override name = 'InvalidEnvelopeError';
}

export function packEnvelope({ iv, tag, ciphertext }: Envelope): Uint8Array {
  if (iv.length !== IV_LENGTH) throw new InvalidEnvelopeError('Invalid IV length');
  if (tag.length !== TAG_LENGTH) throw new InvalidEnvelopeError('Invalid tag length');

  const out = new Uint8Array(HEADER_LENGTH + ciphertext.length);
  out[0] = ENVELOPE_VERSION;
  out.set(iv, 1);
  out.set(tag, 1 + IV_LENGTH);
  out.set(ciphertext, HEADER_LENGTH);
  return out;
}

export function unpackEnvelope(data: Uint8Array): Envelope {
  if (data.length < HEADER_LENGTH) throw new InvalidEnvelopeError('Payload too short');
  if (data[0] !== ENVELOPE_VERSION) {
    throw new InvalidEnvelopeError(`Unsupported envelope version: ${data[0]}`);
  }
  return {
    iv: data.subarray(1, 1 + IV_LENGTH),
    tag: data.subarray(1 + IV_LENGTH, HEADER_LENGTH),
    ciphertext: data.subarray(HEADER_LENGTH),
  };
}
