import { Tabs, usePathname, useRouter } from 'expo-router';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Header from '../../src/components/Header';
import { Icon } from '../../src/components/ui';
import { colors } from '../../src/theme';
import { TAB_BAR_TOP_PADDING } from '../../src/constants/layout';
import { useTabBarMetrics } from '../../src/hooks/useTabBarMetrics';

function PlusButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.plusButtonWrapper}
      onPress={() => router.push('/(tabs)/plus')}
      accessibilityRole="button"
      accessibilityLabel="제보하기"
    >
      <View style={styles.plusButton}>
        <Icon name="plus" size={28} color={colors.white} strokeWidth={2.4} />
      </View>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const pathname = usePathname();
  const isReportFlow = pathname === '/plus' || pathname === '/(tabs)/plus';
  // Screens that render their own AppBar should not also show the global header.
  const ownsHeader =
    isReportFlow ||
    pathname === '/settings' ||
    pathname === '/(tabs)/settings' ||
    pathname === '/profile' ||
    pathname === '/(tabs)/profile' ||
    pathname === '/chatbot' ||
    pathname === '/(tabs)/chatbot';
  const { height: tabBarHeight, insets } = useTabBarMetrics();

  return (
    <>
      {!ownsHeader ? <Header /> : null}
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
            display: isReportFlow ? 'none' : 'flex',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '홈',
            tabBarIcon: ({ color }) => <Icon name="home" size={23} color={color} />,
          }}
        />
        <Tabs.Screen
          name="chatbot"
          options={{
            title: '챗봇',
            tabBarHideOnKeyboard: true,
            tabBarIcon: ({ color }) => <Icon name="chat" size={23} color={color} />,
          }}
        />
        <Tabs.Screen
          name="plus"
          options={{
            title: '',
            tabBarButton: () => <PlusButton />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: '내 정보',
            tabBarIcon: ({ color }) => <Icon name="user" size={23} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: '설정',
            tabBarIcon: ({ color }) => <Icon name="gear" size={23} color={color} />,
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  plusButtonWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButton: {
    width: 56,
    height: 56,
    bottom: 12,
    borderRadius: 18,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.33,
    shadowRadius: 18,
    elevation: 8,
  },
});
