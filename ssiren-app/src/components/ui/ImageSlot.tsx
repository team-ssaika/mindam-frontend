import { Image, Pressable, StyleSheet, View } from 'react-native';
import { colors, fontSize, fonts, radius } from '../../theme';
import AppText from './AppText';
import Icon, { IconName } from './Icon';

type ImageSlotProps = {
  /** Show this image instead of the empty placeholder. */
  uri?: string;
  height?: number;
  width?: number;
  label?: string;
  icon?: IconName;
  onPress?: () => void;
};

/** Photo placeholder / thumbnail slot. Renders an image when `uri` is set. */
export default function ImageSlot({
  uri,
  height = 120,
  width,
  label = '사진',
  icon = 'image',
  onPress,
}: ImageSlotProps) {
  const dims = { height, width: width ?? ('100%' as const) };
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.base, dims]}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Icon name={icon} size={26} color={colors.faint} />
          {label ? <AppText style={styles.label}>{label}</AppText> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.soft,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: fontSize.micro,
    color: colors.faint,
    letterSpacing: 0.2,
  },
});
