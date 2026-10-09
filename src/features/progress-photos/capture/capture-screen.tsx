import { CameraView, useCameraPermissions } from 'expo-camera';
import { useKeepAwake } from 'expo-keep-awake';
import { router, Stack } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '@/core/i18n';
import { withExternalActivity } from '@/core/lifecycle';
import { cn } from '@/shared/lib/cn';
import { Button, Chip, EmptyState, IconButton, Screen, Text } from '@/shared/ui';

import { AngleIllustration, hasIllustration } from '../components/angle-illustration';
import type { TemplateKey } from '../db/progress-photos.schema';
import { useGhostPhoto } from '../hooks/use-photos';
import { useTimelineDetails } from '../hooks/use-timelines';
import { resolveAngleConfig } from '../templates';
import { Silhouette } from '../templates/overlays/silhouette';
import type { OverlayKey } from '../templates/types';
import { type PendingShot, useCaptureSession } from './capture-session.store';
import { GhostOverlay, GridOverlay, LevelIndicator } from './components/camera-overlays';
import {
  DEFAULT_HANDS_FREE_CONFIG,
  type HandsFreeState,
  initialHandsFreeState,
  stepHandsFree,
} from './hands-free';
import type { LevelReading } from './level';
import { useCountdown } from './use-countdown';
import { useCaptureFeedback } from './use-feedback';
import { useLevel } from './use-level';

const TIMER_OPTIONS = [0, 3, 5, 10] as const;
const GHOST_OPACITIES = [0, 0.3, 0.5, 0.7] as const;
const BURST_SIZE = 3;
const BURST_GAP_MS = 350;

type Mode = 'standard' | 'hands-free';
type HandsFreePhase = 'idle' | HandsFreeState['phase'];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function CaptureScreen({ timelineId, angleId }: { timelineId: string; angleId: string }) {
  const { t } = useTranslation('photos');
  const details = useTimelineDetails(timelineId);
  const [permission, requestPermission] = useCameraPermissions();

  if (!permission || details.status === 'loading') return null;

  const angle = details.data?.angles.find((a) => a.id === angleId);
  if (!details.data || !angle) return <EmptyState title={t('timeline.notFound')} />;

  if (!permission.granted) {
    return (
      <Screen className="justify-center">
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyState
          title={t('capture.permissionTitle')}
          description={t('capture.permissionMessage')}
          action={
            <View className="w-full gap-2">
              <Button
                label={
                  permission.canAskAgain ? t('capture.permissionButton') : t('capture.openSettings')
                }
                onPress={() =>
                  withExternalActivity(async () => {
                    if (permission.canAskAgain) await requestPermission();
                    else await Linking.openSettings();
                  })
                }
              />
              <Button variant="ghost" label={t('capture.close')} onPress={() => router.back()} />
            </View>
          }
        />
      </Screen>
    );
  }

  const config = resolveAngleConfig(details.data.timeline.templateKey, angle.key);
  return (
    <Camera
      timelineId={timelineId}
      templateKey={details.data.timeline.templateKey}
      angleKey={angle.key}
      angleId={angle.id}
      angleLabel={angle.label}
      // The template wins over the key saved at creation, so older timelines get updated outlines.
      overlay={config.overlay ?? (angle.overlayKey as OverlayKey | null) ?? null}
      mirrorOverlay={config.mirrorOverlay ?? false}
      initialFacing={config.camera}
      initialMode={config.captureMode === 'hands-free' ? 'hands-free' : 'standard'}
      initialTimer={config.captureMode === 'timer' ? 5 : 0}
      levelTarget={config.level ?? 'upright'}
    />
  );
}

type CameraProps = {
  timelineId: string;
  templateKey: TemplateKey;
  angleKey: string;
  angleId: string;
  angleLabel: string;
  overlay: OverlayKey | null;
  mirrorOverlay: boolean;
  initialFacing: 'front' | 'back';
  initialMode: Mode;
  initialTimer: number;
  levelTarget: 'upright' | 'flat';
};

function Camera(props: CameraProps) {
  useKeepAwake();
  const { t } = useTranslation('photos');
  const insets = useSafeAreaInsets();
  const feedback = useCaptureFeedback();
  const entryId = useCaptureSession((s) => s.entryId);
  const setPending = useCaptureSession((s) => s.setPending);
  const ghost = useGhostPhoto(props.angleId, entryId);

  const cameraRef = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [facing, setFacing] = useState(props.initialFacing);
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [timer, setTimer] = useState(props.initialTimer);
  const [showGrid, setShowGrid] = useState(true);
  const [showSilhouette, setShowSilhouette] = useState(true);
  const hasGuide = hasIllustration(props.templateKey, props.angleKey);
  const [showGuide, setShowGuide] = useState(hasGuide);
  const [ghostOpacity, setGhostOpacity] = useState<number>(0.3);
  const [mode, setMode] = useState<Mode>(props.initialMode);
  const [handsFreePhase, setHandsFreePhase] = useState<HandsFreePhase>('idle');
  const handsFreeState = useRef<HandsFreeState>(initialHandsFreeState);

  const goToReview = useCallback(
    (shots: PendingShot[]) => {
      setPending({ angleId: props.angleId, source: 'camera', shots });
      router.push({
        pathname: '/timeline/[timelineId]/review',
        params: { timelineId: props.timelineId },
      });
    },
    [props.angleId, props.timelineId, setPending],
  );

  const takeShots = useCallback(
    async (count: number) => {
      const camera = cameraRef.current;
      if (!camera || busy) return;
      setBusy(true);
      try {
        const shots: PendingShot[] = [];
        for (let i = 0; i < count; i++) {
          if (i > 0) await sleep(BURST_GAP_MS);
          const photo = await camera.takePictureAsync({ quality: 0.95, shutterSound: count === 1 });
          shots.push({ uri: photo.uri, width: photo.width, height: photo.height });
        }
        goToReview(shots);
      } finally {
        setBusy(false);
        // Coming back from review (retake) starts hands-free from scratch.
        handsFreeState.current = initialHandsFreeState;
        setHandsFreePhase('idle');
      }
    },
    [busy, goToReview],
  );

  const countdown = useCountdown({
    onTick: () => feedback.tick(),
    onDone: () => {
      feedback.finalBeep();
      void takeShots(1);
    },
  });

  // Hands-free loop: every level sample advances the state machine.
  const onLevelSample = useCallback(
    (reading: LevelReading, now: number) => {
      if (mode !== 'hands-free' || handsFreePhase === 'idle' || handsFreePhase === 'fired') return;
      const step = stepHandsFree(
        handsFreeState.current,
        reading.deviation,
        now,
        DEFAULT_HANDS_FREE_CONFIG,
      );
      handsFreeState.current = step.state;
      if (step.pulse === 'soft') feedback.softPulse();
      if (step.pulse === 'strong') feedback.strongPulse();
      if (step.state.phase !== handsFreePhase) setHandsFreePhase(step.state.phase);
      if (step.fire) {
        feedback.finalBeep();
        void takeShots(BURST_SIZE);
      }
    },
    [mode, handsFreePhase, feedback, takeShots],
  );

  const level = useLevel(props.levelTarget, { onSample: onLevelSample });

  const startHandsFree = () => {
    handsFreeState.current = initialHandsFreeState;
    setHandsFreePhase('searching');
  };

  const onShutter = () => {
    if (countdown.remaining !== null) return countdown.cancel();
    if (timer > 0) return countdown.start(timer);
    void takeShots(1);
  };

  const cycle = <T,>(options: readonly T[], value: T) =>
    options[(options.indexOf(value) + 1) % options.length] as T;

  const handsFreeLabel = {
    idle: t('capture.handsFreeHint'),
    searching: t('capture.handsFreeSearching'),
    holding: t('capture.handsFreeHolding'),
    fired: t('capture.handsFreeDone'),
  }[handsFreePhase];

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-1 overflow-hidden" style={{ marginTop: insets.top }}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          flash={flash}
          mode="picture"
          onCameraReady={() => setReady(true)}
        />
        {ghost.data && ghostOpacity > 0 ? (
          <GhostOverlay
            fileName={ghost.data.fileName}
            opacity={ghostOpacity}
            mirror={facing === 'front'}
          />
        ) : null}
        {showGrid ? <GridOverlay /> : null}
        {showSilhouette && props.overlay ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill} className="p-6">
            <Silhouette overlay={props.overlay} mirror={props.mirrorOverlay} />
          </View>
        ) : null}

        {/* Top bar */}
        <View className="absolute left-0 right-0 top-0 flex-row items-center justify-between bg-black/30 px-2 py-1">
          <IconButton
            icon="close"
            color="on-dark"
            accessibilityLabel={t('capture.close')}
            onPress={() => router.back()}
          />
          <Text className="flex-1 text-center font-body-semibold text-white" numberOfLines={1}>
            {props.angleLabel}
          </Text>
          <View className="w-10" />
        </View>

        <View className="absolute right-3 top-16 gap-2">
          {hasGuide ? (
            <Chip
              tone="onDark"
              role="switch"
              label={t('capture.guide')}
              selected={showGuide}
              onPress={() => setShowGuide((v) => !v)}
            />
          ) : null}
          <Chip
            tone="onDark"
            role="switch"
            label={t('capture.grid')}
            selected={showGrid}
            onPress={() => setShowGrid((v) => !v)}
          />
          {props.overlay ? (
            <Chip
              tone="onDark"
              role="switch"
              label={t('capture.silhouette')}
              selected={showSilhouette}
              onPress={() => setShowSilhouette((v) => !v)}
            />
          ) : null}
          {ghost.data ? (
            <Chip
              tone="onDark"
              role="switch"
              label={`${t('capture.ghost')} ${Math.round(ghostOpacity * 100)}%`}
              accessibilityLabel={t('capture.ghostOpacity')}
              selected={ghostOpacity > 0}
              onPress={() =>
                setGhostOpacity((v) =>
                  cycle(GHOST_OPACITIES, v as (typeof GHOST_OPACITIES)[number]),
                )
              }
            />
          ) : null}
          {mode === 'standard' ? (
            <Chip
              tone="onDark"
              role="switch"
              label={timer ? t('capture.timerSeconds', { count: timer }) : t('capture.timerOff')}
              accessibilityLabel={t('capture.timer')}
              selected={timer > 0}
              onPress={() =>
                setTimer((v) => cycle(TIMER_OPTIONS, v as (typeof TIMER_OPTIONS)[number]))
              }
            />
          ) : null}
          {facing === 'back' ? (
            <Chip
              tone="onDark"
              role="switch"
              label={t('capture.flash')}
              selected={flash === 'on'}
              onPress={() => setFlash((f) => (f === 'on' ? 'off' : 'on'))}
            />
          ) : null}
        </View>

        <View pointerEvents="none" className="absolute left-3 top-16 gap-3">
          <LevelIndicator reading={level} />
          {showGuide ? (
            <AngleIllustration
              templateKey={props.templateKey}
              angleKey={props.angleKey}
              size={112}
              className="border-2 border-white/80"
            />
          ) : null}
        </View>

        {countdown.remaining !== null ? (
          <View
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            className="items-center justify-center">
            <Text className="font-body-bold text-8xl text-white">{countdown.remaining}</Text>
          </View>
        ) : null}
      </View>

      {/* Bottom controls */}
      <View className="gap-3 px-6 pt-4" style={{ paddingBottom: insets.bottom + 16 }}>
        {mode === 'hands-free' ? (
          <View className="gap-3">
            <Text className="text-center text-white" accessibilityLiveRegion="polite">
              {handsFreeLabel}
            </Text>
            {handsFreePhase === 'idle' ? (
              <Button
                label={t('capture.handsFreeStart')}
                onPress={startHandsFree}
                disabled={!ready || busy}
              />
            ) : (
              <Button
                variant="secondary"
                label={t('capture.handsFreeStop')}
                onPress={() => setHandsFreePhase('idle')}
              />
            )}
            <Button
              variant="onDark"
              label={t('capture.askHelp')}
              onPress={() => setMode('standard')}
            />
          </View>
        ) : (
          <View className="flex-row items-center justify-between">
            <View className="w-12" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('capture.shutter')}
              disabled={!ready || busy}
              onPress={onShutter}
              className={cn(
                'h-20 w-20 items-center justify-center rounded-full border-4 border-white',
                (!ready || busy) && 'opacity-50',
              )}>
              <View
                className={cn(
                  'h-16 w-16 rounded-full',
                  countdown.remaining !== null ? 'bg-danger' : 'bg-white',
                )}
              />
            </Pressable>
            <IconButton
              icon="camera"
              color="on-dark"
              accessibilityLabel={t('capture.flipCamera')}
              onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
            />
          </View>
        )}
        {props.initialMode === 'hands-free' && mode === 'standard' ? (
          <Button
            variant="onDark"
            label={t('capture.handsFree')}
            onPress={() => setMode('hands-free')}
          />
        ) : null}
      </View>
    </View>
  );
}
