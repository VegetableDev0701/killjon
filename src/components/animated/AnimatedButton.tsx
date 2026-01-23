import React, { useCallback } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { cn } from "../../utils/clsxUtils";
import {
  useRotationAnimation,
  useScaleAnimation,
} from "../../utils/reanimatedUtils";

interface AnimatedButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
  className?: string;
  colorClassName?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  animationType?: "scale" | "bounce" | "none";
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  label,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  full = false,
  className = "",
  colorClassName = "",
  iconLeft,
  iconRight,
  animationType = "scale",
}) => {
  const { scaleIn, scaleOut, bounce, animatedStyle } = useScaleAnimation();
  const { animatedStyle: spinStyle } = useRotationAnimation();

  // Additional animation values for smoother feedback
  const opacity = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (disabled || loading) return;

    if (animationType === "scale") {
      scaleIn();
      // Subtle opacity change for better feedback
      opacity.value = withTiming(0.85, { duration: 100 });
    } else if (animationType === "bounce") {
      bounce();
    }
  }, [disabled, loading, animationType, scaleIn, bounce]);

  const handlePressOut = useCallback(() => {
    if (disabled || loading) return;

    if (animationType === "scale") {
      scaleOut();
      opacity.value = withTiming(1, { duration: 150 });
    }
  }, [disabled, loading, animationType, scaleOut]);

  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    onPress();
  }, [disabled, loading, onPress]);

  // Base styles
  const baseStyles = cn(
    "flex-row items-center justify-center rounded-lg border transition-colors",
    {
      "h-9 px-3": size === "small",
      "h-11 px-4": size === "medium",
      "h-14 px-6": size === "large",
      "w-full": full,
    }
  );

  // Variant styles
  const variantStyles = cn({
    "border-primary bg-primary": variant === "primary",
    "bg-secondary border-secondary": variant === "secondary",
    "border-primary bg-transparent": variant === "outline",
    "border-transparent bg-transparent": variant === "ghost",
  });

  // Text styles
  const textStyles = cn(
    "font-inter-medium text-center",
    {
      "text-sm": size === "small",
      "text-base": size === "medium",
      "text-lg": size === "large",
      "text-text": variant === "primary" || variant === "secondary",
      "text-primary": variant === "outline" || variant === "ghost",
    },
    colorClassName
  );

  // Combine animated styles with opacity
  const combinedStyle = useAnimatedStyle(() => {
    const baseStyle = animationType !== "none" ? animatedStyle : {};
    return {
      ...baseStyle,
      opacity: disabled ? 0.6 : opacity.value,
    };
  }, [animationType, disabled]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={combinedStyle}
      className={cn(baseStyles, variantStyles, className)}
    >
      {/* Left icon */}
      {iconLeft && !loading && (
        <Animated.View style={{ marginRight: 8 }}>{iconLeft}</Animated.View>
      )}

      {/* Loading indicator */}
      {loading && (
        <Animated.View style={[spinStyle, { marginRight: 8 }]}>
          <ActivityIndicator
            size={size === "small" ? 16 : size === "large" ? 24 : 20}
            color={
              variant === "primary" || variant === "secondary"
                ? "white"
                : "#3B82F6"
            }
          />
        </Animated.View>
      )}

      {/* Button text */}
      <Text className={textStyles}>{label}</Text>

      {/* Right icon */}
      {iconRight && !loading && (
        <Animated.View style={{ marginLeft: 8 }}>{iconRight}</Animated.View>
      )}
    </AnimatedPressable>
  );
};
