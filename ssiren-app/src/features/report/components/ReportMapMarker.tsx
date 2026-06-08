import { StyleSheet, View } from 'react-native';

const PRIMARY_COLOR = '#6257FF';

export function ReportMapMarker() {
  return <View style={styles.pin} />;
}

const styles = StyleSheet.create({
  pin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: PRIMARY_COLOR,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 3,
  },
});
