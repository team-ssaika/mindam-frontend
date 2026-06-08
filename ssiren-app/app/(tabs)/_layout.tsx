import { Tabs, usePathname } from 'expo-router';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Header from '../../src/components/Header';
import { TAB_BAR_TOP_PADDING } from '../../src/constants/layout';
import { useTabBarMetrics } from '../../src/hooks/useTabBarMetrics';

function PlusButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.plusButtonWrapper}
      onPress={() => router.push('/(tabs)/plus')}
    >
      <View style={styles.plusButton}>
        <Ionicons name="add" size={32} color="white" />
      </View>
    </TouchableOpacity>
  );
}

export default function TabLayout() {
  const pathname = usePathname();
  const isReportFlow = pathname === '/plus' || pathname === '/(tabs)/plus';
  const isSettingsScreen = pathname === '/settings' || pathname === '/(tabs)/settings';
  const { height: tabBarHeight, insets } = useTabBarMetrics();

  return (
    <>
      {!isReportFlow && !isSettingsScreen ? <Header /> : null}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#6C63FF',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            height: tabBarHeight,
            paddingTop: TAB_BAR_TOP_PADDING,
            paddingBottom: insets.bottom,
            display: isReportFlow ? 'none' : 'flex',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: '홈화면',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="chatbot"
          options={{
            title: '챗봇',
            tabBarHideOnKeyboard: true,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubble-ellipses" size={size} color={color} />
            ),
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
            title: '내정보',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: '설정',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-sharp" size={size} color={color} />
            ),
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
    width: 60,
    height: 60,
    bottom: 10,
    borderRadius: 30,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
});
