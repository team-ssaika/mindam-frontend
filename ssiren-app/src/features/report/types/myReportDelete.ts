import type { MyReportItem } from './myReport';

export type MyReportDeleteResponse = {
  deleted: boolean;
  deletedReport: MyReportItem['report'];
  deletedReportImages: MyReportItem['reportImages'];
  updatedIssueGroup: MyReportItem['issueGroup'];
};
