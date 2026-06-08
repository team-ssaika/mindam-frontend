import type { ReportStatus } from '../types/myReport';

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  SUBMITTED: '접수 전',
  RECEIVED: '접수 완료',
  CHECKING: '확인 중',
  IN_PROGRESS: '처리 중',
  COMPLETED: '처리 완료',
  REJECTED: '반려',
  TRANSFERRED: '이관',
  MERGED: '병합',
};

export function getReportStatusLabel(status: ReportStatus) {
  return REPORT_STATUS_LABEL[status] ?? status;
}

export function canEditReport(status: ReportStatus) {
  return status === 'SUBMITTED';
}

export function formatStatusTransition(
  previousStatus: ReportStatus | null,
  newStatus: ReportStatus
) {
  if (!previousStatus) {
    return getReportStatusLabel(newStatus);
  }

  return `${getReportStatusLabel(previousStatus)} → ${getReportStatusLabel(newStatus)}`;
}

export function sortStatusHistories<T extends { createdAt: string }>(histories: T[]) {
  return [...histories].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function formatReportDate(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatReportDateTime(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const REACTION_TYPE_LABEL = {
  YES: '공감',
  NO: '비공감',
  UNKNOWN: '모름',
} as const;
