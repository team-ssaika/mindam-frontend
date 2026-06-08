import { StyleSheet, Text, View } from 'react-native';

type SummaryBoxProps = {
  title: string;
  content: string;
};

export function SummaryBox({ title, content }: SummaryBoxProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.content}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 5,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4b5563',
  },
  content: {
    fontSize: 13,
    lineHeight: 19,
    color: '#374151',
  },
});
