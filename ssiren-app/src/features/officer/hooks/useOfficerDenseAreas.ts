import { useCallback, useEffect, useState } from 'react';
import { fetchAdminDashboardDenseAreas } from '../api/adminDashboardApi';
import type { AdminDashboardDenseAreaItem } from '../types/adminDashboard';
import { DENSE_AREA_DEFAULTS } from '../utils/officerDenseArea';

type UseOfficerDenseAreasOptions = {
  latitude: number | null;
  longitude: number | null;
  radiusMeters?: number;
  gridSizeMeters?: number;
  minIssueGroupCount?: number;
  myDepartmentOnly?: boolean;
  enabled?: boolean;
};

export function useOfficerDenseAreas({
  latitude,
  longitude,
  radiusMeters = DENSE_AREA_DEFAULTS.radiusMeters,
  gridSizeMeters = DENSE_AREA_DEFAULTS.gridSizeMeters,
  minIssueGroupCount = DENSE_AREA_DEFAULTS.minIssueGroupCount,
  myDepartmentOnly = true,
  enabled = true,
}: UseOfficerDenseAreasOptions) {
  const [denseAreas, setDenseAreas] = useState<AdminDashboardDenseAreaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled || latitude == null || longitude == null) {
      setDenseAreas([]);
      setErrorMessage(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await fetchAdminDashboardDenseAreas({
        latitude,
        longitude,
        radiusMeters,
        gridSizeMeters,
        minIssueGroupCount,
        myDepartmentOnly,
      });
      setDenseAreas(Array.isArray(data.denseAreas) ? data.denseAreas : []);
    } catch (error) {
      console.log('[OfficerDenseArea] fetch error', error);
      setDenseAreas([]);
      setErrorMessage('밀집 구역을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [
    enabled,
    latitude,
    longitude,
    radiusMeters,
    gridSizeMeters,
    minIssueGroupCount,
    myDepartmentOnly,
  ]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { denseAreas, isLoading, errorMessage, reload };
}
