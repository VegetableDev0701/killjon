import { useEffect, useRef } from "react";
import { FirebaseMessagingTypes } from "@react-native-firebase/messaging";
import { NotificationService } from "../services/notificationService";
import { useAuthStore } from "../store/authStore";
import { storage } from "../utils/storage";

export const useNotifications = () => {
  const { userProfile, isLoggedIn } = useAuthStore();
  const isInitialized = useRef(false);
  const tokenRefreshListener = useRef<(() => void) | null>(null);

  // Setup notifications on login
  useEffect(() => {
    if (!isLoggedIn || !userProfile || isInitialized.current) {
      return;
    }

    const setupNotifications = async () => {
      try {
        console.log("[Notifications] Setting up for logged in user");

        // Check if user has enabled notifications (default: true)
        const notificationsEnabled = storage.getBoolean(
          "notifications_enabled"
        );
        const isEnabled =
          notificationsEnabled !== undefined ? notificationsEnabled : true;

        if (!isEnabled) {
          console.log("[Notifications] Disabled by user, skipping setup");
          isInitialized.current = true;
          return;
        }

        // Request permissions (unified Firebase + Notifee)
        const permissionStatus = await NotificationService.requestPermission();

        if (permissionStatus !== "granted") {
          console.log("[Notifications] Permission denied");
          isInitialized.current = true;
          return;
        }

        // Get FCM token
        const token = await NotificationService.getFCMToken();
        if (!token) {
          console.error("[Notifications] Failed to get FCM token");
          return;
        }

        // Subscribe to topics based on user profile
        await NotificationService.subscribeToTopics(userProfile);

        console.log("[Notifications] Setup complete");
        isInitialized.current = true;

        // TODO: Optionally send token to backend for direct notifications
        // await sendTokenToBackend(token);
      } catch (error) {
        console.error("[Notifications] Setup error:", error);
      }
    };

    setupNotifications();

    // Cleanup function
    return () => {
      if (tokenRefreshListener.current) {
        tokenRefreshListener.current();
        tokenRefreshListener.current = null;
      }
    };
  }, [isLoggedIn, userProfile]);

  // Cleanup on logout
  useEffect(() => {
    if (!isLoggedIn && isInitialized.current) {
      const cleanup = async () => {
        try {
          console.log("[Notifications] User logged out, cleaning up");
          await NotificationService.unsubscribeFromAllTopics(userProfile);
          await NotificationService.deleteToken();
          await NotificationService.cancelAllNotifications();
          isInitialized.current = false;
        } catch (error) {
          console.error("[Notifications] Cleanup error:", error);
        }
      };

      cleanup();
    }
  }, [isLoggedIn, userProfile]);
};

export const useNotificationHandlers = (
  onNotificationOpened?: (message: FirebaseMessagingTypes.RemoteMessage) => void
) => {
  useEffect(() => {
    // Handle foreground notifications
    const unsubscribeForeground = NotificationService.onMessageReceived(
      (message) => {
        console.log("Foreground notification received:", message);
        NotificationService.displayNotification({
          title: message.notification?.title,
          body: message.notification?.body,
          data: message.data,
        });
      }
    );

    // Handle notification opened from background
    const unsubscribeBackground = NotificationService.onNotificationOpenedApp(
      (message) => {
        console.log("Background notification opened:", message);

        if (onNotificationOpened) {
          onNotificationOpened(message);
        }
      }
    );

    // Handle notification opened from quit state
    NotificationService.getInitialNotification().then((message) => {
      if (message) {
        console.log("Quit state notification opened:", message);

        if (onNotificationOpened) {
          onNotificationOpened(message);
        }
      }
    });

    return () => {
      unsubscribeForeground();
      unsubscribeBackground();
    };
  }, [onNotificationOpened]);
};
