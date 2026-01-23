import React, { useEffect } from "react";
import { DimensionValue, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { cn } from "../../utils/clsxUtils";

interface SkeletonLoaderProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  className?: string;
}

const SkeletonItem: React.FC<SkeletonLoaderProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 4,
  className = "",
}) => {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1500 }), -1, false);
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmer.value, [0, 1], [-200, 200]);

    return {
      transform: [{ translateX }],
    };
  });

  const containerStyles = cn("overflow-hidden bg-gray-200", className);

  return (
    <View
      style={{
        width,
        height,
        borderRadius,
      }}
      className={containerStyles}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: 200,
            backgroundColor: "rgba(255, 255, 255, 0.6)",
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

// Predefined skeleton layouts
interface SkeletonFormProps {
  className?: string;
}

export const SkeletonForm: React.FC<SkeletonFormProps> = ({
  className = "",
}) => (
  <View className={cn("gap-4", className)}>
    <SkeletonItem width="40%" height={16} />
    <SkeletonItem width="100%" height={48} borderRadius={8} />
    <SkeletonItem width="40%" height={16} />
    <SkeletonItem width="100%" height={48} borderRadius={8} />
    <SkeletonItem width="60%" height={16} />
    <SkeletonItem width="100%" height={48} borderRadius={8} />
    <SkeletonItem width="100%" height={56} borderRadius={8} className="mt-6" />
  </View>
);

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className = "",
}) => (
  <View className={cn("gap-4 p-4", className)}>
    <View className="flex-row gap-3">
      <SkeletonItem width={60} height={60} borderRadius={30} />
      <View className="flex-1 gap-2">
        <SkeletonItem width="80%" height={20} />
        <SkeletonItem width="60%" height={16} />
      </View>
    </View>
    <SkeletonItem width="100%" height={16} />
    <SkeletonItem width="90%" height={16} />
    <SkeletonItem width="70%" height={16} />
  </View>
);

interface SkeletonListProps {
  itemCount?: number;
  className?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  itemCount = 5,
  className = "",
}) => (
  <View className={cn("gap-4", className)}>
    {Array.from({ length: itemCount }, (_, index) => (
      <SkeletonCard key={index} className="rounded-lg bg-white" />
    ))}
  </View>
);

interface SkeletonButtonProps {
  className?: string;
}

export const SkeletonButton: React.FC<SkeletonButtonProps> = ({
  className = "",
}) => (
  <SkeletonItem
    width="100%"
    height={48}
    borderRadius={8}
    className={className}
  />
);

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className = "",
}) => (
  <View className={cn("gap-2", className)}>
    {Array.from({ length: lines }, (_, index) => {
      const isLastLine = index === lines - 1;
      return (
        <SkeletonItem
          key={index}
          width={isLastLine ? "70%" : "100%"}
          height={16}
        />
      );
    })}
  </View>
);

interface SkeletonScreenProps {
  type?: "form" | "list" | "card" | "profile";
  className?: string;
}

export const SkeletonScreen: React.FC<SkeletonScreenProps> = ({
  type = "form",
  className = "",
}) => {
  const containerStyles = cn("flex-1 p-4", className);

  switch (type) {
    case "form":
      return (
        <View className={containerStyles}>
          <SkeletonItem width="60%" height={32} className="mb-6" />
          <SkeletonForm />
        </View>
      );

    case "list":
      return (
        <View className={containerStyles}>
          <SkeletonItem width="40%" height={28} className="mb-4" />
          <SkeletonList />
        </View>
      );

    case "card":
      return (
        <View className={containerStyles}>
          <SkeletonCard className="rounded-lg bg-white" />
          <SkeletonText lines={4} className="mt-4" />
          <SkeletonButton className="mt-6" />
        </View>
      );

    case "profile":
      return (
        <View className={containerStyles}>
          <View className="mb-6 items-center">
            <SkeletonItem width={120} height={120} borderRadius={60} />
            <SkeletonItem width="50%" height={24} className="mt-4" />
            <SkeletonItem width="30%" height={16} className="mt-2" />
          </View>
          <SkeletonForm />
        </View>
      );

    default:
      return (
        <View className={containerStyles}>
          <SkeletonForm />
        </View>
      );
  }
};

interface SkeletonMerchantCardProps {
  className?: string;
}

export const SkeletonMerchantCard: React.FC<SkeletonMerchantCardProps> = ({
  className = "",
}) => (
  <View
    className={cn(
      "overflow-hidden rounded-2xl border border-[#333] bg-[#1a1a1a]",
      className
    )}
  >
    {/* Image section */}
    <SkeletonItem
      width="100%"
      height={90}
      borderRadius={0}
      className="bg-[#2a2a2a]"
    />
    {/* Text section */}
    <View className="items-center gap-1.5 p-3">
      <SkeletonItem
        width="80%"
        height={14}
        borderRadius={4}
        className="bg-[#2a2a2a]"
      />
      <SkeletonItem
        width="60%"
        height={12}
        borderRadius={4}
        className="bg-[#2a2a2a]"
      />
    </View>
  </View>
);

interface SkeletonMerchantGridProps {
  itemCount?: number;
  className?: string;
}

export const SkeletonMerchantGrid: React.FC<SkeletonMerchantGridProps> = ({
  itemCount = 10,
  className = "",
}) => (
  <View className={cn("px-6 pt-4", className)}>
    <View className="flex-row flex-wrap justify-between">
      {Array.from({ length: itemCount }, (_, index) => (
        <View key={index} style={{ width: "48%", marginBottom: 16 }}>
          <SkeletonMerchantCard />
        </View>
      ))}
    </View>
  </View>
);

interface SkeletonStoryCircleProps {
  className?: string;
}

export const SkeletonStoryCircle: React.FC<SkeletonStoryCircleProps> = ({
  className = "",
}) => (
  <View className={cn("items-center", className)}>
    <SkeletonItem
      width={64}
      height={64}
      borderRadius={32}
      className="bg-[#2a2a2a]"
    />
    <SkeletonItem
      width={50}
      height={10}
      borderRadius={4}
      className="mt-1.5 bg-[#2a2a2a]"
    />
  </View>
);

interface SkeletonStoriesSliderProps {
  itemCount?: number;
  className?: string;
}

export const SkeletonStoriesSlider: React.FC<SkeletonStoriesSliderProps> = ({
  itemCount = 8,
  className = "",
}) => (
  <View
    className={cn("h-[104px] overflow-hidden rounded-b-[40px]", className)}
    style={{
      backgroundColor: "#0a0a0a",
    }}
  >
    <View className="h-[100px] flex-row items-center gap-3 px-4">
      {Array.from({ length: itemCount }, (_, index) => (
        <SkeletonStoryCircle key={index} />
      ))}
    </View>
  </View>
);

export { SkeletonItem };
