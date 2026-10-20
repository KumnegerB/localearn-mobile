// For local emulator/device testing:
// Android Emulator uses 10.0.2.2 to reach host machine
// iOS Simulator uses localhost or 127.0.0.1
// Physical device requires your local LAN IP (e.g., http://192.168.1.x:8000)
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getHost = () => {
  // If running in Expo Go or development client, dynamically resolve the host machine's IP
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    if (ip) {
      return ip;
    }
  }

  // Fallback to local Wi-Fi IP for physical devices, or 10.0.2.2 for Android emulator
  if (Platform.OS === 'android') {
    return '192.168.1.5'; // Computer Wi-Fi IP
  }
  return '192.168.1.5';
};

// Production live backend hosted on Render
export const API_BASE_URL = 'https://local-earn-backend.onrender.com';
export const API_V1_URL = `${API_BASE_URL}/api/v1`;

export const getWebSocketUrl = (taskId: number, otherUserId: number, token: string) => {
  return `wss://local-earn-backend.onrender.com/api/v1/chat/ws/${taskId}?other_user_id=${otherUserId}&token=${token}`;
};

