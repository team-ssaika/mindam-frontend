import type { MyReportItem, ReportContents } from './myReport';

export type ReportVisibility = 'PUBLIC' | 'PRIVATE' | 'AGENCY_ONLY';

export type MyReportUpdateRequest = {
  title: string;
  contents: ReportContents;
  visibility: ReportVisibility;
  categoryId: number;
};

export type MyReportUpdateResponse = {
  report: MyReportItem['report'];
  category: MyReportItem['category'];
  issueGroup: MyReportItem['issueGroup'];
};
