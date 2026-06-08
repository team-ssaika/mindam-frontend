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
