import { Minus, Plus, Trash2 } from "lucide-react-native";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

interface AnimatedQuantitySelectorProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  inactiveColor?: string;
}

const AnimatedQuantitySelector: React.FC<AnimatedQuantitySelectorProps> = ({
  quantity,
  onQuantityChange,
  inactiveColor = "#000",
}) => {
  const isExpanded = quantity > 0;
  const wasExpandedRef = React.useRef(false);

  // Animated values - initialize based on current state
  const width = useSharedValue(isExpanded ? 36 * 2.5 : 36);
  const opacity = useSharedValue(isExpanded ? 1 : 0);
  const scale = useSharedValue(isExpanded ? 1 : 0.8);

  useEffect(() => {
    // Only animate if state is actually changing
    if (isExpanded && !wasExpandedRef.current) {
      // Expand to show full controls
      width.value = withSpring(36 * 2.5, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, {
        damping: 12,
        stiffness: 120,
      });
      wasExpandedRef.current = true;
    } else if (!isExpanded && wasExpandedRef.current) {
      // Collapse to just "+" button
      width.value = withSpring(36, {
        damping: 15,
        stiffness: 150,
      });
      opacity.value = withTiming(0, { duration: 150 });
      scale.value = withSpring(0.8, {
        damping: 12,
        stiffness: 120,
      });
      wasExpandedRef.current = false;
    }
  }, [isExpanded]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: width.value,
    };
  });

  const controlsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const handleIncrement = () => {
    onQuantityChange(quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      onQuantityChange(quantity - 1);
    }
  };

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      {isExpanded ? (
        <Animated.View
          style={[styles.expandedContainer, controlsAnimatedStyle]}
        >
          {/* Minus/Trash Button */}
          <Pressable
            onPress={handleDecrement}
            hitSlop={12}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            {quantity === 1 ? (
              <Trash2 size={20} color={inactiveColor} strokeWidth={2.5} />
            ) : (
              <Minus size={20} color={inactiveColor} strokeWidth={2.5} />
            )}
          </Pressable>

          {/* Quantity Display */}
          <View pointerEvents="none" style={styles.quantityContainer}>
            <Text style={[styles.quantityText, { color: inactiveColor }]}>
              {quantity}
            </Text>
          </View>

          {/* Plus Button */}
          <Pressable
            onPress={handleIncrement}
            hitSlop={12}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <Plus size={20} color={inactiveColor} strokeWidth={2.5} />
          </Pressable>
        </Animated.View>
      ) : (
        /* Initial Plus Button */
        <Pressable
          onPress={handleIncrement}
          hitSlop={12}
          style={({ pressed }) => [
            styles.singleButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Plus size={24} color={inactiveColor} strokeWidth={2.5} />
        </Pressable>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(193, 254, 0, 0.08)",
    borderColor: "rgba(193, 254, 0, 0.2)",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  expandedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 8,
  },
  button: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  singleButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  quantityContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityText: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
});

export default AnimatedQuantitySelector;
