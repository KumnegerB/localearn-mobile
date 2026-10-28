import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';

export const ChatRoomScreen = ({ route, navigation }: any) => {
  const { taskId, taskTitle, otherUser } = route.params || {};
  const [inputText, setInputText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const {
    messages,
    fetchMessages,
    connectWebSocket,
    disconnectWebSocket,
    sendMessage,
    setActiveChatRoom,
    fetchConversations,
    markConversationAsRead,
    clearMessages,
  } = useChatStore();
  const { user, token } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    let isMounted = true;
    if (otherUser?.id) {
      const initialCached = useChatStore.getState().getRoomMessages(taskId, otherUser.id);
      // Instant SWR: if cached messages exist, display immediately with 0ms delay!
      setLoadingMessages(initialCached.length === 0);
      setActiveChatRoom({ taskId, otherUserId: otherUser.id });
      fetchMessages(taskId, otherUser.id).finally(() => {
        if (isMounted) {
          setLoadingMessages(false);
        }
      });
      if (token) {
        connectWebSocket(taskId, otherUser.id, token);
      }
    }

    return () => {
      isMounted = false;
      disconnectWebSocket();
      if (otherUser?.id) {
        markConversationAsRead(taskId, otherUser.id);
      }
      clearMessages();
      setActiveChatRoom(null);
      if (user?.id) {
        setTimeout(() => {
          fetchConversations(user.id);
        }, 200);
      }
    };
  }, [taskId, otherUser?.id, token]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText.trim(), {
      receiverId: otherUser?.id,
      taskId: taskId ?? 0,
    });
    setInputText('');
  };

  const otherUserName = otherUser?.full_name || 'Neighbor';
  const initials = otherUser?.full_name
    ? otherUser.full_name
        .trim()
        .split(/\s+/)
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const formatMessageTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screenWrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Telegram-style Top Header */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerProfileTouchable}
            activeOpacity={0.7}
            onPress={() => {
              if (otherUser?.id) {
                navigation.navigate('UserProfile', {
                  userId: otherUser.id,
                  user: otherUser,
                  taskId,
                  taskTitle,
                });
              }
            }}
          >
            <View style={styles.avatarWrapper}>
              {otherUser?.avatar_url ? (
                <Image source={{ uri: otherUser.avatar_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              )}
              <View style={styles.onlineBadge} />
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.headerName} numberOfLines={1}>
                {otherUserName}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {taskTitle ? `Gig: ${taskTitle}` : 'Active now'}
              </Text>
            </View>
          </TouchableOpacity>

          {taskId ? (
            <TouchableOpacity
              style={styles.taskDetailButton}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('TaskDetail', { taskId })}
            >
              <Ionicons name="briefcase-outline" size={19} color="#103B31" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 38 }} />
          )}
        </View>
      </View>

      {/* Messages List & Input Container */}
      <View style={styles.container}>
        {loadingMessages ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#103B31" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id.toString()}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            contentContainerStyle={styles.messageList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyAvatar}>
                  <Text style={styles.emptyAvatarText}>{initials}</Text>
                </View>
                <Text style={styles.emptyTitle}>Chat with {otherUserName}</Text>
                <Text style={styles.emptySubtitle}>
                  {taskTitle
                    ? `Discuss details, timing, and requirements for "${taskTitle}".`
                    : 'Send a message to get started!'}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isMe = item.sender_id === user?.id;
              return (
                <View
                  style={[
                    styles.bubbleWrapper,
                    isMe ? styles.myBubbleWrapper : styles.otherBubbleWrapper,
                  ]}
                >
                  {!isMe && (
                    <Text style={styles.senderName}>{item.sender?.full_name || otherUserName}</Text>
                  )}
                  <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
                    <Text
                      style={[
                        styles.messageText,
                        isMe ? styles.myMessageText : styles.otherMessageText,
                      ]}
                    >
                      {item.content}
                    </Text>
                    <Text style={[styles.timeText, isMe ? styles.myTimeText : styles.otherTimeText]}>
                      {formatMessageTime(item.created_at)}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        <View style={[styles.inputContainer, { paddingBottom: isKeyboardVisible ? 10 : Math.max(insets.bottom, 12) }]}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#94a3b8"
            value={inputText}
            onChangeText={setInputText}
            multiline
            cursorColor="#103B31"
            selectionColor="#cce3de"
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={17} color="#ffffff" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 8,
  },
  backButton: {
    padding: 6,
    borderRadius: 20,
  },
  headerProfileTouchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#103B31',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  taskDetailButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f2f7f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d2e3dc',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  messageList: {
    padding: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
  },
  emptyAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f2f7f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#d2e3dc',
    marginBottom: 14,
  },
  emptyAvatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#103B31',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  bubbleWrapper: {
    marginBottom: 10,
    maxWidth: '82%',
  },
  myBubbleWrapper: {
    alignSelf: 'flex-end',
  },
  otherBubbleWrapper: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#103B31',
    marginBottom: 3,
    marginLeft: 6,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  myBubble: {
    backgroundColor: '#103B31',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#0f172a',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimeText: {
    color: '#94a3b8',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 9,
    fontSize: 15,
    maxHeight: 100,
    color: '#0f172a',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#103B31',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
});
