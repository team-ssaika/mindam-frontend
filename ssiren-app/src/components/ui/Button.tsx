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
  bg?: string;
  color?: string;
  loading?: boolean;
  disabled?: boolean;
};

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
  const inactive = disabled || loading;
  const background = isPrimary
    ? inactive
      ? colors.buttonDisabled
      : bg ?? colors.brand
    : colors.canvas;
  const fg = color ?? (isPrimary ? colors.buttonDisabledText : colors.ink);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: background },
        !isPrimary && styles.outline,
        pressed && !inactive && styles.pressed,
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
    height: 56,
    width: '100%',
    borderRadius: radius['2xl'],
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
    fontFamily: fonts.bold,
    fontSize: 17,
    letterSpacing: -0.2,
  },
  pressed: {
    opacity: 0.9,
  },
});
