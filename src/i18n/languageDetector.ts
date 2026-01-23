import { NativeModules, Platform } from "react-native";

/**
 * Detects the device language with fallbacks to ensure it never crashes
 * @returns The detected language code (en or es)
 */
export const detectDeviceLanguage = (): string => {
  try {
    // Different methods based on platform
    let deviceLanguage = "en"; // Default fallback

    if (Platform.OS === "ios") {
      // iOS: Try different methods to get the locale
      const locale =
        // Get from preferred languages if available
        getPreferredLanguages()?.[0] ||
        // Or from localization manager if available
        getFromLocalizationManager() ||
        // Or from I18nManager
        NativeModules.I18nManager?.localeIdentifier ||
        // Default to English
        "en";

      deviceLanguage = locale;
    } else {
      // Android
      deviceLanguage = NativeModules.I18nManager?.localeIdentifier || "en";
    }

    // Extract language code (first 2 chars)
    const languageCode = getLanguageCode(deviceLanguage);
    return languageCode === "es" ? "es" : "en"; // Only support English and Spanish
  } catch (error) {
    console.warn(
      "Error detecting device language, defaulting to English:",
      error
    );
    return "en";
  }
};

/**
 * Gets language code from locale string
 */
const getLanguageCode = (locale: string): string => {
  try {
    // Different locale formats: en_US, en-US, etc.
    return locale.split(/[-_]/)[0].toLowerCase();
  } catch (error) {
    return "en";
  }
};

/**
 * Gets preferred languages from iOS
 */
const getPreferredLanguages = (): string[] | null => {
  try {
    if (Platform.OS === "ios") {
      return NativeModules.SettingsManager?.settings?.AppleLanguages;
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Gets locale from RCTLocalizationManager on iOS
 */
const getFromLocalizationManager = (): string | null => {
  try {
    if (Platform.OS === "ios") {
      return NativeModules.SettingsManager?.settings?.AppleLocale;
    }
    return null;
  } catch (error) {
    return null;
  }
};
