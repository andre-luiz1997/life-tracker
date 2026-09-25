import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';

/** Haptic + sound cues for timer and hands-free capture (the user may not see the screen). */
export function useCaptureFeedback() {
  const tick = useAudioPlayer(require('@/assets/sounds/beep.wav'));
  const final = useAudioPlayer(require('@/assets/sounds/beep-final.wav'));

  useEffect(() => {
    // Short cues mixed with whatever else is playing; respect the iOS silent switch.
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(
      () => {},
    );
  }, []);

  const play = useCallback((player: typeof tick) => {
    player.seekTo(0).catch(() => {});
    player.play();
  }, []);

  const softPulse = useCallback(() => {
    if (Platform.OS === 'android') {
      Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Clock_Tick).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, []);

  const strongPulse = useCallback(() => {
    if (Platform.OS === 'android') {
      Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm).catch(() => {});
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, []);

  return useMemo(
    () => ({
      softPulse,
      strongPulse,
      tick: () => play(tick),
      finalBeep: () => play(final),
    }),
    [softPulse, strongPulse, play, tick, final],
  );
}
