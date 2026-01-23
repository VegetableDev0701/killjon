import { CheckCircle, Download, Smartphone, Zap } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { openAppStore, VersionCheckResult } from "../services/versionCheck";
import { screenWidth } from "../utils/constants";
import SlideToAction from "./SlideToAction";

const UpdateModal: React.FC<VersionCheckResult> = ({
  needsUpdate,
  storeUrl,
  currentVersion,
  latestVersion,
}) => {
  const { t } = useTranslation();
  const [isUpdating, setIsUpdating] = useState(false);

  // Animation values
  const pulseValue = useSharedValue(1);
  const fadeInValue = useSharedValue(0);
  const scaleValue = useSharedValue(0.8);

  // Entrance animation
  useEffect(() => {
    if (needsUpdate) {
      fadeInValue.value = withTiming(1, { duration: 600 });
      scaleValue.value = withSpring(1, { damping: 15, stiffness: 200 });
      // Start pulsing animation
      pulseValue.value = withTiming(1.05, { duration: 1000 }, () => {
        pulseValue.value = withTiming(1, { duration: 1000 });
      });
    } else {
      // Reset values when modal closes
      fadeInValue.value = 0;
      scaleValue.value = 0.8;
      pulseValue.value = 1;
      setIsUpdating(false);
    }
  }, [needsUpdate]);

  // Handle successful slide completion
  const handleSlideComplete = useCallback(async () => {
    setIsUpdating(true);

    // Wait a moment then open store
    setTimeout(async () => {
      await openAppStore(storeUrl);
    }, 800);
  }, [storeUrl]);

  // Animated styles
  const modalStyle = useAnimatedStyle(() => ({
    opacity: fadeInValue.value,
    transform: [{ scale: scaleValue.value }],
  }));

  const iconRotationStyle = useAnimatedStyle(() => {
    const rotate = interpolate(pulseValue.value, [1, 1.05], [0, 10]);

    return {
      transform: [{ rotate: `${rotate}deg` }],
    };
  });

  // Release notes data (mock data - you can replace with real data)
  const releaseNotes = useMemo(
    () => [
      { icon: Zap, text: t("updateModal.improvements") },
      { icon: CheckCircle, text: t("updateModal.bugFixes") },
      { icon: Smartphone, text: t("updateModal.newFeatures") },
    ],
    [t]
  );

  if (!needsUpdate) return null;

  return (
    <Modal
      visible={needsUpdate}
      animationType="none"
      transparent={false}
      statusBarTranslucent
      hardwareAccelerated
    >
      <LinearGradient
        colors={["#0a0a0a", "#0f0f0f", "#0a0a0a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <GestureHandlerRootView style={styles.gestureContainer}>
            <Animated.View style={[styles.content, modalStyle]}>
              {/* Header Section */}
              <View style={styles.headerSection}>
                <View style={styles.iconWrapper}>
                  <LinearGradient
                    colors={["#c1fe00", "#a8e600"]}
                    style={styles.iconBackground}
                  >
                    <Animated.View style={iconRotationStyle}>
                      <Download size={32} color="#000" strokeWidth={2.5} />
                    </Animated.View>
                  </LinearGradient>
                </View>

                <Text style={styles.title}>{t("updateModal.title")}</Text>
                <Text style={styles.subtitle}>
                  {t("updateModal.newVersionAvailable")}
                </Text>
              </View>

              {/* Version Info */}
              {(currentVersion || latestVersion) && (
                <View style={styles.versionInfo}>
                  {currentVersion && (
                    <View style={styles.versionItem}>
                      <Text style={styles.versionLabel}>
                        {t("updateModal.currentVersion")}
                      </Text>
                      <Text style={styles.versionValue}>{currentVersion}</Text>
                    </View>
                  )}
                  {latestVersion && (
                    <View style={styles.versionItem}>
                      <Text style={styles.versionLabel}>
                        {t("updateModal.latestVersion")}
                      </Text>
                      <Text style={styles.versionValue}>{latestVersion}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Description */}
              <View style={styles.descriptionSection}>
                <Text style={styles.message}>{t("updateModal.message")}</Text>

                {/* What's New Section */}
                <View style={styles.releaseNotesSection}>
                  <Text style={styles.whatsNewTitle}>
                    {t("updateModal.whatsNew")}
                  </Text>
                  {releaseNotes.map((note, index) => {
                    const Icon = note.icon;
                    return (
                      <View key={index} style={styles.releaseNoteItem}>
                        <View style={styles.noteIconWrapper}>
                          <Icon size={16} color="#c1fe00" />
                        </View>
                        <Text style={styles.releaseNoteText}>{note.text}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Slider Section */}
              <SlideToAction
                onComplete={handleSlideComplete}
                slideText={t("updateModal.slideToUpdate")}
                completionText={
                  isUpdating
                    ? t("updateModal.updating")
                    : t("updateModal.updateNow")
                }
                isProcessing={isUpdating}
                disabled={isUpdating}
                sliderWidth={screenWidth * 0.7}
                sliderHeight={60}
                slideThreshold={0.8}
                primaryColor="#c1fe00"
                backgroundColor="rgba(193, 254, 0, 0.2)"
                textColor="#c1fe00"
                thumbColor="#c1fe00"
                completionThumbColor="#000"
                completionBackgroundColor="#c1fe00"
                hintText={t("updateModal.slideToUpdate")}
                showHintText={true}
              />
            </Animated.View>
          </GestureHandlerRootView>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gestureContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  content: {
    width: screenWidth * 0.9,
    maxWidth: 400,
    backgroundColor: "rgba(30, 30, 30, 0.98)",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(193, 254, 0, 0.2)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconWrapper: {
    marginBottom: 16,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#c1fe00",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    color: "#c1fe00",
    textAlign: "center",
    fontWeight: "600",
  },
  versionInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: "rgba(193, 254, 0, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(193, 254, 0, 0.2)",
  },
  versionItem: {
    alignItems: "center",
  },
  versionLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  versionValue: {
    fontSize: 16,
    color: "#c1fe00",
    fontWeight: "600",
  },
  descriptionSection: {
    width: "100%",
    marginBottom: 32,
  },
  message: {
    fontSize: 16,
    color: "#B0B0B0",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 20,
  },
  releaseNotesSection: {
    width: "100%",
  },
  whatsNewTitle: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  releaseNoteItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  noteIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(193, 254, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  releaseNoteText: {
    flex: 1,
    fontSize: 14,
    color: "#B0B0B0",
    lineHeight: 20,
  },
});

export default UpdateModal;
