import remoteConfig from "@react-native-firebase/remote-config";
import { useEffect, useState } from "react";
import { StaticStory } from "../types/story";

/**
 * Firebase Remote Config Service
 *
 * Centralized service for managing Firebase Remote Config
 * Used for static stories and promotional content
 */

// Default values for Remote Config
const defaultConfig = {
  static_stories: JSON.stringify([]), // Empty array as default
};

let isInitialized = false;

/**
 * Initialize Firebase Remote Config
 * Sets default values and fetch interval
 */
export const initializeRemoteConfig = async (): Promise<void> => {
  if (isInitialized) {
    return;
  }

  try {
    // Set default config values
    await remoteConfig().setDefaults(defaultConfig);

    // Set minimum fetch interval (1 hour in production, 0 for development)
    if (__DEV__) {
      await remoteConfig().setConfigSettings({
        minimumFetchIntervalMillis: 0, // No cache in dev mode
      });
    } else {
      await remoteConfig().setConfigSettings({
        minimumFetchIntervalMillis: 3600000, // 1 hour in production
      });
    }

    // Fetch and activate
    await remoteConfig().fetchAndActivate();

    isInitialized = true;
    console.log("[Remote Config] Initialized successfully");
  } catch (error) {
    console.error("[Remote Config] Error initializing:", error);
    // Gracefully continue with default values
  }
};

/**
 * Get static stories from Remote Config
 * Returns parsed array of StaticStory objects
 */
export const getStaticStories = async (): Promise<StaticStory[]> => {
  try {
    // Ensure config is initialized
    if (!isInitialized) {
      await initializeRemoteConfig();
    }

    const staticStoriesJson = remoteConfig().getValue("static_stories");
    const storiesString = staticStoriesJson.asString();

    if (!storiesString || storiesString === "[]") {
      return [];
    }

    const stories: StaticStory[] = JSON.parse(storiesString);

    if (__DEV__) {
      console.log("[Remote Config] Fetched static stories:", stories);
    }

    return stories;
  } catch (error) {
    console.error("[Remote Config] Error parsing static stories:", error);
    return [];
  }
};

/**
 * React hook for accessing static stories from Remote Config
 * Automatically handles initialization and fetching
 */
export const useStaticStories = () => {
  const [stories, setStories] = useState<StaticStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        setError(null);

        const staticStories = await getStaticStories();
        setStories(staticStories);
      } catch (err) {
        console.error("[Remote Config] Error in useStaticStories:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setStories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  return { stories, loading, error };
};

/**
 * Fetch latest config from server
 * Useful for manual refresh
 */
export const refreshRemoteConfig = async (): Promise<void> => {
  try {
    await remoteConfig().fetch();
    await remoteConfig().activate();
    console.log("[Remote Config] Config refreshed successfully");
  } catch (error) {
    console.error("[Remote Config] Error refreshing config:", error);
  }
};
