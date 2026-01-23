import { AnimatedLegendList } from "@legendapp/list/reanimated";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Calendar,
  Check,
  Fuel,
  Globe,
  Heart,
  Home,
  MapPin,
  Phone,
  Ruler,
  Settings,
  Share,
  ShoppingBag,
  User,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FastImage from "react-native-fast-image";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { SkeletonItem } from "../components/animated/SkeletonLoader";
import ShareModal from "../components/merchants/ShareModal";
import { AnimatedQuantitySelector } from "../components/ui";
import FullScreenImageViewer from "../components/ui/FullScreenImageViewer";
import { NavigationProps } from "../navigation/navigationTypes";
import { trackProductView } from "../services/firebaseAnalyticsService";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import { useMerchantStore } from "../store/merchantStore";
import { formatPrice, HEADER_HEIGHT, screenWidth } from "../utils/constants";
import { LiquidGlassContainer, liquidGlassProps } from "../utils/liquidGlass";
import { openWhatsAppMultipleProducts } from "../utils/whatsapp";

// Image Slider Component
const ImageSlider = ({
  images,
  onImagePress,
}: {
  images: string[];
  onImagePress: (index: number) => void;
}) => {
  const scrollX = useSharedValue(0);
  const imageWidth = screenWidth / 2 - 24; // Account for margins

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  return (
    <View style={styles.sliderContainer}>
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {images.map((imageUrl, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.imageSlide, { width: imageWidth }]}
            activeOpacity={0.9}
            onPress={() => onImagePress(index)}
          >
            <FastImage
              source={{ uri: imageUrl }}
              style={styles.productImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          </TouchableOpacity>
        ))}
      </Animated.ScrollView>

      {/* Pagination Dots */}
      {images.length > 1 && (
        <View style={styles.paginationContainer}>
          {images.map((_, index) => (
            <PaginationDot
              key={index}
              index={index}
              scrollX={scrollX}
              imageWidth={imageWidth}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// Pagination Dot Component
const PaginationDot = ({
  index,
  scrollX,
  imageWidth,
}: {
  index: number;
  scrollX: Animated.SharedValue<number>;
  imageWidth: number;
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * imageWidth,
      index * imageWidth,
      (index + 1) * imageWidth,
    ];

    const progress = scrollX.value;
    let scale = 0.5;
    let opacity = 0.3;

    if (progress >= inputRange[0] && progress <= inputRange[2]) {
      const distance = Math.abs(progress - index * imageWidth);
      scale = 1 - (distance / imageWidth) * 0.5;
      opacity = 1 - (distance / imageWidth) * 0.5;
    }

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return <Animated.View style={[styles.paginationDot, animatedStyle]} />;
};

const MerchantListingsScreen = ({
  navigation,
  route,
}: NavigationProps<"MerchantListings">) => {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  const { merchantId, merchantName, shareUrl, qrCodeUrl } = route.params ?? {};
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<
    Map<string, { item: any; quantity: number }>
  >(new Map());
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [favoritingItems, setFavoritingItems] = useState<Set<string>>(
    new Set()
  );

  const {
    merchantListings,
    merchantScrapped,
    merchantListingsLoading,
    merchantListingsPagination,
    fetchMerchantListings,
    error,
  } = useMerchantStore();

  const { trackProductClick, toggleItemFavorite, isItemFavorited } =
    useChatStore();
  const { isLoggedIn, userProfile } = useAuthStore();
  const initialLoadComplete = useRef(false);
  const scrollY = useSharedValue(0);

  // Combine listings and scrapped products as they come from the API
  const combinedData = [
    ...merchantListings.map((item) => ({ ...item, itemType: "listing" })),
    ...merchantScrapped.map((item) => ({ ...item, itemType: "scrapped" })),
  ];

  const listings = combinedData;
  const loading = merchantListingsLoading;
  const isLoadingMore = loading && listings.length > 0;
  const isInitialLoading = loading && listings.length === 0;

  // Get pagination info from store
  const { currentPage, totalPages, total } = merchantListingsPagination;
  const hasMoreData = currentPage < totalPages;

  const { top } = useSafeAreaInsets();

  useEffect(() => {
    if (merchantId) {
      initialLoadComplete.current = false;

      const { clearMerchantListings } = useMerchantStore.getState();
      clearMerchantListings();

      fetchMerchantListings(merchantId, 1, false)
        .then(() => {
          initialLoadComplete.current = true;
        })
        .catch((error) => {
          console.log(error);
          initialLoadComplete.current = true;
        });
    }
    return () => {
      const { clearMerchantListings } = useMerchantStore.getState();
      clearMerchantListings();
    };
  }, [merchantId, fetchMerchantListings]);

  const loadMoreListings = async () => {
    if (
      isLoadingMore ||
      !hasMoreData ||
      !merchantId ||
      isInitialLoading ||
      !initialLoadComplete.current ||
      listings.length === 0
    ) {
      return;
    }

    const nextPage = currentPage + 1;

    try {
      await fetchMerchantListings(merchantId, nextPage, true);
    } catch (error) {
      console.error("Error loading more listings:", error);
    }
  };
  const handleSharePress = () => {
    setShowShareModal(true);
  };

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = event.nativeEvent;
      scrollY.value = contentOffset.y;
    },
    [scrollY]
  );

  // Header title opacity - fades out when scrolling
  const headerTitleOpacityStyle = useAnimatedStyle(() => {
    "worklet";
    const opacity = interpolate(
      scrollY.value,
      [0, 50], // Fade out between 0-50px scroll
      [1, 0], // From fully visible to invisible
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  });

  // Normalize item ID - handle both hid and id
  const getItemId = (item: any): string => {
    return item?.hid ?? item?.id ?? "";
  };

  const handleQuantityChange = (item: any, newQuantity: number) => {
    const itemId = getItemId(item);

    setSelectedItems((prev) => {
      const newMap = new Map(prev);

      if (newQuantity === 0) {
        newMap.delete(itemId);
      } else {
        newMap.set(itemId, { item, quantity: newQuantity });
      }

      return newMap;
    });
  };

  const handleToggleItem = (item: any) => {
    // Track analytics for toggle action (selection for listings, external link for scraped)
    const itemId = getItemId(item);
    const isListing = item.itemType === "listing";
    const category = item.category ?? "products";

    trackProductClick({
      productId: itemId,
      productType: isListing ? 1 : 2,
      category: category,
      productOwnerId: isListing
        ? (item.user_id ?? item.owner_id ?? null)
        : null,
    });

    if (item.itemType !== "listing") {
      navigation.navigate("WebView", { url: item.detail_url });
    }
  };

  const handleCardClick = (item: any) => {
    // Track product click analytics
    const itemId = getItemId(item);
    const isListing = item.itemType === "listing";
    const category = item.category ?? "products";

    trackProductClick({
      productId: itemId,
      productType: isListing ? 1 : 2, // 1 for listings, 2 for scraped products
      category: category,
      productOwnerId: isListing
        ? (item.user_id ?? item.owner_id ?? null)
        : null,
    });

    // Track Firebase Analytics product view
    if (userProfile?.id) {
      trackProductView(userProfile.id, itemId, merchantId);
    }
    navigation.navigate(
      isListing ? "ProductListingDetails" : "ProductScrappedDetails",
      { item }
    );
  };

  const handleContactPress = () => {
    // Get merchant's phone (assume all items are from same merchant)
    const firstItem = Array.from(selectedItems.values())[0]?.item;
    const phoneNumber = firstItem?.phone_number ?? "";

    const products = Array.from(selectedItems.values()).map(
      ({ item, quantity }) => ({
        title: getTitle(item),
        price: getPrice(item) ?? undefined,
        priceCurrency: getPriceCurrency(item),
        quantity,
      })
    );

    openWhatsAppMultipleProducts({
      phoneNumber,
      products,
    });

    // Clear selection after contact
    setSelectedItems(new Map());
  };

  // Normalize location data
  const sanitizeLocation = (location: any) => {
    if (!location) return "";
    if (typeof location === "object" && location.display_name)
      return location.display_name;
    if (typeof location === "string") return location;
    return "";
  };

  // Normalize price data
  const getPrice = (item: any): number | null => {
    if (item.price?.amount) return item.price.amount;
    if (typeof item.price === "number") return item.price;
    if (typeof item.price === "string") return parseFloat(item.price);
    return null;
  };

  const getPriceCurrency = (item: any): string =>
    item.price?.currency ??
    item.price_currency ??
    item.attributes?.price_currency ??
    (item.itemType === "listing" ? "DOP" : "USD");

  // Normalize images data
  const getImages = (item: any): string[] => {
    const images = item.media ?? item.images_url ?? item.images ?? [];
    if (Array.isArray(images)) {
      // Deduplicate images
      return Array.from(new Set(images.filter(Boolean)));
    }
    return [];
  };

  // Get normalized title
  const getTitle = (item: any): string => {
    if (item.title) return item.title;
    // For vehicles without title, construct one
    if (item.brand || item.model) {
      const parts = [item.brand, item.model].filter(Boolean);
      return parts.join(" ");
    }
    return "Untitled";
  };

  // Handle image press
  const handleImagePress = (images: string[], index: number) => {
    setSelectedImages(images);
    setSelectedImageIndex(index);
    setImageViewerVisible(true);
  };

  // Handle favorite press
  const handleFavoritePress = async (item: any) => {
    if (!isLoggedIn) return;

    const itemId = getItemId(item);
    if (favoritingItems.has(itemId)) return;

    setFavoritingItems((prev) => new Set(prev).add(itemId));

    try {
      const isListing = item.itemType === "listing";
      const category = item.category ?? "products";
      const type = isListing ? 1 : 2; // 1 for listings, 2 for scraped products

      await toggleItemFavorite(itemId, category, type);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setFavoritingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const renderListing = ({ item }: { item: any }) => {
    const images = getImages(item);
    const price = getPrice(item);
    const priceCurrency = getPriceCurrency(item);
    const title = getTitle(item);

    // Determine item type
    const isProduct =
      !!item.category ||
      (!!item.attributes && !item.brand && !item.property_type);
    const isVehicle =
      !!item.brand || !!item.model || !!item.year || !!item.fuel_type;
    const isRealEstate =
      !!item.property_type || !!item.bedrooms || !!item?.listing_type;

    // Build specifications array
    const specs = [];
    if (isVehicle) {
      if (item.year) specs.push({ icon: Calendar, value: String(item.year) });
      if (item.fuel_type) specs.push({ icon: Fuel, value: item.fuel_type });
      if (item.transmission)
        specs.push({ icon: Settings, value: item.transmission });
      if (item.passengers)
        specs.push({
          icon: User,
          value: `${item.passengers} ${t("map.seats")}`,
        });
      // Show condition for vehicles
      if (item.condition && item.condition !== "new")
        specs.push({ icon: Settings, value: item.condition });
    } else if (isRealEstate) {
      // Handle both direct fields and features object
      const bedrooms = item.bedrooms ?? item.features?.bedrooms;
      const bathrooms = item.bathrooms ?? item.features?.bathrooms;
      const area = item.area ?? item.features?.area;

      if (bedrooms)
        specs.push({
          icon: BedDouble,
          value: `${parseFloat(String(bedrooms))} ${t("map.beds")}`,
        });
      if (bathrooms)
        specs.push({
          icon: Bath,
          value: `${parseFloat(String(bathrooms))} ${t("map.baths")}`,
        });
      if (area)
        specs.push({ icon: Ruler, value: `${parseFloat(String(area))} m²` });
      if (item.listing_type)
        specs.push({ icon: Home, value: item.listing_type });
    } else if (isProduct) {
      if (item.category)
        specs.push({ icon: ShoppingBag, value: item.category });
      // Show brand for products
      if (item.attributes?.brand)
        specs.push({ icon: ShoppingBag, value: item.attributes.brand });
    }

    const handleToggle = () => {
      handleToggleItem(item);
    };

    return (
      <Pressable
        style={styles.productCard}
        onPress={() => handleCardClick(item)}
      >
        {/* Image Container with Heart */}
        <View style={styles.imageWrapper}>
          {images.length > 0 ? (
            <ImageSlider
              images={images}
              onImagePress={(index) => handleImagePress(images, index)}
            />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}

          {/* Status Badges - Top Left */}
          <View style={styles.imageBadgesContainer}>
            {item.boost > 0 ? (
              <View style={styles.imageStatusBadge}>
                <Text style={styles.statusBadgeText}>
                  {t("listingCards.boosted")}
                </Text>
              </View>
            ) : null}
            {item.is_verified ? (
              <View style={[styles.imageStatusBadge, styles.verifiedBadge]}>
                <Check size={10} color="#000" />
                <Text style={styles.statusBadgeText}>
                  {t("listingCards.verified")}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Heart icon for favorites - Top Right */}
          {item.itemType === "listing" || item?.detail_url ? (
            <TouchableOpacity
              style={styles.heartButton}
              onPress={() => handleFavoritePress(item)}
              disabled={!isLoggedIn || favoritingItems.has(getItemId(item))}
            >
              {favoritingItems.has(getItemId(item)) ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Heart
                  size={22}
                  color={"#000"}
                  fill={isItemFavorited(getItemId(item)) ? "#000" : "#00000000"}
                  strokeWidth={2}
                />
              )}
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          {/* Price */}
          {price ? (
            <Text style={styles.productPrice}>
              {formatPrice(price, priceCurrency)}
            </Text>
          ) : null}

          {/* Title */}
          <Text style={styles.productTitle} numberOfLines={3}>
            {title}
          </Text>

          {/* Location */}
          {item?.location ? (
            <View style={styles.productLocation}>
              <MapPin size={12} color="#74767C" />
              <Text style={styles.productLocationText} numberOfLines={1}>
                {sanitizeLocation(item.location)}
              </Text>
            </View>
          ) : null}

          {/* Specifications */}
          {specs.length > 0 ? (
            <View style={styles.specsContainer}>
              {specs.slice(0, 4).map((spec, idx) => {
                const IconComponent = spec.icon;
                return (
                  <View key={idx} style={styles.specChip}>
                    <IconComponent size={10} color="#c1fe00" />
                    <Text style={styles.specChipText}>{spec.value}</Text>
                  </View>
                );
              })}
              {specs.length > 4 && (
                <Text style={styles.moreSpecsText}>
                  +{specs.length - 4} {t("listingCards.more")}
                </Text>
              )}
            </View>
          ) : null}
        </View>

        {/* Quantity Selector or FAB */}
        <View style={styles.fabContainer}>
          {item.itemType === "listing" ? (
            <AnimatedQuantitySelector
              key={item.id}
              quantity={selectedItems.get(getItemId(item))?.quantity ?? 0}
              onQuantityChange={(quantity) =>
                handleQuantityChange(item, quantity)
              }
              inactiveColor="#c1fe00"
            />
          ) : (
            <TouchableOpacity
              onPress={handleToggle}
              activeOpacity={0.8}
              style={styles.fabContainerButton}
            >
              <Animated.View style={styles.fab}>
                <Globe size={22} color="#fff" strokeWidth={2.5} />
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>
      </Pressable>
    );
  };

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#c1fe00" />
          <Text style={styles.footerText}>
            {t("merchants.loadingListings")}
          </Text>
        </View>
      );
    }

    if (error && listings.length === 0) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    return null;
  };

  const renderSkeletonCard = () => (
    <View style={styles.productCard}>
      {/* Image skeleton */}
      <View style={styles.imageWrapper}>
        <View style={styles.heartContainer}>
          <SkeletonItem
            width={36}
            height={36}
            borderRadius={18}
            className="bg-gray-300"
          />
        </View>
        <SkeletonItem
          width="100%"
          height={200}
          borderRadius={0}
          className="bg-gray-300"
        />
      </View>

      {/* Info skeleton */}
      <View style={styles.productInfo}>
        {/* Price skeleton */}
        <SkeletonItem
          width="40%"
          height={20}
          borderRadius={4}
          className="bg-gray-300"
        />
        {/* Title skeleton - 3 lines */}
        <View style={{ marginTop: 8 }}>
          <SkeletonItem
            width="90%"
            height={14}
            borderRadius={4}
            className="bg-gray-300"
          />
        </View>
        <View style={{ marginTop: 4 }}>
          <SkeletonItem
            width="85%"
            height={14}
            borderRadius={4}
            className="bg-gray-300"
          />
        </View>
        <View style={{ marginTop: 4 }}>
          <SkeletonItem
            width="60%"
            height={14}
            borderRadius={4}
            className="bg-gray-300"
          />
        </View>
        {/* Location skeleton */}
        <View
          style={{ marginTop: 8, flexDirection: "row", alignItems: "center" }}
        >
          <SkeletonItem
            width={12}
            height={12}
            borderRadius={2}
            className="bg-gray-300"
          />
          <View style={{ marginLeft: 4, flex: 1 }}>
            <SkeletonItem
              width="70%"
              height={11}
              borderRadius={4}
              className="bg-gray-300"
            />
          </View>
        </View>
        {/* Specs skeleton */}
        <View style={{ marginTop: 8, flexDirection: "row", gap: 6 }}>
          <SkeletonItem
            width={60}
            height={24}
            borderRadius={12}
            className="bg-gray-300"
          />
          <SkeletonItem
            width={70}
            height={24}
            borderRadius={12}
            className="bg-gray-300"
          />
        </View>
      </View>

      {/* FAB skeleton */}
      <View style={styles.fabContainer}>
        <SkeletonItem
          width={36}
          height={36}
          borderRadius={18}
          className="bg-gray-300"
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      <View style={[styles.header, { top: top }]}>
        <LiquidGlassContainer
          {...liquidGlassProps}
          style={styles.backButtonContainer}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={navigation.goBack}
          >
            <ArrowLeft color="#ffffff" size={24} />
          </TouchableOpacity>
        </LiquidGlassContainer>
        <View style={styles.headerContent}>
          <Animated.Text style={[styles.headerTitle, headerTitleOpacityStyle]}>
            {merchantName ?? "Merchant"}
          </Animated.Text>
          <Animated.Text
            style={[styles.headerSubtitle, headerTitleOpacityStyle]}
          >
            {isInitialLoading
              ? t("merchants.loadingListings")
              : `${t("seeMore.showing")} ${listings.length} ${t(
                  "seeMore.of"
                )} ${total ?? 0} ${t("merchants.listings")}`}
          </Animated.Text>
        </View>
        <LiquidGlassContainer
          {...liquidGlassProps}
          style={styles.backButtonContainer}
        >
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleSharePress}
          >
            <Share color="#ffffff" size={22} />
          </TouchableOpacity>
        </LiquidGlassContainer>
      </View>
      {isInitialLoading ? (
        <ScrollView
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <View key={index}>{renderSkeletonCard()}</View>
          ))}
        </ScrollView>
      ) : (
        <AnimatedLegendList
          data={listings}
          renderItem={renderListing}
          keyExtractor={(item) => getItemId(item)}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreListings}
          onEndReachedThreshold={0.6}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t("merchants.noListings")}</Text>
            </View>
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
      )}

      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        merchantId={merchantId ?? ""}
        merchantName={merchantName ?? "Merchant"}
        shareUrl={shareUrl}
        qrCodeUrl={qrCodeUrl}
      />

      <FullScreenImageViewer
        visible={imageViewerVisible}
        images={selectedImages}
        initialIndex={selectedImageIndex}
        onClose={() => setImageViewerVisible(false)}
      />

      {/* Bottom Contact Bar */}
      {selectedItems.size > 0 ? (
        <View style={[styles.bottomBar, { paddingBottom: bottom + 8 }]}>
          <View style={styles.bottomBarContent}>
            <View className="flex-1">
              <Text style={styles.bottomBarCount} numberOfLines={1}>
                {selectedItems.size}{" "}
                {selectedItems.size === 1
                  ? t("merchants.item")
                  : t("merchants.items")}{" "}
                {t("merchants.selected")}
              </Text>
              <Text style={styles.bottomBarSubtext}>
                {Array.from(selectedItems.values()).reduce(
                  (sum, { quantity }) => sum + quantity,
                  0
                )}{" "}
                {t("merchants.totalUnits")}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleContactPress}
            >
              <Phone size={18} color="#000" style={{ marginRight: 6 }} />
              <Text style={styles.contactButtonText}>
                {t("merchants.contact")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    //borderBottomWidth: 1,
    //borderBottomColor: "#1a1a1a",
    backgroundColor: "transparent",
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  backButtonContainer: {
    borderRadius: 24,
    overflow: "hidden",
  },
  backButton: {
    padding: 12,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  shareButton: {
    padding: 12,
  },
  listContainer: {
    marginTop: HEADER_HEIGHT,
    paddingHorizontal: 4,
    paddingBottom: 110,
  },
  listingContainer: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#888",
    fontSize: 16,
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
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    color: "#888",
    fontSize: 14,
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    textAlign: "center",
  },
  // Walmart-style vertical card
  productCard: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    marginHorizontal: 6,
    marginBottom: 16,
    overflow: "hidden",
    flex: 1,
    flexDirection: "row",
  },
  imageWrapper: {
    position: "relative",
    flex: 1,
    aspectRatio: 1,
    height: 200,
  },
  sliderContainer: {
    width: screenWidth / 2 - 24,
    height: "100%",
  },
  scrollView: {
    flex: 1,
  },
  imageSlide: {
    height: 200,
  },
  paginationContainer: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#c1fe00",
  },
  productImage: {
    width: screenWidth / 2 - 12,
    height: "100%",
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#fff",
    fontSize: 12,
  },
  heartButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff90",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  imageBadgesContainer: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "column",
    gap: 6,
    zIndex: 10,
  },
  imageStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(193, 254, 0, 0.95)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  productInfo: {
    paddingHorizontal: 12,
    justifyContent: "flex-start",
    flex: 1,
    gap: 6,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  productTitle: {
    fontSize: 14,
    color: "#fff",
    lineHeight: 20,
    fontWeight: "500",
  },
  productLocation: {
    flexDirection: "row",
    alignItems: "center",
  },
  productLocationText: {
    fontSize: 11,
    color: "#fff",
    marginLeft: 4,
    flex: 1,
  },
  // Specifications
  specsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  specChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(193, 254, 0, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    borderWidth: 0.5,
    borderColor: "rgba(193, 254, 0, 0.2)",
  },
  specChipText: {
    fontSize: 11,
    color: "#c1fe00",
    fontWeight: "600",
  },
  // FAB styles
  heartContainer: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
  },
  fabContainer: {
    position: "absolute",
    bottom: 0,
    right: 12,
    zIndex: 10,
  },
  fabContainerButton: {
    width: "100%",
    height: "100%",
  },
  fab: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#ffffff50",
  },
  fabSelected: {
    backgroundColor: "#fff",
  },
  // Bottom contact bar
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#1a1a1a",
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
    paddingBottom: 20,
  },
  bottomBarContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  bottomBarCount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 2,
  },
  bottomBarSubtext: {
    fontSize: 12,
    color: "#888",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#c1fe00",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  // Skeleton styles
  skeletonCard: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  skeletonImage: {
    backgroundColor: "#2a2a2a",
    flex: 1,
  },
  skeletonInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  skeletonTitle: {
    width: "80%",
    height: 16,
    backgroundColor: "#2a2a2a",
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonPrice: {
    width: "40%",
    height: 20,
    backgroundColor: "#2a2a2a",
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonLocation: {
    width: "60%",
    height: 12,
    backgroundColor: "#2a2a2a",
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonDescription: {
    width: "90%",
    height: 14,
    backgroundColor: "#2a2a2a",
    borderRadius: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  modalContainer: {
    flex: 1,
    marginTop: 80,
    backgroundColor: "#0a0a0a",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 0,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: 12,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 20,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginBottom: 20,
  },
  gridImage: {
    width: 160,
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoSection: {
    marginBottom: 20,
  },
  detailTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
    lineHeight: 28,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailPriceText: {
    color: "#c1fe00",
    fontSize: 18,
    fontWeight: "700",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  locationText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 6,
    flex: 1,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  phoneText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
    color: "#c1fe00",
  },
  description: {
    color: "#ccc",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  attributesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    color: "#c1fe00",
  },
  attributesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  attributeChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(193, 254, 0, 0.4)",
  },
  chipIcon: {
    marginRight: 6,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
    color: "#c1fe00",
  },
  chipValue: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  featuresSection: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  featureIcon: {
    marginRight: 8,
  },
  featureText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  externalLinkSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  externalLinkButton: {
    backgroundColor: "#c1fe00",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  externalLinkText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
  // New styles for enhanced cards
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(193, 254, 0, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: "rgba(193, 254, 0, 0.2)",
    gap: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
    color: "#c1fe00",
  },
  priceTag: {
    backgroundColor: "rgba(193,254,0,0.15)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: "rgba(193,254,0,0.25)",
  },
  descriptionPreview: {
    color: "#ccc",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 6,
  },
  moreSpecsText: {
    fontSize: 10,
    fontWeight: "600",
    fontStyle: "italic",
    color: "#c1fe00",
  },
  badgesRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#c1fe00",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  verifiedBadge: {
    backgroundColor: "#c1fe00",
  },
  statusBadgeText: {
    color: "#000",
    fontSize: 9,
    fontWeight: "600",
  },
});

export default MerchantListingsScreen;
