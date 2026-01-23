import { useState, useEffect, useCallback } from "react";
import {
  AnalyticsApiService,
  ClickConversionResponse,
  TopSearchResponse,
  TrendingCategoryResponse,
  AnalyticsError,
} from "../services/analyticsApi";

// State interface for analytics data
interface AnalyticsState {
  clickConversion: {
    data: ClickConversionResponse | null;
    loading: boolean;
    error: string | null;
  };
  topSearches: {
    data: TopSearchResponse | null;
    loading: boolean;
    error: string | null;
  };
  trendingCategories: {
    data: TrendingCategoryResponse | null;
    loading: boolean;
    error: string | null;
  };
  isRefreshing: boolean;
  lastUpdated: Date | null;
}

// Initial state
const initialState: AnalyticsState = {
  clickConversion: {
    data: null,
    loading: false,
    error: null,
  },
  topSearches: {
    data: null,
    loading: false,
    error: null,
  },
  trendingCategories: {
    data: null,
    loading: false,
    error: null,
  },
  isRefreshing: false,
  lastUpdated: null,
};

export const useAnalytics = (isLoggedIn: boolean) => {
  const [state, setState] = useState<AnalyticsState>(initialState);
  const [timePeriod, setTimePeriod] = useState<7 | 30>(7);

  // Helper to check if response is error
  const isError = (response: any): response is AnalyticsError => {
    return response.success === false;
  };

  // Fetch all analytics data
  const fetchAnalyticsData = useCallback(
    async (days: 7 | 30, isRefreshing = false) => {
      setState((prev) => ({
        ...prev,
        clickConversion: {
          ...prev.clickConversion,
          loading: !isRefreshing,
          error: null,
        },
        topSearches: {
          ...prev.topSearches,
          loading: !isRefreshing,
          error: null,
        },
        trendingCategories: {
          ...prev.trendingCategories,
          loading: !isRefreshing,
          error: null,
        },
        isRefreshing,
      }));

      try {
        const results = await AnalyticsApiService.getAllAnalytics(days);

        setState((prev) => ({
          ...prev,
          clickConversion: {
            data: isError(results.clickConversion)
              ? null
              : (results.clickConversion as ClickConversionResponse),
            loading: false,
            error: isError(results.clickConversion)
              ? results.clickConversion.error
              : null,
          },
          topSearches: {
            data: isError(results.topSearches)
              ? null
              : (results.topSearches as TopSearchResponse),
            loading: false,
            error: isError(results.topSearches)
              ? results.topSearches.error
              : null,
          },
          trendingCategories: {
            data: isError(results.trendingCategories)
              ? null
              : (results.trendingCategories as TrendingCategoryResponse),
            loading: false,
            error: isError(results.trendingCategories)
              ? results.trendingCategories.error
              : null,
          },
          isRefreshing: false,
          lastUpdated: new Date(),
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch analytics";

        setState((prev) => ({
          ...prev,
          clickConversion: {
            ...prev.clickConversion,
            loading: false,
            error: errorMessage,
          },
          topSearches: {
            ...prev.topSearches,
            loading: false,
            error: errorMessage,
          },
          trendingCategories: {
            ...prev.trendingCategories,
            loading: false,
            error: errorMessage,
          },
          isRefreshing: false,
        }));
      }
    },
    []
  );

  // Fetch individual analytics data
  const fetchClickConversion = useCallback(async (days: 7 | 30) => {
    setState((prev) => ({
      ...prev,
      clickConversion: {
        ...prev.clickConversion,
        loading: true,
        error: null,
      },
    }));

    try {
      const result = await AnalyticsApiService.getClickConversion(days);

      setState((prev) => ({
        ...prev,
        clickConversion: {
          data: isError(result) ? null : result,
          loading: false,
          error: isError(result) ? result.error : null,
        },
        lastUpdated: new Date(),
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        clickConversion: {
          ...prev.clickConversion,
          loading: false,
          error:
            error instanceof Error ? error.message : "Failed to fetch data",
        },
      }));
    }
  }, []);

  const fetchTopSearches = useCallback(async (days: 7 | 30) => {
    setState((prev) => ({
      ...prev,
      topSearches: {
        ...prev.topSearches,
        loading: true,
        error: null,
      },
    }));

    try {
      const result = await AnalyticsApiService.getTopSearches(days);

      setState((prev) => ({
        ...prev,
        topSearches: {
          data: isError(result) ? null : result,
          loading: false,
          error: isError(result) ? result.error : null,
        },
        lastUpdated: new Date(),
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        topSearches: {
          ...prev.topSearches,
          loading: false,
          error:
            error instanceof Error ? error.message : "Failed to fetch data",
        },
      }));
    }
  }, []);

  const fetchTrendingCategories = useCallback(async (days: 7 | 30) => {
    setState((prev) => ({
      ...prev,
      trendingCategories: {
        ...prev.trendingCategories,
        loading: true,
        error: null,
      },
    }));

    try {
      const result = await AnalyticsApiService.getTrendingCategories(days);

      setState((prev) => ({
        ...prev,
        trendingCategories: {
          data: isError(result) ? null : result,
          loading: false,
          error: isError(result) ? result.error : null,
        },
        lastUpdated: new Date(),
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        trendingCategories: {
          ...prev.trendingCategories,
          loading: false,
          error:
            error instanceof Error ? error.message : "Failed to fetch data",
        },
      }));
    }
  }, []);

  // Refresh all data
  const refresh = useCallback(() => {
    fetchAnalyticsData(timePeriod, true);
  }, [fetchAnalyticsData, timePeriod]);

  // Change time period
  const changeTimePeriod = useCallback(
    (newPeriod: 7 | 30) => {
      setTimePeriod(newPeriod);
      fetchAnalyticsData(newPeriod);
    },
    [fetchAnalyticsData]
  );

  // Load data when component mounts or time period changes
  useEffect(() => {
    if (isLoggedIn) {
      fetchAnalyticsData(timePeriod);
    }
  }, [isLoggedIn, fetchAnalyticsData, timePeriod]);

  // Check if any data is loading
  const isLoading =
    state.clickConversion.loading ||
    state.topSearches.loading ||
    state.trendingCategories.loading;

  // Check if all data has errors
  const hasErrors =
    state.clickConversion.error &&
    state.topSearches.error &&
    state.trendingCategories.error;

  // Check if we have any data
  const hasData =
    state.clickConversion.data ||
    state.topSearches.data ||
    state.trendingCategories.data;

  return {
    ...state,
    timePeriod,
    isLoading,
    hasErrors,
    hasData,
    fetchAnalyticsData,
    fetchClickConversion,
    fetchTopSearches,
    fetchTrendingCategories,
    refresh,
    changeTimePeriod,
  };
};
