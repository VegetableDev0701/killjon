import React from "react";
import { Text } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import type { Category } from "../../types/lab";

interface CategoryChipProps {
  category: Category;
  isSelected: boolean;
  onPress: () => void;
  language: "en" | "es";
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  category,
  isSelected,
  onPress,
  language,
}) => {
  const categoryName = language === "es" ? category.nameEs : category.name;
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const tap = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(0.7, { duration: 100 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 150 });
    })
    .onEnd(() => {
      runOnJS(onPress)();
    });

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        className="mr-3 flex-row items-center rounded-full px-4 py-2.5"
        style={[
          animatedStyle,
          {
            backgroundColor: isSelected
              ? category.color
              : "rgba(255,255,255,0.1)",
            borderWidth: isSelected ? 0 : 1,
            borderColor: "rgba(255,255,255,0.2)",
          },
        ]}
      >
        <Text className="mr-1.5 text-base">{category.emoji}</Text>
        <Text
          className="text-sm font-medium"
          style={{ color: isSelected ? "#0a0a0a" : "#ffffff" }}
        >
          {categoryName}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
};
