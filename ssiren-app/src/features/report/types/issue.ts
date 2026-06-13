import type { MyReportItem } from './myReport';
import type { ReportStatusHistory } from './myReportDetail';
import type { ReportAgencyType, ReportDepartment } from './reportSubmission';

export type IssueGroupStatus = 'ACTIVE' | 'RESOLVED' | 'MERGED' | string;

export type IssueGroup = Omit<MyReportItem['issueGroup'], 'status'> & {
  status: IssueGroupStatus;
};

export type IssueReport = MyReportItem['report'];

export type IssueCategory = MyReportItem['category'];

export type IssueRepresentativeReport = {
  report: IssueReport;
  reportImages: MyReportItem['reportImages'];
  statusHistories?: ReportStatusHistory[];
};

export type IssueRepresentativeReportLike = IssueReport | IssueRepresentativeReport;

export type IssueItem = {
  issueGroup: IssueGroup;
  representativeReport: IssueRepresentativeReportLike | null;
  category: IssueCategory | null;
  department: ReportDepartment;
  agencyType: ReportAgencyType;
};

export type IssuesResponse = {
  issues: IssueItem[];
};

export type IssueDetail = {
  issueGroup: IssueGroup;
  representativeReport: IssueRepresentativeReportLike | null;
  reports: Array<IssueReport | { report: IssueReport; reportImages: MyReportItem['reportImages'] }>;
  category: IssueCategory | null;
  department: ReportDepartment | null;
  agencyType: ReportAgencyType | null;
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
