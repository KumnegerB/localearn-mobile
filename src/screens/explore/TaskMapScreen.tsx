import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../../store/useTaskStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatPrice } from '../../utils/currency';
import { Task } from '../../types';

export const TaskMapScreen = ({ navigation }: any) => {
  const { tasks, fetchTasks } = useTaskStore();
  const { user } = useAuthStore();
  const webViewRef = useRef<WebView>(null);

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  // Self-exclusion: filter out tasks created by the logged-in user
  const mapTasks = tasks.filter((task) => !user?.id || task.creator_id !== user.id);

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
          const fallback = { latitude: 37.7749, longitude: -122.4194 };
          setUserLocation(fallback);
          await fetchTasks();
        }
      } catch {
        const fallback = { latitude: 37.7749, longitude: -122.4194 };
        setUserLocation(fallback);
        await fetchTasks();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'SELECT_TASK') {
        const matched = mapTasks.find((t) => t.id === data.taskId);
        if (matched) {
          setSelectedTask(matched);
        }
      } else if (data.type === 'DESELECT') {
        setSelectedTask(null);
      }
    } catch (e) {
      // Ignored
    }
  };

  const recenterMap = () => {
    if (userLocation && webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `if (window.recenterMap) { window.recenterMap(${userLocation.latitude}, ${userLocation.longitude}); } true;`
      );
    }
  };

  if (loading || !userLocation) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#103B31" />
        <Text style={styles.loadingText}>Locating nearby gigs...</Text>
      </View>
    );
  }

  // HTML content for Leaflet Map
  const tasksJson = JSON.stringify(
    mapTasks.map((t) => ({
      id: t.id,
      title: t.title,
      price: formatPrice(t.budget, t.currency),
      lat: t.latitude,
      lng: t.longitude,
    }))
  );

  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body, #map { width: 100%; height: 100%; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
    .price-pill {
      background: #103B31;
      color: #ffffff;
      padding: 5px 9px;
      border-radius: 14px;
      font-weight: 800;
      font-size: 12px;
      border: 2px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.28);
      white-space: nowrap;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      transition: all 0.2s ease;
      transform: translate(-50%, -50%);
    }
    .price-pill.selected {
      background: #E07A5F !important;
      transform: translate(-50%, -50%) scale(1.18);
      box-shadow: 0 6px 14px rgba(224, 122, 95, 0.45);
      z-index: 9999 !important;
    }
    .user-marker {
      width: 16px;
      height: 16px;
      background: #2563eb;
      border: 3px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 0 0 5px rgba(37, 99, 235, 0.35);
      transform: translate(-50%, -50%);
    }
    .leaflet-control-attribution { display: none !important; }
    .leaflet-control-zoom { display: none !important; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${userLocation.latitude}, ${userLocation.longitude}], 13);

    L.tileLayer('https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // User GPS Marker
    var userIcon = L.divIcon({
      className: '',
      html: '<div class="user-marker"></div>',
      iconSize: [0, 0]
    });
    L.marker([${userLocation.latitude}, ${userLocation.longitude}], { icon: userIcon }).addTo(map);

    // Task Markers
    var tasks = ${tasksJson};
    var selectedId = ${selectedTask ? selectedTask.id : 'null'};

    tasks.forEach(function(t) {
      var isSel = (t.id === selectedId);
      var cls = isSel ? 'price-pill selected' : 'price-pill';
      var icon = L.divIcon({
        className: '',
        html: '<div class="' + cls + '" id="pin-' + t.id + '">' + t.price + '</div>',
        iconSize: [0, 0]
      });

      var marker = L.marker([t.lat, t.lng], { icon: icon }).addTo(map);
      marker.on('click', function(e) {
        L.DomEvent.stopPropagation(e);
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SELECT_TASK', taskId: t.id }));
      });
    });

    map.on('click', function() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'DESELECT' }));
    });

    window.recenterMap = function(lat, lng) {
      map.setView([lat, lng], 14, { animate: true });
    };
  </script>
</body>
</html>
  `;

  return (
    <View style={styles.container}>
      {/* Interactive Map WebView */}
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        style={styles.map}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        scalesPageToFit={true}
      />

      {/* Top Floating Badge */}
      <View style={styles.topBadgeContainer}>
        <View style={styles.topBadge}>
          <Ionicons name="map" size={14} color="#103B31" style={{ marginRight: 6 }} />
          <Text style={styles.topBadgeText}>
            {mapTasks.length} {mapTasks.length === 1 ? 'gig' : 'gigs'} nearby
          </Text>
        </View>
      </View>

      {/* Floating Action Controls */}
      <View style={styles.floatingControls}>
        <TouchableOpacity
          style={styles.fabBtn}
          activeOpacity={0.8}
          onPress={recenterMap}
        >
          <Ionicons name="locate" size={20} color="#103B31" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fabBtn}
          activeOpacity={0.8}
          onPress={() => fetchTasks()}
        >
          <Ionicons name="refresh" size={18} color="#103B31" />
        </TouchableOpacity>
      </View>

      {/* Bottom Floating Task Detail Card */}
      {selectedTask && (
        <View style={styles.floatingCard}>
          <View style={styles.cardHeader}>
            <View style={styles.categoryPill}>
              <Text style={styles.categoryText}>{selectedTask.category}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedTask(null)}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.cardTitle} numberOfLines={1}>
            {selectedTask.title}
          </Text>

          <View style={styles.cardMetaRow}>
            <Text style={styles.cardLocation} numberOfLines={1}>
              📍 {selectedTask.location_name || 'Neighborhood area'}
            </Text>
            <Text style={styles.cardPrice}>
              {formatPrice(selectedTask.budget, selectedTask.currency)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.viewDetailBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('TaskDetail', { taskId: selectedTask.id })}
          >
            <Text style={styles.viewDetailBtnText}>View Details</Text>
            <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    position: 'relative',
  },
  map: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    fontWeight: '600',
  },
  topBadgeContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  topBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#103B31',
  },
  floatingControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    gap: 8,
  },
  fabBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingCard: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
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
  closeBtn: {
    padding: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardLocation: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
    marginRight: 8,
  },
  cardPrice: {
    fontSize: 17,
    fontWeight: '900',
    color: '#103B31',
  },
  viewDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#103B31',
    paddingVertical: 12,
    borderRadius: 12,
  },
  viewDetailBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
