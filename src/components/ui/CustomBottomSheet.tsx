import React, { useCallback, useEffect, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import LinearGradient from "react-native-linear-gradient";
import Animated, {
  Easing,
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Enhanced spring configuration for smoother animations
const SPRING_CONFIG = {
  damping: 20,
  mass: 0.8,
  stiffness: 100,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

const START_CONFIG = {
  duration: 100,
  stiffness: 100,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

// Refined animation timing configuration
const ANIMATION_CONFIG = {
  open: {
    duration: 400,
    easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // easeOutQuart
  },
  close: {
    duration: 300,
    easing: Easing.bezier(0.55, 0.06, 0.68, 0.19), // easeInQuart
  },
  backdrop: {
    duration: 350,
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  },
  handle: {
    duration: 150,
    easing: Easing.out(Easing.ease),
  },
};

// Enhanced gesture configuration
const GESTURE_CONFIG = {
  closeThreshold: 0.25, // 25% of height
  velocityThreshold: 800,
  resistanceFactor: 0.6,
  maxResistance: 0.3,
};

type CustomBottomSheetProps = {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number;
  title?: string;
};

const CustomBottomSheet = ({
  isVisible,
  onClose,
  children,
  height = 300,
  title,
}: CustomBottomSheetProps) => {
  const insets = useSafeAreaInsets();

  // Enhanced animation values
  const translateY = useSharedValue(height);
  const backdropOpacity = useSharedValue(0);
  const scale = useSharedValue(0.92);
  const handleScale = useSharedValue(1);
  const borderRadius = useSharedValue(20);
  const shadowOpacity = useSharedValue(0);

  // Memoized animation configuration
  const animationConfig = useMemo(
    () => ({
      spring: SPRING_CONFIG,
      timing: ANIMATION_CONFIG,
      gesture: GESTURE_CONFIG,
      start: START_CONFIG,
    }),
    []
  );

  // Enhanced close handler with staggered animations
  const handleClose = useCallback(() => {
    // Stagger the closing animations for smoother effect
    handleScale.value = withTiming(0.8, animationConfig.timing.handle);
    shadowOpacity.value = withTiming(0, animationConfig.timing.backdrop);
    backdropOpacity.value = withTiming(0, animationConfig.timing.backdrop);

    // Slightly delay the main animation
    setTimeout(() => {
      scale.value = withTiming(0.92, animationConfig.timing.close);
      borderRadius.value = withTiming(8, animationConfig.timing.close);
      translateY.value = withTiming(
        height,
        animationConfig.timing.close,
        () => {
          runOnJS(onClose)();
        }
      );
    }, 50);
  }, [
    onClose,
    height,
    animationConfig,
    handleScale,
    shadowOpacity,
    backdropOpacity,
    scale,
    borderRadius,
    translateY,
  ]);

  // Enhanced opening/closing animation sequence
  useEffect(() => {
    if (isVisible) {
      // Enhanced opening sequence with staggered animations
      backdropOpacity.value = withTiming(0.7, animationConfig.timing.backdrop);
      shadowOpacity.value = withTiming(0.15, animationConfig.timing.backdrop);

      // Smooth spring animations with slight delays
      setTimeout(() => {
        scale.value = withSpring(1, animationConfig.spring);
        borderRadius.value = withSpring(20, animationConfig.spring);
        translateY.value = withSpring(0, animationConfig.spring);
      }, 50);

      setTimeout(() => {
        handleScale.value = withSpring(1, animationConfig.spring);
      }, 100);
    } else {
      // Enhanced closing sequence
      handleClose();
    }
  }, [isVisible, height, animationConfig, handleClose]);

  // Enhanced gesture handler with improved physics
  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          // Subtle handle feedback on touch start
          handleScale.value = withSpring(1.1, animationConfig.start);
        })
        .onUpdate((event) => {
          if (event.translationY > 0) {
            // Dynamic resistance calculation
            const resistance = interpolate(
              event.translationY,
              [0, height * 0.5, height],
              [animationConfig.gesture.resistanceFactor, 0.4, 0.2],
              Extrapolate.CLAMP
            );

            translateY.value = event.translationY * resistance;

            // Dynamic scaling based on drag distance
            const dragProgress = Math.min(event.translationY / height, 1);
            const scaleValue = interpolate(
              dragProgress,
              [0, 0.3, 1],
              [1, 0.96, 0.92],
              Extrapolate.CLAMP
            );
            scale.value = scaleValue;

            // Dynamic border radius for more natural feel
            const radiusValue = interpolate(
              dragProgress,
              [0, 0.5, 1],
              [20, 15, 8],
              Extrapolate.CLAMP
            );
            borderRadius.value = radiusValue;

            // Handle scale feedback during drag
            const handleScaleValue = interpolate(
              dragProgress,
              [0, 0.2, 0.5],
              [1.1, 1, 0.9],
              Extrapolate.CLAMP
            );
            handleScale.value = handleScaleValue;

            // Backdrop opacity feedback
            const backdropValue = interpolate(
              dragProgress,
              [0, 0.8],
              [0.7, 0.3],
              Extrapolate.CLAMP
            );
            backdropOpacity.value = backdropValue;
          }
        })
        .onEnd((event) => {
          const threshold = height * animationConfig.gesture.closeThreshold;
          const shouldClose =
            event.translationY > threshold ||
            event.velocityY > animationConfig.gesture.velocityThreshold;

          if (shouldClose) {
            // Enhanced closing with velocity consideration
            const closeDuration = Math.max(
              200,
              Math.min(400, 400 - event.velocityY / 5)
            );

            handleScale.value = withTiming(0.8, {
              duration: closeDuration * 0.3,
            });
            shadowOpacity.value = withTiming(0, { duration: closeDuration });
            backdropOpacity.value = withTiming(0, { duration: closeDuration });
            scale.value = withTiming(0.92, { duration: closeDuration });
            borderRadius.value = withTiming(8, { duration: closeDuration });
            translateY.value = withTiming(
              height,
              { duration: closeDuration },
              () => {
                runOnJS(onClose)();
              }
            );
          } else {
            // Enhanced bounce back animation
            const bounceConfig = {
              ...animationConfig.spring,
              damping: 25,
              stiffness: 120,
            };

            translateY.value = withSpring(0, bounceConfig);
            scale.value = withSpring(1, bounceConfig);
            borderRadius.value = withSpring(20, bounceConfig);
            handleScale.value = withSpring(1, bounceConfig);
            backdropOpacity.value = withTiming(
              0.7,
              animationConfig.timing.backdrop
            );
            shadowOpacity.value = withTiming(
              0.15,
              animationConfig.timing.backdrop
            );
          }
        }),
    [height, animationConfig, onClose]
  );

  // Enhanced animated styles with interpolations
  const bottomSheetAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
      borderTopLeftRadius: borderRadius.value,
      borderTopRightRadius: borderRadius.value,
      shadowOpacity: shadowOpacity.value,
    };
  }, []);

  const backdropAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: backdropOpacity.value,
    }),
    []
  );

  const handleAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: handleScale.value }],
    }),
    []
  );

  const gradientAnimatedStyle = useAnimatedStyle(
    () => ({
      borderTopLeftRadius: borderRadius.value,
      borderTopRightRadius: borderRadius.value,
    }),
    []
  );

  // Memoized container style
  const containerStyle = useMemo(
    () => [
      styles.bottomSheetContainer,
      bottomSheetAnimatedStyle,
      {
        height,
      },
    ],
    [height, insets.bottom, bottomSheetAnimatedStyle]
  );

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <>
      <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          onPress={handleClose}
          activeOpacity={1}
        />
      </Animated.View>
      <GestureDetector gesture={gesture}>
        <Animated.View style={containerStyle}>
          <Animated.View
            style={[styles.gradientContainer, gradientAnimatedStyle]}
          >
            <LinearGradient
              colors={["#0a0a0a", "#0f0f0f", "#0a0a0a"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBackground}
            >
              <View style={styles.handleContainer}>
                <Animated.View style={[styles.handle, handleAnimatedStyle]} />
              </View>

              {title && <Text style={styles.title}>{title}</Text>}

              <View style={styles.contentContainer}>{children}</View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheetContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderColor: "rgba(193, 254, 0, 0.1)",
    shadowColor: "#c1fe00",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowRadius: 12,
    elevation: 12,
  },
  gradientContainer: {
    flex: 1,
    overflow: "hidden",
  },
  gradientBackground: {
    flex: 1,
  },
  handleContainer: {
    width: "100%",
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  handle: {
    width: 44,
    height: 5,
    backgroundColor: "#444",
    borderRadius: 2.5,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
});

export default React.memo(CustomBottomSheet);
