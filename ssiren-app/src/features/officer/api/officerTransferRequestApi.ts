import { apiClient } from '../../../lib/api/client';
import type { ApiResponse } from '../../../lib/api/types';
import {
  mapIncomingTransferRequests,
  mapSentTransferRequests,
  type OfficerIncomingTransferRequestsResponse,
  type OfficerSentTransferRequestsQuery,
  type OfficerSentTransferRequestsResponse,
  type OfficerTransferRequestDto,
  type OfficerTransferRequestResponseBody,
} from '../types/officerTransferRequest';

export async function fetchReceivedTransferRequests() {
  const response = await apiClient.get<ApiResponse<OfficerIncomingTransferRequestsResponse>>(
    '/api/v1/admin/issues/transfer-requests'
  );

  return mapIncomingTransferRequests(response.data.data ?? {});
}

export async function fetchSentTransferRequests(params?: OfficerSentTransferRequestsQuery) {
  const response = await apiClient.get<ApiResponse<OfficerSentTransferRequestsResponse>>(
    '/api/v1/admin/issues/transfer-requests/sent',
    { params }
  );

  return mapSentTransferRequests(response.data.data ?? {});
}

export async function respondTransferRequest(
  transferId: number,
  body: OfficerTransferRequestResponseBody
) {
  const response = await apiClient.patch<ApiResponse<OfficerTransferRequestDto>>(
    `/api/v1/admin/issues/transfer-requests/${transferId}`,
    body
  );

  return response.data.data;
}
