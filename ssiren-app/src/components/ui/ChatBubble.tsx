import { StyleSheet, View } from 'react-native';
import { colors, fontSize, fonts } from '../../theme';
import AppText from './AppText';
import Icon from './Icon';

type ChatBubbleProps = {
  children: string;
  /** Bot message (left, light) vs user message (right, ink). */
  bot?: boolean;
};

function renderBoldMarkdown(text: string, color: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    const isBold = part.startsWith('**') && part.endsWith('**') && part.length > 4;
    const content = isBold ? part.slice(2, -2) : part;

    return (
      <AppText
        key={`${index}-${content}`}
        style={[
          styles.text,
          { color },
          isBold && styles.boldText,
        ]}
      >
        {content}
      </AppText>
    );
  });
}

/** Chat message bubble with bot avatar; user bubbles align right. */
export default function ChatBubble({ children, bot = false }: ChatBubbleProps) {
  const textColor = bot ? colors.body : colors.white;

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
          style={[styles.text, { color: textColor }]}
        >
          {renderBoldMarkdown(children, textColor)}
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
    fontSize: fontSize.mdLg,
    lineHeight: 24,
  },
  boldText: {
    fontFamily: fonts.bold,
  },
});
