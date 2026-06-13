import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppBar,
  AppText,
  Button,
  Card,
  CatChip,
  Icon,
  StatusBadge,
} from '../../../components/ui';
import { colors, fonts, radius, fontSize } from '../../../theme';
import { resolveApiBaseUrl } from '../../../lib/api/client';
import { deleteMyReport, fetchMyReportDetail } from '../api/reportApi';
import { MyReportEditSheet } from '../components/MyReportEditSheet';
import type { MyReportDetail } from '../types/myReportDetail';
import { formatAiSummary } from '../utils/reportAiSummary';
import {
  canDeleteReport,
  canEditReport,
  formatReportDateTime,
  formatStatusTransition,
  getReportStatusLabel,
  getReportStatusTone,
  sortStatusHistories,
} from '../utils/reportStatus';

const CONTENT_FIELDS = [
  { key: 'what', label: '무엇을' },
  { key: 'where', label: '어디서' },
  { key: 'when', label: '언제' },
  { key: 'who', label: '누가' },
  { key: 'how', label: '어떻게' },
  { key: 'why', label: '왜' },
] as const;

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  const seen = new Set<string>();

  return values
    .map((value) => value?.trim())
    .filter((value): value is string => {
      if (!value || seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
}

function getAddressLines(report: MyReportDetail['report']) {
  const region = [report.sido, report.sigungu, report.eupmyeondong].filter(Boolean).join(' ');
  return uniqueNonEmpty([report.roadAddress, report.jibunAddress, region]).slice(0, 1);
}

function getDepartmentLines(department: MyReportDetail['department']) {
  const agencyLine = [department.agencyTypeName, department.name].filter(Boolean).join(' · ');
  const showDepartmentOnly = department.name && department.name !== agencyLine;

  return uniqueNonEmpty([agencyLine, showDepartmentOnly ? department.name : undefined]);
}

function getHistoryDepartmentLine(
  department: MyReportDetail['statusHistories'][number]['department'] | MyReportDetail['department'] | null | undefined
) {
  if (!department) {
    return null;
  }

  const agencyTypeName =
    'agencyType' in department
      ? department.agencyType?.name
      : department.agencyTypeName;

  return [agencyTypeName, department.name].filter(Boolean).join(' · ') || null;
}

export function MyReportDetailScreen() {
  const router = useRouter();
  const { reportId } = useLocalSearchParams<{ reportId: string }>();
  const [detail, setDetail] = useState<MyReportDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditVisible, setIsEditVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const insets = useSafeAreaInsets();
  const showDeleteButton = detail ? canDeleteReport(detail.report.status) : false;

  const loadDetail = useCallback(async () => {
    const id = Number(reportId);
    if (!Number.isFinite(id)) {
      setErrorMessage('유효하지 않은 민원 ID입니다.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await fetchMyReportDetail(id);
      setDetail(data);
    } catch (error) {
      let message = '민원 상세를 불러오지 못했습니다.';
      if (axios.isAxiosError(error)) {
        const apiMessage = error.response?.data?.message;
        message = typeof apiMessage === 'string' ? apiMessage : error.message || message;
      } else if (error instanceof Error) {
        message = error.message;
      }
      if (axios.isAxiosError(error) && !error.response) {
        message = `${message}\n\n요청 주소: ${resolveApiBaseUrl()}`;
      }
      setErrorMessage(message);
      setDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleDeletePress = useCallback(() => {
    if (!detail || isDeleting) {
      return;
    }

    Alert.alert('민원 삭제', '삭제한 민원은 복구할 수 없어요. 정말 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          setIsDeleting(true);
          try {
            await deleteMyReport(detail.report.id);
            router.replace('/my-reports');
          } catch (error) {
            let message = '민원 삭제에 실패했습니다.';
            if (axios.isAxiosError(error)) {
              const apiMessage = error.response?.data?.message;
              message = typeof apiMessage === 'string' ? apiMessage : error.message || message;
            } else if (error instanceof Error) {
              message = error.message;
            }
            Alert.alert('삭제 실패', message);
          } finally {
            setIsDeleting(false);
          }
        },
      },
    ]);
  }, [detail, isDeleting, router]);

  const summaryText = formatAiSummary(detail?.report.contents);
  const addressLines = detail ? getAddressLines(detail.report) : [];
  const departmentLines = detail ? getDepartmentLines(detail.department) : [];

  const contentEntries = detail
    ? CONTENT_FIELDS.flatMap(({ key, label }) => {
        const value = detail.report.contents[key];
        return value ? [{ label, value }] : [];
      })
    : [];

  const statusHistories = detail ? sortStatusHistories(detail.statusHistories) : [];
  const activeHistoryIndex = statusHistories.reduce<number>(
    (activeIndex, history, index) =>
      history.newStatus === detail?.report.status ? index : activeIndex,
    statusHistories.length > 0 ? statusHistories.length - 1 : -1
  );

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/my-reports');
  };

  return (
    <View style={styles.flex}>
      <AppBar
        title="민원 상세"
        logo={false}
        onBack={goBack}
        right={
          detail && canEditReport(detail.report.status) ? (
            <Pressable onPress={() => setIsEditVisible(true)} hitSlop={8}>
              <AppText style={styles.editAction}>수정</AppText>
            </Pressable>
          ) : undefined
        }
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
      ) : detail ? (
        <>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: showDeleteButton ? 24 : insets.bottom + 32 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.topRow}>
              <CatChip icon="alert" label={detail.category.categoryName} color={colors.coral} />
              <StatusBadge
                status={getReportStatusTone(detail.report.status)}
                size="sm"
                label={getReportStatusLabel(detail.report.status)}
              />
            </View>
            <AppText variant="title" color={colors.ink} style={styles.title}>
              {detail.report.title}
            </AppText>

            <Card style={styles.metaCard}>
              <View style={styles.metaCol}>
                <AppText style={styles.metaLabel}>위험 지수</AppText>
                <AppText style={styles.metaValue}>{detail.report.riskScore}</AppText>
              </View>
              <View style={styles.metaSep} />
              <View style={styles.metaCol}>
                <AppText style={styles.metaLabel}>신고일</AppText>
                <AppText style={styles.metaValue}>
                  {formatReportDateTime(detail.report.createdAt)}
                </AppText>
              </View>
            </Card>

            {summaryText ? (
              <Card>
                <View style={styles.aiLabelRow}>
                  <Icon name="sparkle" size={14} color="#F2C55C" strokeWidth={1.9} />
                  <AppText style={styles.aiLabel}>AI 요약</AppText>
                </View>
                <AppText style={styles.summaryText}>{summaryText}</AppText>
              </Card>
            ) : null}

            {contentEntries.length > 0 ? (
              <Card>
                <AppText style={[styles.cardLabel, styles.cardLabelGap]}>상세 내용</AppText>
                <View style={styles.detailList}>
                  {contentEntries.map((entry, index) => (
                    <View
                      key={entry.label}
                      style={[styles.detailItem, index > 0 ? styles.detailItemDivider : null]}
                    >
                      <AppText style={styles.gridKey}>{entry.label}</AppText>
                      <AppText style={styles.gridValue}>{entry.value}</AppText>
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}

            {detail.reportImages.length > 0 ? (
              <View>
                <AppText style={[styles.cardLabel, styles.outerLabel]}>첨부 사진</AppText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
                  {detail.reportImages.map((image) => (
                    <Image key={image.id} source={{ uri: image.imageUrl }} style={styles.image} />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            <Card>
              <View style={styles.rowCenter}>
                <Icon name="location" size={15} color={colors.muted} />
                <AppText style={[styles.cardLabel, styles.inlineLabel]}>위치</AppText>
              </View>
              {addressLines.length > 0 ? (
                addressLines.map((line, index) => (
                  <AppText
                    key={line}
                    style={index === 0 ? styles.locationPrimary : styles.locationSecondary}
                  >
                    {line}
                  </AppText>
                ))
              ) : (
                <AppText style={styles.locationSecondary}>위치 정보 없음</AppText>
              )}
            </Card>

            <Card>
              <View style={styles.rowCenter}>
                <Icon name="building" size={15} color={colors.muted} />
                <AppText style={[styles.cardLabel, styles.inlineLabel]}>담당 기관</AppText>
              </View>
              {departmentLines.length > 0 ? (
                departmentLines.map((line, index) => (
                  <AppText
                    key={line}
                    style={index === 0 ? styles.agencyName : styles.locationSecondary}
                  >
                    {line}
                  </AppText>
                ))
              ) : (
                <AppText style={styles.locationSecondary}>담당 기관 정보 없음</AppText>
              )}
            </Card>

            {statusHistories.length > 0 ? (
              <Card>
                <AppText style={[styles.cardLabel, styles.cardLabelGap]}>처리 이력</AppText>
                {statusHistories.map((history, index) => (
                  (() => {
                    const historyDepartment = getHistoryDepartmentLine(history.department ?? detail.department);

                    return (
                      <View key={history.id} style={styles.timelineItem}>
                        <View style={styles.timelineLeft}>
                          <View
                            style={[
                              styles.timelineDot,
                              index === activeHistoryIndex ? styles.timelineDotActive : null,
                            ]}
                          />
                          {index < statusHistories.length - 1 ? <View style={styles.timelineLine} /> : null}
                        </View>
                        <View style={styles.timelineContent}>
                          <AppText style={styles.timelineStatus}>
                            {formatStatusTransition(history.previousStatus, history.newStatus)}
                          </AppText>
                          {historyDepartment ? (
                            <View style={styles.timelineDepartmentRow}>
                              <Icon name="building" size={13} color={colors.muted} strokeWidth={2} />
                              <AppText style={styles.timelineDepartmentText}>
                                {getReportStatusLabel(history.newStatus)} 부서 · {historyDepartment}
                              </AppText>
                            </View>
                          ) : null}
                          {history.reason ? <AppText style={styles.timelineReason}>{history.reason}</AppText> : null}
                          <AppText style={styles.timelineDate}>{formatReportDateTime(history.createdAt)}</AppText>
                        </View>
                      </View>
                    );
                  })()
                ))}
              </Card>
            ) : null}
          </ScrollView>

          {showDeleteButton ? (
            <SafeAreaView edges={['bottom']} style={styles.footer}>
              <Button
                label="삭제"
                bg={colors.accent}
                loading={isDeleting}
                onPress={handleDeletePress}
              />
            </SafeAreaView>
          ) : null}
        </>
      ) : null}

      {detail && canEditReport(detail.report.status) ? (
        <MyReportEditSheet
          visible={isEditVisible}
          detail={detail}
          onClose={() => setIsEditVisible(false)}
          onSaved={loadDetail}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.soft },
  editAction: { fontFamily: fonts.bold, fontSize: fontSize.mdLg, color: colors.accent },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  errorText: { fontSize: fontSize.base, lineHeight: 22, color: colors.muted, textAlign: 'center' },
  retryWrap: { alignSelf: 'stretch', paddingHorizontal: 24 },

  content: { paddingHorizontal: 18, paddingTop: 16, gap: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { lineHeight: 26 },

  metaCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  metaCol: { flex: 1, alignItems: 'center', gap: 4 },
  metaSep: { width: 1, alignSelf: 'stretch', backgroundColor: colors.hairline },
  metaLabel: { fontSize: fontSize.xs, color: colors.muted },
  metaValue: { fontFamily: fonts.bold, fontSize: fontSize.base, color: colors.ink },

  cardLabel: { fontFamily: fonts.bold, fontSize: fontSize.md, color: colors.ink },
  cardLabelGap: { marginBottom: 6 },
  outerLabel: { marginLeft: 4, marginBottom: 8 },
  inlineLabel: { marginLeft: 6 },
  rowCenter: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  aiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  aiLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    lineHeight: 17,
    color: '#77777E',
  },
  summaryText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.ink,
    lineHeight: 23,
  },

  detailList: {
    marginTop: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
  },
  detailItemDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  gridKey: {
    width: 54,
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: colors.brand,
  },
  gridValue: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.medium,
    fontSize: fontSize.mdLg,
    color: colors.body,
    lineHeight: 23,
  },

  imageRow: { gap: 10, paddingVertical: 2 },
  image: { width: 130, height: 130, borderRadius: radius.md, backgroundColor: colors.soft2 },

  locationPrimary: { fontSize: fontSize.mdLg, color: colors.body, fontFamily: fonts.medium },
  locationSecondary: { fontSize: fontSize.md, color: colors.muted, marginTop: 3 },
  agencyName: { fontFamily: fonts.bold, fontSize: fontSize.mdLg, color: colors.ink },

  timelineItem: { flexDirection: 'row', gap: 12 },
  timelineLeft: { alignItems: 'center', width: 14 },
  timelineDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.soft2, marginTop: 3 },
  timelineDotActive: { backgroundColor: colors.accent },
  timelineLine: { flex: 1, width: 2, backgroundColor: colors.hairline, marginVertical: 2 },
  timelineContent: { flex: 1, paddingBottom: 18 },
  timelineStatus: { fontFamily: fonts.semibold, fontSize: fontSize.mdLg, color: colors.ink },
  timelineDepartmentRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  timelineDepartmentText: { flex: 1, fontFamily: fonts.semibold, fontSize: fontSize.sm, color: colors.muted },
  timelineReason: { fontSize: fontSize.md, color: colors.body, marginTop: 3, lineHeight: 23 },
  timelineDate: { fontSize: fontSize.xs, color: colors.faint, marginTop: 4 },

  footer: {
    paddingHorizontal: 18,
    paddingTop: 10,
    backgroundColor: colors.canvas,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
});
