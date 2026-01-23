import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Eye,
  Mouse,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react-native";
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import {
  AnalyticsHelpers,
  ClickConversionResponse,
  TopSearchResponse,
  TrendingCategoryResponse,
} from "../../services/analyticsApi";
import { screenWidth } from "../../utils/constants";
import { SkeletonItem } from "../animated/SkeletonLoader";

const chartWidth = screenWidth - 48; // Account for margins

// Animated Percentage Change Indicator
interface PercentageIndicatorProps {
  percentage?: number;
  size?: "small" | "medium" | "large";
  delay?: number;
}

export const PercentageIndicator: React.FC<PercentageIndicatorProps> = ({
  percentage,
  size = "medium",
  delay = 0,
}) => {
  const { t } = useTranslation();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    scale.value = withDelay(
      delay + 100,
      withSpring(1, { damping: 15, stiffness: 200 })
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (percentage === undefined) {
    return (
      <Animated.View
        style={animatedStyle}
        className={`flex-row items-center ${
          size === "small"
            ? "px-2 py-1"
            : size === "large"
              ? "px-4 py-2"
              : "px-3 py-1.5"
        } rounded-full bg-primary/20`}
      >
        <Sparkles
          size={size === "small" ? 12 : size === "large" ? 16 : 14}
          color="#c1fe00"
        />
        <Text
          className={`ml-1 font-semibold text-primary ${
            size === "small"
              ? "text-xs"
              : size === "large"
                ? "text-sm"
                : "text-xs"
          }`}
        >
          {t("analytics.newData")}
        </Text>
      </Animated.View>
    );
  }

  const isPositive = percentage >= 0;
  const color = isPositive ? "#22c55e" : "#ef4444";
  const bgColor = isPositive ? "bg-green-500/20" : "bg-red-500/20";
  const Icon = isPositive ? ArrowUp : ArrowDown;

  return (
    <Animated.View
      style={animatedStyle}
      className={`flex-row items-center ${
        size === "small"
          ? "px-2 py-1"
          : size === "large"
            ? "px-4 py-2"
            : "px-3 py-1.5"
      } rounded-full ${bgColor}`}
    >
      <Icon
        size={size === "small" ? 10 : size === "large" ? 14 : 12}
        color={color}
      />
      <Text
        className={`ml-1 font-semibold ${
          size === "small"
            ? "text-xs"
            : size === "large"
              ? "text-sm"
              : "text-xs"
        }`}
        style={{ color }}
      >
        {Math.abs(percentage)}%
      </Text>
    </Animated.View>
  );
};

// Animated Number Counter
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  formatter?: (value: number) => string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  delay = 0,
  formatter = (val) => val.toString(),
  className = "text-2xl font-bold text-foreground",
}) => {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withDelay(delay, withTiming(value, { duration }));
  }, [value, duration, delay, animatedValue]);

  return <Text className={className}>{formatter(value)}</Text>;
};

// Click Conversion Chart Component
interface ClickConversionChartProps {
  data: ClickConversionResponse;
  loading?: boolean;
  error?: string | null;
}

export const ClickConversionChart: React.FC<ClickConversionChartProps> = ({
  data,
  loading,
  error,
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <View className="py-4">
        {[1, 2, 3].map((item) => (
          <View key={item} className="mb-4 rounded-xl bg-gray-800/20 p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <SkeletonItem
                width="40%"
                height={20}
                borderRadius={6}
                className="bg-gray-700/50"
              />
              <SkeletonItem
                width={60}
                height={24}
                borderRadius={12}
                className="bg-gray-700/50"
              />
            </View>
            <View className="mb-2">
              <View className="mb-1 flex-row items-center justify-between">
                <SkeletonItem
                  width={80}
                  height={16}
                  borderRadius={4}
                  className="bg-gray-700/50"
                />
                <SkeletonItem
                  width={40}
                  height={16}
                  borderRadius={4}
                  className="bg-gray-700/50"
                />
              </View>
              <SkeletonItem
                width="100%"
                height={8}
                borderRadius={4}
                className="bg-gray-700/50"
              />
            </View>
            <View className="mb-2">
              <View className="mb-1 flex-row items-center justify-between">
                <SkeletonItem
                  width={80}
                  height={16}
                  borderRadius={4}
                  className="bg-gray-700/50"
                />
                <SkeletonItem
                  width={40}
                  height={16}
                  borderRadius={4}
                  className="bg-gray-700/50"
                />
              </View>
              <SkeletonItem
                width="100%"
                height={8}
                borderRadius={4}
                className="bg-gray-700/50"
              />
            </View>
            <View className="mt-2 flex-row items-center justify-between">
              <SkeletonItem
                width={100}
                height={12}
                borderRadius={4}
                className="bg-gray-700/50"
              />
              <SkeletonItem
                width={40}
                height={12}
                borderRadius={4}
                className="bg-gray-700/50"
              />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center py-4">
        <Text className="text-center text-red-400">{error}</Text>
      </View>
    );
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <View className="items-center py-4">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-gray-800/50">
          <BarChart3 size={32} color="#6b7280" />
        </View>
        <Text className="text-center text-gray-400">
          {t("analytics.noData")}
        </Text>
      </View>
    );
  }

  const maxClicks = Math.max(
    ...data.data.map((item) => parseInt(item.clickCount))
  );
  const maxSearches = Math.max(
    ...data.data.map((item) => parseInt(item.searchCount))
  );
  const maxValue = Math.max(maxClicks, maxSearches);

  return (
    <View className="py-4">
      {data.data.map((item, index) => {
        const clickCount = parseInt(item.clickCount);
        const searchCount = parseInt(item.searchCount);
        const conversionRate = AnalyticsHelpers.calculateConversionRate(
          item.clickCount,
          item.searchCount
        );

        const clickWidth = (clickCount / maxValue) * (chartWidth - 100);
        const searchWidth = (searchCount / maxValue) * (chartWidth - 100);

        return (
          <Animated.View
            key={`${item.category}-${index}`}
            className="mb-4 rounded-xl bg-gray-800/20 p-4"
            accessible={true}
            accessibilityRole="summary"
            accessibilityLabel={`${item.category} category: ${searchCount} searches, ${clickCount} clicks, ${conversionRate}% conversion rate`}
          >
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-semibold capitalize text-foreground">
                {item.category}
              </Text>
              <PercentageIndicator
                percentage={item.percentageIncrease}
                size="small"
                delay={index * 100 + 400}
              />
            </View>

            {/* Search Bar */}
            <View className="mb-2">
              <View className="mb-1 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Search size={14} color="#6b7280" />
                  <Text className="ml-2 text-sm text-gray-400">
                    {t("analytics.searches")}
                  </Text>
                </View>
                <Text className="text-sm font-medium text-foreground">
                  {AnalyticsHelpers.formatNumber(searchCount)}
                </Text>
              </View>
              <View className="h-2 rounded-full bg-gray-700/50">
                <Animated.View
                  className="h-full rounded-full bg-gray-400"
                  style={{
                    width: searchWidth,
                  }}
                />
              </View>
            </View>

            {/* Clicks Bar */}
            <View className="mb-2">
              <View className="mb-1 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Mouse size={14} color="#c1fe00" />
                  <Text className="ml-2 text-sm text-gray-400">
                    {t("analytics.clicks")}
                  </Text>
                </View>
                <Text className="text-sm font-medium text-primary">
                  {AnalyticsHelpers.formatNumber(clickCount)}
                </Text>
              </View>
              <View className="h-2 rounded-full bg-gray-700/50">
                <Animated.View
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: clickWidth,
                  }}
                />
              </View>
            </View>

            {/* Conversion Rate */}
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-xs text-gray-500">
                {t("analytics.conversionRate")}
              </Text>
              <Text className="text-xs font-semibold text-foreground">
                {conversionRate}%
              </Text>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
};

// Top Searches List Component
interface TopSearchesListProps {
  data: TopSearchResponse;
  loading?: boolean;
  error?: string | null;
}

export const TopSearchesList: React.FC<TopSearchesListProps> = ({
  data,
  loading,
  error,
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <View className="py-2">
        {[1, 2, 3, 4, 5].map((item) => (
          <View key={item} className="mb-3 flex-row items-center">
            <SkeletonItem
              width={24}
              height={24}
              borderRadius={12}
              className="mr-3 bg-gray-700/50"
            />
            <View className="flex-1">
              <View className="mb-1 flex-row items-center justify-between">
                <SkeletonItem
                  width="60%"
                  height={18}
                  borderRadius={4}
                  className="bg-gray-700/50"
                />
                <View className="ml-2 flex-row items-center">
                  <SkeletonItem
                    width={40}
                    height={16}
                    borderRadius={4}
                    className="mr-2 bg-gray-700/50"
                  />
                  <SkeletonItem
                    width={50}
                    height={20}
                    borderRadius={10}
                    className="bg-gray-700/50"
                  />
                </View>
              </View>
              <SkeletonItem
                width="100%"
                height={6}
                borderRadius={3}
                className="bg-gray-700/50"
              />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center py-4">
        <Text className="text-center text-red-400">{error}</Text>
      </View>
    );
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <View className="items-center py-4">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-gray-800/50">
          <Search size={32} color="#6b7280" />
        </View>
        <Text className="text-center text-gray-400">
          {t("analytics.noData")}
        </Text>
      </View>
    );
  }

  const maxSearches = Math.max(
    ...data.data.map((item) => parseInt(item.searchCount))
  );

  return (
    <View className="py-2">
      {data.data.map((item, index) => {
        const searchCount = parseInt(item.searchCount);
        const width = (searchCount / maxSearches) * (chartWidth - 120);

        return (
          <Animated.View
            key={`${item.searchTerm}-${index}`}
            className="mb-3 flex-row items-center"
            accessible={true}
            accessibilityRole="summary"
            accessibilityLabel={`${index + 1}. ${
              item.searchTerm
            }: ${AnalyticsHelpers.formatNumber(searchCount)} searches${
              item.percentageIncrease !== undefined
                ? `, ${AnalyticsHelpers.formatPercentageChange(
                    item.percentageIncrease
                  )} change`
                : ", new search term"
            }`}
          >
            <View className="mr-3 h-6 w-6 items-center justify-center rounded-full bg-primary/20">
              <Text className="text-xs font-bold text-primary">
                {index + 1}
              </Text>
            </View>

            <View className="flex-1">
              <View className="mb-1 flex-row items-center justify-between">
                <Text
                  className="flex-1 font-medium text-foreground"
                  numberOfLines={1}
                >
                  {item.searchTerm}
                </Text>
                <View className="ml-2 flex-row items-center">
                  <Text className="mr-2 text-sm font-semibold text-gray-300">
                    {AnalyticsHelpers.formatNumber(searchCount)}
                  </Text>
                  <PercentageIndicator
                    percentage={item.percentageIncrease}
                    size="small"
                    delay={index * 80 + 300}
                  />
                </View>
              </View>
              <View className="h-1.5 rounded-full bg-gray-700/50">
                <Animated.View
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: width,
                  }}
                />
              </View>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
};

// Trending Categories Component
interface TrendingCategoriesProps {
  data: TrendingCategoryResponse;
  loading?: boolean;
  error?: string | null;
}

export const TrendingCategories: React.FC<TrendingCategoriesProps> = ({
  data,
  loading,
  error,
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <View className="py-4">
        {[1, 2, 3, 4].map((item) => (
          <View key={item} className="mb-4 rounded-lg bg-gray-800/20 p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <SkeletonItem
                  width={32}
                  height={32}
                  borderRadius={16}
                  className="mr-3 bg-gray-700/50"
                />
                <SkeletonItem
                  width={120}
                  height={20}
                  borderRadius={6}
                  className="bg-gray-700/50"
                />
              </View>
              <SkeletonItem
                width={60}
                height={28}
                borderRadius={14}
                className="bg-gray-700/50"
              />
            </View>
            <View className="flex-row items-center justify-between">
              <SkeletonItem
                width={80}
                height={16}
                borderRadius={4}
                className="bg-gray-700/50"
              />
              <SkeletonItem
                width={60}
                height={24}
                borderRadius={6}
                className="bg-gray-700/50"
              />
            </View>
            <SkeletonItem
              width="100%"
              height={8}
              borderRadius={4}
              className="mt-2 bg-gray-700/50"
            />
          </View>
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <View className="items-center py-4">
        <Text className="text-center text-red-400">{error}</Text>
      </View>
    );
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <View className="items-center py-4">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-gray-800/50">
          <TrendingUp size={32} color="#6b7280" />
        </View>
        <Text className="text-center text-gray-400">
          {t("analytics.noData")}
        </Text>
      </View>
    );
  }

  const maxSearches = Math.max(
    ...data.data.map((item) => parseInt(item.searchCount, 10))
  );

  return (
    <View className="py-4">
      {data.data.map((item, index) => {
        const searchCount = parseInt(item.searchCount, 10);
        const progressWidth = (searchCount / maxSearches) * 100;

        return (
          <Animated.View
            key={`${item.category}-${index}`}
            className="mb-4 rounded-lg bg-gray-800/20 p-4"
            accessible={true}
            accessibilityRole="summary"
            accessibilityLabel={`${item.category} trending category: ${AnalyticsHelpers.formatNumber(
              searchCount
            )} searches${
              item.percentageIncrease !== undefined
                ? `, ${AnalyticsHelpers.formatPercentageChange(
                    item.percentageIncrease
                  )} change`
                : ", new trending category"
            }`}
          >
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                  <TrendingUp size={16} color="#c1fe00" />
                </View>
                <Text className="font-semibold capitalize text-foreground">
                  {item.category}
                </Text>
              </View>
              <PercentageIndicator
                percentage={item.percentageIncrease}
                size="medium"
                delay={index * 100 + 400}
              />
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-gray-400">
                {t("analytics.searches")}
              </Text>
              <Text className="text-lg font-bold text-primary">
                {AnalyticsHelpers.formatNumber(searchCount)}
              </Text>
            </View>

            <View className="mt-2 h-2 rounded-full bg-gray-700/50">
              <Animated.View
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${progressWidth}%`,
                }}
              />
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
};

// Enhanced Overview Cards
interface OverviewCardsProps {
  data?: any[];
  loading?: boolean;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({
  data,
  loading,
}) => {
  const { t } = useTranslation();

  if (loading || !data) {
    return (
      <>
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-xl bg-gray-800/30 p-4">
            <View className="mb-2 flex-row items-center">
              <SkeletonItem
                width={16}
                height={16}
                borderRadius={4}
                className="mr-2 bg-gray-700/50"
              />
              <SkeletonItem
                width="60%"
                height={12}
                borderRadius={4}
                className="bg-gray-700/50"
              />
            </View>
            <SkeletonItem
              width="80%"
              height={32}
              borderRadius={6}
              className="bg-gray-700/50"
            />
          </View>
          <View className="flex-1 rounded-xl bg-gray-800/30 p-4">
            <View className="mb-2 flex-row items-center">
              <SkeletonItem
                width={16}
                height={16}
                borderRadius={4}
                className="mr-2 bg-gray-700/50"
              />
              <SkeletonItem
                width="60%"
                height={12}
                borderRadius={4}
                className="bg-gray-700/50"
              />
            </View>
            <SkeletonItem
              width="80%"
              height={32}
              borderRadius={6}
              className="bg-gray-700/50"
            />
          </View>
        </View>
        <View className="mt-3 rounded-xl bg-gray-800/30 p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <SkeletonItem
                width={16}
                height={16}
                borderRadius={4}
                className="mr-2 bg-gray-700/50"
              />
              <SkeletonItem
                width={140}
                height={12}
                borderRadius={4}
                className="bg-gray-700/50"
              />
            </View>
            <SkeletonItem
              width={60}
              height={24}
              borderRadius={6}
              className="bg-gray-700/50"
            />
          </View>
        </View>
      </>
    );
  }

  const totals = AnalyticsHelpers.calculateTotals(data);

  return (
    <>
      <View className="flex-row gap-3">
        <Animated.View
          className="flex-1 rounded-xl bg-gray-800/30 p-4"
          accessible={true}
          accessibilityRole="summary"
          accessibilityLabel={`Total searches: ${AnalyticsHelpers.formatNumber(
            totals.totalSearches
          )}`}
        >
          <View className="mb-2 flex-row items-center">
            <Search size={16} color="#6b7280" />
            <Text className="ml-2 text-xs text-gray-400">
              {t("analytics.totalSearches")}
            </Text>
          </View>
          <AnimatedCounter
            value={totals.totalSearches}
            duration={1200}
            delay={300}
            formatter={AnalyticsHelpers.formatNumber}
            className="text-2xl font-bold text-foreground"
          />
        </Animated.View>

        <Animated.View
          className="flex-1 rounded-xl bg-gray-800/30 p-4"
          accessible={true}
          accessibilityRole="summary"
          accessibilityLabel={`Total clicks: ${AnalyticsHelpers.formatNumber(
            totals.totalClicks
          )}`}
        >
          <View className="mb-2 flex-row items-center">
            <Mouse size={16} color="#c1fe00" />
            <Text className="ml-2 text-xs text-gray-400">
              {t("analytics.totalClicks")}
            </Text>
          </View>
          <AnimatedCounter
            value={totals.totalClicks}
            duration={1200}
            delay={400}
            formatter={AnalyticsHelpers.formatNumber}
            className="text-2xl font-bold text-primary"
          />
        </Animated.View>
      </View>

      {/* Conversion Rate Card */}
      <Animated.View
        className="mt-3 rounded-xl bg-gray-800/30 p-4"
        accessible={true}
        accessibilityRole="summary"
        accessibilityLabel={`Average conversion rate: ${totals.averageConversion} percent`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Eye size={16} color="#22c55e" />
            <Text className="ml-2 text-xs text-gray-400">
              {t("analytics.averageConversion")}
            </Text>
          </View>
          <AnimatedCounter
            value={totals.averageConversion}
            duration={1200}
            delay={500}
            formatter={(val) => `${val}%`}
            className="text-lg font-bold text-green-400"
          />
        </View>
      </Animated.View>
    </>
  );
};
