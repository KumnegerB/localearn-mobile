import React, { useEffect, useState, useCallback } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useNotificationStore } from '../../store/useNotificationStore';
import { AppNotification } from '../../types';

export const NotificationScreen = ({ navigation }: any) => {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead, isLoading, unreadCount } =
    useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const now = new Date();
      const date = new Date(isoString);
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSec < 60) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  const getIconConfig = (type: string) => {
    switch (type) {
      case 'APPLICATION_ACCEPTED':
        return {
          name: 'checkmark-circle' as const,
          color: '#10b981',
          bg: '#ecfdf5',
        };
      case 'NEW_CANDIDATE':
        return {
          name: 'person-add' as const,
          color: '#2563eb',
          bg: '#eff6ff',
        };
      default:
        return {
          name: 'notifications' as const,
          color: '#103B31',
          bg: '#f2f7f5',
        };
    }
  };

  const handleNotificationPress = async (item: AppNotification) => {
    if (!item.is_read) {
      await markAsRead(item.id);
    }

    if (item.type === 'NEW_CANDIDATE' && item.task_id) {
      navigation.navigate('TaskCandidates', {
        taskId: item.task_id,
        taskTitle: 'Candidates',
      });
    } else if (item.task_id) {
      navigation.navigate('TaskDetail', {
        taskId: item.task_id,
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Action Header */}
      <View style={styles.headerBar}>
        <Text style={styles.headerSubtitle}>
          {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'All caught up'}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading && !refreshing && notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#103B31" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const iconConfig = getIconConfig(item.type);

            return (
              <TouchableOpacity
                style={[styles.card, !item.is_read && styles.unreadCard]}
                activeOpacity={0.7}
                onPress={() => handleNotificationPress(item)}
              >
                <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
                  <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
                </View>

                <View style={styles.contentCol}>
                  <View style={styles.rowTop}>
                    <Text style={[styles.title, !item.is_read && styles.unreadTitle]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.timeText}>{formatRelativeTime(item.created_at)}</Text>
                  </View>

                  <Text style={styles.message} numberOfLines={2}>
                    {item.message}
                  </Text>
                </View>

                {!item.is_read && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                  <Ionicons name="notifications-outline" size={48} color="#94a3b8" />
                </View>
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.emptySubtitle}>
                  When someone applies to your gigs or accepts your applications, you will see notifications here.
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
    backgroundColor: '#ffffff',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 13,
    color: '#103B31',
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  unreadCard: {
    backgroundColor: '#f2f7f5',
    borderColor: '#cce3de',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentCol: {
    flex: 1,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#0f172a',
  },
  timeText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  message: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B3D',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
});
