import { apiClient } from '../../../lib/api/client';
import type { ApiResponse } from '../../../lib/api/types';

export type UserMe = {
  id: number;
  email: string;
  nickname: string;
  role: 'CITIZEN' | 'OFFICER' | 'ADMIN' | string;
  isActive: boolean;
  isAlarmEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function fetchMyProfile() {
  const response = await apiClient.get<ApiResponse<UserMe>>('/api/v1/users/me');
  return response.data.data;
}

