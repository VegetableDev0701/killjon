import RNFS from "react-native-fs";
import axiosClient, { authUtils } from "../utils/axiosClient";
import { IS_IOS } from "../utils/constants";

// TypeScript interfaces for analytics data
export interface ClickConversionData {
  category: string;
  clickCount: string;
  productType: 1 | 2;
  searchCount: string;
  percentageIncrease?: number;
}

export interface ClickConversionResponse {
  success: boolean;
  data: ClickConversionData[];
}

export interface TopSearchData {
  searchTerm: string;
  searchCount: string;
  percentageIncrease?: number;
}

export interface TopSearchResponse {
  success: boolean;
  data: TopSearchData[];
}

export interface TrendingCategoryData {
  category: string;
  searchCount: string;
  percentageIncrease?: number;
}

export interface TrendingCategoryResponse {
  success: boolean;
  data: TrendingCategoryData[];
}

// API error type
export interface AnalyticsError {
  success: false;
  error: string;
  message?: string;
}

// Union type for API responses
export type AnalyticsApiResponse<T> = T | AnalyticsError;

// Analytics API service
export const AnalyticsApiService = {
  /**
   * Download Analytics Report PDF to device
   * @param period - 7 or 30 days
   * @returns Object with file path and status code
   */
  downloadAnalyticsReportToDevice: async ({
    period,
  }: {
    period: 7 | 30;
  }): Promise<{ filePath: string; statusCode: number }> => {
    try {
      // Step 1: Get the download URL from the API
      const response = await axiosClient.get(
        `/api/analytics/report/download?period=${period}`
      );

      if (!response.data?.downloadUrl) {
        throw new Error("No download URL received from server");
      }

      const downloadUrl = response.data.downloadUrl;

      // Step 2: Generate filename with timestamp
      const timestamp = Date.now();
      const fileName = `analytics_report_${period}days_${timestamp}.pdf`;
      const downloadDest = IS_IOS
        ? `${RNFS.DocumentDirectoryPath}/${fileName}`
        : `${RNFS.DownloadDirectoryPath}/${fileName}`;

      // Step 3: Download the file using the signed URL (no auth needed for signed URL)
      const downloadResult = await RNFS.downloadFile({
        fromUrl: downloadUrl,
        toFile: downloadDest,
        background: true,
        discretionary: true,
        cacheable: false,
      }).promise;

      if (downloadResult.statusCode !== 200) {
        throw new Error(
          `Download failed with status ${downloadResult.statusCode}`
        );
      }

      return {
        filePath: downloadDest,
        statusCode: downloadResult.statusCode,
      };
    } catch (error: any) {
      console.error("Download report error:", error);
      throw new Error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to download report"
      );
    }
  },

  /**
   * Download Analytics Report PDF (Legacy method for web)
   * @param period - 7 or 30 days
   * @returns URL to the downloaded file
   */
  downloadAnalyticsReport: async (period: 7 | 30): Promise<string> => {
    try {
      const response = await axiosClient.get(
        `/api/analytics/report/download?period=${period}`,
        {
          responseType: "blob",
        }
      );

      // For web compatibility, create a blob URL
      if (response.data instanceof Blob) {
        return URL.createObjectURL(response.data);
      }

      // For React Native, return the direct URL
      return response.request.responseURL;
    } catch (error: any) {
      console.error("Failed to download analytics report:", error);
      throw new Error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to download report"
      );
    }
  },

  /**
   * Get Click Conversion Analytics
   * @param days - 7 or 30 days
   */
  getClickConversion: async (
    days: 7 | 30
  ): Promise<AnalyticsApiResponse<ClickConversionResponse>> => {
    try {
      const response = await axiosClient.get(
        `/api/analytics/click-conversion?days=${days}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: "Failed to fetch click conversion analytics",
        message: error?.response?.data?.message || error?.message,
      };
    }
  },

  /**
   * Get Top 10 Searches Analytics
   * @param days - 7 or 30 days
   */
  getTopSearches: async (
    days: 7 | 30
  ): Promise<AnalyticsApiResponse<TopSearchResponse>> => {
    try {
      const response = await axiosClient.get(
        `/api/analytics/top-searches?days=${days}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: "Failed to fetch top searches analytics",
        message: error?.response?.data?.message || error?.message,
      };
    }
  },

  /**
   * Get Trending Categories Analytics
   * @param days - 7 or 30 days
   */
  getTrendingCategories: async (
    days: 7 | 30
  ): Promise<AnalyticsApiResponse<TrendingCategoryResponse>> => {
    try {
      const response = await axiosClient.get(
        `/api/analytics/trending-categories?days=${days}`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: "Failed to fetch trending categories analytics",
        message: error?.response?.data?.message || error?.message,
      };
    }
  },

  /**
   * Get all analytics data at once
   * @param days - 7 or 30 days
   */
  getAllAnalytics: async (days: 7 | 30) => {
    try {
      const [clickConversion, topSearches, trendingCategories] =
        await Promise.allSettled([
          AnalyticsApiService.getClickConversion(days),
          AnalyticsApiService.getTopSearches(days),
          AnalyticsApiService.getTrendingCategories(days),
        ]);

      return {
        clickConversion:
          clickConversion.status === "fulfilled"
            ? clickConversion.value
            : {
                success: false,
                error: "Failed to fetch click conversion data",
                message: "Network or server error",
              },
        topSearches:
          topSearches.status === "fulfilled"
            ? topSearches.value
            : {
                success: false,
                error: "Failed to fetch top searches data",
                message: "Network or server error",
              },
        trendingCategories:
          trendingCategories.status === "fulfilled"
            ? trendingCategories.value
            : {
                success: false,
                error: "Failed to fetch trending categories data",
                message: "Network or server error",
              },
      };
    } catch (error: any) {
      return {
        clickConversion: {
          success: false,
          error: "Failed to fetch analytics",
          message: error?.message || "Unknown error occurred",
        },
        topSearches: {
          success: false,
          error: "Failed to fetch analytics",
          message: error?.message || "Unknown error occurred",
        },
        trendingCategories: {
          success: false,
          error: "Failed to fetch analytics",
          message: error?.message || "Unknown error occurred",
        },
      };
    }
  },
};

// Helper functions for analytics calculations
export const AnalyticsHelpers = {
  /**
   * Calculate conversion rate
   */
  calculateConversionRate: (clicks: string, searches: string): number => {
    const clickCount = parseInt(clicks) || 0;
    const searchCount = parseInt(searches) || 0;
    if (searchCount === 0) return 0;
    return Math.round((clickCount / searchCount) * 100);
  },

  /**
   * Format percentage change with proper sign
   */
  formatPercentageChange: (percentage?: number): string => {
    if (percentage === undefined) return "New";
    const sign = percentage >= 0 ? "+" : "";
    return `${sign}${percentage}%`;
  },

  /**
   * Get percentage change color
   */
  getPercentageChangeColor: (percentage?: number): string => {
    if (percentage === undefined) return "#c1fe00"; // primary color for new items
    return percentage >= 0 ? "#22c55e" : "#ef4444"; // green for positive, red for negative
  },

  /**
   * Format numbers for display
   */
  formatNumber: (num: string | number): string => {
    const value = typeof num === "string" ? parseInt(num) : num;
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  },

  /**
   * Calculate totals from analytics data
   */
  calculateTotals: (data: ClickConversionData[]) => {
    const totalClicks = data.reduce(
      (sum, item) => sum + parseInt(item.clickCount),
      0
    );
    const totalSearches = data.reduce(
      (sum, item) => sum + parseInt(item.searchCount),
      0
    );
    const averageConversion =
      totalSearches > 0 ? Math.round((totalClicks / totalSearches) * 100) : 0;

    return {
      totalClicks,
      totalSearches,
      averageConversion,
    };
  },
};
