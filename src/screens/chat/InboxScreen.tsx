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
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useChatStore } from '../../store/useChatStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import { User, Conversation } from '../../types';
import { useTranslation } from '../../i18n';

export const InboxScreen = ({ navigation }: any) => {
  const { conversations, fetchConversations, isLoading, markConversationAsRead } = useChatStore();
  const { user } = useAuthStore();
  const { language } = useTranslation();
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

  const getInitials = (fullName?: string) => {
    if (!fullName) return 'U';
    return fullName
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

      if (isYesterday) {
        return 'Yesterday';
      }

      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
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

  const renderConversationItem = (item: Conversation) => {
    const isMyLastMessage = item.last_message?.sender_id === user?.id;
    const isSeen = Boolean(item.last_message?.is_read);
    const showSeen = isMyLastMessage && isSeen;

    return (
      <TouchableOpacity
        key={`conv-${item.other_user.id}`}
        style={styles.conversationRow}
        activeOpacity={0.65}
        onPress={() => {
          markConversationAsRead(item.task_id, item.other_user.id);
          navigation.navigate('ChatRoom', {
            taskId: item.task_id,
            taskTitle: item.task_title,
            otherUser: item.other_user,
          });
        }}
      >
        <View style={styles.avatarWrapper}>
          {item.other_user.avatar_url ? (
            <Image source={{ uri: item.other_user.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {getInitials(item.other_user.full_name)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.contentCol}>
          <View style={styles.rowTop}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.other_user.full_name}
              </Text>
              {Boolean(item.other_user.username) ? (
                <Text style={styles.userHandleText} numberOfLines={1}>
                  @{item.other_user.username}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.timeText, item.unread_count > 0 && styles.unreadTimeText]}>
              {formatTime(item.last_message.created_at)}
            </Text>
          </View>

          {item.task_title && item.task_title !== 'Direct Message' ? (
            <View style={styles.taskTagRow}>
              <Ionicons name="briefcase-outline" size={11} color="#103B31" style={{ marginRight: 3 }} />
              <Text style={styles.taskTitleTag} numberOfLines={1}>
                {item.task_title}
              </Text>
            </View>
          ) : null}

          <View style={styles.rowBottom}>
            <Text
              style={[
                styles.lastMessageText,
                item.unread_count > 0 && styles.unreadLastMessageText,
              ]}
              numberOfLines={1}
            >
              {isMyLastMessage
                ? `${language === 'am' ? 'እርስዎ: ' : 'You: '}${item.last_message.content}`
                : item.last_message.content}
            </Text>
            {item.unread_count > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {item.unread_count > 99 ? '99+' : item.unread_count}
                </Text>
              </View>
            ) : showSeen ? (
              <View style={styles.seenBadge}>
                <Ionicons name="checkmark-done" size={12} color="#64748b" style={{ marginRight: 2 }} />
                <Text style={styles.seenBadgeText}>
                  {language === 'am' ? 'የታየ' : 'Seen'}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
        /* SEARCH MODE - Telegram Flat Style */
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
              {filteredConversations.map((item, idx) => (
                <React.Fragment key={`search-conv-${item.other_user.id}`}>
                  {idx > 0 && <View style={styles.separator} />}
                  {renderConversationItem(item)}
                </React.Fragment>
              ))}
            </View>
          )}

          {/* Section 2: Global Sira Users Search Results */}
          {distinctUserResults.length > 0 && (
            <View style={styles.searchSection}>
              <Text style={styles.sectionTitle}>
                USERS ON SIRA ({distinctUserResults.length})
              </Text>
              {distinctUserResults.map((u, idx) => (
                <React.Fragment key={`user-${u.id}`}>
                  {idx > 0 && <View style={styles.separator} />}
                  <TouchableOpacity
                    style={styles.conversationRow}
                    activeOpacity={0.65}
                    onPress={() => handleOpenUserChat(u)}
                  >
                    <View style={styles.avatarWrapper}>
                      {u.avatar_url ? (
                        <Image source={{ uri: u.avatar_url }} style={styles.avatarImage} />
                      ) : (
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>{getInitials(u.full_name)}</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.contentCol}>
                      <View style={styles.rowTop}>
                        <View style={styles.nameRow}>
                          <Text style={styles.userName} numberOfLines={1}>
                            {u.full_name}
                          </Text>
                          {Boolean(u.username) ? (
                            <Text style={styles.userHandleText} numberOfLines={1}>
                              @{u.username}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      <View style={styles.rowBottom}>
                        <Text style={styles.lastMessageText} numberOfLines={1}>
                          {u.bio || u.skills || 'Tap to message'}
                        </Text>
                        <View style={styles.messageUserPill}>
                          <Ionicons name="chatbubble-ellipses-outline" size={13} color="#103B31" style={{ marginRight: 3 }} />
                          <Text style={styles.messageUserPillText}>Chat</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </React.Fragment>
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
        /* NORMAL CONVERSATIONS LIST - Telegram Flat Style (No gap, edge-to-edge) */
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
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => renderConversationItem(item)}
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
    backgroundColor: '#ffffff',
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    color: '#0f172a',
    paddingVertical: 0,
  },
  searchScrollContent: {
    paddingTop: 0,
    paddingBottom: 130,
  },
  searchSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    backgroundColor: '#f8fafc',
    textTransform: 'uppercase',
  },
  messageUserPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f3ef',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 8,
  },
  messageUserPillText: {
    color: '#103B31',
    fontSize: 12,
    fontWeight: '700',
  },
  searchLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
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
    paddingBottom: 130,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarWrapper: {
    marginRight: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#103B31',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  contentCol: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginRight: 6,
  },
  userHandleText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  timeText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '400',
  },
  unreadTimeText: {
    color: '#103B31',
    fontWeight: '700',
  },
  taskTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  taskTitleTag: {
    fontSize: 11.5,
    color: '#103B31',
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
    lineHeight: 18,
  },
  unreadLastMessageText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#103B31',
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
  seenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  seenBadgeText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#f1f5f9',
    marginLeft: 82, // Aligns precisely with start of text after avatar
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
