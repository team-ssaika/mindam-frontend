import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import AppText from './AppText';

type SectionLabelProps = {
  title: string;
  /** Optional right-aligned secondary text (e.g. "전체 17건 ›"). */
  right?: string;
};

/** Section header row: bold title left, muted meta right. */
export default function SectionLabel({ title, right }: SectionLabelProps) {
  return (
    <View style={styles.row}>
      <AppText variant="section" color={colors.ink}>{title}</AppText>
      {right ? (
        <AppText style={styles.right}>{right}</AppText>
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
    fontSize: 13,
    color: colors.muted,
  },
});
