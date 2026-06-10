export const TAB_BAR_CONTENT_HEIGHT = 62;
export const TAB_BAR_TOP_PADDING = 8;

export type TabBarMetrics = {
  height: number;
  contentOffset: number;
};

export function getTabBarMetrics(bottomInset: number): TabBarMetrics {
  const height = TAB_BAR_CONTENT_HEIGHT + TAB_BAR_TOP_PADDING + bottomInset;

  return {
    height,
    contentOffset: height,
  };
}
