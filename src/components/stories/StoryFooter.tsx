import { useNavigation } from "@react-navigation/native";
import { ChevronRight, Heart, Phone } from "lucide-react-native";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MultiStoryRef } from "react-native-story-view";
import { UseNavigationProps } from "../../navigation/navigationTypes";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";
import { BoostedProduct } from "../../types/story";
import { IS_IOS } from "../../utils/constants";
import { openWhatsApp } from "../../utils/whatsapp";

interface StoryFooterProps {
  story: any;
  ref: React.RefObject<MultiStoryRef | null>;
}

export const StoryFooter: React.FC<StoryFooterProps> = ({ story, ref }) => {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  const { navigate } = useNavigation<UseNavigationProps<"MainApp">>();
  const { toggleItemFavorite, isItemFavorited } = useChatStore();
  const { isLoggedIn } = useAuthStore();
  const [isFavoriting, setIsFavoriting] = useState(false);

  const product: BoostedProduct | null = story?.storyData;

  const handleFavoritePress = useCallback(async () => {
    if (isFavoriting || !isLoggedIn || !product) return;
    setIsFavoriting(true);
    try {
      await toggleItemFavorite(product.id, "products", 1);
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setIsFavoriting(false);
    }
  }, [isFavoriting, isLoggedIn, toggleItemFavorite, product]);

  const handleWhatsAppPress = useCallback(() => {
    if (product?.phone_number) {
      openWhatsApp({
        phoneNumber: product.phone_number,
        productTitle: product.title,
        price: product.price,
        priceCurrency: product?.price_currency,
      });
    }
  }, [product]);

  const onViewDetails = useCallback(() => {
    ref.current?.close();
    navigate("ProductListingDetails", { item: product });
  }, [product, ref, navigate]);

  if (!product) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          marginBottom: IS_IOS ? 0 : 60 + bottom,
        },
      ]}
    >
      {/* Call To Actions */}
      {product.phone_number && (
        <TouchableOpacity
          style={[styles.ctaButton, styles.secondaryButton]}
          onPress={handleWhatsAppPress}
        >
          <Phone size={18} color="#000" />
          <Text style={styles.secondaryButtonText}>{t("stories.call")}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.ctaButton, styles.primaryButton]}
        onPress={onViewDetails}
      >
        <Text style={styles.primaryButtonText}>{t("stories.viewDetails")}</Text>
        <ChevronRight size={18} color="#000" />
      </TouchableOpacity>

      {/* Heart/Favorite Button */}
      <TouchableOpacity
        style={[styles.ctaButton, styles.iconButton]}
        onPress={handleFavoritePress}
        disabled={!isLoggedIn || isFavoriting}
      >
        {isFavoriting ? (
          <ActivityIndicator size="small" color="#c1fe00" />
        ) : (
          <Heart
            size={20}
            color="#c1fe00"
            fill={isItemFavorited(product.id) ? "#c1fe00" : "none"}
            strokeWidth={isItemFavorited(product.id) ? 0 : 2}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 12,
  },
  productPrice: {
    color: "#c1fe00",
    fontWeight: "800",
    fontSize: 28,
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  productTitle: {
    color: "white",
    fontWeight: "600",
    fontSize: 18,
    marginBottom: 6,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    opacity: 0.9,
  },
  locationText: {
    color: "#ddd",
    fontSize: 12,
    marginLeft: 4,
  },
  productDescription: {
    color: "#eee",
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 30,
    height: 48,
  },
  iconButton: {
    flex: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    minWidth: 48,
  },
  primaryButton: {
    flex: 2,
    backgroundColor: "#c1fe00",
  },
  primaryButtonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
    marginRight: 4,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#fff",
  },
  secondaryButtonText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 6,
  },
});
