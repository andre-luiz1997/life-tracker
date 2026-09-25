import { useLocalSearchParams } from 'expo-router';

import { ViewerScreen } from '@/features/progress-photos';

export default function ViewerRoute() {
  const { timelineId, angleId, photoId } = useLocalSearchParams<{
    timelineId: string;
    angleId: string;
    photoId?: string;
  }>();
  return <ViewerScreen timelineId={timelineId} angleId={angleId} photoId={photoId} />;
}
