import type { MyReportItem, ReportContents, ReportStatus } from './myReport';

export type ReportCategory = MyReportItem['category'];

export type ReportStatusHistoryDepartment =
  | MyReportItem['department']
  | {
      id: number;
      name: string;
      agencyType: {
        id: number;
        name: string;
      };
    };

export type ReportStatusHistory = {
  id: number;
  previousStatus: ReportStatus | null;
  newStatus: ReportStatus;
  reason: string;
  createdAt: string;
  updatedAt: string;
  reportId: number;
  userId: number | null;
  department?: ReportStatusHistoryDepartment | null;
};

export type ReportReactionLog = {
  id: number;
  reactionType: 'YES' | 'NO' | 'UNKNOWN';
  createdAt: string;
  updatedAt: string;
  reportId: number;
  userId: number;
};

export type MyReportDetail = {
  report: MyReportItem['report'];
  reportImages: MyReportItem['reportImages'];
  category: ReportCategory;
  parentCategory: ReportCategory | null;
  issueGroup: MyReportItem['issueGroup'];
  department: MyReportItem['department'];
  agencyType: {
    id: number;
    name: string;
  };
  statusHistories: ReportStatusHistory[];
  reactionLogs: ReportReactionLog[];
};

export type ReportDetailContents = ReportContents;
