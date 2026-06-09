import { Text, TextProps, StyleSheet } from 'react-native';
import { colors, typography } from '../../theme';

type Variant = keyof typeof typography;

type AppTextProps = TextProps & {
  variant?: Variant;
  color?: string;
};

/**
 * Themed Text — applies Pretendard + a typography preset.
 * Defaults to the `body` variant. Pass `color` or extra `style` to override.
 */
export default function AppText({
  variant = 'body',
  color,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      {...rest}
      style={[
        styles.base,
        typography[variant],
        color ? { color } : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.body,
  },
});
