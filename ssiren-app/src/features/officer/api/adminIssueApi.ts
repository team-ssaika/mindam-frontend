import { apiClient } from '../../../lib/api/client';
import type { ApiResponse } from '../../../lib/api/types';
import type {
  AdminIssueDetail,
  AdminIssueStatusUpdateRequest,
  AdminIssueStatusUpdateResponse,
  AdminIssueTransferRequestCreateBody,
  AdminIssueTransferRequestResponse,
  AdminIssuesQuery,
  AdminIssuesResponse,
} from '../types/adminIssue';

export async function fetchAdminIssues(params?: AdminIssuesQuery) {
  const response = await apiClient.get<ApiResponse<AdminIssuesResponse>>('/api/v1/admin/issues', {
    params,
  });

  return response.data.data;
}

export async function fetchAdminIssueDetail(issueGroupId: number) {
  const response = await apiClient.get<ApiResponse<AdminIssueDetail>>(
    `/api/v1/admin/issues/${issueGroupId}`
  );

  return response.data.data;
}

export async function updateAdminIssueStatus(
  issueGroupId: number,
  body: AdminIssueStatusUpdateRequest
) {
  const response = await apiClient.patch<ApiResponse<AdminIssueStatusUpdateResponse>>(
    `/api/v1/admin/issues/${issueGroupId}/status`,
    body
  );

  return response.data.data;
}

export async function createAdminIssueGroupTransferRequest(
  issueGroupId: number,
  body: AdminIssueTransferRequestCreateBody
) {
  const response = await apiClient.post<ApiResponse<AdminIssueTransferRequestResponse>>(
    `/api/v1/admin/issues/${issueGroupId}/transfer-requests`,
    body
  );

  return response.data.data;
}
