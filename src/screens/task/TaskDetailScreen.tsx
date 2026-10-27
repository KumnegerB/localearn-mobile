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
import { useRequireTrustAction } from '../../hooks/useRequireTrustAction';
import { TrustActionModal } from '../../components/trust/TrustActionModal';
import { useTranslation } from '../../i18n';

export const TaskDetailScreen = ({ route, navigation }: any) => {
  const { taskId } = route.params;
  const { t, language } = useTranslation();
  const {
    currentTask: storeCurrentTask,
    fetchTaskById,
    applyForTask,
    cancelApplication,
    completeTask,
    isLoading,
    myAppliedTasks,
    fetchMyAppliedTasks,
    tasksById,
    tasks,
  } = useTaskStore();
  const { user } = useAuthStore();
  const [actionLoading, setActionLoading] = useState(false);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');

  const {
    modalMode,
    actionTitle,
    requireTrustAction,
    closeModal,
    handleVerificationSuccess,
  } = useRequireTrustAction();

  useEffect(() => {
    fetchTaskById(taskId);
    fetchMyAppliedTasks();
  }, [taskId]);

  // Instant SWR: resolve from storeCurrentTask, route.params, or tasksById cache
  const currentTask =
    storeCurrentTask?.id === taskId
      ? storeCurrentTask
      : route.params?.task || tasksById[taskId] || tasks.find((t) => t.id === taskId) || null;

  if (!currentTask) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#103B31" />
      </View>
    );
  }

  const isCreator = user?.id === currentTask.creator_id;
  const isHelper = user?.id === currentTask.helper_id;
  const isAssignedOrDone = currentTask.status === 'ASSIGNED' || currentTask.status === 'COMPLETED';
  const hasApplied =
    Boolean(currentTask.has_applied) ||
    myAppliedTasks.some((app) => app.task_id === currentTask.id);
  const hasBottomActions =
    (!isCreator && (Boolean(currentTask.creator) || currentTask.status === 'OPEN')) ||
    (isCreator && (currentTask.status === 'OPEN' || currentTask.status === 'ASSIGNED'));

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

  const handleWithdrawPrompt = () => {
    Alert.alert(
      'Withdraw Application',
      'Are you sure you want to cancel your application for this gig?',
      [
        { text: 'Keep Application', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            const ok = await cancelApplication(currentTask.id);
            setActionLoading(false);
            if (ok) {
              Alert.alert('Application Cancelled', 'You have successfully withdrawn your application.');
            } else {
              Alert.alert('Notice', 'Unable to withdraw application. Please try again.');
            }
          },
        },
      ]
    );
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
            <Text style={styles.categoryText}>{t(`categories.${currentTask.category}`)}</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusText}>
              {currentTask.status === 'OPEN'
                ? t('common.open')
                : currentTask.status === 'ASSIGNED'
                ? t('common.inProgress')
                : currentTask.status === 'COMPLETED'
                ? t('common.completed')
                : currentTask.status}
            </Text>
          </View>
          {currentTask.applications_count !== undefined && (
            <View style={styles.applicantPill}>
              <Ionicons name="people-outline" size={13} color="#103B31" style={{ marginRight: 4 }} />
              <Text style={styles.applicantPillText}>
                {currentTask.applications_count} {t('common.peopleApplied')}
              </Text>
            </View>
          )}
        </View>

        {/* Title & Price */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>{currentTask.title}</Text>
          <Text style={styles.budget}>{formatPrice(currentTask.budget, currentTask.currency)}</Text>
        </View>

        {/* Location */}
        <Text style={styles.location}>
          📍 {currentTask.location_name || t('common.neighborhood')}
        </Text>

        <View style={styles.divider} />

        {/* Description */}
        <Text style={styles.sectionHeader}>{t('taskDetail.description')}</Text>
        <Text style={styles.description}>{currentTask.description}</Text>

        {/* Posted By (Only shown when viewer is NOT the creator) */}
        {!isCreator && currentTask.creator && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionHeader}>{t('taskDetail.postedBy')}</Text>
            <Text style={styles.sectionHeader}>Posted By</Text>
            <TouchableOpacity
              style={styles.userCard}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('UserProfile', {
                  userId: currentTask.creator!.id,
                  user: currentTask.creator,
                  taskId: currentTask.id,
                  taskTitle: currentTask.title,
                })
              }
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {currentTask.creator?.full_name?.charAt(0) || 'U'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{currentTask.creator?.full_name || 'Neighbor'}</Text>
                <Text style={styles.userRating}>
                  {currentTask.creator?.rating_count && currentTask.creator.rating_count > 0
                    ? `★ ${currentTask.creator.rating.toFixed(1)} / 5 (${currentTask.creator.rating_count})`
                    : 'Not rated'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </>
        )}

        {/* Assigned Helper (Shown if task is ASSIGNED or COMPLETED) */}
        {isAssignedOrDone && currentTask.helper && (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionHeader}>Assigned Helper</Text>
            <View style={styles.assignedUserCard}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('UserProfile', {
                    userId: currentTask.helper!.id,
                    user: currentTask.helper,
                    taskId: currentTask.id,
                    taskTitle: currentTask.title,
                  })
                }
              >
                <View style={styles.helperAvatar}>
                  <Text style={styles.helperAvatarText}>
                    {currentTask.helper?.full_name?.charAt(0) || 'H'}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{currentTask.helper?.full_name || 'Helper'}</Text>
                  <Text style={styles.userRating}>
                    {currentTask.helper?.rating_count && currentTask.helper.rating_count > 0
                      ? `★ ${currentTask.helper.rating.toFixed(1)} / 5 (${currentTask.helper.rating_count})`
                      : 'Not rated'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
              </TouchableOpacity>
              {isCreator && (
                <TouchableOpacity
                  style={styles.chatHelperButton}
                  activeOpacity={0.8}
                  onPress={() =>
                    navigation.navigate('ChatRoom', {
                      taskId: currentTask.id,
                      taskTitle: currentTask.title,
                      otherUser: currentTask.helper,
                    })
                  }
                >
                  <Ionicons name="chatbubbles" size={15} color="#ffffff" style={{ marginRight: 5 }} />
                  <Text style={styles.chatHelperButtonText}>Chat</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Action Bar */}
      {hasBottomActions && (
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
              <Ionicons name="chatbubbles-outline" size={18} color="#103B31" style={{ marginRight: 6 }} />
              <Text style={styles.chatButtonText}>Message Poster</Text>
            </TouchableOpacity>
          )}

          {isCreator && currentTask.status === 'OPEN' && (
            <TouchableOpacity
              style={styles.candidatesButton}
              onPress={() =>
                navigation.navigate('TaskCandidates', {
                  taskId: currentTask.id,
                  taskTitle: currentTask.title,
                })
              }
            >
              <Ionicons name="people-outline" size={18} color="#103B31" style={{ marginRight: 6 }} />
              <Text style={styles.candidatesButtonText}>
                View Candidates ({currentTask.applications_count || 0})
              </Text>
            </TouchableOpacity>
          )}

          {isCreator && currentTask.status === 'ASSIGNED' && currentTask.helper && (
            <TouchableOpacity
              style={styles.chatButton}
              onPress={() =>
                navigation.navigate('ChatRoom', {
                  taskId: currentTask.id,
                  taskTitle: currentTask.title,
                  otherUser: currentTask.helper,
                })
              }
            >
              <Ionicons name="chatbubbles-outline" size={18} color="#103B31" style={{ marginRight: 6 }} />
              <Text style={styles.chatButtonText}>Chat with Helper</Text>
            </TouchableOpacity>
          )}

          {!isCreator && currentTask.status === 'OPEN' && (
            hasApplied ? (
              <TouchableOpacity
                style={styles.appliedButton}
                onPress={handleWithdrawPrompt}
                disabled={actionLoading}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={18} color="#15803d" style={{ marginRight: 6 }} />
                <View style={styles.appliedTextCol}>
                  <Text style={styles.appliedButtonText}>{t('common.applied')}</Text>
                  <Text style={styles.appliedCancelHint}>{language === 'am' ? 'ለማቋረጥ ይጫኑ' : 'Tap to withdraw'}</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => requireTrustAction(() => setApplyModalVisible(true), 'apply for this gig')}
                disabled={actionLoading}
              >
                <Ionicons name="hand-right-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.actionButtonText}>{t('taskDetail.applyNow')}</Text>
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
                <Text style={styles.actionButtonText}>{t('taskDetail.markComplete')}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Apply Modal */}
      <Modal visible={applyModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('taskDetail.applyNow')}</Text>
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
              placeholderTextColor="#94a3b8"
              value={applyMessage}
              onChangeText={setApplyMessage}
              multiline
              numberOfLines={4}
              maxLength={300}
              cursorColor="#103B31"
              selectionColor="#cce3de"
            />
            <Text style={styles.charCountText}>{applyMessage.length}/300</Text>

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

      <TrustActionModal
        mode={modalMode}
        actionTitle={actionTitle}
        onClose={closeModal}
        onVerificationSuccess={handleVerificationSuccess}
        navigation={navigation}
      />
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
    backgroundColor: '#f2f7f5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  categoryText: {
    color: '#103B31',
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
  applicantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f7f5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cce3de',
  },
  applicantPillText: {
    color: '#103B31',
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
    color: '#103B31',
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
    backgroundColor: '#103B31',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  assignedUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f7f5',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cce3de',
  },
  helperAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B3D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helperAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  chatHelperButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#103B31',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  chatHelperButtonText: {
    color: '#ffffff',
    fontSize: 13,
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
    backgroundColor: '#f2f7f5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cce3de',
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#103B31',
  },
  candidatesButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f2f7f5',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cce3de',
  },
  candidatesButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#103B31',
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
    fontSize: 14,
    fontWeight: '700',
    color: '#15803d',
    textAlign: 'center',
  },
  appliedTextCol: {
    alignItems: 'center',
  },
  appliedCancelHint: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16a34a',
    marginTop: 1,
  },
  actionButton: {
    flex: 1.2,
    flexDirection: 'row',
    backgroundColor: '#103B31',
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
  charCountText: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
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
    backgroundColor: '#103B31',
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

