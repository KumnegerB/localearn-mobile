import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';

// Detect whether running inside the standard Expo Go client app from the app store
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as any).appOwnership === 'expo';

// Lazily and safely resolve expo-notifications to prevent 'Cannot find native module ExpoTopicSubscriptionModule'
// in Expo Go on Android (Expo issue #52175). It loads smoothly in standalone EAS preview builds.
let Notifications: any = null;
if (!isExpoGo || Platform.OS !== 'android') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Notifications = require('expo-notifications');
  } catch (e) {
    console.warn('[PUSH] expo-notifications native module not registered in this runtime:', e);
  }
}

// Configure foreground notification behavior if the native module is present
if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Requests push notification permissions and retrieves the Expo Push Token.
 */
export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  if (!Notifications) {
    console.log('[PUSH] Push notifications are not supported inside Expo Go on Android (SDK issue #52175). They will function in the standalone EAS build.');
    return null;
  }

  if (!Device.isDevice) {
    console.log('[PUSH] Must run on a physical device for remote push notifications');
    return null;
  }

  try {
    if (Platform.OS === 'android' && typeof Notifications.setNotificationChannelAsync === 'function') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#103B31',
        sound: 'default',
        enableVibrate: true,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[PUSH] Permission not granted for push notifications');
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      'b3659f5d-c988-41c3-98c3-83064c768433';

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return tokenData.data;
  } catch (error) {
    console.warn('[PUSH] Error getting push token:', error);
    return null;
  }
};

/**
 * Registers or synchronizes the current device's push token with the backend.
 */
export const syncPushTokenWithBackend = async (): Promise<void> => {
  try {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      await apiClient.post('/users/push-token', { push_token: token });
      console.log('[PUSH] Push token synced with backend successfully:', token.slice(0, 25) + '...');
    }
  } catch (error) {
    console.warn('[PUSH] Failed to sync push token with backend:', error);
  }
};

/**
 * Clears the push token on the backend when user logs out.
 */
export const clearPushTokenOnBackend = async (): Promise<void> => {
  try {
    await apiClient.delete('/users/push-token');
  } catch {
    // Non-blocking cleanup
  }
};

/**
 * Attaches a listener for when a user interacts with / taps an incoming push notification.
 */
export const setupNotificationResponseListener = (navigationRef: any) => {
  if (!Notifications || typeof Notifications.addNotificationResponseReceivedListener !== 'function') {
    return { remove: () => {} };
  }

  return Notifications.addNotificationResponseReceivedListener((response: any) => {
    try {
      const data = response?.notification?.request?.content?.data;
      if (!data || !navigationRef?.isReady()) return;

      const { type, taskId, taskTitle, senderId, senderName } = data;

      if (type === 'CHAT_MESSAGE' && senderId) {
        navigationRef.navigate('ChatRoom', {
          taskId: taskId || 0,
          taskTitle: taskTitle || undefined,
          otherUser: {
            id: senderId,
            full_name: senderName || 'Neighbor',
          },
        });
      } else if (type === 'NEW_CANDIDATE' || type === 'APPLICATION_WITHDRAWN') {
        if (taskId) {
          navigationRef.navigate('TaskCandidates', {
            taskId,
            taskTitle: taskTitle || 'Gig Candidates',
          });
        }
      } else if (type === 'APPLICATION_ACCEPTED' || type === 'TASK_COMPLETED' || type === 'NEW_REVIEW') {
        if (taskId) {
          navigationRef.navigate('TaskDetail', {
            taskId,
          });
        }
      }
    } catch (e) {
      console.warn('[PUSH] Error navigating from notification response:', e);
    }
  });
};
