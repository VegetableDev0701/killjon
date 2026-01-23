import { Pressable, StyleSheet } from "react-native";

import { useMemo } from "react";

import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { isLiquidGlassSupported } from "@callstack/liquid-glass";
import { IS_ANDROID } from "../../utils/constants";
import {
  LiquidGlassContainer,
  liquidGlassProps,
} from "../../utils/liquidGlass";

const TimingConfig = {
  duration: 300,
  easing: Easing.bezier(0.4, 0.0, 0.2, 1),
};

type AnimatedTabProps<T extends { name: string }> = {
  data: readonly T[];
  onPress: (item: T) => void;
  selected: T;
  width: number;
  height: number;
};

export function AnimatedTab<T extends { name: string }>({
  data,
  onPress,
  selected,
  width,
  height,
}: AnimatedTabProps<T>) {
  const internalPadding = 5;

  const cellBackgroundWidth = width / data.length;
  const activeIndexes = useSharedValue<number[]>([]);

  const selectedCellIndex = useMemo(
    () => data.findIndex((item) => item === selected),
    [data, selected]
  );

  const blurProgress = useSharedValue(0);

  const animatedBlurProps = useAnimatedProps(() => {
    return {
      intensity: interpolate(blurProgress.value, [0, 0.5, 1], [0, 15, 0]),
    };
  }, [blurProgress]);

  const rCellMessageStyle = useAnimatedStyle(() => {
    const padding = interpolate(
      selectedCellIndex,
      [0, data.length - 1],
      [internalPadding, -internalPadding]
    );
    // Example (with 5 items):
    // 0 -> internalPadding / 2
    // 1 ->  internalPadding / 4
    // 2 -> 0
    // 3 -> -internalPadding / 4
    // 4 -> -internalPadding / 2
    return {
      left: withTiming(
        cellBackgroundWidth * selectedCellIndex + padding,
        TimingConfig
      ),
    };
  }, [selectedCellIndex]);

  const rCellBlurMessageStyle = useAnimatedStyle(() => {
    return {
      left: withTiming(cellBackgroundWidth * selectedCellIndex, TimingConfig),
    };
  }, [selectedCellIndex]);

  return (
    <LiquidGlassContainer
      key={`background-${width}-${height}`}
      {...liquidGlassProps}
      style={[
        localStyles.backgroundContainer,
        (IS_ANDROID || !isLiquidGlassSupported) &&
          localStyles.backgroundContainerAndroid,
        {
          width,
          height,
        },
      ]}
    >
      {data.map((item, index) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const internalBlurProps = useAnimatedProps(() => {
          return {
            intensity: interpolate(
              activeIndexes.value.includes(index) ? blurProgress.value : 0,
              [0, 0.5, 1],
              [0, 10, 0]
            ),
          };
        }, [blurProgress]);

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const rLabelStyle = useAnimatedStyle(() => {
          return {
            color: withTiming(
              selectedCellIndex === index ? "#c1fe00" : "#F5f5f5",
              TimingConfig
            ),
          };
        }, [selectedCellIndex, index]);

        return (
          <Pressable
            key={item.name}
            style={localStyles.labelContainer}
            onPress={() => {
              onPress(item);
              const prevIndex = data.findIndex(
                (dataItem) => dataItem.name === selected.name
              );
              if (prevIndex === index) {
                return;
              }
              activeIndexes.value = [prevIndex, index];
              cancelAnimation(blurProgress);
              blurProgress.value = withTiming(1, TimingConfig, () => {
                blurProgress.value = 0;
                activeIndexes.value = [];
              });
            }}
          >
            <Animated.Text style={[localStyles.difficultyLabel, rLabelStyle]}>
              {item.name}
            </Animated.Text>
            <Animated.View
              {...internalBlurProps}
              style={localStyles.blurView}
            />
          </Pressable>
        );
      })}

      <LiquidGlassContainer
        key={`highlight-${width}-${height}`}
        {...liquidGlassProps}
        style={[
          {
            width: cellBackgroundWidth - internalPadding / data.length,
            height: height - internalPadding * 2,
          },
          localStyles.highlightedCellContent,
          IS_ANDROID && localStyles.highlightedCellContentAndroid,
          rCellMessageStyle,
        ]}
      />
      <Animated.View
        style={[
          {
            width: cellBackgroundWidth,
            height: height,
            zIndex: 10,
          },
          localStyles.highlightedCellBlurContent,
          rCellBlurMessageStyle,
        ]}
      >
        <Animated.View {...animatedBlurProps} style={localStyles.fill} />
      </Animated.View>
    </LiquidGlassContainer>
  );
}

const localStyles = StyleSheet.create({
  backgroundContainer: {
    borderCurve: "continuous",
    borderRadius: 30,
    flexDirection: "row",
  },
  backgroundContainerAndroid: {
    backgroundColor: "rgba(26, 42, 10, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(193, 254, 0, 0.15)",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  blurView: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1,
  },
  difficultyLabel: {
    color: "#18181b",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  fill: {
    flex: 1,
  },
  highlightedCellBlurContent: {
    alignSelf: "center",
    position: "absolute",
    zIndex: 1,
  },
  highlightedCellContent: {
    alignSelf: "center",
    borderCurve: "continuous",
    borderRadius: 30,
    position: "absolute",
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    zIndex: 1,
  },
  highlightedCellContentAndroid: {
    backgroundColor: "rgba(193, 254, 0, 0.15)",
    borderWidth: 1.5,
    borderColor: "rgba(193, 254, 0, 0.4)",
    elevation: 6,
    shadowColor: "#c1fe00",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  labelContainer: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: 5,
    justifyContent: "center",
    zIndex: 2,
  },
});
