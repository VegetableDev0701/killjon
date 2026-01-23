import { useQuery } from "@apollo/client/react";
import { LegendList, LegendListRenderItemProps } from "@legendapp/list";
import {
  Building2,
  Car,
  ChevronLeft,
  Filter,
  Heart,
  ShoppingBag,
  X,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedScreen } from "../components/animated";
import { CardSkeleton } from "../components/chat/CardSkeleton";
import DynamicListingCard from "../components/chat/DynamicListingCard";
import ResultCard from "../components/chat/ResultCard";
import {
  GET_ITEMS_BY_CATEGORY_AND_HIDS,
  GET_ITEMS_BY_LISTING_IDS,
} from "../graphql";
import { NavigationProps } from "../navigation/navigationTypes";
import { FavoriteItem, useChatStore } from "../store/chatStore";
import { getQueryCategory } from "../utils/constants";

export default function FavoritesScreen({
  navigation,
}: NavigationProps<"Favorites">) {
  const { t } = useTranslation();
  const { favorites, fetchFavorites, isLoadingFavorites } = useChatStore();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    listingProducts,
    scrapedVehicles,
    scrapedProducts,
    scrapedRealEstate,
  } = useMemo(() => {
    const listingProducts: string[] = [];
    const scrapedProducts: string[] = [];
    const scrapedRealEstate: string[] = [];
    const scrapedVehicles: string[] = [];

    // Fixed: Add null check and ensure favorites is array
    if (Array.isArray(favorites) && favorites.length > 0) {
      favorites.forEach((favorite: FavoriteItem) => {
        const { id, type, category } = favorite;
        if (type === 1) {
          listingProducts.push(id);
        } else if (type === 2 && category === "products") {
          scrapedProducts.push(id);
        } else if (type === 2 && category === "real_estate") {
          scrapedRealEstate.push(id);
        } else if (type === 2 && category === "vehicles") {
          scrapedVehicles.push(id);
        }
      });
    }

    return {
      listingProducts,
      scrapedProducts,
      scrapedRealEstate,
      scrapedVehicles,
    };
  }, [favorites]);

  // GraphQL queries with better error handling
  const {
    data: scrapedProductsData,
    loading: scrapedProductsLoading,
    refetch: refetchScrapedProducts,
  } = useQuery(GET_ITEMS_BY_CATEGORY_AND_HIDS, {
    variables: {
      category: getQueryCategory("products"),
      hids: scrapedProducts,
    },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: false,
    skip: scrapedProducts.length === 0,
    errorPolicy: "all",
  });

  const {
    data: scrapedVehiclesData,
    loading: scrapedVehiclesLoading,
    refetch: refetchScrapedVehicles,
  } = useQuery(GET_ITEMS_BY_CATEGORY_AND_HIDS, {
    variables: {
      category: getQueryCategory("vehicles"),
      hids: scrapedVehicles,
    },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: false,
    skip: scrapedVehicles.length === 0,
    errorPolicy: "all",
  });

  const {
    data: scrapedRealEstateData,
    loading: scrapedRealEstateLoading,
    refetch: refetchScrapedRealEstate,
  } = useQuery(GET_ITEMS_BY_CATEGORY_AND_HIDS, {
    variables: {
      category: getQueryCategory("real_estate"),
      hids: scrapedRealEstate,
    },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: false,
    skip: scrapedRealEstate.length === 0,
    errorPolicy: "all",
  });

  const {
    data: listingData,
    loading: listingLoading,
    refetch: refetchListing,
  } = useQuery(GET_ITEMS_BY_LISTING_IDS, {
    variables: { listingIds: listingProducts },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: false,
    skip: listingProducts.length === 0,
    errorPolicy: "all",
  });

  const handleRefresh = useCallback(async () => {
    try {
      setLoading(true);
      await fetchFavorites();
      // Fixed: Add refetch for all queries
      if (listingProducts.length > 0) {
        await refetchListing();
      }
      if (scrapedProducts.length > 0) {
        await refetchScrapedProducts();
      }
      if (scrapedVehicles.length > 0) {
        await refetchScrapedVehicles();
      }
      if (scrapedRealEstate.length > 0) {
        await refetchScrapedRealEstate();
      }
    } catch (error) {
      console.error("Error refreshing favorites:", error);
    } finally {
      setLoading(false);
    }
  }, [
    fetchFavorites,
    listingProducts.length,
    scrapedProducts.length,
    scrapedVehicles.length,
    scrapedRealEstate.length,
    refetchListing,
    refetchScrapedProducts,
    refetchScrapedVehicles,
    refetchScrapedRealEstate,
  ]);

  const categories = [
    { id: "all", label: t("favorites.all"), icon: null },
    { id: "vehicles", label: t("favorites.vehicles"), icon: Car },
    { id: "products", label: t("favorites.products"), icon: ShoppingBag },
    { id: "real_estate", label: t("favorites.properties"), icon: Building2 },
  ];

  const listHeader = useCallback(() => {
    return (
      <View style={styles.filterContainer}>
        <AnimatedScreen animationType="slide" duration={800} direction="up">
          <View className="flex-row flex-wrap gap-2">
            {categories.map(({ id, label, icon: Icon }) => (
              <TouchableOpacity
                key={id || "all"}
                onPress={() => {
                  setSelectedCategory(id);
                  setShowFilters(false);
                }}
                style={[
                  styles.categoryButton,
                  selectedCategory === id
                    ? styles.categoryButtonActive
                    : styles.categoryButtonInactive,
                ]}
              >
                {Icon && (
                  <Icon
                    size={18}
                    color={selectedCategory === id ? "#000" : "#c1fe00"}
                  />
                )}
                <Text
                  className={`ml-2 font-medium ${
                    selectedCategory === id ? "text-black" : "text-primary"
                  }`}
                >
                  {label}
                </Text>
                {selectedCategory === id && (
                  <TouchableOpacity
                    onPress={() => setSelectedCategory("all")}
                    className="ml-2 rounded-full bg-black/10 p-1"
                  >
                    <X size={14} color="#000" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </AnimatedScreen>
      </View>
    );
  }, [
    showFilters,
    selectedCategory,
    setShowFilters,
    setSelectedCategory,
    categories,
  ]);

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center px-4 py-8">
      <View className="items-center">
        <View className="mb-6 h-24 w-24 items-center justify-center rounded-2xl bg-[#232323]/80">
          <Heart size={40} color="#c1fe00" />
        </View>
        <Text className="mb-3 text-center text-xl font-semibold text-foreground">
          {selectedCategory
            ? t("favorites.noFavoritesInCategory", {
                category: selectedCategory,
              })
            : t("favorites.noFavoritesYet")}
        </Text>
        <Text className="px-8 text-center text-base leading-6 text-gray-400">
          {selectedCategory
            ? t("favorites.categoryFavoritesDescription", {
                category: selectedCategory,
              })
            : t("favorites.favoritesDescription")}
        </Text>
      </View>
    </View>
  );

  const renderItem = useCallback(
    ({ item }: LegendListRenderItemProps<FavoriteItem>) => {
      try {
        if (item.type === 1) {
          const data = listingData?.getListingsByIds?.items?.find(
            (l: any) => l.id === item.id
          );
          if (!data) return <CardSkeleton variant="listing" />;
          return <DynamicListingCard item={data} />;
        } else if (item.type === 2) {
          // Fixed: Add null safety checks
          const allScrapedData = [
            ...(scrapedProductsData?.getItemsByCategoryAndHids || []),
            ...(scrapedVehiclesData?.getItemsByCategoryAndHids || []),
            ...(scrapedRealEstateData?.getItemsByCategoryAndHids || []),
          ];

          const data = allScrapedData.find((d: any) => d?.hid === item.id);
          if (!data) return <CardSkeleton variant="result" />;
          return <ResultCard item={data} categoryy={item.category} />;
        }
        return null;
      } catch (error) {
        console.error("Error rendering item:", error);
        return null;
      }
    },
    [
      listingData,
      scrapedProductsData,
      scrapedVehiclesData,
      scrapedRealEstateData,
    ]
  );

  const isLoading =
    isLoadingFavorites ||
    scrapedProductsLoading ||
    scrapedVehiclesLoading ||
    scrapedRealEstateLoading ||
    listingLoading;

  return (
    <LinearGradient
      colors={["#0a0a0a", "#0f0f0f", "#0a0a0a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <AnimatedScreen animationType="stagger" staggerItems={6}>
          <View style={styles.headerContainer}>
            <View style={styles.headerGradient} />

            <View style={styles.headerTop}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <ChevronLeft size={20} color="#c1fe00" />
                <Text className="ml-1 text-lg font-semibold text-foreground">
                  {t("favorites.title")}
                </Text>
              </TouchableOpacity>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={() => setShowFilters(!showFilters)}
                  style={[
                    styles.filterButton,
                    showFilters
                      ? styles.filterButtonActive
                      : styles.filterButtonInactive,
                  ]}
                >
                  <Filter size={18} color={showFilters ? "#000" : "#c1fe00"} />
                  <Text
                    className={`ml-2 font-medium ${
                      showFilters ? "text-black" : "text-primary"
                    }`}
                  >
                    {t("favorites.filter")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <LegendList<FavoriteItem>
            data={favorites.filter(
              (item) =>
                selectedCategory === "all" || item.category === selectedCategory
            )}
            renderItem={renderItem}
            extraData={[
              listingData,
              scrapedProductsData,
              scrapedVehiclesData,
              scrapedRealEstateData,
            ]}
            keyExtractor={(item) => `${item.id}-${item.type}`} // Fixed: More unique key
            ListEmptyComponent={!isLoading ? renderEmpty : null}
            ListHeaderComponent={showFilters ? listHeader : undefined}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={handleRefresh}
                tintColor="#c1fe00"
                colors={["#c1fe00"]}
                progressBackgroundColor="#232323"
              />
            }
          />
        </AnimatedScreen>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(35, 35, 35, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    backgroundColor: "rgba(35, 35, 35, 0.8)",
    padding: 10,
    borderRadius: 12,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  filterButtonActive: {
    backgroundColor: "#c1fe00",
  },
  filterButtonInactive: {
    backgroundColor: "rgba(35, 35, 35, 0.8)",
  },
  statsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(35, 35, 35, 0.3)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  filterContainer: {
    backgroundColor: "rgba(35, 35, 35, 0.8)",
    borderRadius: 16,
    padding: 12,
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 6,
  },
  categoryButtonActive: {
    backgroundColor: "#c1fe00",
  },
  categoryButtonInactive: {
    backgroundColor: "rgba(35, 35, 35, 0.8)",
  },
  modalOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  modalContent: {
    backgroundColor: "#181818",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#232323",
  },
});
