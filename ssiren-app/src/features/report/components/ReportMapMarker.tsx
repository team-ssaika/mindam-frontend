import { StyleSheet, View } from 'react-native';
import { colors } from '../../../theme';

export function ReportMapMarker() {
  return (
    <View style={styles.pin}>
      <View style={styles.dot} />
    </View>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.coral,
    borderWidth: 2.5,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.white,
  },
});
