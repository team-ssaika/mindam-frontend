import Stepper from '../../../components/ui/Stepper';

type ReportStepIndicatorProps = {
  currentStep: 1 | 2 | 3;
};

const STEP_LABELS = ['작성', '확인/수정', '완료'] as const;

/** @deprecated Use `Stepper` from `components/ui` directly. */
export function ReportStepIndicator({ currentStep }: ReportStepIndicatorProps) {
  return (
    <Stepper
      step={currentStep}
      total={3}
      labels={[...STEP_LABELS]}
    />
  );
}
