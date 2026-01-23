import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface MerchantChipProps {
  label: string;
  onPress: () => void;
}

export const MerchantChip: React.FC<MerchantChipProps> = ({
  label,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="mb-3 mr-2 items-center justify-center rounded-2xl bg-[#2a2a2a] px-2.5 py-2.5"
      style={{ minWidth: 100, height: 58 }}
      activeOpacity={0.7}
    >
      <View className="w-full items-center justify-center">
        <Text numberOfLines={2} className="text-center text-sm text-white">
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
