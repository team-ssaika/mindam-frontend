import type { AdminDashboardCategoryCount } from '../types/adminDashboard';

export function formatCategoryShare(count: number, total: number) {
  if (total <= 0) {
    return '0%';
  }

  return `${Math.round((count / total) * 100)}%`;
}

export function sortCategoriesByCount(categories: AdminDashboardCategoryCount[]) {
  return [...categories].sort((a, b) => b.reportCount - a.reportCount);
}

export function getCategoryTotalCount(categories: AdminDashboardCategoryCount[]) {
  return categories.reduce((sum, item) => sum + item.reportCount, 0);
}
