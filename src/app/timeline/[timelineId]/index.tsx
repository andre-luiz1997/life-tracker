import { useLocalSearchParams } from 'expo-router';

import { TimelineScreen } from '@/features/progress-photos';

export default function TimelineRoute() {
  const { timelineId } = useLocalSearchParams<{ timelineId: string }>();
  return <TimelineScreen timelineId={timelineId} />;
}
