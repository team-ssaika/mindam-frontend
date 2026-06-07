import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ChatMessage = {
  id: string;
  role: 'user' | 'bot';
  text: string;
};

export default function Chatbot() {
  const insets = useSafeAreaInsets();
  const TAB_BAR_HEIGHT = 30;
  const [inputText, setInputText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'bot-initial',
      role: 'bot',
      text: '층간소음 신고는 관리실 접수 → 증거 수집 → 이웃사이센터 신고 순서로 진행하면 됩니다.',
    },
  ]);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const keyboardBottomOffset =
    keyboardHeight > 0
      ? Math.max(
          keyboardHeight -
            (Platform.OS === 'ios' ? insets.bottom : 5) -
            TAB_BAR_HEIGHT / 2,
          0
        )
      : 0;

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      return;
    }

    const newMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');
  };

  const handleCopyMessage = async (messageId: string, text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedMessageId(messageId);
      setShowCopyToast(true);
      setTimeout(() => {
        setCopiedMessageId((prev) => (prev === messageId ? null : prev));
      }, 1200);
      setTimeout(() => {
        setShowCopyToast(false);
      }, 1400);
    } catch {}
  };

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={(ref) => {
          scrollRef.current = ref;
        }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) =>
          message.role === 'user' ? (
            <View key={message.id} style={styles.userBubbleRow}>
              <View style={styles.userBubble}>
                <Text style={styles.userBubbleText}>{message.text}</Text>
              </View>
            </View>
          ) : (
            <View key={message.id} style={styles.botBubble}>
              <Text style={styles.botBody}>{message.text}</Text>
              <View style={styles.actionRow}>
                <Text style={styles.ssirenLogoText}>SSiren</Text>
                <Pressable onPress={() => handleCopyMessage(message.id, message.text)}>
                  <Ionicons
                    name={copiedMessageId === message.id ? 'checkmark' : 'copy-outline'}
                    size={16}
                    color={copiedMessageId === message.id ? '#22c55e' : '#17171f'}
                  />
                </Pressable>
              </View>
            </View>
          )
        )}
      </ScrollView>

      <View
        style={[
          styles.inputWrapper,
          {
            bottom:
              keyboardHeight > 0
                ? keyboardBottomOffset + 2
                : TAB_BAR_HEIGHT,
          },
        ]}
      >
        <View style={styles.inputContainer}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="메시지를 입력하세요"
            placeholderTextColor="#8b8b96"
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim()}
            style={styles.sendButton}
          >
            <Ionicons
              name="send"
              size={19}
              color={inputText.trim() ? '#17171f' : '#b9b9c2'}
            />
          </Pressable>
        </View>
      </View>

      {showCopyToast ? (
        <View style={styles.toastWrapper} pointerEvents="none">
          <View style={styles.toast}>
            <Text style={styles.toastText}>클립보드에 복사했습니다</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9fb',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  userBubbleRow: {
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  userBubble: {
    maxWidth: '78%',
    borderRadius: 22,
    backgroundColor: '#ececef',
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  userBubbleText: {
    fontSize: 16,
    color: '#2b2b35',
  },
  botBubble: {
    borderRadius: 18,
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  botBody: {
    fontSize: 15,
    lineHeight: 24,
    color: '#2d2d35',
  },
  actionRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  ssirenLogoChip: {
    height: 24,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ssirenLogoText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4b5563',
    letterSpacing: 0.2,
  },
  inputWrapper: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 24,
  },
  inputContainer: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ececef',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 16,
    color: '#17171f',
    paddingVertical: 0,
  },
  sendButton: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 88,
    alignItems: 'center',
    zIndex: 20,
  },
  toast: {
    backgroundColor: 'rgba(23, 23, 31, 0.9)',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  toastText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});