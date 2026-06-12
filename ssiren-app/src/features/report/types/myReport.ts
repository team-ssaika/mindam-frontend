export type ReportStatus =
  | 'SUBMITTED'
  | 'RECEIVED'
  | 'CHECKING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'TRANSFERRED'
  | 'MERGED';

export type ReportContents = {
  source?: string;
  summary?: string;
  urgency?: string;
  who?: string;
  when?: string;
  where?: string;
  what?: string;
  how?: string;
  why?: string;
};

export type MyReportItem = {
  report: {
    id: number;
    title: string;
    contents: ReportContents;
    latitude: number;
    longitude: number;
    roadAddress: string;
    jibunAddress: string;
    sido: string;
    sigungu: string;
    eupmyeondong: string;
    occurredAt: string;
    riskScore: number;
    assignmentReason: string;
    status: ReportStatus;
    isRepresentative: boolean;
    visibility: string;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    userId: number;
    categoryId: number;
    issueGroupId: number;
    departmentId: number;
    departmentName: string;
    agencyTypeId: number;
    agencyTypeName: string;
  };
  reportImages: Array<{
    id: number;
    imageUrl: string;
    sortOrder: number;
    reportId: number;
  }>;
  category: {
    id: number;
    categoryCode: string;
    categoryName: string;
    createdAt: string;
    updatedAt: string;
    parentCategoryId: number | null;
  };
  issueGroup: {
    id: number;
    title: string;
    content: string;
    groupLatitude: number;
    groupLongitude: number;
    reportCount: number;
    yesCount: number;
    noCount: number;
    unknownCount: number;
    recentReportedAt: string;
    status: string;
    riskScore: number;
    createdAt: string;
    updatedAt: string;
  };
  department: {
    id: number;
    name: string;
    agencyTypeId: number;
    agencyTypeName: string;
  };
};

export type MyReportsQuery = {
  status?: ReportStatus;
  categoryId?: number;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
  sort?: string;
};
