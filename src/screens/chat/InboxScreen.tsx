import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import { User } from '../../types';

export const InboxScreen = ({ navigation }: any) => {
  const { conversations, fetchConversations, isLoading, markConversationAsRead } = useChatStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [userResults, setUserResults] = useState<User[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchConversations(user.id);
      }
    }, [user?.id])
  );

  const onRefresh = async () => {
    if (user?.id) {
      setRefreshing(true);
      await fetchConversations(user.id);
      setRefreshing(false);
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Deduplicate strictly by other_user.id to guarantee only one chat thread per user
  const uniqueConversations = useMemo(() => {
    const seen = new Set<number>();
    return conversations.filter((c) => {
      if (!c.other_user?.id || seen.has(c.other_user.id)) return false;
      seen.add(c.other_user.id);
      return true;
    });
  }, [conversations]);

  // Search input handler with 300ms debounce
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const trimmed = val.trim();

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!trimmed) {
      setUserResults([]);
      setIsSearchingUsers(false);
      return;
    }

    setIsSearchingUsers(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const cleanQ = trimmed.replace(/^@/, '');
        const res = await apiClient.get<User[]>('/users/search', {
          params: { q: cleanQ },
        });
        setUserResults(res.data);
      } catch (err) {
        console.error('Failed to search users:', err);
        setUserResults([]);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setUserResults([]);
    setIsSearchingUsers(false);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  // Filter existing conversations by name or @username
  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase().replace(/^@/, '');
    if (!q) return uniqueConversations;
    return uniqueConversations.filter((c) => {
      const name = c.other_user.full_name?.toLowerCase() || '';
      const username = c.other_user.username?.toLowerCase() || '';
      const lastMsg = c.last_message.content?.toLowerCase() || '';
      return name.includes(q) || username.includes(q) || lastMsg.includes(q);
    });
  }, [uniqueConversations, searchQuery]);

  // Global user search results, excluding users who already have an active conversation displayed
  const distinctUserResults = useMemo(() => {
    const convUserIds = new Set(filteredConversations.map((c) => c.other_user.id));
    return userResults.filter((u) => !convUserIds.has(u.id) && u.id !== user?.id);
  }, [userResults, filteredConversations, user?.id]);

  // Open chat with a user
  const handleOpenUserChat = (targetUser: User) => {
    const existing = uniqueConversations.find((c) => c.other_user.id === targetUser.id);
    if (existing) {
      markConversationAsRead(existing.task_id, existing.other_user.id);
      navigation.navigate('ChatRoom', {
        taskId: existing.task_id,
        taskTitle: existing.task_title,
        otherUser: existing.other_user,
      });
    } else {
      markConversationAsRead(0, targetUser.id);
      navigation.navigate('ChatRoom', {
        taskId: 0,
        taskTitle: 'Direct Message',
        otherUser: targetUser,
      });
    }
  };

  // If guest / unauthenticated, show a clean guest card
  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.guestContainer}>
          <View style={styles.guestIconBox}>
            <Ionicons name="chatbubbles-outline" size={54} color="#103B31" />
          </View>
          <Text style={styles.guestTitle}>Sign in to view messages</Text>
          <Text style={styles.guestSubtitle}>
            Direct 1-on-1 messaging unlocks when you coordinate gigs with neighbors.
          </Text>
          <TouchableOpacity
            style={styles.guestSignInBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.guestSignInBtnText}>Sign In / Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isSearching = searchQuery.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Search Header Bar */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by @username or name..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
            cursorColor="#103B31"
            selectionColor="#cce3de"
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ) : isSearchingUsers ? (
            <ActivityIndicator size="small" color="#103B31" />
          ) : null}
        </View>
      </View>

      {/* Main Content Area */}
      {isSearching ? (
        /* SEARCH MODE */
        <ScrollView
          contentContainerStyle={styles.searchScrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Section 1: Matching Conversations */}
          {filteredConversations.length > 0 && (
            <View style={styles.searchSection}>
              <Text style={styles.sectionTitle}>
                CONVERSATIONS ({filteredConversations.length})
              </Text>
              {filteredConversations.map((item) => (
                <TouchableOpacity
                  key={`conv-${item.other_user.id}`}
                  style={styles.conversationCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    markConversationAsRead(item.task_id, item.other_user.id);
                    navigation.navigate('ChatRoom', {
                      taskId: item.task_id,
                      taskTitle: item.task_title,
                      otherUser: item.other_user,
                    });
                  }}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {item.other_user.full_name?.charAt(0) || 'U'}
                    </Text>
                  </View>

                  <View style={styles.contentCol}>
                    <View style={styles.rowTop}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Text style={styles.userName} numberOfLines={1}>
                          {item.other_user.full_name}
                        </Text>
                        {item.other_user.username && (
                          <Text style={styles.userHandleText} numberOfLines={1}>
                            @{item.other_user.username}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.timeText}>
                        {formatTime(item.last_message.created_at)}
                      </Text>
                    </View>

                    <View style={styles.taskTagRow}>
                      <Ionicons name="briefcase-outline" size={12} color="#103B31" style={{ marginRight: 4 }} />
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
              ))}
            </View>
          )}

          {/* Section 2: Global Sira Users Search Results */}
          {distinctUserResults.length > 0 && (
            <View style={styles.searchSection}>
              <Text style={styles.sectionTitle}>
                USERS ON SIRA ({distinctUserResults.length})
              </Text>
              {distinctUserResults.map((u) => (
                <TouchableOpacity
                  key={`user-${u.id}`}
                  style={styles.userResultCard}
                  activeOpacity={0.7}
                  onPress={() => handleOpenUserChat(u)}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {u.full_name?.charAt(0) || 'U'}
                    </Text>
                  </View>

                  <View style={styles.contentCol}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {u.full_name}
                    </Text>
                    {u.username ? (
                      <Text style={styles.userHandleText}>@{u.username}</Text>
                    ) : (
                      <Text style={styles.userSubtitle}>Member</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.messageUserBtn}
                    onPress={() => handleOpenUserChat(u)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={15} color="#ffffff" style={{ marginRight: 4 }} />
                    <Text style={styles.messageUserBtnText}>Message</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Empty Search State */}
          {!isSearchingUsers &&
            filteredConversations.length === 0 &&
            distinctUserResults.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No users found</Text>
                <Text style={styles.emptySubtitle}>
                  We couldn't find anyone with the handle or name "{searchQuery}".
                </Text>
              </View>
            )}

          {isSearchingUsers && (
            <View style={styles.searchLoadingBox}>
              <ActivityIndicator size="small" color="#103B31" />
              <Text style={styles.searchLoadingText}>Searching Sira users...</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        /* NORMAL CONVERSATIONS LIST */
        isLoading && !refreshing && uniqueConversations.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#103B31" />
          </View>
        ) : (
          <FlatList
            data={uniqueConversations}
            keyExtractor={(item) => item.other_user.id.toString()}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.conversationCard}
                activeOpacity={0.7}
                onPress={() => {
                  markConversationAsRead(item.task_id, item.other_user.id);
                  navigation.navigate('ChatRoom', {
                    taskId: item.task_id,
                    taskTitle: item.task_title,
                    otherUser: item.other_user,
                  });
                }}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.other_user.full_name?.charAt(0) || 'U'}
                  </Text>
                </View>

                <View style={styles.contentCol}>
                  <View style={styles.rowTop}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {item.other_user.full_name}
                      </Text>
                      {item.other_user.username && (
                        <Text style={styles.userHandleText} numberOfLines={1}>
                          @{item.other_user.username}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.timeText}>
                      {formatTime(item.last_message.created_at)}
                    </Text>
                  </View>

                  <View style={styles.taskTagRow}>
                    <Ionicons name="briefcase-outline" size={12} color="#103B31" style={{ marginRight: 4 }} />
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
                    Search by @username above or coordinate gigs with neighbors to chat here.
                  </Text>
                </View>
              ) : undefined
            }
          />
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 0,
  },
  searchScrollContent: {
    padding: 16,
    paddingBottom: 130,
  },
  searchSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 2,
  },
  userResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  userSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
  },
  messageUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#103B31',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  messageUserBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  searchLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  searchLoadingText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#64748b',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 130,
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
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#103B31',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
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
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginRight: 6,
  },
  userHandleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#103B31',
  },
  timeText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  taskTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  taskTitleTag: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  rowBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
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
    backgroundColor: '#FF6B3D',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginTop: 14,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  guestIconBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#e8f3ef',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  guestSignInBtn: {
    backgroundColor: '#103B31',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  guestSignInBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
