import { Tabs } from 'expo-router';
import {
  ChartTabIcon,
  GearTabIcon,
  HomeTabIcon,
  InboxTabIcon,
  UserTabIcon,
} from '../../src/components/navigation/TabIcons';
import { colors, fonts } from '../../src/theme';
import { TAB_BAR_TOP_PADDING } from '../../src/constants/layout';
import { useTabBarMetrics } from '../../src/hooks/useTabBarMetrics';

const TAB_INACTIVE = '#8D8D8D';

export default function OfficerTabLayout() {
  const { height: tabBarHeight, insets } = useTabBarMetrics();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: TAB_INACTIVE,
        tabBarLabelStyle: {
          fontFamily: fonts.semibold,
          fontSize: 12,
          marginTop: 3,
        },
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: TAB_BAR_TOP_PADDING,
          paddingBottom: insets.bottom,
          borderTopWidth: 1,
          borderTopColor: colors.hairline,
          backgroundColor: colors.canvas,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <HomeTabIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: '대시보드',
          tabBarIcon: ({ color }) => <ChartTabIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: '제보함',
          tabBarIcon: ({ color }) => <InboxTabIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '내 정보',
          tabBarIcon: ({ color }) => <UserTabIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '설정',
          tabBarIcon: ({ color }) => <GearTabIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
