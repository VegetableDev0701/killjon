import { isLiquidGlassSupported } from "@callstack/liquid-glass";
import { LegendList, LegendListRef } from "@legendapp/list";
import { AnimatedLegendList } from "@legendapp/list/reanimated";
import { BookOpen } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import assets from "../assets";
import { EmptyState } from "../components/EmptyState";
import { SkeletonItem } from "../components/animated/SkeletonLoader";
import { ArticleCard } from "../components/lab/ArticleCard";
import { BottomTabProps } from "../navigation/navigationTypes";
import { useArticles, useCategories } from "../services/labService";
import { HEADER_HEIGHT } from "../utils/constants";
import { LiquidGlassContainer } from "../utils/liquidGlass";

// ArticleCard Skeleton Component
const ArticleCardSkeleton = () => {
  return (
    <View
      className="mb-4 rounded-2xl border border-white/10 p-4"
      style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
    >
      {/* Category indicator */}
      <View className="mb-3 flex-row items-center">
        <SkeletonItem
          width={4}
          height={24}
          borderRadius={12}
          className="mr-3"
        />
        <SkeletonItem
          width={24}
          height={24}
          borderRadius={12}
          className="mr-1.5"
        />
        <SkeletonItem width={80} height={12} borderRadius={6} />
      </View>

      {/* Title */}
      <View className="mb-2">
        <SkeletonItem
          width="100%"
          height={16}
          borderRadius={4}
          className="mb-1.5"
        />
        <SkeletonItem width="70%" height={16} borderRadius={4} />
      </View>

      {/* Summary */}
      <View className="mb-3">
        <SkeletonItem
          width="100%"
          height={14}
          borderRadius={4}
          className="mb-1"
        />
        <SkeletonItem width="85%" height={14} borderRadius={4} />
      </View>

      {/* Footer */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <SkeletonItem
            width={60}
            height={12}
            borderRadius={6}
            className="mr-2"
          />
          <SkeletonItem width={70} height={12} borderRadius={6} />
        </View>

        <View className="flex-row items-center gap-3">
          <SkeletonItem width={40} height={12} borderRadius={6} />
          <SkeletonItem width={40} height={12} borderRadius={6} />
        </View>
      </View>
    </View>
  );
};

const NodoLabScreen = ({ navigation }: BottomTabProps<"LabsTab">) => {
  const { t, i18n } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  const categoryScrollRef = React.useRef<LegendListRef>(null);
  const articlesListRef = useRef<LegendListRef>(null);
  const scrollY = useSharedValue(0);

  const {
    data: categories = [],
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useCategories();

  const {
    data: articles = [],
    isLoading: articlesLoading,
    refetch: refetchArticles,
  } = useArticles();

  const language = i18n.language as "en" | "es";

  // Filter articles by selected category
  const filteredArticles = useMemo(() => {
    if (!selectedCategoryId) {
      return articles;
    }
    return articles.filter(
      (article) => article.categoryId === selectedCategoryId
    );
  }, [articles, selectedCategoryId]);

  // Create category lookup map
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => map.set(cat.id, cat));
    return map;
  }, [categories]);

  const handleRefresh = async () => {
    await Promise.all([refetchCategories(), refetchArticles()]);
  };

  useEffect(() => {
    scrollY.value = 0;
    setTimeout(() => {
      if (articlesListRef.current && filteredArticles.length > 0) {
        articlesListRef.current.scrollToOffset({
          offset: 0,
          animated: false,
        });
      }
    }, 100);
  }, [selectedCategoryId]);

  const renderMerchantItem = ({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) => {
    const category = categoryMap.get(item.categoryId);
    if (!category) return null;

    return (
      <ArticleCard
        index={index}
        article={item}
        category={category}
        onPress={() => handleArticlePress(item.id)}
        language={language}
      />
    );
  };

  const keyExtractor = useCallback((item: any) => item.id.toString(), []);

  const handleArticlePress = (articleId: string) => {
    navigation.navigate("ArticleDetail", { articleId });
  };

  const handleCategoryPress = useCallback((id: string, index: number) => {
    // Set null for "all" category to show all articles
    setSelectedCategoryId(id === "all" ? null : id);
    // Scroll to the selected category
    if (categoryScrollRef.current) {
      categoryScrollRef.current.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.5, // Center the selected item
      });
    }
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = event.nativeEvent;
      scrollY.value = contentOffset.y;
    },
    [scrollY]
  );

  const headerBackgroundStyle = useAnimatedStyle(() => {
    "worklet";
    const backgroundColorOpacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0],
      Extrapolation.CLAMP
    );

    return {
      backgroundColor:
        backgroundColorOpacity > 0 ? `rgba(255, 255, 255, 0.3)` : "transparent",
    };
  });

  const liquidGlassOpacityStyle = useAnimatedStyle(() => {
    "worklet";

    const glassOpacity = interpolate(
      scrollY.value,
      [0, 100],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity: glassOpacity,
    };
  });

  const categoryListBackgroundStyle = useAnimatedStyle(() => {
    "worklet";
    const backgroundColorOpacity = interpolate(
      scrollY.value,
      [0, 100],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      backgroundColor:
        backgroundColorOpacity > 0
          ? `rgba(50, 50, 50, ${backgroundColorOpacity * 0.5})`
          : "transparent",
    };
  });

  const categoryListGlassOpacityStyle = useAnimatedStyle(() => {
    "worklet";
    const glassOpacity = interpolate(
      scrollY.value,
      [0, 100],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity: glassOpacity,
    };
  });

  const articlesListContainerStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      flex: 1,
    };
  });

  const renderCategory = useCallback(
    ({
      item,
      index,
    }: {
      item: (typeof categoriesWithAll)[0];
      index: number;
    }) => {
      // For "all" category, check if selectedCategoryId is null
      const isActive =
        item.id === "all"
          ? selectedCategoryId === null
          : selectedCategoryId === item.id;
      const categoryName = language === "es" ? item.nameEs : item.name;

      return (
        <TouchableOpacity
          key={index}
          style={[styles.tab]}
          onPress={() => handleCategoryPress(item.id, index)}
          activeOpacity={0.7}
        >
          {/* <Text className="mr-1.5 text-base">{item.emoji}</Text> */}
          <Text style={[styles.tabText, isActive && styles.activeTabText]}>
            {categoryName}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedCategoryId, language, handleCategoryPress]
  );

  // Create categories list with "All Categories" at the beginning
  const categoriesWithAll = useMemo(() => {
    return [
      {
        id: "all",
        name: t("lab.allCategories"),
        nameEs: t("lab.allCategories"),
        emoji: "📚",
        color: "#c1fe00",
      },
      ...categories,
    ];
  }, [categories, t]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Image
          source={assets.animatedLogo}
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
          }}
          resizeMode="contain"
          fadeDuration={0}
        />
      ),
      headerTitleAlign: "center",
      headerShown: true,
      headerTransparent: true,
      headerStyle: { backgroundColor: "transparent" },
      // headerBackground: () => {
      //   return (
      //     <Animated.View style={[{ flex: 1 }, headerBackgroundStyle]}>
      //       {/* <Animated.View
      //         style={[
      //           {
      //             position: "absolute",
      //             bottom: 0,
      //             left: 0,
      //             right: 0,
      //             height: 56,
      //             backgroundColor: "yellow",
      //           },
      //           categoryListOpacityStyle,
      //         ]}
      //         pointerEvents="box-none"
      //       >
      //       </Animated.View> */}

      //       <Animated.View
      //         style={[
      //           {
      //             flex: 1,
      //             position: "absolute",
      //             top: 0,
      //             left: 0,
      //             right: 0,
      //             bottom: 0,
      //           },
      //           liquidGlassOpacityStyle,
      //         ]}
      //         pointerEvents="none"
      //       >
      //         <LiquidGlassContainer
      //           effect="regular"
      //           interactive={true}
      //           style={{ flex: 1 }}
      //         />
      //       </Animated.View>
      //     </Animated.View>
      //   );
      // },
    });
  }, [navigation, liquidGlassOpacityStyle, headerBackgroundStyle]);

  const renderEmptyState = useCallback(() => {
    return (
      <EmptyState
        title={
          selectedCategoryId
            ? t("lab.noArticlesInCategoryTitle")
            : t("lab.noArticlesTitle")
        }
        description={
          selectedCategoryId
            ? t("lab.noArticlesInCategoryDescription")
            : t("lab.noArticlesDescription")
        }
        icon={<BookOpen color="#666" size={64} strokeWidth={1.5} />}
      />
    );
  }, [selectedCategoryId, t]);

  const renderArticleSkeleton = useCallback(() => {
    return (
      <View style={styles.listContainer}>
        <View style={{ height: HEADER_HEIGHT + 56 + 15 }} />
        {Array.from({ length: 5 }, (_, index) => (
          <ArticleCardSkeleton key={`article-skeleton-${index}`} />
        ))}
      </View>
    );
  }, []);

  const isRefreshing = categoriesLoading || articlesLoading;

  return (
    <LinearGradient
      colors={["#0a0a0a", "#0f0f0f", "#0a0a0a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View className="flex-1 bg-[#0a0a0a]" style={{ flex: 1 }}>
        <Animated.View
          style={[
            {
              position: "absolute",
              left: 0,
              right: 0,
              height: HEADER_HEIGHT + 56,
              zIndex: 10,
              overflow: "hidden",
              paddingTop: HEADER_HEIGHT,
            },
            categoryListBackgroundStyle,
          ]}
        >
          <Animated.View
            style={[
              {
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              },
              categoryListGlassOpacityStyle,
            ]}
            pointerEvents="none"
          >
            <LiquidGlassContainer
              effect="regular"
              interactive={true}
              style={{ flex: 1 }}
            />
          </Animated.View>

          {/* Category list content */}
          <View style={{ flex: 1, zIndex: 1 }}>
            {categoriesLoading && categories.length === 0 ? (
              <View style={styles.tabsScrollContent}>
                {Array.from({ length: 5 }, (_, index) => (
                  <View
                    key={`category-skeleton-${index}`}
                    style={[
                      styles.tab,
                      { backgroundColor: "rgba(255,255,255,0.1)", width: 100 },
                    ]}
                  />
                ))}
              </View>
            ) : (
              <LegendList
                ref={categoryScrollRef}
                horizontal
                extraData={[selectedCategoryId]}
                data={categoriesWithAll}
                renderItem={renderCategory}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => i.toString()}
                contentContainerStyle={styles.tabsScrollContent}
              />
            )}
          </View>
        </Animated.View>

        <Animated.View style={articlesListContainerStyle}>
          {articlesLoading && articles.length === 0 ? (
            renderArticleSkeleton()
          ) : (
            <AnimatedLegendList
              ref={articlesListRef}
              data={filteredArticles}
              renderItem={renderMerchantItem}
              keyExtractor={keyExtractor}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              style={{ flex: 1 }}
              contentContainerStyle={[
                styles.listContainer,
                {
                  paddingTop: 15, // Spacing after header/category tabs
                  paddingBottom: isLiquidGlassSupported
                    ? HEADER_HEIGHT - bottom / 2
                    : HEADER_HEIGHT + bottom / 2,
                },
              ]}
              ListHeaderComponent={
                <View style={{ height: HEADER_HEIGHT + 56 }} />
              }
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmptyState}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor="#c1fe00"
                  colors={["#c1fe00"]}
                  progressBackgroundColor="#1a1a1a"
                />
              }
            />
          )}
        </Animated.View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabsScrollContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skeltonTabsScroll: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  tab: {
    //paddingHorizontal: 16,
    marginRight: 20,
    //borderRadius: 20,
    //backgroundColor: "#1a1a1a",
    //borderWidth: 1,
    //borderColor: "#333",
    height: 40,
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
  },
  activeTab: {
    //borderColor: "#c1fe00",
  },
  tabText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "500",
  },
  activeTabText: {
    //color: "#0a0a0a",
    color: "#c1fe00",
    fontWeight: "600",
  },
});

export default NodoLabScreen;
