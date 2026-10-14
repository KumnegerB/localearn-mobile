import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTaskStore } from '../../store/useTaskStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatPrice } from '../../utils/currency';

export const TaskDetailScreen = ({ route, navigation }: any) => {
  const { taskId } = route.params;
  const { currentTask, fetchTaskById, acceptTask, completeTask, isLoading } = useTaskStore();
  const { user } = useAuthStore();
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTaskById(taskId);
  }, [taskId]);

  if (isLoading || !currentTask) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const isCreator = user?.id === currentTask.creator_id;
  const isHelper = user?.id === currentTask.helper_id;

  const handleAccept = async () => {
    Alert.alert('Accept Task', 'Are you ready to take on this gig?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          setActionLoading(true);
          const ok = await acceptTask(taskId);
          setActionLoading(false);
          if (ok) {
            Alert.alert('Success', 'You are now assigned to this task!');
          }
        },
      },
    ]);
  };

  const handleComplete = async () => {
    Alert.alert('Complete Task', 'Mark this gig as completed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setActionLoading(true);
          const ok = await completeTask(taskId);
          setActionLoading(false);
          if (ok) {
            Alert.alert('Task Completed!', 'Would you like to rate the helper?', [
              { text: 'Later' },
              {
                text: 'Leave Review',
                onPress: () => navigation.navigate('LeaveReview', { taskId: currentTask.id }),
              },
            ]);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Status & Category */}
        <View style={styles.metaRow}>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{currentTask.category}</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>{currentTask.status}</Text>
          </View>
        </View>

        {/* Title & Price */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>{currentTask.title}</Text>
          <Text style={styles.budget}>{formatPrice(currentTask.budget, currentTask.currency)}</Text>
        </View>

        {/* Location */}
        <Text style={styles.location}>
          📍 {currentTask.location_name || 'Neighborhood area'}
        </Text>

        <View style={styles.divider} />

        {/* Description */}
        <Text style={styles.sectionHeader}>Task Description</Text>
        <Text style={styles.description}>{currentTask.description}</Text>

        <View style={styles.divider} />

        {/* Posted By */}
        <Text style={styles.sectionHeader}>Posted By</Text>
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {currentTask.creator?.full_name?.charAt(0) || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{currentTask.creator?.full_name || 'Neighbor'}</Text>
            <Text style={styles.userRating}>
              {currentTask.creator?.rating_count && currentTask.creator.rating_count > 0
                ? `★ ${currentTask.creator.rating.toFixed(1)} (${currentTask.creator.rating_count} reviews)`
                : '0 reviews'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() =>
            navigation.navigate('ChatRoom', {
              taskId: currentTask.id,
              taskTitle: currentTask.title,
            })
          }
        >
          <Text style={styles.chatButtonText}>💬 Chat</Text>
        </TouchableOpacity>

        {!isCreator && currentTask.status === 'OPEN' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleAccept}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Accept Gig</Text>
            )}
          </TouchableOpacity>
        )}

        {isCreator && currentTask.status === 'ASSIGNED' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={handleComplete}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Mark Completed</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  categoryPill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  categoryText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },
  statusPill: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    marginRight: 12,
  },
  budget: {
    fontSize: 26,
    fontWeight: '800',
    color: '#10b981',
  },
  location: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 18,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  userRating: {
    fontSize: 13,
    color: '#f59e0b',
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  chatButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  chatButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  actionButton: {
    flex: 2,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#059669',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});

