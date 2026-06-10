import { StyleSheet, Text, View } from 'react-native';
import { getReportCountMarkerTier } from '../../report/components/ReportMapMarker';
import { colors, fonts } from '../../../theme';

const BADGE_SIZE_BY_TIER = {
  1: { minSize: 26, fontSize: 11, paddingH: 6 },
  2: { minSize: 30, fontSize: 12, paddingH: 7 },
  3: { minSize: 34, fontSize: 13, paddingH: 8 },
  4: { minSize: 38, fontSize: 14, paddingH: 9 },
  5: { minSize: 42, fontSize: 15, paddingH: 10 },
} as const;

type OfficerIssueMapMarkerProps = {
  reportCount?: number;
};

export function OfficerIssueMapMarker({ reportCount = 1 }: OfficerIssueMapMarkerProps) {
  const count = Number.isFinite(reportCount) ? Math.max(1, Math.floor(reportCount)) : 1;
  const tier = getReportCountMarkerTier(count);
  const { minSize, fontSize, paddingH } = BADGE_SIZE_BY_TIER[tier];
  const label = count > 99 ? '99+' : String(count);

  return (
    <View
      style={[
        styles.badge,
        {
          minWidth: minSize,
          minHeight: minSize,
          paddingHorizontal: paddingH,
          borderRadius: minSize / 2,
        },
      ]}
    >
      <Text style={[styles.label, { fontSize }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.brand,
    borderWidth: 2.5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  label: {
    fontFamily: fonts.bold,
    color: colors.white,
    lineHeight: 16,
    textAlign: 'center',
  },
});
