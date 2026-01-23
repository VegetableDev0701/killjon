import React, { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

// --- Interfaces ---
interface ProfileCompletionStepperProps {
  hasProfilePicture: boolean;
  hasLocation: boolean;
  hasAtLeastOneProduct: boolean;
}

type StepStatus = "completed" | "active" | "pending";

interface StepData {
  label: string;
  isCompleted: boolean;
}

export const ProfileCompletionStepper: React.FC<
  ProfileCompletionStepperProps
> = ({ hasProfilePicture, hasLocation, hasAtLeastOneProduct }) => {
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
              <StepIcon status={status} stepNumber={index + 1} />
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

const StepIcon: React.FC<{ status: StepStatus; stepNumber: number }> = ({
  status,
  stepNumber,
}) => {
  // Use React Native Animated (not Reanimated) to avoid gesture handler conflicts
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

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
      className={`h-10 w-10 items-center justify-center rounded-full border-2 ${bgColorClass} ${borderColorClass}`}
    >
      {status === "completed" ? (
        // Simple checkmark text. Replace with an icon library (like Lucide-react-native) for better results.
        <Text className="text-lg font-bold text-white">✓</Text>
      ) : (
        <Text
          key={`${status}-${stepNumber}`}
          className={`text-base font-bold ${textColorClass}`}
        >
          {stepNumber}
        </Text>
      )}
    </Animated.View>
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
