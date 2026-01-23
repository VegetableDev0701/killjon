import { LegendList } from "@legendapp/list";
import {
  Book,
  Briefcase,
  Car,
  Dumbbell,
  GraduationCap,
  Hammer,
  HeartPulse,
  Home,
  Landmark,
  Monitor,
  PawPrint,
  Plus,
  Shirt,
  Sofa,
  Soup,
  Ticket,
  Wrench,
} from "lucide-react-native";
import React, { useEffect, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import assets from "../assets";
import { NavigationProps } from "../navigation/navigationTypes";
import { trackCategoryClick } from "../services/firebaseAnalyticsService";
import { Category } from "../services/listingsApi";
import { useAuthStore } from "../store/authStore";
import { useListingStore } from "../store/listingStore";

const CARD_BG = "#181818";
const CARD_BG_PRESSED = "#232323";

// Map category_key to Lucide icon component (including new categories)
const categoryIconMap: Record<string, React.ElementType> = {
  vehicles: Car,
  real_estate: Home,
  electronics: Monitor,
  foods: Soup,
  fashion: Shirt,
  furniture: Sofa,
  books: Book,
  sports: Dumbbell,
  services: Wrench,
  pets: PawPrint,
  jobs: Briefcase,
  collectibles: Landmark,
  health: HeartPulse,
  education: GraduationCap,
  events: Ticket,
  tools: Hammer,
  vehicle_parts: Wrench,
};

const SelectCategoryScreen = ({
  navigation,
}: NavigationProps<"SelectCategory">) => {
  const { t, i18n } = useTranslation();
  const {
    categories,
    categoriesLoading,
    categoriesError,
    fetchCategories,
    selectCategory,
  } = useListingStore();
  const { userProfile } = useAuthStore();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerStyle: { backgroundColor: "#0a0a0a" },
      title: t("admin.selectCategory"),
      headerBackButtonDisplayMode: "minimal",
      headerTitleStyle: {
        color: "#ffffff",
      },
      headerTitleAlign: "center",
      headerTintColor: "#ffffff",
    });
  }, [navigation, t]);

  useEffect(() => {
    if (!categories || categories.length === 0) {
      fetchCategories(i18n.language);
    }
  }, []);

  const handleCategorySelect = (category: Category) => {
    selectCategory(category);

    // Track category click event
    if (userProfile?.id) {
      trackCategoryClick(userProfile.id, category.display_name);
    }

    navigation.navigate("ListingForm", {});
  };

  if (categoriesLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
        <View style={styles.loadingContainer}>
          <Image source={assets.animatedLogo} style={styles.loadingLogo} />
          <Text style={styles.loadingText}>{t("admin.loadingCategories")}</Text>
        </View>
      </View>
    );
  }

  if (categoriesError) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{categoriesError}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchCategories(i18n.language)}
          >
            <Text style={styles.retryButtonText}>{t("admin.retry")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      {/* Categories List */}
      <LegendList
        recycleItems
        contentContainerStyle={styles.listContainer}
        data={categories}
        keyExtractor={(item) => item.category_key}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapperStyle}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const Icon = categoryIconMap[item.category_key];
          return (
            <TouchableOpacity
              style={styles.categoryCard}
              activeOpacity={0.5}
              onPress={() => handleCategorySelect(item)}
            >
              <View style={styles.categoryIconWrap}>
                {Icon ? (
                  <Icon color={"#c1fe00"} size={32} />
                ) : item.icon ? (
                  <Text style={styles.categoryIconText}>{item.icon}</Text>
                ) : (
                  <BoxIconFallback />
                )}
              </View>
              <Text style={styles.categoryName}>{item.display_name}</Text>
              <Text style={styles.categoryDescription}>{item.description}</Text>
              <View style={styles.plusWrap}>
                <Plus color={"#c1fe00"} size={22} />
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

// Fallback icon if category_key is not mapped
const BoxIconFallback = () => (
  <View style={styles.fallbackIconContainer}>
    <View style={styles.fallbackIcon} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
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
  columnWrapperStyle: {
    rowGap: 16,
    gap: 16,
    columnGap: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  categoryCard: {
    minHeight: 240,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  categoryCardPressed: {
    borderColor: "#c1fe00",
    backgroundColor: CARD_BG_PRESSED,
  },
  categoryIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    width: 40,
    height: 40,
  },
  categoryIconText: {
    fontSize: 32,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  categoryDescription: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  plusWrap: {
    backgroundColor: "#232323",
    borderRadius: 100,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: {
    height: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingLogo: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    textAlign: "center",
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
  fallbackIconContainer: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackIcon: {
    width: 22,
    height: 22,
    backgroundColor: "#333",
    borderRadius: 6,
  },
});

export default SelectCategoryScreen;
