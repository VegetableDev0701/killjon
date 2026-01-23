import React, { useEffect } from "react";
import { ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { ANYDO_SPRING, ANYDO_TIMING } from "../../utils/reanimatedUtils";

interface SharedElementTransitionProps {
  children: React.ReactNode;
  uniqueId: string;
  style?: ViewStyle;
  className?: string;
  isSource?: boolean; // True if this is the source element
  isDestination?: boolean; // True if this is the destination element
}

/**
 * SharedElementTransition - Hero animation component
 *
 * For smooth transitions between screens:
 * 1. Wrap the source element (e.g., thumbnail) with this component and set isSource={true}
 * 2. Wrap the destination element (e.g., full image) with isDestination={true}
 * 3. Use the same uniqueId for both elements
 *
 * Example:
 * // Screen 1 (List)
 * <SharedElementTransition uniqueId={`image-${item.id}`} isSource>
 *   <Image source={{uri: item.thumbnail}} />
 * </SharedElementTransition>
 *
 * // Screen 2 (Detail)
 * <SharedElementTransition uniqueId={`image-${item.id}`} isDestination>
 *   <Image source={{uri: item.fullImage}} />
 * </SharedElementTransition>
 */
export const SharedElementTransition: React.FC<
  SharedElementTransitionProps
> = ({
  children,
  uniqueId,
  style,
  className = "",
  isSource = false,
  isDestination = false,
}) => {
  const scale = useSharedValue(isDestination ? 0.8 : 1);
  const opacity = useSharedValue(isDestination ? 0 : 1);

  useEffect(() => {
    if (isDestination) {
      // Animate in the destination element
      scale.value = withSpring(1, ANYDO_SPRING.smooth);
      opacity.value = withTiming(1, ANYDO_TIMING.standard);
    } else if (isSource) {
      // Prepare source for transition (optional pre-animation)
      scale.value = 1;
      opacity.value = 1;
    }
  }, [isSource, isDestination]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[animatedStyle, style]}
      className={className}
      // Store uniqueId for reference (not used in basic implementation)
      nativeID={uniqueId}
    >
      {children}
    </Animated.View>
  );
};

/**
 * useSharedElementTransition - Hook for programmatic shared element transitions
 *
 * Usage:
 * const { prepareTransition, startTransition } = useSharedElementTransition();
 *
 * // On source screen before navigation
 * prepareTransition('image-123');
 * navigation.navigate('Detail', { id: 123 });
 *
 * // On destination screen after mount
 * useEffect(() => {
 *   startTransition('image-123');
 * }, []);
 */
export const useSharedElementTransition = () => {
  const transitionState = useSharedValue<Record<string, boolean>>({});

  const prepareTransition = (elementId: string) => {
    "worklet";
    transitionState.value = {
      ...transitionState.value,
      [elementId]: true,
    };
  };

  const startTransition = (elementId: string) => {
    "worklet";
    // Mark transition as started
    transitionState.value = {
      ...transitionState.value,
      [elementId]: false,
    };
  };

  const isTransitioning = (elementId: string) => {
    "worklet";
    return transitionState.value[elementId] === true;
  };

  return {
    prepareTransition,
    startTransition,
    isTransitioning,
  };
};

/**
 * AnimatedImageTransition - Specialized component for image hero transitions
 *
 * This provides a more polished image-specific transition with proper aspect ratio handling
 */
interface AnimatedImageTransitionProps {
  source: { uri: string };
  style?: ViewStyle;
  className?: string;
  uniqueId: string;
  isDestination?: boolean;
  onLoadEnd?: () => void;
}

export const AnimatedImageTransition: React.FC<
  AnimatedImageTransitionProps
> = ({
  source,
  style,
  className = "",
  uniqueId,
  isDestination = false,
  onLoadEnd,
}) => {
  const scale = useSharedValue(isDestination ? 0.9 : 1);
  const opacity = useSharedValue(isDestination ? 0 : 1);
  const borderRadius = useSharedValue(isDestination ? 24 : 12);

  useEffect(() => {
    if (isDestination) {
      // Smooth hero animation for images
      scale.value = withSpring(1, {
        ...ANYDO_SPRING.smooth,
        damping: 15,
      });
      opacity.value = withTiming(1, {
        ...ANYDO_TIMING.emphasized,
        duration: 500,
      });
      borderRadius.value = withSpring(12, ANYDO_SPRING.smooth);
    }
  }, [isDestination]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    borderRadius: borderRadius.value,
  }));

  return (
    <Animated.Image
      source={source}
      style={[animatedStyle, style]}
      className={className}
      nativeID={uniqueId}
      onLoadEnd={onLoadEnd}
      resizeMode="cover"
    />
  );
};
