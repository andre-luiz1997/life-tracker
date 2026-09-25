export const fromByteArray = (bytes: Uint8Array) => Buffer.from(bytes).toString('base64');
export const toByteArray = (b64: string) => new Uint8Array(Buffer.from(b64, 'base64'));
