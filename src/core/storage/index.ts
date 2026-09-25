import { getMasterKey } from '@/core/crypto';

import { createSecureFileStore } from './secure-file-store';

export { createSecureFileStore, type SecureFileStore, type VaultArea } from './secure-file-store';

export const secureFileStore = createSecureFileStore(getMasterKey);
