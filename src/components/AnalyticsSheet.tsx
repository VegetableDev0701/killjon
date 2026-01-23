import { BarChart3, Lock, Mail, Shield } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Linking,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { screenHeight } from "../utils/constants";
import { CustomBottomSheet } from "./ui";

type AnalyticsSheetProps = {
  isVisible: boolean;
  onClose: () => void;
};

const AnalyticsSheet = ({ isVisible, onClose }: AnalyticsSheetProps) => {
  const { t } = useTranslation();

  // Enhanced animation values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const buttonOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const backgroundOpacity = useSharedValue(0);
  const iconRotation = useSharedValue(0);

  // Memoized animation configuration
  const animationConfig = useMemo(
    () => ({
      logo: {
        duration: 600,
        spring: { damping: 12, stiffness: 120 },
      },
      text: { duration: 800 },
      button: {
        duration: 600,
        spring: { damping: 15, stiffness: 150 },
        breathing: {
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
        },
      },
      background: { duration: 300 },
      reset: { duration: 200 },
      icon: { duration: 1000 },
    }),
    []
  );

  useEffect(() => {
    if (isVisible) {
      // Staggered entrance animations
      backgroundOpacity.value = withTiming(1, animationConfig.background);

      logoOpacity.value = withTiming(1, animationConfig.logo);
      logoScale.value = withSequence(
        withTiming(0.9, { duration: 200 }),
        withSpring(1, animationConfig.logo.spring)
      );

      // Rotation animation for the lock icon
      iconRotation.value = withSequence(
        withTiming(10, { duration: 200 }),
        withTiming(-10, { duration: 200 }),
        withTiming(0, { duration: 200 })
      );

      // Delay text animation
      setTimeout(() => {
        textOpacity.value = withTiming(1, animationConfig.text);
      }, 200);

      // Delay button animation
      setTimeout(() => {
        buttonOpacity.value = withTiming(1, animationConfig.button);
        buttonScale.value = withSequence(
          withTiming(0.95, { duration: 200 }),
          withSpring(1, animationConfig.button.spring)
        );
      }, 500);
    } else {
      // Reset animations when sheet closes
      logoOpacity.value = withTiming(0, animationConfig.reset);
      logoScale.value = withTiming(0.8, animationConfig.reset);
      buttonOpacity.value = withTiming(0, animationConfig.reset);
      buttonScale.value = withTiming(0.95, animationConfig.reset);
      textOpacity.value = withTiming(0, animationConfig.reset);
      backgroundOpacity.value = withTiming(0, animationConfig.reset);
      iconRotation.value = withTiming(0, animationConfig.reset);
    }
  }, [isVisible, animationConfig]);

  // Handle Contact Us button press
  const handleContactUs = useCallback(async () => {
    const email = "info@nodoia.app";
    const subject = encodeURIComponent(t("analytics.emailSubject"));
    const body = encodeURIComponent(t("analytics.emailBody"));

    const mailto = `mailto:${email}?subject=${subject}&body=${body}`;

    try {
      const supported = await Linking.canOpenURL(mailto);
      if (supported) {
        await Linking.openURL(mailto);
      } else {
        // Fallback: just copy email to clipboard and show a message
        console.log("Email client not available, email:", email);
      }
    } catch (error) {
      console.error("Error opening email client:", error);
    }
  }, [t]);

  // Memoized animated styles
  const logoAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: logoOpacity.value,
      transform: [{ scale: logoScale.value }],
    }),
    []
  );

  const buttonAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: buttonOpacity.value,
      transform: [{ scale: buttonScale.value }],
    }),
    []
  );

  const textAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: textOpacity.value,
      transform: [
        {
          translateY: interpolate(
            textOpacity.value,
            [0, 1],
            [20, 0],
            Extrapolation.CLAMP
          ),
        },
      ],
    }),
    []
  );

  const backgroundAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: backgroundOpacity.value,
    }),
    []
  );

  const iconAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ rotate: `${iconRotation.value}deg` }],
    }),
    []
  );

  return (
    <Modal
      visible={isVisible}
      onRequestClose={onClose}
      transparent={true}
      animationType="slide"
      navigationBarTranslucent={true}
    >
      <CustomBottomSheet
        isVisible={isVisible}
        onClose={onClose}
        height={screenHeight * 0.75}
      >
        <Animated.View style={[styles.content, backgroundAnimatedStyle]}>
          <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
            <View style={styles.iconContainer}>
              <Animated.View style={[styles.lockIcon, iconAnimatedStyle]}>
                <Lock size={12} color="#c1fe00" />
              </Animated.View>
              <View style={styles.chartIcon}>
                <BarChart3 size={32} color="#c1fe00" />
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.titleSection, textAnimatedStyle]}>
            <Text style={styles.title}>{t("analytics.title")}</Text>
            <Text style={styles.subtitle}>{t("analytics.subtitle")}</Text>
          </Animated.View>

          <Animated.View style={[styles.messageContainer, textAnimatedStyle]}>
            <View style={styles.messageBox}>
              <Shield size={24} color="#c1fe00" style={styles.messageIcon} />
              <Text style={styles.messageText}>{t("analytics.message")}</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.featuresContainer, textAnimatedStyle]}>
            <Text style={styles.featuresTitle}>{t("analytics.features")}</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <BarChart3
                  size={16}
                  color="#c1fe00"
                  style={styles.featureIcon}
                />
                <Text style={styles.featureText}>
                  {t("analytics.advancedInsights")}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Shield size={16} color="#c1fe00" style={styles.featureIcon} />
                <Text style={styles.featureText}>
                  {t("analytics.realTimeData")}
                </Text>
              </View>
              <View style={styles.featureItem}>
                <BarChart3
                  size={16}
                  color="#c1fe00"
                  style={styles.featureIcon}
                />
                <Text style={styles.featureText}>
                  {t("analytics.customDashboards")}
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
            <TouchableOpacity
              onPress={handleContactUs}
              style={styles.contactButton}
              activeOpacity={0.9}
            >
              <Mail size={20} color="#0a0a0a" />
              <Text style={styles.buttonText}>{t("analytics.contactUs")}</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.footerContainer, textAnimatedStyle]}>
            <Text style={styles.footerText}>{t("analytics.footer")}</Text>
          </Animated.View>
        </Animated.View>
      </CustomBottomSheet>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    position: "relative",
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  lockIcon: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "rgba(193, 254, 0, 0.1)",
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(193, 254, 0, 0.2)",
  },
  chartIcon: {
    backgroundColor: "rgba(193, 254, 0, 0.1)",
    borderRadius: 25,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(193, 254, 0, 0.2)",
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#666666",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  messageContainer: {
    marginBottom: 12,
  },
  messageBox: {
    backgroundColor: "rgba(193, 254, 0, 0.05)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(193, 254, 0, 0.2)",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  messageIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  messageText: {
    color: "#ffffff",
    fontSize: 15,
    flex: 1,
  },
  featuresContainer: {
    marginBottom: 12,
  },
  featuresTitle: {
    color: "#c1fe00",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(193, 254, 0, 0.1)",
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  buttonContainer: {
    marginBottom: 12,
  },
  contactButton: {
    backgroundColor: "#c1fe00",
    borderRadius: 30,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#c1fe00",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: "#0a0a0a",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  footerContainer: {
    alignItems: "center",
  },
  footerText: {
    color: "#666666",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 20,
    fontStyle: "italic",
  },
});

export default React.memo(AnalyticsSheet);
