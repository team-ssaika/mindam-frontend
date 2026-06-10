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

export type AdminDashboardCategoryCount = {
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  reportCount: number;
};

export type AdminDashboardCategoryStatistics = {
  categories: AdminDashboardCategoryCount[];
};

export type AdminDashboardDenseAreaBounds = {
  swLat: number;
  swLng: number;
  neLat: number;
  neLng: number;
};

export type AdminDashboardDenseAreaItem = {
  issueGroupCount: number;
  centerLatitude: number;
  centerLongitude: number;
  bounds: AdminDashboardDenseAreaBounds;
};

export type AdminDashboardDenseAreaStatistics = {
  denseAreas: AdminDashboardDenseAreaItem[];
};

export type AdminDashboardDenseAreaQuery = {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  gridSizeMeters?: number;
  minIssueGroupCount?: number;
  myDepartmentOnly?: boolean;
};
