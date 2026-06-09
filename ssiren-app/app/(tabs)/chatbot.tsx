import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar, AppText, ChatBubble, Icon } from '../../src/components/ui';
import { colors, fonts, radius } from '../../src/theme';

type ChatMessage = {
  id: string;
  role: 'user' | 'bot';
  text: string;
};

const GREETING: ChatMessage = {
  id: 'bot-initial',
  role: 'bot',
  text: '안녕하세요! 무엇을 도와드릴까요?\n사진과 함께 상황을 말씀해 주시면 제가 제보를 정리해 드려요.',
};

// AppBar(52) + status bar inset → KeyboardAvoidingView's distance from the top.
const APP_BAR_HEIGHT = 52;

export default function Chatbot() {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      return;
    }

    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, role: 'user', text: trimmed }]);
    setInputText('');
  };

  const handleReset = () => {
    setMessages([GREETING]);
    setInputText('');
  };

  const handleCopyMessage = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 1400);
    } catch {}
  };

  const scrollToEnd = () => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  useEffect(() => {
    scrollToEnd();
  }, [messages]);

  return (
    <View style={styles.container}>
      <AppBar
        title="제보 도우미"
        logo={false}
        right={
          <Pressable onPress={handleReset} hitSlop={8} accessibilityLabel="대화 초기화">
            <Icon name="refresh" size={20} color={colors.body} />
          </Pressable>
        }
      />
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + APP_BAR_HEIGHT : 0}
      >
        <ScrollView
          ref={(ref) => {
            scrollRef.current = ref;
          }}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToEnd}
        >
          {messages.map((message) =>
            message.role === 'user' ? (
              <ChatBubble key={message.id}>{message.text}</ChatBubble>
            ) : (
              <Pressable key={message.id} onLongPress={() => handleCopyMessage(message.text)}>
                <ChatBubble bot>{message.text}</ChatBubble>
              </Pressable>
            )
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <Pressable style={styles.cameraButton} accessibilityLabel="사진 첨부">
            <Icon name="camera" size={21} color={colors.body} />
          </Pressable>
          <View style={styles.inputPill}>
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="메시지 입력…"
              placeholderTextColor={colors.faint}
              style={styles.input}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
          </View>
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim()}
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            accessibilityLabel="전송"
          >
            <Icon name="send" size={20} color={colors.white} fill />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {showCopyToast ? (
        <View style={styles.toastWrapper} pointerEvents="none">
          <View style={styles.toast}>
            <AppText style={styles.toastText}>클립보드에 복사했습니다</AppText>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.soft },
  body: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: colors.soft,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  cameraButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.canvas,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputPill: {
    flex: 1,
    height: 44,
    backgroundColor: colors.canvas,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  input: { fontFamily: fonts.regular, fontSize: 14.5, color: colors.ink, paddingVertical: 0 },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },

  toastWrapper: { position: 'absolute', left: 0, right: 0, bottom: 90, alignItems: 'center', zIndex: 20 },
  toast: { backgroundColor: 'rgba(24,29,38,0.92)', borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 11 },
  toastText: { fontFamily: fonts.semibold, color: colors.white, fontSize: 14 },
});
