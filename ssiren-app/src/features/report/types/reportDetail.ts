import type { ReportStatusHistory } from './myReportDetail';

export type ReportDetail = {
  id: string;
  issueGroupId?: number;
  title: string;
  riskLabel: string;
  timeAgo: string;
  distance: string;
  address: string;
  summary: string;
  category: string;
  yesCount: number;
  organization: string;
  status: string;
  statusHistories?: ReportStatusHistory[];
};
