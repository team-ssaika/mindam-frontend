import axios from 'axios';
import * as Clipboard from 'expo-clipboard';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar, AppText, ChatBubble, Icon } from '../../src/components/ui';
import {
  createChatbotSession,
  deleteChatbotSession,
  fetchChatbotMessages,
  fetchChatbotSessions,
  sendChatbotMessage,
  updateChatbotSessionTitle,
} from '../../src/features/chatbot/api/chatbotApi';
import type {
  ChatbotMessage as ApiChatbotMessage,
  ChatbotSession,
} from '../../src/features/chatbot/types/chatbot';
import { resolveApiBaseUrl } from '../../src/lib/api/client';
import { getAppCurrentPosition } from '../../src/lib/location/appLocation';
import { colors, fonts, radius } from '../../src/theme';

type ChatMessage = {
  id: string;
  role: 'user' | 'bot';
  text: string;
};

type LatLng = {
  latitude: number;
  longitude: number;
};

const GREETING: ChatMessage = {
  id: 'bot-initial',
  role: 'bot',
  text: '안녕하세요. 무엇을 도와드릴까요?\n주변 신고 확인이나 내 신고 현황에 대해 물어보세요.',
};

function toChatMessage(message: ApiChatbotMessage): ChatMessage {
  return {
    id: String(message.id),
    role: message.senderType === 'USER' ? 'user' : 'bot',
    text: message.message,
  };
}

function sortMessages(messages: ApiChatbotMessage[]) {
  return [...messages].sort((a, b) => a.id - b.id).map(toChatMessage);
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const apiMessage = error.response?.data?.message;
    const message = typeof apiMessage === 'string' ? apiMessage : error.message || fallback;

    if (!error.response) {
      return `${message}\n\n요청 주소: ${resolveApiBaseUrl()}\n백엔드 서버와 같은 네트워크인지 확인해주세요.`;
    }

    return message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

async function getCurrentCoordinate(): Promise<LatLng> {
  return getAppCurrentPosition();
}

export default function Chatbot() {
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const [sessions, setSessions] = useState<ChatbotSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatbotSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);
  const [editingSession, setEditingSession] = useState<ChatbotSession | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);

  const scrollToEnd = () => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const setSessionMessages = (apiMessages: ApiChatbotMessage[]) => {
    const nextMessages = sortMessages(apiMessages);
    setMessages(nextMessages.length > 0 ? nextMessages : [GREETING]);
  };

  const loadSessionMessages = async (sessionId: number) => {
    const data = await fetchChatbotMessages(sessionId, { size: 50 });
    setSessionMessages(data.content);
  };

  const selectSession = async (session: ChatbotSession) => {
    if (currentSession?.id === session.id) {
      return;
    }

    setErrorMessage(null);
    setCurrentSession(session);
    setMessages([GREETING]);

    try {
      await loadSessionMessages(session.id);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '채팅 내역을 불러오지 못했습니다.'));
    }
  };

  const loadInitialSession = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const sessionPage = await fetchChatbotSessions({ page: 0, size: 20 });
      const nextSessions = Array.isArray(sessionPage.contents) ? sessionPage.contents : [];
      setSessions(nextSessions);

      if (nextSessions.length > 0) {
        const firstSession = nextSessions[0];
        setCurrentSession(firstSession);
        await loadSessionMessages(firstSession.id);
        return;
      }

      const newSession = await createChatbotSession();
      setSessions([newSession]);
      setCurrentSession(newSession);
      setMessages([GREETING]);
    } catch (error) {
      setMessages([GREETING]);
      setErrorMessage(getApiErrorMessage(error, '챗봇 세션을 준비하지 못했습니다.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (isCreatingSession) {
      return;
    }

    Keyboard.dismiss();
    setIsCreatingSession(true);
    setErrorMessage(null);

    try {
      const newSession = await createChatbotSession();
      setSessions((prev) => [newSession, ...prev.filter((item) => item.id !== newSession.id)]);
      setCurrentSession(newSession);
      setEditingSession(null);
      setMessages([GREETING]);
      setInputText('');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '새 대화를 만들지 못했습니다.'));
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleDeleteCurrentSession = () => {
    if (!currentSession || isCreatingSession) {
      return;
    }

    Alert.alert('대화 삭제', '현재 챗봇 대화를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          const sessionId = currentSession.id;
          setIsCreatingSession(true);
          setErrorMessage(null);

          try {
            await deleteChatbotSession(sessionId);
            const remainingSessions = sessions.filter((session) => session.id !== sessionId);

            if (remainingSessions.length > 0) {
              const nextSession = remainingSessions[0];
              setSessions(remainingSessions);
              setCurrentSession(nextSession);
              setEditingSession(null);
              await loadSessionMessages(nextSession.id);
              return;
            }

            const newSession = await createChatbotSession();
            setSessions([newSession]);
            setCurrentSession(newSession);
            setEditingSession(null);
            setMessages([GREETING]);
          } catch (error) {
            setErrorMessage(getApiErrorMessage(error, '대화를 삭제하지 못했습니다.'));
          } finally {
            setIsCreatingSession(false);
          }
        },
      },
    ]);
  };

  const beginTitleEdit = (session: ChatbotSession) => {
    setEditingSession(session);
    setEditingTitle(session.title || '새 대화');
  };

  const handleUpdateTitle = async () => {
    const session = editingSession;
    const title = editingTitle.trim();
    if (!session || !title || isUpdatingTitle) {
      return;
    }

    setIsUpdatingTitle(true);
    setErrorMessage(null);

    try {
      const data = await updateChatbotSessionTitle(session.id, { title });
      const nextSession = { ...session, title: data.title };
      setSessions((prev) =>
        prev.map((item) => (item.id === session.id ? { ...item, title: data.title } : item))
      );
      if (currentSession?.id === session.id) {
        setCurrentSession(nextSession);
      }
      setEditingSession(null);
      setEditingTitle('');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '제목을 변경하지 못했습니다.'));
    } finally {
      setIsUpdatingTitle(false);
    }
  };

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending) {
      return;
    }

    setInputText('');
    setIsSending(true);
    setErrorMessage(null);

    const optimisticMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const session = currentSession ?? (await createChatbotSession());
      if (!currentSession) {
        setCurrentSession(session);
        setSessions((prev) => [session, ...prev.filter((item) => item.id !== session.id)]);
      }

      const coordinate = await getCurrentCoordinate();
      const data = await sendChatbotMessage(session.id, {
        message: trimmed,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
      });

      setCurrentSession(data.session);
      setSessions((prev) => [
        data.session,
        ...prev.filter((item) => item.id !== data.session.id),
      ]);
      setMessages((prev) => [
        ...prev.filter((message) => message.id !== optimisticMessage.id),
        ...sortMessages(data.messages),
      ]);
    } catch (error) {
      setMessages((prev) => prev.filter((message) => message.id !== optimisticMessage.id));
      setErrorMessage(getApiErrorMessage(error, '메시지를 전송하지 못했습니다.'));
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyMessage = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 1400);
    } catch {}
  };

  useEffect(() => {
    loadInitialSession();
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, keyboardHeight]);

  // Edge-to-edge Android ignores adjustResize for the IME, so KeyboardAvoidingView
  // can't lift the input. Track the keyboard height ourselves and pad the bar up.
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
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
      <AppBar
        title="제보 도우미"
        logo={false}
        right={
          <View style={styles.headerActions}>
            <Pressable
              onPress={handleCreateSession}
              disabled={isCreatingSession}
              hitSlop={8}
              accessibilityLabel="새 대화"
            >
              <Icon name="plus" size={21} color={colors.body} />
            </Pressable>
            <Pressable
              onPress={handleDeleteCurrentSession}
              disabled={!currentSession || isCreatingSession}
              hitSlop={8}
              accessibilityLabel="대화 삭제"
            >
              <Icon name="x" size={20} color={currentSession ? colors.body : colors.faint} />
            </Pressable>
          </View>
        }
      />

      <View style={styles.sessionBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sessionList}
        >
          {sessions.map((session) => {
            const selected = currentSession?.id === session.id;
            return (
              <Pressable
                key={session.id}
                onPress={() => {
                  if (selected) {
                    beginTitleEdit(session);
                    return;
                  }
                  void selectSession(session);
                }}
                onLongPress={() => beginTitleEdit(session)}
                accessibilityRole="button"
                accessibilityLabel={selected ? '챗봇 제목 변경' : '챗봇 세션 열기'}
                style={[styles.sessionChip, selected && styles.sessionChipSelected]}
              >
                <AppText
                  numberOfLines={1}
                  style={[styles.sessionChipText, selected && styles.sessionChipTextSelected]}
                >
                  {session.title || '새 대화'}
                </AppText>
              </Pressable>
            );
          })}
        </ScrollView>
        {editingSession ? (
          <View style={styles.titleEditor}>
            <TextInput
              value={editingTitle}
              onChangeText={setEditingTitle}
              maxLength={10}
              placeholder="제목 입력"
              placeholderTextColor={colors.faint}
              style={styles.titleInput}
              returnKeyType="done"
              onSubmitEditing={handleUpdateTitle}
            />
            <Pressable
              onPress={() => {
                setEditingSession(null);
                setEditingTitle('');
              }}
              style={styles.titleGhostButton}
            >
              <AppText style={styles.titleGhostText}>취소</AppText>
            </Pressable>
            <Pressable
              onPress={handleUpdateTitle}
              disabled={!editingTitle.trim() || isUpdatingTitle}
              style={[
                styles.titleSaveButton,
                (!editingTitle.trim() || isUpdatingTitle) && styles.titleSaveButtonDisabled,
              ]}
            >
              <AppText style={styles.titleSaveText}>
                {isUpdatingTitle ? '저장 중' : '저장'}
              </AppText>
            </Pressable>
          </View>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.brand} />
          <AppText style={styles.centerText}>챗봇을 준비하고 있어요.</AppText>
        </View>
      ) : (
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
          {isSending ? (
            <View style={styles.typingRow}>
              <ActivityIndicator size="small" color={colors.brand} />
              <AppText style={styles.typingText}>답변을 작성하고 있어요.</AppText>
            </View>
          ) : null}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <AppText style={styles.errorText}>{errorMessage}</AppText>
            </View>
          ) : null}
        </ScrollView>
      )}

      <View
        style={[
          styles.inputBar,
          // Keyboard height excludes the bottom nav-bar inset under edge-to-edge,
          // so add it back to fully clear the keyboard.
          { marginBottom: keyboardHeight > 0 ? keyboardHeight + insets.bottom : 0 },
        ]}
      >
        <Pressable style={styles.cameraButton} accessibilityLabel="사진 첨부">
          <Icon name="camera" size={21} color={colors.faint} />
        </Pressable>
        <View style={styles.inputPill}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="메시지를 입력하세요"
            placeholderTextColor={colors.faint}
            style={styles.input}
            returnKeyType="send"
            editable={!isLoading && !isSending}
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading || isSending}
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading || isSending) && styles.sendButtonDisabled,
            ]}
            accessibilityLabel="전송"
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Icon name="send" size={18} color={colors.white} fill />
            )}
          </Pressable>
        </View>
      </View>

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
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  sessionBar: {
    backgroundColor: colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  sessionList: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  sessionChip: {
    maxWidth: 132,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.soft,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sessionChipSelected: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  sessionChipText: {
    fontFamily: fonts.semibold,
    fontSize: 12.5,
    color: colors.muted,
  },
  sessionChipTextSelected: { color: colors.brand },
  titleEditor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  titleInput: {
    flex: 1,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.soft,
    paddingHorizontal: 12,
    fontFamily: fonts.regular,
    fontSize: 13.5,
    color: colors.ink,
  },
  titleGhostButton: {
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  titleGhostText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  titleSaveButton: {
    height: 38,
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    paddingHorizontal: 13,
  },
  titleSaveButtonDisabled: { opacity: 0.45 },
  titleSaveText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.white },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  centerText: { fontSize: 14, color: colors.muted },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 },
  typingRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typingText: { fontSize: 13, color: colors.muted },
  errorBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  errorText: { fontSize: 13.5, lineHeight: 20, color: colors.danger },

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
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputPill: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.canvas,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingLeft: 16,
    paddingRight: 6,
    gap: 8,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14.5,
    color: colors.ink,
    paddingVertical: 0,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { opacity: 0.4 },

  toastWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 90,
    alignItems: 'center',
    zIndex: 20,
  },
  toast: {
    backgroundColor: 'rgba(24,29,38,0.92)',
    borderRadius: radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  toastText: { fontFamily: fonts.semibold, color: colors.white, fontSize: 14 },
});
