import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleSheet,
  View,
} from 'react-native';
import { colors, fonts, radius } from '../../theme';
import AppText from './AppText';
import Icon, { IconName } from './Icon';

type Variant = 'primary' | 'secondary';

type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: Variant;
  icon?: IconName;
  /** Override background (primary) — e.g. accent coral for emphasis. */
  bg?: string;
  color?: string;
  loading?: boolean;
  disabled?: boolean;
};

/**
 * Primary (filled, ink) / Secondary (outline) action button.
 * 52px tall, full-width by default — matches PrimaryBtn/SecondaryBtn in ds.jsx.
 */
export default function Button({
  label,
  variant = 'primary',
  icon,
  bg,
  color,
  loading = false,
  disabled = false,
  ...rest
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const background = isPrimary ? bg ?? colors.brand : colors.canvas;
  const fg = color ?? (isPrimary ? colors.white : colors.ink);
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: background },
        !isPrimary && styles.outline,
        pressed && !inactive && styles.pressed,
        inactive && styles.inactive,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={20} color={fg} /> : null}
          <AppText style={[styles.label, { color: fg }]}>{label}</AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    width: '100%',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  pressed: {
    opacity: 0.88,
  },
  inactive: {
    opacity: 0.45,
  },
});
