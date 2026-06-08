import { Ionicons } from '@expo/vector-icons';
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
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip } from '../../../components/ui/Chip';
import { SummaryBox } from '../../../components/ui/SummaryBox';
import { resolveApiBaseUrl } from '../../../lib/api/client';
import { deleteMyReport, fetchMyReportDetail } from '../api/reportApi';
import { MyReportEditSheet } from '../components/MyReportEditSheet';
import type { MyReportDetail } from '../types/myReportDetail';
import {
  canDeleteReport,
  canEditReport,
  formatReportDateTime,
  formatStatusTransition,
  getReportStatusLabel,
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
        message =
          typeof apiMessage === 'string'
            ? apiMessage
            : error.message || message;
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

    Alert.alert(
      '민원 삭제',
      '삭제한 민원은 복구할 수 없어요. 정말 삭제할까요?',
      [
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
                message =
                  typeof apiMessage === 'string'
                    ? apiMessage
                    : error.message || message;
              } else if (error instanceof Error) {
                message = error.message;
              }
              Alert.alert('삭제 실패', message);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [detail, isDeleting, router]);

  const summaryText =
    detail?.report.contents.summary ?? detail?.issueGroup.content ?? '';

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.replace('/my-reports');
          }}
        >
          <Ionicons name="chevron-back" size={24} color="#1E1E25" />
        </Pressable>
        <Text style={styles.headerTitle}>민원 상세</Text>
        {detail && canEditReport(detail.report.status) ? (
          <Pressable
            style={styles.headerTextButton}
            onPress={() => setIsEditVisible(true)}
            accessibilityLabel="민원 수정"
          >
            <Text style={styles.headerActionText}>수정</Text>
          </Pressable>
        ) : (
          <View style={styles.headerButton} />
        )}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6257FF" />
        </View>
      ) : errorMessage ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable style={styles.retryButton} onPress={loadDetail}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </Pressable>
        </View>
      ) : detail ? (
        <>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            !showDeleteButton ? { paddingBottom: insets.bottom + 32 } : null,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{detail.report.title}</Text>

          <View style={styles.chipRow}>
            {detail.parentCategory ? (
              <Chip variant="tag" label={detail.parentCategory.categoryName} />
            ) : null}
            <Chip variant="tag" label={detail.category.categoryName} />
            <Chip variant="status" label={getReportStatusLabel(detail.report.status)} />
          </View>

          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>위험 지수</Text>
            <Text style={styles.metaValue}>{detail.report.riskScore}</Text>
            <Text style={styles.metaDivider}>|</Text>
            <Text style={styles.metaLabel}>신고일</Text>
            <Text style={styles.metaValue}>
              {formatReportDateTime(detail.report.createdAt)}
            </Text>
          </View>

          {summaryText ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>요약</Text>
              <SummaryBox title="AI 요약" content={summaryText} />
            </View>
          ) : null}

          {contentEntries.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>상세 내용</Text>
              <View style={styles.valueCard}>
                {contentEntries.map((entry) => (
                  <View key={entry.label} style={styles.contentRow}>
                    <Text style={styles.contentLabel}>{entry.label}</Text>
                    <Text style={styles.contentValue}>{entry.value}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {detail.reportImages.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>첨부 사진</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.imageRow}
              >
                {detail.reportImages.map((image) => (
                  <Image
                    key={image.id}
                    source={{ uri: image.imageUrl }}
                    style={styles.image}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>위치</Text>
            <View style={styles.locationCard}>
              <Ionicons
                name="location-outline"
                size={20}
                color="#6257FF"
                style={styles.locationIcon}
              />
              <View style={styles.locationTextWrapper}>
                <Text style={styles.locationPrimary}>{detail.report.roadAddress}</Text>
                <Text style={styles.locationSecondary}>{detail.report.jibunAddress}</Text>
                <Text style={styles.locationSecondary}>
                  {detail.report.sido} {detail.report.sigungu} {detail.report.eupmyeondong}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>담당 기관</Text>
            <View style={styles.valueCard}>
              <Text style={styles.organizationName}>
                {detail.department.agencyName} · {detail.agencyType.name}
              </Text>
              <Text style={styles.organizationDept}>{detail.department.name}</Text>
            </View>
          </View>

          {statusHistories.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>처리 이력</Text>
              <View style={styles.timelineCard}>
                {statusHistories.map((history, index) => (
                  <View key={history.id} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View
                        style={[
                          styles.timelineDot,
                          index === activeHistoryIndex ? styles.timelineDotActive : null,
                        ]}
                      />
                      {index < statusHistories.length - 1 ? (
                        <View style={styles.timelineLine} />
                      ) : null}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineStatus}>
                        {formatStatusTransition(history.previousStatus, history.newStatus)}
                      </Text>
                      <Text style={styles.timelineReason}>{history.reason}</Text>
                      <Text style={styles.timelineDate}>
                        {formatReportDateTime(history.createdAt)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

        </ScrollView>

        {showDeleteButton ? (
          <SafeAreaView edges={['bottom']} style={styles.footer}>
            <Pressable
              style={[styles.deleteButton, isDeleting ? styles.deleteButtonDisabled : null]}
              onPress={handleDeletePress}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.deleteButtonText}>삭제</Text>
              )}
            </Pressable>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  header: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E7EAF0',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextButton: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6257FF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111119',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
    color: '#17171F',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  metaLabel: {
    fontSize: 13,
    color: '#6D6D78',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#17171F',
  },
  metaDivider: {
    fontSize: 13,
    color: '#D1D5DB',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#17171F',
  },
  valueCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  contentRow: {
    gap: 4,
  },
  contentLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6D6D78',
  },
  contentValue: {
    fontSize: 15,
    lineHeight: 22,
    color: '#2A2A38',
  },
  imageRow: {
    gap: 10,
  },
  image: {
    width: 96,
    height: 96,
    borderRadius: 14,
    backgroundColor: '#E7EAF0',
  },
  locationCard: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  locationTextWrapper: {
    flex: 1,
    gap: 4,
  },
  locationPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#242433',
  },
  locationSecondary: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5F5F6C',
  },
  organizationName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#17171F',
  },
  organizationDept: {
    fontSize: 14,
    color: '#6D6D78',
  },
  timelineCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 14,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D1D5DB',
    marginTop: 4,
  },
  timelineDotActive: {
    backgroundColor: '#6257FF',
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#E7EAF0',
    marginTop: 4,
    minHeight: 36,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 14,
    gap: 4,
  },
  timelineStatus: {
    fontSize: 15,
    fontWeight: '700',
    color: '#17171F',
  },
  timelineReason: {
    fontSize: 14,
    lineHeight: 20,
    color: '#484855',
  },
  timelineDate: {
    fontSize: 12,
    color: '#9B9BA6',
  },
  reactionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  reactionChip: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF0',
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  reactionLabel: {
    fontSize: 13,
    color: '#6D6D78',
  },
  reactionCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#17171F',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6D6D78',
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#6257FF',
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#F5F6FA',
    borderTopWidth: 1,
    borderTopColor: '#E7EAF0',
  },
  deleteButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.7,
  },
  deleteButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
