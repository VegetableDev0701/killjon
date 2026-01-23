import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import { cn } from "../../utils/clsxUtils";
import {
  useFadeAnimation,
  useSlideAnimation,
  useStaggerAnimation,
} from "../../utils/reanimatedUtils";

interface AnimatedScreenProps {
  children: React.ReactNode;
  className?: string;
  animationType?: "fade" | "slide" | "stagger" | "none";
  direction?: "left" | "right" | "up" | "down";
  staggerItems?: number;
  duration?: number;
  delay?: number;
}

export const AnimatedScreen: React.FC<AnimatedScreenProps> = ({
  children,
  className = "",
  animationType = "fade",
  direction = "right",
  staggerItems = 3,
  duration = 300,
  delay = 0,
}) => {
  const hasAnimated = useRef(false);

  // Animation hooks
  const { fadeIn, animatedStyle: fadeStyle } = useFadeAnimation(0);
  const {
    slideIn,
    reset,
    animatedStyle: slideStyle,
  } = useSlideAnimation(direction, 50);
  const { animateIn, getAnimatedStyle } = useStaggerAnimation(
    staggerItems,
    100
  );

  useEffect(() => {
    if (hasAnimated.current) return;

    const timer = setTimeout(() => {
      switch (animationType) {
        case "fade":
          fadeIn(duration);
          break;
        case "slide":
          slideIn();
          break;
        case "stagger":
          animateIn();
          break;
        default:
          break;
      }
      hasAnimated.current = true;
    }, delay);

    return () => clearTimeout(timer);
  }, [animationType, fadeIn, slideIn, animateIn, duration, delay]);

  // Reset animation on unmount for slide
  useEffect(() => {
    return () => {
      if (animationType === "slide") {
        reset();
      }
    };
  }, [animationType, reset]);

  const containerStyles = cn("flex-1", className);

  if (animationType === "none") {
    return <View className={containerStyles}>{children}</View>;
  }

  if (animationType === "stagger") {
    return (
      <View className={containerStyles}>
        {React.Children.map(children, (child, index) => (
          <Animated.View key={index} style={getAnimatedStyle(index)}>
            {child}
          </Animated.View>
        ))}
      </View>
    );
  }

  const animatedStyle = animationType === "fade" ? fadeStyle : slideStyle;

  return (
    <Animated.View style={animatedStyle} className={containerStyles}>
      {children}
    </Animated.View>
  );
};
