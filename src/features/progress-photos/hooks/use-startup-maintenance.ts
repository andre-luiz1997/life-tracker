import { useEffect } from 'react';

import { usePhotoService } from './use-photos';

/** Once per launch: removes encrypted files left without a database row (e.g. crash mid-save). */
export function useStartupMaintenance() {
  const service = usePhotoService();
  useEffect(() => {
    try {
      service.removeOrphanFiles();
    } catch (error) {
      if (__DEV__) console.warn('Orphan cleanup failed', error);
    }
  }, [service]);
}
