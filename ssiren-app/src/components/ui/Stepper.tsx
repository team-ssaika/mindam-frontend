import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';

type StepperProps = {
  step: number;
  total?: number;
};

/** Progress bar of N segments; segments up to `step` are filled with brand. */
export default function Stepper({ step, total = 2 }: StepperProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => i + 1).map((i) => (
        <View
          key={i}
          style={[styles.seg, { backgroundColor: i <= step ? colors.brand : colors.soft2 }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  seg: {
    flex: 1,
    height: 5,
    borderRadius: radius.sm / 2,
  },
});
