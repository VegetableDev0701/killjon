import { isLiquidGlassSupported } from "@callstack/liquid-glass";
import {
  Award,
  Bell,
  Globe,
  Heart,
  LogIn,
  LogOut,
  MapPin,
  MessageCircle,
  ReceiptText,
  Shield,
  Star,
  Trash2,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { trigger } from "react-native-haptic-feedback";
import LinearGradient from "react-native-linear-gradient";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { AnimatedScreen, AnimatedTab } from "../components/animated";
import ShareModal from "../components/merchants/ShareModal";
import { ProfileCompletionStepper } from "../components/profile/ProfileCompletionBar";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { ProfileSection, SettingItem } from "../components/profile/SettingItem";
import { RejectionModal } from "../components/ui/RejectionModal";
import { useLanguage } from "../i18n/LanguageContext";
import { BottomTabProps } from "../navigation/navigationTypes";
import { ApiService } from "../services/apiService";
import { AuthService } from "../services/authService";
import { NotificationService } from "../services/notificationService";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import {
  HEADER_HEIGHT,
  screenWidth,
  VivrationOption,
} from "../utils/constants";
import { useLoginSheet } from "../utils/LoginSheetContext";
import { storage } from "../utils/storage";
import { countries } from "./ChooseCountryScreen";
import { LiquidGlassContainer } from "../utils/liquidGlass";

const ProfileScreen = ({ navigation }: BottomTabProps<"ProfileTab">) => {
  const { t } = useTranslation();
  const { bottom, top } = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const {
    isLoggedIn,
    userProfile,
    merchantDetails,
    logOut,
    getUserProfile,
    getMerchantDetails,
    selectedCountry,
  } = useAuthStore();
  const { favorites } = useChatStore();
  const { language } = useLanguage();
  const { showLoginSheet } = useLoginSheet();

  // Map language code to display name
  const getLanguageDisplay = (code: string) => {
    switch (code) {
      case "es":
        return t("common.spanish");
      case "en":
        return t("common.english");
      default:
        return t("common.english");
    }
  };

  // Map verification status to display text
  const getVerificationStatusDisplay = (status?: string) => {
    switch (status) {
      case "VERIFIED":
        return t("profile.activeStatus");
      case "PAID":
        return t("profile.verificationPending");
      case "UNDER_REVIEW":
        return t("profile.underReviewStatus");
      case "REJECTED":
        return t("profile.rejectedStatus");
      case "UNPAID":
      default:
        return t("profile.inactiveStatus");
    }
  };

  const [notifications, setNotifications] = useState(() => {
    const stored = storage.getBoolean("notifications_enabled");
    return stored !== undefined ? stored : true;
  });
  // moved to native modal screens via stack navigation
  const [refreshing, setRefreshing] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loadingRejectionDetails, setLoadingRejectionDetails] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [currentProfileImage, setCurrentProfileImage] = useState<string | null>(
    null
  );
  const [notificationPermissionGranted, setNotificationPermissionGranted] =
    useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Memoized status checks to prevent flickering
  const isVerifiedUser = useMemo(() => {
    return (userProfile && userProfile.verifiedStatus === "VERIFIED") || false;
  }, [userProfile]);

  // Fetch rejection details if user has rejected status
  useEffect(() => {
    if (userProfile?.verifiedStatus === "REJECTED" && !rejectionReason) {
      handleRejectionDetails();
    }
  }, [userProfile?.verifiedStatus, rejectionReason]);

  useEffect(() => {
    const checkNotificationPermission = async () => {
      const status = await NotificationService.checkPermission();
      setNotificationPermissionGranted(status === "granted");
    };
    checkNotificationPermission();
    getUserProfile();
    if (isVerifiedUser) {
      getMerchantDetails();
    }
  }, []);

  // Handle notification toggle
  const handleNotificationToggle = async (value: boolean) => {
    try {
      setNotifications(value);
      storage.set("notifications_enabled", value);

      if (value) {
        // User enabled notifications
        const permissionStatus = await NotificationService.requestPermission();

        if (permissionStatus === "granted") {
          // Get FCM token and subscribe to topics
          const token = await NotificationService.getFCMToken();
          if (token) {
            await NotificationService.subscribeToTopics(userProfile);
            setNotificationPermissionGranted(true);
            toast.success(t("profile.notificationsEnabled"));
          }
        } else {
          // Permission denied, revert toggle
          setNotifications(false);
          storage.set("notifications_enabled", false);

          Alert.alert(
            t("profile.permissionDenied"),
            t("profile.notificationPermissionMessage"),
            [
              { text: t("common.cancel"), style: "cancel" },
              {
                text: t("profile.openSettings"),
                onPress: () => {
                  // On iOS/Android, guide user to open settings
                  if (Platform.OS === "ios") {
                    Alert.alert(
                      t("profile.enableNotifications"),
                      t("profile.iosSettingsInstructions")
                    );
                  } else {
                    Alert.alert(
                      t("profile.enableNotifications"),
                      t("profile.androidSettingsInstructions")
                    );
                  }
                },
              },
            ]
          );
        }
      } else {
        // User disabled notifications - unsubscribe from topics
        await NotificationService.unsubscribeFromAllTopics(userProfile);
        toast.success(t("profile.notificationsDisabled"));
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
      toast.error(t("profile.notificationToggleFailed"));
      // Revert toggle on error
      setNotifications(!value);
      storage.set("notifications_enabled", !value);
    }
  };

  // Initialize profile image from userProfile
  useEffect(() => {
    if (userProfile?.logoUrl && !currentProfileImage) {
      setCurrentProfileImage(userProfile.logoUrl);
    }
  }, [userProfile?.logoUrl, currentProfileImage]);

  // Refresh user profile
  const handleRefreshProfile = async () => {
    try {
      setRefreshing(true);
      await getUserProfile();
      if (isVerifiedUser) {
        await getMerchantDetails();
      }
    } catch (error) {
      console.log(error);
      toast.error(t("profile.refreshFailed"));
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(t("profile.signOut"), t("profile.confirmLogout"), [
      {
        text: t("common.cancel"),
        style: "cancel",
      },
      {
        text: t("profile.signOut"),
        onPress: () => {
          logOut();
          navigation.reset({
            index: 0,
            routes: [{ name: "Welcome" }],
          });
        },
        style: "destructive",
      },
    ]);
  };

  // language selection handled in LanguageSelection modal

  const handleFavoritesPress = () => {
    navigation.navigate("Favorites");
  };

  // feedback handled in Feedback modal

  const handleDeleteAccount = () => {
    Alert.alert(
      t("profile.confirmDeleteAccount"),
      t("profile.confirmDeleteAccountMessage"),
      [
        {
          text: t("common.cancel"),
          style: "cancel",
        },
        {
          text: t("profile.deleteAccount"),
          onPress: async () => {
            setDeleteAccountLoading(true);
            try {
              const response = await AuthService.deleteAccount();
              if (response.success) {
                toast.success(t("profile.deleteAccountSuccess"));
                await logOut();
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Welcome" }],
                });
              } else {
                toast.error(
                  response.message || t("profile.deleteAccountFailed")
                );
              }
            } catch (error) {
              console.log(error);
              toast.error(t("profile.deleteAccountFailed"));
            } finally {
              setDeleteAccountLoading(false);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  const handlePurchaseBadge = useCallback(async () => {
    // Check if user is Freemium - show premium modal
    if (
      userProfile?.verifiedStatus === "PAID" ||
      userProfile?.verifiedStatus === "UNPAID"
    ) {
      navigation.navigate("PremiumUpgrade");
      return;
    }

    if (userProfile?.verifiedStatus === "REJECTED") {
      handleRejectionDetails(true);
      return;
    }
  }, [userProfile?.verifiedStatus, navigation]);

  const handleRejectionDetails = async (showModal = false) => {
    setLoadingRejectionDetails(true);
    try {
      const response = await ApiService.verification.getVerificationDetails();
      const rejectedVerification = response.verifications.find(
        (v) => v.status === "REJECTED"
      );
      if (rejectedVerification?.rejectionReason) {
        setRejectionReason(rejectedVerification.rejectionReason);
        if (showModal) {
          setShowRejectionModal(true);
        }
      } else {
        toast.error(t("admin.rejectionReasonNotFound"));
      }
    } catch (error) {
      console.error("Error fetching rejection details:", error);
      toast.error(t("admin.failedToLoadRejectionDetails"));
    } finally {
      setLoadingRejectionDetails(false);
    }
  };

  const handleResubmit = () => {
    setShowRejectionModal(false);
    navigation.navigate("VerificationForm");
  };

  const handleBecomeNoder = () => {
    // Currently does nothing as per requirements
    toast.info(t("profile.becomeNoderComingSoon"));
  };

  const handleBoostPress = () => {
    navigation.navigate("Boost");
  };

  const handleStatusPress = () => {
    navigation.navigate("PremiumUpgrade");
  };

  // Image selection handled by PhotoSource modal - this handler receives the selected image URI
  const handleImageSelected = async (imageUri: string) => {
    setUploadingPhoto(true);
    try {
      await uploadProfileImage(imageUri);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const uploadProfileImage = async (imageUri: string) => {
    try {
      const response = await ApiService.merchant.updateLogo(imageUri);

      toast.success(t("profile.photoUploaded"));

      // Update the profile image immediately for UI feedback
      if (response.logoUrl) {
        setCurrentProfileImage(response.logoUrl);
      }
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 403) {
        toast.error(t("profile.onlyVerifiedMerchantsUploadPhoto"));
      } else if (error.response?.status === 401) {
        toast.error(t("profile.authenticationRequired"));
      } else {
        toast.error(
          error.response?.data?.message || t("profile.photoUploadFailed")
        );
      }
    }
  };
  const timePeriodOptions = [
    { name: t("admin.addListing"), value: true },
    { name: t("admin.manageListing"), value: false },
  ];

  const handleTimePeriodChange = useCallback(
    (option: { name: string; value: boolean }) => {
      if (option.value) {
        navigation.navigate("SelectCategory");
      } else {
        navigation.navigate("MyListings");
      }
      trigger("impactLight", VivrationOption);
    },
    []
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = event.nativeEvent;
      scrollY.value = contentOffset.y;
    },
    [scrollY]
  );

  const stepperBackgroundStyle = useAnimatedStyle(() => {
    "worklet";
    const backgroundColorOpacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0],
      Extrapolation.CLAMP
    );

    return {
      backgroundColor:
        backgroundColorOpacity > 0
          ? `rgba(10, 10, 10, ${backgroundColorOpacity})`
          : "transparent",
    };
  });

  const liquidGlassOpacityStyle = useAnimatedStyle(() => {
    "worklet";
    const glassOpacity = interpolate(
      scrollY.value,
      [0, 100],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity: glassOpacity,
    };
  });

  const stepperOpacityStyle = useAnimatedStyle(() => {
    "worklet";
    const opacity = interpolate(
      scrollY.value,
      [0, 50],
      [1, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [0, 50],
            [0, -20],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  return (
    <LinearGradient
      colors={["#0a0a0a", "#0f0f0f", "#0a0a0a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView edges={["top"]} className="flex-1">
        {/* Profile Completion Bar - Only show for verified merchants */}
        {isVerifiedUser && (
          <Animated.View
            style={[
              {
                position: "absolute",
                top: top,
                left: 0,
                right: 0,
                zIndex: 1000,
                overflow: "hidden",
              },
              stepperOpacityStyle,
            ]}
          >
            {/* Stepper container with animated background and liquid glass */}
            <Animated.View
              style={[
                {
                  overflow: "hidden",
                },
                stepperBackgroundStyle,
              ]}
            >
              {/* Liquid glass effect layer */}
              <Animated.View
                style={[
                  {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  },
                  liquidGlassOpacityStyle,
                ]}
                pointerEvents="none"
              >
                <LiquidGlassContainer
                  effect="regular"
                  interactive={true}
                  style={{ flex: 1 }}
                />
              </Animated.View>
              {/* Stepper content */}
              <View style={{ zIndex: 1 }}>
                <ProfileCompletionStepper
                  hasProfilePicture={!!currentProfileImage}
                  hasLocation={!!merchantDetails?.location}
                  hasAtLeastOneProduct={
                    (merchantDetails?.totalListings || 0) > 0
                  }
                />
              </View>
            </Animated.View>
          </Animated.View>
        )}
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{
            paddingTop: isVerifiedUser ? HEADER_HEIGHT : 10,
          }}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefreshProfile}
              tintColor="#c1fe00"
              colors={["#c1fe00"]}
            />
          }
        >
          <ProfileHeader
            currentProfileImage={currentProfileImage}
            uploadingPhoto={uploadingPhoto}
            firstName={userProfile?.firstName}
            email={userProfile?.email}
            brandName={merchantDetails?.brand_name}
            lastName={userProfile?.lastName}
            isVerifiedUser={isVerifiedUser}
            verifiedStatus={userProfile?.verifiedStatus}
            hasMerchantDetails={!!merchantDetails}
            onProfileImageError={() => setCurrentProfileImage(null)}
            onEditPress={() =>
              navigation.navigate("PhotoSource", {
                onImageSelected: handleImageSelected,
              })
            }
            onLocationPress={() => navigation.navigate("StoreLocation")}
            onSharePress={() => setShowShareModal(true)}
            getVerificationStatusDisplay={getVerificationStatusDisplay}
          />

          {/* Listing Controls */}
          {isLoggedIn && (
            <View className="mx-6  mb-6 items-center">
              <AnimatedTab
                data={timePeriodOptions}
                onPress={handleTimePeriodChange}
                selected={timePeriodOptions[0]}
                width={screenWidth - 48}
                height={48}
              />
            </View>
          )}

          {/* Account Section */}
          <ProfileSection title={t("profile.account")} delay={100}>
            <AnimatedScreen
              animationType="stagger"
              staggerItems={!notificationPermissionGranted ? 3 : 4}
            >
              {!notificationPermissionGranted && (
                <SettingItem
                  icon={<Bell color="#c1fe00" size={20} />}
                  title={t("profile.notifications")}
                  withToggle
                  toggleValue={notifications}
                  onToggle={handleNotificationToggle}
                />
              )}
              <SettingItem
                icon={<Globe color="#c1fe00" size={20} />}
                title={t("profile.language")}
                value={getLanguageDisplay(language)}
                onPress={() => navigation.navigate("LanguageSelection")}
              />
              <SettingItem
                icon={<MapPin color="#c1fe00" size={20} />}
                title={t("profile.country")}
                value={
                  countries.find((c) => c.code === selectedCountry)?.name ||
                  t("profile.defaultCountry")
                }
                onPress={() => navigation.navigate("ChooseCountry")}
              />
              <SettingItem
                icon={<Heart color="#c1fe00" size={20} />}
                title={t("profile.favorites")}
                value={`${favorites?.length || 0} ${t("profile.items")}`}
                onPress={handleFavoritesPress}
                isLast={true}
              />
            </AnimatedScreen>
          </ProfileSection>

          {/* Commerce Section */}
          <ProfileSection title={t("profile.commerce")} delay={200}>
            <AnimatedScreen animationType="stagger" staggerItems={4}>
              <SettingItem
                icon={
                  <Award
                    color={isVerifiedUser ? "#c1fe00" : "#666"}
                    size={20}
                  />
                }
                title={t("profile.status")}
                value={
                  isVerifiedUser ? t("profile.premium") : t("profile.freemium")
                }
                onPress={handleStatusPress}
                disabled={!!isVerifiedUser}
              />
              <SettingItem
                icon={
                  <Star color={isVerifiedUser ? "#c1fe00" : "#666"} size={20} />
                }
                title={
                  ["UNDER_REVIEW", "VERIFIED"].includes(
                    userProfile?.verifiedStatus as string
                  )
                    ? t("profile.merchantStatus")
                    : t("profile.becomeAMerchant")
                }
                value={
                  (userProfile?.verifiedStatus as string) === "REJECTED"
                    ? loadingRejectionDetails
                      ? t("admin.loadingDetails")
                      : `${getVerificationStatusDisplay(
                          userProfile?.verifiedStatus
                        )} - ${t("admin.checkDetails")}`
                    : getVerificationStatusDisplay(userProfile?.verifiedStatus)
                }
                disabled={
                  ["UNDER_REVIEW", "VERIFIED"].includes(
                    userProfile?.verifiedStatus as string
                  ) || loadingRejectionDetails
                }
                onPress={handlePurchaseBadge}
              />
              <SettingItem
                icon={<Zap color="#c1fe00" size={20} />}
                title={t("profile.brandBoost")}
                onPress={handleBoostPress}
                isLast={true}
              />
            </AnimatedScreen>
          </ProfileSection>

          {/* Help Center Section */}
          <ProfileSection title={t("profile.helpCenter")} delay={300}>
            <SettingItem
              icon={<Shield color="#c1fe00" size={20} />}
              title={t("profile.privacyPolicy")}
              onPress={() => navigation.navigate("PrivacyPolicy")}
            />
            <SettingItem
              icon={<ReceiptText color="#c1fe00" size={20} />}
              title={t("profile.termsOfUse")}
              onPress={() => navigation.navigate("TermsOfUse")}
            />
            <SettingItem
              icon={<MessageCircle color="#c1fe00" size={20} />}
              title={t("profile.feedback")}
              onPress={() => navigation.navigate("Feedback")}
              isLast={true}
            />
          </ProfileSection>

          {/* Account Actions Section */}
          <ProfileSection
            isNotViable={!isLoggedIn}
            title={t("profile.accountActions")}
            delay={400}
          >
            <TouchableOpacity
              className="mb-3 flex-row items-center rounded-2xl bg-[#1e1e1e] p-4 px-5"
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-[#ff4444]">
                <LogOut size={20} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  {t("profile.signOut")}
                </Text>
                <Text className="text-xs text-gray-400">
                  {t("profile.logoutDescription")}
                </Text>
              </View>
            </TouchableOpacity>
            <View className="mx-5 h-px bg-[#333]" />
            <TouchableOpacity
              className={`flex-row items-center rounded-2xl bg-[#1e1e1e] p-4 px-5 ${
                deleteAccountLoading ? "opacity-60" : ""
              }`}
              onPress={handleDeleteAccount}
              activeOpacity={0.7}
              disabled={deleteAccountLoading}
            >
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-[#dc2626]">
                {deleteAccountLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Trash2 size={20} color="#ffffff" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  {t("profile.deleteAccount")}
                </Text>
                <Text className="text-xs text-gray-400">
                  {t("profile.deleteAccountDescription")}
                </Text>
              </View>
            </TouchableOpacity>
          </ProfileSection>
          <ProfileSection
            isNotViable={isLoggedIn}
            title={t("profile.accountActions")}
            delay={400}
          >
            <TouchableOpacity
              className="flex-row items-center rounded-2xl bg-[#1e1e1e] p-4 px-5"
              onPress={showLoginSheet}
              activeOpacity={0.7}
            >
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-[#ff4444]">
                <LogIn size={20} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  {t("profile.signIn")}
                </Text>
              </View>
            </TouchableOpacity>
          </ProfileSection>
          <View
            style={{
              height: isLiquidGlassSupported
                ? bottom / 2
                : HEADER_HEIGHT + bottom / 2,
            }}
          />
        </ScrollView>
      </SafeAreaView>

      {/* RejectionModal - Keep as is since it already exists */}
      <RejectionModal
        visible={showRejectionModal}
        rejectionReason={rejectionReason}
        onClose={() => setShowRejectionModal(false)}
        onResubmit={handleResubmit}
      />

      {/* Share Modal */}
      {merchantDetails && (
        <ShareModal
          visible={showShareModal}
          onClose={() => setShowShareModal(false)}
          merchantId={merchantDetails.id}
          merchantName={merchantDetails.brand_name}
          shareUrl={merchantDetails.share_url}
          qrCodeUrl={merchantDetails.qr_code_url || undefined}
        />
      )}
    </LinearGradient>
  );
};

export default ProfileScreen;
