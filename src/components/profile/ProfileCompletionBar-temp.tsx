import React, { useEffect, useRef } from "react";
import { Animated, Text, View, ViewStyle } from "react-native";
import AnimatedReanimated, { 
  SharedValue, 
} from "react-native-reanimated";
import {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { LiquidGlassContainer } from "../../utils/liquidGlass";

// --- Interfaces ---
interface ProfileCompletionStepperProps {
  hasProfilePicture: boolean;
  hasLocation: boolean;
  hasAtLeastOneProduct: boolean;
  scrollY?: SharedValue<number>;
}

type StepStatus = "completed" | "active" | "pending";

interface StepData {
  label: string;
  isCompleted: boolean;
}

export const ProfileCompletionStepper: React.FC<
  ProfileCompletionStepperProps
> = ({ hasProfilePicture, hasLocation, hasAtLeastOneProduct, scrollY }) => {
  // Define the steps based on props
  const steps: StepData[] = [
    { label: "Profile Pic", isCompleted: hasProfilePicture },
    { label: "Location", isCompleted: hasLocation },
    { label: "Add Product", isCompleted: hasAtLeastOneProduct },
  ];

  // Determine index of the currently active step (first one that isn't complete)
  let activeIndex = steps.findIndex((step) => !step.isCompleted);
  // If all are complete, activeIndex will be -1, set it to steps.length so all show completed
  if (activeIndex === -1 && steps.every((s) => s.isCompleted)) {
    activeIndex = steps.length;
  }
  // If none are complete, first one is active (index 0)
  if (activeIndex === -1) activeIndex = 0;

  const getStatus = (index: number): StepStatus => {
    if (steps[index].isCompleted) return "completed";
    if (index === activeIndex) return "active";
    return "pending";
  };

  return (
    <View
      className="mx-12 flex-row justify-between rounded-2xl px-6 py-2 shadow-sm"
      pointerEvents="none"
    >
      {steps.map((step, index) => {
        const status = getStatus(index);
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={index}>
            {/* The Step Item (Circle + Label) */}
            <View className="align-center relative h-16 flex-col items-center">
              <StepIcon status={status} stepNumber={index + 1} scrollY={scrollY} />
              <StepLabel status={status} label={step.label} />
            </View>

            {/* The Separator Line (skip after the last item) */}
            {!isLast && (
              <StepSeparator isPrecedingStepComplete={step.isCompleted} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

// --- Sub-components ---

const StepIcon: React.FC<{ status: StepStatus; stepNumber: number; scrollY?: SharedValue<number> }> = ({
  status,
  stepNumber,
  scrollY,
}) => {
  // Use React Native Animated for status-based animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate on status change
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [status, scaleAnim, opacityAnim]);

  // Reanimated styles for scroll-based bubble effect
  const bubbleScaleStyle = scrollY ? useAnimatedStyle(() => {
    'worklet';
    if (!scrollY) return { transform: [{ scale: 1 }] };
    
    // const scale = interpolate(
    //   scrollY.value,
    //   [0, 100],
    //   [1, 1.2], // Scale up more to look like a bubble
    //   Extrapolation.CLAMP
    // );

    return {
      transform: [{ scale: 1 }],
    };
  }) : undefined;

  // Shadow/glow effect for bubble appearance
  const bubbleShadowStyle = scrollY ? useAnimatedStyle(() => {
    'worklet';
    if (!scrollY) return { shadowOpacity: 0 };
    
    const shadowOpacity = interpolate(
      scrollY.value,
      [0, 100],
      [0, 0.5],
      Extrapolation.CLAMP
    );

    return {
      shadowColor: status === "completed" ? "#93c952" : status === "active" ? "#319fd9" : "#9ca3af",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity,
      shadowRadius: 8,
      elevation: 8, // Android shadow
    };
  }) : undefined;

  const liquidGlassOpacityStyle = scrollY ? useAnimatedStyle(() => {
    'worklet';
    if (!scrollY) return { opacity: 0 };
    
    const opacity = interpolate(
      scrollY.value,
      [0, 50, 100],
      [0, 0.7, 1], // Start appearing earlier and reach full opacity
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  }) : undefined;

  // Define dynamic styling based on status matching the reference image colors
  let bgColorClass = "bg-gray-300 dark:bg-gray-600"; // pending
  let borderColorClass = "border-gray-300 dark:border-gray-600";
  let textColorClass = "text-gray-500 dark:text-gray-300";

  if (status === "completed") {
    // Image green
    bgColorClass = "bg-[#93c952]";
    borderColorClass = "border-[#93c952]";
    textColorClass = "text-white";
  } else if (status === "active") {
    // Image blue
    bgColorClass = "bg-[#319fd9]";
    borderColorClass = "border-[#319fd9]";
    textColorClass = "text-white";
  }

  // Animated style for icon background opacity - becomes semi-transparent when scrolling to show liquid glass
  const iconBackgroundOpacityStyle = scrollY ? useAnimatedStyle(() => {
    'worklet';
    if (!scrollY) return { opacity: 1 };
    
    const bgOpacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.4], // Background becomes semi-transparent to show liquid glass bubble
      Extrapolation.CLAMP
    );

    return {
      opacity: bgOpacity,
    };
  }) : undefined;

  const IconWrapper = scrollY ? AnimatedReanimated.View : Animated.View;
  const iconStyle = scrollY ? bubbleScaleStyle : {
    transform: [{ scale: scaleAnim }],
    opacity: opacityAnim,
  };

  return (
    <IconWrapper
      style={[
        {
          width: 40,
          height: 40,
          borderRadius: 20,
          overflow: 'hidden',
        },
        iconStyle,
        scrollY ? bubbleShadowStyle : {},
      ]}
    >
      {/* Liquid glass bubble effect - behind the colored content */}
      {scrollY && (
        <AnimatedReanimated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 20,
              overflow: 'hidden',
              zIndex: 0, // Behind the colored content
            },
            liquidGlassOpacityStyle,
          ]}
          pointerEvents="none"
        >
          <LiquidGlassContainer
            effect="regular"
            interactive={true}
            style={{ 
              flex: 1, 
              borderRadius: 20,
              backgroundColor: 'transparent',
            }}
          />
        </AnimatedReanimated.View>
      )}
      {/* Icon content - border and text stay colored and visible */}
      <AnimatedReanimated.View
        style={[
          {
            width: 40,
            height: 40,
            borderRadius: 20,
            zIndex: 2, // Above liquid glass
            borderWidth: 2,
            justifyContent: 'center',
            alignItems: 'center',
          },
          scrollY ? iconBackgroundOpacityStyle : {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
        className={`items-center justify-center rounded-full border-2 ${bgColorClass} ${borderColorClass}`}
      >
        {status === "completed" ? (
          <Text className="text-lg font-bold text-white">✓</Text>
        ) : (
          <Text
            key={`${status}-${stepNumber}`}
            className={`text-base font-bold ${textColorClass}`}
          >
            {stepNumber}
          </Text>
        )}
      </AnimatedReanimated.View>
    </IconWrapper>
  );
};

const StepLabel: React.FC<{ status: StepStatus; label: string }> = ({
  status,
  label,
}) => {
  // Use React Native Animated for fade-in effect
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [opacityAnim]);

  let textColorClass = "text-gray-400 dark:text-gray-500"; // pending

  if (status === "completed") {
    textColorClass = "text-[#93c952] font-medium";
  } else if (status === "active") {
    textColorClass = "text-[#319fd9] font-medium";
  }

  return (
    // Using absolute positioning to pull the label out of flow so it doesn't mess up horizontal spacing
    <Animated.View
      style={{ opacity: opacityAnim }}
      className="absolute top-12 w-24 items-center justify-center"
    >
      <Text
        numberOfLines={2}
        className={`text-center text-xs ${textColorClass}`}
      >
        {label}
      </Text>
    </Animated.View>
  );
};

const StepSeparator: React.FC<{ isPrecedingStepComplete: boolean }> = ({
  isPrecedingStepComplete,
}) => {
  // Use React Native Animated for smooth color transition
  const progressAnim = useRef(
    new Animated.Value(isPrecedingStepComplete ? 1 : 0)
  ).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: isPrecedingStepComplete ? 1 : 0,
      duration: 400,
      useNativeDriver: false, // Color animation can't use native driver
    }).start();
  }, [isPrecedingStepComplete, progressAnim]);

  const backgroundColor = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgb(229, 231, 235)", "rgb(147, 201, 82)"], // gray-200 to green
  });

  return (
    // The separator needs to be positioned vertically centered relative to the circles.
    // mt-5 (20px) aligns with half the height of the h-10 (40px) circles.
    <View className="relative flex-1 items-center justify-center">
      <View className="absolute top-5 w-full -translate-y-1/2">
        <Animated.View
          style={{ backgroundColor }}
          className={`h-[3px] w-full rounded-full ${
            !isPrecedingStepComplete ? "dark:bg-[#2a2a2a]" : ""
          }`}
        />
      </View>
    </View>
  );
};
