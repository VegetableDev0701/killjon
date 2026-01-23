import { Loader2 } from "lucide-react-native";
import React, { useEffect } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type SpinningLoaderProps = {
  size?: number;
  color?: string;
};

const SpinningLoader = React.memo(
  ({ size = 20, color = "white" }: SpinningLoaderProps) => {
    const spinValue = useSharedValue(0);

    useEffect(() => {
      spinValue.value = withRepeat(
        withTiming(1, { duration: 1000, easing: Easing.linear }),
        -1,
        false
      );
    }, []);

    const spinStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {
            rotate: `${spinValue.value * 360}deg`,
          },
        ],
      };
    });

    return (
      <Animated.View style={spinStyle}>
        <Loader2 size={size} color={color} />
      </Animated.View>
    );
  }
);

SpinningLoader.displayName = "SpinningLoader";

export default SpinningLoader;
