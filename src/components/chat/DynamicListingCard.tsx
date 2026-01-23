import { useNavigation } from "@react-navigation/native";
import {
  Bath,
  BedDouble,
  Book,
  Box,
  Briefcase,
  Calendar,
  Car,
  CheckCircle,
  Crown,
  DollarSign,
  Fuel,
  GraduationCap,
  Hammer,
  Heart,
  Home,
  Info,
  MapPin,
  Medal,
  Music,
  PawPrint,
  Pencil,
  Phone,
  PhoneCall,
  Ruler,
  Settings,
  ShieldClose,
  Shirt,
  ShoppingBag,
  Smartphone,
  Sofa,
  Ticket,
  Trash2,
  Trophy,
  User,
  Utensils,
  Wrench,
} from "lucide-react-native";
import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
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
import { useListingStore } from "../../store/listingStore";
import { formatPrice, screenWidth } from "../../utils/constants";
import { openWhatsApp } from "../../utils/whatsapp";
import { FullScreenImageViewer } from "../ui";

const CARD_WIDTH = screenWidth - 20;
const IMAGE_HEIGHT = 175;
const getFallbackImage = (t: any) =>
  `https://placehold.co/${CARD_WIDTH}x${IMAGE_HEIGHT}/png?text=${encodeURIComponent(
    t("listingCards.noImage")
  )}`;

function beautifyLabel(label: string) {
  return label.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function sanitizeLocation(location: any) {
  if (!location) return "";
  if (typeof location === "object" && location.display_name)
    return location.display_name;
  if (typeof location === "string") return location;
  return "";
}

// Enhanced icon map for different categories and attributes
const categoryIconMap = {
  vehicles: Car,
  real_estate: Home,
  electronics: Smartphone,
  food: Utensils,
  furniture: Sofa,
  books: Book,
  sports: Trophy,
  services: Wrench,
  education: GraduationCap,
  events: Ticket,
  tools: Hammer,
  vehicle_parts: Wrench,
  fashion: Shirt,
  collectibles: Medal,
  pet_supplies: PawPrint,
  health_and_beauty: Heart,
  jewelry: Medal,
  music: Music,
  jobs: Briefcase,
  pets: PawPrint,
  office_supplies: Briefcase,
  toys: Box,
  other: Box,
};

const attributeIconMap = {
  // Vehicle attributes
  year: Calendar,
  brand: Car,
  model: Car,
  seats: User,
  doors: Car,
  mileage: Ruler,
  fuel_type: Fuel,
  transmission: Settings,
  condition: Info,
  engine_size: Settings,
  body_type: Car,
  listing_type: Home,

  // Real estate attributes
  bedrooms: BedDouble,
  bathrooms: Bath,
  area: Ruler,
  property_type: Home,
  floor_number: Home,
  parking_spaces: Car,
  furnished: Sofa,

  // Electronics attributes
  storage: Box,
  ram: Smartphone,
  processor: Smartphone,
  screen_size: Smartphone,
  operating_system: Smartphone,

  // Furniture attributes
  material: Sofa,
  dimensions: Ruler,
  room: Home,
  style: Sofa,

  // Books attributes
  author: Book,
  genre: Book,
  language: Book,

  // Sports attributes
  sport: Trophy,
  size: Ruler,
  usage_level: Trophy,

  // Services attributes
  service_type: Wrench,
  availability: Calendar,
  certification: Medal,
  experience: Trophy,

  // Tools attributes
  power_source: Settings,
  weight: Ruler,
  warranty: Medal,

  // Common attributes
  price: DollarSign,
  location: MapPin,
  phone_number: Phone,
  category: ShoppingBag,
  features: Settings,
  color: Info,
};

function getCategoryIcon(category_key: string) {
  return categoryIconMap[category_key as keyof typeof categoryIconMap] || Box;
}

function getAttributeIcon(attributeKey: string) {
  return (
    attributeIconMap[attributeKey as keyof typeof attributeIconMap] || Info
  );
}

// Category-specific priority attributes to show prominently
const categoryPriorityAttributes = {
  vehicles: [
    "year",
    "brand",
    "model",
    "fuel_type",
    "transmission",
    "condition",
  ],
  real_estate: ["property_type", "bedrooms", "bathrooms", "area", "furnished"],
  electronics: ["brand", "model", "storage", "ram", "condition"],
  furniture: ["category", "material", "dimensions", "condition"],
  books: ["author", "genre", "language", "condition"],
  sports: ["sport", "brand", "size", "condition"],
  services: ["service_type", "availability", "experience"],
  tools: ["category", "brand", "power_source", "condition"],
  food: ["category", "brand", "expiry_date", "dietary_info"],
  education: ["subject", "category", "level", "duration"],
  events: ["event_type", "event_date", "venue", "ticket_type"],
};

const DynamicListingCard = ({
  item,
  onDeletePressed,
  onEditPressed,
  onHighlightingPressed,
  shouldLogAnalytic = false,
  style,
}: {
  item: any;
  onDeletePressed?: () => void;
  onEditPressed?: () => void;
  onHighlightingPressed?: () => void;
  shouldLogAnalytic?: boolean;
  style?: ViewStyle;
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation<UseNavigationProps<"MainApp">>();

  const [activeIndex, setActiveIndex] = useState(0);
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { toggleItemFavorite, isItemFavorited, trackProductClick } =
    useChatStore();
  const [isFavoriting, setIsFavoriting] = useState(false);
  const { isLoggedIn, userProfile } = useAuthStore();
  const { setEditData } = useListingStore();
  const [containerWidth, setContainerWidth] = useState(0);
  const [visibleTagsCount, setVisibleTagsCount] = useState(2);

  const CategoryIcon = getCategoryIcon(item.category);

  // Handle Fix & Resubmit button press
  const handleFixAndResubmit = useCallback(() => {
    setEditData(item);
    navigation.navigate("ListingForm", {
      edit: true,
      item: item,
    });
  }, [item, setEditData, navigation]);

  // Handle Learn More button press
  const handleLearnMore = useCallback(() => {
    navigation.navigate("TermsOfUse");
  }, [navigation]);

  const images = item.media ?? [];
  const imagesUrls = useMemo(() => {
    const fallbackImage = getFallbackImage(t);
    if (!images) return [fallbackImage];
    if (Array.isArray(images)) {
      const filtered = images
        .filter((url) => url && /^https?:\/\//.test(url))
        .slice(0, 5);
      return filtered.length > 0 ? filtered : [fallbackImage];
    }
    return [fallbackImage];
  }, [images, t]);

  const handleFavoritePress = useCallback(async () => {
    if (isFavoriting) return;
    setIsFavoriting(true);
    try {
      await toggleItemFavorite(item.id, item.category, 1);
    } catch (error) {
    } finally {
      setIsFavoriting(false);
    }
  }, [isFavoriting, toggleItemFavorite]);

  const logAnalytics = useCallback(() => {
    // Track product view event
    if (userProfile?.id) {
      trackProductView(userProfile.id, item.id);
    }
    if (shouldLogAnalytic) {
      trackProductClick({
        productId: item.id,
        productType: 1, // Default to 1 if not specified
        category: item.category ?? "products",
        productOwnerId: item.user_id || item.owner_id || null,
      });
    }
    // Navigate to ProductDetails modal
    navigation.navigate("ProductListingDetails", { item });
  }, [shouldLogAnalytic, item, trackProductClick, userProfile, navigation]);

  // Get priority attributes for this category
  const priorityAttrs =
    categoryPriorityAttributes[
    item.category as keyof typeof categoryPriorityAttributes
    ] ?? [];

  const openImageViewer = (index: number) => {
    setSelectedImageIndex(index);
    setIsViewerVisible(true);
  };
  const closeImageViewer = () => {
    setIsViewerVisible(false);
  };

  // Create attribute chips with priority ordering
  const attributeChips = useMemo(() => {
    if (!item.attributes) return [];
    const chips = [];

    // First add priority attributes
    for (const key of priorityAttrs) {
      if (item.attributes[key] !== undefined && key !== "features") {
        let value = item.attributes[key];
        const Icon = getAttributeIcon(key);

        if (Array.isArray(value)) {
          value = value.map((v) => beautifyLabel(String(v))).join(", ");
        } else if (typeof value === "boolean") {
          value = value ? t("listingCards.yes") : t("listingCards.no");
        } else if (typeof value === "string") {
          value = beautifyLabel(value);
        }

        chips.push({
          label: beautifyLabel(key),
          value: String(value),
          Icon,
          priority: true,
        });
      }
    }

    // Then add other attributes
    for (const key in item.attributes) {
      if (
        !priorityAttrs.includes(key) &&
        key !== "features" &&
        item.attributes[key] !== undefined
      ) {
        let value = item.attributes[key];
        const Icon = getAttributeIcon(key);

        if (Array.isArray(value)) {
          value = value.map((v) => beautifyLabel(String(v))).join(", ");
        } else if (typeof value === "boolean") {
          value = value ? t("listingCards.yes") : t("listingCards.no");
        } else if (typeof value === "string") {
          value = beautifyLabel(value);
        }

        chips.push({
          label: beautifyLabel(key),
          value: String(value),
          Icon,
          priority: false,
        });
      }
    }

    return chips.slice(0, 8); // Limit to 8 chips for clean display
  }, [item.attributes, priorityAttrs]);

  const basicAttributesChips = useMemo(() => {
    if (!item.basic_attributes) return [];
    const chips = [];
    // Then add other basic_attributes
    for (const key in item.basic_attributes) {
      if (item.basic_attributes[key] !== undefined) {
        let value = item.basic_attributes[key];
        const Icon = getAttributeIcon(key);

        if (Array.isArray(value)) {
          value = value.map((v) => beautifyLabel(String(v))).join(", ");
        } else if (typeof value === "boolean") {
          value = value ? t("listingCards.yes") : t("listingCards.no");
        } else if (typeof value === "string") {
          value = beautifyLabel(value);
        }

        chips.push({
          label: beautifyLabel(key),
          value: String(value),
          Icon,
          priority: false,
        });
      }
    }

    return chips.slice(0, 8); // Limit to 8 chips for clean display
  }, [item.basic_attributes]);

  // Combined chips array for display
  const allChips = useMemo(() => {
    return [...basicAttributesChips, ...attributeChips];
  }, [basicAttributesChips, attributeChips]);

  // Estimate tag width based on text length
  const estimateTagWidth = useCallback((text: string) => {
    // Base padding and icon: 8px left + 8px right + 12px icon + 6px gap
    const basePadding = 34;
    // Approximate 8px per character for the font size used
    const charWidth = 8;
    return basePadding + (text.length * charWidth);
  }, []);

  // Calculate how many tags can fit in one line
  const calculateVisibleTags = useCallback(() => {
    if (!containerWidth || containerWidth === 0 || allChips.length === 0) {
      return 2; // Default fallback
    }

    const gap = 8; // Gap between tags
    const moreTagWidth = 100; // Approximate width for "+X more" tag
    let totalWidth = 0;
    let count = 0;

    for (let i = 0; i < allChips.length; i++) {
      const estimatedWidth = estimateTagWidth(allChips[i].value);
      const widthWithGap = estimatedWidth + (count > 0 ? gap : 0);

      // Check if we need to reserve space for "+X more" tag
      const remainingTags = allChips.length - (count + 1);
      const needsMoreTag = remainingTags > 0;
      const requiredWidth = totalWidth + widthWithGap + (needsMoreTag ? moreTagWidth + gap : 0);

      if (requiredWidth <= containerWidth) {
        totalWidth += widthWithGap;
        count++;
      } else {
        break;
      }
    }

    // Ensure at least 1 tag is shown
    return Math.max(1, count);
  }, [containerWidth, allChips, estimateTagWidth]);

  // Update visible tags count when container width or chips change
  React.useEffect(() => {
    const count = calculateVisibleTags();
    setVisibleTagsCount(count);
  }, [calculateVisibleTags]);

  // Handle container layout to get width
  const handleContainerLayout = useCallback((event: any) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  }, []);

  return (
    <View style={[styles.card, { borderColor: `${"#c1fe00"}40` }, style]}>
      {/* Paused Status Overlay */}
      {item.status === "paused" && (
        <View style={styles.pausedOverlay}>
          <View style={styles.pausedBadge}>
            <ShieldClose size={16} color="#fff" />
            <Text style={styles.pausedBadgeText}>
              {t("listingCards.paused")}{" "}
              <Text style={styles.pausedBadgeSubText}>
                • {t("listingCards.policy")}
              </Text>
            </Text>
          </View>
          <View style={styles.pausedContent}>
            <Text style={styles.pausedTitle}>
              {t("listingCards.doesntMeetGuidelines")}
            </Text>
            <View style={styles.pausedButtons}>
              <TouchableOpacity
                style={styles.fixButton}
                onPress={handleFixAndResubmit}
              >
                <Text style={styles.fixButtonText}>
                  {t("listingCards.fixAndResubmit")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.learnButton}
                onPress={handleLearnMore}
              >
                <Text style={styles.learnButtonText}>
                  {t("listingCards.learnMore")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Card Content - Disabled when paused */}
      <View
        style={item.status === "paused" ? styles.disabledContent : undefined}
      >
        {/* Image Carousel */}
        <View style={styles.imageContainer}>
          <Animated.FlatList
            data={imagesUrls}
            renderItem={({ item: imgUrl, index }) => (
              <TouchableOpacity
                onPress={() => {
                  openImageViewer(index);
                }}
              >
                <FastImage
                  source={{ uri: imgUrl }}
                  style={styles.cardImage}
                  resizeMode={FastImage.resizeMode.cover}
                />
              </TouchableOpacity>
            )}
            keyExtractor={(_, idx) => idx.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / CARD_WIDTH
              );
              setActiveIndex(idx);
            }}
          />

          {/* Image Indicators */}
          {imagesUrls.length > 1 && (
            <View style={styles.dotsContainer}>
              {imagesUrls.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    activeIndex === idx && [styles.activeDot],
                  ]}
                />
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <View style={styles.badgesContainer}>
              {item.boost > 0 ? (
                <View style={styles.boostBadge}>
                  <Crown size={10} color="#000" />
                  <Text style={styles.boostText}>
                    {t("listingCards.boosted")}
                  </Text>
                  {onHighlightingPressed && (
                    <Text style={styles.boostText}>
                      {t("listingCards.expires")}{" "}
                      {new Date(item?.boost_expire).toLocaleDateString()}
                    </Text>
                  )}
                </View>
              ) : (
                onHighlightingPressed && (
                  <TouchableOpacity
                    onPress={onHighlightingPressed}
                    disabled={!onHighlightingPressed}
                    style={styles.boostBadge}
                  >
                    <Text style={styles.boostText}>
                      {t("listingCards.boost")}
                    </Text>
                  </TouchableOpacity>
                )
              )}
              {item.is_verified && (
                <View style={styles.boostBadge}>
                  <CheckCircle size={10} color="#000" />
                  <Text style={styles.boostText}>
                    {t("listingCards.verified")}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.actionButtonsRight}>
              <TouchableOpacity
                onPress={handleFavoritePress}
                style={styles.actionButton}
                disabled={!isLoggedIn}
              >
                {isFavoriting ? (
                  <ActivityIndicator size="small" color="#c1fe00" />
                ) : (
                  <Heart
                    size={20}
                    color="#c1fe00"
                    fill={isItemFavorited(item.id) ? "#c1fe00" : "none"}
                    strokeWidth={isItemFavorited(item.id) ? 0 : 2}
                    className={
                      isItemFavorited(item.id) ? "opacity-100" : "opacity-60"
                    }
                  />
                )}
              </TouchableOpacity>

              {item.phone_number && (
                <TouchableOpacity
                  onPress={() => {
                    openWhatsApp({
                      phoneNumber: item.phone_number,
                      productTitle: item.title,
                      price: item.price,
                      priceCurrency: item?.price_currency,
                    });
                  }}
                  style={styles.actionButton}
                >
                  <PhoneCall size={20} color={"#c1fe00"} />
                </TouchableOpacity>
              )}

              {onEditPressed && (
                <TouchableOpacity
                  onPress={onEditPressed}
                  style={styles.actionButton}
                >
                  <Pencil size={20} color={"#c1fe00"} />
                </TouchableOpacity>
              )}

              {onDeletePressed && (
                <TouchableOpacity
                  onPress={onDeletePressed}
                  style={styles.actionButton}
                >
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Card Content */}
        <TouchableOpacity onPress={logAnalytics} style={styles.cardContent}>
          {/* Category and Title */}
          <View style={styles.headerRow}>
            <View style={styles.categoryContainer}>
              <CategoryIcon
                size={18}
                color={"#c1fe00"}
                style={styles.categoryIcon}
              />
              <Text style={[styles.categoryText]}>
                {beautifyLabel(item.category)}
              </Text>
            </View>

            {item.price && (
              <View style={styles.priceContainer}>
                <Text style={[styles.priceText]}>
                  {formatPrice(item.price, item?.price_currency)}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.titleText} numberOfLines={1}>
            {item.title}
          </Text>

          {item.location && (
            <View style={styles.locationContainer}>
              <MapPin size={14} color="#888" />
              <Text style={styles.locationText} numberOfLines={1}>
                {sanitizeLocation(item.location)}
              </Text>
            </View>
          )}

          {/* Attributes - Dynamic width-based display */}
          {allChips.length > 0 && (
            <View
              style={styles.attributesContainer}
              onLayout={handleContainerLayout}
            >
              {allChips.slice(0, visibleTagsCount).map((chip, idx) => (
                <View key={idx} style={styles.attributeTag}>
                  <chip.Icon size={12} color={"#c1fe00"} />
                  <Text style={styles.tagValue} numberOfLines={1}>
                    {chip.value}
                  </Text>
                </View>
              ))}
              {allChips.length > visibleTagsCount && (
                <View style={styles.attributeTag}>
                  <Text style={styles.tagValue}>
                    +{allChips.length - visibleTagsCount} {t("common.more") || "more"}
                  </Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>

        <FullScreenImageViewer
          visible={isViewerVisible}
          images={images}
          initialIndex={selectedImageIndex}
          onClose={closeImageViewer}
          backgroundColor="rgba(0, 0, 0, 0.95)"
        />
      </View>
    </View>
  );
};

export default memo(DynamicListingCard);

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
  imageContainer: {
    width: "100%",
    height: IMAGE_HEIGHT,
    backgroundColor: "#222",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  cardImage: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
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
  actionButtons: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    zIndex: 10,
  },
  badgesContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    flex: 1,
  },
  boostBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#c1fe00",
  },
  boostText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
  },
  actionButtonsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 8,
  },
  cardContent: {
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
  attributesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  attributeTag: {
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
  tagIcon: {
    marginRight: 4,
  },
  tagLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginRight: 2,
    color: "#c1fe00",
    display: "none",
  },
  tagValue: {
    color: "#c1fe00",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    padding: 8,
    borderRadius: 16,
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
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
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
  sliderContainer: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
    backgroundColor: "#222",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  skeletonImage: {
    width: CARD_WIDTH,
    height: IMAGE_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#222",
  },
  info: {
    padding: 12,
    backgroundColor: "rgba(20,20,20,0.98)",
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
  skeletonSpecsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },

  // Paused Overlay Styles
  pausedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  pausedBadge: {
    position: "absolute",
    top: 16,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(20, 20, 20, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pausedBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "400",
    marginLeft: 4,
  },
  pausedBadgeSubText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontWeight: "400",
    marginLeft: 4,
  },
  pausedContent: {
    backgroundColor: "rgba(20, 20, 20, 0.9)",
    borderRadius: 12,
    margin: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    height: 200,
    width: 400,
    marginTop: 200,
    paddingTop: 80,
  },

  pausedTitle: {
    color: "#fff",
    fontSize: 19.5,
    fontWeight: "bold",
    right: 25,
    // marginBottom: 20,
  },

  pausedButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  fixButton: {
    backgroundColor: "black",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  fixButtonText: {
    color: "#c1fe00",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  learnButton: {
    backgroundColor: "rgba(103, 98, 98, 0.1)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  learnButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  disabledContent: {
    opacity: 0.7,
    pointerEvents: "none",
  },
});
