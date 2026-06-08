import { apiClient } from '../../../lib/api/client';
import type { ApiResponse, PageResponse } from '../../../lib/api/types';
import type { MyReportItem, MyReportsQuery } from '../types/myReport';

export async function fetchMyReports(params?: MyReportsQuery) {
  const response = await apiClient.get<ApiResponse<PageResponse<MyReportItem>>>(
    '/api/v1/reports/me',
    { params }
  );

  return response.data.data;
}
