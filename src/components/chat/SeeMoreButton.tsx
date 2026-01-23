import { ArrowRight } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LiquidGlassContainer, liquidGlassProps } from "../../utils/liquidGlass";

interface SeeMoreButtonProps {
  onPress: () => void;
}

const SeeMoreButton: React.FC<SeeMoreButtonProps> = ({ onPress }) => {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.seeMoreButton}
      activeOpacity={0.8}
    >
      {/* Liquid glass background */}
      <LiquidGlassContainer
        {...liquidGlassProps}
        style={styles.liquidGlassBackground}
      />
      <View style={styles.seeMoreButtonInner}>
        <Text style={styles.seeMoreButtonText}>{t("seeMoreButtonText")}</Text>
        <ArrowRight size={16} color="#ffffff" style={styles.seeMoreArrow} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  seeMoreButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: "auto",
    marginTop: 2,
    width: "60%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    position: "relative",
  },
  liquidGlassBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    backgroundColor: "rgba(20, 20, 20, 0.8)",
  },
  seeMoreButtonInner: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  seeMoreButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  seeMoreArrow: {
    marginLeft: 10,
  },
});

export default SeeMoreButton;
