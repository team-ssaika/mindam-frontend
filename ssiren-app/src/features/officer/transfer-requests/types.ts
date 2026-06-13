export type OfficerTransferRequestStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELED';

export type OfficerTransferDirection = 'received' | 'sent';

export type OfficerTransferActiveTab = OfficerTransferDirection;

export type OfficerTransferDepartment = {
  id: number;
  name: string;
  agencyType: {
    id: number;
    name: string;
  };
};

export type OfficerTransferRequestDto = {
  transferId: number;
  issueGroupId: number;
  issueGroupTitle: string;
  fromDepartment: OfficerTransferDepartment;
  targetDepartment: OfficerTransferDepartment;
  requestUserId: number;
  responseUserId: number | null;
  status: OfficerTransferRequestStatus;
  requestReason: string;
  requestedAt: string;
  responseReason: string | null;
  responseAt: string | null;
  transferredReportCount: number | null;
};

export type OfficerIncomingTransferRequestsResponse = {
  transferRequests?: OfficerTransferRequestDto[] | null;
  transferHistories?: OfficerTransferRequestDto[] | null;
};

export type OfficerSentTransferRequestsResponse = {
  transferHistories?: OfficerTransferRequestDto[] | null;
};

export type OfficerTransferResponseDecision = 'ACCEPTED' | 'REJECTED';

export type OfficerTransferRequestResponseBody = {
  status: OfficerTransferResponseDecision;
  responseReason: string;
};

export type OfficerSentTransferRequestsQuery = {
  status?: OfficerTransferRequestStatus;
};

export type OfficerTransferRequest = {
  id: number;
  issueGroupId: number;
  issueTitle: string;
  requestReason: string;
  responseReason: string | null;
  status: OfficerTransferRequestStatus;
  fromDepartmentName: string;
  targetDepartmentName: string;
  requestUserId: number;
  responseUserId: number | null;
  requestedAt: string;
  responseAt: string | null;
  transferredReportCount: number | null;
};

export type OfficerTransferRequestsViewResponse = {
  transferRequests: OfficerTransferRequest[];
};

export type OfficerTransferResponseSheetState = {
  request: OfficerTransferRequest;
  decision: OfficerTransferResponseDecision;
} | null;

function toViewModel(dto: OfficerTransferRequestDto): OfficerTransferRequest {
  return {
    id: dto.transferId,
    issueGroupId: dto.issueGroupId,
    issueTitle: dto.issueGroupTitle,
    requestReason: dto.requestReason,
    responseReason: dto.responseReason,
    status: dto.status,
    fromDepartmentName: dto.fromDepartment.name,
    targetDepartmentName: dto.targetDepartment.name,
    requestUserId: dto.requestUserId,
    responseUserId: dto.responseUserId,
    requestedAt: dto.requestedAt,
    responseAt: dto.responseAt,
    transferredReportCount: dto.transferredReportCount,
  };
}

export function mapIncomingTransferRequests(
  data: OfficerIncomingTransferRequestsResponse
): OfficerTransferRequestsViewResponse {
  const items = Array.isArray(data.transferRequests)
    ? data.transferRequests
    : Array.isArray(data.transferHistories)
      ? data.transferHistories
      : [];

  return {
    transferRequests: items.map(toViewModel),
  };
}

export function mapSentTransferRequests(
  data: OfficerSentTransferRequestsResponse
): OfficerTransferRequestsViewResponse {
  return {
    transferRequests: (Array.isArray(data.transferHistories) ? data.transferHistories : []).map(
      toViewModel
    ),
  };
}
