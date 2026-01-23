import { isLiquidGlassSupported } from "@callstack/liquid-glass";
import { Globe, Info, MapPin, Phone, X } from "lucide-react-native";
import React, { useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FastImage from "react-native-fast-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FullScreenImageViewer } from "../components/ui";
import { NavigationProps } from "../navigation/navigationTypes";
import { useChatStore } from "../store/chatStore";
import { formatPrice, IS_ANDROID, IS_IOS } from "../utils/constants";
import { openWhatsApp } from "../utils/whatsapp";

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

// Utility functions
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

export const ProductScrappedDetailsModal: React.FC<
  NavigationProps<"ProductScrappedDetails">
> = ({ navigation, route }) => {
  const { item } = route.params;
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { toggleItemFavorite, isItemFavorited, trackProductClick } =
    useChatStore();
  const images = getImages(item);
  const price = getPrice(item);
  const priceCurrency = getPriceCurrency(item);
  const title = getTitle(item);

  // Build attributes for display
  const attributes: any[] = [];

  // For scrapped items, show all relevant fields
  const fieldsToShow = [
    "year",
    "brand",
    "model",
    "fuel_type",
    "transmission",
    "passengers",
    "bedrooms",
    "bathrooms",
    "area",
    "property_type",
    "listing_type",
    "category",
    "condition",
  ];

  fieldsToShow.forEach((field) => {
    if (item[field] !== undefined && item[field] !== null) {
      attributes.push({
        label: beautifyLabel(field),
        value: String(item[field]),
      });
    }
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={navigation.goBack} style={styles.closeButton}>
          <X size={24} color="#fff" />
        </Pressable>
      ),
      headerShown: IS_ANDROID,
      headerBackVisible: false,
      headerTitle: "",
      presentation: IS_IOS ? "formSheet" : undefined,
      sheetAllowedDetents: IS_IOS ? "fitToContents" : [0.92],
      contentStyle: {
        backgroundColor: "transparent",
      },
      headerStyle: {
        backgroundColor: "transparent",
      },
    });
  });

  return (
    <View
      className={`float-end w-full flex-1  ${IS_ANDROID ? "rounded-tl-3xl rounded-tr-3xl border border-[#333] bg-[#222222]" : ""}`}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.modalContent}
      >
        {/* Images Grid */}
        <View style={styles.imageGrid}>
          {images.map((imgUrl: string, idx: number) => (
            <TouchableOpacity
              key={idx}
              onPress={() => {
                setSelectedImageIndex(idx);
                setIsViewerVisible(true);
              }}
            >
              <FastImage
                source={{ uri: imgUrl }}
                style={[styles.gridImage, { borderColor: "#c1fe00" }]}
                resizeMode={FastImage.resizeMode.cover}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Basic Info */}
        <View style={styles.infoSection}>
          <Text style={styles.detailTitle}>{title}</Text>

          {price ? (
            <View style={styles.priceRow}>
              <Text style={styles.detailPriceText}>
                {formatPrice(price, priceCurrency)}
              </Text>
            </View>
          ) : null}

          {item.location ? (
            <View style={styles.locationRow}>
              <MapPin size={14} color="#888" />
              <Text style={styles.locationText}>
                {sanitizeLocation(item.location)}
              </Text>
            </View>
          ) : null}

          {item.phone_number ? (
            <TouchableOpacity
              style={styles.phoneRow}
              onPress={() => {
                openWhatsApp({
                  phoneNumber: item.phone_number,
                  productTitle: title,
                  price: price ?? 0,
                  priceCurrency: priceCurrency,
                });
              }}
            >
              <Phone size={14} color={"#c1fe00"} />
              <Text style={styles.phoneText}>{item.phone_number}</Text>
            </TouchableOpacity>
          ) : null}

          {item.description ? (
            <Text style={styles.description}>{item.description}</Text>
          ) : null}
        </View>

        {/* Attributes */}
        {attributes.length > 0 ? (
          <View style={styles.attributesSection}>
            <Text style={styles.sectionTitle}>
              {t("listingCards.specifications")}
            </Text>
            <View style={styles.attributesGrid}>
              {attributes.map((attr, idx) => (
                <View key={idx} style={styles.attributeChip}>
                  <Info size={12} color={"#c1fe00"} style={styles.chipIcon} />
                  <Text style={styles.chipLabel}>{attr.label}:</Text>
                  <Text style={styles.chipValue}>{attr.value}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* External link for scrapped items */}
        {item.detail_url || item.details_url ? (
          <View style={styles.externalLinkSection}>
            <TouchableOpacity
              style={styles.externalLinkButton}
              onPress={() => {
                // Track external link click for scraped products
                trackProductClick({
                  productId: item.hid,
                  productType: 2, // Scraped product
                  category: item.category ?? "products",
                  productOwnerId: null,
                });

                navigation.navigate("WebView", {
                  url: item.detail_url,
                });
              }}
            >
              <Globe size={20} color="#000" />
              <Text style={styles.externalLinkText}>
                {t("listingCards.viewDetails")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={{ height: isLiquidGlassSupported ? 0 : bottom * 2 }} />
      </ScrollView>

      <FullScreenImageViewer
        visible={isViewerVisible}
        images={images}
        initialIndex={selectedImageIndex}
        onClose={() => setIsViewerVisible(false)}
        backgroundColor="rgba(0, 0, 0, 0.95)"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    borderRadius: 32,
    padding: 8,
    borderWidth: 1,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 32,
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
  chipIcon: {
    marginRight: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  externalLinkSection: {
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
  priceText: {
    color: "#c1fe00",
    fontSize: 15,
    fontWeight: "700",
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
    fontSize: 12,
    marginLeft: 4,
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
});
