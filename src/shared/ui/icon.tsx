import { type AndroidSymbol, type SFSymbol, SymbolView } from 'expo-symbols';

/** Semantic icon names → SF Symbol (iOS) / Material Symbol (Android). */
const icons = {
  body: { ios: 'figure.stand', android: 'accessibility_new' },
  hair: { ios: 'comb', android: 'face_retouching_natural' },
  face: { ios: 'face.smiling', android: 'face' },
  sparkles: { ios: 'sparkles', android: 'auto_awesome' },
  plus: { ios: 'plus', android: 'add' },
  'chevron-right': { ios: 'chevron.right', android: 'chevron_right' },
  'chevron-up': { ios: 'chevron.up', android: 'keyboard_arrow_up' },
  'chevron-down': { ios: 'chevron.down', android: 'keyboard_arrow_down' },
  camera: { ios: 'camera', android: 'photo_camera' },
  photos: { ios: 'photo.on.rectangle', android: 'photo_library' },
  trash: { ios: 'trash', android: 'delete' },
  archive: { ios: 'archivebox', android: 'archive' },
  edit: { ios: 'pencil', android: 'edit' },
  settings: { ios: 'gearshape', android: 'settings' },
  check: { ios: 'checkmark', android: 'check' },
  close: { ios: 'xmark', android: 'close' },
  eye: { ios: 'eye', android: 'visibility' },
  'eye-off': { ios: 'eye.slash', android: 'visibility_off' },
  lightbulb: { ios: 'lightbulb', android: 'lightbulb' },
  undo: { ios: 'arrow.uturn.backward', android: 'undo' },
  biometrics: { ios: 'faceid', android: 'fingerprint' },
  lock: { ios: 'lock', android: 'lock' },
} as const satisfies Record<string, { ios: SFSymbol; android: AndroidSymbol }>;

export type IconName = keyof typeof icons;

type IconProps = { name: IconName; size?: number; color: string };

export function Icon({ name, size = 22, color }: IconProps) {
  return (
    <SymbolView name={icons[name]} size={size} tintColor={color} resizeMode="scaleAspectFit" />
  );
}
