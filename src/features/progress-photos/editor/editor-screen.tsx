import { Canvas, Image as SkiaImage, type SkImage } from '@shopify/react-native-skia';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import { useEffect, useMemo, useReducer, useState } from 'react';
import {
  ActivityIndicator,
  type LayoutChangeEvent,
  PixelRatio,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '@/core/i18n';
import { cn } from '@/shared/lib/cn';
import { uuidv7 } from '@/shared/lib/id';
import { Button, Chip, EmptyState, IconButton, Slider, Text } from '@/shared/ui';

import { type PendingShot, useCaptureSession } from '../capture/capture-session.store';
import { MAX_PHOTO_SIDE, MAX_THUMB_SIDE, prepareForEditing } from '../capture/image-processing';
import { useSavePending } from '../capture/use-save-pending';
import { useFullPhoto } from '../hooks/use-photo-source';
import { useGhostPhoto } from '../hooks/use-photos';
import { useTimelineDetails } from '../hooks/use-timelines';
import { resolveAngleConfig } from '../templates';
import {
  type AspectKey,
  type CensorKind,
  cropToImage,
  type EditAction,
  initialEditState,
  type NormRect,
  outputSize,
  rectFromPoints,
  type Size,
} from './edit-state';
import { historyReducer } from './history';
import { encodeJpeg, loadSkImage, renderEdit } from './renderer';

type Tool = 'frame' | 'light' | 'censor';
const ASPECTS: AspectKey[] = ['3:4', '1:1', '9:16', 'free'];
const CENSOR_KINDS: CensorKind[] = ['blur', 'pixelate', 'solid'];
const PHOTO_QUALITY = 0.85;
const THUMB_QUALITY = 0.7;
const MAX_PREVIEW_SIDE = 1440;

export function EditorScreen({ timelineId, shotIndex }: { timelineId: string; shotIndex: number }) {
  const { t } = useTranslation('photos');
  const pending = useCaptureSession((s) => s.pending);
  const details = useTimelineDetails(timelineId);
  const shot = pending?.shots[shotIndex];
  const [image, setImage] = useState<SkImage | null | 'error'>(null);

  // Downscale once (≤ 2560 px) so Skia never decodes a 48 MP original.
  const shotUri = shot?.uri;
  const sizeKey = shot && pending?.source === 'camera' ? `${shot.width}x${shot.height}` : '';
  useEffect(() => {
    if (!shotUri) return;
    let active = true;
    const [w, h] = sizeKey.split('x').map(Number);
    prepareForEditing(shotUri, w && h ? { width: w, height: h } : undefined)
      .then(({ bytes }) => active && setImage(loadSkImage(bytes) ?? 'error'))
      .catch(() => active && setImage('error'));
    return () => {
      active = false;
    };
  }, [shotUri, sizeKey]);

  const angle = details.data?.angles.find((a) => a.id === pending?.angleId);
  if (!pending || !shot || !details.data || !angle) return null;

  if (image === 'error') return <EmptyState title={t('editor.loadError')} />;
  if (!image) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-black">
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator color="white" />
        <Text className="text-white">{t('editor.loading')}</Text>
      </View>
    );
  }

  const config = resolveAngleConfig(details.data.timeline.templateKey, angle.key);
  return (
    <Editor
      image={image}
      shot={shot}
      timelineId={timelineId}
      angleId={angle.id}
      initialAspect={config.aspectRatio}
    />
  );
}

type EditorProps = {
  image: SkImage;
  shot: PendingShot;
  timelineId: string;
  angleId: string;
  initialAspect: AspectKey;
};

function Editor({ image, shot, timelineId, angleId, initialAspect }: EditorProps) {
  const { t } = useTranslation('photos');
  const insets = useSafeAreaInsets();
  const { save, saving } = useSavePending(timelineId);
  const entryId = useCaptureSession((s) => s.entryId);
  const ghost = useGhostPhoto(angleId, entryId);
  const ghostUri = useFullPhoto(ghost.data?.fileName);

  const imageSize: Size = useMemo(
    () => ({ width: image.width(), height: image.height() }),
    [image],
  );
  const [history, dispatch] = useReducer(historyReducer, undefined, () => ({
    past: [],
    present: initialEditState(imageSize, initialAspect),
  }));
  const state = history.present;

  const [tool, setTool] = useState<Tool>('frame');
  const [showGhost, setShowGhost] = useState(true);
  const [censorKind, setCensorKind] = useState<CensorKind>('blur');
  const [area, setArea] = useState<Size | null>(null);
  const [draft, setDraft] = useState<NormRect | null>(null);

  const apply = (action: EditAction) => dispatch({ type: 'apply', action, image: imageSize });
  const preview = (action: EditAction) => dispatch({ type: 'preview', action, image: imageSize });
  const checkpoint = () => dispatch({ type: 'checkpoint' });

  // Frame: the output aspect fitted into the available area.
  const frame = useMemo(() => {
    if (!area) return null;
    const out = outputSize(imageSize, state, 10_000);
    const scale = Math.min(area.width / out.width, area.height / out.height);
    return { width: out.width * scale, height: out.height * scale };
  }, [area, imageSize, state]);

  const previewImage = useMemo(() => {
    if (!frame) return null;
    const side = Math.min(MAX_PREVIEW_SIDE, Math.max(frame.width, frame.height) * PixelRatio.get());
    return renderEdit(image, state, side);
  }, [image, state, frame]);

  // Gesture deltas are tracked between frames so each update is incremental.
  // Shared values (not refs): gesture callbacks are built during render (React Compiler rules).
  const last = useSharedValue({ x: 0, y: 0, scale: 1 });
  const censorStart = useSharedValue({ x: 0, y: 0 });

  const frameGesture = Gesture.Simultaneous(
    Gesture.Pan()
      .runOnJS(true)
      .onBegin(() => {
        last.set({ ...last.get(), x: 0, y: 0 });
        checkpoint();
      })
      .onUpdate((e) => {
        if (!frame) return;
        const prev = last.get();
        preview({
          type: 'panZoom',
          dx: (e.translationX - prev.x) / frame.width,
          dy: (e.translationY - prev.y) / frame.height,
        });
        last.set({ ...prev, x: e.translationX, y: e.translationY });
      }),
    Gesture.Pinch()
      .runOnJS(true)
      .onBegin(() => {
        last.set({ ...last.get(), scale: 1 });
      })
      .onUpdate((e) => {
        const prev = last.get();
        preview({ type: 'panZoom', zoom: e.scale / prev.scale });
        last.set({ ...prev, scale: e.scale });
      }),
  );

  const censorGesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(4)
    .onBegin((e) => {
      if (!frame) return;
      censorStart.set({ x: e.x / frame.width, y: e.y / frame.height });
    })
    .onUpdate((e) => {
      if (!frame) return;
      setDraft(rectFromPoints(censorStart.get(), { x: e.x / frame.width, y: e.y / frame.height }));
    })
    .onEnd((e) => {
      if (!frame) return;
      const end = { x: e.x / frame.width, y: e.y / frame.height };
      // Drawn in crop (screen) space; stored in image space so it survives re-cropping.
      const r = rectFromPoints(censorStart.get(), end);
      const a = cropToImage(state.crop, { x: r.x, y: r.y });
      const b = cropToImage(state.crop, { x: r.x + r.w, y: r.y + r.h });
      apply({
        type: 'addCensor',
        censor: { id: uuidv7(), kind: censorKind, ...rectFromPoints(a, b) },
      });
    })
    .onFinalize(() => setDraft(null));

  const onSave = () => {
    const full = renderEdit(image, state, MAX_PHOTO_SIDE);
    const thumb = renderEdit(image, state, MAX_THUMB_SIDE);
    if (!full || !thumb) return;
    void save(shot, {
      full: { bytes: encodeJpeg(full, PHOTO_QUALITY), width: full.width(), height: full.height() },
      thumb: { bytes: encodeJpeg(thumb, THUMB_QUALITY) },
    });
  };

  return (
    <View
      className="flex-1 bg-black"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 8 }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center justify-between px-2 py-1">
        <Button
          variant="ghost"
          label={t('editor.cancel')}
          onPress={() => router.back()}
          disabled={saving}
        />
        <IconButton
          icon="undo"
          color="on-dark"
          accessibilityLabel={t('editor.undo')}
          disabled={!history.past.length || saving}
          onPress={() => dispatch({ type: 'undo' })}
        />
        <Button label={t('editor.save')} onPress={onSave} loading={saving} />
      </View>

      <View
        className="flex-1 items-center justify-center p-3"
        onLayout={(e: LayoutChangeEvent) => {
          const { width, height } = e.nativeEvent.layout;
          setArea({ width: width - 24, height: height - 24 });
        }}>
        {frame && previewImage ? (
          <GestureDetector gesture={tool === 'censor' ? censorGesture : frameGesture}>
            <View style={frame} collapsable={false}>
              <Canvas style={frame}>
                <SkiaImage
                  image={previewImage}
                  x={0}
                  y={0}
                  width={frame.width}
                  height={frame.height}
                  fit="fill"
                />
              </Canvas>
              {tool === 'frame' && showGhost && ghostUri ? (
                <Image
                  source={{ uri: ghostUri }}
                  cachePolicy="none"
                  contentFit="cover"
                  pointerEvents="none"
                  style={{ position: 'absolute', ...frame, opacity: 0.4 }}
                />
              ) : null}
              {draft ? (
                <View
                  pointerEvents="none"
                  className="absolute border-2 border-white bg-white/20"
                  style={{
                    left: draft.x * frame.width,
                    top: draft.y * frame.height,
                    width: draft.w * frame.width,
                    height: draft.h * frame.height,
                  }}
                />
              ) : null}
            </View>
          </GestureDetector>
        ) : null}
      </View>

      <View className="gap-3 px-4 pt-2">
        {tool === 'frame' ? (
          <View className="gap-3">
            <Text className="text-center text-xs text-white/70">{t('editor.frameHint')}</Text>
            <ScrollView
              horizontal
              contentContainerClassName="gap-2"
              showsHorizontalScrollIndicator={false}>
              {ASPECTS.map((aspect) => (
                <Chip
                  tone="onDark"
                  key={aspect}
                  label={aspect === 'free' ? t('editor.free') : aspect}
                  selected={state.aspect === aspect}
                  onPress={() => apply({ type: 'setAspect', aspect })}
                />
              ))}
              <Chip
                tone="onDark"
                label={t('editor.rotate')}
                onPress={() => apply({ type: 'rotate' })}
              />
              <Chip
                tone="onDark"
                label={t('editor.flip')}
                selected={state.flipH}
                onPress={() => apply({ type: 'flip' })}
              />
              {ghostUri ? (
                <Chip
                  tone="onDark"
                  label={t('editor.ghost')}
                  selected={showGhost}
                  onPress={() => setShowGhost((v) => !v)}
                />
              ) : null}
            </ScrollView>
          </View>
        ) : null}

        {tool === 'light' ? (
          <View className="gap-2 rounded-2xl bg-surface p-3">
            <Slider
              label={t('editor.brightness')}
              value={state.brightness}
              min={-1}
              max={1}
              formatValue={(v) => `${Math.round(v * 100)}`}
              onChangeStart={checkpoint}
              onChange={(value) => preview({ type: 'setBrightness', value })}
            />
            <Slider
              label={t('editor.contrast')}
              value={state.contrast}
              min={-1}
              max={1}
              formatValue={(v) => `${Math.round(v * 100)}`}
              onChangeStart={checkpoint}
              onChange={(value) => preview({ type: 'setContrast', value })}
            />
          </View>
        ) : null}

        {tool === 'censor' ? (
          <View className="gap-2">
            <Text className="text-center text-xs text-white/70">{t('editor.censorHint')}</Text>
            <ScrollView
              horizontal
              contentContainerClassName="gap-2"
              showsHorizontalScrollIndicator={false}>
              {CENSOR_KINDS.map((kind) => (
                <Chip
                  tone="onDark"
                  key={kind}
                  label={t(`editor.censorKinds.${kind}`)}
                  selected={censorKind === kind}
                  onPress={() => setCensorKind(kind)}
                />
              ))}
              {state.censors.map((censor, i) => (
                <Chip
                  tone="onDark"
                  key={censor.id}
                  label={`✕ ${i + 1}`}
                  accessibilityLabel={t('editor.removeCensor', { n: i + 1 })}
                  onPress={() => apply({ type: 'removeCensor', id: censor.id })}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View className="flex-row justify-around border-t border-white/10 pt-2">
          {(['frame', 'light', 'censor'] as const).map((key) => (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected: tool === key }}
              onPress={() => setTool(key)}
              className="px-4 py-2">
              <Text
                className={cn('font-body-semibold', tool === key ? 'text-white' : 'text-white/50')}>
                {t(`editor.tools.${key}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}
