import { apiClient } from '../../../lib/api/client';
import type { ApiResponse, PageResponse } from '../../../lib/api/types';
import type { MyReportDetail } from '../types/myReportDetail';
import type { MyReportItem, MyReportsQuery } from '../types/myReport';

export async function fetchMyReports(params?: MyReportsQuery) {
  const response = await apiClient.get<ApiResponse<PageResponse<MyReportItem>>>(
    '/api/v1/reports/me',
    { params }
  );

  return response.data.data;
}

export async function fetchMyReportDetail(reportId: number) {
  const response = await apiClient.get<ApiResponse<MyReportDetail>>(
    `/api/v1/reports/me/${reportId}`
  );

  return response.data.data;
}
