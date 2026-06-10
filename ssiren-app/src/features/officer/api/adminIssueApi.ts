import { apiClient } from '../../../lib/api/client';
import type { ApiResponse } from '../../../lib/api/types';
import type {
  AdminIssueDetail,
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
