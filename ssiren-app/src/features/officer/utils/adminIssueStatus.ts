import type { ReportStatus } from '../../report/types/myReport';
import type { AdminUpdatableReportStatus } from '../types/adminIssue';

export const ADMIN_STATUS_FLOW_ORDER: AdminUpdatableReportStatus[] = [
  'RECEIVED',
  'CHECKING',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
];

export const ADMIN_UPDATABLE_STATUSES = ADMIN_STATUS_FLOW_ORDER;

export function toAdminUpdatableStatus(status: ReportStatus): AdminUpdatableReportStatus {
  if (ADMIN_UPDATABLE_STATUSES.includes(status as AdminUpdatableReportStatus)) {
    return status as AdminUpdatableReportStatus;
  }
  if (status === 'SUBMITTED') {
    return 'RECEIVED';
  }
  return 'IN_PROGRESS';
}

/** 접수완료 → 확인중 → 처리중 → 처리완료 → 반려 순서에서 이미 지난 상태는 선택 불가 */
export function isAdminStatusOptionSelectable(
  currentStatus: ReportStatus,
  option: AdminUpdatableReportStatus
): boolean {
  if (currentStatus === 'COMPLETED') {
    return option === 'COMPLETED';
  }
  if (currentStatus === 'REJECTED') {
    return option === 'REJECTED';
  }

  const currentIndex =
    currentStatus === 'SUBMITTED'
      ? -1
      : ADMIN_STATUS_FLOW_ORDER.indexOf(currentStatus as AdminUpdatableReportStatus);

  if (currentIndex < 0) {
    return true;
  }

  return ADMIN_STATUS_FLOW_ORDER.indexOf(option) >= currentIndex;
}
