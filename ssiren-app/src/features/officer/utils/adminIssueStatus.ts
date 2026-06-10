import type { ReportStatus } from '../../report/types/myReport';
import type { AdminUpdatableReportStatus } from '../types/adminIssue';

export const ADMIN_UPDATABLE_STATUSES: AdminUpdatableReportStatus[] = [
  'RECEIVED',
  'CHECKING',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
];

export function toAdminUpdatableStatus(status: ReportStatus): AdminUpdatableReportStatus {
  if (ADMIN_UPDATABLE_STATUSES.includes(status as AdminUpdatableReportStatus)) {
    return status as AdminUpdatableReportStatus;
  }
  if (status === 'SUBMITTED') {
    return 'RECEIVED';
  }
  return 'IN_PROGRESS';
}
