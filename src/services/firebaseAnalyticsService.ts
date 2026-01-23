import analytics from "@react-native-firebase/analytics";

/**
 * Firebase Analytics Service
 *
 * Centralized service for tracking user and merchant events across the NODO.ia app.
 * All events are typed for safety and consistency.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * User Event Parameters
 */
interface AppOpenParams {
  user_id: string;
  timestamp: string;
}

interface SearchPerformedParams {
  user_id: string;
  timestamp: string;
  search_term: string;
}

interface ProductViewParams {
  user_id: string;
  timestamp: string;
  product_id: string;
  merchant_id?: string;
}

interface MerchantProfileViewParams {
  user_id: string;
  timestamp: string;
  merchant_id: string;
}

interface CategoryClickParams {
  user_id: string;
  timestamp: string;
  category_name: string;
}

interface SessionStartParams {
  user_id: string;
  timestamp: string;
}

interface SessionEndParams {
  user_id: string;
  timestamp: string;
  session_duration: number; // in seconds
}

/**
 * Merchant Event Parameters
 */
interface MerchantProductUploadParams {
  merchant_id: string;
  timestamp: string;
  product_id: string;
  total_products: number;
}

interface MerchantProfileUpdateParams {
  merchant_id: string;
  timestamp: string;
}

interface MerchantDashboardOpenParams {
  merchant_id: string;
  timestamp: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get current timestamp in ISO format
 */
const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Safely log analytics events (for debugging)
 */
const logEventDebug = (eventName: string, params: any) => {
  if (__DEV__) {
    console.log(`[Firebase Analytics] ${eventName}`, params);
  }
};

// ============================================================================
// USER EVENTS
// ============================================================================

/**
 * Track app open event
 * Triggered when the app is launched or brought to foreground
 */
export const trackAppOpen = async (userId: string): Promise<void> => {
  try {
    const params: AppOpenParams = {
      user_id: userId,
      timestamp: getCurrentTimestamp(),
    };

    await analytics().logEvent("app_open", params);
    logEventDebug("app_open", params);
  } catch (error) {
    console.error("[Firebase Analytics] Error tracking app_open:", error);
  }
};

/**
 * Track search performed event
 * Triggered when user performs a search in the chat
 */
export const trackSearchPerformed = async (
  userId: string,
  searchTerm: string
): Promise<void> => {
  try {
    const params: SearchPerformedParams = {
      user_id: userId,
      timestamp: getCurrentTimestamp(),
      search_term: searchTerm,
    };

    await analytics().logEvent("search_performed", params);
    logEventDebug("search_performed", params);
  } catch (error) {
    console.error(
      "[Firebase Analytics] Error tracking search_performed:",
      error
    );
  }
};

/**
 * Track product view event
 * Triggered when user views a product detail
 */
export const trackProductView = async (
  userId: string,
  productId: string,
  merchantId?: string
): Promise<void> => {
  try {
    const params: ProductViewParams = {
      user_id: userId,
      timestamp: getCurrentTimestamp(),
      product_id: productId,
      ...(merchantId && { merchant_id: merchantId }),
    };

    await analytics().logEvent("product_view", params);
    logEventDebug("product_view", params);
  } catch (error) {
    console.error("[Firebase Analytics] Error tracking product_view:", error);
  }
};

/**
 * Track merchant profile view event
 * Triggered when user views a merchant's profile
 */
export const trackMerchantProfileView = async (
  userId: string,
  merchantId: string
): Promise<void> => {
  try {
    const params: MerchantProfileViewParams = {
      user_id: userId,
      timestamp: getCurrentTimestamp(),
      merchant_id: merchantId,
    };

    await analytics().logEvent("merchant_profile_view", params);
    logEventDebug("merchant_profile_view", params);
  } catch (error) {
    console.error(
      "[Firebase Analytics] Error tracking merchant_profile_view:",
      error
    );
  }
};

/**
 * Track category click event
 * Triggered when user selects a category
 */
export const trackCategoryClick = async (
  userId: string,
  categoryName: string
): Promise<void> => {
  try {
    const params: CategoryClickParams = {
      user_id: userId,
      timestamp: getCurrentTimestamp(),
      category_name: categoryName,
    };

    await analytics().logEvent("category_click", params);
    logEventDebug("category_click", params);
  } catch (error) {
    console.error("[Firebase Analytics] Error tracking category_click:", error);
  }
};

/**
 * Track session start event
 * Triggered when user starts a new app session
 * Note: Using 'user_session_start' instead of 'session_start' (reserved by Firebase)
 */
export const trackSessionStart = async (userId: string): Promise<void> => {
  try {
    const params: SessionStartParams = {
      user_id: userId,
      timestamp: getCurrentTimestamp(),
    };

    await analytics().logEvent("user_session_start", params);
    logEventDebug("user_session_start", params);
  } catch (error) {
    console.error(
      "[Firebase Analytics] Error tracking user_session_start:",
      error
    );
  }
};

/**
 * Track session end event
 * Triggered when user ends an app session (app goes to background)
 * Note: Using 'user_session_end' instead of 'session_end' (reserved by Firebase)
 */
export const trackSessionEnd = async (
  userId: string,
  sessionDuration: number
): Promise<void> => {
  try {
    const params: SessionEndParams = {
      user_id: userId,
      timestamp: getCurrentTimestamp(),
      session_duration: Math.round(sessionDuration), // Ensure it's an integer
    };

    await analytics().logEvent("user_session_end", params);
    logEventDebug("user_session_end", params);
  } catch (error) {
    console.error(
      "[Firebase Analytics] Error tracking user_session_end:",
      error
    );
  }
};

// ============================================================================
// MERCHANT EVENTS
// ============================================================================

/**
 * Track merchant product upload event
 * Triggered when merchant uploads a new product/listing
 */
export const trackMerchantProductUpload = async (
  merchantId: string,
  productId: string,
  totalProducts: number
): Promise<void> => {
  try {
    const params: MerchantProductUploadParams = {
      merchant_id: merchantId,
      timestamp: getCurrentTimestamp(),
      product_id: productId,
      total_products: totalProducts,
    };

    await analytics().logEvent("merchant_product_upload", params);
    logEventDebug("merchant_product_upload", params);
  } catch (error) {
    console.error(
      "[Firebase Analytics] Error tracking merchant_product_upload:",
      error
    );
  }
};

/**
 * Track merchant profile update event
 * Triggered when merchant updates their profile information
 */
export const trackMerchantProfileUpdate = async (
  merchantId: string
): Promise<void> => {
  try {
    const params: MerchantProfileUpdateParams = {
      merchant_id: merchantId,
      timestamp: getCurrentTimestamp(),
    };

    await analytics().logEvent("merchant_profile_update", params);
    logEventDebug("merchant_profile_update", params);
  } catch (error) {
    console.error(
      "[Firebase Analytics] Error tracking merchant_profile_update:",
      error
    );
  }
};

/**
 * Track merchant dashboard open event
 * Triggered when merchant opens the admin/dashboard screen
 */
export const trackMerchantDashboardOpen = async (
  merchantId: string
): Promise<void> => {
  try {
    const params: MerchantDashboardOpenParams = {
      merchant_id: merchantId,
      timestamp: getCurrentTimestamp(),
    };

    await analytics().logEvent("merchant_dashboard_open", params);
    logEventDebug("merchant_dashboard_open", params);
  } catch (error) {
    console.error(
      "[Firebase Analytics] Error tracking merchant_dashboard_open:",
      error
    );
  }
};

// ============================================================================
// USER PROPERTY MANAGEMENT
// ============================================================================

/**
 * Set user ID for analytics
 * Should be called after successful login
 */
export const setAnalyticsUserId = async (userId: string): Promise<void> => {
  try {
    await analytics().setUserId(userId);
    logEventDebug("setUserId", { userId });
  } catch (error) {
    console.error("[Firebase Analytics] Error setting user ID:", error);
  }
};

/**
 * Set user properties for analytics
 * Useful for segmentation and analysis
 */
export const setUserProperties = async (properties: {
  user_type?: "regular" | "merchant";
  country?: string;
  has_subscription?: boolean;
  [key: string]: any;
}): Promise<void> => {
  try {
    await Promise.all(
      Object.entries(properties).map(([key, value]) =>
        analytics().setUserProperty(key, String(value))
      )
    );
    logEventDebug("setUserProperties", properties);
  } catch (error) {
    console.error("[Firebase Analytics] Error setting user properties:", error);
  }
};

/**
 * Clear user data on logout
 */
export const clearAnalyticsUser = async (): Promise<void> => {
  try {
    await analytics().setUserId(null);
    logEventDebug("clearAnalyticsUser", {});
  } catch (error) {
    console.error("[Firebase Analytics] Error clearing user:", error);
  }
};

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Session manager class to track session duration
 */
class SessionManager {
  private sessionStartTime: number | null = null;
  private userId: string | null = null;

  startSession(userId: string) {
    this.userId = userId;
    this.sessionStartTime = Date.now();
    trackSessionStart(userId);
  }

  endSession() {
    if (this.sessionStartTime && this.userId) {
      const sessionDuration = Math.floor(
        (Date.now() - this.sessionStartTime) / 1000
      );
      trackSessionEnd(this.userId, sessionDuration);
      this.sessionStartTime = null;
      this.userId = null;
    }
  }

  getSessionDuration(): number {
    if (this.sessionStartTime) {
      return Math.floor((Date.now() - this.sessionStartTime) / 1000);
    }
    return 0;
  }
}

export const sessionManager = new SessionManager();

// ============================================================================
// DEBUG MODE CONTROL
// ============================================================================

/**
 * Enable debug mode for Firebase Analytics
 * This makes events appear immediately in DebugView
 */
export const enableAnalyticsDebugMode = async (): Promise<void> => {
  try {
    await analytics().setAnalyticsCollectionEnabled(true);
    console.log("[Firebase Analytics] Debug mode enabled");
  } catch (error) {
    console.error("[Firebase Analytics] Error enabling debug mode:", error);
  }
};

/**
 * Disable analytics collection
 */
export const disableAnalytics = async (): Promise<void> => {
  try {
    await analytics().setAnalyticsCollectionEnabled(false);
    console.log("[Firebase Analytics] Analytics disabled");
  } catch (error) {
    console.error("[Firebase Analytics] Error disabling analytics:", error);
  }
};
