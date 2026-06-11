import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, radius } from '../../../theme';
import type { AdminDashboardDenseAreaItem } from '../types/adminDashboard';
import {
  denseAreaThumbnailProjection,
  getDenseAreaColors,
} from '../utils/officerDenseArea';

type DenseAreaMiniMapProps = {
  area: AdminDashboardDenseAreaItem;
  maxCount: number;
  userLocation?: { latitude: number; longitude: number } | null;
  size?: number;
};

export function DenseAreaMiniMap({
  area,
  maxCount,
  userLocation = null,
  size = 76,
}: DenseAreaMiniMapProps) {
  const { fill, stroke } = getDenseAreaColors(area.issueGroupCount, maxCount);
  const { circle, user } = denseAreaThumbnailProjection(area, userLocation, size);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={circle.cx} cy={circle.cy} r={circle.r} fill={fill} stroke={stroke} strokeWidth={2} />
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
