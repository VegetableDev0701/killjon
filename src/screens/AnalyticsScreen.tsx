import {
  BarChart3,
  Download,
  Lock,
  Mail,
  Mouse,
  Search,
  Shield,
  TrendingUp,
} from "lucide-react-native";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Linking,
  PermissionsAndroid,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { trigger } from "react-native-haptic-feedback";
import Animated from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { toast } from "sonner-native";

import { isLiquidGlassSupported } from "@callstack/liquid-glass";
import LinearGradient from "react-native-linear-gradient";
import {
  ClickConversionChart,
  OverviewCards,
  TopSearchesList,
  TrendingCategories,
} from "../components/analytics/AnalyticsComponents";
import { AnimatedTab } from "../components/animated/AnimatedTab";
import { useAnalytics } from "../hooks/useAnalytics";
import { BottomTabProps } from "../navigation/navigationTypes";
import { AnalyticsApiService } from "../services/analyticsApi";
import { useAuthStore } from "../store/authStore";
import {
  HEADER_HEIGHT,
  IS_IOS,
  screenWidth,
  VivrationOption,
} from "../utils/constants";

const AnalyticsScreen = ({ navigation }: BottomTabProps<"AnalyticsTab">) => {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();

  const { isLoggedIn, userProfile } = useAuthStore();
  const {
    clickConversion,
    topSearches,
    trendingCategories,
    timePeriod,
    isLoading,
    isRefreshing,
    hasErrors,
    hasData,
    lastUpdated,
    refresh,
    changeTimePeriod,
  } = useAnalytics(isLoggedIn);

  // Check if user has analytics access
  const hasAnalyticsAccess =
    isLoggedIn && userProfile?.analyticsAccessStatus === "APPROVED";

  // Time period options for AnimatedTab
  const timePeriodOptions = [
    { name: t("analytics.last7Days"), value: 7 as const },
    { name: t("analytics.last30Days"), value: 30 as const },
  ];

  const selectedPeriodOption =
    timePeriodOptions.find((option) => option.value === timePeriod) ||
    timePeriodOptions[0];

  // Handle time period change with animation
  const handleTimePeriodChange = useCallback(
    (option: { name: string; value: 7 | 30 }) => {
      if (option.value === timePeriod) return;

      trigger("impactLight", VivrationOption);
      changeTimePeriod(option.value);
    },
    [timePeriod, changeTimePeriod]
  );

  // Handle refresh with haptic feedback
  const handleRefresh = useCallback(() => {
    trigger("impactMedium", VivrationOption);
    refresh();
    toast.success(t("analytics.refreshing"));
  }, [refresh, t]);

  // Handle retry for errors
  const handleRetry = useCallback(() => {
    trigger("impactMedium", VivrationOption);
    refresh();
  }, [refresh]);

  // Handle Contact Us button press
  const handleContactUs = useCallback(async () => {
    const email = "info@nodoia.app";
    const subject = encodeURIComponent(t("analytics.emailSubject"));
    const body = encodeURIComponent(t("analytics.emailBody"));

    const mailto = `mailto:${email}?subject=${subject}&body=${body}`;

    try {
      const supported = await Linking.canOpenURL(mailto);
      if (supported) {
        await Linking.openURL(mailto);
      } else {
        console.log("Email client not available, email:", email);
      }
    } catch (error) {
      console.error("Error opening email client:", error);
    }
  }, [t]);

  // Handle download analytics report
  const handleDownloadReport = useCallback(async () => {
    try {
      trigger("impactMedium", VivrationOption);

      // For Android 10+ (API 29+), we don't need WRITE_EXTERNAL_STORAGE permission for Downloads folder
      // For older versions, check permission
      if (Platform.OS === "android" && Platform.Version < 29) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: "Storage Permission",
            message: "App needs access to storage to download the report",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          toast.error(t("analytics.storagePermissionDenied"));
          return;
        }
      }

      toast.info(t("analytics.downloadingReport"));
      // Download the report using the service
      const { filePath, statusCode } =
        await AnalyticsApiService.downloadAnalyticsReportToDevice({
          period: timePeriod,
        });

      if (statusCode === 200) {
        trigger("notificationSuccess", VivrationOption);

        if (IS_IOS) {
          // On iOS, open the file using the share dialog
          toast.success(t("analytics.downloadSuccess"));
          await Linking.openURL(`file://${filePath}`);
        } else {
          // On Android, file is saved to Downloads folder
          toast.success(
            t("analytics.downloadSuccessAndroid").replace("folder", filePath)
          );
        }
      }
    } catch (error) {
      console.error("Download report error:", error);
      toast.error(
        error instanceof Error ? error.message : t("analytics.downloadError")
      );
    }
  }, [timePeriod, t]);

  return (
    <LinearGradient
      colors={["#0a0a0a", "#0f0f0f", "#0a0a0a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Show analytics content only if user has access */}
        {hasAnalyticsAccess ? (
          <>
            {/* Time Period Selector */}
            <View className="mx-6 my-2 items-center">
              <AnimatedTab
                data={timePeriodOptions}
                onPress={handleTimePeriodChange}
                selected={selectedPeriodOption}
                width={screenWidth - 48}
                height={48}
              />
            </View>

            {/* Content */}
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: isLiquidGlassSupported
                  ? HEADER_HEIGHT
                  : HEADER_HEIGHT + bottom / 2,
              }}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  colors={["#c1fe00"]}
                  tintColor="#c1fe00"
                  progressBackgroundColor="#1a2a0a"
                />
              }
            >
              {/* Error State */}
              {hasErrors && !isLoading && (
                <Animated.View className="mx-6 my-8 rounded-xl bg-gray-800/30 p-6">
                  <View className="items-center">
                    <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                      <BarChart3 size={32} color="#ef4444" />
                    </View>
                    <Text className="mb-2 text-lg font-semibold text-foreground">
                      {t("analytics.errorLoading")}
                    </Text>
                    <Text className="mb-6 text-center text-sm text-gray-400">
                      {t("analytics.errorLoadingDescription")}
                    </Text>
                    <TouchableOpacity
                      onPress={handleRetry}
                      className="rounded-lg bg-primary px-6 py-3"
                      activeOpacity={0.8}
                    >
                      <Text className="font-semibold text-gray-900">
                        {t("analytics.retryLoading")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}

              {/* Analytics Content - Only show if we have data or are refreshing */}
              <View className="px-6">
                {/* Overview Section with Download Button */}
                <View className="my-4 flex-row items-center justify-between">
                  <Text className="text-lg font-semibold text-foreground">
                    {t("analytics.overview")}
                  </Text>
                  <TouchableOpacity
                    onPress={handleDownloadReport}
                    className="flex-row items-center rounded-lg bg-primary px-3 py-2"
                    activeOpacity={0.8}
                  >
                    <Download size={16} color="#0a0a0a" />
                    <Text className="ml-1.5 text-sm font-semibold text-gray-900">
                      {t("analytics.download")}
                    </Text>
                  </TouchableOpacity>
                </View>
                <OverviewCards
                  data={clickConversion?.data?.data}
                  loading={clickConversion.loading}
                />

                {/* Click Conversion Analytics */}

                <View className="mb-4 mt-4 flex-row items-center">
                  <Mouse size={20} color="#c1fe00" className="mr-2" />
                  <Text className="text-lg font-semibold text-foreground">
                    {t("analytics.clickConversionTitle")}
                  </Text>
                </View>
                <Text className="mb-4 text-sm text-gray-400">
                  {t("analytics.clickConversionDescription")}
                </Text>
                <View className="rounded-xl bg-gray-800/30 px-4">
                  <ClickConversionChart
                    data={clickConversion.data!}
                    loading={clickConversion.loading}
                    error={clickConversion.error}
                  />
                </View>

                {/* Top Searches */}

                <View className="mb-4 mt-4 flex-row items-center">
                  <Search size={20} color="#c1fe00" className="mr-2" />
                  <Text className="text-lg font-semibold text-foreground">
                    {t("analytics.topSearchesTitle")}
                  </Text>
                </View>
                <Text className="mb-4 text-sm text-gray-400">
                  {t("analytics.topSearchesDescription")}
                </Text>
                <View className="rounded-xl bg-gray-800/30 p-4">
                  <TopSearchesList
                    data={topSearches.data!}
                    loading={topSearches.loading}
                    error={topSearches.error}
                  />
                </View>

                {/* Trending Categories */}

                <View className="mb-4 mt-4 flex-row items-center">
                  <TrendingUp size={20} color="#c1fe00" className="mr-2" />
                  <Text className="text-lg font-semibold text-foreground">
                    {t("analytics.trendingCategoriesTitle")}
                  </Text>
                </View>
                <Text className="mb-4 text-sm text-gray-400">
                  {t("analytics.trendingCategoriesDescription")}
                </Text>
                <View className="rounded-xl bg-gray-800/30 px-4">
                  <TrendingCategories
                    data={trendingCategories.data!}
                    loading={trendingCategories.loading}
                    error={trendingCategories.error}
                  />
                </View>
              </View>

              {/* No Data State */}
              {!hasData && !isLoading && !hasErrors && (
                <Animated.View className="mx-6 my-20 items-center">
                  <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-gray-800/50">
                    <BarChart3 size={40} color="#6b7280" />
                  </View>
                  <Text className="mb-2 text-lg font-semibold text-foreground">
                    {t("analytics.noData")}
                  </Text>
                  <Text className="text-center text-sm text-gray-400">
                    {t("analytics.noDataDescription")}
                  </Text>
                </Animated.View>
              )}

              {/* Last Updated */}
              {lastUpdated && (
                <Animated.View className="mx-6 my-4 items-center">
                  <Text className="text-xs text-gray-500">
                    {t("analytics.lastUpdated")}:{" "}
                    {lastUpdated.toLocaleTimeString()}
                  </Text>
                </Animated.View>
              )}
            </ScrollView>
          </>
        ) : (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.noAccessContainer}
          >
            <View style={styles.iconContainer}>
              <View style={styles.lockIcon}>
                <Lock size={12} color="#c1fe00" />
              </View>
              <View style={styles.chartIcon}>
                <BarChart3 size={32} color="#c1fe00" />
              </View>
            </View>

            <View style={styles.titleSection}>
              <Text style={styles.title}>{t("analytics.title")}</Text>
              <Text style={styles.subtitle}>{t("analytics.subtitle")}</Text>
            </View>

            <View style={styles.messageContainer}>
              <View style={styles.messageBox}>
                <Shield size={24} color="#c1fe00" style={styles.messageIcon} />
                <Text style={styles.messageText}>{t("analytics.message")}</Text>
              </View>
            </View>

            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>
                {t("analytics.features")}
              </Text>
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <BarChart3
                    size={16}
                    color="#c1fe00"
                    style={styles.featureIcon}
                  />
                  <Text style={styles.featureText}>
                    {t("analytics.advancedInsights")}
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Shield
                    size={16}
                    color="#c1fe00"
                    style={styles.featureIcon}
                  />
                  <Text style={styles.featureText}>
                    {t("analytics.realTimeData")}
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <BarChart3
                    size={16}
                    color="#c1fe00"
                    style={styles.featureIcon}
                  />
                  <Text style={styles.featureText}>
                    {t("analytics.customDashboards")}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleContactUs}
              style={styles.contactButton}
              activeOpacity={0.9}
            >
              <Mail size={20} color="#0a0a0a" />
              <Text style={styles.buttonText}>{t("analytics.contactUs")}</Text>
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>{t("analytics.footer")}</Text>
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  noAccessContainer: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  iconContainer: {
    position: "relative",
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  lockIcon: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "rgba(193, 254, 0, 0.1)",
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(193, 254, 0, 0.2)",
  },
  chartIcon: {
    backgroundColor: "rgba(193, 254, 0, 0.1)",
    borderRadius: 25,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(193, 254, 0, 0.2)",
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#666666",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  messageContainer: {
    marginBottom: 24,
    width: "100%",
  },
  messageBox: {
    backgroundColor: "rgba(193, 254, 0, 0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(193, 254, 0, 0.2)",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  messageIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  messageText: {
    color: "#ffffff",
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: 32,
    width: "100%",
  },
  featuresTitle: {
    color: "#c1fe00",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(193, 254, 0, 0.1)",
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  contactButton: {
    backgroundColor: "#c1fe00",
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#c1fe00",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 24,
    width: "100%",
  },
  buttonText: {
    color: "#0a0a0a",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  footerContainer: {
    alignItems: "center",
    width: "100%",
  },
  footerText: {
    color: "#666666",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
    fontStyle: "italic",
  },
});

export default AnalyticsScreen;
