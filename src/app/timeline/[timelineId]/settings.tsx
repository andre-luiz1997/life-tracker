import { useLocalSearchParams } from 'expo-router';

import { TimelineSettingsScreen } from '@/features/progress-photos';

export default function TimelineSettingsRoute() {
  const { timelineId } = useLocalSearchParams<{ timelineId: string }>();
  return <TimelineSettingsScreen timelineId={timelineId} />;
}
