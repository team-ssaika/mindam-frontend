import type { MyReportItem, ReportStatus } from './myReport';

export type PublicReportItem = {
  report: MyReportItem['report'];
  reportImages: MyReportItem['reportImages'];
  category: MyReportItem['category'];
  issueGroup: MyReportItem['issueGroup'];
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
