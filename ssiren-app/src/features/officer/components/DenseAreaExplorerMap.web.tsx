import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { colors, fonts, radius } from '../../../theme';
import type { AdminDashboardDenseAreaItem } from '../types/adminDashboard';
import {
  denseAreaThumbnailProjection,
  getDenseAreaColors,
  type DenseAreaIssueGroupMarker,
} from '../utils/officerDenseArea';

type DenseAreaExplorerMapProps = {
  denseAreas: AdminDashboardDenseAreaItem[];
  selectedIndex: number;
  maxCount: number;
  issueGroups?: DenseAreaIssueGroupMarker[];
  userLocation?: { latitude: number; longitude: number } | null;
  size: number;
};

export function DenseAreaExplorerMap({
  denseAreas,
  selectedIndex,
  maxCount,
  issueGroups = [],
  userLocation = null,
  size,
}: DenseAreaExplorerMapProps) {
  const selectedArea = denseAreas[selectedIndex] ?? denseAreas[0];
  if (!selectedArea) {
    return null;
  }

  const { fill, stroke } = getDenseAreaColors(selectedArea.issueGroupCount, maxCount);
  const { circle, user, project } = denseAreaThumbnailProjection(selectedArea, userLocation, size);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={circle.cx} cy={circle.cy} r={circle.r} fill={fill} stroke={stroke} strokeWidth={2} />
        {issueGroups.map((issueGroup) => {
          const point = project(issueGroup.latitude, issueGroup.longitude);
          return (
            <Circle
              key={issueGroup.id}
              cx={point.x}
              cy={point.y}
              r={11}
              fill={colors.brand}
              stroke={colors.white}
              strokeWidth={2}
            />
          );
        })}
        {issueGroups.map((issueGroup) => {
          const point = project(issueGroup.latitude, issueGroup.longitude);
          const label = issueGroup.reportCount > 99 ? '99+' : String(issueGroup.reportCount);
          return (
            <SvgText
              key={`label-${issueGroup.id}`}
              x={point.x}
              y={point.y + 4}
              fill={colors.white}
              fontSize={9}
              fontFamily={fonts.bold}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
        {user ? <Circle cx={user.x} cy={user.y} r={4} fill={colors.brand} stroke={colors.white} strokeWidth={1.5} /> : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.soft2,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
});
