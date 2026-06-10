import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar, AppText, Button, Card, CatChip, Icon, ImageSlot, StatusBadge } from '../../../components/ui';
import { resolveApiBaseUrl } from '../../../lib/api/client';
import { colors, fonts, radius, statusColors, type StatusKey } from '../../../theme';
import { fetchAdminIssueDetail } from '../api/adminIssueApi';
import type { AdminIssueDetail } from '../types/adminIssue';
import type { ReportStatus } from '../../report/types/myReport';
import {
  formatReportDateTime,
  formatStatusTransition,
  getReportStatusLabel,
  getReportStatusTone,
  sortStatusHistories,
} from '../../report/utils/reportStatus';

const STATUS_OPTIONS: StatusKey[] = ['wait', 'prog', 'done'];

export function OfficerReportDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { issueGroupId } = useLocalSearchParams<{ issueGroupId: string }>();
  const [detail, setDetail] = useState<AdminIssueDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusKey>('wait');
  const [note, setNote] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDetail = useCallback(async () => {
    const id = Number(issueGroupId);
    if (!Number.isFinite(id)) {
      setErrorMessage('유효하지 않은 이슈 그룹 ID입니다.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await fetchAdminIssueDetail(id);
      setDetail(data);
      setStatus(getReportStatusTone(data.representativeReport.report.status as ReportStatus));
    } catch (error) {
      let message = '이슈 상세를 불러오지 못했습니다.';
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;
        message = typeof apiMessage === 'string' ? apiMessage : error.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      if (axios.isAxiosError(error) && !error.response) {
        message = `${message}\n\n요청 주소: ${resolveApiBaseUrl()}`;
      }
      setDetail(null);
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, [issueGroupId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleUpdate = () => {
    setToast(`'${statusColors[status].label}'(으)로 변경되었습니다`);
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(officer)/inbox');
  };

  const representative = detail?.representativeReport;
  const representativeReport = representative?.report;
  const representativeImages = representative?.reportImages ?? [];
  const statusHistories = representative
    ? sortStatusHistories(representative.statusHistories)
    : [];
  const summaryText =
    representativeReport?.contents.summary ?? detail?.issueGroup.content ?? '';

  const info: [string, string][] = detail
    ? [
        ['이슈 그룹', `#${detail.issueGroup.id}`],
        ['제보 건수', `${detail.issueGroup.reportCount}건`],
        [
          '위치',
          representativeReport?.roadAddress ||
            `${representativeReport?.sido ?? ''} ${representativeReport?.sigungu ?? ''}`.trim(),
        ],
        ['발생 시각', formatReportDateTime(representativeReport?.occurredAt ?? detail.issueGroup.recentReportedAt)],
        [
          '담당 부서',
          `${detail.department.agencyType.name} · ${detail.department.name}`,
        ],
      ]
    : [];

  return (
    <View style={styles.flex}>
      <AppBar
        title={detail ? `#${detail.issueGroup.id}` : '이슈 상세'}
        logo={false}
        onBack={goBack}
        right={<Icon name="info" size={20} color={colors.body} />}
      />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand} />
        </View>
      ) : errorMessage ? (
        <View style={styles.centered}>
          <AppText style={styles.errorText}>{errorMessage}</AppText>
          <View style={styles.retryWrap}>
            <Button label="다시 시도" icon="refresh" onPress={loadDetail} />
          </View>
        </View>
      ) : detail && representativeReport ? (
        <>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {representativeImages.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.heroImageRow}
              >
                {representativeImages.map((image) => (
                  <ImageSlot key={image.id} uri={image.imageUrl} height={132} width={220} label="" />
                ))}
              </ScrollView>
            ) : (
              <ImageSlot height={132} label="제보자 첨부 이미지" />
            )}

            <View>
              <CatChip icon="alert" label={detail.category.categoryName} color={colors.brand} />
              <AppText variant="heading" color={colors.ink} style={styles.title}>
                {detail.issueGroup.title || representativeReport.title}
              </AppText>
              <View style={styles.badgeRow}>
                <StatusBadge
                  status={getReportStatusTone(representativeReport.status as ReportStatus)}
                  size="sm"
                  label={getReportStatusLabel(representativeReport.status as ReportStatus)}
                />
                {representativeReport.isDeleted ? (
                  <View style={styles.deletedBadge}>
                    <AppText style={styles.deletedBadgeText}>삭제된 제보</AppText>
                  </View>
                ) : null}
              </View>
            </View>

            {summaryText ? (
              <Card>
                <AppText style={styles.sectionLabel}>요약</AppText>
                <AppText style={styles.summaryText}>{summaryText}</AppText>
              </Card>
            ) : null}

            <Card padded={false} style={styles.infoCard}>
              {info.map(([k, v], i) => (
                <View key={k} style={[styles.infoRow, i > 0 && styles.infoDivider]}>
                  <AppText style={styles.infoKey}>{k}</AppText>
                  <AppText style={[styles.infoVal, i === 0 && styles.mono]}>{v}</AppText>
                </View>
              ))}
            </Card>

            {statusHistories.length > 0 ? (
              <Card>
                <AppText style={styles.sectionLabel}>처리 이력</AppText>
                {statusHistories.map((history, index) => (
                  <View key={history.id} style={[styles.historyRow, index > 0 && styles.historyDivider]}>
                    <AppText style={styles.historyStatus}>
                      {formatStatusTransition(
                        history.previousStatus,
                        history.newStatus as ReportStatus
                      )}
                    </AppText>
                    <AppText style={styles.historyMeta}>
                      {formatReportDateTime(history.createdAt)}
                    </AppText>
                    {history.reason ? (
                      <AppText style={styles.historyReason}>{history.reason}</AppText>
                    ) : null}
                  </View>
                ))}
              </Card>
            ) : null}

            {detail.reports.length > 0 ? (
              <View>
                <AppText style={styles.sectionLabel}>
                  제보 목록 ({detail.reports.length}건)
                </AppText>
                <View style={styles.reportList}>
                  {detail.reports.map((bundle) => {
                    const report = bundle.report;
                    const thumb = bundle.reportImages[0]?.imageUrl;
                    return (
                      <Card key={report.id} style={styles.reportCard}>
                        <View style={styles.reportCardTop}>
                          <AppText style={styles.reportCardId}>제보 #{report.id}</AppText>
                          <StatusBadge
                            status={getReportStatusTone(report.status as ReportStatus)}
                            size="sm"
                            label={getReportStatusLabel(report.status as ReportStatus)}
                          />
                        </View>
                        <AppText style={styles.reportCardTitle} numberOfLines={2}>
                          {report.title}
                        </AppText>
                        <View style={styles.reportCardMeta}>
                          {report.isRepresentative ? (
                            <AppText style={styles.reportCardTag}>대표 제보</AppText>
                          ) : null}
                          {report.isDeleted ? (
                            <AppText style={styles.reportCardTagMuted}>삭제됨</AppText>
                          ) : null}
                          <AppText style={styles.reportCardMetaText}>
                            {formatReportDateTime(report.createdAt)}
                          </AppText>
                        </View>
                        {thumb ? (
                          <Image source={{ uri: thumb }} style={styles.reportThumb} />
                        ) : null}
                      </Card>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View>
              <AppText style={styles.sectionLabel}>상태 변경</AppText>
              <AppText style={styles.sectionHint}>변경 시 시민에게 알림이 전송돼요</AppText>
              <View style={styles.statusRow}>
                {STATUS_OPTIONS.map((s) => {
                  const st = statusColors[s];
                  const on = s === status;
                  return (
                    <Pressable
                      key={s}
                      onPress={() => setStatus(s)}
                      style={[
                        styles.statusBtn,
                        {
                          borderColor: on ? st.dot : colors.hairline,
                          backgroundColor: on ? st.bg : colors.canvas,
                        },
                      ]}
                    >
                      <AppText style={[styles.statusBtnText, { color: on ? st.fg : colors.muted }]}>
                        {st.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View>
              <AppText style={styles.sectionLabel}>처리 내용 등록</AppText>
              <View style={styles.noteRow}>
                <Pressable style={styles.photoSlot}>
                  <Icon name="camera" size={20} color={colors.muted} />
                  <AppText style={styles.photoSlotText}>처리 사진</AppText>
                </Pressable>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="처리 내용을 입력하세요…"
                  placeholderTextColor={colors.faint}
                  multiline
                  textAlignVertical="top"
                  style={styles.noteInput}
                />
              </View>
            </View>
          </ScrollView>

          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <Button label="업데이트" icon="check" onPress={handleUpdate} />
          </SafeAreaView>
        </>
      ) : null}

      {toast ? (
        <View style={[styles.toastWrap, { top: insets.top + 56 }]} pointerEvents="none">
          <View style={styles.toast}>
            <View style={styles.toastIcon}>
              <Icon name="check" size={14} color={colors.white} strokeWidth={2.6} />
            </View>
            <AppText style={styles.toastText}>{toast}</AppText>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.soft },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  errorText: { fontSize: 14.5, color: colors.muted, textAlign: 'center', lineHeight: 21 },
  retryWrap: { width: '100%', maxWidth: 220 },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24, gap: 13 },
  heroImageRow: { gap: 10 },
  title: { marginTop: 7, lineHeight: 23 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  deletedBadge: {
    backgroundColor: colors.hairline,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  deletedBadgeText: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.muted },
  summaryText: { fontSize: 14, color: colors.body, lineHeight: 20, marginTop: 6 },

  infoCard: { paddingHorizontal: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  infoDivider: { borderTopWidth: 1, borderTopColor: colors.hairline },
  infoKey: { fontSize: 13, color: colors.muted },
  infoVal: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink, flex: 1, textAlign: 'right', marginLeft: 12 },
  mono: { fontFamily: fonts.semibold },

  historyRow: { gap: 4, paddingVertical: 8 },
  historyDivider: { borderTopWidth: 1, borderTopColor: colors.hairline },
  historyStatus: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  historyMeta: { fontSize: 12.5, color: colors.muted },
  historyReason: { fontSize: 13, color: colors.body, lineHeight: 18 },

  reportList: { gap: 10 },
  reportCard: { gap: 8 },
  reportCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reportCardId: { fontFamily: fonts.semibold, fontSize: 12, color: colors.muted },
  reportCardTitle: { fontFamily: fonts.semibold, fontSize: 14.5, color: colors.ink, lineHeight: 20 },
  reportCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  reportCardTag: { fontFamily: fonts.bold, fontSize: 11.5, color: colors.brand },
  reportCardTagMuted: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.muted },
  reportCardMetaText: { fontSize: 12, color: colors.faint },
  reportThumb: { width: '100%', height: 96, borderRadius: radius.sm, backgroundColor: colors.hairline },

  sectionLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink, marginBottom: 8 },
  sectionHint: { fontSize: 12.5, color: colors.muted, marginTop: -4, marginBottom: 10 },
  statusRow: { flexDirection: 'row', gap: 7 },
  statusBtn: { flex: 1, borderRadius: radius.sm, paddingVertical: 11, alignItems: 'center', borderWidth: 1.5 },
  statusBtnText: { fontFamily: fonts.bold, fontSize: 13 },

  noteRow: { flexDirection: 'row', gap: 10 },
  photoSlot: {
    width: 70,
    height: 70,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  photoSlotText: { fontFamily: fonts.semibold, fontSize: 10.5, color: colors.muted },
  noteInput: {
    flex: 1,
    height: 70,
    backgroundColor: colors.canvas,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: colors.ink,
  },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.soft,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },

  toastWrap: { position: 'absolute', left: 16, right: 16 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  toastIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: statusColors.done.dot,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.white, flex: 1 },
});
