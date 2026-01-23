import { useQuery } from "@apollo/client/react";
import BottomSheet, { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { LegendListRef } from "@legendapp/list";
import { MenuAction, MenuView } from "@react-native-menu/menu";
import { useIsFocused } from "@react-navigation/native";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpDown,
  Car,
  ChevronLeft,
  Home,
  ShoppingBag,
  Sliders,
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import {
  runOnJS,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CardSkeleton } from "../components/chat/CardSkeleton";
import DynamicListingCard from "../components/chat/DynamicListingCard";
import ResultCard from "../components/chat/ResultCard";
import FiltersBottomSheet from "../components/FiltersBottomSheet";
import Loading from "../components/Loading";
import { AndroidMenuPicker, AndroidMenuPickerRef } from "../components/ui";
import {
  GET_ITEMS_BY_CATEGORY_AND_HIDS,
  GET_ITEMS_BY_LISTING_IDS,
} from "../graphql";
import { NavigationProps } from "../navigation/navigationTypes";
import { ApiService } from "../services/apiService";
import { Product } from "../types/api.types";
import { getQueryCategory } from "../utils/constants";
import { customMapStyle, geocodeLocation } from "../utils/geocoding";
import { LiquidGlassContainer, liquidGlassProps } from "../utils/liquidGlass";

const ITEMS_PER_BATCH = 25;
const MIN_OFFSET_KM = 0.2;
const MAX_OFFSET_KM = 1.0;
const KM_TO_DEGREES = 1 / 111;
const MIN_COVERAGE = 0.1; // 10% minimum coverage for filters

// Utility functions moved outside component
const extractCoordinates = (item: any) => {
  // Direct coordinates
  if (
    item.coordinates?.latitude &&
    item.coordinates?.longitude &&
    !isNaN(item.coordinates.latitude) &&
    !isNaN(item.coordinates.longitude)
  ) {
    return item.coordinates;
  }

  // Location object coordinates
  if (item.location?.coordinates?.lat && item.location.coordinates.lng) {
    return {
      latitude: item.location.coordinates.lat,
      longitude: item.location.coordinates.lng,
    };
  }

  // Geocoded coordinates
  const locationString =
    typeof item?.location === "string" ? item.location : item?.city || "";

  if (locationString) {
    const geocodedCoords = geocodeLocation(locationString);
    if (geocodedCoords) {
      return {
        latitude: geocodedCoords.latitude,
        longitude: geocodedCoords.longitude,
        wasGeocoded: true,
        originalLocation: locationString,
        geocodedCity: geocodedCoords.city,
        geocodedProvince: geocodedCoords.province,
      };
    }
  }

  return null;
};

const addFilterOption = (
  options: any,
  key: string,
  values: any[],
  count: number
) => {
  const uniqueValues = Array.from(new Set(values.filter(Boolean)));
  if (uniqueValues.length > 0 && values.length / count >= MIN_COVERAGE) {
    options[key] = uniqueValues;
  }
};

const SeeMoreScreen = ({ navigation, route }: NavigationProps<"SeeMore">) => {
  const { searchId, category } = route.params;
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const flatListRef = useRef<LegendListRef>(null);
  const isLoadingMoreRef = useRef(false);
  const androidMenuRef = useRef<AndroidMenuPickerRef>(null);

  // Local state for efficient item management
  const [refreshing, setRefreshing] = useState(false);
  const [loadedItems, setLoadedItems] = useState<Record<string, any>>({});

  // Filter bottom sheet state
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>({});

  // Sort state
  const [sortOption, setSortOption] = useState<string>("default");
  const [showMap, setShowMap] = useState(false);

  // Bottom sheet state
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["10%", "50%", "90%", "100%"], []);
  const [currentSnapIndex, setCurrentSnapIndex] = useState(2); // Start at 100% (full screen)
  const [bottomSheetMounted, setBottomSheetMounted] = useState(false);
  const hasDragged = useRef(false);
  const animatedPosition = useSharedValue(0);

  // Infinite query for product listing
  const {
    data: productList,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch: refetchProductList,
  } = useInfiniteQuery({
    queryKey: ["product-listing", searchId, sortOption],
    queryFn: async ({ pageParam = 1 }) => {
      const sortDirection =
        sortOption === "price_low_high"
          ? "ASC"
          : sortOption === "price_high_low"
            ? "DESC"
            : undefined;

      return await ApiService.search.getBySearchId(
        searchId,
        pageParam,
        ITEMS_PER_BATCH,
        sortDirection
      );
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        const currentPage = Number(lastPage.page);
        return currentPage + 1;
      }
      return undefined;
    },
    refetchOnMount: "always",
    enabled: !!searchId,
    subscribed: useIsFocused(),
  });

  // Memoized all product IDs to avoid recalculating on every render
  const allProductIds = useMemo(
    () => productList?.pages.flatMap((page) => page.productResults) || [],
    [productList]
  );

  // Calculate which HIDs to fetch for current batch - Fixed to handle all pages
  const { listingProducts, scrapedProducts } = useMemo(() => {
    const listingProducts: string[] = [];
    const scrapedProducts: string[] = [];

    // just the last one
    const lastPage =
      productList?.pages[productList?.pages.length - 1]?.productResults;
    if (lastPage) {
      lastPage.forEach((product: Product) => {
        const { id, type } = product;
        if (type === 1) {
          listingProducts.push(id);
        } else if (type === 2) {
          scrapedProducts.push(id);
        }
      });
    }

    return { listingProducts, scrapedProducts };
  }, [productList]);

  // GraphQL queries with better error handling
  const { data: scrapedData } = useQuery(GET_ITEMS_BY_CATEGORY_AND_HIDS, {
    variables: {
      category: getQueryCategory(category),
      hids: scrapedProducts,
    },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: false,
    skip: scrapedProducts.length === 0,
    errorPolicy: "all",
  });

  const { data: listingData } = useQuery(GET_ITEMS_BY_LISTING_IDS, {
    variables: { listingIds: listingProducts },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: false,
    skip: listingProducts.length === 0,
    errorPolicy: "all",
  });

  // Optimized effect to merge new items - Fixed to prevent overwrites
  useEffect(() => {
    if (
      scrapedData?.getItemsByCategoryAndHids ||
      listingData?.getListingsByIds
    ) {
      const newScraped = scrapedData?.getItemsByCategoryAndHids;
      const newListings = listingData?.getListingsByIds?.items;

      setLoadedItems((prev) => {
        const updated = { ...prev };
        let hasChanges = false;

        if (newScraped?.length > 0) {
          newScraped.forEach((item: any) => {
            if (item?.hid && !updated[item.hid]) {
              updated[item.hid] = {
                ...item,
                type: 2,
              };
              hasChanges = true;
            }
          });
        }

        if (newListings?.length > 0) {
          newListings.forEach((item: any) => {
            if (item?.id && !updated[item.id]) {
              updated[item.id] = {
                ...item,
                type: 1,
              };
              hasChanges = true;
            }
          });
        }

        return hasChanges ? updated : prev;
      });
    }
  }, [scrapedData, listingData, refreshing]);

  // Fixed filtering logic - Main bug fix
  const filteredItems: Product[] = useMemo(() => {
    // If no filters are active, return all product IDs
    if (!Object.keys(activeFilters).length) {
      return allProductIds;
    }

    const itemsArr = Object.values(loadedItems);
    if (itemsArr.length === 0) {
      return allProductIds;
    }

    // Filter loaded items and return their IDs
    const filtered = itemsArr
      .filter((item) => {
        if (!item) return false;

        // Check each active filter
        for (const key in activeFilters) {
          const filterValue = activeFilters[key];

          if (
            !filterValue ||
            (Array.isArray(filterValue) && filterValue.length === 0)
          ) {
            continue;
          }

          const itemValue = item[key];

          // Handle range filters for numeric properties
          if (
            Array.isArray(filterValue) &&
            filterValue.length === 2 &&
            [
              "year",
              "price",
              "mileage_value",
              "passengers",
              "bedrooms",
              "bathrooms",
              "area",
            ].includes(key)
          ) {
            const [min, max] = filterValue;
            if (itemValue === undefined || itemValue === null) return false;

            const numValue =
              typeof itemValue === "string" ? parseFloat(itemValue) : itemValue;
            if (isNaN(numValue) || numValue < min || numValue > max)
              return false;
          }
          // Handle array filters (multi-select)
          else if (Array.isArray(filterValue)) {
            if (!filterValue.includes(itemValue)) return false;
          }
          // Handle single value filters
          else {
            if (itemValue !== filterValue) return false;
          }
        }
        return true;
      })
      .map((item) => ({
        id: item.type === 1 ? item.id : item.hid,
        type: item.type,
      }));

    return filtered.length > 0 ? filtered : [];
  }, [activeFilters, loadedItems, allProductIds]);

  const sortedFilteredItems: Product[] = useMemo(() => {
    // Return early if using server-sorted options
    if (["default", "price_low_high", "price_high_low"].includes(sortOption)) {
      return filteredItems;
    }

    // Sort client-side based on `updated_at`
    const itemsToSort = filteredItems
      .map((item) => loadedItems[item.id])
      .filter(Boolean); // Remove any undefined from map

    // Fixed sorting logic - was not actually sorting
    const sorted = [...itemsToSort].sort((a, b) => {
      const yearA = parseInt(a.updated_at) || 0;
      const yearB = parseInt(b.updated_at) || 0;

      if (sortOption === "year_new_old") {
        return yearB - yearA;
      } else if (sortOption === "year_old_new") {
        return yearA - yearB;
      }

      return 0; // fallback for unrecognized sortOption
    });

    // Only return id and type in the correct structure
    return sorted.map((item) => ({
      id: item.type === 1 ? item.id : item.hid,
      type: item.type,
    }));
  }, [filteredItems, loadedItems, sortOption]);

  // Optimized map items calculation with better coordinate handling
  const mapItems = useMemo(() => {
    const itemsWithCoordinates: Record<string, any> = {};
    const coordCount: Record<string, number> = {};

    // First pass: count coordinates
    sortedFilteredItems.forEach((p) => {
      const item = loadedItems[p.id];
      if (!item) return;
      const coordinates = extractCoordinates(item);
      if (coordinates) {
        const key = `${coordinates.latitude.toFixed(
          5
        )},${coordinates.longitude.toFixed(5)}`;
        coordCount[key] = (coordCount[key] || 0) + 1;
      }
    });

    // Second pass: assign coordinates with offsets
    const coordSeen: Record<string, number> = {};

    sortedFilteredItems.forEach((p) => {
      const item = loadedItems[p.id];
      if (!item) return;
      const coordinates = extractCoordinates(item);
      if (!coordinates) return;

      const key = `${coordinates.latitude.toFixed(
        5
      )},${coordinates.longitude.toFixed(5)}`;
      let offsetIndex = 0;

      if (coordCount[key] > 1) {
        coordSeen[key] = (coordSeen[key] || 0) + 1;
        offsetIndex = coordSeen[key] - 1;
      }

      let { latitude: lat, longitude: lng } = coordinates;

      if (offsetIndex > 0) {
        const angle = Math.random() * 2 * Math.PI;
        const distanceKm =
          MIN_OFFSET_KM + Math.random() * (MAX_OFFSET_KM - MIN_OFFSET_KM);
        const offsetLat = Math.cos(angle) * distanceKm * KM_TO_DEGREES;
        const offsetLng =
          (Math.sin(angle) * distanceKm * KM_TO_DEGREES) /
          Math.cos((lat * Math.PI) / 180);
        lat += offsetLat;
        lng += offsetLng;
      }

      itemsWithCoordinates[item.id] = {
        ...item,
        coordinates: { latitude: lat, longitude: lng },
        wasGeocoded: coordinates.wasGeocoded,
        originalLocation: coordinates.originalLocation,
        geocodedCity: coordinates.geocodedCity,
        geocodedProvince: coordinates.geocodedProvince,
      };
    });

    return itemsWithCoordinates;
  }, [sortedFilteredItems, loadedItems]);

  // Optimized load more handler
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isLoadingMoreRef.current) {
      isLoadingMoreRef.current = true;
      fetchNextPage().finally(() => {
        isLoadingMoreRef.current = false;
      });
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Optimized refresh handler
  const handleRefresh = useCallback(async () => {
    if (!searchId) return;

    setRefreshing(true);
    try {
      setSortOption("default");
      setActiveFilters({});
      await Promise.all([
        refetchProductList(),
        // refetchScraped(),
        // refetchListing(),
      ]);
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  }, [searchId, refetchProductList]);

  const keyExtractor = useCallback(
    (item: Product, index: number) => `${item.id}-${index}`,
    []
  );

  const memoizedRenderFooter = useCallback(() => {
    if (!hasNextPage) {
      return (
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            {isFetchingNextPage
              ? t("listingForm.loading")
              : t("listingForm.noMoreResults")}
          </Text>
        </View>
      );
    }

    if (isFetchingNextPage) {
      return (
        <View style={styles.footerContainer}>
          <ActivityIndicator size="small" color="#c1fe00" />
          <Text style={styles.footerText}>{t("seeMore.loadingMore")}</Text>
        </View>
      );
    }

    return null;
  }, [hasNextPage, isFetchingNextPage, t]);

  // Optimized filter options calculation
  const filterOptions = useMemo(() => {
    const itemsArr = Object.values(loadedItems);
    if (!itemsArr.length) return {};

    const count = itemsArr.length;
    const options: any = {};

    // Category-specific filters
    if (category === "vehicles") {
      addFilterOption(
        options,
        "brand",
        itemsArr.map((i) => i.brand),
        count
      );
      addFilterOption(
        options,
        "year",
        itemsArr.map((i) => i.year),
        count
      );
      addFilterOption(
        options,
        "fuel_type",
        itemsArr.map((i) => i.fuel_type),
        count
      );
      addFilterOption(
        options,
        "transmission",
        itemsArr.map((i) => i.transmission),
        count
      );
      addFilterOption(
        options,
        "city",
        itemsArr.map((i) => i.city),
        count
      );
      addFilterOption(
        options,
        "province",
        itemsArr.map((i) => i.province),
        count
      );
      addFilterOption(
        options,
        "condition",
        itemsArr.map((i) => i.condition),
        count
      );
      addFilterOption(
        options,
        "exterior_color",
        itemsArr.map((i) => i.exterior_color),
        count
      );
      addFilterOption(
        options,
        "interior_color",
        itemsArr.map((i) => i.interior_color),
        count
      );
      addFilterOption(
        options,
        "traction",
        itemsArr.map((i) => i.traction),
        count
      );
    } else if (category === "products") {
      addFilterOption(
        options,
        "brand",
        itemsArr.map((i) => i.brand),
        count
      );
      addFilterOption(
        options,
        "category",
        itemsArr.map((i) => i.category),
        count
      );
      addFilterOption(
        options,
        "availability",
        itemsArr.map((i) => i.availability),
        count
      );
      addFilterOption(
        options,
        "location",
        itemsArr.map((i) => i.location),
        count
      );
      addFilterOption(
        options,
        "source",
        itemsArr.map((i) => i.source),
        count
      );
    } else if (category === "real_estate") {
      addFilterOption(
        options,
        "listing_type",
        itemsArr.map((i) => i.listing_type),
        count
      );
      addFilterOption(
        options,
        "bedrooms",
        itemsArr.map((i) => i.bedrooms),
        count
      );
      addFilterOption(
        options,
        "bathrooms",
        itemsArr.map((i) => i.bathrooms),
        count
      );
      addFilterOption(
        options,
        "location",
        itemsArr.map((i) =>
          typeof i.location === "object" && i.location?.display_name
            ? i.location.display_name
            : typeof i.location === "string"
              ? i.location
              : i.city || i.province || ""
        ),
        count
      );
      addFilterOption(
        options,
        "area",
        itemsArr.map((i) => i.area),
        count
      );
      addFilterOption(
        options,
        "source",
        itemsArr.map((i) => i.source),
        count
      );
    }

    return options;
  }, [loadedItems, category]);

  // Memoized counts for header
  const { visibleCount, categoryLabel } = useMemo(() => {
    const count = sortedFilteredItems.length;
    const label =
      category === "real_estate"
        ? "properties"
        : category === "vehicles"
          ? "vehicles"
          : category === "products"
            ? "products"
            : "results";
    return { visibleCount: count, categoryLabel: label };
  }, [sortedFilteredItems.length, category]);

  // Memoized sort actions
  const sortActions = useMemo(
    () => [
      {
        id: "default",
        title: t("seeMore.sort.default"),
        state: sortOption === "default" ? "on" : "off",
      },
      {
        id: "price_low_high",
        title: t("seeMore.sort.priceLowHigh"),
        state: sortOption === "price_low_high" ? "on" : "off",
      },
      {
        id: "price_high_low",
        title: t("seeMore.sort.priceHighLow"),
        state: sortOption === "price_high_low" ? "on" : "off",
      },
      {
        id: "year_new_old",
        title: t("seeMore.sort.yearNewOld"),
        state: sortOption === "year_new_old" ? "on" : "off",
      },
      {
        id: "year_old_new",
        title: t("seeMore.sort.yearOldNew"),
        state: sortOption === "year_old_new" ? "on" : "off",
      },
    ],
    [sortOption, t]
  );

  const handleSortPress = useCallback(
    ({ nativeEvent }: { nativeEvent: { event: string } }) => {
      setActiveFilters({});
      setSortOption(nativeEvent.event);
    },
    []
  );

  const handleMenuPress = useCallback(() => {
    if (Platform.OS === "android") {
      androidMenuRef.current?.show();
    }
  }, []);

  const renderEmptyState = useCallback(() => {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>{t("seeMore.noResultsFound")}</Text>
      </View>
    );
  }, [t]);

  const handleFilterClose = useCallback(() => {
    setFiltersVisible(false);
    setTimeout(() => {
      flatListRef?.current?.scrollToOffset({ offset: 0, animated: true });
    }, 500);
  }, []);

  const hasMapItems = Object.keys(mapItems).length > 0;
  const totalCount = productList?.pages[0]?.totalCount || 0;

  // Memoized map region for better performance
  const mapRegion = useMemo(() => {
    if (!hasMapItems) return null;
    const firstItem = Object.values(mapItems)[0];
    return {
      latitude: firstItem.coordinates.latitude,
      longitude: firstItem.coordinates.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }, [mapItems, hasMapItems]);

  // Handle sheet changes
  const handleSheetChanges = useCallback(
    (index: number) => {
      console.log("Sheet changed to index:", index);
      setCurrentSnapIndex(index);
      if (!bottomSheetMounted) {
        console.log("Bottom sheet mounted!");
        setBottomSheetMounted(true);
      }
    },
    [bottomSheetMounted]
  );

  // Handle animation changes
  const handleAnimate = useCallback(
    (fromIndex: number, toIndex: number) => {
      console.log("Animate from:", fromIndex, "to:", toIndex);
      // Show map when moving away from full screen positions (2 or 3)
      if (!showMap && fromIndex === 3 && toIndex < 3) {
        // User started dragging down from full screen
        console.log("Setting showMap to true!");
        setShowMap(true);
      }
    },
    [showMap]
  );

  // Handle marker press
  const handleMarkerPress = useCallback((e: any, item: any) => {
    if (e?.stopPropagation) {
      e.stopPropagation();
    }
    // Move to 12% to show map with selected item
    bottomSheetRef.current?.snapToIndex(0);
    navigation.navigate("ProductScrappedDetails", { item });
  }, [navigation]);

  // Map visibility logic
  useDerivedValue(() => {
    if (!hasDragged.current && animatedPosition.value > 0) {
      hasDragged.current = true;
      runOnJS(setShowMap)(true);
    }
  });

  // Memoized map markers for better performance
  const mapMarkers = useMemo(() => {
    if (!hasMapItems) return [];

    return Object.values(mapItems).map((item: any) => {
      const cat = item.category || category;
      const key = item.type === 1 ? item.id : item.hid;

      return (
        <Marker
          key={key}
          coordinate={item.coordinates}
          tracksViewChanges={false}
          calloutAnchor={{ x: -1000, y: -1000 }}
          onPress={(e) => handleMarkerPress(e, item)}
        >
          {cat === "vehicles" ? (
            <View style={styles.markerIconContainer}>
              <Car size={24} color="#c1fe00" />
            </View>
          ) : cat === "real_estate" ? (
            <View style={styles.markerIconContainer}>
              <Home size={24} color="#c1fe00" />
            </View>
          ) : (
            <View style={styles.markerIconContainer}>
              <ShoppingBag size={24} color="#c1fe00" />
            </View>
          )}
        </Marker>
      );
    });
  }, [mapItems, category, hasMapItems, handleMarkerPress]);

  // Show loading screen while initial data is being fetched
  if (isLoading && sortedFilteredItems.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={[styles.navHeader, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={navigation.goBack}
          >
            <ChevronLeft size={24} color="#c1fe00" />
          </TouchableOpacity>
          <Text style={styles.navTitle}>{t("seeMore.results")}</Text>
          <View style={styles.navActions} />
        </View>
        <Loading />
      </View>
    );
  }

  return (
    <View style={[styles.container]}>
      {/* Navigation Header */}
      <View style={[styles.navHeader, { paddingTop: insets.top }]}>
        <LiquidGlassContainer
          {...liquidGlassProps}
          style={styles.backButtonContainer}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={navigation.goBack}
          >
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
        </LiquidGlassContainer>
        {/* <Text style={styles.navTitle}>{t("seeMore.results")}</Text> */}
        <View style={styles.navActions}>
          {Platform.OS === "ios" ? (
            <MenuView
              title={t("seeMore.sortBy")}
              themeVariant="dark"
              onPressAction={handleSortPress}
              actions={sortActions as MenuAction[]}
            >
              <LiquidGlassContainer
                {...liquidGlassProps}
                style={styles.backButtonContainer}
              >
                <TouchableOpacity style={styles.navActionButton}>
                  <ArrowUpDown size={22} color="#fff" />
                </TouchableOpacity>
              </LiquidGlassContainer>
            </MenuView>
          ) : (
            <AndroidMenuPicker
              ref={androidMenuRef}
              title={t("seeMore.sortBy")}
              themeVariant="dark"
              onPressAction={handleSortPress}
              actions={sortActions.map((action) => ({
                id: action.id,
                title: action.title,
                state: action.state as "on" | "off",
                titleColor: action.state === "on" ? "#c1fe00" : "#FFF",
              }))}
            >
              <LiquidGlassContainer
                {...liquidGlassProps}
                style={styles.backButtonContainer}
              >
                <TouchableOpacity
                  style={styles.navActionButton}
                  onPress={handleMenuPress}
                >
                  <ArrowUpDown size={22} color="#fff" />
                </TouchableOpacity>
              </LiquidGlassContainer>
            </AndroidMenuPicker>
          )}
          <LiquidGlassContainer
            {...liquidGlassProps}
            style={styles.SlidersButtonContainer}
          >
            <TouchableOpacity
              style={styles.navActionButton}
              onPress={() => setFiltersVisible(true)}
            >
              <Sliders size={22} color="#fff" />
              {Object.keys(activeFilters).length > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {Math.min(Object.keys(activeFilters).length, 50)}
                    {Object.keys(activeFilters).length > 50 ? "+" : ""}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </LiquidGlassContainer>
        </View>
      </View>
      {/* Map View - Show when at lower positions */}
      {hasMapItems && mapRegion && (
        <MapView
          style={styles.mapView}
          initialRegion={mapRegion}
          region={mapRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
          loadingIndicatorColor="#c1fe00"
          customMapStyle={customMapStyle}
          userInterfaceStyle={"dark"}
        >
          {mapMarkers}
        </MapView>
      )}

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1} // Start at 100% (full screen)
        snapPoints={snapPoints}
        enableContentPanningGesture={true}
        enableHandlePanningGesture={true}
        onChange={handleSheetChanges}
        onAnimate={handleAnimate}
        animatedPosition={animatedPosition}
        handleIndicatorStyle={
          currentSnapIndex >= 2 ? styles.hiddenHandle : styles.handleIndicator
        }
        backgroundStyle={styles.bottomSheetBackground}
        enableOverDrag={false}
      >
        <View style={styles.topHeaderContent}>
          <Text style={styles.resultsCountText}>
            {`${t("seeMore.showing")} ${visibleCount} ${t(
              "seeMore.of"
            )} ${totalCount} ${categoryLabel}`}
          </Text>
        </View>
        <BottomSheetFlatList
          data={sortedFilteredItems}
          renderItem={({ item }) => {
            const data = loadedItems[item.id];
            if (!data)
              return (
                <CardSkeleton
                  variant={item?.type === 1 ? "listing" : "result"}
                />
              );

            if (item.type === 1) {
              return <DynamicListingCard item={data} shouldLogAnalytic />;
            } else {
              return (
                <ResultCard
                  item={data}
                  shouldLogAnalytic
                  categoryy={getQueryCategory(category)}
                />
              );
            }
          }}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={memoizedRenderFooter}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#c1fe00"
              colors={["#c1fe00"]}
            />
          }
        />
      </BottomSheet>

      {/* Filter Bottom Sheet */}
      <FiltersBottomSheet
        visible={filtersVisible}
        onClose={handleFilterClose}
        options={filterOptions}
        activeFilters={activeFilters}
        setActiveFilters={setActiveFilters}
        category={category}
        loadedItems={loadedItems}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  resultsCountContainer: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  resultsCountText: {
    color: "#c1fe00",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    position: "absolute",
    width: "100%",
    zIndex: 9999,
    backgroundColor: "transparent",
  },
  backButtonContainer: {
    borderRadius: 24,
    overflow: "hidden",
  },
  SlidersButtonContainer: {
    borderRadius: 24,
    overflow: "hidden",
    marginLeft: 12,
  },
  backButton: {
    padding: 12,
  },
  navTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    color: "#888",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "rgba(193,254,0,0.2)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c1fe00",
  },
  retryButtonText: {
    color: "#c1fe00",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  footerContainer: {
    padding: 16,
    alignItems: "center",
  },
  footerText: {
    color: "#888",
    fontSize: 14,
    marginTop: 8,
  },
  contentContainer: {
    flex: 1,
  },
  mapHeaderCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#111",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
    height: 260,
    position: "relative",
    zIndex: 100,
  },
  mapView: {
    flex: 1,
  },
  mapCloseButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 101,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: "#c1fe00",
    fontSize: 22,
    fontWeight: "bold",
  },
  markerIconContainer: {
    backgroundColor: "#000",
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: "#c1fe00",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  navActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  navActionButton: {
    padding: 12,
  },
  filterBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#c1fe00",
    borderRadius: 8,
    minWidth: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  filterBadgeText: {
    color: "#000",
    fontSize: 8,
    fontWeight: "bold",
  },
  mapContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: "rgba(193,254,0,0.18)",
    backgroundColor: "#181818",
  },
  bottomSheetBackground: {
    backgroundColor: "black",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: "#ccc",
    width: 40,
    height: 4,
  },
  hiddenHandle: {
    backgroundColor: "transparent",
    width: 0,
    height: 0,
  },
  topHeaderContent: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 25,
  },
});

export default SeeMoreScreen;
