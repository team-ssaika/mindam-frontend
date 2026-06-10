import { StyleSheet, View } from 'react-native';
import { colors } from '../../../theme';

export type ReportMapMarkerTier = 1 | 2 | 3 | 4 | 5;

const MARKER_SIZE_BY_TIER: Record<
  ReportMapMarkerTier,
  { pin: number; dot: number; border: number }
> = {
  1: { pin: 16, dot: 4, border: 2 },
  2: { pin: 22, dot: 5, border: 2.5 },
  3: { pin: 28, dot: 6, border: 2.5 },
  4: { pin: 34, dot: 7, border: 3 },
  5: { pin: 40, dot: 8, border: 3 },
};

/** reportCount: 1+ / 5+ / 10+ / 15+ / 20+ */
export function getReportCountMarkerTier(reportCount: number): ReportMapMarkerTier {
  const count = Number.isFinite(reportCount) ? Math.max(1, Math.floor(reportCount)) : 1;
  if (count >= 20) return 5;
  if (count >= 15) return 4;
  if (count >= 10) return 3;
  if (count >= 5) return 2;
  return 1;
}

type ReportMapMarkerProps = {
  reportCount?: number;
};

export function ReportMapMarker({ reportCount = 1 }: ReportMapMarkerProps) {
  const tier = getReportCountMarkerTier(reportCount);
  const { pin, dot, border } = MARKER_SIZE_BY_TIER[tier];

  return (
    <View
      style={[
        styles.pin,
        {
          width: pin,
          height: pin,
          borderRadius: pin / 2,
          borderWidth: border,
        },
      ]}
    >
      <View
        style={{
          width: dot,
          height: dot,
          borderRadius: dot / 2,
          backgroundColor: colors.white,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  pin: {
    backgroundColor: colors.coral,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
});
