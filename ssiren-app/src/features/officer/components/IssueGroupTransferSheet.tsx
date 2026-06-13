import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { AppText, BottomSheet, Button, Icon } from '../../../components/ui';
import { colors, fontSize, fonts, radius } from '../../../theme';
import {
  fetchAgencyTypes,
  fetchDepartments,
  type AgencyType,
  type Department,
} from '../../auth/api/onboardingApi';
import { createAdminIssueGroupTransferRequest } from '../api/adminIssueApi';
import type { AdminDepartment } from '../types/adminIssue';
import { getTransferApiErrorMessage } from '../transfer-requests/utils';

type IssueGroupTransferSheetProps = {
  visible: boolean;
  issueGroupId: number;
  issueGroupTitle: string;
  fromDepartment: AdminDepartment;
  onClose: () => void;
  onSuccess: () => void;
};

type TransferStep = 'agency' | 'department' | 'reason';

function formatDepartmentLabel(department: Pick<AdminDepartment, 'name'> & {
  agencyType?: { name: string } | null;
  agencyTypeName?: string;
}) {
  const agencyName = department.agencyType?.name ?? department.agencyTypeName;
  return [agencyName, department.name].filter(Boolean).join(' · ');
}

export function IssueGroupTransferSheet({
  visible,
  issueGroupId,
  issueGroupTitle,
  fromDepartment,
  onClose,
  onSuccess,
}: IssueGroupTransferSheetProps) {
  const [step, setStep] = useState<TransferStep>('agency');
  const [agencies, setAgencies] = useState<AgencyType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<AgencyType | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [requestReason, setRequestReason] = useState('');
  const [isLoadingAgencies, setIsLoadingAgencies] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setStep('agency');
      setSelectedAgency(null);
      setSelectedDepartment(null);
      setDepartments([]);
      setRequestReason('');
      setLoadErrorMessage(null);
      return;
    }

    if (agencies.length > 0) {
      return;
    }

    let isMounted = true;
    setIsLoadingAgencies(true);
    setLoadErrorMessage(null);

    fetchAgencyTypes()
      .then((nextAgencies) => {
        if (!isMounted) return;
        setAgencies(nextAgencies);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoadErrorMessage('기관 목록을 불러오지 못했어요.');
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoadingAgencies(false);
      });

    return () => {
      isMounted = false;
    };
  }, [visible, agencies.length]);

  const handleSelectAgency = async (agency: AgencyType) => {
    setSelectedAgency(agency);
    setSelectedDepartment(null);
    setStep('department');
    setLoadErrorMessage(null);
    setIsLoadingDepartments(true);

    try {
      const nextDepartments = await fetchDepartments(agency.id);
      setDepartments(
        nextDepartments.filter((department) => department.id !== fromDepartment.id)
      );
    } catch {
      setLoadErrorMessage('부서 목록을 불러오지 못했어요.');
      setDepartments([]);
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  const handleSelectDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setStep('reason');
  };

  const handleBack = () => {
    setLoadErrorMessage(null);
    if (step === 'reason') {
      setStep('department');
      setSelectedDepartment(null);
      return;
    }
    if (step === 'department') {
      setStep('agency');
      setSelectedAgency(null);
      setDepartments([]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDepartment || isSubmitting) {
      return;
    }

    const trimmedReason = requestReason.trim();
    if (!trimmedReason) {
      Alert.alert('이관 사유 필요', '이관 요청 사유를 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createAdminIssueGroupTransferRequest(issueGroupId, {
        targetDepartmentId: selectedDepartment.id,
        requestReason: trimmedReason,
      });
      onSuccess();
    } catch (error) {
      Alert.alert('이관 요청 실패', getTransferApiErrorMessage(error, '이관 요청에 실패했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const sheetTitle =
    step === 'agency'
      ? '이관 받을 기관 선택'
      : step === 'department'
        ? '이관 받을 부서 선택'
        : '이관 요청 사유';

  return (
    <BottomSheet visible={visible} onClose={onClose} minHeight="65%">
      <View style={styles.body}>
        <View style={styles.header}>
          {step !== 'agency' ? (
            <Pressable onPress={handleBack} disabled={isSubmitting} hitSlop={8} style={styles.backButton}>
              <Icon name="arrowL" size={20} color={colors.ink} />
            </Pressable>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <View style={styles.headerText}>
            <AppText style={styles.eyebrow}>부서 이관 요청</AppText>
            <AppText style={styles.title} numberOfLines={2}>
              {sheetTitle}
            </AppText>
            <AppText style={styles.subtitle} numberOfLines={2}>
              {issueGroupTitle}
            </AppText>
            <AppText style={styles.fromDepartment}>
              현재 담당 · {formatDepartmentLabel(fromDepartment)}
            </AppText>
          </View>
        </View>

        {loadErrorMessage ? <AppText style={styles.errorText}>{loadErrorMessage}</AppText> : null}

        {step === 'agency' ? (
          isLoadingAgencies ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.brand} />
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {agencies.map((agency) => (
                <Pressable
                  key={agency.id}
                  style={styles.optionRow}
                  onPress={() => handleSelectAgency(agency)}
                >
                  <AppText style={styles.optionLabel}>{agency.name}</AppText>
                  <Icon name="chevR" size={16} color={colors.faint} />
                </Pressable>
              ))}
            </ScrollView>
          )
        ) : null}

        {step === 'department' ? (
          <>
            {selectedAgency ? (
              <AppText style={styles.stepMeta}>{selectedAgency.name}</AppText>
            ) : null}
            {isLoadingDepartments ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.brand} />
              </View>
            ) : departments.length === 0 ? (
              <AppText style={styles.emptyText}>선택할 수 있는 부서가 없어요.</AppText>
            ) : (
              <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {departments.map((department) => (
                  <Pressable
                    key={department.id}
                    style={styles.optionRow}
                    onPress={() => handleSelectDepartment(department)}
                  >
                    <AppText style={styles.optionLabel}>{department.name}</AppText>
                    <Icon name="chevR" size={16} color={colors.faint} />
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </>
        ) : null}

        {step === 'reason' && selectedDepartment ? (
          <View style={styles.reasonStep}>
            <View style={styles.targetBox}>
              <AppText style={styles.targetLabel}>이관 대상 부서</AppText>
              <AppText style={styles.targetValue}>
                {formatDepartmentLabel({
                  name: selectedDepartment.name,
                  agencyTypeName: selectedDepartment.agencyTypeName,
                })}
              </AppText>
            </View>
            <AppText style={styles.inputLabel}>이관 요청 사유</AppText>
            <TextInput
              value={requestReason}
              onChangeText={setRequestReason}
              placeholder="이관이 필요한 이유를 입력하세요"
              placeholderTextColor={colors.faint}
              multiline
              maxLength={500}
              textAlignVertical="top"
              style={styles.reasonInput}
            />
            <AppText
              style={[
                styles.reasonCounter,
                requestReason.length >= 500 && styles.reasonCounterLimit,
              ]}
            >
              {requestReason.length}/500
            </AppText>
            <View style={styles.actions}>
              <View style={styles.actionButton}>
                <Button
                  label="취소"
                  variant="secondary"
                  color={colors.muted}
                  onPress={onClose}
                  disabled={isSubmitting}
                />
              </View>
              <View style={styles.actionButton}>
                <Button
                  label="이관 요청"
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting || !requestReason.trim()}
                />
              </View>
            </View>
          </View>
        ) : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: 14 },
  header: { flexDirection: 'row', gap: 8 },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  backPlaceholder: { width: 32 },
  headerText: { flex: 1, gap: 4 },
  eyebrow: { fontFamily: fonts.bold, fontSize: fontSize.md, color: colors.brand },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    lineHeight: 26,
    color: colors.ink,
  },
  subtitle: { fontSize: fontSize.md, color: colors.muted, lineHeight: 21 },
  fromDepartment: { fontSize: fontSize.sm, color: colors.faint, marginTop: 2 },
  stepMeta: { fontFamily: fonts.semibold, fontSize: fontSize.md, color: colors.body },
  errorText: { fontSize: fontSize.md, color: colors.danger, lineHeight: 21 },
  emptyText: { fontSize: fontSize.md, color: colors.muted, textAlign: 'center', paddingVertical: 24 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 160 },
  list: { flex: 1 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  optionLabel: { flex: 1, fontFamily: fonts.semibold, fontSize: fontSize.mdLg, color: colors.ink },
  reasonStep: { gap: 10 },
  targetBox: {
    backgroundColor: colors.soft,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  targetLabel: { fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.muted },
  targetValue: { fontFamily: fonts.semibold, fontSize: fontSize.mdLg, color: colors.ink },
  inputLabel: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.md,
    color: colors.muted,
    marginTop: 4,
  },
  reasonInput: {
    minHeight: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.soft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  reasonCounter: {
    textAlign: 'right',
    fontSize: fontSize.sm,
    color: colors.faint,
  },
  reasonCounterLimit: { color: colors.danger },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  actionButton: { flex: 1 },
});
