import React, { useCallback, useEffect } from "react";
import { Pressable, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { cn } from "../../utils/clsxUtils";
import { ANYDO_SPRING, ANYDO_TIMING } from "../../utils/reanimatedUtils";

interface AnimatedListItemProps {
  children: React.ReactNode;
  index: number;
  onPress?: () => void;
  className?: string;
  style?: ViewStyle;
  disabled?: boolean;
  staggerDelay?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children,
  index,
  onPress,
  className = "",
  style,
  disabled = false,
  staggerDelay = 50,
}) => {
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  // Staggered entrance animation
  useEffect(() => {
    const delay = index * staggerDelay;

    opacity.value = withDelay(delay, withTiming(1, ANYDO_TIMING.standard));

    translateY.value = withDelay(delay, withSpring(0, ANYDO_SPRING.smooth));

    scale.value = withDelay(delay, withSpring(1, ANYDO_SPRING.smooth));
  }, [index, staggerDelay]);

  // Press handlers
  const handlePressIn = useCallback(() => {
    if (disabled || !onPress) return;
    scale.value = withSpring(0.97, ANYDO_SPRING.snappy);
  }, [disabled, onPress]);

  const handlePressOut = useCallback(() => {
    if (disabled || !onPress) return;
    scale.value = withSpring(1, ANYDO_SPRING.snappy);
  }, [disabled, onPress]);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const containerClass = cn(
    "mb-2",
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
