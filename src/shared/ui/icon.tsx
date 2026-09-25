import { useFonts } from 'expo-font';
import { type AndroidSymbol, type SFSymbol, SymbolView } from 'expo-symbols';
import materialSymbols from 'expo-symbols/androidWeights/regular';
import { Platform, Text, View } from 'react-native';

/**
 * Semantic icon names → SF Symbol (iOS) / Material Symbol (Android).
 * `codepoint` is the Material Symbols glyph (checked against expo-symbols in icon.test.ts).
 */
export const icons = {
  body: { ios: 'figure.stand', android: 'accessibility_new', codepoint: 0xe92c },
  hair: { ios: 'comb', android: 'face_retouching_natural', codepoint: 0xef4e },
  face: { ios: 'face.smiling', android: 'face', codepoint: 0xe87c },
  sparkles: { ios: 'sparkles', android: 'auto_awesome', codepoint: 0xe65f },
  plus: { ios: 'plus', android: 'add', codepoint: 0xe145 },
  'chevron-right': { ios: 'chevron.right', android: 'chevron_right', codepoint: 0xe5cc },
  'chevron-up': { ios: 'chevron.up', android: 'keyboard_arrow_up', codepoint: 0xe316 },
  'chevron-down': { ios: 'chevron.down', android: 'keyboard_arrow_down', codepoint: 0xe313 },
  camera: { ios: 'camera', android: 'photo_camera', codepoint: 0xe412 },
  photos: { ios: 'photo.on.rectangle', android: 'photo_library', codepoint: 0xe413 },
  trash: { ios: 'trash', android: 'delete', codepoint: 0xe872 },
  archive: { ios: 'archivebox', android: 'archive', codepoint: 0xe149 },
  edit: { ios: 'pencil', android: 'edit', codepoint: 0xe3c9 },
  settings: { ios: 'gearshape', android: 'settings', codepoint: 0xe8b8 },
  check: { ios: 'checkmark', android: 'check', codepoint: 0xe5ca },
  close: { ios: 'xmark', android: 'close', codepoint: 0xe5cd },
  eye: { ios: 'eye', android: 'visibility', codepoint: 0xe8f4 },
  'eye-off': { ios: 'eye.slash', android: 'visibility_off', codepoint: 0xe8f5 },
  lightbulb: { ios: 'lightbulb', android: 'lightbulb', codepoint: 0xe0f0 },
  undo: { ios: 'arrow.uturn.backward', android: 'undo', codepoint: 0xe166 },
  biometrics: { ios: 'faceid', android: 'fingerprint', codepoint: 0xe90d },
  lock: { ios: 'lock', android: 'lock', codepoint: 0xe897 },
} as const satisfies Record<string, { ios: SFSymbol; android: AndroidSymbol; codepoint: number }>;

export type IconName = keyof typeof icons;

type IconProps = { name: IconName; size?: number; color: string };

export function Icon({ name, size = 22, color }: IconProps) {
  if (Platform.OS === 'android') return <MaterialIcon name={name} size={size} color={color} />;
  const { ios, android } = icons[name];
  return (
    <SymbolView name={{ ios, android }} size={size} tintColor={color} resizeMode="scaleAspectFit" />
  );
}

/**
 * expo-symbols draws Android glyphs as text pinned to the top-left of the box, with the font's
 * extra padding, so icons end up a few pixels up/left. Draw the same glyph centered instead.
 */
function MaterialIcon({ name, size, color }: Required<IconProps>) {
  const [loaded] = useFonts({ [materialSymbols.name]: materialSymbols.font });
  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      {loaded ? (
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: materialSymbols.name,
            fontSize: size,
            lineHeight: size,
            color,
            includeFontPadding: false,
            textAlign: 'center',
            textAlignVertical: 'center',
          }}>
          {String.fromCharCode(icons[name].codepoint)}
        </Text>
      ) : null}
    </View>
  );
}
