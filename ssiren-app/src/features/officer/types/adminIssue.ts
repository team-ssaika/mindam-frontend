import type { IssueGroupStatus } from '../../report/types/issue';
import type { MyReportItem, ReportStatus } from '../../report/types/myReport';

export type AdminStatusHistory = {
  id: number;
  previousStatus: ReportStatus | null;
  newStatus: ReportStatus;
  reason: string;
  createdAt: string;
  updatedAt: string;
  reportId: number;
  userId: number | null;
};

export type AdminRepresentativeReport = {
  report: MyReportItem['report'];
  reportImages: MyReportItem['reportImages'];
  statusHistories: AdminStatusHistory[];
};

export type AdminCategory = {
  id: number;
  categoryCode: string;
  categoryName: string;
  parentCategory: {
    id: number;
    categoryCode: string;
    categoryName: string;
  } | null;
};

export type AdminDepartment = {
  id: number;
  name: string;
  agencyType: {
    id: number;
    name: string;
  };
};

export type AdminIssueItem = {
  issueGroup: MyReportItem['issueGroup'] & { status: IssueGroupStatus };
  representativeReport: AdminRepresentativeReport;
  category: AdminCategory;
  department: AdminDepartment;
};

export type AdminIssuesResponse = {
  issues: AdminIssueItem[];
};

export type AdminIssuesQuery = {
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  swLat?: number;
  swLng?: number;
  neLat?: number;
  neLng?: number;
  categoryId?: number;
  agencyTypeId?: number;
  departmentId?: number;
  myDepartmentOnly?: boolean;
  deletedOnly?: boolean;
  status?: IssueGroupStatus;
  reportStatus?: ReportStatus;
  riskMin?: number;
  riskMax?: number;
  from?: string;
  to?: string;
};
