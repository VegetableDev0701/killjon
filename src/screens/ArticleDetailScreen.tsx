import { Eye, Heart } from "lucide-react-native";
import React, { useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FastImage from "react-native-fast-image";
import LinearGradient from "react-native-linear-gradient";
import Markdown from "react-native-markdown-display";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { AnimatedScreen } from "../components/animated";
import { NavigationProps } from "../navigation/navigationTypes";
import {
  useArticles,
  useCategories,
  useLikeArticle,
  useViewArticle,
} from "../services/labService";
import { HEADER_HEIGHT } from "../utils/constants";
import { LiquidGlassContainer } from "../utils/liquidGlass";

const ArticleDetailScreen = ({
  navigation,
  route,
}: NavigationProps<"ArticleDetail">) => {
  const { t, i18n } = useTranslation();
  const { articleId } = route.params;

  const { data: articles = [], isLoading: articlesLoading } = useArticles();
  const { data: categories = [] } = useCategories();
  const language = i18n.language as "en" | "es";

  const { mutate: likeArticle } = useLikeArticle();
  const { mutate: viewArticle } = useViewArticle();
  const scrollY = useSharedValue(0);

  // Track article view when component mounts
  useEffect(() => {
    if (articleId) {
      viewArticle(articleId);
    }
  }, [articleId, viewArticle]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = event.nativeEvent;
      scrollY.value = contentOffset.y;
    },
    [scrollY]
  );

  const headerBackgroundStyle = useAnimatedStyle(() => {
    'worklet';
    const backgroundColorOpacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0],
      Extrapolation.CLAMP
    );

    return {
      backgroundColor: backgroundColorOpacity > 0
        ? `rgba(10, 10, 10, ${backgroundColorOpacity})`
        : 'transparent',
    };
  });

  const liquidGlassOpacityStyle = useAnimatedStyle(() => {
    'worklet';
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerStyle: { backgroundColor: "transparent" },
      title: t("lab.backToArticles"),
      headerBackButtonDisplayMode: "minimal",
      headerTitleAlign: "center",
      headerTitleStyle: {
        color: "#ffffff",
      },
      headerBackground: () => {
        return (
          <Animated.View style={[{ flex: 1 }, headerBackgroundStyle]}>
            <Animated.View
              style={[
                {
                  flex: 1,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                },
                liquidGlassOpacityStyle,
              ]}
              pointerEvents="none"
            >
              <LiquidGlassContainer
                effect="regular"
                interactive={true}
                style={{ flex: 1 }}
              />
            </Animated.View>
          </Animated.View>
        );
      },
    });
  }, [navigation, t, headerBackgroundStyle, liquidGlassOpacityStyle]);

  // Find the article
  const article = useMemo(() => {
    return articles.find((a) => a.id === articleId);
  }, [articles, articleId]);

  // Find the category
  const category = useMemo(() => {
    if (!article) return null;
    return categories.find((c) => c.id === article.categoryId);
  }, [article, categories]);

  const title = article ? article.title : "";
  const content = article ? article.content : "";

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Markdown styles
  const markdownStyles = {
    body: {
      color: "#ffffff",
      fontSize: 16,
      lineHeight: 24,
    },
    heading1: {
      color: "#ffffff",
      fontSize: 28,
      lineHeight: 28,
      fontWeight: "bold",
      marginTop: 16,
      marginBottom: 12,
    },
    heading2: {
      color: "#ffffff",
      fontSize: 24,
      fontWeight: "bold",
      marginTop: 16,
      marginBottom: 10,
    },
    heading3: {
      color: "#ffffff",
      fontSize: 20,
      fontWeight: "bold",
      marginTop: 14,
      marginBottom: 8,
    },
    paragraph: {
      color: "rgba(255,255,255,0.85)",
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 12,
    },
    strong: {
      color: "#ffffff",
      fontWeight: "bold",
    },
    em: {
      color: "#ffffff",
      fontStyle: "italic",
    },
    link: {
      color: "#c1fe00",
      textDecorationLine: "underline",
    },
    list_item: {
      color: "rgba(255,255,255,0.85)",
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 4,
    },
    bullet_list: {
      marginBottom: 12,
    },
    ordered_list: {
      marginBottom: 12,
    },
    code_inline: {
      backgroundColor: "rgba(255,255,255,0.1)",
      color: "#c1fe00",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontSize: 14,
      fontFamily: "Menlo, Monaco, monospace",
    },
    code_block: {
      backgroundColor: "rgba(255,255,255,0.05)",
      color: "#c1fe00",
      padding: 12,
      borderRadius: 8,
      fontSize: 14,
      fontFamily: "Menlo, Monaco, monospace",
      marginBottom: 12,
    },
    blockquote: {
      backgroundColor: "rgba(255,255,255,0.05)",
      borderLeftWidth: 4,
      borderLeftColor: "#c1fe00",
      paddingLeft: 12,
      paddingVertical: 8,
      marginBottom: 12,
    },
  };

  // Loading state
  if (articlesLoading) {
    return (
      <LinearGradient
        colors={["#0a0a0a", "#0f0f0f", "#0a0a0a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#c1fe00" />
          <Text className="mt-4 text-sm text-white/50">
            {t("lab.loadingArticles")}
          </Text>
        </View>
      </LinearGradient>
    );
  }

  // Article not found
  if (!article) {
    return (
      <LinearGradient
        colors={["#0a0a0a", "#0f0f0f", "#0a0a0a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <View className="flex-1 items-center justify-center px-6">
          <Text className="mb-4 text-center text-lg text-white/70">
            {t("lab.errorLoadingArticle")}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="rounded-full px-6 py-3"
            style={{ backgroundColor: "#c1fe00" }}
          >
            <Text className="text-sm font-bold text-black">
              {t("lab.backToArticles")}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#0a0a0a", "#0f0f0f", "#0a0a0a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: HEADER_HEIGHT + 15,
          paddingBottom: 40
        }}
      >
        <AnimatedScreen animationType="stagger" staggerItems={4}>
          {/* Category badge */}
          {category && (
            <View className="mb-4 mt-6 flex-row items-center">
              <View
                className="flex-row items-center rounded-full px-3 py-1.5"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: category.color }}
                >
                  {language === "es" ? category.nameEs : category.name}
                </Text>
              </View>
            </View>
          )}

          {/* Title */}
          <Text
            className="mb-4 text-3xl leading-10 text-white"
            style={{
              fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
            }}
          >
            {title}
          </Text>

          {article.imgsource && (
            <View className="mb-6 overflow-hidden rounded-2xl">
              <FastImage
                source={{
                  uri: article.imgsource,
                  priority: FastImage.priority.high,
                  cache: FastImage.cacheControl.web
                }}
                resizeMode={FastImage.resizeMode.cover}
                style={{
                  width: "100%",
                  height: 240,
                  backgroundColor: "rgba(255,255,255,0.05)"
                }}
              />
            </View>
          )}

          {/* Metadata */}
          <View className="mb-4 border-b border-white/10 pb-4">
            <View className="flex-row items-center flex-wrap gap-4">
              {article.author && (
                <>
                  <Text className="text-sm text-white/60">
                    {article.author}
                  </Text>
                  <Text className="text-sm text-white/30">•</Text>
                </>
              )}
              <Text className="text-sm text-white/60">
                {formatDate(article.publishedAt)}
              </Text>

              {/* Views */}
              {typeof article.viewCount === "number" && (
                <View className="flex-row items-center">
                  <Eye size={16} color="rgba(255,255,255,0.5)" />
                  <Text className="ml-1.5 text-sm text-white/50">
                    {article.viewCount}
                  </Text>
                </View>
              )}

              {/* Likes */}
              {typeof article.likeCount === "number" && (
                <TouchableOpacity
                  onPress={() => likeArticle(article.id)}
                  className="flex-row items-center"
                  hitSlop={12}
                >
                  <Heart
                    size={16}
                    color={
                      article.hasLiked ? "#c1fe00" : "rgba(255,255,255,0.5)"
                    }
                    fill={article.hasLiked ? "#c1fe00" : "none"}
                  />
                  <Text
                    className="ml-1.5 text-sm"
                    style={{
                      color: article.hasLiked
                        ? "#c1fe00"
                        : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {article.likeCount}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Content */}
          <Markdown style={markdownStyles as any}>{content}</Markdown>
        </AnimatedScreen>
      </ScrollView>
    </LinearGradient>
  );
};

export default ArticleDetailScreen;
