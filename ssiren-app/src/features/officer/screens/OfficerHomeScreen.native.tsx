import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { AppText, Icon } from '../../../components/ui';
import { colors, fonts, radius, shadow, statusColors } from '../../../theme';
import { useTabBarMetrics } from '../../../hooks/useTabBarMetrics';
import { fetchPublicReports } from '../../report/api/reportApi';
import { ReportMapMarker } from '../../report/components/ReportMapMarker';
import type { PublicReportItem } from '../../report/types/publicReport';
import { hasValidReportCoordinate } from '../../report/utils/publicReportMap';
import { officerProfile, officerSummary } from '../mocks/officerMock';

const CITY_HALL = { latitude: 37.5665, longitude: 126.978 };
const DEFAULT_DELTA = { latitudeDelta: 0.02, longitudeDelta: 0.02 };

export default function OfficerHomeScreen() {
  const router = useRouter();
  const { contentOffset: tabBarOffset } = useTabBarMetrics();
  const mapRef = useRef<MapView | null>(null);
  const [resolving, setResolving] = useState(false);
  const [region, setRegion] = useState<Region>({ ...CITY_HALL, ...DEFAULT_DELTA });
  const [reports, setReports] = useState<PublicReportItem[]>([]);

  const moveToCurrentLocation = async () => {
    try {
      setResolving(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next: Region = { latitude: coords.latitude, longitude: coords.longitude, ...DEFAULT_DELTA };
      setRegion(next);
      mapRef.current?.animateToRegion(next, 600);
    } catch {
      // ignore
    } finally {
      setResolving(false);
    }
  };

  useEffect(() => {
    moveToCurrentLocation();
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchPublicReports({ page: 0, size: 50, sort: 'createdAt,desc' })
      .then((data) => {
        if (!mounted) return;
        setReports(Array.isArray(data.contents) ? data.contents.filter(hasValidReportCoordinate) : []);
      })
      .catch(() => mounted && setReports([]));
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={(ref) => {
          mapRef.current = ref;
        }}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {reports.map((item) => (
          <Marker
            key={item.report.id}
            coordinate={{ latitude: item.report.latitude, longitude: item.report.longitude }}
          >
            <ReportMapMarker />
          </Marker>
        ))}
      </MapView>

      <SafeAreaView edges={['top']} style={styles.topSafe} pointerEvents="box-none">
        <View style={styles.topBar} pointerEvents="box-none">
          <View style={styles.logoCard}>
            <View style={styles.logoMark}>
              <Icon name="marker" size={15} color={colors.white} fill />
            </View>
            <AppText variant="heading" color={colors.ink}>시민제보</AppText>
            <View style={styles.roleBadge}>
              <AppText style={styles.roleBadgeText}>담당자</AppText>
            </View>
          </View>
          <Pressable style={styles.bellButton} accessibilityLabel="알림">
            <Icon name="bell" size={22} color={colors.ink} />
            <View style={styles.bellCount}>
              <AppText style={styles.bellCountText}>5</AppText>
            </View>
          </Pressable>
        </View>

        <View style={styles.chipRow} pointerEvents="box-none">
          <View style={styles.jurisChip}>
            <Icon name="building" size={16} color={colors.brand} />
            <AppText style={styles.jurisText}>{officerProfile.jurisdiction}</AppText>
          </View>
        </View>
      </SafeAreaView>

      {/* controls */}
      <View style={[styles.fabColumn, { bottom: tabBarOffset + 150 }]} pointerEvents="box-none">
        <View style={styles.fab}>
          <Icon name="filter" size={21} color={colors.ink} />
        </View>
        <TouchableOpacity style={[styles.fab, styles.fabPrimary]} onPress={moveToCurrentLocation} disabled={resolving}>
          {resolving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Icon name="location" size={22} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>

      {/* peek summary */}
      <View style={[styles.peek, { paddingBottom: 16 }]} pointerEvents="box-none">
        <View style={styles.peekHandle} />
        <Pressable style={styles.peekRow} onPress={() => router.push('/(officer)/inbox')}>
          <View>
            <AppText variant="section" color={colors.ink}>내 관할 제보 {officerSummary.total}건</AppText>
            <View style={styles.countsRow}>
              <Count tone="wait" label="대기" n={officerSummary.wait} />
              <Count tone="prog" label="처리중" n={officerSummary.prog} />
              <Count tone="done" label="완료" n={officerSummary.done} />
            </View>
          </View>
          <View style={styles.inboxLink}>
            <AppText style={styles.inboxLinkText}>제보함</AppText>
            <Icon name="chevR" size={16} color={colors.brand} />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function Count({ tone, label, n }: { tone: 'wait' | 'prog' | 'done'; label: string; n: number }) {
  return (
    <AppText style={[styles.count, { color: statusColors[tone].dot }]}>● {label} {n}</AppText>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  map: { flex: 1 },

  topSafe: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  logoCard: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.canvas,
    borderRadius: 14,
    paddingHorizontal: 14,
    ...shadow.float,
  },
  logoMark: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadge: { backgroundColor: colors.brandSoft, borderRadius: 6, paddingVertical: 2, paddingHorizontal: 7 },
  roleBadgeText: { fontFamily: fonts.bold, fontSize: 11, color: colors.brand },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.float,
  },
  bellCount: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.canvas,
  },
  bellCountText: { fontFamily: fonts.bold, fontSize: 10, color: colors.white },

  chipRow: { paddingHorizontal: 16, paddingTop: 12 },
  jurisChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.canvas,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
    ...shadow.float,
  },
  jurisText: { fontFamily: fonts.bold, fontSize: 13, color: colors.ink },

  fabColumn: { position: 'absolute', right: 16, gap: 10 },
  fab: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.float,
  },
  fabPrimary: { backgroundColor: colors.brand, borderWidth: 0 },

  peek: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.canvas,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    ...shadow.sheet,
  },
  peekHandle: { width: 38, height: 5, borderRadius: 3, backgroundColor: '#d8dbe1', alignSelf: 'center', marginBottom: 12 },
  peekRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  countsRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  count: { fontFamily: fonts.semibold, fontSize: 12.5 },
  inboxLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inboxLinkText: { fontFamily: fonts.bold, fontSize: 13.5, color: colors.brand },
});
