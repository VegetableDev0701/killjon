import React, { useCallback, useEffect, useState } from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { cn } from "../../utils/clsxUtils";
import {
  ANYDO_SPRING,
  ANYDO_TIMING,
  useFadeAnimation,
  useFocusAnimation,
  useShakeAnimation,
} from "../../utils/reanimatedUtils";

interface AnimatedFormFieldProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  success?: boolean;
  containerClassName?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showValidation?: boolean;
  animateValidation?: boolean;
}

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
const AnimatedView = Animated.View;

export const AnimatedFormField: React.FC<AnimatedFormFieldProps> = ({
  label,
  error,
  success = false,
  containerClassName = "",
  inputClassName = "",
  labelClassName = "",
  errorClassName = "",
  leftIcon,
  rightIcon,
  showValidation = true,
  animateValidation = true,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const {
    onFocus: animatedFocus,
    onBlur: animatedBlur,
    animatedStyle,
  } = useFocusAnimation();
  const { shake, animatedStyle: shakeStyle } = useShakeAnimation();
  const {
    fadeIn,
    fadeOut,
    animatedStyle: errorFadeStyle,
  } = useFadeAnimation(0);
  const { fadeIn: successFadeIn, animatedStyle: successFadeStyle } =
    useFadeAnimation(0);

  // Enhanced Any.do-style focus animations
  const labelScale = useSharedValue(1);
  const labelTranslateY = useSharedValue(0);

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: labelScale.value },
      { translateY: labelTranslateY.value },
    ],
  }));

  // Handle focus events with Any.do-style animations
  const handleFocus = useCallback(
    (e: any) => {
      setIsFocused(true);
      animatedFocus();
      // Smooth label animation on focus
      labelScale.value = withSpring(1.05, ANYDO_SPRING.snappy);
      labelTranslateY.value = withSpring(-2, ANYDO_SPRING.snappy);
      onFocus?.(e);
    },
    [animatedFocus, onFocus, labelScale, labelTranslateY]
  );

  const handleBlur = useCallback(
    (e: any) => {
      setIsFocused(false);
      animatedBlur();
      // Reset label animation on blur
      labelScale.value = withSpring(1, ANYDO_SPRING.snappy);
      labelTranslateY.value = withSpring(0, ANYDO_SPRING.snappy);
      onBlur?.(e);
    },
    [animatedBlur, onBlur, labelScale, labelTranslateY]
  );

  // Trigger shake animation when error appears
  useEffect(() => {
    if (error && animateValidation) {
      shake(8);
      fadeIn(200);
    } else if (!error) {
      fadeOut(200);
    }
  }, [error, animateValidation, shake, fadeIn, fadeOut]);

  // Trigger success animation
  useEffect(() => {
    if (success && showValidation) {
      successFadeIn(200);
    }
  }, [success, showValidation, successFadeIn]);

  // Dynamic styles
  const containerStyles = cn("mb-4", containerClassName);

  const inputContainerStyles = cn(
    "flex-row items-center rounded-lg border bg-white px-2 py-1",
    {
      "border-red-500": error,
      "border-green-500": success && !error,
      "border-blue-500": isFocused && !error && !success,
    }
  );

  const inputStyles = cn(
    "font-inter-regular h-10 flex-1 text-base text-gray-900",
    "placeholder:text-gray-500",
    inputClassName
  );

  const labelStyles = cn(
    "font-inter-medium mb-2 text-sm text-gray-700",
    {
      "text-blue-600": isFocused && !error,
      "text-red-600": error,
      "text-green-600": success && !error,
    },
    labelClassName
  );

  const errorStyles = cn(
    "font-inter-regular mt-1 text-xs text-red-600",
    errorClassName
  );

  return (
    <AnimatedView style={shakeStyle} className={containerStyles}>
      {/* Label */}
      {label && (
        <Animated.Text
          style={[animatedStyle, labelAnimatedStyle]}
          className={labelStyles}
        >
          {label}
        </Animated.Text>
      )}

      {/* Input Container */}
      <AnimatedView style={animatedStyle} className={inputContainerStyles}>
        {/* Left Icon */}
        {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}

        {/* Text Input */}
        <AnimatedTextInput
          {...textInputProps}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={inputStyles}
          placeholderTextColor="#9CA3AF"
        />

        {/* Right Icon */}
        {rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}

        {/* Success Indicator */}
        {success && !error && (
          <Animated.View style={[successFadeStyle, { marginLeft: 8 }]}>
            <View className="h-5 w-5 items-center justify-center rounded-full bg-green-500">
              <Text className="text-xs font-bold text-white">✓</Text>
            </View>
          </Animated.View>
        )}
      </AnimatedView>

      {/* Error Message */}
      {error && (
        <Animated.Text style={errorFadeStyle} className={errorStyles}>
          {error}
        </Animated.Text>
      )}
    </AnimatedView>
  );
};
