import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTabBarMetrics } from '../constants/layout';

export function useTabBarMetrics() {
  const insets = useSafeAreaInsets();

  return {
    insets,
    ...getTabBarMetrics(insets.bottom),
  };
}
