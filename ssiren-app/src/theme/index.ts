/**
 * Design system entry point.
 * Import tokens from here: `import { colors, radius, typography } from '../theme';`
 */
export * from './tokens';
export { fontAssets } from './fonts';

// Compatibility re-export: existing tab-bar metric helpers live in constants/layout.
export {
  TAB_BAR_CONTENT_HEIGHT,
  TAB_BAR_TOP_PADDING,
  getTabBarMetrics,
} from '../constants/layout';
export type { TabBarMetrics } from '../constants/layout';
