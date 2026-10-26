import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTaskStore } from '../../store/useTaskStore';
import { useAuthStore } from '../../store/useAuthStore';
import { TaskCard } from '../../components/task/TaskCard';
import { formatPrice } from '../../utils/currency';
import { Ionicons } from '@expo/vector-icons';

export const MyJobsScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'posted' | 'applied'>('posted');
  const [refreshing, setRefreshing] = useState(false);

  const {
    myPostedTasks,
    myAppliedTasks,
    fetchMyPostedTasks,
    fetchMyAppliedTasks,
    cancelApplication,
    isLoading,
  } = useTaskStore();

  const handleWithdrawApplication = (taskId: number, applicationId: number, taskTitle: string) => {
    Alert.alert(
      'Withdraw Application',
      `Cancel your application for "${taskTitle}"?`,
      [
        { text: 'Keep Application', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            const ok = await cancelApplication(taskId, applicationId);
            if (ok) {
              Alert.alert('Application Withdrawn', 'Your application has been cancelled.');
            } else {
              Alert.alert('Notice', 'Unable to withdraw application.');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [activeTab, user]);

  const loadData = async () => {
    if (activeTab === 'posted') {
      await fetchMyPostedTasks();
    } else {
      await fetchMyAppliedTasks();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return { bg: '#ecfdf5', text: '#059669' };
      case 'REJECTED':
        return { bg: '#fef2f2', text: '#dc2626' };
      default:
        return { bg: '#fffbeb', text: '#d97706' };
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.guestContainer}>
          <View style={styles.guestIconBox}>
            <Ionicons name="briefcase-outline" size={54} color="#103B31" />
          </View>
          <Text style={styles.guestTitle}>Sign in to track your gigs</Text>
          <Text style={styles.guestSubtitle}>
            Review the tasks you've posted and the gigs you've applied for once you sign in.
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

  return (
    <View style={styles.container}>
      {/* Top Segmented Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'posted' && styles.activeTabButton]}
          onPress={() => setActiveTab('posted')}
        >
          <Ionicons
            name="create-outline"
            size={18}
            color={activeTab === 'posted' ? '#103B31' : '#64748b'}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[styles.tabButtonText, activeTab === 'posted' && styles.activeTabButtonText]}
          >
            My Jobs ({myPostedTasks.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'applied' && styles.activeTabButton]}
          onPress={() => setActiveTab('applied')}
        >
          <Ionicons
            name="paper-plane-outline"
            size={18}
            color={activeTab === 'applied' ? '#103B31' : '#64748b'}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[styles.tabButtonText, activeTab === 'applied' && styles.activeTabButtonText]}
          >
            Jobs I Applied ({myAppliedTasks.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading && !refreshing && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#103B31" />
        </View>
      )}

      {activeTab === 'posted' ? (
        <FlatList
          data={myPostedTasks}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isAssignedOrDone = item.status === 'ASSIGNED' || item.status === 'COMPLETED';

            return (
              <View style={styles.postedItemWrapper}>
                <TaskCard
                  task={item}
                  onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
                />
                <View style={styles.postedActionRow}>
                  {isAssignedOrDone && item.helper ? (
                    <View style={styles.assignedHelperBox}>
                      <TouchableOpacity
                        style={styles.assignedHelperLeft}
                        activeOpacity={0.7}
                        onPress={() =>
                          navigation.navigate('UserProfile', {
                            userId: item.helper!.id,
                            user: item.helper,
                            taskId: item.id,
                            taskTitle: item.title,
                          })
                        }
                      >
                        <View style={styles.helperAvatarSmall}>
                          <Text style={styles.helperAvatarTextSmall}>
                            {item.helper.full_name?.charAt(0) || 'H'}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.assignedToLabel}>Assigned Helper</Text>
                          <Text style={styles.assignedHelperName} numberOfLines={1}>
                            {item.helper.full_name}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.chatHelperButton}
                        activeOpacity={0.8}
                        onPress={() =>
                          navigation.navigate('ChatRoom', {
                            taskId: item.id,
                            taskTitle: item.title,
                            otherUser: item.helper,
                          })
                        }
                      >
                        <Ionicons name="chatbubbles" size={14} color="#ffffff" style={{ marginRight: 5 }} />
                        <Text style={styles.chatHelperButtonText}>Chat</Text>
                      </TouchableOpacity>
                    </View>
                  ) : item.status === 'OPEN' ? (
                    <TouchableOpacity
                      style={styles.candidatesBtn}
                      onPress={() =>
                        navigation.navigate('TaskCandidates', {
                          taskId: item.id,
                          taskTitle: item.title,
                        })
                      }
                    >
                      <Ionicons name="people-outline" size={16} color="#103B31" style={{ marginRight: 6 }} />
                      <Text style={styles.candidatesBtnText}>
                        View Candidates ({item.applications_count || 0})
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="briefcase-outline" size={54} color="#94a3b8" />
                <Text style={styles.emptyTitle}>You haven't posted any jobs yet</Text>
                <Text style={styles.emptySubtitle}>
                  Post a task in your neighborhood and review candidates here.
                </Text>
                <TouchableOpacity
                  style={styles.postNowBtn}
                  onPress={() => navigation.navigate('CreateTask')}
                >
                  <Text style={styles.postNowBtnText}>Post a Job</Text>
                </TouchableOpacity>
              </View>
            ) : undefined
          }
        />
      ) : (
        <FlatList
          data={myAppliedTasks}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const badge = getStatusBadgeStyle(item.status);
            return (
              <TouchableOpacity
                style={styles.applicationCard}
                activeOpacity={0.8}
                onPress={() => {
                  if (item.task) {
                    navigation.navigate('TaskDetail', { taskId: item.task.id });
                  }
                }}
              >
                <View style={styles.appHeader}>
                  <Text style={styles.appTaskTitle} numberOfLines={1}>
                    {item.task?.title || `Gig #${item.task_id}`}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                {item.task && (
                  <Text style={styles.appBudget}>
                    Budget: {formatPrice(item.task.budget, item.task.currency)}
                  </Text>
                )}

                {item.message ? (
                  <View style={styles.messageBox}>
                    <Text style={styles.messageLabel}>Your Note:</Text>
                    <Text style={styles.messageText}>{item.message}</Text>
                  </View>
                ) : null}

                {item.task && item.task.creator && (
                  <View style={styles.appFooter}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={{ flex: 1 }}
                      onPress={() =>
                        navigation.navigate('UserProfile', {
                          userId: item.task!.creator!.id,
                          user: item.task!.creator,
                          taskId: item.task!.id,
                          taskTitle: item.task!.title,
                        })
                      }
                    >
                      <Text style={styles.postedByText} numberOfLines={1}>
                        Posted by: {item.task.creator.full_name}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.contactPosterBtn}
                      onPress={() =>
                        navigation.navigate('ChatRoom', {
                          taskId: item.task!.id,
                          taskTitle: item.task!.title,
                          otherUser: item.task!.creator,
                        })
                      }
                    >
                      <Ionicons name="chatbubbles-outline" size={15} color="#103B31" style={{ marginRight: 4 }} />
                      <Text style={styles.contactPosterBtnText}>Message Poster</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {item.status === 'PENDING' && (
                  <View style={styles.appActionRow}>
                    <TouchableOpacity
                      style={styles.withdrawBtn}
                      activeOpacity={0.8}
                      onPress={() =>
                        handleWithdrawApplication(
                          item.task_id,
                          item.id,
                          item.task?.title || `Gig #${item.task_id}`
                        )
                      }
                    >
                      <Ionicons name="close-circle-outline" size={14} color="#dc2626" style={{ marginRight: 4 }} />
                      <Text style={styles.withdrawBtnText}>Withdraw Application</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="paper-plane-outline" size={54} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No applications submitted yet</Text>
                <Text style={styles.emptySubtitle}>
                  Browse nearby gigs on the explore or map tabs and apply!
                </Text>
              </View>
            ) : undefined
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#103B31',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabButtonText: {
    color: '#103B31',
    fontWeight: '700',
  },
  centerContainer: {
    padding: 30,
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  postedItemWrapper: {
    marginBottom: 16,
  },
  postedActionRow: {
    marginTop: -4,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderTopWidth: 0,
    padding: 10,
    alignItems: 'center',
  },
  assignedHelperBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f7f5',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  assignedHelperLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  helperAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#103B31',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  helperAvatarTextSmall: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  assignedToLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  assignedHelperName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  chatHelperButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#103B31',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  chatHelperButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  candidatesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f7f5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  candidatesBtnText: {
    color: '#103B31',
    fontWeight: '700',
    fontSize: 13,
  },
  applicationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  appTaskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  appBudget: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
    marginBottom: 8,
  },
  messageBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  messageLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 13,
    color: '#334155',
  },
  appFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    marginTop: 4,
  },
  postedByText: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  contactPosterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f7f5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cce3de',
  },
  contactPosterBtnText: {
    color: '#103B31',
    fontSize: 12,
    fontWeight: '700',
  },
  appActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    marginTop: 8,
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  withdrawBtnText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#334155',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  postNowBtn: {
    backgroundColor: '#103B31',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  postNowBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  guestIconBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#f2f7f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#cce3de',
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
    lineHeight: 20,
    marginBottom: 24,
  },
  guestSignInBtn: {
    backgroundColor: '#103B31',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  guestSignInBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

