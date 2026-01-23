import { Linking, Platform } from "react-native";
import Config from "react-native-config";
import VersionCheck from "react-native-version-check";

export interface VersionCheckResult {
  needsUpdate: boolean;
  storeUrl?: string;
  currentVersion: string;
  latestVersion?: string;
}

/**
 * App Configuration - Update these values for your app
 */
const APP_CONFIG = {
  IOS_APP_ID: Config.IOS_APP_ID, // Add your iOS App Store ID here (e.g., '1234567890')
  PACKAGE_NAME: Config.PACKAGE_NAME, // Add your Android package name here (e.g., 'com.yourcompany.yourapp')
  APP_CURRENT_VERSION: Config.APP_VERSION,
  SKIP_IN_DEV: true, // Skip version check in development
};

/**
 * Check if the app needs to be updated
 * Uses the exact approach you provided
 */
export const checkAppVersion = async (): Promise<VersionCheckResult> => {
  try {
    // Skip in development if configured
    if (__DEV__ && APP_CONFIG.SKIP_IN_DEV) {
      console.log("Version check skipped in development");
      return {
        needsUpdate: false,
        currentVersion: APP_CONFIG.APP_CURRENT_VERSION || "1.0",
      };
    }

    const currentVersion = APP_CONFIG.APP_CURRENT_VERSION || "1.0";

    if (!currentVersion) {
      console.warn("Could not get current app version");
      return {
        needsUpdate: false,
        currentVersion: "1.0",
      };
    }

    console.log("Current app version:", currentVersion);

    // Get latest store version (automatic platform selection)
    const latestVersion = await VersionCheck.getLatestVersion({
      provider: Platform.OS === "ios" ? "appStore" : "playStore",
    });

    console.log("Latest store version:", latestVersion);

    // Decide if update needed
    const { isNeeded } = await VersionCheck.needUpdate({
      currentVersion,
      latestVersion,
    });

    // Get store URL
    let storeUrl: string | undefined;
    try {
      if (Platform.OS === "ios" && APP_CONFIG.IOS_APP_ID) {
        storeUrl = await VersionCheck.getAppStoreUrl({
          appID: APP_CONFIG.IOS_APP_ID,
        });
      } else if (Platform.OS === "android" && APP_CONFIG.PACKAGE_NAME) {
        storeUrl = `https://play.google.com/store/apps/details?id=${APP_CONFIG.PACKAGE_NAME}`;
      }
    } catch (error) {
      console.warn("Could not get store URL from VersionCheck:", error);
      // Fallback URLs
      storeUrl = Platform.select({
        ios: APP_CONFIG.IOS_APP_ID
          ? `https://apps.apple.com/app/id${APP_CONFIG.IOS_APP_ID}`
          : undefined,
        android: APP_CONFIG.PACKAGE_NAME
          ? `https://play.google.com/store/apps/details?id=${APP_CONFIG.PACKAGE_NAME}`
          : undefined,
      });
    }

    const result = {
      needsUpdate: isNeeded || false,
      storeUrl,
      currentVersion,
      latestVersion,
    };

    console.log("Version check result:", result);
    return result;
  } catch (error) {
    console.error("Version check failed:", error);
    return {
      needsUpdate: false,
      currentVersion: APP_CONFIG.APP_CURRENT_VERSION || "1.0",
    };
  }
};

/**
 * Open the app store for updates
 */
export const openAppStore = async (storeUrl?: string) => {
  try {
    if (storeUrl) {
      await Linking.openURL(storeUrl);
      return;
    }

    // Fallback URLs if no storeUrl provided
    const url = Platform.select({
      ios: APP_CONFIG.IOS_APP_ID
        ? `https://apps.apple.com/app/id${APP_CONFIG.IOS_APP_ID}`
        : undefined,
      android: APP_CONFIG.PACKAGE_NAME
        ? `https://play.google.com/store/apps/details?id=${APP_CONFIG.PACKAGE_NAME}`
        : undefined,
    });

    if (url) {
      await Linking.openURL(url);
    } else {
      console.warn("No store URL available for this platform");
    }
  } catch (error) {
    console.error("Failed to open app store:", error);
  }
};

/**
 * For testing purposes - simulates an update being available
 */
export const simulateUpdateAvailable = (): VersionCheckResult => {
  return {
    needsUpdate: true,
    currentVersion: APP_CONFIG.APP_CURRENT_VERSION || "1.0",
    latestVersion: "10.0",
    storeUrl: Platform.select({
      ios: APP_CONFIG.IOS_APP_ID
        ? `https://apps.apple.com/app/id${APP_CONFIG.IOS_APP_ID}`
        : undefined,
      android: APP_CONFIG.PACKAGE_NAME
        ? `https://play.google.com/store/apps/details?id=${APP_CONFIG.PACKAGE_NAME}`
        : undefined,
    }),
  };
};
