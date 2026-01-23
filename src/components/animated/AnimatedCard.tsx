import React, { useCallback, useEffect } from "react";
import { Pressable, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { cn } from "../../utils/clsxUtils";
import { ANYDO_SPRING, ANYDO_TIMING } from "../../utils/reanimatedUtils";

interface AnimatedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  style?: ViewStyle;
  disabled?: boolean;
  enterDelay?: number;
  pressScale?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  onPress,
  className = "",
  style,
  disabled = false,
  enterDelay = 0,
  pressScale = 0.98,
}) => {
  // Animation values
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => {
      scale.value = withSpring(1, ANYDO_SPRING.smooth);
      opacity.value = withTiming(1, ANYDO_TIMING.standard);
      translateY.value = withSpring(0, ANYDO_SPRING.smooth);
    }, enterDelay);

    return () => clearTimeout(timer);
  }, [enterDelay]);

  // Press handlers
  const handlePressIn = useCallback(() => {
    if (disabled || !onPress) return;
    scale.value = withSpring(pressScale, ANYDO_SPRING.snappy);
  }, [disabled, onPress, pressScale]);

  const handlePressOut = useCallback(() => {
    if (disabled || !onPress) return;
    scale.value = withSpring(1, ANYDO_SPRING.snappy);
  }, [disabled, onPress]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const containerClass = cn(
    "bg-background-secondary overflow-hidden rounded-xl",
    {
      "opacity-60": disabled,
    },
    className
  );

  if (onPress && !disabled) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[animatedStyle, style]}
        className={containerClass}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <Animated.View style={[animatedStyle, style]} className={containerClass}>
      {children}
    </Animated.View>
  );
};
