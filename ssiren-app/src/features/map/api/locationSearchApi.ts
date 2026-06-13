import { apiClient } from '../../../lib/api/client';
import type { ApiResponse } from '../../../lib/api/types';
import type { KakaoPlaceSearchOptions, KakaoPlaceSearchResult } from '../../../components/map/KakaoMapView';

type LocationSearchResponse = {
  places: KakaoPlaceSearchResult[];
};

export async function searchLocations(
  query: string,
  options?: KakaoPlaceSearchOptions
): Promise<KakaoPlaceSearchResult[]> {
  const response = await apiClient.get<ApiResponse<LocationSearchResponse>>('/api/v1/maps/search', {
    params: {
      query,
      ...(options?.latitude != null ? { latitude: options.latitude } : {}),
      ...(options?.longitude != null ? { longitude: options.longitude } : {}),
      ...(options?.radiusMeters != null ? { radiusMeters: options.radiusMeters } : {}),
    },
  });

  return response.data.data.places;
}
