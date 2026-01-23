import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import Config from "react-native-config";
import { navigationService } from "../services/navigationService";
import { storage, StorageKeys } from "./storage";

// Type definitions
interface TokenCache {
  accessToken: string | null;
  refreshToken: string | null;
  lastFetch: number | null;
}

interface RefreshTokenResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken?: string;
  };
}

interface CustomAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

// Memory cache with singleton pattern for better performance
const tokenCache: TokenCache = {
  accessToken: null,
  refreshToken: null,
  lastFetch: null,
};

// Performance tuning constants
const CACHE_TTL = 60_000; // 1 minute cache TTL for memory cache
const REQUEST_TIMEOUT = 60_000; // 60 seconds request timeout

// Efficient token retrieval with caching and early returns
const getValidToken = async (): Promise<string | null> => {
  const now = Date.now();

  // Fast path: Use memory cache if recent and valid
  if (
    tokenCache.accessToken &&
    tokenCache.lastFetch &&
    now - tokenCache.lastFetch < CACHE_TTL
  ) {
    return tokenCache.accessToken;
  }

  try {
    // Parallel storage reads with destructuring for better performance
    const [accessToken, refreshToken] = [
      storage.getString(StorageKeys.AUTH_TOKEN) || null,
      storage.getString(StorageKeys.REFRESH_TOKEN) || null,
    ];

    // Update memory cache properties individually
    tokenCache.accessToken = accessToken;
    tokenCache.refreshToken = refreshToken;
    tokenCache.lastFetch = now;

    // Return valid token or attempt refresh
    if (accessToken) {
      return accessToken;
    }

    if (refreshToken) {
      return await refreshAccessToken(refreshToken);
    }

    return null;
  } catch (error) {
    console.warn("Token retrieval failed:", error);
    return null;
  }
};

// Optimized token storage with error handling
const storeTokens = async (
  accessToken: string,
  refreshToken: string
): Promise<void> => {
  // Update memory cache immediately for faster subsequent access
  tokenCache.accessToken = accessToken;
  tokenCache.refreshToken = refreshToken;
  tokenCache.lastFetch = Date.now();

  try {
    // Parallel writes for better performance
    storage.set(StorageKeys.AUTH_TOKEN, accessToken);
    storage.set(StorageKeys.REFRESH_TOKEN, refreshToken || "");

    // Cache already updated above for faster access
  } catch (error) {
    console.error("Token storage failed:", error);
    throw error;
  }
};

// Token refresh with optimized payload construction
const refreshAccessToken = async (refreshToken: string): Promise<string> => {
  try {
    // Use constant payload to reduce object creation
    const response = await axios.post<RefreshTokenResponse>(
      `${Config.API_URL}/auth/refresh-token`,
      {
        refreshToken,
      }
    );

    const { accessToken, refreshToken: newRefreshToken } = response.data
      ?.data || {
      accessToken: "",
      refreshToken: "",
    };

    await storeTokens(accessToken, newRefreshToken || refreshToken);

    return accessToken;
  } catch (error) {
    console.error("Token refresh failed:", error);
    await clearTokens();
    throw error;
  }
};

// Clear tokens from both cache and storage efficiently
const clearTokens = async (): Promise<void> => {
  // Reset cache properties directly instead of object reassignment
  tokenCache.accessToken = null;
  tokenCache.refreshToken = null;
  tokenCache.lastFetch = null;

  try {
    storage.remove(StorageKeys.AUTH_TOKEN);
    storage.remove(StorageKeys.REFRESH_TOKEN);
  } catch (error) {
    console.warn("Token cleanup failed:", error);
  }
};

// Global handler for 401 authentication failures
let forceLogoutHandler: (() => Promise<void>) | null = null;

const setForceLogoutHandler = (handler: () => Promise<void>) => {
  forceLogoutHandler = handler;
};

const handleUnauthorized = async (): Promise<void> => {
  try {
    await clearTokens();

    // Call the force logout handler if available
    if (forceLogoutHandler) {
      await forceLogoutHandler();
    }

    // Navigate to welcome screen
    navigationService.navigateToWelcome();
  } catch (error) {
    console.error("Force logout handling failed:", error);
    // Ensure navigation happens even if other cleanup fails
    navigationService.navigateToWelcome();
  }
};

// Create axios client with optimized configuration
export const axiosClient = axios.create({
  baseURL: Config.API_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
  responseType: "json",
});

// Request interceptor with token management
axiosClient.interceptors.request.use(
  async (
    config: InternalAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> => {
    try {
      const token = await getValidToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn("Failed to attach token:", error);
    }
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => Promise.reject(error)
);

// Response interceptor with automatic token refresh
axiosClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  async (error: AxiosError): Promise<AxiosResponse | AxiosError> => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // Handle 401 unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Use cached refresh token if available to avoid storage access
        const refreshToken =
          tokenCache.refreshToken ||
          storage.getString(StorageKeys.REFRESH_TOKEN) ||
          null;

        if (refreshToken) {
          const newAccessToken = await refreshAccessToken(refreshToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return axiosClient(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh in interceptor failed:", refreshError);
        // Handle unauthorized access - force logout and navigate to welcome
        await handleUnauthorized();
        return Promise.reject(refreshError);
      }
    }

    // Handle other 401 cases without retry flag or when retry fails
    if (error.response?.status === 401) {
      await handleUnauthorized();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// Optimized utility functions for external use
export const authUtils = {
  baseURL: Config.API_URL,
  storeTokens,
  clearTokens,
  getValidToken,
  // Memoized authentication check
  isAuthenticated: async (): Promise<boolean> => {
    // Direct boolean conversion with !! operator
    return !!(await getValidToken());
  },
  setForceLogoutHandler,
};

export default axiosClient;
