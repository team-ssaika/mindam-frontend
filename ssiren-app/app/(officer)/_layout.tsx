import { Tabs } from 'expo-router';
import { Icon } from '../../src/components/ui';
import { colors } from '../../src/theme';
import { TAB_BAR_TOP_PADDING } from '../../src/constants/layout';
import { useTabBarMetrics } from '../../src/hooks/useTabBarMetrics';

export default function OfficerTabLayout() {
  const { height: tabBarHeight, insets } = useTabBarMetrics();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: { fontSize: 10.5, fontWeight: '600' },
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: TAB_BAR_TOP_PADDING,
          paddingBottom: insets.bottom,
          borderTopColor: colors.hairline,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: '홈', tabBarIcon: ({ color }) => <Icon name="home" size={21} color={color} /> }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{ title: '대시보드', tabBarIcon: ({ color }) => <Icon name="chart" size={21} color={color} /> }}
      />
      <Tabs.Screen
        name="inbox"
        options={{ title: '제보함', tabBarIcon: ({ color }) => <Icon name="layers" size={21} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: '내 정보', tabBarIcon: ({ color }) => <Icon name="user" size={21} color={color} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: '설정', tabBarIcon: ({ color }) => <Icon name="gear" size={21} color={color} /> }}
      />
    </Tabs>
  );
}
