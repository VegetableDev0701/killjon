import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import AppleLogo from "../AppleLogo";
import SpinningLoader from "./SpinningLoader";

type AppleAuthButtonProps = {
  onPress: () => void;
  isLoading: boolean;
  disabled?: boolean;
  style?: any;
  textColor?: string;
  loaderColor?: string;
  iconSize?: number;
};

const AppleAuthButton = React.memo(
  ({
    onPress,
    isLoading,
    disabled = false,
    style,
    textColor = "#fff",
    loaderColor = "#fff",
    iconSize = 26,
  }: AppleAuthButtonProps) => {
    const { t } = useTranslation();

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || isLoading}
        style={[
          styles.button,
          style,
          (disabled || isLoading) && styles.disabled,
        ]}
        activeOpacity={disabled || isLoading ? 1 : 0.85}
      >
        {isLoading ? (
          <SpinningLoader size={20} color={loaderColor} />
        ) : (
          <>
            <AppleLogo size={iconSize} color={textColor} />
            <Text style={[styles.buttonText, { color: textColor }]}>
              {t("welcome.continueWithApple")}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#232323",
    borderRadius: 32,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: "#fff",
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 18,
    marginLeft: 12,
  },
  disabled: {
    opacity: 0.6,
  },
});

AppleAuthButton.displayName = "AppleAuthButton";

export default AppleAuthButton;
