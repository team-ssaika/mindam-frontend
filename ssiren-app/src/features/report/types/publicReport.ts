import type { MyReportItem, ReportStatus } from './myReport';
import type { ReportStatusHistory } from './myReportDetail';
import type { ReportAgencyType, ReportDepartment } from './reportSubmission';

export type PublicReportItem = {
  report: MyReportItem['report'];
  reportImages: MyReportItem['reportImages'];
  category: MyReportItem['category'];
  issueGroup: MyReportItem['issueGroup'];
  department: ReportDepartment;
  agencyType: ReportAgencyType;
  statusHistories?: ReportStatusHistory[];
};

export type PublicReportsQuery = {
  categoryId?: number;
  status?: ReportStatus;
  sido?: string;
  sigungu?: string;
  eupmyeondong?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
  sort?: string;
};
