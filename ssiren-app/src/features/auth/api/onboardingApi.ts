import { apiClient } from '../../../lib/api/client';
import type { ApiResponse } from '../../../lib/api/types';

type ListResponse<T> = {
  count: number;
  contents: T[];
};

export type AgencyType = {
  id: number;
  name: string;
};

export type Department = {
  id: number;
  name: string;
  agencyTypeId: number;
  agencyTypeName: string;
};

export async function fetchAgencyTypes() {
  const response = await apiClient.get<ApiResponse<ListResponse<AgencyType>>>('/api/v1/agencies');
  return response.data.data.contents;
}

export async function fetchDepartments(agencyTypeId: number) {
  const response = await apiClient.get<ApiResponse<ListResponse<Department>>>('/api/v1/departments', {
    params: { agencyTypeId },
  });
  return response.data.data.contents;
}
