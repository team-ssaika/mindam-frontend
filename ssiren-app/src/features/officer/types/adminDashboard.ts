export type AdminDashboardStatistics = {
  totalReportCount: number;
  processingReportCount: number;
  completedReportCount: number;
  delayedReportCount: number;
  monthlyCompletedReportCount: number;
  todayNewReportCount: number;
};

export type AdminDashboardStatisticsQuery = {
  myDepartmentOnly?: boolean;
};
