import { Shield, Sparkles, Zap } from "lucide-react-native";
import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import assets from "../assets";
import { useAuth } from "../hooks/useAuth";
import { IS_ANDROID, IS_IOS } from "../utils/constants";
import { AppleAuthButton, GoogleAuthButton } from "./auth";
import { CustomBottomSheet } from "./ui";
// Memoized Feature Item Component
const FeatureItem = React.memo(
  ({
    feature,
    isVisible,
  }: {
    feature: { icon: any; title: string; description: string };
    isVisible: boolean;
  }) => (
    <Animated.View
      style={[
        styles.featureItem,
        {
          opacity: isVisible ? 1 : 0,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        },
      ]}
    >
      <View style={styles.featureIconContainer}>
        <feature.icon size={32} color="#c1fe00" />
      </View>
      <Text style={styles.featureTitle}>{feature.title}</Text>
      <Text style={styles.featureDescription}>{feature.description}</Text>
    </Animated.View>
  )
);

FeatureItem.displayName = "FeatureItem";

type LoginSheetProps = {
  isVisible: boolean;
  onClose: () => void;
};

const LoginSheet = ({ isVisible, onClose }: LoginSheetProps) => {
  const { t } = useTranslation();
  const {
    isAppleLoading,
    isGoogleLoading,
    appleSignInAvailable,
    handleAppleSignIn,
    handleGoogleSignIn,
    isAnyLoading,
  } = useAuth();
  const [currentSlide, setCurrentSlide] = React.useState(0);

  // Memoized feature data
  const features = useMemo(
    () => [
      {
        icon: Sparkles,
        title: t("loginSheet.smartConversations"),
        description: t("loginSheet.smartConversationsDesc"),
      },
      {
        icon: Shield,
        title: t("loginSheet.privacyFirst"),
        description: t("loginSheet.privacyFirstDesc"),
      },
      {
        icon: Zap,
        title: t("loginSheet.saveFavorites"),
        description: t("loginSheet.saveFavoritesDesc"),
      },
    ],
    [t]
  );

  // Enhanced animation values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const buttonOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const backgroundOpacity = useSharedValue(0);
  const featureOpacity = useSharedValue(0);

  // Memoized animation configuration
  const animationConfig = useMemo(
    () => ({
      logo: {
        duration: 600,
        spring: { damping: 12, stiffness: 120 },
      },
      text: { duration: 800 },
      feature: { duration: 600 },
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
    }),
    []
  );

  // Auto-slide functionality
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => {
        return (prev + 1) % features.length;
      });
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [isVisible, features.length]);

  // Handle login success
  const handleLoginSuccess = () => {
    onClose();
  };

  // Wrap auth handlers to close sheet on success
  const handleAppleLogin = async () => {
    await handleAppleSignIn();
    handleLoginSuccess();
  };

  const handleGoogleLogin = async () => {
    await handleGoogleSignIn();
    handleLoginSuccess();
  };

  useEffect(() => {
    // Enhanced animations when sheet becomes visible
    if (isVisible) {
      // Staggered entrance animations
      backgroundOpacity.value = withTiming(1, animationConfig.background);

      logoOpacity.value = withTiming(1, animationConfig.logo);
      logoScale.value = withSequence(
        withTiming(0.9, { duration: 200 }),
        withSpring(1, animationConfig.logo.spring)
      );

      // Delay text animation
      setTimeout(() => {
        textOpacity.value = withTiming(1, animationConfig.text);
      }, 200);

      // Delay feature animations
      setTimeout(() => {
        featureOpacity.value = withTiming(1, animationConfig.feature);
      }, 300);

      // Delay button animation
      setTimeout(() => {
        buttonOpacity.value = withTiming(1, animationConfig.button);
        buttonScale.value = withSequence(
          withTiming(0.95, { duration: 200 }),
          withSpring(1, animationConfig.button.spring)
        );
      }, 500);

      // Subtle breathing animation for the button
      setTimeout(() => {
        buttonScale.value = withRepeat(
          withSequence(
            withTiming(1.02, animationConfig.button.breathing),
            withTiming(1, animationConfig.button.breathing)
          ),
          -1,
          true
        );
      }, 1200);
    } else {
      // Reset animations when sheet closes
      logoOpacity.value = withTiming(0, animationConfig.reset);
      logoScale.value = withTiming(0.8, animationConfig.reset);
      buttonOpacity.value = withTiming(0, animationConfig.reset);
      buttonScale.value = withTiming(0.95, animationConfig.reset);
      textOpacity.value = withTiming(0, animationConfig.reset);
      backgroundOpacity.value = withTiming(0, animationConfig.reset);
      featureOpacity.value = withTiming(0, animationConfig.reset);
    }
  }, [isVisible, animationConfig]);

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

  if (!appleSignInAvailable && IS_IOS) {
    return (
      <CustomBottomSheet
        isVisible={isVisible}
        onClose={onClose}
        title={t("auth.signInError")}
        height={200}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {t("auth.appleSignInNotAvailable")}
          </Text>
        </View>
      </CustomBottomSheet>
    );
  }

  return (
    <CustomBottomSheet isVisible={isVisible} onClose={onClose} height={580}>
      <Animated.View style={[styles.content, backgroundAnimatedStyle]}>
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Image
            source={assets.animatedLogo}
            style={styles.logoImage}
            resizeMode="contain"
            fadeDuration={0}
          />
        </Animated.View>

        <Animated.View style={[styles.welcomeSection, textAnimatedStyle]}>
          <Text className="text-2xl font-bold text-foreground">
            {t("loginSheet.welcomeTitle")}
          </Text>
        </Animated.View>

        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <FeatureItem
              key={index}
              feature={feature}
              isVisible={currentSlide === index}
            />
          ))}
        </View>

        {/* Apple Sign In Button */}
        {IS_IOS && appleSignInAvailable && (
          <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
            <AppleAuthButton
              onPress={handleAppleLogin}
              isLoading={isAppleLoading}
              disabled={isAnyLoading}
              style={styles.sheetButton}
              textColor="#000"
              loaderColor="#000"
              iconSize={24}
            />
          </Animated.View>
        )}

        {/* Google Sign In Button */}

        {IS_ANDROID && (
          <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
            <GoogleAuthButton
              onPress={handleGoogleLogin}
              isLoading={isGoogleLoading}
              disabled={isAnyLoading}
              style={styles.sheetButton}
              textColor="#000"
              loaderColor="#666"
            />
          </Animated.View>
        )}

        {/* Terms and Privacy with enhanced styling */}
        <Animated.View style={[styles.termsContainer, textAnimatedStyle]}>
          <Text style={styles.termsText}>
            {t("loginSheet.termsAndPrivacy")}
          </Text>
        </Animated.View>
      </Animated.View>
    </CustomBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    borderRadius: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoBackground: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(193, 254, 0, 0.2)",
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  welcomeSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  welcomeTitle: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  welcomeSubtitle: {
    color: "#666666",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  featuresContainer: {
    width: "100%",
    height: 120,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(193, 254, 0, 0.2)",
    marginBottom: 20,
  },
  featureCard: {
    position: "relative",
    height: 120,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(193, 254, 0, 0.2)",
    backgroundColor: "rgba(193, 254, 0, 0.05)",
  },
  featureItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  featureIconContainer: {
    marginBottom: 12,
  },
  featureTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  featureDescription: {
    color: "#666666",
    fontSize: 14,
    textAlign: "center",
  },
  buttonContainer: {
    marginBottom: 24,
  },
  sheetButton: {
    backgroundColor: "#fff",
    borderRadius: 30,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonText: {
    color: "#000000",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  termsContainer: {
    alignItems: "center",
  },
  termsText: {
    color: "#666666",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  errorText: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
});

export default React.memo(LoginSheet);
