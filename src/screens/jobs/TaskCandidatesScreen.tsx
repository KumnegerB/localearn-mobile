import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useTaskStore } from '../../store/useTaskStore';
import { Ionicons } from '@expo/vector-icons';

export const TaskCandidatesScreen = ({ route, navigation }: any) => {
  const { taskId, taskTitle } = route.params || {};
  const { candidates, fetchCandidates, acceptCandidate, fetchTaskById, currentTask, isLoading } = useTaskStore();
  const [actionId, setActionId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (taskId) {
      fetchCandidates(taskId);
      if (!taskTitle || taskTitle.toLowerCase() === 'candidates') {
        fetchTaskById(taskId);
      }
    }
  }, [taskId, taskTitle]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCandidates(taskId);
    setRefreshing(false);
  };

  const resolvedTaskTitle =
    taskTitle && taskTitle.toLowerCase() !== 'candidates'
      ? taskTitle
      : candidates[0]?.task?.title || currentTask?.title || 'Gig';

  const handleAcceptCandidate = (applicationId: number, applicantName: string) => {
    Alert.alert(
      'Assign Gig',
      `Accept ${applicantName} for this gig? Other candidates will be marked as rejected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept & Assign',
          onPress: async () => {
            setActionId(applicationId);
            const ok = await acceptCandidate(applicationId);
            setActionId(null);
            if (ok) {
              Alert.alert('Gig Assigned', `${applicantName} has been assigned to this gig!`);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerSubtitle}>Candidates for:</Text>
        <Text style={styles.headerTitle} numberOfLines={2}>{resolvedTaskTitle}</Text>
      </View>

      {isLoading && !refreshing && candidates.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#103B31" />
        </View>
      ) : (
        <FlatList
          data={candidates}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const applicant = item.applicant;
            const isPending = item.status === 'PENDING';
            const isAccepted = item.status === 'ACCEPTED';

            return (
              <View style={styles.candidateCard}>
                <View style={styles.candidateTop}>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (applicant?.id) {
                        navigation.navigate('UserProfile', {
                          userId: applicant.id,
                          user: applicant,
                          taskId,
                          taskTitle,
                        });
                      }
                    }}
                  >
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {applicant?.full_name?.charAt(0) || 'U'}
                      </Text>
                    </View>

                    <View style={styles.candidateInfo}>
                      <Text style={styles.candidateName}>{applicant?.full_name || 'Applicant'}</Text>
                      <Text style={styles.candidateRating}>
                        {applicant?.rating_count && applicant.rating_count > 0
                          ? `★ ${applicant.rating.toFixed(1)} (${applicant.rating_count} reviews)`
                          : '0 reviews'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View
                    style={[
                      styles.statusPill,
                      isAccepted
                        ? styles.acceptedPill
                        : isPending
                        ? styles.pendingPill
                        : styles.rejectedPill,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isAccepted
                          ? styles.acceptedPillText
                          : isPending
                          ? styles.pendingPillText
                          : styles.rejectedPillText,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                {applicant?.skills ? (
                  <View style={styles.skillsBox}>
                    <Text style={styles.skillsLabel}>Skills:</Text>
                    <Text style={styles.skillsText}>{applicant.skills}</Text>
                  </View>
                ) : null}

                {item.message ? (
                  <View style={styles.noteBox}>
                    <Text style={styles.noteLabel}>Applicant's Message:</Text>
                    <Text style={styles.noteText}>"{item.message}"</Text>
                  </View>
                ) : null}

                {/* Actions */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.chatButton}
                    onPress={() =>
                      navigation.navigate('ChatRoom', {
                        taskId,
                        taskTitle,
                        otherUser: applicant,
                      })
                    }
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={16} color="#103B31" style={{ marginRight: 6 }} />
                    <Text style={styles.chatButtonText}>Direct Chat</Text>
                  </TouchableOpacity>

                  {isPending && (
                    <TouchableOpacity
                      style={styles.acceptButton}
                      disabled={actionId === item.id}
                      onPress={() => handleAcceptCandidate(item.id, applicant?.full_name || 'this candidate')}
                    >
                      {actionId === item.id ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                          <Text style={styles.acceptButtonText}>Accept Candidate</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={54} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No candidates yet</Text>
                <Text style={styles.emptySubtitle}>
                  When neighbors apply for this gig, their profiles and messages will appear here.
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
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  candidateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  candidateTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  candidateInfo: {
    flex: 1,
  },
  candidateName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  candidateRating: {
    fontSize: 12,
    color: '#d97706',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingPill: {
    backgroundColor: '#fffbeb',
  },
  acceptedPill: {
    backgroundColor: '#ecfdf5',
  },
  rejectedPill: {
    backgroundColor: '#fef2f2',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  pendingPillText: {
    color: '#d97706',
  },
  acceptedPillText: {
    color: '#059669',
  },
  rejectedPillText: {
    color: '#dc2626',
  },
  skillsBox: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  skillsLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
    marginBottom: 2,
  },
  skillsText: {
    fontSize: 13,
    color: '#334155',
  },
  noteBox: {
    backgroundColor: '#f2f7f5',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#cce3de',
  },
  noteLabel: {
    fontSize: 11,
    color: '#103B31',
    fontWeight: '700',
    marginBottom: 2,
  },
  noteText: {
    fontSize: 13,
    color: '#103B31',
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f7f5',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cce3de',
  },
  chatButtonText: {
    color: '#103B31',
    fontWeight: '700',
    fontSize: 13,
  },
  acceptButton: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
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
  },
});

