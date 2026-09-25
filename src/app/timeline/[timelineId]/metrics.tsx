import { useLocalSearchParams } from 'expo-router';

import { MetricsScreen } from '@/features/progress-photos';

export default function MetricsRoute() {
  const { timelineId } = useLocalSearchParams<{ timelineId: string }>();
  return <MetricsScreen timelineId={timelineId} />;
}
