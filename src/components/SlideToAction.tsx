import { ArrowRight } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { trigger } from "react-native-haptic-feedback";
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { screenWidth, VivrationOption } from "../utils/constants";

const AnimatedArrowRight = Animated.createAnimatedComponent(ArrowRight);

interface SlideToActionProps {
  onComplete: () => void;
  slideText: string;
  completionText: string;
  isProcessing?: boolean;
  disabled?: boolean;
  sliderWidth?: number;
  sliderHeight?: number;
  slideThreshold?: number;
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  thumbColor?: string;
  completionThumbColor?: string;
  completionBackgroundColor?: string;
  hintText?: string;
  showHintText?: boolean;
  style?: any;
}

const SlideToAction: React.FC<SlideToActionProps> = ({
  onComplete,
  slideText,
  completionText,
  isProcessing = false,
  disabled = false,
  sliderWidth = screenWidth * 0.7,
  sliderHeight = 60,
  slideThreshold = 0.8,
  backgroundColor = "rgba(193, 254, 0, 0.2)",
  textColor = "#c1fe00",
  thumbColor = "#c1fe00",
  completionThumbColor = "#000",
  completionBackgroundColor = "#c1fe00",
  hintText,
  showHintText = true,
  style,
}) => {
  const [isSliding, setIsSliding] = useState(false);
  const thumbSize = sliderHeight - 8;

  // Animation values
  const slideProgress = useSharedValue(0);

  // Handle successful slide completion
  const handleSlideComplete = useCallback(async () => {
    // Haptic feedback
    if (Platform.OS !== "web") {
      trigger("impactMedium", VivrationOption);
    }

    // Animate completion
    slideProgress.value = withSpring(1, { damping: 15 });

    // Wait a moment then trigger callback
    setTimeout(() => {
      onComplete();
    }, 300);
  }, [onComplete, slideProgress]);

  // Pan gesture for slider
  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .onStart(() => {
        if (disabled || isProcessing) return;
        runOnJS(setIsSliding)(true);
      })
      .onUpdate((event) => {
        if (disabled || isProcessing) return;

        const progress = Math.max(
          0,
          Math.min(1, event.translationX / (sliderWidth - thumbSize - 8))
        );
        slideProgress.value = progress;

        // Haptic feedback at certain thresholds
        if (Platform.OS !== "web" && progress > 0.5 && progress < 0.55) {
          runOnJS(trigger)("impactMedium", VivrationOption);
        }
      })
      .onEnd((event) => {
        if (disabled || isProcessing) return;

        const progress = Math.max(
          0,
          Math.min(1, event.translationX / (sliderWidth - thumbSize - 8))
        );

        if (progress >= slideThreshold) {
          // Complete the slide
          runOnJS(handleSlideComplete)();
        } else {
          // Snap back
          slideProgress.value = withSpring(0, { damping: 15 });
          runOnJS(setIsSliding)(false);
        }
      });
  }, [
    disabled,
    isProcessing,
    handleSlideComplete,
    slideProgress,
    sliderWidth,
    thumbSize,
    slideThreshold,
  ]);

  // Animated styles
  const sliderContainerStyle = useAnimatedStyle(() => {
    const bgColor = interpolateColor(
      slideProgress.value,
      [0, slideThreshold],
      [backgroundColor, completionBackgroundColor]
    );

    const borderColor = interpolateColor(
      slideProgress.value,
      [0, slideThreshold],
      [backgroundColor, "#FFF"]
    );

    return {
      backgroundColor: bgColor,
      transform: [{ scale: isSliding ? 1.02 : 1 }],
      borderColor,
      opacity: disabled ? 0.5 : 1,
    };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      slideProgress.value,
      [0, 1],
      [0, sliderWidth - thumbSize - 8],
      Extrapolation.CLAMP
    );

    const bgColor = interpolateColor(
      slideProgress.value,
      [0, slideThreshold],
      [thumbColor, completionThumbColor]
    );

    const scale = interpolate(
      slideProgress.value,
      [0, 0.5, slideThreshold, 1],
      [1, 1.1, 1.1, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateX }, { scale }],
      backgroundColor: bgColor,
    };
  });

  const sliderTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      slideProgress.value,
      [0, 0.3, 0.7, 1],
      [1, 0.7, 0.3, 0],
      Extrapolation.CLAMP
    );

    return { opacity };
  });

  const completionTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      slideProgress.value,
      [slideThreshold, 1],
      [0, 1],
      Extrapolation.CLAMP
    );

    return { opacity };
  });

  // Create animated style for arrow icon color
  const arrowIconStyle = useCallback(() => {
    "worklet";
    const color = interpolateColor(
      slideProgress.value,
      [0, slideThreshold],
      ["#000", "#fff"]
    );

    return color;
  }, []);

  return (
    <GestureHandlerRootView style={[styles.container, style]}>
      <View style={styles.sliderSection}>
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sliderContainer,
              {
                width: sliderWidth,
                height: sliderHeight,
                borderRadius: sliderHeight / 2,
              },
              sliderContainerStyle,
            ]}
          >
            {/* Background text */}
            <Animated.View
              style={[styles.sliderTextContainer, sliderTextStyle]}
            >
              <Text style={[styles.sliderText, { color: textColor }]}>
                {slideText}
              </Text>
            </Animated.View>

            {/* Completion text */}
            <Animated.View
              style={[styles.completionTextContainer, completionTextStyle]}
            >
              <Text
                style={[styles.completionText, { color: completionThumbColor }]}
              >
                {completionText}
              </Text>
            </Animated.View>

            {/* Slider thumb */}
            <Animated.View
              style={[
                styles.sliderThumb,
                {
                  width: thumbSize,
                  height: thumbSize,
                  borderRadius: thumbSize / 2,
                },
                thumbStyle,
              ]}
            >
              <AnimatedArrowRight
                size={24}
                color={arrowIconStyle()}
                strokeWidth={2.5}
              />
            </Animated.View>
          </Animated.View>
        </GestureDetector>

        {/* Hint text */}
        {showHintText && (
          <Text style={styles.hintText}>
            {isSliding ? "" : hintText || slideText}
          </Text>
        )}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  sliderSection: {
    width: "100%",
    alignItems: "center",
  },
  sliderContainer: {
    backgroundColor: "rgba(193, 254, 0, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    position: "relative",
    overflow: "hidden",
  },
  sliderTextContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  sliderText: {
    fontSize: 16,
    fontWeight: "600",
  },
  completionTextContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  completionText: {
    fontSize: 16,
    fontWeight: "700",
  },
  sliderThumb: {
    position: "absolute",
    left: 4,
    backgroundColor: "#c1fe00",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  hintText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
    height: 16,
    marginTop: 8,
  },
});

export default SlideToAction;
