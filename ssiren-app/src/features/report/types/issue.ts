import type { MyReportItem } from './myReport';

export type IssueGroupStatus = 'ACTIVE' | 'RESOLVED' | 'MERGED' | string;

export type IssueGroup = Omit<MyReportItem['issueGroup'], 'status'> & {
  status: IssueGroupStatus;
};

export type IssueReport = MyReportItem['report'];

export type IssueCategory = MyReportItem['category'];

export type IssueItem = {
  issueGroup: IssueGroup;
  representativeReport: IssueReport | null;
  category: IssueCategory | null;
};

export type IssuesResponse = {
  issues: IssueItem[];
};

export type IssueDetail = {
  issueGroup: IssueGroup;
  representativeReport: IssueReport | null;
  reports: IssueReport[];
  category: IssueCategory | null;
};

export type IssuesQuery = {
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  swLat?: number;
  swLng?: number;
  neLat?: number;
  neLng?: number;
  categoryId?: number;
  agencyId?: number;
  status?: IssueGroupStatus;
  riskMin?: number;
  riskMax?: number;
  from?: string;
  to?: string;
};
