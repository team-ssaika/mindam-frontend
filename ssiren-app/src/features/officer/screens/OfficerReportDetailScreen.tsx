import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar, AppText, Button, Card, CatChip, Icon, ImageSlot, StatusBadge } from '../../../components/ui';
import { resolveApiBaseUrl } from '../../../lib/api/client';
import { colors, fonts, radius, statusColors } from '../../../theme';
import { fetchAdminIssueDetail, updateAdminIssueStatus } from '../api/adminIssueApi';
import type { AdminIssueDetail, AdminUpdatableReportStatus } from '../types/adminIssue';
import type { ReportStatus } from '../../report/types/myReport';
import {
  formatReportDateTime,
  formatStatusTransition,
  getReportStatusLabel,
  getReportStatusTone,
  sortStatusHistories,
} from '../../report/utils/reportStatus';
import {
  ADMIN_UPDATABLE_STATUSES,
  isAdminStatusOptionSelectable,
  toAdminUpdatableStatus,
} from '../utils/adminIssueStatus';

export function OfficerReportDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { issueGroupId } = useLocalSearchParams<{ issueGroupId: string }>();
  const [detail, setDetail] = useState<AdminIssueDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<AdminUpdatableReportStatus>('RECEIVED');
  const [reason, setReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const reasonSectionRef = useRef<View | null>(null);
  const scrollYRef = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const footerHeight = 72 + insets.bottom;

  const ensureReasonVisible = useCallback(
    (keyboardInset: number) => {
      if (!keyboardInset || !scrollRef.current || !reasonSectionRef.current) {
        return;
      }

      reasonSectionRef.current.measureInWindow((_x, y, _width, height) => {
        const keyboardTop = Dimensions.get('window').height - keyboardInset;
        const sectionBottom = y + height;
        const overlap = sectionBottom - keyboardTop + footerHeight + 12;

        if (overlap > 0) {
          scrollRef.current?.scrollTo({
            y: scrollYRef.current + overlap,
            animated: true,
          });
        }
      });
    },
    [footerHeight]
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const nextHeight = event.endCoordinates?.height ?? 0;
      setKeyboardHeight(nextHeight);
      setTimeout(() => ensureReasonVisible(nextHeight), Platform.OS === 'ios' ? 250 : 80);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [ensureReasonVisible]);

  const loadDetail = useCallback(async (options?: { silent?: boolean }) => {
    const id = Number(issueGroupId);
    if (!Number.isFinite(id)) {
      setErrorMessage('유효하지 않은 이슈 그룹 ID입니다.');
      setIsLoading(false);
      return;
    }

    if (!options?.silent) {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const data = await fetchAdminIssueDetail(id);
      setDetail(data);
      setSelectedStatus(
        toAdminUpdatableStatus(data.representativeReport.report.status as ReportStatus)
      );
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
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  }, [issueGroupId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(officer)/inbox');
  };

  const handleUpdate = async () => {
    if (!detail || isUpdating) {
      return;
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      Alert.alert('처리 사유 필요', '상태 변경 사유를 입력해 주세요.');
      return;
    }

    setIsUpdating(true);
    try {
      await updateAdminIssueStatus(detail.issueGroup.id, {
        status: selectedStatus,
        reason: trimmedReason,
        notifyReporter: true,
      });
      setReason('');
      goBack();
    } catch (error) {
      let message = '처리 상태 변경에 실패했습니다.';
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;
        message = typeof apiMessage === 'string' ? apiMessage : error.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      Alert.alert('변경 실패', message);
    } finally {
      setIsUpdating(false);
    }
  };

  const representative = detail?.representativeReport;
  const representativeReport = representative?.report;
  const representativeImages = representative?.reportImages ?? [];
  const statusHistories = representative
    ? sortStatusHistories(representative.statusHistories)
    : [];
  const activeHistoryIndex = statusHistories.reduce<number>(
    (activeIndex, history, index) =>
      history.newStatus === representativeReport?.status ? index : activeIndex,
    statusHistories.length > 0 ? statusHistories.length - 1 : -1
  );
  const summaryText =
    representativeReport?.contents.summary ?? detail?.issueGroup.content ?? '';

  const info: [string, string][] = detail
    ? [
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
        title="제보 상세"
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
            <Button label="다시 시도" icon="refresh" onPress={() => loadDetail()} />
          </View>
        </View>
      ) : detail && representativeReport ? (
        <View style={styles.flex}>
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={[styles.content, { paddingBottom: 24 + footerHeight }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(event) => {
              scrollYRef.current = event.nativeEvent.contentOffset.y;
            }}
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
                  <AppText style={styles.infoVal}>{v}</AppText>
                </View>
              ))}
            </Card>

            {statusHistories.length > 0 ? (
              <Card>
                <AppText style={styles.sectionLabel}>처리 이력</AppText>
                <View style={styles.timelineList}>
                  {statusHistories.map((history, index) => {
                    const isActive = index === activeHistoryIndex;
                    const tone = getReportStatusTone(history.newStatus as ReportStatus);
                    const toneColor = statusColors[tone].dot;
                    return (
                      <View key={history.id} style={styles.timelineItem}>
                        <View style={styles.timelineLeft}>
                          <View
                            style={[
                              styles.timelineDot,
                              isActive && { backgroundColor: toneColor, borderColor: toneColor },
                            ]}
                          />
                          {index < statusHistories.length - 1 ? (
                            <View style={styles.timelineLine} />
                          ) : null}
                        </View>
                        <View
                          style={[
                            styles.timelineContent,
                            index < statusHistories.length - 1 && styles.timelineContentSpaced,
                          ]}
                        >
                          <View style={styles.timelineHeader}>
                            <AppText
                              style={[styles.timelineStatus, isActive && { color: colors.ink }]}
                            >
                              {formatStatusTransition(
                                history.previousStatus,
                                history.newStatus as ReportStatus
                              )}
                            </AppText>
                            {isActive ? (
                              <View style={[styles.timelineCurrentBadge, { backgroundColor: statusColors[tone].bg }]}>
                                <AppText style={[styles.timelineCurrentBadgeText, { color: statusColors[tone].fg }]}>
                                  현재
                                </AppText>
                              </View>
                            ) : null}
                          </View>
                          {history.reason ? (
                            <AppText style={styles.timelineReason}>{history.reason}</AppText>
                          ) : null}
                          <AppText style={styles.timelineDate}>
                            {formatReportDateTime(history.createdAt)}
                          </AppText>
                        </View>
                      </View>
                    );
                  })}
                </View>
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
                          {report.isRepresentative ? (
                            <AppText style={styles.reportCardTag}>대표 제보</AppText>
                          ) : (
                            <View />
                          )}
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
                {ADMIN_UPDATABLE_STATUSES.map((statusOption) => {
                  const tone = getReportStatusTone(statusOption);
                  const st = statusColors[tone];
                  const on = statusOption === selectedStatus;
                  const selectable = representativeReport
                    ? isAdminStatusOptionSelectable(
                        representativeReport.status as ReportStatus,
                        statusOption
                      )
                    : true;
                  return (
                    <Pressable
                      key={statusOption}
                      disabled={!selectable}
                      onPress={() => setSelectedStatus(statusOption)}
                      style={[
                        styles.statusBtn,
                        !selectable && styles.statusBtnDisabled,
                        {
                          borderColor: on ? st.dot : colors.hairline,
                          backgroundColor: on ? st.bg : colors.canvas,
                        },
                      ]}
                    >
                      <AppText
                        style={[
                          styles.statusBtnText,
                          { color: on ? st.fg : selectable ? colors.muted : colors.faint },
                        ]}
                      >
                        {getReportStatusLabel(statusOption)}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View ref={reasonSectionRef}>
              <AppText style={styles.sectionLabel}>처리 사유</AppText>
              <View style={styles.noteRow}>
                <Pressable style={styles.photoSlot}>
                  <Icon name="camera" size={20} color={colors.muted} />
                  <AppText style={styles.photoSlotText}>처리 사진</AppText>
                </Pressable>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder="상태 변경 사유를 입력하세요…"
                  placeholderTextColor={colors.faint}
                  multiline
                  textAlignVertical="top"
                  style={styles.noteInput}
                  onFocus={() => {
                    if (keyboardHeight > 0) {
                      ensureReasonVisible(keyboardHeight);
                    }
                  }}
                />
              </View>
            </View>
          </ScrollView>

          <SafeAreaView
            edges={['bottom']}
            style={[
              styles.footer,
              {
                marginBottom:
                  keyboardHeight > 0 ? keyboardHeight + insets.bottom : 0,
              },
            ]}
          >
            <Button
              label="업데이트"
              icon="check"
              onPress={handleUpdate}
              loading={isUpdating}
              disabled={isUpdating || !reason.trim()}
            />
          </SafeAreaView>
        </View>
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

  timelineList: { marginTop: 4 },
  timelineItem: { flexDirection: 'row', gap: 12 },
  timelineLeft: { alignItems: 'center', width: 14 },
  timelineDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.canvas,
    borderWidth: 2,
    borderColor: colors.hairline,
    marginTop: 3,
  },
  timelineLine: { flex: 1, width: 2, backgroundColor: colors.hairline, marginVertical: 2 },
  timelineContent: { flex: 1 },
  timelineContentSpaced: { paddingBottom: 18 },
  timelineHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  timelineStatus: { fontFamily: fonts.semibold, fontSize: 14, color: colors.muted },
  timelineCurrentBadge: { borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2 },
  timelineCurrentBadgeText: { fontFamily: fonts.bold, fontSize: 10.5 },
  timelineReason: { fontSize: 13, color: colors.body, marginTop: 4, lineHeight: 19 },
  timelineDate: { fontSize: 12, color: colors.faint, marginTop: 4 },

  reportList: { gap: 10 },
  reportCard: { gap: 8 },
  reportCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reportCardTitle: { fontFamily: fonts.semibold, fontSize: 14.5, color: colors.ink, lineHeight: 20 },
  reportCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  reportCardTag: { fontFamily: fonts.bold, fontSize: 11.5, color: colors.brand },
  reportCardTagMuted: { fontFamily: fonts.semibold, fontSize: 11.5, color: colors.muted },
  reportCardMetaText: { fontSize: 12, color: colors.faint },
  reportThumb: { width: '100%', height: 96, borderRadius: radius.sm, backgroundColor: colors.hairline },

  sectionLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink, marginBottom: 8 },
  sectionHint: { fontSize: 12.5, color: colors.muted, marginTop: -4, marginBottom: 10 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  statusBtn: {
    minWidth: '30%',
    flexGrow: 1,
    borderRadius: radius.sm,
    paddingVertical: 11,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  statusBtnDisabled: { opacity: 0.4 },
  statusBtnText: { fontFamily: fonts.bold, fontSize: 12.5, textAlign: 'center' },

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
