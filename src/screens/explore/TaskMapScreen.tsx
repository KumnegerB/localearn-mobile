import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../../store/useTaskStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatPrice } from '../../utils/currency';

export const TaskMapScreen = ({ navigation }: any) => {
  const { tasks, fetchTasks } = useTaskStore();
  const { user } = useAuthStore();
  const webViewRef = useRef<WebView>(null);

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
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
          // Default fallback coordinates (Addis Ababa / standard area)
          const fallback = { latitude: 9.0300, longitude: 38.7400 };
          setUserLocation(fallback);
          await fetchTasks();
        }
      } catch {
        const fallback = { latitude: 9.0300, longitude: 38.7400 };
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
      if (data.type === 'OPEN_TASK') {
        navigation.navigate('TaskDetail', { taskId: data.taskId });
      }
    } catch {
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

  // HTML content for Leaflet Map with street-level zoom and anchored tooltips
  const tasksJson = JSON.stringify(
    mapTasks.map((t) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      location: t.location_name || 'Neighborhood area',
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
    
    @keyframes pulseGlow {
      0%, 100% {
        transform: translate(-50%, -50%) scale(1);
        box-shadow: 0 4px 12px rgba(16, 59, 49, 0.35);
      }
      50% {
        transform: translate(-50%, -50%) scale(1.15);
        box-shadow: 0 8px 20px rgba(16, 59, 49, 0.55), 0 0 0 5px rgba(16, 59, 49, 0.18);
      }
    }

    /* Gig Bag Marker with smooth slow pulse animation - ALWAYS ON TOP */
    .bag-marker {
      width: 38px;
      height: 38px;
      background: #103B31;
      border: 2.5px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(16, 59, 49, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transform: translate(-50%, -50%);
      animation: pulseGlow 2.8s ease-in-out infinite;
      will-change: transform, box-shadow;
      z-index: 2500 !important;
    }
    .bag-marker.selected {
      background: #E07A5F !important;
      animation: none !important;
      transform: translate(-50%, -50%) scale(1.25) !important;
      box-shadow: 0 8px 24px rgba(224, 122, 95, 0.6) !important;
      z-index: 9999 !important;
    }
    .bag-marker svg {
      width: 19px;
      height: 19px;
      fill: #ffffff;
      display: block;
    }

    /* User GPS Pinpoint Marker */
    .user-pinpoint {
      cursor: pointer;
      transform: translate(-50%, -100%);
      transition: transform 0.15s ease;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.35));
      z-index: 100 !important;
    }
    .user-pinpoint:active {
      transform: translate(-50%, -100%) scale(1.1);
    }
    .user-pinpoint svg {
      display: block;
    }

    /* Leaflet Controls Hidden */
    .leaflet-control-attribution { display: none !important; }
    .leaflet-control-zoom { display: none !important; }

    /* User Location Tooltip Popup */
    .user-location-popup .leaflet-popup-content-wrapper {
      background: #ffffff !important;
      border-radius: 20px !important;
      padding: 0 !important;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18) !important;
      border: 1px solid rgba(0, 0, 0, 0.06) !important;
    }
    .user-location-popup .leaflet-popup-content {
      margin: 0 !important;
      width: auto !important;
      padding: 7px 14px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      font-size: 13px !important;
      font-weight: 800 !important;
      color: #0f172a !important;
      white-space: nowrap !important;
    }
    .user-location-dot {
      width: 8px;
      height: 8px;
      background: #2563eb;
      border-radius: 50%;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.25);
    }

    /* Custom Job Tooltip/Popup directly above pointer */
    .job-popup .leaflet-popup-content-wrapper {
      background: #ffffff !important;
      border-radius: 16px !important;
      padding: 0 !important;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2) !important;
      border: 1px solid rgba(0, 0, 0, 0.06) !important;
      overflow: hidden !important;
    }
    .job-popup .leaflet-popup-content {
      margin: 0 !important;
      width: 215px !important;
      padding: 12px 14px !important;
      line-height: 1.3 !important;
    }
    .leaflet-popup-tip-container {
      width: 20px !important;
      height: 10px !important;
    }
    .leaflet-popup-tip {
      background: #ffffff !important;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12) !important;
    }
    .leaflet-container a.leaflet-popup-close-button {
      color: #94a3b8 !important;
      padding: 6px 8px 0 0 !important;
      font-size: 16px !important;
    }

    .popup-category {
      display: inline-block;
      background: #f2f7f5;
      color: #103B31;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 6px;
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .popup-title {
      font-size: 14px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 3px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .popup-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      gap: 6px;
    }
    .popup-location {
      font-size: 11px;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }
    .popup-price {
      font-size: 14px;
      font-weight: 900;
      color: #103B31;
      white-space: nowrap;
    }
    .popup-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      background: #103B31;
      color: #ffffff !important;
      font-size: 12px;
      font-weight: 800;
      padding: 8px 0;
      border-radius: 10px;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(16, 59, 49, 0.25);
    }
    .popup-btn:active {
      background: #0b261f;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function openTask(id) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_TASK', taskId: id }));
    }

    // Street-level initial zoom (16)
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${userLocation.latitude}, ${userLocation.longitude}], 16);

    // Google Maps Roadmap Layer (Full building names, landmarks, businesses - 0 API key required)
    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(map);

    // User GPS Pinpoint Marker with "Your location" Tooltip
    var userPinIcon = L.divIcon({
      className: '',
      html: '<div class="user-pinpoint"><svg width="32" height="38" viewBox="0 0 24 28" fill="none"><path d="M12 0C5.37 0 0 5.37 0 12C0 19.5 10.5 27.2 11.25 27.75C11.7 28.08 12.3 28.08 12.75 27.75C13.5 27.2 24 19.5 24 12C24 5.37 18.63 0 12 0Z" fill="#2563eb" stroke="#ffffff" stroke-width="1.8"/><circle cx="12" cy="11" r="4.2" fill="#ffffff"/></svg></div>',
      iconSize: [0, 0]
    });
    var userMarker = L.marker([${userLocation.latitude}, ${userLocation.longitude}], {
      icon: userPinIcon,
      zIndexOffset: 100
    }).addTo(map);

    userMarker.bindPopup('<span class="user-location-dot"></span><span>Your location</span>', {
      className: 'user-location-popup',
      offset: [0, -34],
      closeButton: false,
      autoPan: true
    });

    // Task Markers with anchored Tooltip / Popup - ALWAYS ON TOP of person location
    var tasks = ${tasksJson};

    tasks.forEach(function(t) {
      var bagSvg = '<svg viewBox="0 0 24 24"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>';
      var icon = L.divIcon({
        className: '',
        html: '<div class="bag-marker" id="pin-' + t.id + '">' + bagSvg + '</div>',
        iconSize: [0, 0]
      });

      var marker = L.marker([t.lat, t.lng], { icon: icon, zIndexOffset: 3000 }).addTo(map);

      var popupHtml = 
        '<div class="popup-category">' + escapeHtml(t.category) + '</div>' +
        '<div class="popup-title">' + escapeHtml(t.title) + '</div>' +
        '<div class="popup-meta">' +
          '<div class="popup-location">📍 ' + escapeHtml(t.location) + '</div>' +
          '<div class="popup-price">' + t.price + '</div>' +
        '</div>' +
        '<div class="popup-btn" onclick="openTask(' + t.id + ')">View Details &rarr;</div>';

      // Auto-closes previously open popups, offsets directly above the bag marker
      marker.bindPopup(popupHtml, {
        className: 'job-popup',
        offset: [0, -20],
        closeButton: true,
        autoPan: true,
        autoPanPaddingTopLeft: [20, 20],
        autoPanPaddingBottomRight: [20, 75]
      });

      // Highlight pin and bring to top-most z-index when open
      marker.on('popupopen', function() {
        marker.setZIndexOffset(6000);
        var el = document.getElementById('pin-' + t.id);
        if (el) el.classList.add('selected');
      });

      marker.on('popupclose', function() {
        marker.setZIndexOffset(3000);
        var el = document.getElementById('pin-' + t.id);
        if (el) el.classList.remove('selected');
      });
    });

    window.recenterMap = function(lat, lng) {
      map.setView([lat, lng], 16, { animate: true });
      if (userMarker) {
        userMarker.setLatLng([lat, lng]);
      }
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
});
