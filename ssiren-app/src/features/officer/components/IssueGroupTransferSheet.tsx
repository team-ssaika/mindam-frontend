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

type TargetPickerStep = 'agency' | 'department';

type IssueGroupTransferTargetPickerProps = {
  visible: boolean;
  fromDepartment: AdminDepartment;
  onClose: () => void;
  onSelect: (department: Department) => void;
};

type IssueGroupTransferSheetProps = {
  visible: boolean;
  issueGroupId: number;
  targetDepartment: Department;
  onClose: () => void;
  onSuccess: () => void;
};

function formatDepartmentLabel(department: Pick<AdminDepartment, 'name'> & {
  agencyType?: { name: string } | null;
  agencyTypeName?: string;
}) {
  const agencyName = department.agencyType?.name ?? department.agencyTypeName;
  return [agencyName, department.name].filter(Boolean).join(' · ');
}

export function IssueGroupTransferTargetPicker({
  visible,
  fromDepartment,
  onClose,
  onSelect,
}: IssueGroupTransferTargetPickerProps) {
  const [step, setStep] = useState<TargetPickerStep>('agency');
  const [agencies, setAgencies] = useState<AgencyType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<AgencyType | null>(null);
  const [isLoadingAgencies, setIsLoadingAgencies] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setStep('agency');
      setSelectedAgency(null);
      setDepartments([]);
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

  const handleBack = () => {
    setLoadErrorMessage(null);
    if (step === 'department') {
      setStep('agency');
      setSelectedAgency(null);
      setDepartments([]);
    }
  };

  const sheetTitle =
    step === 'agency' ? '이관 받을 기관 선택' : '이관 받을 부서 선택';

  return (
    <BottomSheet visible={visible} onClose={onClose} minHeight="65%">
      <View style={styles.body}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {step !== 'agency' ? (
              <Pressable
                onPress={handleBack}
                hitSlop={8}
                style={styles.backButton}
                accessibilityRole="button"
              >
                <Icon name="arrowL" size={20} color={colors.ink} />
              </Pressable>
            ) : null}
          </View>
          <AppText style={styles.title} numberOfLines={2}>
            {sheetTitle}
          </AppText>
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
              <View style={styles.stepMetaRow}>
                <AppText style={styles.stepMeta}>{selectedAgency.name}</AppText>
                <Icon name="check" size={14} color={colors.brand} strokeWidth={2.4} />
              </View>
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
                    onPress={() => onSelect(department)}
                  >
                    <AppText style={styles.optionLabel}>{department.name}</AppText>
                    <Icon name="chevR" size={16} color={colors.faint} />
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </>
        ) : null}
      </View>
    </BottomSheet>
  );
}

export function IssueGroupTransferSheet({
  visible,
  issueGroupId,
  targetDepartment,
  onClose,
  onSuccess,
}: IssueGroupTransferSheetProps) {
  const [requestReason, setRequestReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setRequestReason('');
      return;
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (isSubmitting) {
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
        targetDepartmentId: targetDepartment.id,
        requestReason: trimmedReason,
      });
      onSuccess();
    } catch (error) {
      Alert.alert('이관 요청 실패', getTransferApiErrorMessage(error, '이관 요청에 실패했습니다.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} minHeight="65%">
      <View style={styles.body}>
        <AppText style={styles.title}>부서 이관 요청</AppText>

        <View style={styles.reasonStep}>
          <View style={styles.targetBox}>
            <AppText style={styles.targetLabel}>이관 대상 부서</AppText>
            <AppText style={styles.targetValue}>
              {formatDepartmentLabel({
                name: targetDepartment.name,
                agencyTypeName: targetDepartment.agencyTypeName,
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
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: 14 },
  header: { gap: 6 },
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
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    lineHeight: 26,
    color: colors.ink,
  },
  stepMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
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
  targetLabel: { fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.brand },
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
