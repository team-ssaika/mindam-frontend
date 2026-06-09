import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import AppBar from './ui/AppBar';
import Icon from './ui/Icon';

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
    <AppBar
      logo
      right={
        <Pressable
          onPress={() => setHasUnreadNotification(false)}
          accessibilityRole="button"
          style={styles.notificationButton}
        >
          <Icon name="bell" size={22} color={colors.ink} />
          {hasUnreadNotification ? <View style={styles.unreadDot} /> : null}
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: colors.danger,
  },
});
