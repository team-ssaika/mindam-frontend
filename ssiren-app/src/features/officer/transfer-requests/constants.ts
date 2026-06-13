import type {
  OfficerTransferRequestStatus,
  OfficerTransferResponseDecision,
} from './types';

export const TRANSFER_RESPONSE_LABELS: Record<OfficerTransferResponseDecision, string> = {
  ACCEPTED: '승인',
  REJECTED: '거절',
};

export const SENT_STATUS_FILTER_OPTIONS: {
  label: string;
  value: OfficerTransferRequestStatus | null;
}[] = [
  { label: '전체', value: null },
  { label: '대기', value: 'REQUESTED' },
  { label: '승인', value: 'ACCEPTED' },
  { label: '거절', value: 'REJECTED' },
  { label: '취소', value: 'CANCELED' },
];

export const TRANSFER_PANEL_BG = '#F4F5F8';
