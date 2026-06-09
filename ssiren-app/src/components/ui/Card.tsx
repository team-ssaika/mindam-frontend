import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius } from '../../theme';

type CardProps = ViewProps & {
  padded?: boolean;
  bordered?: boolean;
};

export default function Card({
  padded = true,
  bordered = true,
  style,
  children,
  ...rest
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        padded && styles.padded,
        bordered && styles.bordered,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
  },
  bordered: {
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  padded: {
    padding: 16,
  },
});
