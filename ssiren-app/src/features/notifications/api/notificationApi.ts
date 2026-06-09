import { apiClient } from '../../../lib/api/client';
import type { ApiResponse } from '../../../lib/api/types';

export type FcmTokenResponse = {
  id: number;
  fcmToken: string;
  isActive: boolean;
  createdAt: string;
};

export async function registerFcmToken(fcmToken: string) {
  const response = await apiClient.post<ApiResponse<FcmTokenResponse>>(
    '/api/v1/notifications/tokens',
    { fcmToken }
  );

  return response.data.data;
}

export async function deactivateFcmToken(fcmToken: string) {
  await apiClient.delete<ApiResponse<null>>('/api/v1/notifications/tokens', {
    data: { fcmToken },
  });
}
