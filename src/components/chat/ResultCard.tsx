import { useNavigation } from "@react-navigation/native";
import {
  Bath,
  BedDouble,
  Calendar,
  Car,
  DollarSign,
  Fuel,
  Globe,
  Heart,
  Home,
  Info,
  MapPin,
  Ruler,
  ShoppingBag,
  User,
} from "lucide-react-native";
import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import FastImage from "react-native-fast-image";
import Animated from "react-native-reanimated";
import { UseNavigationProps } from "../../navigation/navigationTypes";
import { trackProductView } from "../../services/firebaseAnalyticsService";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";
import { formatPrice, screenWidth } from "../../utils/constants";
import { FullScreenImageViewer } from "../ui";

const getFallbackImage = (t: any) =>
  `https://placehold.co/600x400?text=${encodeURIComponent(
    t("listingCards.noImage")
  )}`;

// Utility to sanitize location string
function sanitizeLocation(location: any): string {
  if (!location) return "";
  if (
    typeof location === "object" &&
    (location?.display_name?.split(",").length > 1 || location?.country)
  ) {
    if (location.display_name)
      return location.display_name.split(",").slice(0, 4).join(", ");
    if (location.city && location.country)
      return `${location.city}, ${location.country}`;
    if (location.city) return location.city;
    if (location.country) return location.country;
    if (
      location.coordinates &&
      location.coordinates.lat &&
      location.coordinates.lng
    ) {
      return `${location.coordinates.lat}, ${location.coordinates.lng}`;
    }
    return "";
  }
  if (typeof location === "string") {
    // Remove repeated commas, extra spaces, and trim
    return location
      .replace(/,+/g, ",") // collapse multiple commas
      .replace(/\s*,\s*/g, ", ") // remove spaces around commas
      .replace(/\s+/g, " ") // collapse multiple spaces
      .replace(/^,|,$/g, "") // remove leading/trailing commas
      .trim();
  }
  return "";
}

// Utility to get a short location (first 2-3 words or up to first comma)
function getShortLocation(location: any): string {
  if (!location) return "";
  if (typeof location === "object" && (location.city || location.country)) {
    // Prefer city, then country, else coordinates
    if (location.city && location.country)
      return `${location.city}, ${location.country}`;
    if (location.city) return location.city;
    if (location.country) return location.country;
    if (
      location.coordinates &&
      location.coordinates.lat &&
      location.coordinates.lng
    ) {
      return `${location.coordinates.lat}, ${location.coordinates.lng}`;
    }
    return "";
  }
  if (typeof location === "string") {
    const commaIdx = location.indexOf(",");
    if (commaIdx !== -1) return location.slice(0, commaIdx).trim();
    return location.split(" ").slice(0, 3).join(" ");
  }
  return "";
}

type ResultCardProps = {
  item: any;
  style?: ViewStyle;
  categoryy?: string;
  shouldLogAnalytic?: boolean;
};

function ResultCard({
  item,
  style,
  categoryy,
  shouldLogAnalytic = false,
}: ResultCardProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<UseNavigationProps<"MainApp">>();

  // Determine type
  const isProduct =
    categoryy === "products" || (!!item.title && item.category === "products");
  const isVehicle =
    categoryy === "vehicles" ||
    (!!item.brand && !!item.model && item.category === "vehicles");
  const isRealEstate =
    categoryy === "real_estate" ||
    !!item.property_type ||
    item.category === "real_estate";

  // Use correct keys for each type
  const hid = item.hid || item.id;
  const title = item.title || (isVehicle ? `${item.brand} ${item.model}` : "");
  const images = item.images_url || item.media || [];
  const category =
    categoryy ??
    item.category ??
    (isVehicle ? "vehicles" : isRealEstate ? "real_estate" : "products");

  // Optimize image processing to prevent memory issues
  const imagesUrls = useMemo(() => {
    const fallbackImage = getFallbackImage(t);
    if (!images) return [fallbackImage];
    if (Array.isArray(images)) {
      // Filter and limit to 3 images
      const filtered = images
        .map((url: string) => url && url.trim())
        .filter((url: string) => url && /^https?:\/\//.test(url))
        .slice(0, 3);
      return filtered.length > 0 ? filtered : [fallbackImage];
    }
    // If it's a string, fallback to old logic
    try {
      const imageUrls = images
        .split(",")
        .map((url: string) => url.trim())
        .filter((url: string) => url && /^https?:\/\//.test(url))
        .slice(0, 3);
      return imageUrls.length > 0 ? imageUrls : [fallbackImage];
    } catch (error) {
      return [fallbackImage];
    }
  }, [images, t]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { toggleItemFavorite, isItemFavorited, trackProductClick } =
    useChatStore();
  const { userProfile } = useAuthStore();
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const tagWidths = useRef<number[]>([]);

  // Ensure specData only contains serializable data, and all hooks are top-level
  const specData = useMemo(() => {
    let arr: { icon: string; value: string | number }[] = [];
    if (isProduct) {
      if (item.availability)
        arr.push({ icon: "ShoppingBag", value: item.availability });
      if (item.category) arr.push({ icon: "Info", value: item.category });
    } else if (isVehicle) {
      if (item.year) arr.push({ icon: "Calendar", value: item.year });
      if (item.fuel_type) arr.push({ icon: "Fuel", value: item.fuel_type });
      if (item.transmission)
        arr.push({ icon: "Settings", value: item.transmission });
      if (item.passengers) arr.push({ icon: "User", value: item.passengers });
    } else if (isRealEstate) {
      if (item.bedrooms) arr.push({ icon: "BedDouble", value: item.bedrooms });
      if (item.bathrooms) arr.push({ icon: "Bath", value: item.bathrooms });
      if (item.area) arr.push({ icon: "Ruler", value: item.area });
      if (item.listing_type)
        arr.push({ icon: "Home", value: item.listing_type });
    }
    return arr;
  }, [item, isProduct, isVehicle, isRealEstate]);

  // Reset when specData changes
  React.useEffect(() => {
    tagWidths.current = [];
    setVisibleCount(null);
  }, [specData.length]);

  // Calculate how many tags fit
  const calculateVisibleCount = useCallback(() => {
    if (containerWidth === 0 || specData.length === 0) return null;

    const gap = 8;
    const moreTagWidth = 70; // Estimated width for "+X more"
    let totalWidth = 0;
    let count = 0;

    for (let i = 0; i < specData.length; i++) {
      const tagWidth = tagWidths.current[i] || 60; // Default estimate
      const remaining = specData.length - (i + 1);
      const needsMore = remaining > 0;

      const currentWidth = tagWidth + (count > 0 ? gap : 0);
      const moreWidth = needsMore ? moreTagWidth + gap : 0;

      if (totalWidth + currentWidth + moreWidth <= containerWidth) {
        totalWidth += currentWidth;
        count++;
      } else {
        break;
      }
    }

    return count > 0 ? count : null;
  }, [containerWidth, specData.length]);

  const handleContainerLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0) setContainerWidth(width);
  }, []);

  const handleTagLayout = useCallback(
    (index: number) => {
      return (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        if (width > 0) {
          tagWidths.current[index] = width;
          // Recalculate when we have all measurements
          setTimeout(() => {
            if (
              tagWidths.current.filter((w) => w > 0).length === specData.length
            ) {
              const count = calculateVisibleCount();
              if (count !== null && count !== visibleCount) {
                setVisibleCount(count);
              }
            }
          }, 50);
        }
      };
    },
    [specData.length, calculateVisibleCount, visibleCount]
  );

  React.useEffect(() => {
    if (
      containerWidth > 0 &&
      tagWidths.current.filter((w) => w > 0).length === specData.length
    ) {
      const count = calculateVisibleCount();
      if (count !== null && count !== visibleCount) {
        setVisibleCount(count);
      }
    }
  }, [containerWidth, specData.length, calculateVisibleCount, visibleCount]);

  const openImageViewer = (index: number) => {
    setSelectedImageIndex(index);
    setIsViewerVisible(true);
  };
  const closeImageViewer = () => {
    setIsViewerVisible(false);
  };

  const logAnalytics = useCallback(() => {
    // Track product view event
    if (userProfile?.id) {
      trackProductView(userProfile.id, hid);
    }
    if (shouldLogAnalytic) {
      trackProductClick({
        productId: hid,
        productType: 2, // Scraped product
        category: category,
        productOwnerId: null, // Scraped products don't have owners
      });
    }
  }, [shouldLogAnalytic, hid, category, trackProductClick, userProfile]);

  const renderImage = useCallback(
    ({ item: imgUrl, index }: { item: string; index: number }) => {
      return (
        <TouchableOpacity
          onPress={() => {
            openImageViewer(index);
          }}
          style={styles.pressableContainer}
        >
          <FastImage
            source={{ uri: imgUrl }}
            style={styles.image}
            resizeMode={FastImage.resizeMode.cover}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
          />
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#c1fe00" />
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [loading]
  );

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }, []);

  const handleFavoritePress = useCallback(async () => {
    if (isFavoriting) return;
    setIsFavoriting(true);
    try {
      await toggleItemFavorite(hid, category, 2);
    } catch (error) {
    } finally {
      setIsFavoriting(false);
    }
  }, [isFavoriting, hid, category, toggleItemFavorite]);

  // Main card image with floating icons
  const renderCardImageWithIcons = () => (
    <View className="relative">
      <Animated.FlatList
        ref={flatListRef}
        data={imagesUrls}
        renderItem={renderImage}
        keyExtractor={(_: string, idx: number) => idx.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        style={styles.flatListContainer}
      />
      <View className="absolute right-3 top-3 z-20 flex-row gap-2">
        <TouchableOpacity
          className="mr-1 rounded-full bg-black/70 p-2"
          onPress={handleFavoritePress}
          disabled={isFavoriting}
        >
          {isFavoriting ? (
            <ActivityIndicator size="small" color="#c1fe00" />
          ) : (
            <Heart
              size={22}
              color="#c1fe00"
              fill={isItemFavorited(hid) ? "#c1fe00" : "none"}
              strokeWidth={isItemFavorited(hid) ? 0 : 2}
              className={isItemFavorited(hid) ? "opacity-100" : "opacity-60"}
            />
          )}
        </TouchableOpacity>
        {(item.detail_url || item?.details_url) && (
          <TouchableOpacity
            className="rounded-full bg-black/70 p-2"
            onPress={() => {
              logAnalytics();
              navigation.navigate("WebView", {
                url: item.detail_url,
              });
            }}
          >
            <Globe size={22} color="#c1fe00" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const iconMap: Record<string, any> = {
    BedDouble,
    Bath,
    Ruler,
    Home,
    DollarSign,
    Calendar,
    Car,
    MapPin,
    Fuel,
    User,
    ShoppingBag,
    Info,
  };

  return (
    <View style={[styles.card, style]}>
      {/* Property tags with emojis */}
      <View style={[styles.sliderContainer, style && { width: "100%" }]}>
        {renderCardImageWithIcons()}
        <View style={styles.dotsContainer}>
          {imagesUrls.map((_: string, idx: number) => (
            <View
              key={idx}
              style={[styles.dot, activeIndex === idx && styles.activeDot]}
            />
          ))}
        </View>
      </View>

      <TouchableOpacity
        onPress={() => {
          logAnalytics();
          navigation.navigate("ProductScrappedDetails", { item });
        }}
        style={styles.info}
      >
        {/* Enhanced header with better layout */}
        <View style={styles.headerRow}>
          <View style={styles.categoryContainer}>
            {category === "vehicles" ? (
              <View style={styles.categoryIcon}>
                <Car size={18} color={"#c1fe00"} />
              </View>
            ) : category === "real_estate" ? (
              <View style={styles.categoryIcon}>
                <Home size={18} color={"#c1fe00"} />
              </View>
            ) : (
              <View style={styles.categoryIcon}>
                <ShoppingBag size={18} color={"#c1fe00"} />
              </View>
            )}
            <Text style={styles.categoryText}>
              {category
                .split("_")
                .map(
                  (word: string) => word.charAt(0).toUpperCase() + word.slice(1)
                )
                .join(" ")}
            </Text>
          </View>

          {/* Price tag */}
          {item?.price ? (
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>
                {formatPrice(item.price, item?.price_currency) || "N/A"}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Enhanced title with better typography */}
        <Text style={styles.titleText} numberOfLines={1}>
          {title}
        </Text>

        {/* Location info if available */}
        {item.location && (
          <View style={styles.locationContainer}>
            <MapPin size={14} color="#888" />
            <Text style={styles.locationText} numberOfLines={1}>
              {sanitizeLocation(item.location)}
            </Text>
          </View>
        )}

        {/* Enhanced spec tags with better layout - showing only tags that fit in one line */}
        <View style={styles.specsContainer} onLayout={handleContainerLayout}>
          {specData.map((spec, idx) => {
            const shouldShow = visibleCount === null || idx < visibleCount;
            const IconComponent = iconMap[spec.icon];
            return (
              <View
                key={idx}
                style={[
                  styles.specTag,
                  !shouldShow && {
                    position: "absolute",
                    opacity: 0,
                    pointerEvents: "none",
                  },
                ]}
                onLayout={handleTagLayout(idx)}
              >
                {IconComponent ? (
                  <IconComponent size={12} color="#c1fe00" />
                ) : null}
                {typeof spec.value === "string" ||
                typeof spec.value === "number" ? (
                  <Text style={styles.specText}>{spec.value}</Text>
                ) : (
                  spec.value
                )}
              </View>
            );
          })}
          {visibleCount !== null && specData.length > visibleCount && (
            <View style={styles.specTag}>
              <Text style={styles.specText}>
                +{specData.length - visibleCount} {t("common.more") || "more"}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      <FullScreenImageViewer
        visible={isViewerVisible}
        images={images}
        initialIndex={selectedImageIndex}
        onClose={closeImageViewer}
        backgroundColor="rgba(0, 0, 0, 0.95)"
      />
    </View>
  );
}

export default memo(ResultCard);

const CARD_WIDTH = screenWidth - 20;
const IMAGE_HEIGHT = 175;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(20,20,20,0.98)",
    borderRadius: 24,
    marginVertical: 8,
    marginHorizontal: 10,
    padding: 0,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    overflow: "hidden",
  },
  sliderContainer: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
    backgroundColor: "#222",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    position: "relative",
  },

  image: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 15,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.6)",
    marginHorizontal: 4,
    opacity: 0.8,
  },
  activeDot: {
    backgroundColor: "#c1fe00",
    opacity: 1,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  info: {
    padding: 12,
    backgroundColor: "rgba(20,20,20,0.98)",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
    color: "#c1fe00",
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(193,254,0,0.15)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: "#c1fe00",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  priceText: {
    color: "#c1fe00",
    fontSize: 15,
    fontWeight: "700",
  },
  titleText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  locationText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 6,
    flex: 1,
  },
  specsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  specTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(193,254,0,0.1)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  specText: {
    color: "#c1fe00",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },

  skeletonImage: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#222",
  },
  skeletonIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#444",
  },
  skeletonCategory: {
    width: 100,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#444",
  },
  skeletonTitle: {
    width: 200,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#444",
    marginVertical: 4,
  },
  skeletonPrice: {
    width: 80,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#444",
  },
  skeletonTag: {
    width: 100,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#444",
  },

  // Modal Styles
  modalHeader: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(193,254,0,0.1)",
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#444",
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(193,254,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(193,254,0,0.2)",
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    paddingBottom: 40,
  },
  imageSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: "#888",
    fontSize: 14,
    fontWeight: "500",
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  imageGridItem: {
    width: (screenWidth - 72) / 2,
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(193,254,0,0.2)",
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  imageNumber: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  infoSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  infoCard: {
    backgroundColor: "rgba(193,254,0,0.05)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(193,254,0,0.15)",
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  infoCategory: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoCategoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#c1fe00",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#c1fe00",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  infoCategoryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  infoTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  infoLocation: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  infoLocationText: {
    color: "#888",
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 8,
    flex: 1,
  },
  specsSection: {
    marginTop: 8,
  },
  specsTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  specsGrid: {
    gap: 8,
  },
  specItem: {
    backgroundColor: "rgba(193,254,0,0.08)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(193,254,0,0.15)",
  },
  actionsSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  actionsGrid: {
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(193,254,0,0.1)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(193,254,0,0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: "#c1fe00",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
  skeletonSpecsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  pressableContainer: {
    flex: 1,
  },
  flatListContainer: {
    width: "100%",
    height: IMAGE_HEIGHT,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
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
  specItemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  specIcon: {
    marginRight: 10,
  },

  // Image Modal Styles
  imageModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalClose: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 10,
  },
  fullScreenImage: {
    width: screenWidth - 40,
    height: "80%",
    borderRadius: 12,
  },
});
