import { useLocalSearchParams } from 'expo-router';

import { CompareScreen } from '@/features/progress-photos';

export default function CompareRoute() {
  const { timelineId, angleId } = useLocalSearchParams<{ timelineId: string; angleId?: string }>();
  return <CompareScreen timelineId={timelineId} angleId={angleId} />;
}
