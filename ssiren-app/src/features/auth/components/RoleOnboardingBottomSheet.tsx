import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, Icon } from '../../../components/ui';
import { BottomSheet } from '../../../components/ui/BottomSheet';
import { colors, fonts, radius, fontSize } from '../../../theme';
import {
  fetchAgencyTypes,
  fetchDepartments,
  type AgencyType,
  type Department,
} from '../api/onboardingApi';
import type { UserRole } from '../types/auth.types';

type RoleOnboardingBottomSheetProps = {
  errorMessage: string | null;
  isSubmitting: boolean;
  onSelectRole: (role: UserRole, departmentId?: number) => void;
  visible: boolean;
};

const ROLE_OPTIONS: Array<{
  role: UserRole;
  title: string;
  description: string;
  icon: 'user' | 'building';
}> = [
  {
    role: 'CITIZEN',
    title: '시민',
    description: '주변 불편과 위험을 제보하고 처리 현황을 확인해요.',
    icon: 'user',
  },
  {
    role: 'OFFICER',
    title: '공무원',
    description: '담당 지역의 제보를 확인하고 처리 상태를 관리해요.',
    icon: 'building',
  },
];

export function RoleOnboardingBottomSheet({
  errorMessage,
  isSubmitting,
  onSelectRole,
  visible,
}: RoleOnboardingBottomSheetProps) {
  const [step, setStep] = useState<'role' | 'agency' | 'department'>('role');
  const [agencies, setAgencies] = useState<AgencyType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<AgencyType | null>(null);
  const [isLoadingAgencies, setIsLoadingAgencies] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setStep('role');
      setSelectedAgency(null);
      setDepartments([]);
      setLoadErrorMessage(null);
    }
  }, [visible]);

  const handlePressOfficer = async () => {
    setStep('agency');
    setLoadErrorMessage(null);

    if (agencies.length > 0) {
      return;
    }

    setIsLoadingAgencies(true);
    try {
      const nextAgencies = await fetchAgencyTypes();
      setAgencies(nextAgencies);
    } catch (error) {
      console.log('[Auth] agency types load failed', error);
      setLoadErrorMessage('기관 목록을 불러오지 못했어요. 다시 시도해 주세요.');
    } finally {
      setIsLoadingAgencies(false);
    }
  };

  const handleSelectAgency = async (agency: AgencyType) => {
    setSelectedAgency(agency);
    setDepartments([]);
    setStep('department');
    setLoadErrorMessage(null);
    setIsLoadingDepartments(true);

    try {
      const nextDepartments = await fetchDepartments(agency.id);
      setDepartments(nextDepartments);
    } catch (error) {
      console.log('[Auth] departments load failed', error);
      setLoadErrorMessage('부서 목록을 불러오지 못했어요. 다시 시도해 주세요.');
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  const handleBack = () => {
    setLoadErrorMessage(null);
    if (step === 'department') {
      setStep('agency');
      setSelectedAgency(null);
      setDepartments([]);
      return;
    }
    setStep('role');
  };

  const title =
    step === 'role'
      ? '어떤 사용자로 이용하시나요?'
      : step === 'agency'
        ? '소속 기관을 선택해 주세요'
        : '소속 부서를 선택해 주세요';

  return (
    <BottomSheet
      visible={visible}
      onClose={() => undefined}
      backdropOpacity={0.68}
      minHeight="60%"
      showHandle={false}
      containerStyle={styles.sheetContainer}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {step !== 'role' ? (
              <Pressable
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={handleBack}
                style={styles.backButton}
              >
                <Icon name="arrowL" size={20} color={colors.ink} />
              </Pressable>
            ) : null}
            <AppText style={styles.eyebrow}>새로 오셨네요!</AppText>
          </View>
          <AppText style={styles.title}>{title}</AppText>
          {selectedAgency ? (
            <AppText style={styles.subtitle}>{selectedAgency.name}</AppText>
          ) : null}
        </View>

        {step === 'role' ? (
          <View style={styles.options}>
            {ROLE_OPTIONS.map((option) => (
              <Pressable
                key={option.role}
                accessibilityRole="button"
                disabled={isSubmitting}
                onPress={() =>
                  option.role === 'OFFICER'
                    ? handlePressOfficer()
                    : onSelectRole(option.role)
                }
                style={({ pressed }) => [
                  styles.option,
                  pressed && !isSubmitting ? styles.optionPressed : null,
                  isSubmitting ? styles.optionDisabled : null,
                ]}
              >
                <View style={styles.iconWrap}>
                  <Icon name={option.icon} size={22} color={colors.brand} />
                </View>
                <View style={styles.optionText}>
                  <AppText style={styles.optionTitle}>{option.title}</AppText>
                  <AppText style={styles.optionDescription}>{option.description}</AppText>
                </View>
                <Icon name="chevR" size={20} color={colors.faint} />
              </Pressable>
            ))}
          </View>
        ) : (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {step === 'agency' && isLoadingAgencies ? <LoadingRow label="기관 목록을 불러오는 중..." /> : null}
            {step === 'agency' && !isLoadingAgencies
              ? agencies.map((agency) => (
                  <PickerRow
                    key={agency.id}
                    label={agency.name}
                    disabled={isSubmitting}
                    onPress={() => handleSelectAgency(agency)}
                  />
                ))
              : null}

            {step === 'department' && isLoadingDepartments ? (
              <LoadingRow label="부서 목록을 불러오는 중..." />
            ) : null}
            {step === 'department' && !isLoadingDepartments
              ? departments.map((department) => (
                  <PickerRow
                    key={department.id}
                    label={department.name}
                    subLabel={department.agencyTypeName}
                    disabled={isSubmitting}
                    onPress={() => onSelectRole('OFFICER', department.id)}
                  />
                ))
              : null}
          </ScrollView>
        )}

        {isSubmitting ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.brand} />
            <AppText style={styles.loadingText}>설정 중...</AppText>
          </View>
        ) : null}

        {loadErrorMessage || errorMessage ? (
          <AppText style={styles.errorText}>{loadErrorMessage ?? errorMessage}</AppText>
        ) : null}
      </View>
    </BottomSheet>
  );
}

function LoadingRow({ label }: { label: string }) {
  return (
    <View style={styles.listLoadingRow}>
      <ActivityIndicator color={colors.brand} />
      <AppText style={styles.loadingText}>{label}</AppText>
    </View>
  );
}

function PickerRow({
  disabled,
  label,
  onPress,
  subLabel,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
  subLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pickerRow,
        pressed && !disabled ? styles.optionPressed : null,
        disabled ? styles.optionDisabled : null,
      ]}
    >
      <View style={styles.optionText}>
        <AppText style={styles.optionTitle}>{label}</AppText>
        {subLabel ? <AppText style={styles.optionDescription}>{subLabel}</AppText> : null}
      </View>
      <Icon name="chevR" size={20} color={colors.faint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 34,
  },
  content: {
    flex: 1,
    gap: 24,
  },
  header: {
    gap: 6,
  },
  headerTop: {
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: colors.soft,
  },
  eyebrow: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.md,
    color: colors.brand,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSize['3xl'],
    lineHeight: 30,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.muted,
  },
  options: {
    gap: 12,
  },
  option: {
    minHeight: 82,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.white,
  },
  optionPressed: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand,
  },
  optionDisabled: {
    opacity: 0.55,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 12,
  },
  pickerRow: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    backgroundColor: colors.white,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  optionText: {
    flex: 1,
    gap: 3,
  },
  optionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
  },
  optionDescription: {
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    lineHeight: 22,
    color: colors.muted,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  listLoadingRow: {
    minHeight: 72,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loadingText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    color: colors.muted,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    lineHeight: 23,
    color: colors.danger,
    textAlign: 'center',
  },
});
