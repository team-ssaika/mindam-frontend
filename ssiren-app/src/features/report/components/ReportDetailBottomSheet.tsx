import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BottomSheet, useBottomSheetClose } from '../../../components/ui/BottomSheet';
import { fonts, fontSize } from '../../../theme';
import type { ReportDetail } from '../types/reportDetail';

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

function buildTimeline(organization: string) {
  const agency = organization || '담당 기관';

  return [
    {
      label: '접수중',
      description: `${agency}에 접수되었습니다.`,
    },
    {
      label: '처리중',
      description: `${agency}에서 내용을 확인하고 있습니다.`,
    },
    {
      label: '처리완료',
      description: `${agency}에서 처리완료 되었습니다.`,
    },
  ];
}

function ReportDetailContent({ report }: { report: ReportDetail }) {
  const requestClose = useBottomSheetClose();
  const [isPressed, setIsPressed] = useState(false);
  const [discomfortCount, setDiscomfortCount] = useState(report.yesCount);
  const activeStatusIndex = getActiveStatusIndex(report.status);
  const timeline = buildTimeline(report.organization);

  useEffect(() => {
    setIsPressed(false);
    setDiscomfortCount(report.yesCount);
  }, [report.id, report.yesCount]);

  const handleClose = () => {
    setIsPressed(false);
    requestClose();
  };

  const handleDiscomfortPress = () => {
    setIsPressed((prev) => {
      setDiscomfortCount((count) => Math.max(0, count + (prev ? -1 : 1)));
      return !prev;
    });
    console.log('[ReportDetail] discomfort press', report.id);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.handle} />

      <View style={styles.topRow}>
        <View style={styles.riskPill}>
          <Ionicons name="warning-outline" size={18} color="#2F2F2F" />
          <Text style={styles.riskText}>{formatRiskLabel(report.riskLabel)}</Text>
        </View>

        <Pressable
          style={styles.closeButton}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="민원 상세 닫기"
        >
          <Ionicons name="close" size={30} color="#2F2F2F" />
        </Pressable>
      </View>

      <Text style={styles.categoryText}>{report.category || '제보'}</Text>

      <Text style={styles.title} numberOfLines={3}>
        {report.title}
      </Text>

      <View style={styles.addressRow}>
        <Ionicons name="location-outline" size={24} color="#7D7B83" />
        <Text style={styles.addressText} numberOfLines={2}>
          {report.address || '위치 정보 없음'}
        </Text>
      </View>

      <View style={styles.summaryBox}>
        <View style={styles.aiLabelRow}>
          <Ionicons name="sparkles-outline" size={14} color="#F2C55C" />
          <Text style={styles.aiLabel}>AI 요약</Text>
        </View>
        <Text style={styles.summaryText}>{report.summary || '요약 정보가 없습니다.'}</Text>
      </View>

      <Text style={styles.metaText}>{joinMeta(report.timeAgo, report.distance)}</Text>

      <Pressable
        style={({ pressed }) => [
          styles.discomfortButton,
          pressed || isPressed ? styles.discomfortButtonPressed : null,
        ]}
        onPress={handleDiscomfortPress}
        accessibilityRole="button"
        accessibilityLabel="나도 불편해요"
      >
        <Text style={[styles.discomfortText, isPressed ? styles.discomfortTextPressed : null]}>
          나도 불편해요
        </Text>
        <Ionicons name="hand-left-outline" size={23} color={isPressed ? '#FFFFFF' : TEXT} />
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
            <View key={item.label} style={styles.timelineItem}>
              <View style={styles.timelineRail}>
                <View style={[styles.timelineDot, isActive ? styles.timelineDotActive : null]} />
                {!isLast ? <View style={styles.timelineLine} /> : null}
              </View>

              <View style={styles.timelineContent}>
                <Text style={[styles.timelineTitle, isActive ? styles.timelineTitleActive : null]}>
                  {item.label}
                </Text>
                <Text style={styles.timelineDescription}>{item.description}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
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
      minHeight="88%"
      showHandle={false}
      containerStyle={styles.sheetContainer}
    >
      <ReportDetailContent report={report} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    height: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 28,
  },
  handle: {
    alignSelf: 'center',
    width: 56,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#B8B8B8',
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  riskPill: {
    minHeight: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    paddingHorizontal: 11,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
  },
  riskText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
    lineHeight: 23,
    color: TEXT,
  },
  closeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    marginTop: 22,
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    lineHeight: 23,
    color: SKY,
  },
  title: {
    marginTop: 8,
    fontFamily: fonts.black,
    fontSize: fontSize.display,
    lineHeight: 34,
    color: TEXT,
    letterSpacing: 0,
  },
  addressRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressText: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    lineHeight: 24,
    color: '#7D7B83',
  },
  summaryBox: {
    marginTop: 22,
    borderRadius: 14,
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
    fontSize: fontSize.md,
    lineHeight: 17,
    color: '#77777E',
  },
  summaryText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 23,
    color: TEXT,
  },
  metaText: {
    marginTop: 16,
    fontFamily: fonts.medium,
    fontSize: fontSize.base,
    lineHeight: 23,
    color: BODY,
  },
  discomfortButton: {
    alignSelf: 'flex-start',
    marginTop: 16,
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#58BEF5',
    backgroundColor: SKY_SOFT,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    shadowColor: '#58BEF5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 1,
  },
  discomfortButtonPressed: {
    borderColor: '#45AFE8',
    backgroundColor: SKY,
  },
  discomfortText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    lineHeight: 23,
    color: SKY_DARK,
  },
  discomfortTextPressed: {
    color: '#FFFFFF',
  },
  discomfortCount: {
    fontFamily: fonts.bold,
    fontSize: 19,
    lineHeight: 24,
    color: TEXT,
  },
  discomfortCountPressed: {
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: LINE,
    marginTop: 24,
    marginBottom: 22,
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 82,
  },
  timelineRail: {
    width: 38,
    alignItems: 'center',
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#D8D8D8',
    backgroundColor: '#8F8F8F',
  },
  timelineDotActive: {
    borderColor: '#9DDAF5',
    backgroundColor: SKY,
  },
  timelineLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: '#DADADA',
    marginVertical: 3,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineTitle: {
    fontFamily: fonts.black,
    fontSize: fontSize['2xl'],
    lineHeight: 26,
    color: '#9C9C9C',
  },
  timelineTitleActive: {
    color: SKY,
  },
  timelineDescription: {
    marginTop: 5,
    fontFamily: fonts.medium,
    fontSize: fontSize.base,
    lineHeight: 22,
    color: MUTED,
  },
});
