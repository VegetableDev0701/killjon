import { Award, Check, X } from "lucide-react-native";
import React, { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { NavigationProps } from "../../navigation/navigationTypes";
import { IS_ANDROID, IS_IOS } from "../../utils/constants";

const PremiumUpgradeModal = ({
  navigation,
}: NavigationProps<"PremiumUpgrade">) => {
  const { t } = useTranslation();

  const handleApplyPress = () => {
    navigation.replace("VerificationForm");
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      sheetAllowedDetents: IS_IOS ? "fitToContents" : [0.825],
      contentStyle: {
        backgroundColor: "transparent",
      },
    });
  });

  return (
    <View
      className={`float-end w-full flex-1 justify-between px-6 pt-8  ${IS_ANDROID ? "rounded-tl-3xl rounded-tr-3xl border border-[#333] bg-[#222222] pb-2" : ""}`}
    >
      {/* Header */}
      <View className="gap-2">
        <View className="h-16 w-16 items-center justify-center self-center rounded-full bg-primary/20">
          <Award color="#c1fe00" size={32} />
        </View>
        <Text className="text-center text-2xl font-bold text-foreground">
          {t("profile.premiumUpgradeTitle")}
        </Text>
        <Text className="text-center text-base text-gray-400">
          {t("profile.premiumUpgradeDescription")}
        </Text>
      </View>

      {/* Freemium vs Premium Comparison */}
      <View
        className={`overflow-hidden rounded-2xl border border-[#333] bg-[#0a0a0a]/80 ${IS_IOS ? "my-8" : ""}`}
      >
        {/* Header Row */}
        <View className="flex-row bg-[#232f0a]/20">
          <View className="flex-1 py-4 pl-6">
            <Text className="text-base font-semibold text-foreground">
              {t("admin.features")}
            </Text>
          </View>
          <View className="w-24 items-center justify-center border-l border-[#333] bg-gray-800/30 py-4">
            <Text className="text-xs font-bold text-gray-300">
              {t("admin.freemium")}
            </Text>
          </View>
          <View className="w-24 items-center justify-center border-l border-[#333] bg-primary/10 py-4">
            <Text className="text-xs font-bold text-primary">
              {t("admin.premium")}
            </Text>
          </View>
        </View>

        {/* Feature Rows */}
        {[
          {
            feature: t("admin.maxListingsLimit"),
            freemium: "5",
            premium: t("admin.unlimited"),
          },
          {
            feature: t("admin.verifiedMerchantBadge"),
            freemium: false,
            premium: true,
          },
          {
            feature: t("admin.ownMiniMarket"),
            freemium: false,
            premium: true,
          },
          {
            feature: t("subscription.prioritySupport"),
            freemium: false,
            premium: true,
          },
          {
            feature: t("admin.price"),
            freemium: t("admin.free"),
            premium: "special_pricing",
          },
        ].map((item, index) => (
          <View
            key={index}
            className={`flex-row ${
              index % 2 === 0 ? "bg-background/10" : "bg-transparent"
            }`}
          >
            <View className="flex-1 py-4 pl-6">
              <Text className="text-sm text-foreground">{item.feature}</Text>
            </View>
            <View className="w-24 items-center justify-center border-l border-[#333] py-4">
              {typeof item.freemium === "boolean" ? (
                item.freemium ? (
                  <Check size={16} color="#c1fe00" />
                ) : (
                  <X size={16} color="#666" />
                )
              ) : (
                <Text className="text-xs font-medium text-gray-400">
                  {item.freemium}
                </Text>
              )}
            </View>
            <View className="w-24 items-center justify-center border-l border-[#333] bg-primary/5 py-4">
              {typeof item.premium === "boolean" ? (
                item.premium ? (
                  <Check size={16} color="#c1fe00" />
                ) : (
                  <X size={16} color="#666" />
                )
              ) : item.premium === "special_pricing" ? (
                <View className="items-center gap-2">
                  <Text className="text-xs text-gray-500 line-through">
                    {t("admin.wasPrice")}
                  </Text>
                  <View className="rounded-full bg-primary px-2 py-1">
                    <Text className="text-xs font-bold text-black">
                      {t("admin.nowPrice")}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text className="text-xs font-bold text-primary">
                  {item.premium}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View className={`${IS_ANDROID ? "mb-safe" : ""} flex-row gap-4`}>
        <TouchableOpacity
          className="flex-1 rounded-xl bg-[#333] py-4"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-center font-medium text-foreground">
            {t("common.cancel")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 rounded-xl bg-primary py-4"
          onPress={handleApplyPress}
        >
          <Text className="text-center font-bold text-black">
            {t("profile.applyForPremium")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PremiumUpgradeModal;
