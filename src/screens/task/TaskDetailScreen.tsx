import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useTaskStore } from '../../store/useTaskStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatPrice } from '../../utils/currency';
import { Ionicons } from '@expo/vector-icons';

export const TaskDetailScreen = ({ route, navigation }: any) => {
  const { taskId } = route.params;
  const {
    currentTask,
    fetchTaskById,
    applyForTask,
    completeTask,
    isLoading,
    myAppliedTasks,
    fetchMyAppliedTasks,
  } = useTaskStore();
  const { user } = useAuthStore();
  const [actionLoading, setActionLoading] = useState(false);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');

  useEffect(() => {
    fetchTaskById(taskId);
    fetchMyAppliedTasks();
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
  const hasApplied =
    Boolean(currentTask.has_applied) ||
    myAppliedTasks.some((app) => app.task_id === currentTask.id);

  const handleApply = async () => {
    if (hasApplied) {
      Alert.alert('Notice', 'You have already applied for this gig.');
      setApplyModalVisible(false);
      return;
    }
    setActionLoading(true);
    const ok = await applyForTask(taskId, applyMessage.trim() || undefined);
    setActionLoading(false);
    if (ok) {
      setApplyModalVisible(false);
      setApplyMessage('');
      Alert.alert(
        'Application Sent!',
        'Your application and note have been sent to the poster. You can also message them directly from My Jobs.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Notice', 'You have already applied for this gig or the gig is no longer open.');
    }
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
        {!isCreator && currentTask.creator && (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() =>
              navigation.navigate('ChatRoom', {
                taskId: currentTask.id,
                taskTitle: currentTask.title,
                otherUser: currentTask.creator,
              })
            }
          >
            <Ionicons name="chatbubbles-outline" size={18} color="#2563eb" style={{ marginRight: 6 }} />
            <Text style={styles.chatButtonText}>Message Poster</Text>
          </TouchableOpacity>
        )}

        {isCreator && (
          <TouchableOpacity
            style={styles.candidatesButton}
            onPress={() =>
              navigation.navigate('TaskCandidates', {
                taskId: currentTask.id,
                taskTitle: currentTask.title,
              })
            }
          >
            <Ionicons name="people-outline" size={18} color="#2563eb" style={{ marginRight: 6 }} />
            <Text style={styles.candidatesButtonText}>View Candidates</Text>
          </TouchableOpacity>
        )}

        {!isCreator && currentTask.status === 'OPEN' && (
          hasApplied ? (
            <View style={styles.appliedButton}>
              <Ionicons name="checkmark-circle" size={18} color="#15803d" style={{ marginRight: 6 }} />
              <Text style={styles.appliedButtonText}>Applied</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setApplyModalVisible(true)}
              disabled={actionLoading}
            >
              <Ionicons name="hand-right-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.actionButtonText}>Apply for Gig</Text>
            </TouchableOpacity>
          )
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

      {/* Apply Modal */}
      <Modal visible={applyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Apply for this Gig</Text>
              <TouchableOpacity onPress={() => setApplyModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Include a brief message about your availability and why you're a great fit:
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Hi! I'm available today at 3pm and have all the tools needed..."
              value={applyMessage}
              onChangeText={setApplyMessage}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setApplyModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitApplyBtn, hasApplied && { backgroundColor: '#94a3b8' }]}
                onPress={handleApply}
                disabled={actionLoading || hasApplied}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitApplyBtnText}>
                    {hasApplied ? 'Already Applied' : 'Send Application'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  candidatesButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  candidatesButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },
  appliedButton: {
    flex: 1.2,
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appliedButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#15803d',
  },
  actionButton: {
    flex: 1.2,
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButton: {
    backgroundColor: '#059669',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 14,
  },
  modalInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    height: 110,
    textAlignVertical: 'top',
    color: '#0f172a',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  cancelModalBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelModalBtnText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 15,
  },
  submitApplyBtn: {
    flex: 1.5,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitApplyBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
  },
});

