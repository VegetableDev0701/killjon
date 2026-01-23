import { Plus } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { IS_ANDROID } from "../../utils/constants";
import {
  LiquidGlassContainer,
  liquidGlassProps,
} from "../../utils/liquidGlass";

interface AddStoryCircleProps {
  onPress: () => void;
}

export const AddStoryCircle: React.FC<AddStoryCircleProps> = ({ onPress }) => {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LiquidGlassContainer
        {...liquidGlassProps}
        style={[
          styles.bubbleBackground,
          IS_ANDROID && {
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.3)",
          },
        ]}
      >
        <Plus color="#ffffff" size={33} />
      </LiquidGlassContainer>

      {/* Label */}
      <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
        {t("merchants.boostListing")}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginRight: 12,
  },
  bubbleBackground: {
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
    overflow: "hidden",
  },
  name: {
    marginTop: 4,
    fontSize: 12,
    color: "#fff",
    textAlign: "center",
    fontWeight: "400",
  },
});
