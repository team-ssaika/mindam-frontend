import { apiClient } from '../../../lib/api/client';
import type { ApiResponse, PageResponse } from '../../../lib/api/types';
import type { MyReportDetail } from '../types/myReportDetail';
import type { MyReportItem, MyReportsQuery } from '../types/myReport';
import type { MyReportDeleteResponse } from '../types/myReportDelete';
import type { PublicReportItem, PublicReportsQuery } from '../types/publicReport';
import type { MyReportUpdateRequest, MyReportUpdateResponse } from '../types/myReportUpdate';
import type {
  CreateReportPayload,
  CreateReportResponse,
  ReportDraftRequest,
  ReportDraftResponse,
  ReportImageFile,
} from '../types/reportSubmission';

function inferImageType(uri: string, fallback?: string | null) {
  if (fallback) {
    return fallback;
  }

  const extension = uri.split('?')[0]?.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

function inferImageName(uri: string, index: number, fallback?: string | null) {
  if (fallback) {
    return fallback;
  }

  const rawName = uri.split('?')[0]?.split('/').pop();
  return rawName && rawName.includes('.') ? rawName : `report-image-${index + 1}.jpg`;
}

function appendImages(formData: FormData, images: ReportImageFile[]) {
  images.forEach((image, index) => {
    formData.append('images', {
      uri: image.uri,
      name: inferImageName(image.uri, index, image.name),
      type: inferImageType(image.uri, image.type),
    } as unknown as Blob);
  });
}

function createMultipartHeaders() {
  return {
    'Content-Type': 'multipart/form-data',
  };
}

export async function fetchPublicReports(params?: PublicReportsQuery) {
  const response = await apiClient.get<ApiResponse<PageResponse<PublicReportItem>>>(
    '/api/v1/reports',
    { params }
  );

  return response.data.data;
}

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

export async function createReportDraft(payload: ReportDraftRequest) {
  const formData = new FormData();
  appendImages(formData, payload.images);
  formData.append('content', payload.content);
  formData.append('latitude', String(payload.latitude));
  formData.append('longitude', String(payload.longitude));

  if (payload.occurredAt) {
    formData.append('occurredAt', payload.occurredAt);
  }

  const response = await apiClient.post<ApiResponse<ReportDraftResponse>>(
    '/api/v1/reports/drafts',
    formData,
    { headers: createMultipartHeaders() }
  );

  return response.data.data;
}

export async function createReport(payload: CreateReportPayload) {
  const formData = new FormData();
  appendImages(formData, payload.images);
  formData.append('request', JSON.stringify(payload.request));

  const response = await apiClient.post<ApiResponse<CreateReportResponse>>(
    '/api/v1/reports',
    formData,
    { headers: createMultipartHeaders() }
  );

  return response.data.data;
}
