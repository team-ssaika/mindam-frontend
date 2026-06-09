import { apiClient } from '../../../lib/api/client';
import type { ApiResponse } from '../../../lib/api/types';
import type { IssueDetail, IssuesQuery, IssuesResponse } from '../types/issue';

export async function fetchIssues(params?: IssuesQuery) {
  const response = await apiClient.get<ApiResponse<IssuesResponse>>('/api/v1/issues', {
    params,
  });

  return response.data.data;
}

export async function fetchIssueDetail(issueGroupId: number) {
  const response = await apiClient.get<ApiResponse<IssueDetail>>(
    `/api/v1/issues/${issueGroupId}`
  );

  return response.data.data;
}
