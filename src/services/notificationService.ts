import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  EventType,
} from "@notifee/react-native";
import messaging, {
  FirebaseMessagingTypes,
} from "@react-native-firebase/messaging";
import { PermissionsAndroid, Platform } from "react-native";
import { UserProfile } from "./authService";

// Cache for Android notification channel to avoid recreating
let notificationChannelId: string | null = null;

export type NotificationPermissionStatus =
  | "granted"
  | "denied"
  | "not_determined";

export interface NotificationPayload {
  title?: string;
  body?: string;
  data?: Record<string, any>;
}

// User topic categorization based on profile
export const getUserTopics = (userProfile: UserProfile | null): string[] => {
  if (!userProfile) return ["all_users"];

  const topics: string[] = ["all_users"];

  // Add merchant topic if user has verification badge or verified status
  if (userProfile.verifiedStatus === "VERIFIED") {
    topics.push("merchants");
  } else {
    topics.push("non_merchants");
  }

  // Add country-specific topic if available
  if (userProfile.country) {
    topics.push(`country_${userProfile.country.toLowerCase()}`);
  }

  // Add analytics access topic
  if (userProfile.analyticsAccessStatus === "APPROVED") {
    topics.push("analytics_users");
  }

  // Add user status topic
  if (userProfile.status) {
    topics.push(`status_${userProfile?.verifiedStatus?.toLowerCase()}`);
  }

  return topics;
};

// Helper: Create or get cached notification channel (Android only)
const getOrCreateNotificationChannel = async (): Promise<string> => {
  if (notificationChannelId) {
    return notificationChannelId;
  }

  try {
    notificationChannelId = await notifee.createChannel({
      id: "default",
      name: "NODO.ia Notifications",
      importance: AndroidImportance.HIGH,
      sound: "default",
      vibration: true,
    });
    return notificationChannelId;
  } catch (error) {
    console.error("Error creating notification channel:", error);
    return "default"; // Fallback
  }
};

export const NotificationService = {
  /**
   * Request notification permissions (unified for both Firebase and Notifee)
   */
  requestPermission: async (): Promise<NotificationPermissionStatus> => {
    try {
      // Request Firebase messaging permission (required for FCM)
      const fcmAuthStatus = await messaging().requestPermission();
      const fcmEnabled =
        fcmAuthStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        fcmAuthStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!fcmEnabled) {
        console.log("Firebase notification permission denied");
        return "denied";
      }

      // Request Notifee permission (for displaying local notifications)
      const notifeeSettings = await notifee.requestPermission();
      const notifeeEnabled =
        notifeeSettings.authorizationStatus ===
          AuthorizationStatus.AUTHORIZED ||
        notifeeSettings.authorizationStatus === AuthorizationStatus.PROVISIONAL;

      if (!notifeeEnabled) {
        console.log("Notifee notification permission denied");
        return "denied";
      }

      // Android 13+ requires runtime permission
      if (Platform.OS === "android" && Number(Platform.Version) >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log("Android POST_NOTIFICATIONS permission denied");
          return "denied";
        }
      }

      console.log("All notification permissions granted");
      return "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return "denied";
    }
  },

  /**
   * Check if notification permissions are granted
   */
  checkPermission: async (): Promise<NotificationPermissionStatus> => {
    try {
      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      return enabled ? "granted" : "denied";
    } catch (error) {
      console.error("Error checking notification permission:", error);
      return "denied";
    }
  },

  /**
   * Get FCM token for the device
   */
  getFCMToken: async (): Promise<string | null> => {
    try {
      const token = await messaging().getToken();
      console.log("FCM Token:", token);
      return token;
    } catch (error) {
      console.error("Error getting FCM token:", error);
      return null;
    }
  },

  /**
   * Subscribe to notification topics based on user profile
   */
  subscribeToTopics: async (userProfile: UserProfile | null): Promise<void> => {
    try {
      const topics = getUserTopics(userProfile);
      console.log("Subscribing to topics:", topics);

      for (const topic of topics) {
        await messaging().subscribeToTopic(topic);
        console.log(`Subscribed to topic: ${topic}`);
      }
    } catch (error) {
      console.error("Error subscribing to topics:", error);
    }
  },

  /**
   * Unsubscribe from all topics (called on logout)
   */
  unsubscribeFromAllTopics: async (
    userProfile: UserProfile | null
  ): Promise<void> => {
    try {
      const topics = getUserTopics(userProfile);
      console.log("Unsubscribing from topics:", topics);

      for (const topic of topics) {
        await messaging().unsubscribeFromTopic(topic);
        console.log(`Unsubscribed from topic: ${topic}`);
      }
    } catch (error) {
      console.error("Error unsubscribing from topics:", error);
    }
  },

  /**
   * Delete FCM token (called on logout)
   */
  deleteToken: async (): Promise<void> => {
    try {
      await messaging().deleteToken();
      console.log("FCM token deleted");
    } catch (error) {
      console.error("Error deleting FCM token:", error);
    }
  },

  /**
   * Handle notification received in foreground
   */
  onMessageReceived: (
    callback: (message: FirebaseMessagingTypes.RemoteMessage) => void
  ) => {
    return messaging().onMessage(callback);
  },

  /**
   * Handle notification opened from background/quit state
   */
  onNotificationOpenedApp: (
    callback: (message: FirebaseMessagingTypes.RemoteMessage) => void
  ) => {
    return messaging().onNotificationOpenedApp(callback);
  },

  /**
   * Get initial notification (when app opened from quit state)
   */
  getInitialNotification:
    async (): Promise<FirebaseMessagingTypes.RemoteMessage | null> => {
      try {
        return await messaging().getInitialNotification();
      } catch (error) {
        console.error("Error getting initial notification:", error);
        return null;
      }
    },

  /**
   * Set background message handler (must be called at app root level)
   */
  setBackgroundMessageHandler: (
    handler: (message: FirebaseMessagingTypes.RemoteMessage) => Promise<void>
  ) => {
    messaging().setBackgroundMessageHandler(handler);
  },

  /**
   * Display local notification using Notifee (unified for all notification types)
   */
  displayNotification: async (notification: NotificationPayload) => {
    try {
      // Get or create notification channel for Android
      const channelId = await getOrCreateNotificationChannel();

      // Display the notification
      await notifee.displayNotification({
        title: notification.title || "NODO.ia",
        body: notification.body || "",
        data: notification.data,
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: "default",
          },
          smallIcon: "ic_stat_name",
          color: "#00000000",
        },
        ios: {
          sound: "default",
          foregroundPresentationOptions: {
            alert: true,
            badge: true,
            sound: true,
          },
        },
      });
    } catch (error) {
      console.error("Error displaying notification:", error);
      // Don't throw - fail silently to prevent app crashes
    }
  },

  /**
   * Cancel all displayed notifications
   */
  cancelAllNotifications: async (): Promise<void> => {
    try {
      await notifee.cancelAllNotifications();
      console.log("All notifications cancelled");
    } catch (error) {
      console.error("Error canceling notifications:", error);
      // Don't throw - fail silently
    }
  },

  /**
   * Set up notification event handlers (unified for both foreground and background)
   */
  setupNotificationHandlers: (onNotificationPress?: (data: any) => void) => {
    // Handle foreground events (when app is open)
    const unsubscribeForeground = notifee.onForegroundEvent(
      ({ type, detail }) => {
        if (type === EventType.PRESS && onNotificationPress) {
          onNotificationPress(detail.notification?.data);
        }
      }
    );

    // Handle background events (when app is in background)
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS && onNotificationPress) {
        onNotificationPress(detail.notification?.data);
      }
    });

    // Return combined unsubscribe function
    return () => {
      unsubscribeForeground();
      // Background handler doesn't return unsubscribe, so we don't call it
    };
  },
};
