import { Tabs } from 'expo-router';
import {
  ChartTabIcon,
  GearTabIcon,
  HomeTabIcon,
  InboxTabIcon,
  UserTabIcon,
} from '../../../src/components/navigation/TabIcons';
import { colors, fontSize, fonts } from '../../../src/theme';
import { TAB_BAR_TOP_PADDING } from '../../../src/constants/layout';
import { useTabBarMetrics } from '../../../src/hooks/useTabBarMetrics';

const TAB_INACTIVE = '#8D8D8D';

export default function OfficerMainTabLayout() {
  const { height: tabBarHeight, insets } = useTabBarMetrics();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: TAB_INACTIVE,
        tabBarAllowFontScaling: false,
        tabBarItemStyle: {
          flex: 1,
          minWidth: 0,
          paddingHorizontal: 0,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.semibold,
          fontSize: fontSize.micro,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: TAB_BAR_TOP_PADDING,
          paddingHorizontal: 4,
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
        name="config"
        options={{
          title: '설정',
          tabBarIcon: ({ color }) => <GearTabIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
