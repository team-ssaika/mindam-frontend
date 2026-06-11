import { Circle } from 'react-native-maps';
import type { AdminDashboardDenseAreaItem } from '../types/adminDashboard';
import {
  denseAreaCenter,
  denseAreaKey,
  denseAreaRadiusMeters,
  getDenseAreaColors,
  getMaxDenseAreaCount,
} from '../utils/officerDenseArea';

type OfficerDenseAreaOverlayProps = {
  denseAreas: AdminDashboardDenseAreaItem[];
};

export function OfficerDenseAreaOverlay({ denseAreas }: OfficerDenseAreaOverlayProps) {
  const maxCount = getMaxDenseAreaCount(denseAreas);

  return (
    <>
      {denseAreas.map((area, index) => {
        const { fill, stroke } = getDenseAreaColors(area.issueGroupCount, maxCount);
        return (
          <Circle
            key={denseAreaKey(area, index)}
            center={denseAreaCenter(area)}
            radius={denseAreaRadiusMeters(area)}
            fillColor={fill}
            strokeColor={stroke}
            strokeWidth={1.5}
          />
        );
      })}
    </>
  );
}
