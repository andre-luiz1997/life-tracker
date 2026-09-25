import type { TFunction } from 'i18next';
import { Alert } from 'react-native';

import { TimelineError } from '../services/timeline.service';

/** Runs a service call and turns known domain errors into a user-facing alert. */
export function runGuarded(t: TFunction<'photos'>, action: () => void) {
  try {
    action();
  } catch (error) {
    if (error instanceof TimelineError && error.code === 'last_active_angle') {
      Alert.alert(t('timelineSettings.lastAngle'));
      return;
    }
    Alert.alert(t('errors.generic', { ns: 'common' }));
    if (__DEV__) console.error(error);
  }
}
