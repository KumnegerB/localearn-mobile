import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTaskStore } from '../../store/useTaskStore';
import { formatPrice } from '../../utils/currency';

export const TaskMapScreen = ({ navigation }: any) => {
  const { tasks, fetchTasks } = useTaskStore();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
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
          // Default to fallback coordinates if permission denied
          setUserLocation({ latitude: 37.7749, longitude: -122.4194 });
          await fetchTasks();
        }
      } catch (e) {
        setUserLocation({ latitude: 37.7749, longitude: -122.4194 });
        await fetchTasks();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
          zIndex={-1}
        />
        {tasks.map((task) => (
          <Marker
            key={task.id}
            coordinate={{
              latitude: task.latitude,
              longitude: task.longitude,
            }}
            title={task.title}
            description={`${formatPrice(task.budget, task.currency)} - ${task.category}`}
          >
            <View style={styles.markerContainer}>
              <Text style={styles.markerPrice}>{formatPrice(task.budget, task.currency)}</Text>
            </View>
            <Callout onPress={() => navigation.navigate('TaskDetail', { taskId: task.id })}>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{task.title}</Text>
                <Text style={styles.calloutCategory}>{task.category}</Text>
                <Text style={styles.calloutPrice}>{formatPrice(task.budget, task.currency)}</Text>
                <Text style={styles.calloutLink}>Tap to view details</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  markerContainer: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  markerPrice: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  calloutContainer: {
    width: 170,
    padding: 4,
  },
  calloutTitle: {
    fontWeight: '700',
    fontSize: 14,
    color: '#0f172a',
  },
  calloutCategory: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  calloutPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10b981',
    marginTop: 4,
  },
  calloutLink: {
    fontSize: 11,
    color: '#2563eb',
    marginTop: 4,
  },
});

