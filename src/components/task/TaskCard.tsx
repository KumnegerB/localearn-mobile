import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../../types';

import { formatPrice } from '../../utils/currency';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onPress }) => {
  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return '#10b981';
      case 'ASSIGNED':
        return '#f59e0b';
      case 'COMPLETED':
        return '#6366f1';
      default:
        return '#94a3b8';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.categoryContainer}>
            <Text style={styles.categoryText}>{task.category}</Text>
          </View>
          {task.applications_count !== undefined && (
            <View style={styles.applicantBadge}>
              <Ionicons name="people-outline" size={12} color="#103B31" style={{ marginRight: 3 }} />
              <Text style={styles.applicantBadgeText}>
                {task.applications_count} applied
              </Text>
            </View>
          )}
        </View>
        <View style={[styles.badge, { backgroundColor: getBadgeColor(task.status) }]}>
          <Text style={styles.badgeText}>{task.status}</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={1}>{task.title}</Text>
      <Text style={styles.description} numberOfLines={2}>{task.description}</Text>

      <View style={styles.footer}>
        <View style={styles.locationContainer}>
          <Text style={styles.locationText} numberOfLines={1}>
            📍 {task.location_name || 'Nearby'}
            {task.distance_km !== undefined && task.distance_km !== null
              ? ` (${task.distance_km} km away)`
              : ''}
          </Text>
        </View>
        <Text style={styles.budgetText}>{formatPrice(task.budget, task.currency)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  applicantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f7f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cce3de',
  },
  applicantBadgeText: {
    color: '#103B31',
    fontSize: 11,
    fontWeight: '700',
  },
  categoryContainer: {
    backgroundColor: '#f2f7f5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    color: '#103B31',
    fontSize: 12,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 10,
  },
  locationContainer: {
    flex: 1,
    marginRight: 8,
  },
  locationText: {
    fontSize: 13,
    color: '#64748b',
  },
  budgetText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10b981',
  },
});

