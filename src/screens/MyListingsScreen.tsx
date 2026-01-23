import { LegendList } from "@legendapp/list";
import { Check, Crown, Package } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ErrorCode, Purchase, PurchaseError, useIAP } from "react-native-iap";
import { toast } from "sonner-native";
import { AnimatedView } from "../components/animated";
import DynamicListingCard from "../components/chat/DynamicListingCard";
import type { NavigationProps } from "../navigation/navigationTypes";
import { ApiService, PaymentVerificationRequest } from "../services/apiService";
import { ListingsApi } from "../services/listingsApi";
import { useAuthStore } from "../store/authStore";
import { useListingStore } from "../store/listingStore";

export const CONSUMABLE_PRODUCT_IDS: string[] = ["com.nodoia.nodo.featured.v1"];
export const CONSUMABLE_PRODUCT_ID_SET = new Set(CONSUMABLE_PRODUCT_IDS);

export const PRODUCT_IDS: string[] = [...CONSUMABLE_PRODUCT_IDS];

const FREE_LISTING_LIMIT = 5;

const MyListingsScreen = ({ navigation }: NavigationProps<"MyListings">) => {
  const { t } = useTranslation();
  const { userProfile } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const {
    userListings,
    setUserListings,
    clearEditData,
    resetForm,
    deleteListing,
    setEditData,
    userListingsError,
    setUserListingsError,
    userListingsLoading,
    setUserListingsLoading,
  } = useListingStore();

  const [listingId, setProductId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);

  const { finishTransaction, requestPurchase } = useIAP({
    onPurchaseSuccess: async (purchase: Purchase) => {
      const { purchaseToken: tokenToMask, ...rest } = purchase;
      const masked = {
        ...rest,
        ...(tokenToMask ? { purchaseToken: "hidden" } : {}),
      };
      console.log("Purchase successful:", masked);
      setIsProcessing(false);

      try {
        const validationData: PaymentVerificationRequest = {
          transaction_id: purchase.id,
          product_id: listingId,
          purchaseToken: purchase?.purchaseToken ?? "",
          platform: Platform.OS,
          platformProductId: purchase?.productId,
        };

        await ApiService.payment.validate(validationData);
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

      await fetchListings();
      toast.success(t("admin.highlightPurchaseSuccess"));
    },
    onPurchaseError: (error: PurchaseError) => {
      console.error("Purchase failed:", error);
      console.error("Error code:", error.code);
      console.error(
        "Is user cancelled:",
        error.code === ErrorCode.UserCancelled
      );

      setIsProcessing(false);
      setProductId("");

      // Check for user cancellation
      if (error.code === ErrorCode.UserCancelled) {
        toast.info(t("admin.purchaseCancelled"));
        return;
      }

      toast.error(t("admin.purchaseError").replace("{message}", error.message));
    },
  });

  const handlePurchase = useCallback(
    (id: string) => {
      setIsProcessing(true);
      toast.info(t("admin.processingPurchase"));

      if (typeof requestPurchase !== "function") {
        console.warn("[PurchaseFlow] requestPurchase missing (test/mock env)");
        setIsProcessing(false);
        toast.error(t("admin.purchaseTestEnvironment"));
        return;
      }
      setProductId(id);

      void requestPurchase({
        request: {
          ios: {
            sku: PRODUCT_IDS[0],
            quantity: 1,
          },
          android: {
            skus: [PRODUCT_IDS[0]],
          },
        },
        type: "in-app",
      }).catch((error) => {
        console.error("[PurchaseFlow] requestPurchase failed:", error);
        setIsProcessing(false);
        toast.error(t("admin.purchaseRequestFailed"));
      });
    },
    [t, requestPurchase]
  );

  const isMerchantUser = useMemo(() => {
    return userProfile && userProfile.verifiedStatus === "VERIFIED";
  }, [userProfile]);

  const fetchListings = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setUserListingsLoading(true);
    }
    setUserListingsError(null);
    try {
      const data = await ListingsApi.getUserListings();
      setUserListings(data || []);
    } catch (e) {
      console.error("Error fetching listings:", e);
      setUserListingsError(t("admin.failedToRefreshProducts"));
    } finally {
      setUserListingsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchListings();
    clearEditData();
    resetForm();
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: { backgroundColor: "#0a0a0a" },
      title: t("admin.myListings"),
      headerBackButtonDisplayMode: "minimal",
      headerTitleStyle: {
        color: "#ffffff",
      },
      headerTitleAlign: "center",
      headerTintColor: "#ffffff",
    });
  }, [navigation, t]);

  const listingCount = userListings.length;
  const isAtLimit = !isMerchantUser && listingCount >= FREE_LISTING_LIMIT;
  const remainingListings = Math.max(0, FREE_LISTING_LIMIT - listingCount);

  const handleDelete = (item: any) => {
    Alert.alert(
      t("admin.deleteListing"),
      t("admin.deleteListingConfirm", { title: item.title }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: () => deleteListing(item.id),
        },
      ]
    );
  };

  const handleEdit = (item: any) => {
    setEditData(item);
    navigation.navigate("ListingForm", {
      edit: true,
      item: item,
    });
  };

  const handleRefresh = () => {
    fetchListings(true);
  };

  const handleAddListing = () => {
    if (isAtLimit) {
      setShowUpgradeModal(true);
    } else {
      navigation.navigate("SelectCategory");
    }
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(false);
    navigation.navigate("PremiumUpgrade");
  };

  if (userListingsLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={"#c1fe00"} />
          <Text style={styles.loadingText}>
            {t("admin.loadingYourListings")}
          </Text>
        </View>
      </View>
    );
  }

  if (userListingsError) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
        <View style={styles.center}>
          <Package size={48} color="#666" />
          <Text style={styles.errorText}>{userListingsError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchListings()}
          >
            <Text style={styles.retryButtonText}>{t("admin.tryAgain")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {isProcessing && (
        <ActivityIndicator
          style={styles.loadingIndicator}
          size="large"
          color={"#c1fe00"}
        />
      )}

      {/* Listings */}
      <LegendList
        ListHeaderComponent={
          <AnimatedView animation="slide-up" delay={0}>
            <View style={styles.counterContainer}>
              <View style={styles.counterCard}>
                <View style={styles.counterRow}>
                  <Package size={20} color={"#c1fe00"} />
                  <Text style={styles.counterTitle}>
                    {t("admin.activeListings")}
                  </Text>
                  <Text style={styles.counterValue}>{userListings.length}</Text>
                </View>
                <View style={styles.counterRow}>
                  <Crown
                    size={16}
                    color={isMerchantUser ? "#c1fe00" : "#666"}
                  />
                  <Text style={styles.counterSubtitle}>
                    {isMerchantUser
                      ? t("admin.premiumUnlimited")
                      : t("admin.freeRemaining").replace(
                          "{count}",
                          remainingListings.toString()
                        )}
                  </Text>
                </View>
              </View>
            </View>
          </AnimatedView>
        }
        recycleItems
        data={userListings}
        renderItem={({ item }) => (
          <DynamicListingCard
            item={item}
            onDeletePressed={() => handleDelete(item)}
            onEditPressed={() => handleEdit(item)}
            onHighlightingPressed={() => handlePurchase(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          userListings.length === 0 && styles.emptyContainer,
        ]}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Package size={64} color="#666" />
            <Text style={styles.emptyTitle}>{t("admin.noListingsYet")}</Text>
            <Text style={styles.emptySubtitle}>
              {isMerchantUser
                ? t("admin.createFirstListingSubscribed")
                : t("admin.createFirstListingFree")}
            </Text>
            <TouchableOpacity
              style={[styles.createButton, isAtLimit && styles.disabledButton]}
              onPress={handleAddListing}
              disabled={isAtLimit}
            >
              <Text
                style={[
                  styles.createButtonText,
                  isAtLimit && styles.disabledButtonText,
                ]}
              >
                {isAtLimit ? t("admin.limitReached") : t("admin.createListing")}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Upgrade Modal */}
      <Modal
        visible={showUpgradeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={styles.upgradeModalOverlay}>
          <View style={styles.upgradeModalContent}>
            <View style={styles.upgradeModalHeader}>
              <Crown size={32} color={"#c1fe00"} />
              <Text style={styles.upgradeModalTitle}>
                {t("admin.upgradeToPremium")}
              </Text>
            </View>

            <Text style={styles.upgradeModalSubtitle}>
              {t("admin.reachedLimitFreeListings", {
                limit: FREE_LISTING_LIMIT,
              })}
            </Text>

            <View style={styles.upgradeFeatures}>
              <View style={styles.featureItem}>
                <Check size={20} color={"#c1fe00"} />
                <Text style={styles.featureText}>
                  {t("admin.unlimitedProductListings")}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={20} color={"#c1fe00"} />
                <Text style={styles.featureText}>
                  {t("admin.priorityCustomerSupport")}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={20} color={"#c1fe00"} />
                <Text style={styles.featureText}>
                  {t("admin.advancedAnalyticsInsights")}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Check size={20} color={"#c1fe00"} />
                <Text style={styles.featureText}>
                  {t("admin.featuredPlacementOptions")}
                </Text>
              </View>
            </View>

            <View style={styles.upgradeModalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowUpgradeModal(false)}
              >
                <Text style={styles.cancelButtonText}>
                  {t("admin.maybeLater")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={handleUpgrade}
              >
                <Text style={styles.upgradeButtonText}>
                  {t("admin.upgradeNow")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  loadingIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  headerSpacer: {
    width: 40,
  },
  counterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  counterCard: {
    backgroundColor: "#181818",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(193,254,0,0.2)",
  },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  counterTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  counterValue: {
    color: "#c1fe00",
    fontSize: 20,
    fontWeight: "bold",
  },
  counterSubtitle: {
    color: "#888",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },

  listContainer: {},
  emptyContainer: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0a0a0a",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#c1fe00",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#0a0a0a",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  createButton: {
    backgroundColor: "#c1fe00",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: "#333",
  },
  createButtonText: {
    color: "#0a0a0a",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButtonText: {
    color: "#666",
  },
  upgradeModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  upgradeModalContent: {
    backgroundColor: "#181818",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderColor: "rgba(193,254,0,0.2)",
  },
  upgradeModalHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  upgradeModalTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
  },
  upgradeModalSubtitle: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  upgradeFeatures: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 12,
  },
  upgradeModalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#333",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  upgradeButton: {
    flex: 1,
    backgroundColor: "#c1fe00",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  upgradeButtonText: {
    color: "#0a0a0a",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default MyListingsScreen;
