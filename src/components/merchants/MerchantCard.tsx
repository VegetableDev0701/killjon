import { Shield, Store } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { Merchant } from "../../types/merchant";

interface MerchantCardProps {
  merchant: Merchant;
  onPress: (merchant: Merchant) => void;
  isCompact?: boolean;
}

export const MerchantCard: React.FC<MerchantCardProps> = ({
  merchant,
  onPress,
  isCompact = false,
}) => {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      onPress={() => onPress(merchant)}
      className={`rounded-2xl border border-[#444] bg-[#2a2a2a] p-4 ${
        isCompact ? "w-32" : "flex-1"
      }`}
      style={{ height: 160 }}
      activeOpacity={0.7}
    >
      <View className="h-full items-center justify-between">
        {/* Logo */}
        <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#444]">
          {merchant.logo ? (
            <Image
              source={{ uri: merchant.logo }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <Store size={24} color="#c1fe00" />
          )}
        </View>

        {/* Name and Verified Badge */}
        <View className="flex-1 items-center justify-center">
          <Text
            className="text-center text-sm font-semibold text-white"
            numberOfLines={2}
          >
            {merchant.name}
          </Text>
          {merchant.isVerified && (
            <View className="mt-1 flex-row items-center">
              <Shield size={12} color="#c1fe00" fill="#c1fe00" />
              <Text className="ml-1 text-xs text-[#c1fe00]">
                {t("merchants.verified")}
              </Text>
            </View>
          )}
        </View>

        {/* Product Count and Rating */}
        <View className="items-center">
          <Text className="text-xs text-gray-400">
            {merchant.productCount} {t("merchants.products")}
          </Text>
          {merchant.rating && (
            <Text className="mt-1 text-xs text-gray-400">
              ⭐ {merchant.rating.toFixed(1)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
