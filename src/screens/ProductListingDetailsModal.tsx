import {
  Bath,
  BedDouble,
  Book,
  Box,
  Calendar,
  Car,
  Check,
  DollarSign,
  Fuel,
  Home,
  Info,
  MapPin,
  Medal,
  Phone,
  Ruler,
  Settings,
  ShoppingBag,
  Smartphone,
  Sofa,
  Trophy,
  User,
  Wrench,
  X,
} from "lucide-react-native";
import React, { useLayoutEffect, useMemo, useState } from "react";
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
import { formatPrice, IS_ANDROID, IS_IOS } from "../utils/constants";
import { openWhatsApp } from "../utils/whatsapp";
import { isLiquidGlassSupported } from "@callstack/liquid-glass";

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

function getAttributeIcon(attributeKey: string) {
  return (
    attributeIconMap[attributeKey as keyof typeof attributeIconMap] || Info
  );
}

export const ProductListingDetailsModal: React.FC<
  NavigationProps<"ProductListingDetails">
> = ({ navigation, route }) => {
  const { item } = route.params;
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  const [isViewerVisible, setIsViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const openImageViewer = (index: number) => {
    setSelectedImageIndex(index);
    setIsViewerVisible(true);
  };

  const closeImageViewer = () => {
    setIsViewerVisible(false);
  };

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

  // Get priority attributes for this category
  const priorityAttrs =
    categoryPriorityAttributes[
      item.category as keyof typeof categoryPriorityAttributes
    ] || [];

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

    return chips; // Limit to 8 chips for clean display
  }, [item.attributes, t, priorityAttrs]);

  // Basic attributes chips

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

    return chips; // Limit to 8 chips for clean display
  }, [item.basic_attributes, t]);

  // Features list
  const featuresList = Array.isArray(item.attributes?.features)
    ? item.attributes.features
    : [];

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
          {item.media?.map((imgUrl: string, idx: number) => (
            <TouchableOpacity
              key={idx}
              onPress={() => {
                openImageViewer(idx);
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
          <Text style={styles.detailTitle}>{item.title}</Text>

          {item.price && (
            <View style={styles.priceRow}>
              <Text style={[styles.priceText]}>
                {formatPrice(item.price, item?.price_currency)}
              </Text>
            </View>
          )}

          {item.location && (
            <View style={styles.locationRow}>
              <MapPin size={14} color="#888" />
              <Text style={styles.locationText}>
                {sanitizeLocation(item.location)}
              </Text>
            </View>
          )}

          {item.phone_number && (
            <TouchableOpacity
              style={styles.phoneRow}
              onPress={() => {
                openWhatsApp({
                  phoneNumber: item.phone_number,
                  productTitle: item.title,
                  price: item.price,
                  priceCurrency: item?.price_currency,
                });
              }}
            >
              <Phone size={14} color={"#c1fe00"} />
              <Text style={[styles.phoneText]}>{item.phone_number}</Text>
            </TouchableOpacity>
          )}

          {item.description && (
            <Text style={styles.description}>{item.description}</Text>
          )}
        </View>

        {/* Basic Attributes */}
        {basicAttributesChips.length > 0 && (
          <View style={[styles.attributesGrid, { marginBottom: 20 }]}>
            {basicAttributesChips.map((chip, idx) => (
              <View
                key={idx}
                style={[
                  styles.attributeChip,
                  { borderColor: `${"#c1fe00"}40` },
                ]}
              >
                <chip.Icon
                  size={12}
                  color={"#c1fe00"}
                  style={styles.chipIcon}
                />
                <Text style={[styles.chipLabel]}>{chip.label}:</Text>
                <Text style={styles.chipValue}>{chip.value}</Text>
              </View>
            ))}
          </View>
        )}
        {attributeChips.length > 0 && (
          <View style={styles.attributesSection}>
            <Text style={[styles.sectionTitle]}>
              {t("listingCards.specifications")}
            </Text>
            <View style={styles.attributesGrid}>
              {attributeChips.map((chip, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.attributeChip,
                    { borderColor: `${"#c1fe00"}40` },
                  ]}
                >
                  <chip.Icon
                    size={12}
                    color={"#c1fe00"}
                    style={styles.chipIcon}
                  />
                  <Text style={[styles.chipLabel]}>{chip.label}:</Text>
                  <Text style={styles.chipValue}>{chip.value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Features */}
        {featuresList.length > 0 && (
          <View style={styles.featuresSection}>
            <Text style={[styles.sectionTitle]}>
              {t("listingCards.features")}
            </Text>
            {featuresList.map((feature: string, idx: number) => (
              <View key={idx} style={styles.featureRow}>
                <Check size={14} color={"#c1fe00"} style={styles.featureIcon} />
                <Text style={styles.featureText}>{beautifyLabel(feature)}</Text>
              </View>
            ))}
          </View>
        )}
        <View style={{ height: isLiquidGlassSupported ? 0 : bottom * 2 }} />
      </ScrollView>

      <FullScreenImageViewer
        visible={isViewerVisible}
        images={item.media || []}
        initialIndex={selectedImageIndex}
        onClose={closeImageViewer}
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
  priceText: {
    color: "#c1fe00",
    fontSize: 15,
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
