import React, { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import assets from "../assets";
import { AppleAuthButton, GoogleAuthButton } from "../components/auth";
import { StagingLabel } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { NavigationProps } from "../navigation/navigationTypes";
import { IS_ANDROID, IS_IOS } from "../utils/constants";

const LogoComponent = React.memo(
  ({ animatedStyle }: { animatedStyle: any }) => (
    <Animated.View style={[styles.logoContainer, animatedStyle]}>
      <Image
        source={assets.animatedLogo}
        style={styles.logoImage}
        resizeMode="contain"
        fadeDuration={0}
      />
    </Animated.View>
  )
);

LogoComponent.displayName = "LogoComponent";

// Memoized Welcome Text Component
const WelcomeTextComponent = React.memo(
  ({
    animatedStyle,
    welcomeTitle,
    smartJourney,
  }: {
    animatedStyle: any;
    welcomeTitle: string;
    smartJourney: string;
  }) => (
    <Animated.View style={[styles.welcomeTextContainer, animatedStyle]}>
      <Text style={styles.welcomeTitle}>{welcomeTitle}</Text>
      <Text style={styles.welcomeSubtitle}>{smartJourney}</Text>
    </Animated.View>
  )
);

WelcomeTextComponent.displayName = "WelcomeTextComponent";

const WelcomeScreen = ({ navigation }: NavigationProps<"Welcome">) => {
  const { t } = useTranslation();
  const {
    isAppleLoading,
    isGoogleLoading,
    appleSignInAvailable,
    handleAppleSignIn,
    handleGoogleSignIn,
    isAnyLoading,
  } = useAuth();

  // Animation values - optimized with better initial values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(50);
  const buttonOpacity = useSharedValue(0);

  // Memoized animation configuration
  const animationConfig = useMemo(
    () => ({
      logo: {
        timing: { duration: 1000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
        spring: { damping: 10, stiffness: 100, mass: 1 },
      },
      text: { duration: 800 },
      button: {
        timing: { duration: 800 },
        spring: { damping: 12, stiffness: 100, mass: 1 },
      },
    }),
    []
  );

  // Optimized animation sequence
  useEffect(() => {
    const { logo, text, button } = animationConfig;

    // Start all animations with proper timing
    logoOpacity.value = withTiming(1, logo.timing);
    logoScale.value = withSpring(1, logo.spring);
    textOpacity.value = withDelay(400, withTiming(1, text));
    buttonOpacity.value = withDelay(800, withTiming(1, button.timing));
    buttonTranslateY.value = withDelay(800, withSpring(0, button.spring));
  }, [animationConfig]);

  // Memoized animated styles
  const logoAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: logoOpacity.value,
      transform: [{ scale: logoScale.value }],
    }),
    []
  );

  const textAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: textOpacity.value,
    }),
    []
  );

  const buttonAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: buttonOpacity.value,
      transform: [{ translateY: buttonTranslateY.value }],
    }),
    []
  );

  const handleGuest = useCallback(async () => {
    navigation.navigate("MainApp");
  }, [navigation]);

  return (
    <LinearGradient
      colors={["#0a0a0a", "#0f0f0f", "#0a0a0a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <StagingLabel style={{ top: 80, right: "40%", left: "40%" }} />

        <View style={styles.content}>
          <LogoComponent animatedStyle={logoAnimatedStyle} />

          <WelcomeTextComponent
            animatedStyle={textAnimatedStyle}
            welcomeTitle={t("welcome.welcomeTitle")}
            smartJourney={t("welcome.smartJourney")}
          />

          <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
            {IS_IOS && appleSignInAvailable && (
              <AppleAuthButton
                onPress={handleAppleSignIn}
                isLoading={isAppleLoading}
                disabled={isAnyLoading}
              />
            )}

            {(IS_ANDROID || __DEV__) && (
              <GoogleAuthButton
                onPress={handleGoogleSignIn}
                isLoading={isGoogleLoading}
                disabled={isAnyLoading}
              />
            )}

            <TouchableOpacity
              onPress={handleGuest}
              activeOpacity={isAnyLoading ? 1 : 0.85}
              style={[styles.guestButton, isAnyLoading && { opacity: 0.6 }]}
              disabled={isAnyLoading}
            >
              <Text style={styles.guestButtonText}>
                {t("welcome.continueAsGuest")}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 32,
    overflow: "hidden",
    marginBottom: 18,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  logoImage: {
    width: 150,
    height: 150,
    borderRadius: 32,
  },
  welcomeTextContainer: {
    alignItems: "center",
    marginBottom: 18,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "white",
    opacity: 0.7,
    textAlign: "center",
    marginBottom: 8,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 340,
    alignSelf: "center",
    marginTop: 12,
  },
  appleButton: {
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
  appleButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 18,
    marginLeft: 12,
  },
  guestButton: {
    backgroundColor: "#c1fe00",
    borderRadius: 32,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#c1fe00",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  guestButtonText: {
    color: "#232323",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: 0.5,
  },
});

export default WelcomeScreen;
