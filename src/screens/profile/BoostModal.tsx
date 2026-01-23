import { Award, Zap } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Config from "react-native-config";
import {
  ErrorCode,
  Purchase,
  PurchaseError,
  requestPurchase,
  useIAP,
} from "react-native-iap";
import { toast } from "sonner-native";
import { NavigationProps } from "../../navigation/navigationTypes";
import { ApiService } from "../../services/apiService";
import { useAuthStore } from "../../store/authStore";
import { IS_ANDROID, IS_IOS } from "../../utils/constants";
import {
  LiquidGlassContainer,
  liquidGlassProps,
} from "../../utils/liquidGlass";
import { useLoginSheet } from "../../utils/LoginSheetContext";

// IAP setup
const FEATURED_MERCHANT_ID = "com.nodoia.nodo.featured.v2";
const FEATURED_LISTING_ID = "com.nodoia.nodo.featured.v1";
const PRODUCT_IDS = [FEATURED_MERCHANT_ID, FEATURED_LISTING_ID];

const BoostModal = ({ navigation }: NavigationProps<"Boost">) => {
  const { t } = useTranslation();
  const { showLoginSheet } = useLoginSheet();

  const { getUserProfile, userProfile, isLoggedIn } = useAuthStore();

  const [isProcessing, setIsProcessing] = useState(false);

  // IAP hook setup
  const { connected, products, fetchProducts, finishTransaction } = useIAP({
    onPurchaseSuccess: async (purchase: Purchase) => {
      const { purchaseToken: tokenToMask, ...rest } = purchase;
      const masked = {
        ...rest,
        ...(tokenToMask ? { purchaseToken: "hidden" } : {}),
      };
      console.log("Purchase successful:", masked);
      setIsProcessing(false);

      try {
        await ApiService.payment.validate({
          transaction_id: purchase.id,
          purchaseToken: purchase?.purchaseToken ?? "",
          platform: Platform.OS,
          platformProductId: purchase?.productId,
        });
      } catch (error) {
        console.warn("[PurchaseFlow] validation failed:", error);
      }

      try {
        await finishTransaction({
          purchase,
          isConsumable: true,
        });
      } catch (error) {
        console.warn("[PurchaseFlow] finishTransaction failed:", error);
      }

      await getUserProfile();
      toast.success(t("admin.highlightPurchaseSuccess"));
      navigation.goBack();
    },
    onPurchaseError: (error: PurchaseError) => {
      console.error("Purchase failed:", error);
      console.error("Error code:", error.code);
      console.error(
        "Is user cancelled:",
        error.code === ErrorCode.UserCancelled
      );

      setIsProcessing(false);

      // Check for user cancellation
      if (error.code === ErrorCode.UserCancelled) {
        toast.info(t("admin.purchaseCancelled"));
        return;
      }

      toast.error(t("admin.purchaseError").replace("{message}", error.message));
    },
  });

  // Fetch IAP products
  useEffect(() => {
    if (connected) {
      console.log("[BoostModal] Calling fetchProducts with:", PRODUCT_IDS);
      fetchProducts({ skus: PRODUCT_IDS, type: "in-app" })
        .then(() => {
          console.log("[BoostModal] fetchProducts completed");
        })
        .catch((error) => {
          console.error("[BoostModal] fetchProducts error:", error);
        });
    } else if (!connected) {
      console.log("[BoostModal] Not fetching products - not connected");
    }
  }, [connected, fetchProducts]);

  const handleBoostPress = useCallback(
    (id: string) => {
      if (!isLoggedIn) {
        showLoginSheet();
        return;
      }

      if (Config.ENV === "staging") {
        toast.error(t("admin.purchaseTestEnvironment"));
        return;
      }
      // Navigate to merchant profile where boost can be applied for listing
      if (id === FEATURED_LISTING_ID) {
        navigation.replace("MyListings");
        return;
      }

      // Check if user is verified merchant
      if (userProfile?.verifiedStatus !== "VERIFIED") {
        toast.error(t("profile.onlyVerifiedMerchantsCanBoost"));
        navigation.replace("PremiumUpgrade");
        return;
      }

      setIsProcessing(true);
      toast.info(t("admin.processingPurchase"));

      requestPurchase({
        request: {
          ios: {
            sku: FEATURED_MERCHANT_ID,
            quantity: 1,
          },
          android: {
            skus: [FEATURED_MERCHANT_ID],
          },
        },
        type: "in-app",
      })
        .catch((error) => {
          console.error("[PurchaseFlow] requestPurchase failed:", error);
          toast.error(t("admin.purchaseRequestFailed"));
        })
        .finally(() => {
          setIsProcessing(false);
        });
    },
    [userProfile, t, navigation]
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      sheetAllowedDetents: IS_IOS ? "fitToContents" : [0.6],
      contentStyle: {
        backgroundColor: "transparent",
      },
    });
  });

  return (
    <View
      className={`float-end w-full flex-1 justify-between px-6 pt-8 ${IS_ANDROID ? "rounded-tl-3xl rounded-tr-3xl border border-[#333] bg-[#222222] pb-2" : ""}`}
    >
      <View className="gap-2">
        {/* Header */}
        <View className="h-16 w-16 items-center justify-center self-center rounded-full bg-primary/20">
          <Zap color="#c1fe00" size={32} />
        </View>
        <Text className="text-center text-2xl font-bold text-foreground">
          {t("profile.brandBoostModalTitle")}
        </Text>
        <Text className="text-center text-base text-gray-400">
          {t("profile.brandBoostDescription")}
        </Text>
      </View>

      {/* Boost Options */}
      <View className={`gap-4 ${IS_IOS ? "my-8" : ""}`}>
        {(products?.length
          ? products
          : [{ id: FEATURED_MERCHANT_ID }, { id: FEATURED_LISTING_ID }]
        ).map((product, index) => (
          <LiquidGlassContainer
            key={index}
            {...liquidGlassProps}
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#333",
            }}
          >
            <TouchableOpacity
              className="flex-row items-center justify-between p-4 "
              onPress={() => handleBoostPress(product.id)}
              activeOpacity={0.7}
            >
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                {product.id === FEATURED_MERCHANT_ID ? (
                  <Award color="#c1fe00" size={24} />
                ) : (
                  <Zap color="#c1fe00" size={24} />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-foreground">
                  {product?.displayName ||
                    (product.id === FEATURED_MERCHANT_ID
                      ? t("profile.brandBoostOption")
                      : t("profile.listingBoostOption"))}
                </Text>
                <Text className="mt-1 text-xs text-gray-400">
                  {product?.description ||
                    (product.id === FEATURED_MERCHANT_ID
                      ? t("profile.brandBoostOptionDesc")
                      : t("profile.listingBoostOptionDesc"))}
                </Text>
              </View>
              <View className="ml-2 items-end">
                <Text className="text-base font-bold text-primary">
                  {product?.displayPrice ||
                    (product.id === FEATURED_MERCHANT_ID ? "$9.99" : "$2.99")}
                </Text>
              </View>
            </TouchableOpacity>
          </LiquidGlassContainer>
        ))}
      </View>

      {/* Close Button */}
      <TouchableOpacity
        className={`${IS_ANDROID ? "mb-safe" : ""} rounded-xl bg-[#333] py-4`}
        onPress={navigation.goBack}
        disabled={isProcessing}
      >
        <Text className="text-center font-medium text-foreground">
          {t("common.cancel")}
        </Text>
      </TouchableOpacity>

      {/* Processing Overlay */}
      {isProcessing && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <View className="items-center rounded-3xl bg-[#1e1e1e] px-10 py-8">
            <ActivityIndicator size="large" color="#c1fe00" />
            <Text className="mt-4 text-center text-base font-semibold text-foreground">
              {t("admin.processingPurchase")}
            </Text>
            <Text className="mt-2 text-center text-sm text-gray-400">
              {t("common.pleaseWait")}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default BoostModal;
