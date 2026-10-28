import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';

// Lazily and safely resolve expo-notifications to prevent 'Cannot find native module ExpoTopicSubscriptionModule'
// in Expo Go on Android (Expo issue #52175). It loads smoothly in standalone EAS preview builds.
let Notifications: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = require('expo-notifications');
} catch (e) {
  console.warn('[PUSH] expo-notifications native module not registered in this runtime:', e);
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
 * Configure Android notification channels for high priority display.
 */
export const setupNotificationChannels = async (): Promise<void> => {
  if (Platform.OS === 'android' && Notifications && typeof Notifications.setNotificationChannelAsync === 'function') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'General',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#103B31',
        sound: 'default',
        enableVibrate: true,
      });
      await Notifications.setNotificationChannelAsync('chat_messages', {
        name: 'Chat Messages',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 200, 200],
        lightColor: '#103B31',
        sound: 'default',
        enableVibrate: true,
      });
    } catch (e) {
      console.warn('[PUSH] Failed to setup Android notification channels:', e);
    }
  }
};

/**
 * Triggers an immediate local system notification banner on the device tray.
 * Operates completely offline without requiring Firebase / FCM credentials!
 */
export const triggerLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> => {
  if (!Notifications || typeof Notifications.scheduleNotificationAsync !== 'function') {
    return;
  }
  try {
    await setupNotificationChannels();
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
        channelId: data?.type === 'CHAT_MESSAGE' ? 'chat_messages' : 'default',
      },
      trigger: null,
    });
  } catch (err) {
    console.warn('[PUSH] Failed to trigger local notification:', err);
  }
};

/**
 * Test helper for the user to confirm notifications work on their device.
 */
export const sendTestNotification = async (): Promise<boolean> => {
  try {
    await triggerLocalNotification(
      '🎉 ስራ (Sira) Notifications Active!',
      'Device notification permissions and audio channels are working properly.',
      { type: 'TEST_NOTIFICATION' }
    );
    return true;
  } catch {
    return false;
  }
};

/**
 * Requests push notification permissions and retrieves the Expo Push Token.
 */
export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  if (!Notifications) {
    console.log('[PUSH] Notifications native module not available in this runtime.');
    return null;
  }

  if (!Device.isDevice) {
    console.log('[PUSH] Must run on a physical device for remote push notifications');
    return null;
  }

  try {
    await setupNotificationChannels();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[PUSH] Permission not granted for push notifications (status: ' + finalStatus + ')');
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId ??
      'b3659f5d-c988-41c3-98c3-83064c768433';

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      console.log('[PUSH] Successfully obtained Expo push token:', tokenData.data);
      return tokenData.data;
    } catch (fcmError: any) {
      console.warn(
        '[PUSH] Note: Remote push token requires Firebase FCM credentials (google-services.json) in standalone Android APKs:',
        fcmError?.message || fcmError
      );
      return null;
    }
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
