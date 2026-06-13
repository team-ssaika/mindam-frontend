import axios from 'axios';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar, AppText, ChatBubble, Icon } from '../../src/components/ui';
import { useTabBarMetrics } from '../../src/hooks/useTabBarMetrics';
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
import { colors, fontSize, fonts, radius, shadow, spacing } from '../../src/theme';

type ChatMessage = {
  id: string;
  role: 'user' | 'bot';
  text: string;
};

type LatLng = {
  latitude: number;
  longitude: number;
};

type HeaderMenuPosition = {
  top: number;
  left: number;
};

const GREETING: ChatMessage = {
  id: 'bot-initial',
  role: 'bot',
  text: '안녕하세요. 무엇을 도와드릴까요?\n주변 신고 확인이나 내 신고 현황에 대해 물어보세요.',
};

const REPORT_BUTTON_OVERLAP = 24;
const INPUT_ROW_HEIGHT = 44;
const INPUT_BAR_TOP_PADDING = 8;

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

function formatSessionTitle(session: ChatbotSession | null) {
  return session?.title?.trim() || '새 대화';
}

function MoreDots() {
  return (
    <View style={styles.moreDots} pointerEvents="none">
      <View style={styles.moreDot} />
      <View style={styles.moreDot} />
      <View style={styles.moreDot} />
    </View>
  );
}

export default function Chatbot() {
  const insets = useSafeAreaInsets();
  const tabBarMetrics = useTabBarMetrics();
  const { width: windowWidth } = useWindowDimensions();
  const panelWidth = windowWidth * 0.65;
  const [inputText, setInputText] = useState('');
  const [sessions, setSessions] = useState<ChatbotSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatbotSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isUpdatingTitle, setIsUpdatingTitle] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [actionSessionId, setActionSessionId] = useState<number | null>(null);
  const [editingSession, setEditingSession] = useState<ChatbotSession | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [headerMenuPosition, setHeaderMenuPosition] = useState<HeaderMenuPosition | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);
  const panelProgress = useRef(new Animated.Value(0)).current;
  const inputBarTranslateY = useRef(new Animated.Value(0)).current;
  const isHeaderMenuOpen =
    Boolean(currentSession) && !isPanelOpen && actionSessionId === currentSession?.id;
  const isEditingCurrentSession =
    Boolean(currentSession) && !isPanelOpen && editingSession?.id === currentSession?.id;
  const hasOpenActionMenu = actionSessionId !== null;

  const scrollToEnd = () => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const dismissActionMenu = useCallback(() => {
    setActionSessionId(null);
    setHeaderMenuPosition(null);
  }, []);

  const refreshSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const sessionPage = await fetchChatbotSessions({ page: 0, size: 20 });
      const nextSessions = Array.isArray(sessionPage.contents) ? sessionPage.contents : [];
      setSessions(nextSessions);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '대화 목록을 불러오지 못했습니다.'));
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  const closePanel = useCallback(() => {
    panelProgress.stopAnimation();
    Animated.timing(panelProgress, {
      toValue: 0,
      duration: 210,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setIsPanelOpen(false);
        setActionSessionId(null);
        setHeaderMenuPosition(null);
        setEditingSession(null);
      }
    });
  }, [panelProgress]);

  const openPanel = useCallback(() => {
    Keyboard.dismiss();
    setIsPanelOpen(true);
    panelProgress.stopAnimation();
    panelProgress.setValue(0);
    requestAnimationFrame(() => {
      Animated.timing(panelProgress, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [panelProgress]);

  const resetToFreshChat = useCallback(() => {
    Keyboard.dismiss();
    setCurrentSession(null);
    setMessages([GREETING]);
    setInputText('');
    setErrorMessage(null);
    setEditingSession(null);
    setEditingTitle('');
    setActionSessionId(null);
    setHeaderMenuPosition(null);
    setIsPanelOpen(false);
    panelProgress.setValue(0);
  }, [panelProgress]);

  const setSessionMessages = (apiMessages: ApiChatbotMessage[]) => {
    const nextMessages = sortMessages(apiMessages);
    setMessages(nextMessages.length > 0 ? nextMessages : [GREETING]);
  };

  const loadSessionMessages = async (sessionId: number) => {
    const data = await fetchChatbotMessages(sessionId, { size: 50 });
    setSessionMessages(data.content);
  };

  const selectSession = async (session: ChatbotSession) => {
    Keyboard.dismiss();
    closePanel();
    setActionSessionId(null);
    setEditingSession(null);
    setErrorMessage(null);
    setCurrentSession(session);
    setMessages([GREETING]);

    try {
      await loadSessionMessages(session.id);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '채팅 내역을 불러오지 못했습니다.'));
    }
  };

  const handleCreateSession = () => {
    Keyboard.dismiss();
    setCurrentSession(null);
    setMessages([GREETING]);
    setInputText('');
    setErrorMessage(null);
    setActionSessionId(null);
    setHeaderMenuPosition(null);
    setEditingSession(null);
    setEditingTitle('');
    setIsPanelOpen(false);
    panelProgress.setValue(0);
  };

  const beginTitleEdit = (session: ChatbotSession) => {
    setEditingSession(session);
    setEditingTitle(session.title || '새 대화');
    setActionSessionId(null);
    setHeaderMenuPosition(null);
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
      setActionSessionId(null);
      setHeaderMenuPosition(null);
      setEditingSession(null);
      setEditingTitle('');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '제목을 변경하지 못했습니다.'));
    } finally {
      setIsUpdatingTitle(false);
    }
  };

  const handleDeleteSession = (session: ChatbotSession) => {
    if (isCreatingSession) {
      return;
    }

    Alert.alert('대화 삭제', '선택한 챗봇 대화를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          setIsCreatingSession(true);
          setErrorMessage(null);

          try {
            await deleteChatbotSession(session.id);
            setSessions((prev) => prev.filter((item) => item.id !== session.id));
            setActionSessionId(null);
            if (currentSession?.id === session.id) {
              setCurrentSession(null);
              setMessages([GREETING]);
            }
          } catch (error) {
            setErrorMessage(getApiErrorMessage(error, '대화를 삭제하지 못했습니다.'));
          } finally {
            setIsCreatingSession(false);
          }
        },
      },
    ]);
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

      const updatedResponseSession = data.session;
      if (updatedResponseSession) {
        setCurrentSession(updatedResponseSession);
        setSessions((prev) => [
          updatedResponseSession,
          ...prev.filter((item) => item.id !== updatedResponseSession.id),
        ]);
      }

      if (data.messages?.length) {
        setMessages((prev) => [
          ...prev.filter((message) => message.id !== optimisticMessage.id),
          ...sortMessages(data.messages ?? []),
        ]);
        return;
      }

      const botMessage: ChatMessage = {
        id: `bot-${session.id}-${Date.now()}`,
        role: 'bot',
        text: data.answer,
      };
      setMessages((prev) => [...prev, botMessage]);

      void refreshSessions();
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

  useFocusEffect(
    useCallback(() => {
      resetToFreshChat();
      void refreshSessions();
    }, [refreshSessions, resetToFreshChat])
  );

  useEffect(() => {
    scrollToEnd();
  }, [messages, keyboardHeight]);

  // Edge-to-edge Android ignores adjustResize for the IME, so track the IME height.
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      const nextKeyboardHeight = event.endCoordinates?.height ?? 0;
      const duration = Math.max(event.duration ?? 250, 180);
      setKeyboardHeight(nextKeyboardHeight);
      Animated.timing(inputBarTranslateY, {
        toValue: -nextKeyboardHeight,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      Animated.timing(inputBarTranslateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setKeyboardHeight(0);
      });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [inputBarTranslateY]);

  const inputBarBottomPadding =
    keyboardHeight > 0 ? Math.max(insets.bottom, 12) : REPORT_BUTTON_OVERLAP;
  const inputAreaHeight = INPUT_BAR_TOP_PADDING + INPUT_ROW_HEIGHT + inputBarBottomPadding;
  const scrollBottomPadding =
    inputAreaHeight + spacing.lg + (keyboardHeight > 0 ? keyboardHeight : 0);

  return (
    <View style={styles.container}>
      <AppBar title="제보 도우미" logo={false} backgroundColor={colors.canvas} />

      <View
        style={styles.chatHeader}
        onTouchStart={() => {
          Keyboard.dismiss();
        }}
      >
        <Pressable
          onPress={openPanel}
          hitSlop={8}
          accessibilityLabel="대화 목록 열기"
          style={styles.headerIconButton}
        >
          <Icon name="list" size={23} color={colors.ink} strokeWidth={2.1} />
        </Pressable>

        <View style={styles.activeTitleWrap}>
          <Pressable
            onPress={() => {
              if (isHeaderMenuOpen) {
                dismissActionMenu();
              }
            }}
            style={styles.activeTitleButton}
          >
            <AppText numberOfLines={1} style={styles.activeTitle}>
              {formatSessionTitle(currentSession)}
            </AppText>
          </Pressable>
          <View style={styles.headerMoreWrap}>
            <Pressable
              onPress={(event) => {
                if (!currentSession) {
                  return;
                }

                const nextOpen = !isHeaderMenuOpen;
                if (!nextOpen) {
                  dismissActionMenu();
                  return;
                }

                setEditingSession(null);
                setActionSessionId(currentSession.id);
                setHeaderMenuPosition({
                  top: event.nativeEvent.pageY + 8,
                  left: Math.min(event.nativeEvent.pageX + 8, windowWidth - 136),
                });
              }}
              disabled={!currentSession}
              hitSlop={8}
              accessibilityLabel="현재 대화 메뉴"
              style={styles.headerMoreButton}
            >
              <MoreDots />
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={handleCreateSession}
          disabled={isCreatingSession}
          hitSlop={8}
          accessibilityLabel="새 대화"
          style={styles.headerIconButton}
        >
          {isCreatingSession ? (
            <ActivityIndicator size="small" color={colors.brand} />
          ) : (
            <Icon name="plus" size={23} color={colors.brandActive} strokeWidth={2.2} />
          )}
        </Pressable>
      </View>

      <Modal
        visible={isHeaderMenuOpen && Boolean(currentSession) && Boolean(headerMenuPosition)}
        transparent
        animationType="fade"
        onRequestClose={dismissActionMenu}
      >
        <View style={styles.headerMenuModalRoot}>
          <Pressable
            onPress={dismissActionMenu}
            accessibilityLabel="현재 대화 메뉴 닫기"
            style={styles.headerMenuDismissLayer}
          />
          {currentSession && headerMenuPosition ? (
            <View
              style={[
                styles.headerMenu,
                {
                  top: headerMenuPosition.top,
                  left: headerMenuPosition.left,
                },
              ]}
            >
              <Pressable
                onPress={() => beginTitleEdit(currentSession)}
                style={styles.itemMenuRow}
                accessibilityLabel="현재 대화 이름 변경"
              >
                <Icon name="doc" size={16} color={colors.body} />
                <AppText style={styles.itemMenuText}>이름 변경</AppText>
              </Pressable>
              <Pressable
                onPress={() => {
                  dismissActionMenu();
                  handleDeleteSession(currentSession);
                }}
                style={styles.itemMenuRow}
                accessibilityLabel="현재 대화 삭제"
              >
                <Icon name="x" size={16} color={colors.danger} />
                <AppText style={[styles.itemMenuText, styles.itemMenuDanger]}>삭제</AppText>
              </Pressable>
            </View>
          ) : null}
        </View>
      </Modal>

      {isEditingCurrentSession ? (
        <View style={styles.headerTitleEditor}>
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
          <View style={styles.editActions}>
            <Pressable
              onPress={() => {
                setEditingSession(null);
                setEditingTitle('');
              }}
              style={styles.editGhostButton}
            >
              <AppText style={styles.editGhostText}>취소</AppText>
            </Pressable>
            <Pressable
              onPress={handleUpdateTitle}
              disabled={!editingTitle.trim() || isUpdatingTitle}
              style={[
                styles.editSaveButton,
                (!editingTitle.trim() || isUpdatingTitle) && styles.editSaveButtonDisabled,
              ]}
            >
              <AppText style={styles.editSaveText}>
                {isUpdatingTitle ? '저장 중' : '저장'}
              </AppText>
            </Pressable>
          </View>
        </View>
      ) : null}

      <ScrollView
        ref={(ref) => {
          scrollRef.current = ref;
        }}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: scrollBottomPadding },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToEnd}
        onTouchStart={() => {
          Keyboard.dismiss();
          if (!isPanelOpen && hasOpenActionMenu) {
            dismissActionMenu();
          }
        }}
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

      <Animated.View
        onTouchStart={() => {
          if (!isPanelOpen && hasOpenActionMenu) {
            dismissActionMenu();
          }
        }}
        style={[
          styles.inputBar,
          {
            paddingBottom: inputBarBottomPadding,
            bottom: 0,
            transform: [{ translateY: inputBarTranslateY }],
          },
        ]}
      >
        <Pressable style={styles.cameraButton} accessibilityLabel="사진 첨부">
          <Icon name="camera" size={21} color={colors.body} />
        </Pressable>
        <View style={styles.inputPill}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="메시지를 입력하세요"
            placeholderTextColor={colors.faint}
            style={styles.input}
            returnKeyType="send"
            editable={!isSending}
            onFocus={() => {
              setTimeout(scrollToEnd, 120);
            }}
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled,
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
      </Animated.View>

      {isPanelOpen ? (
        <View style={styles.panelOverlay}>
          <Animated.View style={[styles.panelBackdrop, { opacity: panelProgress }]}>
            <Pressable
              onPress={closePanel}
              onTouchStart={() => {
                Keyboard.dismiss();
              }}
              accessibilityLabel="대화 목록 닫기"
              style={styles.panelBackdropTouch}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.panel,
              {
                width: panelWidth,
                paddingTop: insets.top + 18,
                transform: [
                  {
                    translateX: panelProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-panelWidth, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.panelHeader}>
              <AppText style={styles.logoText}>SSIREN</AppText>
              <Pressable
                onPress={closePanel}
                hitSlop={10}
                accessibilityLabel="대화 목록 닫기"
                style={styles.closeButton}
              >
                <Icon name="x" size={26} color={colors.ink} strokeWidth={2.1} />
              </Pressable>
            </View>

            <Pressable
              onPress={handleCreateSession}
              disabled={isCreatingSession}
              style={styles.newChatRow}
              accessibilityLabel="새 채팅"
            >
              <View style={styles.newChatIcon}>
                <Icon name="plus" size={20} color={colors.brandActive} strokeWidth={2.2} />
              </View>
              <AppText style={styles.newChatText}>새 채팅</AppText>
            </Pressable>

            <View style={styles.panelSectionTitleRow}>
              <AppText style={styles.panelSectionTitle}>내 대화</AppText>
              {isLoadingSessions ? <ActivityIndicator size="small" color={colors.brand} /> : null}
            </View>
            <View style={styles.panelDivider} />
            {isPanelOpen && hasOpenActionMenu ? (
              <Pressable
                onPress={dismissActionMenu}
                accessibilityLabel="대화 메뉴 닫기"
                style={styles.panelMenuDismissLayer}
              />
            ) : null}

            <View style={styles.sessionListFrame}>
              <ScrollView
                style={styles.sessionPanelList}
                contentContainerStyle={styles.sessionPanelContent}
                showsVerticalScrollIndicator
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                onScrollBeginDrag={() => {
                  Keyboard.dismiss();
                  if (hasOpenActionMenu) {
                    dismissActionMenu();
                  }
                }}
              >
                {sessions.length === 0 && !isLoadingSessions ? (
                  <View style={styles.emptySessions}>
                    <Icon name="chat" size={24} color={colors.faint} />
                    <AppText style={styles.emptyTitle}>저장된 대화가 없어요</AppText>
                    <AppText style={styles.emptyBody}>메시지를 보내면 새 대화가 만들어집니다.</AppText>
                  </View>
                ) : null}

                {sessions.map((session) => {
                  const selected = currentSession?.id === session.id;
                  const isEditing = editingSession?.id === session.id;
                  const isActionOpen = actionSessionId === session.id;

                  return (
                    <View key={session.id} style={styles.sessionItemWrap}>
                      {isEditing ? (
                        <View style={styles.editBox}>
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
                          <View style={styles.editActions}>
                            <Pressable
                              onPress={() => {
                                setEditingSession(null);
                                setEditingTitle('');
                              }}
                              style={styles.editGhostButton}
                            >
                              <AppText style={styles.editGhostText}>취소</AppText>
                            </Pressable>
                            <Pressable
                              onPress={handleUpdateTitle}
                              disabled={!editingTitle.trim() || isUpdatingTitle}
                              style={[
                                styles.editSaveButton,
                                (!editingTitle.trim() || isUpdatingTitle) &&
                                  styles.editSaveButtonDisabled,
                              ]}
                            >
                              <AppText style={styles.editSaveText}>
                                {isUpdatingTitle ? '저장 중' : '저장'}
                              </AppText>
                            </Pressable>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.sessionItem}>
                          <Pressable
                            onPress={() => void selectSession(session)}
                            style={styles.sessionTitleButton}
                            accessibilityLabel="대화 열기"
                          >
                            <AppText
                              numberOfLines={1}
                              style={[styles.sessionTitle, selected && styles.sessionTitleSelected]}
                            >
                              {session.title || '새 대화'}
                            </AppText>
                          </Pressable>
                          <Pressable
                            onPress={() => setActionSessionId(isActionOpen ? null : session.id)}
                            hitSlop={8}
                            accessibilityLabel="대화 메뉴"
                            style={[styles.itemMoreButton, isActionOpen && styles.itemMoreButtonActive]}
                          >
                            <MoreDots />
                          </Pressable>
                        </View>
                      )}

                      {isActionOpen ? (
                        <View style={styles.itemMenu}>
                          <Pressable
                            onPress={() => beginTitleEdit(session)}
                            style={styles.itemMenuRow}
                            accessibilityLabel="이름 변경"
                          >
                            <Icon name="doc" size={16} color={colors.body} />
                            <AppText style={styles.itemMenuText}>이름 변경</AppText>
                          </Pressable>
                          <Pressable
                            onPress={() => handleDeleteSession(session)}
                            style={styles.itemMenuRow}
                            accessibilityLabel="삭제"
                          >
                            <Icon name="x" size={16} color={colors.danger} />
                            <AppText style={[styles.itemMenuText, styles.itemMenuDanger]}>
                              삭제
                            </AppText>
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </Animated.View>
        </View>
      ) : null}

      {showCopyToast ? (
        <View style={[styles.toastWrapper, { bottom: tabBarMetrics.contentOffset + 86 }]} pointerEvents="none">
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
  chatHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    zIndex: 12,
  },
  headerIconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTitleWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  activeTitleButton: {
    flexShrink: 1,
    flexGrow: 0,
    minWidth: 0,
    maxWidth: '82%',
    justifyContent: 'center',
    height: 44,
  },
  activeTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  headerMoreButton: {
    width: 34,
    height: 44,
    marginLeft: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
  },
  headerMoreWrap: {
    position: 'relative',
    width: 34,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
  },
  headerMenuModalRoot: {
    flex: 1,
  },
  headerMenuDismissLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 6,
  },
  headerMenu: {
    position: 'absolute',
    zIndex: 40,
    minWidth: 118,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
    paddingVertical: spacing.xs,
    ...shadow.float,
  },
  headerTitleEditor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  moreDots: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  moreDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: colors.body,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['3xl'],
    gap: spacing.md,
  },
  typingRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  typingText: { fontSize: fontSize.xs, color: colors.muted },
  errorBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.md,
    paddingVertical: 11,
  },
  errorText: { fontSize: fontSize.sm, lineHeight: 20, color: colors.danger },
  inputBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: INPUT_BAR_TOP_PADDING,
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
    paddingLeft: spacing.lg,
    paddingRight: 6,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSize.mdLg,
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
  panelOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
  },
  panelBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 5, 5, 0.18)',
  },
  panelBackdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  panel: {
    flex: 1,
    height: '100%',
    backgroundColor: colors.canvas,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
    ...shadow.float,
  },
  panelMenuDismissLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  panelHeader: {
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoText: {
    fontFamily: fonts.bold,
    fontSize: fontSize['2xl'],
    color: colors.ink,
  },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatRow: {
    marginTop: spacing.lg,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  newChatIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xl,
    color: colors.ink,
  },
  panelSectionTitleRow: {
    marginTop: spacing['2xl'],
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelSectionTitle: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.ink,
  },
  panelDivider: {
    height: 1,
    backgroundColor: colors.hairline,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sessionListFrame: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  sessionPanelList: { flex: 1, minHeight: 0 },
  sessionPanelContent: { paddingBottom: spacing.md, gap: spacing.xs },
  emptySessions: {
    marginTop: spacing['3xl'],
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyTitle: {
    marginTop: spacing.xs,
    fontFamily: fonts.semibold,
    fontSize: fontSize.md,
    color: colors.body,
  },
  emptyBody: {
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  sessionItemWrap: {
    position: 'relative',
  },
  sessionItem: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionTitleButton: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingRight: spacing.xs,
    paddingVertical: spacing.sm,
  },
  sessionTitle: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.md,
    color: colors.body,
  },
  sessionTitleSelected: {
    color: colors.brandActive,
  },
  itemMoreButton: {
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemMoreButtonActive: {
    zIndex: 5,
  },
  itemMenu: {
    position: 'absolute',
    top: 42,
    right: 12,
    zIndex: 6,
    minWidth: 110,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.canvas,
    paddingVertical: spacing.xs,
    ...shadow.float,
  },
  itemMenuRow: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  itemMenuText: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.xs,
    color: colors.body,
  },
  itemMenuDanger: { color: colors.danger },
  editBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.brand,
    backgroundColor: colors.canvas,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  titleInput: {
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.soft,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    color: colors.ink,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  editGhostButton: {
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  editGhostText: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  editSaveButton: {
    height: 34,
    justifyContent: 'center',
    borderRadius: radius.sm,
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.md,
  },
  editSaveButtonDisabled: { opacity: 0.45 },
  editSaveText: {
    fontFamily: fonts.semibold,
    fontSize: fontSize.xs,
    color: colors.white,
  },
  toastWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 40,
  },
  toast: {
    backgroundColor: 'rgba(24,29,38,0.92)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: 11,
  },
  toastText: { fontFamily: fonts.semibold, color: colors.white, fontSize: fontSize.md },
});
