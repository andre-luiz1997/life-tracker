import { useLocalSearchParams } from 'expo-router';

import { type PinSetupMode, PinSetupScreen } from '@/features/security';

export default function PinRoute() {
  const { mode } = useLocalSearchParams<{ mode?: PinSetupMode }>();
  return <PinSetupScreen mode={mode ?? 'create'} />;
}
