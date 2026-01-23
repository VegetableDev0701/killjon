import { Eye, Heart } from "lucide-react-native";
import React from "react";
import { Text, View } from "react-native";
import FastImage from "react-native-fast-image";
import Animated from "react-native-reanimated";
import type { Article, Category } from "../../types/lab";
import { AnimatedListItem } from "../animated";

interface ArticleCardProps {
  index: number;
  article: Article;
  category: Category;
  onPress: () => void;
  language: "en" | "es";
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  index,
  article,
  category,
  onPress,
  language,
}) => {
  const title = article.title;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "es" ? "es-ES" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AnimatedListItem
      index={index}
      className="mb-4 rounded-2xl border border-white/10 pb-4"
      onPress={onPress}
      style={{
        backgroundColor: "rgba(255,255,255,0.05)",
      }}
    >

      {/* Image */}
      {article.imgsource && (
        <View className="mb-3 overflow-hidden rounded-xl">
          <FastImage
            source={{
              uri: article.imgsource,
              priority: FastImage.priority.normal,
              cache: FastImage.cacheControl.web
            }}
            resizeMode={FastImage.resizeMode.cover}
            style={{
              width: "100%",
              height: 192,
              backgroundColor: "rgba(255,255,255,0.05)"
            }}
          />
        </View>
      )}
      <View className="px-4">
        <Text className="mb-2 text-lg leading-6 text-white">
          {title}
        </Text>


        {/* Footer */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            {article.author && (
              <>
                <Text className="text-xs text-white/50">{article.author}</Text>
                <Text className="mx-2 text-xs text-white/30">•</Text>
              </>
            )}
            <Text className="text-xs text-white/50">
              {formatDate(article.publishedAt)}
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            {typeof article.viewCount === "number" && (
              <View className="flex-row items-center">
                <Eye size={20} color="rgba(255,255,255,0.5)" />
                <Text className="ml-1 text-xs text-white/50">
                  {article.viewCount}
                </Text>
              </View>
            )}

            {/* Likes */}
            {typeof article.likeCount === "number" && (
              <View className="flex-row items-center">
                <Heart
                  size={20}
                  color={article.hasLiked ? "#c1fe00" : "rgba(255,255,255,0.5)"}
                  fill={article.hasLiked ? "#c1fe00" : "none"}
                />
                <Text
                  className="ml-1 text-xs"
                  style={{
                    color: article.hasLiked ? "#c1fe00" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {article.likeCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </AnimatedListItem>
  );
};
