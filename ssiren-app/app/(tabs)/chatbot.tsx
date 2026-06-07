import { Ionicons } from '@expo/vector-icons';
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
  const [inputText, setInputText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'bot-initial',
      role: 'bot',
      text: '층간소음 신고는 관리실 접수 → 증거 수집 → 이웃사이센터 신고 순서로 진행하면 됩니다.',
    },
  ]);
  const scrollRef = useRef<ScrollView | null>(null);

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
                <Ionicons name="share-outline" size={18} color="#17171f" />
                <Ionicons name="copy-outline" size={18} color="#17171f" />
                <Ionicons name="ellipsis-horizontal" size={18} color="#17171f" />
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
                ? keyboardHeight + 2
                : insets.bottom,
          },
        ]}
      >
        <View style={styles.inputContainer}>
          <Ionicons name="add" size={22} color="#17171f" />
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
    gap: 14,
    alignItems: 'center',
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
});