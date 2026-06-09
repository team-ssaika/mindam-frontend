import axios from 'axios';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { AppText, Button } from '../../../components/ui';
import { colors, fonts, radius, shadow } from '../../../theme';
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
  { key: 'summary', label: '요약', placeholder: '제보 내용을 한눈에 파악할 수 있도록 요약해주세요', multiline: true },
  { key: 'what', label: '무엇을', placeholder: '발생한 문제 유형 또는 내용', multiline: true },
  { key: 'where', label: '어디서', placeholder: '문제 발생 위치 설명', multiline: false },
  { key: 'when', label: '언제', placeholder: '문제 발생 또는 확인 시각', multiline: false },
  { key: 'who', label: '누가', placeholder: '문제와 관련된 주체', multiline: false },
  { key: 'how', label: '어떻게', placeholder: '문제가 발생한 방식 또는 현재 상태', multiline: true },
  { key: 'why', label: '왜', placeholder: '문제가 위험하거나 조치가 필요한 이유', multiline: true },
] as const;

type ContentFieldKey = (typeof CONTENT_FIELDS)[number]['key'];

export function MyReportEditSheet({ visible, detail, onClose, onSaved }: MyReportEditSheetProps) {
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
        message = typeof apiMessage === 'string' ? apiMessage : error.message || message;
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
          <AppText variant="title" color={colors.ink}>민원 수정</AppText>
          <AppText style={styles.sheetDescription}>접수 전 상태에서만 수정할 수 있어요.</AppText>

          <ScrollView
            style={styles.formScroll}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>제목</AppText>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="제목을 입력해주세요"
                placeholderTextColor={colors.faint}
              />
            </View>

            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>카테고리</AppText>
              <View style={styles.readOnlyField}>
                <AppText style={styles.readOnlyText}>{detail.category.categoryName}</AppText>
              </View>
            </View>

            {CONTENT_FIELDS.map((field) => (
              <View key={field.key} style={styles.fieldGroup}>
                <AppText style={styles.fieldLabel}>{field.label}</AppText>
                <TextInput
                  style={[styles.input, field.multiline ? styles.textArea : null]}
                  value={contents[field.key]}
                  onChangeText={(value) => setContents((prev) => ({ ...prev, [field.key]: value }))}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.faint}
                  multiline={field.multiline}
                  textAlignVertical={field.multiline ? 'top' : 'center'}
                />
              </View>
            ))}

            <View style={styles.fieldGroup}>
              <AppText style={styles.fieldLabel}>공개 범위</AppText>
              <View style={styles.visibilityRow}>
                {VISIBILITY_OPTIONS.map((option) => {
                  const isSelected = visibility === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      style={[styles.visibilityChip, isSelected && styles.visibilityChipActive]}
                      onPress={() => setVisibility(option.value)}
                    >
                      <AppText
                        style={[styles.visibilityChipText, isSelected && styles.visibilityChipTextActive]}
                      >
                        {option.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {errorMessage ? <AppText style={styles.errorText}>{errorMessage}</AppText> : null}
          </ScrollView>

          <View style={styles.actions}>
            <View style={styles.actionItem}>
              <Button label="취소" variant="secondary" color={colors.muted} onPress={onClose} disabled={isSaving} />
            </View>
            <View style={styles.actionItem}>
              <Button label="저장" onPress={handleSave} loading={isSaving} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(24,29,38,0.5)' },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.canvas,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 28,
    ...shadow.sheet,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: '#d8dbe1', marginBottom: 16 },
  sheetDescription: { marginTop: 6, fontSize: 14, color: colors.muted },
  formScroll: { marginTop: 16 },
  formContent: { gap: 18, paddingBottom: 12 },
  fieldGroup: { gap: 8 },
  fieldLabel: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.body },
  input: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.soft,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
  },
  textArea: { minHeight: 92 },
  readOnlyField: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.soft2,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  readOnlyText: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted },
  visibilityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  visibilityChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.canvas,
  },
  visibilityChipActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  visibilityChipText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted },
  visibilityChipTextActive: { color: colors.brand },
  errorText: { marginTop: 8, fontSize: 14, lineHeight: 20, color: colors.accent },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionItem: { flex: 1 },
});
