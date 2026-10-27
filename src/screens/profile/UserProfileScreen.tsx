import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import { User, Review } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';

export const UserProfileScreen = ({ route, navigation }: any) => {
  const { userId, user: initialUser, taskId, taskTitle } = route.params || {};
  const [profileUser, setProfileUser] = useState<User | null>(initialUser || null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    if (userId) {
      apiClient
        .get<User>(`/users/${userId}`)
        .then((res) => {
          setProfileUser(res.data);
        })
        .catch((err) => {
          console.error('Failed to fetch user profile:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });

      apiClient
        .get<Review[]>(`/reviews/user/${userId}`)
        .then((res) => {
          setReviews(res.data || []);
        })
        .catch((err) => {
          console.log('Failed to fetch user reviews:', err);
        });
    }
  }, [userId]);

  // Dynamic rating calculation:
  // If reviews array is loaded, calculate average and review count from real review data;
  // otherwise fallback to profileUser properties from server.
  const reviewCount =
    reviews.length > 0
      ? reviews.length
      : profileUser?.rating_count && profileUser.rating_count > 0
      ? profileUser.rating_count
      : 0;

  const rawRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : profileUser?.rating && profileUser.rating > 0
      ? profileUser.rating
      : 0;

  const averageRating = Math.round(rawRating * 10) / 10;
  const isRated = reviewCount > 0 && averageRating > 0;

  const initials = profileUser?.full_name
    ? profileUser.full_name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  const skillsList = (profileUser?.skills || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const formatJoinDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  const handleMessageUser = () => {
    if (taskId && profileUser) {
      navigation.navigate('ChatRoom', {
        taskId,
        taskTitle: taskTitle || 'Gig Chat',
        otherUser: profileUser,
      });
    } else {
      navigation.goBack();
    }
  };

  const handleCallUser = () => {
    if (profileUser?.phone_number) {
      Linking.openURL(`tel:${profileUser.phone_number}`);
    }
  };

  const isMe = currentUser?.id === profileUser?.id;

  return (
    <View style={styles.screen}>
      {/* Top Navigation Bar */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>

        <Text style={styles.topBarTitle} numberOfLines={1}>
          User Profile
        </Text>

        {taskId ? (
          <TouchableOpacity
            style={styles.gigShortcutBtn}
            onPress={() => navigation.navigate('TaskDetail', { taskId })}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="briefcase-outline" size={20} color="#103B31" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      {isLoading && !profileUser ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#103B31" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Telegram-style Profile Hero */}
          <View style={styles.heroCard}>
            <View style={styles.avatarWrapper}>
              {profileUser?.avatar_url ? (
                <Image source={{ uri: profileUser.avatar_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              )}
              <View style={styles.onlineBadge} />
            </View>

            <Text style={styles.userName}>{profileUser?.full_name || 'Neighbor'}</Text>

            {isRated ? (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={13} color="#b45309" style={{ marginRight: 4 }} />
                <Text style={styles.ratingText}>
                  {averageRating.toFixed(1)} / 5 ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                </Text>
              </View>
            ) : (
              <View style={styles.unratedBadge}>
                <Ionicons name="star-outline" size={13} color="#64748b" style={{ marginRight: 4 }} />
                <Text style={styles.unratedText}>Not rated</Text>
              </View>
            )}

            {/* Telegram-style Quick Action Buttons */}
            {!isMe && (
              <View style={styles.actionRow}>
                {taskId && (
                  <TouchableOpacity
                    style={styles.actionBtnPrimary}
                    onPress={handleMessageUser}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="chatbubbles" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.actionBtnPrimaryText}>Send Message</Text>
                  </TouchableOpacity>
                )}

                {profileUser?.phone_number && (
                  <TouchableOpacity
                    style={styles.actionBtnSecondary}
                    onPress={handleCallUser}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="call" size={17} color="#103B31" style={{ marginRight: 6 }} />
                    <Text style={styles.actionBtnSecondaryText}>Call</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* About / Bio Section */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardHeader}>About</Text>
            <Text style={styles.bioText}>
              {profileUser?.bio && profileUser.bio.trim()
                ? profileUser.bio
                : 'No bio provided yet.'}
            </Text>
          </View>

          {/* Skills & Services Tags */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardHeader}>Skills & Services</Text>
            {skillsList.length > 0 ? (
              <View style={styles.tagsWrapper}>
                {skillsList.map((skill, index) => (
                  <View key={index} style={styles.skillTag}>
                    <Text style={styles.skillTagText}>{skill}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptySkillsText}>No skills listed yet.</Text>
            )}
          </View>

          {/* Reviews List (if user has reviews) */}
          {reviews.length > 0 && (
            <View style={styles.infoCard}>
              <View style={styles.reviewsHeaderRow}>
                <Text style={styles.infoCardHeader}>Reviews ({reviewCount})</Text>
                <View style={styles.reviewsScoreBadge}>
                  <Ionicons name="star" size={12} color="#b45309" style={{ marginRight: 3 }} />
                  <Text style={styles.reviewsScoreBadgeText}>{averageRating.toFixed(1)} / 5</Text>
                </View>
              </View>

              {reviews.map((rev, index) => (
                <View key={rev.id || index} style={[styles.reviewItem, index > 0 && styles.reviewItemBorder]}>
                  <View style={styles.reviewItemTop}>
                    <Text style={styles.reviewerName}>
                      {rev.reviewer?.full_name || 'Neighbor'}
                    </Text>
                    <View style={styles.starRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= Math.round(rev.rating) ? 'star' : 'star-outline'}
                          size={12}
                          color="#f59e0b"
                          style={{ marginHorizontal: 1 }}
                        />
                      ))}
                    </View>
                  </View>
                  {rev.comment ? (
                    <Text style={styles.reviewComment}>{rev.comment}</Text>
                  ) : null}
                  {rev.created_at ? (
                    <Text style={styles.reviewDate}>{formatJoinDate(rev.created_at)}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  backButton: {
    padding: 6,
    borderRadius: 20,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  gigShortcutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f2f7f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d2e3dc',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 14,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#103B31',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#103B31',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22c55e',
    borderWidth: 2.5,
    borderColor: '#ffffff',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  ratingText: {
    color: '#b45309',
    fontWeight: '700',
    fontSize: 12,
  },
  unratedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  unratedText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 4,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#103B31',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionBtnPrimaryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f7f5',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cce3de',
  },
  actionBtnSecondaryText: {
    color: '#103B31',
    fontWeight: '700',
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  infoCardHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  bioText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#f2f7f5',
    borderWidth: 1,
    borderColor: '#cce3de',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillTagText: {
    color: '#103B31',
    fontSize: 13,
    fontWeight: '700',
  },
  emptySkillsText: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  reviewsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewsScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  reviewsScoreBadgeText: {
    color: '#b45309',
    fontWeight: '800',
    fontSize: 11,
  },
  reviewItem: {
    paddingVertical: 10,
  },
  reviewItemBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f1f5f9',
  },
  reviewItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewComment: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
});

