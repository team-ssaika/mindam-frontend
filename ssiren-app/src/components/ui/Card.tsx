import { StyleSheet, View, ViewProps } from 'react-native';
import { colors, radius } from '../../theme';

type CardProps = ViewProps & {
  padded?: boolean;
};

/** White surface with hairline border + lg radius — the default content card. */
export default function Card({ padded = true, style, children, ...rest }: CardProps) {
  return (
    <View style={[styles.base, padded && styles.padded, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  padded: {
    padding: 16,
  },
});
