import { Pressable, StyleSheet, View } from 'react-native';
import { colors, fontSize } from '../../theme';
import AppText from './AppText';

type SectionLabelProps = {
  title: string;
  /** Optional right-aligned secondary text (e.g. "전체 17건 ›"). */
  right?: string;
  onPressRight?: () => void;
};

/** Section header row: bold title left, muted meta right. */
export default function SectionLabel({ title, right, onPressRight }: SectionLabelProps) {
  return (
    <View style={styles.row}>
      <AppText variant="section" color={colors.ink}>{title}</AppText>
      {right ? (
        onPressRight ? (
          <Pressable onPress={onPressRight} hitSlop={8} accessibilityRole="button">
            <AppText style={styles.right}>{right}</AppText>
          </Pressable>
        ) : (
          <AppText style={styles.right}>{right}</AppText>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  right: {
    fontSize: fontSize.md,
    color: colors.muted,
  },
});
