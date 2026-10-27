import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { apiClient } from '../../api/client';
import { invalidateUserProfileCache } from '../profile/UserProfileScreen';

export const LeaveReviewScreen = ({ route, navigation }: any) => {
  const { taskId } = route.params;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await apiClient.post('/reviews/', {
        task_id: taskId,
        rating,
        comment: comment.trim() || undefined,
      });
      // Invalidate user profile caches so freshly calculated ratings are fetched on next view
      invalidateUserProfileCache();
      Alert.alert('Review Submitted', 'Thank you for rating your experience!', [
        { text: 'Done', onPress: () => navigation.popToTop() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rate Your Experience</Text>
      <Text style={styles.subtitle}>How was your collaboration on this gig?</Text>

      {/* Star Selector */}
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Text style={[styles.star, star <= rating ? styles.starActive : styles.starInactive]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Feedback & Comments</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Polite, punctual, and did great quality work!"
        placeholderTextColor="#94a3b8"
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={4}
        maxLength={500}
        cursorColor="#7c3aed"
        selectionColor="#ddd6fe"
      />
      <Text style={styles.charCountText}>{comment.length}/500</Text>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Review</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  star: {
    fontSize: 42,
  },
  starActive: {
    color: '#f59e0b',
  },
  starInactive: {
    color: '#cbd5e1',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    backgroundColor: '#f8fafc',
    height: 120,
    textAlignVertical: 'top',
  },
  charCountText: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
  },
  submitButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});

