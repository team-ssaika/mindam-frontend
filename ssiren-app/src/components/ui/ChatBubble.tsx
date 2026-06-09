import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import AppText from './AppText';
import Icon from './Icon';

type ChatBubbleProps = {
  children: string;
  /** Bot message (left, light) vs user message (right, ink). */
  bot?: boolean;
};

/** Chat message bubble with bot avatar; user bubbles align right. */
export default function ChatBubble({ children, bot = false }: ChatBubbleProps) {
  return (
    <View style={[styles.row, bot ? styles.rowBot : styles.rowUser]}>
      {bot ? (
        <View style={styles.avatar}>
          <Icon name="sparkle" size={17} color={colors.white} fill />
        </View>
      ) : null}
      <View
        style={[
          styles.bubble,
          bot ? styles.bubbleBot : styles.bubbleUser,
        ]}
      >
        <AppText
          style={[styles.text, { color: bot ? colors.body : colors.white }]}
        >
          {children}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    maxWidth: '84%',
  },
  rowBot: {
    alignSelf: 'flex-start',
  },
  rowUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexShrink: 1,
  },
  bubbleBot: {
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 16,
    borderTopLeftRadius: 4,
  },
  bubbleUser: {
    backgroundColor: colors.brand,
    borderRadius: 16,
    borderTopRightRadius: 4,
  },
  text: {
    fontSize: 14.5,
    lineHeight: 22,
  },
});
