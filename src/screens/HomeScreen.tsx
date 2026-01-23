import { isLiquidGlassSupported } from "@callstack/liquid-glass";
import { LegendList, LegendListRef } from "@legendapp/list";
import { AnimatedLegendList } from "@legendapp/list/reanimated";
import Geolocation from "@react-native-community/geolocation";
import { CheckCircle, List, MapPin, Store } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import LinearGradient from "react-native-linear-gradient";
import MapView, { Marker, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MultiStory,
  MultiStoryRef,
  StoriesType,
  StoryType,
  TransitionMode,
} from "react-native-story-view";
import { toast } from "sonner-native";
import assets from "../assets";
import { AnimatedListItem } from "../components/animated";
import {
  SkeletonMerchantGrid,
  SkeletonStoryCircle,
} from "../components/animated/SkeletonLoader";
import { EmptyState } from "../components/EmptyState";
import { AddStoryCircle } from "../components/stories/AddStoryCircle";
import { StoryFooter } from "../components/stories/StoryFooter";
import { BottomTabProps } from "../navigation/navigationTypes";
import { trackMerchantProfileView } from "../services/firebaseAnalyticsService";
import { useStaticStories } from "../services/firebaseRemoteConfigService";
import { useAuthStore } from "../store/authStore";
import { useListingStore } from "../store/listingStore";
import { useMerchantStore } from "../store/merchantStore";
import { HEADER_HEIGHT, IS_ANDROID, IS_IOS, screenHeight } from "../utils/constants";
import { customMapStyle } from "../utils/geocoding";
import { LiquidGlassContainer, liquidGlassProps } from "../utils/liquidGlass";
import { useLoginSheet } from "../utils/LoginSheetContext";

const HomeScreen = ({ navigation }: BottomTabProps<"HomeTab">) => {
  const { t, i18n } = useTranslation();
  const mapRef = useRef<MapView>(null);
  const { categories, fetchCategories } = useListingStore();
  const { isLoggedIn } = useAuthStore();
  const { bottom, top } = useSafeAreaInsets();
  const { showLoginSheet } = useLoginSheet();
  const {
    boostedMerchants,
    boostedMerchantsLoading,
    boostedPagination,
    fetchBoostedMerchants,
    allMerchants,
    topMerchants,
    allMerchantsLoading,
    topMerchantLoading,
    fetchAllMerchants,
    fetchTopMerchants,
  } = useMerchantStore();

  const { stories: staticStories, loading: staticLoading } = useStaticStories();

  const [hasMoreData, setHasMoreData] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const initialLoadComplete = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [userLocation, setUserLocation] = useState<Region | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const scrollY = useSharedValue(0);

  // Animation values for liquid glass toggle
  const listScale = useSharedValue(viewMode === "list" ? 1 : 0.9);
  const mapScale = useSharedValue(viewMode === "map" ? 1 : 0.9);
  const listOpacity = useSharedValue(viewMode === "list" ? 1 : 0.6);
  const mapOpacity = useSharedValue(viewMode === "map" ? 1 : 0.6);
  // Sliding indicator position (0 = list, 1 = map)
  const slidePosition = useSharedValue(viewMode === "list" ? 0 : 1);

  // Update animations when viewMode changes
  useEffect(() => {
    listScale.value = withSpring(viewMode === "list" ? 1 : 0.9, { damping: 15 });
    mapScale.value = withSpring(viewMode === "map" ? 1 : 0.9, { damping: 15 });
    listOpacity.value = withTiming(viewMode === "list" ? 1 : 0.6, { duration: 200 });
    mapOpacity.value = withTiming(viewMode === "map" ? 1 : 0.6, { duration: 200 });
    slidePosition.value = withSpring(viewMode === "list" ? 0 : 1, {
      damping: 20,
      stiffness: 180,
    });
  }, [viewMode]);

  const listAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: listScale.value }],
    opacity: listOpacity.value,
  }));

  const mapAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mapScale.value }],
    opacity: mapOpacity.value,
  }));

  const slideAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slidePosition.value * 56 }], // 56 is the button width + gap
  }));

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = event.nativeEvent;
      scrollY.value = contentOffset.y;
    },
    []
  );

  const toggleButtonGlassOpacityStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      opacity: 1,
    };
  });

  // Memoize category sections data
  const categorySections = useMemo(() => {
    const sections = [];
    // Top Merchants section
    sections.push({
      id: 'topMerchants',
      title: t("chat.topMerchants"),
      merchants: topMerchants,
      isLoading: topMerchantLoading,
    });

    // Category sections
    categories.forEach((cat) => {
      const categoryMerchants = allMerchants.filter(
        (merchant: any) => merchant.category === cat.category_key
      );
      if (categoryMerchants.length > 0) {
        sections.push({
          id: cat.category_key,
          title: cat.display_name,
          merchants: categoryMerchants,
          isLoading: false,
        });
      }
    });

    return sections;
  }, [t, categories, topMerchants, allMerchants, topMerchantLoading]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      setCurrentPage(1);
      setHasMoreData(true);
      const response = await fetchAllMerchants(1, 100, "asc");
      await fetchTopMerchants();
      await fetchBoostedMerchants(0, false);
      if (response && response.totalPages) {
        setTotalPages(response.totalPages);
        setHasMoreData(response.totalPages > 1);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchAllMerchants, fetchTopMerchants, fetchBoostedMerchants]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Image
          source={assets.animatedLogo}
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
          }}
          resizeMode="contain"
          fadeDuration={0}
        />
      ),
      headerTitleAlign: "center",
      headerStyle: { backgroundColor: "#0a0a0a" },
      ...(IS_IOS && { headerBackground: () => null }),
    });
  }, [navigation]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Reset pagination state when sorting changes
        setCurrentPage(1);
        setHasMoreData(true);

        fetchBoostedMerchants(0, false);
        fetchCategories(i18n.language);
        fetchTopMerchants();
        const response = await fetchAllMerchants(1, 100, "asc");
        if (response && response.totalPages) {
          setTotalPages(response.totalPages);
          setHasMoreData(response.totalPages > 1);
        }

        // Mark initial load as complete
        if (!initialLoadComplete.current) {
          initialLoadComplete.current = true;
        }
      } catch (error) {
        console.log(error);
        // Silent error handling
      }
    };
    fetchInitialData();
  }, [fetchAllMerchants, fetchTopMerchants, fetchBoostedMerchants]);

  // Get user location when map view is selected
  useEffect(() => {
    if (viewMode === "map" && !userLocation) {
      setIsLoadingLocation(true);
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const region: Region = {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setUserLocation(region);
          setIsLoadingLocation(false);
          if (mapRef.current) {
            mapRef.current.animateToRegion(region, 1000);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error(t("chat.failedToGetCurrentLocation"));

          // Fall back to default location if geolocation fails
          setUserLocation({
            latitude: 18.4861,
            longitude: -69.9312,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
          setIsLoadingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    }
  }, [viewMode, t, userLocation]);

  // Get merchants with location for map view
  const mapMerchants = useMemo(() => {
    return allMerchants.filter(
      (merchant: any) => merchant.latitude && merchant.longitude
    );
  }, [allMerchants]);

  // Memoize handleMerchantPress to prevent recreation
  const handleMerchantPress = useCallback(
    (merchant: any) => {
      // Check if merchant is Amazon and open special URL
      if (merchant.slug === "amazon") {
        Linking.openURL("https://amzn.to/4o58DHK").catch((err) =>
          console.error("Failed to open Amazon URL:", err)
        );
        return;
      }

      if (merchant.slug === "aliexpress") {
        Linking.openURL(
          "https://rzekl.com/g/1e8d1144946828bdf9c016525dc3e8/"
        ).catch((err) => console.error("Failed to open Amazon URL:", err));
        return;
      }

      trackMerchantProfileView(merchant.user_id, merchant.id);

      navigation.navigate("MerchantListings", {
        merchantId: merchant.user_id,
        merchantName: merchant.brand_name || merchant.full_name,
        total_listings: merchant.total_listings || merchant.totalListings || 0,
        shareUrl: merchant.share_url,
        qrCodeUrl: merchant.qr_code_url,
      });
    },
    [navigation]
  );


  // Memoize loadMoreMerchants to prevent recreation
  const loadMoreMerchants = useCallback(async () => {
    if (isLoadingMore || !hasMoreData || allMerchantsLoading) return;
    if (currentPage >= totalPages) {
      setHasMoreData(false);
      return;
    }

    // Mark initial load as complete after first load
    if (!initialLoadComplete.current) {
      initialLoadComplete.current = true;
    }

    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;

      // Fetch next page
      const response = await fetchAllMerchants(nextPage, 100, "asc");
      setCurrentPage(nextPage);

      // Update totalPages if it changed in the response
      if (response && response.totalPages) {
        setTotalPages(response.totalPages);
      }

      // Check if we've reached the last page
      if (nextPage >= totalPages) {
        setHasMoreData(false);
      }
    } catch (error) {
      console.log(error);
      // Silent error handling
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    isLoadingMore,
    hasMoreData,
    allMerchantsLoading,
    currentPage,
    totalPages,
    fetchAllMerchants,
  ]);


  const keyExtractor = useCallback((item: any) => item.id.toString(), []);

  const renderMerchantItem = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const merchantName = item.full_name || item.brand_name || item.name;
      const isVerified = item.verifiedStatus === "VERIFIED" || item.isVerified;
      const totalListings = item.totalListings || item.productCount || 0;
      const imageUri = item.logo_url || item.image;
      const isAmazon = merchantName?.toLowerCase() === "amazon";

      return (
        <AnimatedListItem
          index={index}
          onPress={() => handleMerchantPress(item)}
          style={styles.merchantCardHorizontal}
        >
          {/* Image Section */}
          <View style={styles.imageSectionHorizontal}>
            {imageUri ? (
              <Image
                source={{ uri: imageUri }}
                style={styles.merchantImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.soonText}>Coming Soon</Text>
              </View>
            )}
          </View>

          {/* Text Section */}
          <View style={styles.textSectionHorizontal}>
            <Text style={styles.merchantName} numberOfLines={1}>
              {merchantName}
            </Text>

            {isVerified && (
              <View style={styles.verifiedBadge}>
                <CheckCircle color="#c1fe00" size={12} />
                <Text style={styles.verifiedText}>
                  {t("merchants.verified")}
                </Text>
              </View>
            )}

            <Text style={styles.productCount} numberOfLines={1}>
              {isAmazon
                ? `+1000 ${t("merchants.ads")}`
                : `${totalListings} ${totalListings === 1 ? t("merchants.ad") : t("merchants.ads")
                }`}
            </Text>
          </View>
        </AnimatedListItem>
      );
    },
    [handleMerchantPress, t]
  );

  const renderCategorySection = useCallback(
    ({ item }: { item: typeof categorySections[0] }) => {
      if (item.isLoading && !initialLoadComplete.current) {
        return null;
      }

      if (item.merchants.length === 0) {
        return null;
      }

      return (
        <View style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <Text style={styles.categoryTitle}>{item.title}</Text>
          </View>
          <LegendList
            horizontal
            data={item.merchants}
            renderItem={renderMerchantItem}
            keyExtractor={keyExtractor}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
            ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          />
        </View>
      );
    },
    [renderMerchantItem, keyExtractor]
  );

  // Memoize renderMapView to prevent unnecessary re-renders
  const renderMapView = useCallback(() => {
    return (
      <View style={styles.mapContainer}>
        {isLoadingLocation ? (
          <View style={styles.emptyMapState}>
            <ActivityIndicator size="large" color="#c1fe00" />
            <Text style={styles.emptyMapText}>{t("chat.gettingLocation")}</Text>
          </View>
        ) : !userLocation ? (
          <View style={styles.emptyMapState}>
            <MapPin color="#666" size={48} />
            <Text style={styles.emptyMapText}>
              {t("chat.failedToGetCurrentLocation")}
            </Text>
          </View>
        ) : mapMerchants.length === 0 ? (
          <View style={styles.emptyMapState}>
            <MapPin color="#666" size={48} />
            <Text style={styles.emptyMapText}>
              {t("merchants.noMerchantsWithLocation")}
            </Text>
            <Text style={styles.emptyMapSubtext}>
              {t("merchants.merchantsWillAppearHere")}
            </Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={userLocation}
            showsUserLocation={true}
            showsMyLocationButton={false}
            customMapStyle={customMapStyle}
            loadingIndicatorColor="#c1fe00"
            userInterfaceStyle={"dark"}
          >
            {mapMerchants.map((merchant: any) => {
              // Parse coordinates as numbers (API returns strings)
              const latitude = parseFloat(merchant.latitude);
              const longitude = parseFloat(merchant.longitude);

              // Skip invalid coordinates
              if (isNaN(latitude) || isNaN(longitude)) {
                console.warn(
                  `Invalid coordinates for merchant ${merchant.brand_name}:`,
                  merchant.latitude,
                  merchant.longitude
                );
                return null;
              }

              const merchantName = merchant.brand_name || merchant.full_name;
              const merchantId = merchant.id;

              return (
                <Marker
                  key={merchantId}
                  coordinate={{
                    latitude,
                    longitude,
                  }}
                  onPress={() => handleMerchantPress(merchant)}
                >
                  <View style={styles.mapMarkerContainer}>
                    {/* Google Maps-style pin */}
                    <View style={styles.customMarker}>
                      <MapPin color="#c1fe00" size={24} />
                    </View>
                    {/* Merchant name label */}
                    <Text style={styles.markerLabelText} numberOfLines={1}>
                      {merchantName}
                    </Text>
                  </View>
                </Marker>
              );
            })}
          </MapView>
        )}
      </View>
    );
  }, [
    mapMerchants,
    isLoadingLocation,
    userLocation,
    t,
    handleMerchantPress,
  ]);

  // Memoize renderFooter to prevent recreation
  const renderFooter = useCallback(() => {
    // Don't show footer if we've reached the last page
    if (currentPage >= totalPages)
      return (
        <View
          style={{
            height: isLiquidGlassSupported
              ? HEADER_HEIGHT
              : HEADER_HEIGHT + bottom,
          }}
        />
      );

    // Only show loading indicator when actually loading more
    if (!isLoadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#c1fe00" />
        <Text style={styles.footerText}>{t("merchants.loadingMerchants")}</Text>
      </View>
    );
  }, [currentPage, totalPages, isLoadingMore, t]);

  // Memoize ListEmptyComponent to prevent recreation
  const renderEmptyList = useCallback(
    () => (
      <EmptyState
        title={t("merchants.noMerchantsFound")}
        description={t("merchants.noMerchantsFoundDescription")}
        icon={<Store color="#666" size={64} />}
      />
    ),
    [t]
  );

  const multiStoryRef = useRef<MultiStoryRef>(null);
  const [userStories, setUserStories] = useState<StoriesType[]>([]);

  // Build MultiStory data from static stories (Remote Config) and boosted merchants
  useEffect(() => {
    // Helper to convert ms to seconds, fallback to 10s
    const msToSec = (ms?: number) => {
      if (!ms || Number.isNaN(ms)) return 10;
      return Math.max(1, Math.round(ms / 1000));
    };

    // Static stories -> single slide per story
    const staticAsStories: StoriesType[] = (staticStories || []).map(
      (s, idx) => ({
        id: idx + 1,
        username: s.title || "NODO.ia",
        profile: s.imageUrl,
        title: s.title || "",
        stories: [
          {
            id: 1,
            url: s.imageUrl,
            type: "image",
            duration: msToSec(s.duration ?? 10000),
            isReadMore: false,
            isSeen: false,
            storyData: null,
          },
        ],
      })
    );

    // Boosted merchants -> one slide per boosted product (fallback to logo if none)
    const boostedAsStories: StoriesType[] = (boostedMerchants || []).map(
      (m: any, idx: number) => ({
        id: staticAsStories.length + idx + 1,
        username: m.merchant.brand_name,
        profile: m.merchant.logo_url ?? m.boostedProducts[0]?.media[0] ?? "",
        title: m.merchant.brand_name,
        stories: m.boostedProducts?.length
          ? m.boostedProducts.map((p: any, pIdx: number) => ({
            id: pIdx + 1,
            url: (p.media && p.media[0]) || m.merchant.logo_url || "",
            type: "image",
            duration: 5,
            isReadMore: false,
            isSeen: false,
            storyData: p,
          }))
          : [
            {
              id: 1,
              url: m.merchant.logo_url || "",
              type: "image",
              duration: 10,
              isReadMore: false,
              isSeen: false,
              storyData: null,
            },
          ],
      })
    );

    setUserStories([...staticAsStories, ...boostedAsStories]);
  }, [staticStories, boostedMerchants]);

  const onStoryClose = (viewedStories?: Array<boolean[]>) => {
    if (!viewedStories || !Array.isArray(viewedStories)) return;

    const stories = [...userStories];
    viewedStories.forEach((storyViews, index) => {
      if (stories[index] && Array.isArray(storyViews)) {
        storyViews.forEach((isViewed, subIndex) => {
          if (stories[index].stories[subIndex]) {
            stories[index].stories[subIndex].isSeen = isViewed;
          }
        });
      }
    });
    setUserStories(stories);
  };

  // Handle add story press
  const handleAddStoryPress = useCallback(() => {
    if (!isLoggedIn) {
      showLoginSheet();
      return;
    }
    navigation.navigate("MyListings");
  }, [navigation, isLoggedIn]);

  return (
    <LinearGradient
      colors={["#0a0a0a", "#0f0f0f", "#0a0a0a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {viewMode === "map" && (
        <View style={styles.mapContainerFullScreen}>
          {renderMapView()}
        </View>
      )}

      <LinearGradient
        colors={["#c1fe0080", "#c1fe00", "#c1fe0080"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ring}
      >
        <View style={styles.storyContainer}>
          {/* Story Circles */}
          {boostedMerchantsLoading ? (
            <View className="h-[100px] flex-row items-center gap-3 px-4">
              {Array.from({ length: 6 }, (_, index) => (
                <SkeletonStoryCircle key={index} />
              ))}
            </View>
          ) : (
            userStories.length > 0 && (
              <MultiStory
                stories={userStories}
                transitionMode={TransitionMode.Cube}
                ref={multiStoryRef}
                onComplete={onStoryClose}
                avatarProps={{
                  viewedStoryContainerStyle: {
                    borderColor: "#fff",
                  },
                  containerStyle: {
                    borderColor: "#c1fe00",
                    width: 66,
                    height: 66,
                    borderWidth: 2,
                  },
                  userNameStyle: {
                    fontSize: 12,
                    color: "#fff",
                    textAlign: "center",
                    fontWeight: "400",
                    width: 70,
                  },
                  userNameProps: {
                    numberOfLines: 1,
                    ellipsizeMode: "tail",
                  },
                }}
                overlayViewPostion={"top"}
                renderOverlayView={(item: StoryType) => <View />}
                ListHeaderComponent={() => (
                  <AddStoryCircle onPress={handleAddStoryPress} />
                )}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  alignItems: "center",
                }}
                storyContainerProps={{
                  renderFooterComponent: ({ userStories, progressIndex }) => (
                    <StoryFooter
                      story={userStories?.stories[progressIndex]}
                      ref={multiStoryRef}
                    />
                  ),
                  imageStyle: {
                    height: screenHeight - top - (IS_IOS ? 0 : bottom),
                    width: "100%",
                  },
                }}
              />
            )
          )}
        </View>
      </LinearGradient>
      <View
        style={[
          styles.toggleButtonContainer,
          viewMode === "list" && styles.toggleButtonContainerList,
        ]}
        pointerEvents="box-none"
      >
        <Animated.View style={{ position: "relative", alignItems: "center" }}>
          <LiquidGlassContainer
            {...liquidGlassProps}
            style={[
              styles.toggleButtonWrapper,
              (IS_ANDROID || !isLiquidGlassSupported) &&
              styles.toggleButtonWrapperAndroid,
              { position: "relative", zIndex: 1 },
            ]}
          >
            {viewMode === "list" && (
              <Animated.View
                style={[
                  {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 30,
                    overflow: "hidden",
                    zIndex: 0,
                  },
                  toggleButtonGlassOpacityStyle,
                ]}
                pointerEvents="none"
              >
                <LiquidGlassContainer
                  effect="regular"
                  interactive={true}
                  style={{ flex: 1 }}
                />
              </Animated.View>
            )}
            <Animated.View
              style={[
                styles.slidingIndicator,
                slideAnimatedStyle,
              ]}
            >
              <LiquidGlassContainer
                {...liquidGlassProps}
                style={[
                  styles.liquidGlassActive,
                  (IS_ANDROID || !isLiquidGlassSupported) &&
                  styles.liquidGlassActiveAndroid,
                ]}
              >
                <LinearGradient
                  colors={[
                    "rgba(255, 255, 255, 0.15)",
                    "rgba(255, 255, 255, 0.08)",
                    "rgba(255, 255, 255, 0.15)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.liquidGlassGradient}
                >
                  <View style={styles.liquidGlassInner} />
                </LinearGradient>
              </LiquidGlassContainer>
            </Animated.View>

            <TouchableOpacity
              onPress={() => setViewMode("list")}
              activeOpacity={0.7}
              style={styles.toggleButtonTouchable}
            >
              <Animated.View
                style={[
                  styles.toggleButton,
                  listAnimatedStyle,
                ]}
              >
                <List
                  size={18}
                  color={viewMode === "list" ? "#fff" : "#666"}
                />
              </Animated.View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setViewMode("map")}
              activeOpacity={0.7}
              style={styles.toggleButtonTouchable}
            >
              <Animated.View
                style={[
                  styles.toggleButton,
                  mapAnimatedStyle,
                ]}
              >
                <MapPin
                  size={18}
                  color={viewMode === "map" ? "#fff" : "#666"}
                />
              </Animated.View>
            </TouchableOpacity>
          </LiquidGlassContainer>
        </Animated.View>
      </View>

      {/* List View */}
      {viewMode === "list" && (
        <>
          {topMerchantLoading && !initialLoadComplete.current ? (
            <SkeletonMerchantGrid itemCount={10} />
          ) : (
            <AnimatedLegendList
              data={categorySections}
              renderItem={renderCategorySection}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sectionsContainer}
              ListHeaderComponent={<View style={styles.listHeaderSpacer} />}
              ListEmptyComponent={renderEmptyList}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor="#c1fe00"
                  colors={["#c1fe00"]}
                  progressBackgroundColor="#1a1a1a"
                />
              }
            />
          )}
        </>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  storyContainer: {
    height: 100,
    backgroundColor: "#0a0a0a",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    zIndex: 5,
    position: "relative",
  },
  ring: {
    height: 104,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    shadowColor: "#c1fe00",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 5,
    position: "relative",
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  sectionsContainer: {
    paddingBottom: 80, // Extra padding to clear tab bar and last element
  },
  listHeaderSpacer: {
    height: 60,
  },
  categorySection: {
    marginTop: 16,
    marginBottom: 10,
  },
  categoryHeader: {
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 17,

    color: "#fff",
  },
  categoryArrow: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginLeft: 4,
  },
  horizontalListContent: {
    paddingHorizontal: 20,
  },
  merchantCardHorizontal: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
    width: 160,
  },
  imageSectionHorizontal: {
    height: 90,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  textSectionHorizontal: {
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 8,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
  },
  customMarker: {
    backgroundColor: "#000",
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: "#c1fe00",
    marginBottom: 4,
  },
  // New merchant card styles matching the image
  merchantCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
  },
  imageSection: {
    height: 90,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  merchantImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2a2a2a",
  },
  soonText: {
    fontSize: 16,
    color: "#888",
    fontWeight: "600",
    textAlign: "center",
  },
  textSection: {
    padding: 12,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
  },
  merchantName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 6,
    textAlign: "center",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  verifiedText: {
    fontSize: 12,
    color: "#c1fe00",
    fontWeight: "500",
    marginLeft: 4,
  },
  productCount: {
    fontSize: 12,
    color: "#888",
    fontWeight: "400",
    textAlign: "center",
  },

  // Footer styles
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  footerText: {
    color: "#888",
    fontSize: 14,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  sortButtonText: {
    color: "#c1fe00",
    fontSize: 16,
    fontWeight: "600",
  },
  // Story circles styles
  storiesContainer: {
    paddingVertical: 12,
    backgroundColor: "#0a0a0a",
  },
  storiesContentContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  storyCircle: {
    alignItems: "center",
    width: 70,
  },
  storyGradient: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 3,
    marginBottom: 4,
  },
  storyInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0a0a0a",
    padding: 2,
    overflow: "hidden",
  },
  storyImage: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
  },
  storyUsername: {
    fontSize: 11,
    color: "#fff",
    textAlign: "center",
    maxWidth: 70,
  },
  tabsScrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  tab: {
    marginRight: 16,
    height: 35,
    justifyContent: "center",
  },
  activeTab: {
    borderBottomWidth: 1,
    borderBottomColor: "#c1fe00",
  },
  tabContent: {
    position: "absolute",
    right: 6,
    top: -8,
  },
  tabText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "500",
  },
  activeTabText: {
    color: "#c1fe00",
    fontWeight: "600",
  },
  mapContainerFullScreen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  mapContainer: {
    flex: 1,
    zIndex: 1,
    position: "relative",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  mapMarkerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  googleMapMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerLabelText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyMapState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#0a0a0a",
  },
  emptyMapText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginTop: 16,
    textAlign: "center",
  },
  emptyMapSubtext: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
    textAlign: "center",
  },
  toggleButtonContainer: {
    position: "absolute",
    top: 104, // After story container (104px height)
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: "center",
  },
  toggleButtonContainerList: {
    // Transparent - liquid glass effect only on buttons
  },
  toggleButtonWrapper: {
    flexDirection: "row",
    borderRadius: 30,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 4,
    overflow: "hidden",
    position: "relative",
  },
  toggleButtonWrapperAndroid: {
    backgroundColor: "rgba(26, 26, 26, 0.6)",
    borderColor: "rgba(255, 255, 255, 0.15)",
    elevation: 4,
  },
  slidingIndicator: {
    position: "absolute",
    top: 4,
    left: 8,
    width: 52,
    height: 40,
    zIndex: 1,
  },
  toggleButtonTouchable: {
    zIndex: 10,
  },
  toggleButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 24,
    width: 52,
    height: 40,
  },
  liquidGlassActive: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    overflow: "hidden",
    shadowColor: "#fff",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  liquidGlassActiveAndroid: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  liquidGlassGradient: {
    flex: 1,
    borderRadius: 23,
    overflow: "hidden",
  },
  liquidGlassInner: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 22,
  },
});

export default HomeScreen;

