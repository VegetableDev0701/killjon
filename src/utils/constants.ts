import { Dimensions, Platform } from "react-native";
import Config from "react-native-config";

export const getQueryCategory = (category: string) => {
  return category === "real_estate" || category === "vehicles"
    ? category
    : "products";
};

// Utility to format price with currency
export const formatPrice = (price: any, currency?: string): string => {
  if (!price) return "";

  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(numPrice)) return "";

  // Default to DOP if no currency specified
  const defaultCurrency = currency || "DOP";

  try {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: defaultCurrency,
      notation: "compact",
      currencyDisplay: "narrowSymbol",
      compactDisplay: "short",
      signDisplay: "auto",
      useGrouping: true,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  } catch (error) {
    console.log(error);
    // Fallback formatting
    return `${defaultCurrency} ${numPrice.toLocaleString()}`;
  }
};

/**
 * Detects if the app is running in staging mode
 * @returns boolean indicating if app is in staging mode
 */
export const isStagingEnvironment = (): boolean => {
  return Config.ENV === "staging";
};

export const VivrationOption = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export const { height: screenHeight, width: screenWidth } =
  Dimensions.get("window");

export const IS_IOS = Platform.OS === "ios";
export const IS_ANDROID = Platform.OS === "android";

export const HEADER_HEIGHT = 100;
