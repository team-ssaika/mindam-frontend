import axios from 'axios';
import { resolveApiBaseUrl } from '../../../lib/api/client';
import { colors, statusColors } from '../../../theme';

export function getTransferStatusDisplay(status: string) {
  const normalized = status.toUpperCase();

  if (normalized === 'REQUESTED') {
    return { label: '응답 대기', bg: '#FEF3C7', fg: '#92400E', dot: '#D97706' };
  }
  if (normalized === 'ACCEPTED') {
    return { ...statusColors.done, label: '승인됨' };
  }
  if (normalized === 'REJECTED') {
    return { label: '거절됨', bg: '#FEE2E2', fg: colors.danger, dot: colors.danger };
  }
  if (normalized === 'CANCELED') {
    return { label: '취소됨', bg: colors.hairline, fg: colors.muted, dot: colors.faint };
  }

  return { label: status, bg: colors.soft2, fg: colors.body, dot: colors.faint };
}

export function isTransferPending(status: string) {
  return status.toUpperCase() === 'REQUESTED';
}

export function formatTransferDateTime(value?: string | null) {
  if (!value) {
    return '-';
  }

  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getTransferApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const apiMessage = error.response?.data?.message;
    const message = typeof apiMessage === 'string' ? apiMessage : error.message || fallback;
    if (!error.response) {
      return `${message}\n\n요청 주소: ${resolveApiBaseUrl()}`;
    }
    return message;
  }

  return error instanceof Error ? error.message : fallback;
}
