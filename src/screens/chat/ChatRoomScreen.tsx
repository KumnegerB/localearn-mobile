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
} from 'react-native';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';

export const ChatRoomScreen = ({ route }: any) => {
  const { taskId, taskTitle, otherUser } = route.params;
  const [inputText, setInputText] = useState('');
  const {
    messages,
    fetchMessages,
    connectWebSocket,
    disconnectWebSocket,
    sendMessage,
    setActiveChatRoom,
    fetchConversations,
  } = useChatStore();
  const { user, token } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (otherUser?.id) {
      setActiveChatRoom({ taskId, otherUserId: otherUser.id });
      fetchMessages(taskId, otherUser.id);
      if (token) {
        connectWebSocket(taskId, otherUser.id, token);
      }
    }

    return () => {
      disconnectWebSocket();
      setActiveChatRoom(null);
      if (user?.id) {
        fetchConversations(user.id);
      }
    };
  }, [taskId, otherUser?.id, token]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      style={styles.container}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={styles.messageList}
        renderItem={({ item }) => {
          const isMe = item.sender_id === user?.id;
          return (
            <View style={[styles.bubbleWrapper, isMe ? styles.myBubbleWrapper : styles.otherBubbleWrapper]}>
              {!isMe && (
                <Text style={styles.senderName}>{item.sender?.full_name || 'Neighbor'}</Text>
              )}
              <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
                <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
                  {item.content}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  messageList: {
    padding: 16,
    paddingBottom: 20,
  },
  bubbleWrapper: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  myBubbleWrapper: {
    alignSelf: 'flex-end',
  },
  otherBubbleWrapper: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
    marginLeft: 4,
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  myBubble: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#e2e8f0',
    borderBottomLeftRadius: 4,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#2563eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});

