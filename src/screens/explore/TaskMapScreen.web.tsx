import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../../store/useTaskStore';
import { formatPrice } from '../../utils/currency';
import { Task } from '../../types';

export const TaskMapScreen = ({ navigation }: any) => {
  const { tasks, fetchTasks } = useTaskStore();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setUserLocation(coords);
          await fetchTasks({ lat: coords.latitude, lng: coords.longitude, radius_km: 30 });
        } else {
          setUserLocation({ latitude: 37.7749, longitude: -122.4194 });
          await fetchTasks();
        }
      } catch {
        setUserLocation({ latitude: 37.7749, longitude: -122.4194 });
        await fetchTasks();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const activeLat = selectedTask ? selectedTask.latitude : (userLocation?.latitude || 37.7749);
  const activeLng = selectedTask ? selectedTask.longitude : (userLocation?.longitude || -122.4194);
  const bbox = `${activeLng - 0.04},${activeLat - 0.02},${activeLng + 0.04},${activeLat + 0.02}`;
  const iframeSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${activeLat},${activeLng}`;

  if (loading || !userLocation) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#103B31" />
        <Text style={styles.loadingText}>Locating nearby gigs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Interactive Web Map Embed */}
      <View style={styles.mapContainer}>
        {React.createElement('iframe', {
          src: iframeSrc,
          style: {
            width: '100%',
            height: '100%',
            border: 'none',
          },
          title: 'Gig Location Map',
        })}

        <View style={styles.mapOverlayNotice}>
          <Ionicons name="map-outline" size={15} color="#103B31" style={{ marginRight: 6 }} />
          <Text style={styles.mapOverlayNoticeText}>
            {selectedTask ? `Viewing: ${selectedTask.title}` : `Showing ${tasks.length} nearby gigs`}
          </Text>
        </View>
      </View>

      {/* Nearby Gigs List on Web */}
      <View style={styles.listSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Gigs on Map ({tasks.length})</Text>
          <TouchableOpacity onPress={() => fetchTasks()} style={styles.refreshBtn}>
            <Ionicons name="refresh" size={16} color="#103B31" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.tasksScrollView}
          contentContainerStyle={styles.tasksList}
          showsVerticalScrollIndicator={false}
        >
          {tasks.map((task) => {
            const isSelected = selectedTask?.id === task.id;
            return (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskCard, isSelected && styles.taskCardSelected]}
                onPress={() => setSelectedTask(task)}
                activeOpacity={0.8}
              >
                <View style={styles.taskCardTop}>
                  <View style={styles.categoryPill}>
                    <Text style={styles.categoryText}>{task.category}</Text>
                  </View>
                  <Text style={styles.priceText}>{formatPrice(task.budget, task.currency)}</Text>
                </View>

                <Text style={styles.taskTitle} numberOfLines={1}>
                  {task.title}
                </Text>

                <Text style={styles.taskLocation} numberOfLines={1}>
                  📍 {task.location_name || 'Neighborhood area'}
                </Text>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.viewDetailBtn}
                    onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}
                  >
                    <Text style={styles.viewDetailBtnText}>View Details</Text>
                    <Ionicons name="arrow-forward" size={13} color="#103B31" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1.1,
    position: 'relative',
    backgroundColor: '#e2e8f0',
  },
  mapOverlayNotice: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  mapOverlayNoticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#103B31',
  },
  listSection: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  refreshBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f2f7f5',
  },
  tasksScrollView: {
    flex: 1,
  },
  tasksList: {
    padding: 12,
    gap: 10,
    paddingBottom: 40,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  taskCardSelected: {
    borderColor: '#103B31',
    backgroundColor: '#fbfdfc',
  },
  taskCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryPill: {
    backgroundColor: '#f2f7f5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    color: '#103B31',
    fontSize: 11,
    fontWeight: '700',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#103B31',
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  taskLocation: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#f2f7f5',
  },
  viewDetailBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#103B31',
  },
});

