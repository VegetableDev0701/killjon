import React, { useCallback, useEffect, useState } from "react";
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  Vibration,
  View,
  ViewStyle,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface SliderProps {
  /**
   * Current value of the slider [min, max]
   */
  value: [number, number];
  /**
   * Minimum value of the slider
   */
  minValue: number;
  /**
   * Maximum value of the slider
   */
  maxValue: number;
  /**
   * Step value for the slider
   */
  step?: number;
  /**
   * Callback when the value changes
   */
  onValueChange: (value: [number, number]) => void;
  /**
   * Format function for the label
   */
  formatLabel?: (value: number) => string;
  /**
   * Show min and max labels
   */
  showLabels?: boolean;
  /**
   * Show current value label
   */
  showValueLabel?: boolean;
  /**
   * Custom container style
   */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Custom track style
   */
  trackStyle?: StyleProp<ViewStyle>;
  /**
   * Custom fill style
   */
  fillStyle?: StyleProp<ViewStyle>;
  /**
   * Custom thumb style
   */
  thumbStyle?: StyleProp<ViewStyle>;
  /**
   * Custom label style
   */
  labelStyle?: StyleProp<TextStyle>;
  /**
   * Custom value label style
   */
  valueLabelStyle?: StyleProp<TextStyle>;
  /**
   * Enable haptic feedback
   */
  hapticFeedback?: boolean;
  /**
   * Show step indicators at step*10 intervals
   */
  spaceIndicator?: boolean;
}

// Helper function to provide haptic feedback
const triggerHaptic = (intensity: "light" | "medium") => {
  if (Platform.OS !== "web") {
    Vibration.vibrate(intensity === "light" ? [0, 1] : [0, 2]);
  }
};

/**
 * A reusable dual-range slider component that allows users to select a range by sliding two thumbs.
 */
const Slider = ({
  value,
  minValue,
  maxValue,
  step = 1,
  onValueChange,
  formatLabel = (val) => `${val}`,
  showLabels = false,
  showValueLabel = false,
  containerStyle,
  trackStyle,
  fillStyle,
  thumbStyle,
  labelStyle,
  valueLabelStyle,
  hapticFeedback = false,
  spaceIndicator = false,
}: SliderProps) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Shared values for animations
  const leftThumbPosition = useSharedValue(0);
  const rightThumbPosition = useSharedValue(0);
  const leftIsActive = useSharedValue(false);
  const rightIsActive = useSharedValue(false);
  const leftStartPosition = useSharedValue(0);
  const rightStartPosition = useSharedValue(0);

  // Calculate new value based on position
  const calculateValue = useCallback(
    (positionX: number): number => {
      "worklet";
      if (sliderWidth <= 0) return minValue;

      // Calculate percentage of position
      const percentage = Math.max(0, Math.min(1, positionX / sliderWidth));

      // Calculate raw value based on percentage
      let newValue = percentage * (maxValue - minValue) + minValue;

      // Apply step if provided
      if (step > 0) {
        newValue = Math.round(newValue / step) * step;
      }

      // Ensure value is within bounds
      return Math.max(minValue, Math.min(maxValue, newValue));
    },
    [sliderWidth, minValue, maxValue, step]
  );

  // Convert value to position
  const valueToPosition = useCallback(
    (val: number): number => {
      if (sliderWidth <= 0) return 0;
      return ((val - minValue) / (maxValue - minValue)) * sliderWidth;
    },
    [sliderWidth, minValue, maxValue]
  );

  // Update thumb positions when value changes
  useEffect(() => {
    if (!isDragging && sliderWidth > 0) {
      const leftPos = valueToPosition(value[0]);
      const rightPos = valueToPosition(value[1]);
      leftThumbPosition.value = withSpring(leftPos);
      rightThumbPosition.value = withSpring(rightPos);
    }
  }, [
    value,
    sliderWidth,
    isDragging,
    leftThumbPosition,
    rightThumbPosition,
    valueToPosition,
  ]);

  // Handle slider layout to get width
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setSliderWidth(event.nativeEvent.layout.width);
  }, []);

  // Handle press on track - move nearest thumb
  const handleTrackPress = useCallback(
    (x: number) => {
      const newValue = calculateValue(x);
      const currentLeft = value[0];
      const currentRight = value[1];

      // Determine which thumb is closer
      const distanceToLeft = Math.abs(newValue - currentLeft);
      const distanceToRight = Math.abs(newValue - currentRight);

      let newRange: [number, number];
      if (distanceToLeft <= distanceToRight) {
        // Move left thumb, but don't let it go past right thumb
        newRange = [Math.min(newValue, currentRight), currentRight];
      } else {
        // Move right thumb, but don't let it go past left thumb
        newRange = [currentLeft, Math.max(newValue, currentLeft)];
      }

      // Provide haptic feedback if enabled
      if (hapticFeedback) {
        triggerHaptic("medium");
      }

      onValueChange(newRange);
    },
    [calculateValue, onValueChange, hapticFeedback, value]
  );

  // Gesture handler for the left thumb
  const leftPanGesture = Gesture.Pan()
    .onBegin(() => {
      leftIsActive.value = true;
    })
    .onStart(() => {
      leftStartPosition.value = leftThumbPosition.value;
      runOnJS(setIsDragging)(true);
    })
    .onUpdate((event) => {
      // Calculate new position based on translation from start position
      const newPosition = Math.max(
        0,
        Math.min(
          rightThumbPosition.value,
          leftStartPosition.value + event.translationX
        )
      );
      leftThumbPosition.value = newPosition;

      const newValue = calculateValue(newPosition);

      // Only update if value changed
      if (newValue !== value[0]) {
        runOnJS(onValueChange)([newValue, value[1]]);

        // Provide subtle haptic feedback on value change if enabled
        if (hapticFeedback && step > 0 && newValue % (step * 10) === 0) {
          runOnJS(triggerHaptic)("light");
        }
      }
    })
    .onEnd(() => {
      leftIsActive.value = false;
      runOnJS(setIsDragging)(false);
    });

  // Gesture handler for the right thumb
  const rightPanGesture = Gesture.Pan()
    .onBegin(() => {
      rightIsActive.value = true;
    })
    .onStart(() => {
      rightStartPosition.value = rightThumbPosition.value;
      runOnJS(setIsDragging)(true);
    })
    .onUpdate((event) => {
      // Calculate new position based on translation from start position
      const newPosition = Math.max(
        leftThumbPosition.value,
        Math.min(sliderWidth, rightStartPosition.value + event.translationX)
      );
      rightThumbPosition.value = newPosition;

      const newValue = calculateValue(newPosition);

      // Only update if value changed
      if (newValue !== value[1]) {
        runOnJS(onValueChange)([value[0], newValue]);

        // Provide subtle haptic feedback on value change if enabled
        if (hapticFeedback && step > 0 && newValue % (step * 10) === 0) {
          runOnJS(triggerHaptic)("light");
        }
      }
    })
    .onEnd(() => {
      rightIsActive.value = false;
      runOnJS(setIsDragging)(false);
    });

  // Check if thumb is on a step indicator
  const isOnStep = useCallback(
    (value: number) => {
      if (!spaceIndicator || step <= 0) return false;
      const stepInterval = step * 10;
      return value % stepInterval === 0;
    },
    [spaceIndicator, step]
  );

  // Animated styles for the left thumb
  const leftThumbAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: leftThumbPosition.value },
        { translateY: 0 },
        { scale: withSpring(leftIsActive.value ? 1.2 : 1) },
      ],
      left: -12, // Offset by half thumb width to center it on the track start
    };
  });

  // Animated styles for the right thumb
  const rightThumbAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        // The translateX is now simply the thumb's position, making it consistent with the left thumb.
        { translateX: rightThumbPosition.value },
        { translateY: 0 },
        { scale: withSpring(rightIsActive.value ? 1.2 : 1) },
      ],
      left: -12, // Offset by half thumb width to center it on the track end
    };
  });

  // Animated styles for the fill (between the two thumbs)
  const fillAnimatedStyle = useAnimatedStyle(() => {
    const leftPos = leftThumbPosition.value;
    const rightPos = rightThumbPosition.value;
    const width = Math.max(0, rightPos - leftPos);

    return {
      left: leftPos,
      width: width,
    };
  });

  // Generate step indicators at step*10 intervals
  const generateStepIndicators = useCallback(() => {
    if (!spaceIndicator || step <= 0 || sliderWidth <= 0) return [];

    const indicators = [];
    const stepInterval = step * 10;

    for (let val = minValue; val <= maxValue; val += stepInterval) {
      if (val > minValue && val < maxValue) {
        // Don't show indicators at min/max positions
        const position = valueToPosition(val);
        indicators.push(
          <View
            key={val}
            style={[
              styles.stepIndicator,
              { left: position - 3 }, // Center the indicator (width is 2)
            ]}
          />
        );
      }
    }

    return indicators;
  }, [spaceIndicator, step, sliderWidth, minValue, maxValue, valueToPosition]);

  return (
    <GestureHandlerRootView style={[styles.container, containerStyle]}>
      {showValueLabel && (
        <Text style={[styles.valueLabel, valueLabelStyle]}>
          {formatLabel(value[0])} - {formatLabel(value[1])}
        </Text>
      )}

      <View style={styles.sliderContainer}>
        {showLabels && (
          <Text style={[styles.label, labelStyle]}>
            {formatLabel(minValue)}
          </Text>
        )}

        <View style={styles.trackContainer} onLayout={handleLayout}>
          <Pressable
            style={styles.pressableTrack}
            onPress={(event) => handleTrackPress(event.nativeEvent.locationX)}
          >
            <View style={[styles.track, trackStyle]}>
              <Animated.View
                style={[styles.fill, fillAnimatedStyle, fillStyle]}
              />
              {generateStepIndicators()}
            </View>
          </Pressable>

          <GestureDetector gesture={leftPanGesture}>
            <Animated.View
              style={[styles.thumb, leftThumbAnimatedStyle, thumbStyle]}
            >
              <View
                style={[
                  styles.thumbInner,
                  isOnStep(value[0]) && styles.thumbInnerFilled,
                ]}
              />
            </Animated.View>
          </GestureDetector>

          <GestureDetector gesture={rightPanGesture}>
            <Animated.View
              style={[styles.thumb, rightThumbAnimatedStyle, thumbStyle]}
            >
              <View
                style={[
                  styles.thumbInner,
                  isOnStep(value[1]) && styles.thumbInnerFilled,
                ]}
              />
            </Animated.View>
          </GestureDetector>
        </View>

        {showLabels && (
          <Text style={[styles.label, labelStyle]}>
            {formatLabel(maxValue)}
          </Text>
        )}
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 10,
  },
  valueLabel: {
    fontSize: 16,
    color: "#c1fe00",
    textAlign: "center",
    marginBottom: 12,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  label: {
    fontSize: 12,
    color: "#c1fe00",
    minWidth: 50,
    textAlign: "center",
  },
  trackContainer: {
    flex: 1,
    height: 40,
    justifyContent: "center",
    marginHorizontal: 8,
    position: "relative",
  },
  pressableTrack: {
    width: "100%",
    height: 40,
    justifyContent: "center",
  },
  track: {
    height: 6,
    backgroundColor: "#232323",
    borderRadius: 3,
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  fill: {
    position: "absolute",
    height: "100%",
    backgroundColor: "#c1fe00",
    borderRadius: 3,
  },
  thumb: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#c1fe00",
    justifyContent: "center",
    alignItems: "center",
    transform: [{ translateY: -12 }], // Adjust for vertical centering
    borderWidth: 2,
    borderColor: "#000000",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 10,
  },
  thumbInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#232323",
  },
  thumbInnerFilled: {
    backgroundColor: "#c1fe00",
  },
  stepIndicator: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#000000",
    zIndex: 1,
  },
});

export default Slider;
