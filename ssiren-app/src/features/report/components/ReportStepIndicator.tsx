import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

type StepState = 'upcoming' | 'active' | 'done';

type Step = {
  key: 'write' | 'review' | 'complete';
  label: string;
  state: StepState;
};

type ReportStepIndicatorProps = {
  currentStep: 1 | 2 | 3;
};

const STEP_LABELS = ['작성', '확인/수정', '완료'] as const;

export function ReportStepIndicator({ currentStep }: ReportStepIndicatorProps) {
  const steps: Step[] = STEP_LABELS.map((label, index) => {
    const stepNumber = (index + 1) as 1 | 2 | 3;
    return {
      key: ['write', 'review', 'complete'][index] as Step['key'],
      label,
      state:
        stepNumber < currentStep
          ? 'done'
          : stepNumber === currentStep
            ? 'active'
            : 'upcoming',
    };
  });

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View key={step.key} style={styles.stepRow}>
          <View
            style={[
              styles.stepCircle,
              step.state === 'active' && styles.activeCircle,
              step.state === 'done' && styles.doneCircle,
            ]}
          >
            {step.state === 'done' ? (
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.stepNumber,
                  step.state === 'active' && styles.activeStepNumber,
                ]}
              >
                {index + 1}
              </Text>
            )}
          </View>
          <Text
            style={[
              styles.stepLabel,
              step.state === 'active' && styles.activeStepLabel,
              step.state === 'done' && styles.doneStepLabel,
            ]}
          >
            {step.label}
          </Text>
          {index < steps.length - 1 ? <View style={styles.connector} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    gap: 2,
  },
  stepRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E7E7EC',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activeCircle: {
    backgroundColor: '#7A72E8',
  },
  doneCircle: {
    backgroundColor: '#7A72E8',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#777785',
  },
  activeStepNumber: {
    color: '#FFFFFF',
  },
  stepLabel: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#A2A2AD',
  },
  activeStepLabel: {
    color: '#7A72E8',
  },
  doneStepLabel: {
    color: '#595970',
  },
  connector: {
    flex: 1,
    height: 1,
    marginHorizontal: 8,
    backgroundColor: '#E3E4EB',
  },
});
