import { useLocalSearchParams } from 'expo-router';

import { CaptureScreen } from '@/features/progress-photos';

export default function CaptureRoute() {
  const { timelineId, angleId } = useLocalSearchParams<{ timelineId: string; angleId: string }>();
  return <CaptureScreen timelineId={timelineId} angleId={angleId} />;
}
