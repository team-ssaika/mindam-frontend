import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function Header() {
  const [hasUnreadNotification, setHasUnreadNotification] = useState(false);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => {
      setHasUnreadNotification(true);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.logo}>LOGO</Text>
        <TouchableOpacity
          onPress={() => setHasUnreadNotification(false)}
          accessibilityRole="button"
          style={styles.notificationButton}
        >
          <Ionicons name="notifications-outline" size={26} color="#1a1a1a" />
          {hasUnreadNotification ? <View style={styles.unreadDot} /> : null}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'white',
  },
  container: {
    height: 56,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  notificationButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
});
