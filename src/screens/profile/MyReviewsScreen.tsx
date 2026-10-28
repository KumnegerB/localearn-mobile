import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { Review } from '../../types';
import { useTranslation } from '../../i18n';

export const MyReviewsScreen = ({ navigation }: any) => {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { t, language } = useTranslation();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReviews = useCallback(async (isRefresh = false) => {
    if (!user?.id) return;
    if (!isRefresh) setLoading(true);
    try {
      const res = await apiClient.get<Review[]>(`/reviews/user/${user.id}`);
      setReviews(res.data || []);
    } catch (err) {
      console.warn('Failed to fetch user reviews:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReviews(true);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // Compute rating metrics
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / totalReviews)
    : (user?.rating || 0);

  const ratingCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const rounded = Math.min(5, Math.max(1, Math.round(r.rating || 0)));
    ratingCounts[rounded] = (ratingCounts[rounded] || 0) + 1;
  });

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Score Overview Card */}
      <View style={styles.scoreCard}>
        <View style={styles.scoreRow}>
          <View style={styles.bigScoreBox}>
            <Text style={styles.bigScoreText}>{averageRating.toFixed(1)}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= Math.round(averageRating) ? 'star' : 'star-outline'}
                  size={15}
                  color="#f59e0b"
                  style={{ marginHorizontal: 1 }}
                />
              ))}
            </View>
            <Text style={styles.scoreSubText}>
              {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </Text>
          </View>

          {/* Breakdown Bars */}
          <View style={styles.breakdownBox}>
            {[5, 4, 3, 2, 1].map((starNum) => {
              const count = ratingCounts[starNum] || 0;
              const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <View key={starNum} style={styles.barRow}>
                  <Text style={styles.barStarNum}>{starNum}</Text>
                  <Ionicons name="star" size={10} color="#f59e0b" style={{ marginRight: 6 }} />
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${percent}%` }]} />
                  </View>
                  <Text style={styles.barCount}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.adviceBanner}>
          <Ionicons name="bulb-outline" size={16} color="#103B31" style={{ marginRight: 6 }} />
          <Text style={styles.adviceText}>
            {language === 'am'
              ? 'ይህ በጎረቤቶችዎ የተሰጠ አስተያየት ነው። ጠንካራ ዝና ለመገንባትና ተጨማሪ ስራዎችን ለማግኘት ይጠቀሙበት።'
              : 'Feedback from neighbors you have worked with. Use it to build trust and grow your local reputation.'}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        {language === 'am' ? 'የተጠቃሚዎች አስተያየቶች' : 'All Reviews & Comments'}
      </Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>
          {language === 'am' ? 'የእኔ ግምገማዎች' : 'My Reviews'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#103B31" />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#103B31']}
              tintColor="#103B31"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="star-outline" size={36} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>
                {language === 'am' ? 'እስካሁን ምንም ግምገማ የለም' : 'No reviews received yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {language === 'am'
                  ? 'ስራዎችን ሲያጠናቅቁ ወይም ጎረቤቶችን ሲረዱ ደረጃዎችና አስተያየቶች እዚህ ይታያሉ።'
                  : 'When you complete gigs or hire neighbors, their ratings and reviews will appear here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const reviewerName = item.reviewer?.full_name || 'Neighbor';
            const initial = reviewerName.charAt(0).toUpperCase() || 'N';

            return (
              <View style={styles.reviewCard}>
                <View style={styles.reviewCardHeader}>
                  <View style={styles.reviewerInfoRow}>
                    {item.reviewer?.avatar_url ? (
                      <Image source={{ uri: item.reviewer.avatar_url }} style={styles.reviewerAvatarImg} />
                    ) : (
                      <View style={styles.reviewerAvatar}>
                        <Text style={styles.reviewerAvatarText}>{initial}</Text>
                      </View>
                    )}
                    <View style={styles.reviewerTextCol}>
                      <Text style={styles.reviewerName} numberOfLines={1}>
                        {reviewerName}
                      </Text>
                      {item.created_at ? (
                        <Text style={styles.reviewDate}>{formatDate(item.created_at)}</Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Stars Pill */}
                  <View style={styles.starsPill}>
                    <Ionicons name="star" size={13} color="#f59e0b" style={{ marginRight: 3 }} />
                    <Text style={styles.starsPillText}>
                      {Number(item.rating).toFixed(1)}
                    </Text>
                  </View>
                </View>

                {/* Comment Text */}
                {item.comment && item.comment.trim() ? (
                  <View style={styles.commentBox}>
                    <Text style={styles.commentText}>{item.comment.trim()}</Text>
                  </View>
                ) : (
                  <Text style={styles.noCommentHint}>
                    {language === 'am' ? '(ደረጃ ብቻ የተሰጠ)' : '(Rating left without written feedback)'}
                  </Text>
                )}
              </View>
            );
          }}
        />
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    zIndex: 10,
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  headerContainer: {
    marginBottom: 8,
  },
  scoreCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bigScoreBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
    minWidth: 105,
  },
  bigScoreText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 38,
  },
  starsRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  scoreSubText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  breakdownBox: {
    flex: 1,
    paddingLeft: 16,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  barStarNum: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    width: 8,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 3,
  },
  barCount: {
    fontSize: 11,
    color: '#94a3b8',
    width: 20,
    textAlign: 'right',
  },
  adviceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f7f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
  },
  adviceText: {
    flex: 1,
    fontSize: 12,
    color: '#103B31',
    lineHeight: 16,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    marginTop: 4,
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#103B31',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  reviewerAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  reviewerAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  reviewerTextCol: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  reviewDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  starsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  starsPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b45309',
  },
  commentBox: {
    marginTop: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#103B31',
  },
  commentText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  noCommentHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});

