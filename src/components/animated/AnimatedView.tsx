import React, { useEffect } from "react";
import { ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { ANYDO_SPRING, ANYDO_TIMING } from "../../utils/reanimatedUtils";

type AnimationType =
  | "fade"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "scale"
  | "none";

interface AnimatedViewProps {
  children: React.ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  style?: ViewStyle;
}

export const AnimatedView: React.FC<AnimatedViewProps> = ({
  children,
  animation = "fade",
  delay = 0,
  duration,
  style,
}) => {
  const opacity = useSharedValue(animation === "none" ? 1 : 0);
  const translateX = useSharedValue(
    animation === "slide-left" ? -50 : animation === "slide-right" ? 50 : 0
  );
  const translateY = useSharedValue(
    animation === "slide-up" ? 30 : animation === "slide-down" ? -30 : 0
  );
  const scale = useSharedValue(animation === "scale" ? 0.9 : 1);

  useEffect(() => {
    if (animation === "none") return;

    const animationConfig = duration
      ? { ...ANYDO_TIMING.standard, duration }
      : ANYDO_TIMING.standard;

    // Fade
    if (animation === "fade") {
      opacity.value = withDelay(delay, withTiming(1, animationConfig));
    }

    // Slide animations
    if (animation.startsWith("slide")) {
      opacity.value = withDelay(delay, withTiming(1, animationConfig));
      translateX.value = withDelay(delay, withSpring(0, ANYDO_SPRING.smooth));
      translateY.value = withDelay(delay, withSpring(0, ANYDO_SPRING.smooth));
    }

    // Scale animation
    if (animation === "scale") {
      opacity.value = withDelay(delay, withTiming(1, animationConfig));
      scale.value = withDelay(delay, withSpring(1, ANYDO_SPRING.smooth));
    }
  }, [animation, delay, duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
  );
};
