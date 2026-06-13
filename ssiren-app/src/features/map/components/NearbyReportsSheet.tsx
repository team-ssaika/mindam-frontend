import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState, type ForwardedRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Icon } from '../../../components/ui';
import { fonts, fontSize } from '../../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SKY = '#7EC8F7';
const SKY_DARK = '#55B5F0';
const TEXT = '#050505';
const MUTED = '#777777';
const DANGER = '#D95E5E';

export const BOTTOM_SHEET_HEIGHT = Math.min(Math.max(SCREEN_HEIGHT * 0.27, 248), 268);
const COLLAPSED_SHEET_HEIGHT = 92;
const SHEET_EXPANDABLE_HEIGHT = BOTTOM_SHEET_HEIGHT - COLLAPSED_SHEET_HEIGHT;
const SHEET_COLLAPSE_DRAG_THRESHOLD = 28;
const CARD_WIDTH = Math.min(288, Math.max(248, SCREEN_WIDTH * 0.6));
const CARD_GAP = 12;
const CARD_SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

export type NearbyReportCard = {
  id: string;
  keyword: string;
  title: string;
  riskScore: number;
  createdAt: string;
};

export type NearbyReportsSheetHandle = {
  collapse: () => void;
  expand: () => void;
  toggle: () => void;
};

type NearbyReportsSheetProps = {
  addressLabel: string;
  error: string | null;
  isLoading: boolean;
  isLoadingLocation: boolean;
  onActiveReportChange?: (reportId: string) => void;
  onCurrentLocationPress: () => void;
  onRefresh: () => void;
  onReportPress: (reportId: string) => void;
  reports: NearbyReportCard[];
};

function NearbyRefreshIcon({ size = 30, color = '#202630' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M19 12.3a7 7 0 1 1-2.05-4.95L19 9.4"
        fill="none"
        stroke={color}
        strokeWidth={2.45}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M19 4.8v4.6h-4.6"
        fill="none"
        stroke={color}
        strokeWidth={2.45}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function formatTimeAgo(createdAt: string) {
  const normalized = createdAt.includes('T') ? createdAt : createdAt.replace(' ', 'T');
  const time = new Date(normalized).getTime();
  if (Number.isNaN(time)) {
    return '';
  }

  const diffMinutes = Math.max(Math.floor((Date.now() - time) / 60_000), 0);
  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}일 전`;
}

const CarouselPageBar = memo(function CarouselPageBar({
  count,
  scrollX,
  snapInterval,
}: {
  count: number;
  scrollX: number;
  snapInterval: number;
}) {
  const segmentWidth = 100 / count;
  const maxScroll = Math.max((count - 1) * snapInterval, 1);
  const travelWidth = 100 - segmentWidth;
  const left = count <= 1 ? 0 : (scrollX / maxScroll) * travelWidth;

  return (
    <View style={styles.pageBarTrack}>
      <View
        style={[
          styles.pageBarFill,
          {
            width: `${segmentWidth}%`,
            left: `${left}%`,
          },
        ]}
      />
    </View>
  );
});

const ReportCard = memo(function ReportCard({
  item,
  onPress,
}: {
  item: NearbyReportCard;
  onPress: (reportId: string) => void;
}) {
  return (
    <Pressable style={styles.reportCard} onPress={() => onPress(item.id)}>
      <Text style={styles.cardKeyword} numberOfLines={1}>
        {item.keyword}
      </Text>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <View style={styles.cardMetaRow}>
        <Text style={styles.riskText}>위험지수 {Number(item.riskScore).toFixed(1)}</Text>
        <Text style={styles.metaDivider}>|</Text>
        <Text style={styles.timeText}>{formatTimeAgo(item.createdAt)}</Text>
      </View>
    </Pressable>
  );
});

function NearbyReportsSheetComponent(
  {
    addressLabel,
    error,
    isLoading,
    isLoadingLocation,
    onActiveReportChange,
    onCurrentLocationPress,
    onRefresh,
    onReportPress,
    reports,
  }: NearbyReportsSheetProps,
  ref: ForwardedRef<NearbyReportsSheetHandle>
) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [carouselScrollX, setCarouselScrollX] = useState(0);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const dragStart = useRef(0);
  const isExpandedRef = useRef(false);
  const lastActiveIndexRef = useRef(0);

  useEffect(() => {
    lastActiveIndexRef.current = 0;
    setCarouselScrollX(0);
  }, [reports]);

  const updateActiveIndex = useCallback(
    (offsetX: number) => {
      if (reports.length === 0) {
        return;
      }

      const index = Math.min(
        reports.length - 1,
        Math.max(0, Math.round(offsetX / CARD_SNAP_INTERVAL))
      );

      if (!onActiveReportChange || index === lastActiveIndexRef.current) {
        return;
      }

      lastActiveIndexRef.current = index;
      onActiveReportChange(reports[index].id);
    },
    [onActiveReportChange, reports]
  );

  const handleCarouselScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      setCarouselScrollX(offsetX);
      updateActiveIndex(offsetX);
    },
    [updateActiveIndex]
  );

  const handleCarouselScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      updateActiveIndex(event.nativeEvent.contentOffset.x);
    },
    [updateActiveIndex]
  );

  const setExpanded = useCallback(
    (expanded: boolean) => {
      isExpandedRef.current = expanded;
      setIsExpanded(expanded);
      Animated.spring(expandAnim, {
        toValue: expanded ? 1 : 0,
        useNativeDriver: false,
        tension: 90,
        friction: 14,
      }).start();
    },
    [expandAnim]
  );

  useImperativeHandle(
    ref,
    () => ({
      expand: () => setExpanded(true),
      collapse: () => setExpanded(false),
      toggle: () => setExpanded(!isExpandedRef.current),
    }),
    [setExpanded]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        expandAnim.stopAnimation((value) => {
          dragStart.current = value;
        });
      },
      onPanResponderMove: (_, gesture) => {
        const next = Math.min(
          1,
          Math.max(0, dragStart.current - gesture.dy / SHEET_EXPANDABLE_HEIGHT)
        );
        expandAnim.setValue(next);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.vy > 0.35 || gesture.dy > SHEET_COLLAPSE_DRAG_THRESHOLD) {
          setExpanded(false);
          return;
        }
        if (gesture.vy < -0.35 || gesture.dy < -SHEET_COLLAPSE_DRAG_THRESHOLD) {
          setExpanded(true);
          return;
        }
        expandAnim.stopAnimation((value) => {
          setExpanded(value >= 0.5);
        });
      },
    })
  ).current;

  const listHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SHEET_EXPANDABLE_HEIGHT],
  });
  const listOpacity = expandAnim.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0, 1],
  });
  const fabBottom = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLLAPSED_SHEET_HEIGHT + 28, BOTTOM_SHEET_HEIGHT + 28],
  });

  return (
    <>
      <Animated.View style={[styles.fabWrap, { bottom: fabBottom }]} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={onCurrentLocationPress}
          disabled={isLoadingLocation}
          accessibilityRole="button"
          accessibilityLabel="현재 위치로 이동"
        >
          {isLoadingLocation ? (
            <ActivityIndicator size="small" color={SKY_DARK} />
          ) : (
            <Icon name="location" size={25} color={SKY_DARK} strokeWidth={2.4} />
          )}
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.bottomSheet}>
        <View style={styles.sheetDragZone} {...panResponder.panHandlers}>
          <Pressable
            style={styles.handleTouch}
            onPress={() => setExpanded(!isExpandedRef.current)}
            accessibilityRole="button"
            accessibilityLabel={isExpanded ? '주변 제보 모달 접기' : '주변 제보 모달 펼치기'}
          >
            <View style={styles.handle} />
          </Pressable>

          <View style={styles.sheetTitleRow}>
            <Text style={styles.sheetTitle} numberOfLines={1}>
              내 주변 제보 <Text style={styles.sheetCount}>{reports.length}건</Text>
            </Text>
            <View style={styles.sheetTitleActions}>
              <View style={styles.addressPill}>
                <Text style={styles.addressText} numberOfLines={1}>
                  {addressLabel}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={onRefresh}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="주변 제보 새로고침"
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#AFAFAF" />
                ) : (
                  <NearbyRefreshIcon size={26} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Animated.View
          style={[styles.sheetListWrap, { height: listHeight, opacity: listOpacity }]}
          pointerEvents={isExpanded ? 'auto' : 'none'}
        >
          {reports.length > 0 ? (
            <View style={styles.carouselWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.reportListScroller}
                contentContainerStyle={styles.reportList}
                nestedScrollEnabled
                decelerationRate="fast"
                snapToInterval={CARD_SNAP_INTERVAL}
                snapToAlignment="start"
                disableIntervalMomentum
                scrollEventThrottle={16}
                onScroll={handleCarouselScroll}
                onMomentumScrollEnd={handleCarouselScrollEnd}
                onScrollEndDrag={handleCarouselScrollEnd}
              >
                {reports.map((item) => (
                  <ReportCard key={item.id} item={item} onPress={onReportPress} />
                ))}
              </ScrollView>
              {reports.length > 1 ? (
                <CarouselPageBar
                  count={reports.length}
                  scrollX={carouselScrollX}
                  snapInterval={CARD_SNAP_INTERVAL}
                />
              ) : null}
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                {error ? '주변 제보를 불러오지 못했어요.' : '주변 제보가 없습니다.'}
              </Text>
            </View>
          )}
        </Animated.View>
      </View>
    </>
  );
}

export const NearbyReportsSheet = memo(forwardRef(NearbyReportsSheetComponent));

const styles = StyleSheet.create({
  fabWrap: {
    position: 'absolute',
    right: 30,
    zIndex: 11,
  },
  currentLocationButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 18,
    zIndex: 10,
  },
  sheetDragZone: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  sheetListWrap: {
    overflow: 'hidden',
  },
  handleTouch: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  handle: {
    width: 56,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#B8B8B8',
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    flex: 1,
    flexShrink: 1,
    fontFamily: fonts.black,
    fontSize: 25,
    lineHeight: 30,
    color: TEXT,
  },
  sheetTitleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 2,
  },
  sheetCount: {
    fontFamily: fonts.black,
    color: SKY,
  },
  refreshButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressPill: {
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: 118,
  },
  addressText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: TEXT,
  },
  reportListScroller: {
    marginHorizontal: -24,
  },
  carouselWrap: {
    flex: 1,
  },
  pageBarTrack: {
    marginTop: 8,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#D8D8D8',
    overflow: 'hidden',
  },
  pageBarFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: SKY_DARK,
  },
  reportList: {
    gap: CARD_GAP,
    paddingTop: 8,
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 0,
  },
  reportCard: {
    width: CARD_WIDTH,
    height: 132,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#F1F1F1',
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 15,
  },
  cardKeyword: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xs,
    lineHeight: 16,
    color: SKY,
    marginBottom: 3,
  },
  cardTitle: {
    fontFamily: fonts.black,
    fontSize: fontSize.base,
    lineHeight: 21,
    color: TEXT,
    fontWeight: '900',
    textShadowColor: TEXT,
    textShadowOffset: { width: 0.5, height: 0 },
    textShadowRadius: 0,
  },
  cardMetaRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: DANGER,
  },
  metaDivider: {
    marginHorizontal: 10,
    fontSize: fontSize.sm,
    color: '#C8C8C8',
  },
  timeText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: TEXT,
  },
  emptyBox: {
    marginTop: 16,
    height: 100,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.mdLg,
    color: MUTED,
  },
});
