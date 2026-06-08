import axios from 'axios';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { updateMyReport } from '../api/reportApi';
import type { MyReportDetail } from '../types/myReportDetail';
import type { ReportVisibility } from '../types/myReportUpdate';

type MyReportEditSheetProps = {
  visible: boolean;
  detail: MyReportDetail;
  onClose: () => void;
  onSaved: () => void;
};

const VISIBILITY_OPTIONS: { value: ReportVisibility; label: string }[] = [
  { value: 'PUBLIC', label: '공개' },
  { value: 'PRIVATE', label: '비공개' },
  { value: 'AGENCY_ONLY', label: '기관만' },
];

const CONTENT_FIELDS = [
  {
    key: 'summary',
    label: '요약',
    placeholder: '제보 내용을 한눈에 파악할 수 있도록 요약해주세요',
    multiline: true,
  },
  {
    key: 'what',
    label: '무엇을',
    placeholder: '발생한 문제 유형 또는 내용',
    multiline: true,
  },
  {
    key: 'where',
    label: '어디서',
    placeholder: '문제 발생 위치 설명',
    multiline: false,
  },
  {
    key: 'when',
    label: '언제',
    placeholder: '문제 발생 또는 확인 시각',
    multiline: false,
  },
  {
    key: 'who',
    label: '누가',
    placeholder: '문제와 관련된 주체',
    multiline: false,
  },
  {
    key: 'how',
    label: '어떻게',
    placeholder: '문제가 발생한 방식 또는 현재 상태',
    multiline: true,
  },
  {
    key: 'why',
    label: '왜',
    placeholder: '문제가 위험하거나 조치가 필요한 이유',
    multiline: true,
  },
] as const;

type ContentFieldKey = (typeof CONTENT_FIELDS)[number]['key'];

export function MyReportEditSheet({
  visible,
  detail,
  onClose,
  onSaved,
}: MyReportEditSheetProps) {
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState<ReportVisibility>('PUBLIC');
  const [contents, setContents] = useState<Record<ContentFieldKey, string>>({
    summary: '',
    what: '',
    where: '',
    when: '',
    who: '',
    how: '',
    why: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;

    const { report } = detail;
    setTitle(report.title);
    setVisibility(report.visibility as ReportVisibility);
    setContents({
      summary: report.contents.summary ?? '',
      what: report.contents.what ?? '',
      where: report.contents.where ?? '',
      when: report.contents.when ?? '',
      who: report.contents.who ?? '',
      how: report.contents.how ?? '',
      why: report.contents.why ?? '',
    });
    setErrorMessage(null);
  }, [visible, detail]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage('제목을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateMyReport(detail.report.id, {
        title: trimmedTitle,
        contents: {
          who: contents.who.trim() || undefined,
          when: contents.when.trim() || undefined,
          where: contents.where.trim() || undefined,
          what: contents.what.trim() || undefined,
          how: contents.how.trim() || undefined,
          why: contents.why.trim() || undefined,
          summary: contents.summary.trim() || undefined,
        },
        visibility,
        categoryId: detail.category.id,
      });
      onSaved();
      onClose();
    } catch (error) {
      let message = '민원 수정에 실패했습니다.';
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;
        message =
          typeof apiMessage === 'string'
            ? apiMessage
            : error.message || message;
      }
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.sheetTitle}>민원 수정</Text>
          <Text style={styles.sheetDescription}>
            접수 전 상태에서만 수정할 수 있어요.
          </Text>

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>제목</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="제목을 입력해주세요"
                placeholderTextColor="#B1B1BC"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>카테고리</Text>
              <View style={styles.readOnlyField}>
                <Text style={styles.readOnlyText}>{detail.category.categoryName}</Text>
              </View>
            </View>

            {CONTENT_FIELDS.map((field) => (
              <View key={field.key} style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <TextInput
                  style={[styles.input, field.multiline ? styles.textArea : null]}
                  value={contents[field.key]}
                  onChangeText={(value) =>
                    setContents((prev) => ({ ...prev, [field.key]: value }))
                  }
                  placeholder={field.placeholder}
                  placeholderTextColor="#B1B1BC"
                  multiline={field.multiline}
                  textAlignVertical={field.multiline ? 'top' : 'center'}
                />
              </View>
            ))}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>공개 범위</Text>
              <View style={styles.visibilityRow}>
              {VISIBILITY_OPTIONS.map((option) => {
                const isSelected = visibility === option.value;
                return (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.visibilityChip,
                      isSelected ? styles.visibilityChipActive : null,
                    ]}
                    onPress={() => setVisibility(option.value)}
                  >
                    <Text
                      style={[
                        styles.visibilityChipText,
                        isSelected ? styles.visibilityChipTextActive : null,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
              </View>
            </View>

            {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={onClose} disabled={isSaving}>
              <Text style={styles.secondaryButtonText}>취소</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, isSaving ? styles.disabledButton : null]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>저장</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 17, 25, 0.32)',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D8D8E2',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#181820',
  },
  sheetDescription: {
    marginTop: 6,
    fontSize: 14,
    color: '#6D6D78',
  },
  formScroll: {
    marginTop: 16,
  },
  formContent: {
    gap: 20,
    paddingBottom: 12,
  },
  fieldGroup: {
    gap: 10,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#31313F',
  },
  input: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E3EB',
    backgroundColor: '#F9F9FC',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#232330',
  },
  textArea: {
    minHeight: 96,
    paddingTop: 14,
    paddingBottom: 14,
  },
  readOnlyField: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7EAF0',
    backgroundColor: '#F5F6FA',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#6D6D78',
  },
  visibilityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  visibilityChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  visibilityChipActive: {
    borderColor: '#6257FF',
    backgroundColor: '#F3F0FF',
  },
  visibilityChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555568',
  },
  visibilityChipTextActive: {
    color: '#6257FF',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#DC2626',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: '#F3F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#555568',
  },
  primaryButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: '#6257FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
