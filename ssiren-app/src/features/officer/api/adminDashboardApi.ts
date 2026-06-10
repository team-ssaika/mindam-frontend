import { apiClient } from '../../../lib/api/client';
import type { ApiResponse } from '../../../lib/api/types';
import type {
  AdminDashboardCategoryStatistics,
  AdminDashboardDenseAreaQuery,
  AdminDashboardDenseAreaStatistics,
  AdminDashboardStatistics,
  AdminDashboardStatisticsQuery,
} from '../types/adminDashboard';

export async function fetchAdminDashboardStatistics(params?: AdminDashboardStatisticsQuery) {
  const response = await apiClient.get<ApiResponse<AdminDashboardStatistics>>(
    '/api/v1/admin/dashboard/statistics',
    { params }
  );

  return response.data.data;
}

export async function fetchAdminDashboardCategories(params?: AdminDashboardStatisticsQuery) {
  const response = await apiClient.get<ApiResponse<AdminDashboardCategoryStatistics>>(
    '/api/v1/admin/dashboard/categories',
    { params }
  );

  return response.data.data;
}

export async function fetchAdminDashboardDenseAreas(params: AdminDashboardDenseAreaQuery) {
  const response = await apiClient.get<ApiResponse<AdminDashboardDenseAreaStatistics>>(
    '/api/v1/admin/dashboard/dense-area',
    { params }
  );

  return response.data.data;
}
