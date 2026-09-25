import { useMemo } from 'react';

import { hashSecret, verifySecret } from '@/core/crypto';
import { appSettings, getDatabase, useDbQuery } from '@/core/db';
import { deleteSecret, getSecret, SecureKeys, setSecret } from '@/core/secure-store';

import { createSecurityService } from '../services/security.service';

export function createDefaultSecurityService() {
  return createSecurityService({
    db: getDatabase(),
    secrets: {
      get: () => getSecret(SecureKeys.pinHash),
      set: (value) => setSecret(SecureKeys.pinHash, value),
      remove: () => deleteSecret(SecureKeys.pinHash),
    },
    hash: (pin) => hashSecret(pin),
    verify: verifySecret,
  });
}

export function useSecurityService() {
  return useMemo(() => createDefaultSecurityService(), []);
}

export function useSecurityPreferences() {
  const service = useSecurityService();
  return useDbQuery(() => service.getPreferences(), [appSettings], [service]);
}
