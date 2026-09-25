import { useLocalSearchParams } from 'expo-router';

import { ReviewScreen } from '@/features/progress-photos';

export default function ReviewRoute() {
  const { timelineId } = useLocalSearchParams<{ timelineId: string }>();
  return <ReviewScreen timelineId={timelineId} />;
}
