import { apiClient } from '../../../lib/api/client';
import type { ApiResponse, PageResponse } from '../../../lib/api/types';
import type { MyReportDetail } from '../types/myReportDetail';
import type { MyReportItem, MyReportsQuery } from '../types/myReport';
import type { MyReportDeleteResponse } from '../types/myReportDelete';
import type { MyReportUpdateRequest, MyReportUpdateResponse } from '../types/myReportUpdate';

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

export async function updateMyReport(reportId: number, body: MyReportUpdateRequest) {
  const response = await apiClient.patch<ApiResponse<MyReportUpdateResponse>>(
    `/api/v1/reports/me/${reportId}`,
    body
  );

  return response.data.data;
}

export async function deleteMyReport(reportId: number) {
  const response = await apiClient.delete<ApiResponse<MyReportDeleteResponse>>(
    `/api/v1/reports/me/${reportId}`
  );

  return response.data.data;
}
