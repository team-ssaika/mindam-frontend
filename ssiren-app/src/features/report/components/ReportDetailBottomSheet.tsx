import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BottomSheet, useBottomSheetClose } from '../../../components/ui/BottomSheet';
import { fonts, fontSize } from '../../../theme';
import { submitReportReaction } from '../api/reportApi';
import type { ReportStatus } from '../types/myReport';
import type { ReportDetail } from '../types/reportDetail';
import {
  getIssueGroupDiscomfortCount,
  getReportMarkerToneStyle,
  resolveReportMarkerTone,
} from '../utils/publicReportMap';
import { sortStatusHistories } from '../utils/reportStatus';

const SKY = '#75C7F4';
const SKY_DARK = '#34758A';
const SKY_SOFT = '#D7F2FC';
const TEXT = '#050505';
const BODY = '#7E7E87';
const MUTED = '#A0A0A8';
const LINE = '#E2E2E2';

type ReportDetailBottomSheetProps = {
  visible: boolean;
  report: ReportDetail;
  onClose: () => void;
};

function TimelineDot({ active }: { active: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1550,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [active, pulse]);

  const pulseStyle = {
    opacity: pulse.interpolate({
      inputRange: [0, 0.55, 1],
      outputRange: [0.34, 0.16, 0],
    }),
    transform: [
      {
        scale: pulse.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 2.45],
        }),
      },
    ],
  };

  return (
    <View style={styles.timelineDotWrap}>
      {active ? (
        <Animated.View style={[styles.timelineDotPulse, pulseStyle]} />
      ) : null}
      <View style={[styles.timelineDot, active ? styles.timelineDotActive : null]} />
    </View>
  );
}

function formatRiskLabel(label: string) {
  const value = label.match(/\d+(?:\.\d+)?/)?.[0];
  if (value) {
    return `위험지수 ${Number(value).toLocaleString('ko-KR', {
      maximumFractionDigits: 1,
    })}`;
  }

  return label.includes('위험지수') ? label : `위험지수 ${label}`;
}

function joinMeta(timeAgo: string, distance: string) {
  return [timeAgo, distance].filter((item) => item && item !== '-').join(' · ');
}

function getActiveStatusIndex(status: string) {
  const normalized = status.toUpperCase();

  if (normalized.includes('COMPLETED') || status.includes('완료')) {
    return 2;
  }

  if (
    normalized.includes('IN_PROGRESS') ||
    normalized.includes('CHECKING') ||
    normalized.includes('TRANSFERRED') ||
    status.includes('처리중') ||
    status.includes('진행')
  ) {
    return 1;
  }

  return 0;
}

function getTimelineLabel(status: ReportStatus) {
  if (status === 'COMPLETED') {
    return '처리완료';
  }

  if (
    status === 'CHECKING' ||
    status === 'IN_PROGRESS' ||
    status === 'TRANSFERRED'
  ) {
    return '처리중';
  }

  return '접수중';
}

type TimelineDepartment = NonNullable<NonNullable<ReportDetail['statusHistories']>[number]['department']>;

function formatTimelineDepartment(department: TimelineDepartment | null | undefined) {
  if (!department) {
    return '';
  }

  const agencyTypeName =
    'agencyType' in department
      ? department.agencyType?.name
      : department.agencyTypeName;

  return [agencyTypeName, department.name].filter(Boolean).join(' · ');
}

function getTimelineDescription(status: ReportStatus, agency: string) {
  if (status === 'COMPLETED') {
    return `${agency}에서 처리완료했습니다.`;
  }

  if (
    status === 'CHECKING' ||
    status === 'IN_PROGRESS' ||
    status === 'TRANSFERRED'
  ) {
    return `${agency}에서 처리하고 있습니다.`;
  }

  return `${agency}에 접수되었습니다.`;
}

function buildTimeline(report: ReportDetail) {
  const histories = sortStatusHistories(report.statusHistories ?? []);
  const descriptions = histories.reduce<Record<string, string>>((acc, history) => {
    const agency = formatTimelineDepartment(history.department);
    if (agency) {
      acc[getTimelineLabel(history.newStatus)] = getTimelineDescription(history.newStatus, agency);
    }
    return acc;
  }, {});
  const submittedDescription = descriptions['접수중'] || (
    report.organization ? `${report.organization}에 접수되었습니다.` : undefined
  );

  return [
    {
      label: '접수중',
      description: submittedDescription,
    },
    {
      label: '처리중',
      description: descriptions['처리중'],
    },
    {
      label: '처리완료',
      description: descriptions['처리완료'],
    },
  ];
}

function ReportDetailContent({ report }: { report: ReportDetail }) {
  const riskToneStyle = getReportMarkerToneStyle(resolveReportMarkerTone(report));
  const requestClose = useBottomSheetClose();
  const [isPressed, setIsPressed] = useState(false);
  const [discomfortCount, setDiscomfortCount] = useState(report.yesCount);
  const [isSubmittingReaction, setIsSubmittingReaction] = useState(false);
  const timeline = buildTimeline(report);
  const latestHistory = sortStatusHistories(report.statusHistories ?? []).at(-1);
  const activeStatusIndex = latestHistory
    ? timeline.findIndex((item) => item.label === getTimelineLabel(latestHistory.newStatus))
    : getActiveStatusIndex(report.status);

  useEffect(() => {
    setIsPressed(false);
    setDiscomfortCount(report.yesCount);
    setIsSubmittingReaction(false);
  }, [report.id, report.yesCount]);

  const handleClose = () => {
    setIsPressed(false);
    requestClose();
  };

  const handleDiscomfortPress = async () => {
    if (isSubmittingReaction) {
      return;
    }

    const reportId = Number(report.id);
    if (!Number.isFinite(reportId)) {
      Alert.alert('처리할 수 없어요', '제보 ID를 확인하지 못했습니다.');
      return;
    }

    const previousPressed = isPressed;
    const previousCount = discomfortCount;
    const nextPressed = !previousPressed;
    const reactionType = nextPressed ? 'YES' : 'UNKNOWN';

    setIsPressed(nextPressed);
    setDiscomfortCount((count) => Math.max(0, count + (nextPressed ? 1 : -1)));
    setIsSubmittingReaction(true);

    try {
      const result = await submitReportReaction(reportId, reactionType);
      setIsPressed(result.reactionLog.reactionType === 'YES');
      setDiscomfortCount(getIssueGroupDiscomfortCount(result.issueGroup));
    } catch (error) {
      console.log('[ReportDetail] reaction submit failed', error);
      setIsPressed(previousPressed);
      setDiscomfortCount(previousCount);
      Alert.alert('반영하지 못했어요', '잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmittingReaction(false);
    }
  };

  return (
    <View style={styles.contentRoot}>
      <View style={styles.sheetHeader}>
        <View style={styles.handle} />
        <View style={styles.topRow}>
          <View style={styles.riskPill}>
            <Ionicons name="warning-outline" size={14} color={riskToneStyle.iconColor} />
            <Text style={[styles.riskText, { color: riskToneStyle.textColor }]}>
              {formatRiskLabel(report.riskLabel)}
            </Text>
          </View>

          <Pressable
            style={styles.closeButton}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="민원 상세 닫기"
          >
            <Ionicons name="close" size={26} color="#2F2F2F" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.categoryText}>{report.category || '제보'}</Text>

        <Text style={styles.title} numberOfLines={3}>
          {report.title}
        </Text>

        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={18} color="#7D7B83" />
          <Text style={styles.addressText} numberOfLines={2}>
            {report.address || '위치 정보 없음'}
          </Text>
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.aiLabelRow}>
            <Ionicons name="sparkles-outline" size={12} color="#F2C55C" />
            <Text style={styles.aiLabel}>AI 요약</Text>
          </View>
          <Text style={styles.summaryText}>{report.summary || '요약 정보가 없습니다.'}</Text>
        </View>

        <Text style={styles.metaText}>{joinMeta(report.timeAgo, report.distance)}</Text>

        <Pressable
          style={({ pressed }) => [
            styles.discomfortButton,
            isSubmittingReaction ? styles.discomfortButtonDisabled : null,
            pressed || isPressed ? styles.discomfortButtonPressed : null,
          ]}
          onPress={handleDiscomfortPress}
          disabled={isSubmittingReaction}
          accessibilityRole="button"
          accessibilityLabel="나도 불편해요"
        >
          <Text style={[styles.discomfortText, isPressed ? styles.discomfortTextPressed : null]}>
            나도 불편해요
          </Text>
          <Ionicons name="hand-left-outline" size={16} color={TEXT} />
          <Text style={[styles.discomfortCount, isPressed ? styles.discomfortCountPressed : null]}>
            {discomfortCount}
          </Text>
        </Pressable>

        <View style={styles.divider} />

        <View style={styles.timeline}>
          {timeline.map((item, index) => {
            const isActive = index === activeStatusIndex;
            const isLast = index === timeline.length - 1;

            return (
              <View key={`${item.label}-${index}`} style={styles.timelineItem}>
                <View style={styles.timelineRail}>
                  <TimelineDot active={isActive} />
                  {!isLast ? <View style={styles.timelineLine} /> : null}
                </View>

                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, isActive ? styles.timelineTitleActive : null]}>
                    {item.label}
                  </Text>
                  {item.description ? (
                    <Text style={styles.timelineDescription}>{item.description}</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export function ReportDetailBottomSheet({
  visible,
  report,
  onClose,
}: ReportDetailBottomSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      minHeight="76%"
      showHandle={false}
      containerStyle={styles.sheetContainer}
    >
      <ReportDetailContent report={report} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    height: '76%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 14,
    paddingHorizontal: 22,
    backgroundColor: '#FFFFFF',
  },
  contentRoot: {
    flex: 1,
  },
  sheetHeader: {
    paddingBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#B8B8B8',
    marginTop: 10,
    marginBottom: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  riskPill: {
    minHeight: 26,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    transform: [{ translateY: 2 }],
  },
  riskText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: 2 }],
  },
  categoryText: {
    marginTop: 12,
    fontFamily: fonts.bold,
    fontSize: fontSize.md,
    lineHeight: 18,
    color: SKY,
  },
  title: {
    marginTop: 14,
    fontFamily: fonts.black,
    fontSize: fontSize['2xl'],
    lineHeight: 28,
    color: TEXT,
    letterSpacing: 0,
  },
  addressRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressText: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    lineHeight: 18,
    color: '#7D7B83',
  },
  summaryBox: {
    marginTop: 20,
    borderRadius: 12,
    backgroundColor: '#F7F7F8',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  aiLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  aiLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    lineHeight: 16,
    color: '#77777E',
  },
  summaryText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.md,
    lineHeight: 20,
    color: TEXT,
  },
  metaText: {
    marginTop: 16,
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    lineHeight: 18,
    color: BODY,
  },
  discomfortButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    minHeight: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D6E4EA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#58BEF5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  discomfortButtonPressed: {
    borderColor: '#58BEF5',
    backgroundColor: '#CDEFFC',
    shadowOpacity: 0.18,
    shadowRadius: 7,
    elevation: 2,
  },
  discomfortButtonDisabled: {
    opacity: 0.72,
  },
  discomfortText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    lineHeight: 18,
    color: '#5C7280',
  },
  discomfortTextPressed: {
    color: SKY_DARK,
  },
  discomfortCount: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    lineHeight: 18,
    color: TEXT,
  },
  discomfortCountPressed: {
    color: TEXT,
  },
  divider: {
    height: 1,
    backgroundColor: LINE,
    marginTop: 22,
    marginBottom: 20,
  },
  timeline: {
    gap: 0,
    overflow: 'visible',
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 62,
    overflow: 'visible',
  },
  timelineRail: {
    width: 36,
    alignItems: 'center',
    paddingLeft: 8,
    overflow: 'visible',
    zIndex: 2,
  },
  timelineDotWrap: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10,
    marginBottom: -10,
    overflow: 'visible',
    zIndex: 3,
    elevation: 6,
  },
  timelineDotPulse: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: SKY,
    zIndex: 1,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D8D8D8',
    backgroundColor: '#8F8F8F',
    zIndex: 2,
  },
  timelineDotActive: {
    borderColor: '#9DDAF5',
    backgroundColor: SKY,
    shadowColor: SKY_DARK,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.36,
    shadowRadius: 7,
    elevation: 5,
  },
  timelineLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: '#DADADA',
    marginVertical: 3,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 14,
  },
  timelineTitle: {
    fontFamily: fonts.black,
    fontSize: fontSize.md,
    lineHeight: 18,
    color: '#9C9C9C',
  },
  timelineTitleActive: {
    color: SKY,
  },
  timelineDescription: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: fontSize.micro,
    lineHeight: 16,
    color: MUTED,
  },
});
