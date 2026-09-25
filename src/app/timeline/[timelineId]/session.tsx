import { useLocalSearchParams } from 'expo-router';

import { SessionScreen } from '@/features/progress-photos';

export default function SessionRoute() {
  const { timelineId } = useLocalSearchParams<{ timelineId: string }>();
  return <SessionScreen timelineId={timelineId} />;
}
