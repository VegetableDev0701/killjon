import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export default function Loading() {
  const { t } = useTranslation();

  // Shared values for animations
  const pulseAnim = useSharedValue(0);
  const rotateAnim = useSharedValue(0);
  const opacityAnim = useSharedValue(0);
  const innerRotateAnim = useSharedValue(0);
  const glowAnim = useSharedValue(0);
  const dotAnim1 = useSharedValue(0);
  const dotAnim2 = useSharedValue(0);
  const dotAnim3 = useSharedValue(0);
  const scanLineAnim = useSharedValue(0);
  const particleAnim = useSharedValue(0);

  useEffect(() => {
    // Pulse animation
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Scanning line animation
    scanLineAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Particle animation
    particleAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Outer rotation animation
    rotateAnim.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );

    // Inner rotation animation (opposite direction)
    innerRotateAnim.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    // Glow animation
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Thinking dots animation with recursion
    const animateDots = () => {
      dotAnim1.value = withSequence(
        withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withDelay(
          800,
          withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
        )
      );

      dotAnim2.value = withSequence(
        withDelay(
          400,
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        withDelay(
          400,
          withTiming(0, { duration: 400, easing: Easing.inOut(Easing.ease) })
        )
      );

      dotAnim3.value = withSequence(
        withDelay(
          800,
          withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        withTiming(
          0,
          { duration: 400, easing: Easing.inOut(Easing.ease) },
          (finished) => {
            if (finished) {
              runOnJS(animateDots)();
            }
          }
        )
      );
    };

    animateDots();

    // Fade in animation
    opacityAnim.value = withTiming(1, {
      duration: 500,
      easing: Easing.inOut(Easing.ease),
    });
  }, []);

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacityAnim.value,
  }));

  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnim.value, [0, 1], [1, 1.3]);
    const rotation = interpolate(rotateAnim.value, [0, 1], [0, 360]);

    return {
      transform: [{ scale }, { rotate: `${rotation}deg` }],
    };
  });

  const innerRotateStyle = useAnimatedStyle(() => {
    const rotation = interpolate(innerRotateAnim.value, [0, 1], [0, -360]);
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowAnim.value, [0, 1], [0.2, 0.6]),
  }));

  const scanLineStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scanLineAnim.value, [0, 1], [0, 96]); // 24 * 4 = 96 (h-24 in pixels)
    return {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: "#c1fe00",
      transform: [{ translateY }],
    };
  });

  const dot1Style = useAnimatedStyle(() => ({
    opacity: dotAnim1.value,
    transform: [{ scale: dotAnim1.value }],
  }));

  const dot2Style = useAnimatedStyle(() => ({
    opacity: dotAnim2.value,
    transform: [{ scale: dotAnim2.value }],
  }));

  const dot3Style = useAnimatedStyle(() => ({
    opacity: dotAnim3.value,
    transform: [{ scale: dotAnim3.value }],
  }));

  // Particle styles
  const createParticleStyle = (index: number) => {
    return useAnimatedStyle(() => {
      const angle = index * (Math.PI / 4);
      const translateX = Math.cos(angle) * 40 * particleAnim.value;
      const translateY = Math.sin(angle) * 40 * particleAnim.value;

      return {
        position: "absolute",
        width: 4,
        height: 4,
        backgroundColor: "#c1fe00",
        borderRadius: 2,
        opacity: particleAnim.value,
        transform: [{ translateX }, { translateY }],
      };
    });
  };

  return (
    <Animated.View
      style={[containerStyle]}
      className="flex-1 items-center justify-center py-12"
    >
      <View className="items-center">
        <View className="relative">
          <Animated.View
            style={[pulseStyle]}
            className="h-24 w-24 items-center justify-center rounded-full border-4 border-primary"
          >
            <Animated.View
              style={[innerRotateStyle]}
              className="h-20 w-20 items-center justify-center rounded-full border-2 border-primary"
            >
              <Animated.View
                style={[glowStyle]}
                className="h-16 w-16 rounded-full bg-primary"
              />
            </Animated.View>
          </Animated.View>

          {/* Scanning line */}
          <Animated.View style={scanLineStyle} />

          {/* Particles */}
          {[...Array(8)].map((_, i) => (
            <Animated.View key={i} style={createParticleStyle(i)} />
          ))}
        </View>

        <View className="mt-6 flex-row items-center">
          <Text className="text-lg font-medium text-primary">
            {t("common.aiProcessing")}
          </Text>
          <View className="ml-2 flex-row">
            <Animated.View
              style={[dot1Style]}
              className="mx-0.5 h-2 w-2 rounded-full bg-primary"
            />
            <Animated.View
              style={[dot2Style]}
              className="mx-0.5 h-2 w-2 rounded-full bg-primary"
            />
            <Animated.View
              style={[dot3Style]}
              className="mx-0.5 h-2 w-2 rounded-full bg-primary"
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
