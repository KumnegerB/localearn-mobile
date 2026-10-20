import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

export const InboxScreen = ({ navigation }: any) => {
  const { conversations, fetchConversations, isLoading } = useChatStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchConversations(user?.id);
    }, [user?.id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations(user?.id);
    setRefreshing(false);
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      {isLoading && !refreshing && conversations.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => `${item.task_id}_${item.other_user.id}`}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.conversationCard}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('ChatRoom', {
                  taskId: item.task_id,
                  taskTitle: item.task_title,
                  otherUser: item.other_user,
                })
              }
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.other_user.full_name?.charAt(0) || 'U'}
                </Text>
              </View>

              <View style={styles.contentCol}>
                <View style={styles.rowTop}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {item.other_user.full_name}
                  </Text>
                  <Text style={styles.timeText}>
                    {formatTime(item.last_message.created_at)}
                  </Text>
                </View>

                <View style={styles.taskTagRow}>
                  <Ionicons name="briefcase-outline" size={12} color="#2563eb" style={{ marginRight: 4 }} />
                  <Text style={styles.taskTitleTag} numberOfLines={1}>
                    {item.task_title}
                  </Text>
                </View>

                <View style={styles.rowBottom}>
                  <Text
                    style={[
                      styles.lastMessageText,
                      item.unread_count > 0 && styles.unreadLastMessageText,
                    ]}
                    numberOfLines={1}
                  >
                    {item.last_message.content}
                  </Text>
                  {item.unread_count > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{item.unread_count}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={54} color="#94a3b8" />
                <Text style={styles.emptyTitle}>Your Inbox is Empty</Text>
                <Text style={styles.emptySubtitle}>
                  Private chats between you and job posters or candidates will be organized here.
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 110,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  contentCol: {
    flex: 1,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  taskTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskTitleTag: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageText: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
    marginRight: 8,
  },
  unreadLastMessageText: {
    color: '#0f172a',
    fontWeight: '700',
  },
  unreadBadge: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 70,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
  },
});

