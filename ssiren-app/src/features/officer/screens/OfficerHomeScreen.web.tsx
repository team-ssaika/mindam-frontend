import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui';
import { colors } from '../../../theme';

export default function OfficerHomeScreenWeb() {
  return (
    <View style={styles.container}>
      <AppText variant="heading" color={colors.ink}>웹에서는 관할 지도를 표시하지 않습니다.</AppText>
      <AppText style={styles.desc}>모바일(Android / iOS)에서 지도가 표시됩니다.</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  desc: { fontSize: 14, color: colors.muted },
});
