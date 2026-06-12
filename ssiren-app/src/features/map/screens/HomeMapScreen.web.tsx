import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Icon } from '../../../components/ui';
import { fonts, fontSize } from '../../../theme';

const ssirenNameLogo = require('../../../assets/SSIREN-name.png');
const ssirenMarkerLogo = require('../../../assets/ssiren-marker-logo.png');

const SKY = '#7EC8F7';
const TEXT = '#050505';
const DANGER = '#D95E5E';

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

const reports = [
  {
    id: 'web-1',
    count: 7,
    keyword: '쓰레기 무단투기',
    title: '역삼동 인근 일반 쓰레기 봉투 무단투기',
    riskScore: 64.5,
    timeAgo: '19분전',
  },
  {
    id: 'web-2',
    count: 13,
    keyword: '쓰레기 무단투기',
    title: '골목길 생활 쓰레기 방치 신고',
    riskScore: 58.0,
    timeAgo: '32분전',
  },
  {
    id: 'web-3',
    count: 22,
    keyword: '도로 파손',
    title: '역삼역 주변 보도블록 파손으로 보행 위험',
    riskScore: 72.0,
    timeAgo: '2시간전',
  },
];

function MapMarker({
  count,
  left,
  top,
}: {
  count: number;
  left: `${number}%`;
  top: `${number}%`;
}) {
  const sizeStyle =
    count === 1 ? styles.markerOne : count >= 10 ? styles.markerLarge : undefined;

  return (
    <View style={[styles.markerWrap, { left, top }]}>
      <View style={[styles.markerShell, sizeStyle]}>
        <View style={styles.markerTailOuter} />
        <View style={styles.markerTailInner} />
        <View style={[styles.markerBubble, sizeStyle]}>
          <Image source={ssirenMarkerLogo} style={styles.markerIcon} resizeMode="contain" />
          <Text style={styles.markerText}>{count}개</Text>
        </View>
      </View>
    </View>
  );
}

export default function HomeMapScreenWeb() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={ssirenNameLogo} style={styles.nameLogo} resizeMode="contain" />
        <Pressable onPress={() => console.log('[HomeWeb] notification press')} style={styles.bellButton}>
          <Icon name="bell" size={26} color={SKY} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View style={styles.mapArea}>
        <View style={styles.searchShadow}>
          <View style={styles.searchBox}>
            <Icon name="search" size={25} color="#6D6D6D" strokeWidth={2.2} />
            <TextInput
              placeholder="지역 · 주소로 제보 찾기"
              placeholderTextColor="#666666"
              style={styles.searchInput}
            />
            <Icon name="mic" size={26} color="#6D6D6D" strokeWidth={2.4} />
          </View>
        </View>

        <View style={styles.mockMap}>
          <View style={[styles.road, styles.roadVertical]} />
          <View style={[styles.road, styles.roadHorizontal]} />
          <View style={styles.waterPatch} />
          <View style={styles.blockA} />
          <View style={styles.blockB} />
          <Text style={styles.mapLabel}>제주지역협력본부</Text>
          <View style={styles.densityCircle} />
          <MapMarker count={7} left="34%" top="38%" />
          <MapMarker count={13} left="18%" top="54%" />
          <MapMarker count={22} left="48%" top="61%" />
          <View style={styles.currentMarker}>
            <View style={styles.currentArrow} />
          </View>
        </View>

        <Pressable
          style={styles.currentLocationButton}
          onPress={() => console.log('[HomeWeb] current location press')}
        >
          <Icon name="location" size={25} color={SKY} strokeWidth={2.4} />
        </Pressable>

        <View style={styles.bottomSheet}>
          <View style={styles.handle} />
          <View style={styles.titleRow}>
            <Text style={styles.sheetTitle}>
              내 주변 제보 <Text style={styles.countText}>3건</Text>
            </Text>
            <Pressable onPress={() => console.log('[HomeWeb] refresh reports')}>
              <NearbyRefreshIcon />
            </Pressable>
          </View>
          <View style={styles.addressPill}>
            <Text style={styles.addressText}>강남구 역삼동</Text>
          </View>

          <ScrollView
            horizontal
            style={styles.cardScroller}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardList}
          >
            {reports.map((report) => (
              <Pressable
                key={report.id}
                style={styles.card}
                onPress={() => console.log('[HomeWeb] report press', report)}
              >
                <Text style={styles.cardKeyword}>{report.keyword}</Text>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {report.title}
                </Text>
                <View style={styles.cardMetaRow}>
                  <Text style={styles.riskText}>위험지수 {report.riskScore.toFixed(1)}</Text>
                  <Text style={styles.metaDivider}>|</Text>
                  <Text style={styles.timeText}>{report.timeAgo}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    height: 60,
    paddingLeft: 28,
    paddingRight: 24,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  nameLogo: {
    width: 102,
    height: 32,
  },
  bellButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapArea: {
    flex: 1,
    backgroundColor: '#E8EEE1',
  },
  searchShadow: {
    position: 'absolute',
    top: 22,
    left: 31,
    right: 31,
    height: 52,
    borderRadius: 15,
    backgroundColor: 'transparent',
    zIndex: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    overflow: 'visible',
  },
  searchBox: {
    height: 52,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 19,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    fontFamily: fonts.semibold,
    fontSize: fontSize.xl,
    color: TEXT,
    paddingHorizontal: 0,
    paddingVertical: 0,
    boxShadow: 'none' as never,
    outlineStyle: 'none' as never,
  },
  mockMap: {
    flex: 1,
    overflow: 'hidden',
  },
  road: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  roadVertical: {
    width: 72,
    top: -20,
    bottom: 0,
    left: '24%',
    transform: [{ rotate: '2deg' }],
  },
  roadHorizontal: {
    height: 62,
    left: -20,
    right: -20,
    top: '28%',
  },
  waterPatch: {
    position: 'absolute',
    left: '32%',
    top: '38%',
    width: '34%',
    height: '28%',
    borderRadius: 90,
    backgroundColor: 'rgba(185, 226, 240, 0.55)',
  },
  blockA: {
    position: 'absolute',
    right: '12%',
    top: '35%',
    width: '28%',
    height: '24%',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 2,
    borderColor: 'rgba(205,205,205,0.5)',
  },
  blockB: {
    position: 'absolute',
    left: '44%',
    top: '50%',
    width: '20%',
    height: '18%',
    backgroundColor: 'rgba(219,238,244,0.62)',
    borderWidth: 2,
    borderColor: 'rgba(180,200,210,0.45)',
  },
  mapLabel: {
    position: 'absolute',
    top: '20%',
    left: '21%',
    fontFamily: fonts.bold,
    fontSize: 34,
    color: 'rgba(0,0,0,0.62)',
  },
  densityCircle: {
    position: 'absolute',
    left: '9%',
    top: '31%',
    width: 245,
    height: 245,
    borderRadius: 123,
    backgroundColor: 'rgba(126,200,247,0.22)',
  },
  markerWrap: {
    position: 'absolute',
    alignItems: 'center',
    overflow: 'visible',
  },
  markerShell: {
    position: 'relative',
    minWidth: 110,
    height: 84,
    alignItems: 'center',
    overflow: 'visible',
  },
  markerBubble: {
    minWidth: 110,
    height: 58,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: '#ffffff',
    backgroundColor: '#9BDCF4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 13,
    paddingRight: 13,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    zIndex: 2,
  },
  markerIcon: {
    width: 36,
    height: 36,
  },
  markerText: {
    fontFamily: fonts.bold,
    fontSize: 23,
    color: TEXT,
  },
  markerOne: {
    minWidth: 88,
  },
  markerLarge: {
    minWidth: 122,
  },
  markerTailOuter: {
    position: 'absolute',
    left: '50%',
    bottom: 0,
    width: 0,
    height: 0,
    marginLeft: -26,
    borderLeftWidth: 26,
    borderRightWidth: 26,
    borderTopWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#ffffff',
    zIndex: 1,
  },
  markerTailInner: {
    position: 'absolute',
    left: '50%',
    bottom: 5,
    width: 0,
    height: 0,
    marginLeft: -21,
    borderLeftWidth: 21,
    borderRightWidth: 21,
    borderTopWidth: 25,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#9BDCF4',
    zIndex: 3,
  },
  currentMarker: {
    position: 'absolute',
    right: '11%',
    top: '61%',
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E23E33',
    borderWidth: 3,
    borderColor: '#ffffff',
    boxShadow: '0 0 0 9px rgba(80,87,98,0.14)' as never,
  },
  currentArrow: {
    position: 'absolute',
    top: -15,
    left: -1,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#E23E33',
    transform: [{ rotate: '-18deg' }],
  },
  currentLocationButton: {
    position: 'absolute',
    right: 30,
    bottom: 336,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 326,
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    overflow: 'hidden',
    zIndex: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  handle: {
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 26,
    width: 56,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#B8B8B8',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 40,
    color: TEXT,
  },
  countText: {
    color: SKY,
  },
  addressPill: {
    alignSelf: 'flex-start',
    marginTop: 22,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderRadius: 999,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addressText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.mdLg,
    color: TEXT,
  },
  cardList: {
    gap: 20,
    paddingTop: 22,
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 20,
  },
  cardScroller: {
    marginHorizontal: -24,
  },
  card: {
    width: 280,
    height: 144,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    paddingHorizontal: 22,
    paddingVertical: 19,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.025,
    shadowRadius: 12,
  },
  cardKeyword: {
    fontFamily: fonts.bold,
    fontSize: fontSize.mdLg,
    lineHeight: 22,
    color: SKY,
    marginBottom: 4,
  },
  cardTitle: {
    fontFamily: fonts.black,
    fontSize: 19,
    lineHeight: 27,
    color: TEXT,
    fontWeight: '900',
    textShadowColor: TEXT,
    textShadowOffset: { width: 0.35, height: 0 },
    textShadowRadius: 0,
  },
  cardMetaRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.base,
    color: DANGER,
  },
  metaDivider: {
    marginHorizontal: 12,
    fontSize: fontSize.base,
    color: '#C8C8C8',
  },
  timeText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.base,
    color: TEXT,
  },
});
