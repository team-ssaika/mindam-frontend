import { StyleSheet, View } from 'react-native';
import { colors, fonts, radius } from '../../theme';
import AppText from './AppText';
import Icon from './Icon';

type StepperProps = {
  step: number;
  total?: number;
  /** `bar` = segment progress, `numbered` = circle step indicator with optional labels */
  variant?: 'bar' | 'numbered';
  labels?: string[];
};

function NumberedStepper({
  step,
  total,
  labels,
}: {
  step: number;
  total: number;
  labels?: string[];
}) {
  return (
    <View style={styles.numberedRow}>
      {Array.from({ length: total }, (_, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < step;
        const isActive = stepNumber === step;
        const label = labels?.[index];

        return (
          <View key={stepNumber} style={styles.numberedItem}>
            <View style={styles.numberedHead}>
              <View
                style={[
                  styles.circle,
                  (isActive || isDone) && styles.circleActive,
                ]}
              >
                {isDone ? (
                  <Icon name="check" size={14} color={colors.white} strokeWidth={2.6} />
                ) : (
                  <AppText
                    style={[
                      styles.circleNumber,
                      (isActive || isDone) && styles.circleNumberActive,
                    ]}
                  >
                    {stepNumber}
                  </AppText>
                )}
              </View>
              {label ? (
                <AppText
                  style={[
                    styles.stepLabel,
                    isActive && styles.stepLabelActive,
                    isDone && styles.stepLabelDone,
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </AppText>
              ) : null}
            </View>
            {index < total - 1 ? <View style={styles.connector} /> : null}
          </View>
        );
      })}
    </View>
  );
}

function BarStepper({ step, total }: { step: number; total: number }) {
  return (
    <View style={styles.barRow}>
      {Array.from({ length: total }, (_, i) => i + 1).map((i) => (
        <View
          key={i}
          style={[styles.seg, { backgroundColor: i <= step ? colors.brand : colors.soft2 }]}
        />
      ))}
    </View>
  );
}

/** Progress indicator — numbered circles (default) or segment bar. */
export default function Stepper({
  step,
  total = 3,
  variant = 'numbered',
  labels,
}: StepperProps) {
  if (variant === 'bar') {
    return <BarStepper step={step} total={total} />;
  }

  return <NumberedStepper step={step} total={total} labels={labels} />;
}

const styles = StyleSheet.create({
  barRow: {
    flexDirection: 'row',
    gap: 6,
  },
  seg: {
    flex: 1,
    height: 5,
    borderRadius: radius.sm / 2,
  },
  numberedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  numberedItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberedHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.soft2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: colors.brand,
  },
  circleNumber: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.muted,
  },
  circleNumberActive: {
    color: colors.white,
  },
  stepLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.faint,
  },
  stepLabelActive: {
    color: colors.brand,
  },
  stepLabelDone: {
    color: colors.body,
  },
  connector: {
    flex: 1,
    height: 1,
    marginHorizontal: 8,
    backgroundColor: colors.hairline,
  },
});
