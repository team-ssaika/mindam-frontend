import { StyleSheet, View } from 'react-native';

type SettingsCardProps = {
  children: React.ReactNode;
};

export function SettingsCard({ children }: SettingsCardProps) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 10,
    gap: 6,
  },
});
