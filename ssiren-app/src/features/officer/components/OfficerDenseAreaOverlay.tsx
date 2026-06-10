import { Polygon } from 'react-native-maps';
import type { AdminDashboardDenseAreaItem } from '../types/adminDashboard';
import {
  denseAreaKey,
  denseAreaPolygonCoordinates,
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
          <Polygon
            key={denseAreaKey(area, index)}
            coordinates={denseAreaPolygonCoordinates(area)}
            fillColor={fill}
            strokeColor={stroke}
            strokeWidth={1.5}
          />
        );
      })}
    </>
  );
}
