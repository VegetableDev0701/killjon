import React from "react";
import { useTranslation } from "react-i18next";
import { Platform, Text, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { HEADER_HEIGHT, screenWidth } from "../../utils/constants";

export const WelcomeContent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <View className="flex-1 justify-between">
      <View className="items-center px-2 pt-4">
        <Text className="mb-4 text-center text-3xl font-bold text-foreground">
          {t("chat.welcomeTitle")}
        </Text>
        <Text className="mb-8 max-w-md px-4 text-center text-base text-gray-400">
          {t("chat.welcomeDescription")}
        </Text>
      </View>
    </View>
  );
};
