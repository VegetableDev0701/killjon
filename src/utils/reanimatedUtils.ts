import { useCallback, useMemo } from "react";
import {
  Extrapolation,
  interpolate,
  interpolateColor,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// Animation configuration
export const REANIMATED_CONFIG = {
  // Timing configs with Any.do-inspired easing
  TIMING: {
    FAST: { duration: 150 },
    NORMAL: { duration: 300 },
    SLOW: { duration: 500 },
    EXTRA_SLOW: { duration: 800 },
  },

  // Spring configs
  SPRING: {
    GENTLE: {
      damping: 20,
      stiffness: 90,
      mass: 1,
    },
    BOUNCY: {
      damping: 15,
      stiffness: 150,
      mass: 1,
    },
    SNAPPY: {
      damping: 25,
      stiffness: 200,
      mass: 0.8,
    },
    SMOOTH: {
      damping: 20,
      stiffness: 120,
      mass: 0.9,
    },
    PLAYFUL: {
      damping: 10,
      stiffness: 180,
      mass: 0.7,
    },
  },

  // Common values
  SCALE: {
    PRESSED: 0.95,
    HOVER: 1.05,
    NORMAL: 1,
    LARGE: 1.2,
  },
};

// Any.do-inspired easing functions
import { Easing } from "react-native-reanimated";

export const ANYDO_EASING = {
  // Smooth entrance (similar to Any.do modal slides)
  entrance: Easing.bezier(0.25, 0.46, 0.45, 0.94), // easeOutQuart

  // Smooth exit
  exit: Easing.bezier(0.55, 0.085, 0.68, 0.53), // easeInQuart

  // Standard smooth transition
  standard: Easing.bezier(0.4, 0, 0.2, 1), // Material easeInOut

  // Emphasize entrance
  emphasize: Easing.bezier(0, 0, 0.2, 1), // Material emphasized

  // De-emphasize exit
  deemphasize: Easing.bezier(0.4, 0, 1, 1),

  // Smooth bounce
  bounce: Easing.bezier(0.68, -0.55, 0.265, 1.55),
};

// Animation timing configurations
export const ANYDO_TIMING = {
  // Quick micro-interactions
  micro: {
    duration: 200,
    easing: ANYDO_EASING.standard,
  },

  // Standard UI transitions
  standard: {
    duration: 300,
    easing: ANYDO_EASING.standard,
  },

  // Modal and sheet animations
  modal: {
    duration: 350,
    easing: ANYDO_EASING.entrance,
  },

  // Screen transitions
  screen: {
    duration: 400,
    easing: ANYDO_EASING.entrance,
  },

  // Emphasized animations
  emphasized: {
    duration: 450,
    easing: ANYDO_EASING.emphasize,
  },
};

// Spring configurations for Any.do-like feel
export const ANYDO_SPRING = {
  // Smooth and natural
  smooth: {
    damping: 20,
    mass: 0.8,
    stiffness: 100,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },

  // Snappy response
  snappy: {
    damping: 18,
    mass: 0.6,
    stiffness: 150,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },

  // Gentle bounce
  gentle: {
    damping: 15,
    mass: 1,
    stiffness: 120,
    overshootClamping: false,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
};

// Animation worklets
export const animateWithTiming = (
  value: SharedValue<number>,
  toValue: number,
  config = REANIMATED_CONFIG.TIMING.NORMAL
) => {
  "worklet";
  return withTiming(toValue, config);
};

export const animateWithSpring = (
  value: SharedValue<number>,
  toValue: number,
  config = REANIMATED_CONFIG.SPRING.GENTLE
) => {
  "worklet";
  return withSpring(toValue, config);
};

// Custom hooks for common animations

// Fade animation hook
export const useFadeAnimation = (initialValue: number = 0) => {
  const opacity = useSharedValue(initialValue);

  const fadeIn = useCallback(
    (duration?: number) => {
      opacity.value = withTiming(1, { duration: duration || 300 });
    },
    [opacity]
  );

  const fadeOut = useCallback(
    (duration?: number) => {
      opacity.value = withTiming(0, { duration: duration || 300 });
    },
    [opacity]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return { opacity, fadeIn, fadeOut, animatedStyle };
};

// Scale animation hook for button press
export const useScaleAnimation = (initialScale: number = 1) => {
  const scale = useSharedValue(initialScale);

  const scaleIn = useCallback(() => {
    scale.value = withSpring(
      REANIMATED_CONFIG.SCALE.PRESSED,
      REANIMATED_CONFIG.SPRING.SNAPPY
    );
  }, [scale]);

  const scaleOut = useCallback(() => {
    scale.value = withSpring(
      REANIMATED_CONFIG.SCALE.NORMAL,
      REANIMATED_CONFIG.SPRING.GENTLE
    );
  }, [scale]);

  const bounce = useCallback(() => {
    scale.value = withSequence(
      withSpring(
        REANIMATED_CONFIG.SCALE.LARGE,
        REANIMATED_CONFIG.SPRING.BOUNCY
      ),
      withSpring(
        REANIMATED_CONFIG.SCALE.NORMAL,
        REANIMATED_CONFIG.SPRING.GENTLE
      )
    );
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { scale, scaleIn, scaleOut, bounce, animatedStyle };
};

// Slide animation hook
export const useSlideAnimation = (
  direction: "left" | "right" | "up" | "down" = "right",
  distance: number = 100
) => {
  const translateX = useSharedValue(
    direction === "left" ? -distance : direction === "right" ? distance : 0
  );
  const translateY = useSharedValue(
    direction === "up" ? -distance : direction === "down" ? distance : 0
  );

  const slideIn = useCallback(() => {
    translateX.value = withSpring(0, REANIMATED_CONFIG.SPRING.GENTLE);
    translateY.value = withSpring(0, REANIMATED_CONFIG.SPRING.GENTLE);
  }, [translateX, translateY]);

  const slideOut = useCallback(
    (customDistance?: number) => {
      const dist = customDistance || distance;
      if (direction === "left")
        translateX.value = withTiming(-dist, REANIMATED_CONFIG.TIMING.FAST);
      if (direction === "right")
        translateX.value = withTiming(dist, REANIMATED_CONFIG.TIMING.FAST);
      if (direction === "up")
        translateY.value = withTiming(-dist, REANIMATED_CONFIG.TIMING.FAST);
      if (direction === "down")
        translateY.value = withTiming(dist, REANIMATED_CONFIG.TIMING.FAST);
    },
    [translateX, translateY, direction, distance]
  );

  const reset = useCallback(() => {
    translateX.value =
      direction === "left" ? -distance : direction === "right" ? distance : 0;
    translateY.value =
      direction === "up" ? -distance : direction === "down" ? distance : 0;
  }, [translateX, translateY, direction, distance]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return { translateX, translateY, slideIn, slideOut, reset, animatedStyle };
};

// Shake animation hook
export const useShakeAnimation = () => {
  const translateX = useSharedValue(0);

  const shake = useCallback(
    (intensity: number = 10) => {
      translateX.value = withSequence(
        withTiming(intensity, { duration: 50 }),
        withTiming(-intensity, { duration: 50 }),
        withTiming(intensity, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    },
    [translateX]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { shake, animatedStyle };
};

// Progress animation hook
export const useProgressAnimation = (initialProgress: number = 0) => {
  const progress = useSharedValue(initialProgress);

  const animateToProgress = useCallback(
    (toValue: number, duration?: number) => {
      progress.value = withTiming(toValue, { duration: duration || 500 });
    },
    [progress]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const widthStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  return { progress, animateToProgress, animatedStyle, widthStyle };
};

// Rotation animation hook
export const useRotationAnimation = () => {
  const rotation = useSharedValue(0);

  const rotate = useCallback(
    (degrees: number = 360, duration?: number) => {
      rotation.value = withTiming(degrees, { duration: duration || 500 });
    },
    [rotation]
  );

  const spin = useCallback(
    (duration?: number) => {
      rotation.value = withRepeat(
        withTiming(360, { duration: duration || 1000 }),
        -1,
        false
      );
    },
    [rotation]
  );

  const stopSpin = useCallback(() => {
    rotation.value = withTiming(0, { duration: 300 });
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return { rotation, rotate, spin, stopSpin, animatedStyle };
};

// Stagger animation hook
export const useStaggerAnimation = (
  itemCount: number,
  staggerDelay: number = 100
) => {
  const progressValue1 = useSharedValue(0);
  const progressValue2 = useSharedValue(0);
  const progressValue3 = useSharedValue(0);
  const progressValue4 = useSharedValue(0);
  const progressValue5 = useSharedValue(0);
  const progressValue6 = useSharedValue(0);

  const opacities = useMemo(
    () => [
      progressValue1,
      progressValue2,
      progressValue3,
      progressValue4,
      progressValue5,
      progressValue6,
    ],
    [
      progressValue1,
      progressValue2,
      progressValue3,
      progressValue4,
      progressValue5,
      progressValue6,
    ]
  );

  const translateY1 = useSharedValue(30);
  const translateY2 = useSharedValue(30);
  const translateY3 = useSharedValue(30);
  const translateY4 = useSharedValue(30);
  const translateY5 = useSharedValue(30);
  const translateY6 = useSharedValue(30);

  const translateYs = useMemo(
    () => [
      translateY1,
      translateY2,
      translateY3,
      translateY4,
      translateY5,
      translateY6,
    ],
    [
      translateY1,
      translateY2,
      translateY3,
      translateY4,
      translateY5,
      translateY6,
    ]
  );

  const animateIn = useCallback(() => {
    opacities.forEach((opacity, index) => {
      opacity.value = withDelay(
        index * staggerDelay,
        withTiming(1, REANIMATED_CONFIG.TIMING.NORMAL)
      );
    });

    translateYs.forEach((translateY, index) => {
      translateY.value = withDelay(
        index * staggerDelay,
        withSpring(0, REANIMATED_CONFIG.SPRING.GENTLE)
      );
    });
  }, [opacities, translateYs, staggerDelay]);

  const animateOut = useCallback(() => {
    opacities.forEach((opacity, index) => {
      opacity.value = withDelay(
        index * (staggerDelay / 2),
        withTiming(0, REANIMATED_CONFIG.TIMING.FAST)
      );
    });

    translateYs.forEach((translateY, index) => {
      translateY.value = withDelay(
        index * (staggerDelay / 2),
        withTiming(-20, REANIMATED_CONFIG.TIMING.FAST)
      );
    });
  }, [opacities, translateYs, staggerDelay]);

  // Create individual animated styles for each item
  const animatedStyle1 = useAnimatedStyle(() => ({
    opacity: progressValue1.value,
    transform: [{ translateY: translateY1.value }],
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    opacity: progressValue2.value,
    transform: [{ translateY: translateY2.value }],
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    opacity: progressValue3.value,
    transform: [{ translateY: translateY3.value }],
  }));

  const animatedStyle4 = useAnimatedStyle(() => ({
    opacity: progressValue4.value,
    transform: [{ translateY: translateY4.value }],
  }));

  const animatedStyle5 = useAnimatedStyle(() => ({
    opacity: progressValue5.value,
    transform: [{ translateY: translateY5.value }],
  }));

  const animatedStyle6 = useAnimatedStyle(() => ({
    opacity: progressValue6.value,
    transform: [{ translateY: translateY6.value }],
  }));

  const animatedStyles = useMemo(
    () => [
      animatedStyle1,
      animatedStyle2,
      animatedStyle3,
      animatedStyle4,
      animatedStyle5,
      animatedStyle6,
    ],
    [
      animatedStyle1,
      animatedStyle2,
      animatedStyle3,
      animatedStyle4,
      animatedStyle5,
      animatedStyle6,
    ]
  );

  const getAnimatedStyle = useCallback(
    (index: number) => {
      return animatedStyles[index] || animatedStyle1;
    },
    [animatedStyles, animatedStyle1]
  );

  return { animateIn, animateOut, getAnimatedStyle, animatedStyles };
};

// Card flip animation hook
export const useCardFlipAnimation = () => {
  const rotateY = useSharedValue(0);
  const isFlipped = useSharedValue(false);

  const flip = useCallback(() => {
    const toValue = isFlipped.value ? 0 : 180;
    rotateY.value = withSpring(toValue, REANIMATED_CONFIG.SPRING.GENTLE);
    isFlipped.value = !isFlipped.value;
  }, [rotateY, isFlipped]);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateYInterpolate = interpolate(
      rotateY.value,
      [0, 90],
      [0, 90],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ rotateY: `${rotateYInterpolate}deg` }],
      opacity: rotateY.value <= 90 ? 1 : 0,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateYInterpolate = interpolate(
      rotateY.value,
      [90, 180],
      [90, 0],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ rotateY: `${rotateYInterpolate}deg` }],
      opacity: rotateY.value > 90 ? 1 : 0,
    };
  });

  return { flip, frontAnimatedStyle, backAnimatedStyle, isFlipped };
};

// Celebration animation hook
export const useCelebrationAnimation = () => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const translateY = useSharedValue(0);

  const celebrate = useCallback(
    (onComplete?: () => void) => {
      // Bounce and rotate
      scale.value = withSequence(
        withSpring(1.3, REANIMATED_CONFIG.SPRING.BOUNCY),
        withSpring(1, REANIMATED_CONFIG.SPRING.GENTLE)
      );

      rotation.value = withTiming(360, { duration: 800 });

      translateY.value = withSequence(
        withSpring(-20, REANIMATED_CONFIG.SPRING.BOUNCY),
        withSpring(0, REANIMATED_CONFIG.SPRING.GENTLE, (finished) => {
          if (finished && onComplete) {
            runOnJS(onComplete)();
          }
        })
      );

      // Reset rotation after animation
      setTimeout(() => {
        rotation.value = 0;
      }, 800);
    },
    [scale, rotation, translateY]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
      { translateY: translateY.value },
    ],
  }));

  return { celebrate, animatedStyle };
};

// Loading animation hook
export const useLoadingAnimation = () => {
  const opacity = useSharedValue(0.3);
  const scale = useSharedValue(0.8);

  const startLoading = useCallback(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      false
    );

    scale.value = withRepeat(
      withSequence(
        withSpring(1.1, REANIMATED_CONFIG.SPRING.GENTLE),
        withSpring(0.8, REANIMATED_CONFIG.SPRING.GENTLE)
      ),
      -1,
      false
    );
  }, [opacity, scale]);

  const stopLoading = useCallback(() => {
    opacity.value = withTiming(1, REANIMATED_CONFIG.TIMING.FAST);
    scale.value = withSpring(1, REANIMATED_CONFIG.SPRING.GENTLE);
  }, [opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return { startLoading, stopLoading, animatedStyle };
};

// Page transition animation hook (Any.do style)
export const usePageTransition = (
  direction: "forward" | "backward" = "forward"
) => {
  const translateX = useSharedValue(direction === "forward" ? 100 : -100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);

  const enter = useCallback(() => {
    "worklet";
    translateX.value = withTiming(0, ANYDO_TIMING.screen);
    opacity.value = withTiming(1, ANYDO_TIMING.screen);
    scale.value = withTiming(1, ANYDO_TIMING.screen);
  }, [translateX, opacity, scale]);

  const exit = useCallback(
    (exitDirection: "forward" | "backward" = "backward") => {
      "worklet";
      const exitX = exitDirection === "forward" ? -100 : 100;
      translateX.value = withTiming(exitX, {
        duration: 250,
        easing: ANYDO_EASING.exit,
      });
      opacity.value = withTiming(0, {
        duration: 250,
        easing: ANYDO_EASING.exit,
      });
      scale.value = withTiming(0.95, {
        duration: 250,
        easing: ANYDO_EASING.exit,
      });
    },
    [translateX, opacity, scale]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return { enter, exit, animatedStyle };
};

// Modal transition hook (Any.do style bottom sheet)
export const useModalTransition = (height: number = 500) => {
  const translateY = useSharedValue(height);
  const backdropOpacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  const show = useCallback(() => {
    "worklet";
    backdropOpacity.value = withTiming(0.5, ANYDO_TIMING.modal);
    translateY.value = withSpring(0, ANYDO_SPRING.smooth);
    scale.value = withSpring(1, ANYDO_SPRING.smooth);
  }, [backdropOpacity, translateY, scale]);

  const hide = useCallback(
    (onComplete?: () => void) => {
      "worklet";
      backdropOpacity.value = withTiming(0, {
        duration: 250,
        easing: ANYDO_EASING.exit,
      });
      translateY.value = withTiming(
        height,
        {
          duration: 250,
          easing: ANYDO_EASING.exit,
        },
        (finished) => {
          if (finished && onComplete) {
            runOnJS(onComplete)();
          }
        }
      );
      scale.value = withTiming(0.9, {
        duration: 250,
        easing: ANYDO_EASING.exit,
      });
    },
    [backdropOpacity, translateY, scale, height]
  );

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return { show, hide, modalStyle, backdropStyle };
};

// Smooth list item entrance animation
export const useListItemAnimation = (index: number, staggerDelay = 50) => {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);

  const enter = useCallback(() => {
    "worklet";
    opacity.value = withDelay(
      index * staggerDelay,
      withTiming(1, ANYDO_TIMING.standard)
    );
    translateY.value = withDelay(
      index * staggerDelay,
      withSpring(0, ANYDO_SPRING.smooth)
    );
  }, [index, staggerDelay, opacity, translateY]);

  const exit = useCallback(() => {
    "worklet";
    opacity.value = withTiming(0, ANYDO_TIMING.micro);
    translateY.value = withTiming(-20, ANYDO_TIMING.micro);
  }, [opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return { enter, exit, animatedStyle };
};

// Press animation hook (Any.do style buttons)
export const usePressAnimation = (scaleValue = 0.95) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const pressIn = useCallback(() => {
    "worklet";
    scale.value = withSpring(scaleValue, ANYDO_SPRING.snappy);
    opacity.value = withTiming(0.8, ANYDO_TIMING.micro);
  }, [scale, opacity, scaleValue]);

  const pressOut = useCallback(() => {
    "worklet";
    scale.value = withSpring(1, ANYDO_SPRING.snappy);
    opacity.value = withTiming(1, ANYDO_TIMING.micro);
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return { pressIn, pressOut, animatedStyle };
};

// Cross-fade transition hook
export const useCrossFadeTransition = () => {
  const opacity = useSharedValue(1);

  const fadeOut = useCallback(
    (onComplete?: () => void) => {
      "worklet";
      opacity.value = withTiming(0, ANYDO_TIMING.standard, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      });
    },
    [opacity]
  );

  const fadeIn = useCallback(() => {
    "worklet";
    opacity.value = withTiming(1, ANYDO_TIMING.standard);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return { fadeOut, fadeIn, animatedStyle };
};

// Focus animation hook for form fields
export const useFocusAnimation = () => {
  const scale = useSharedValue(1);
  const borderOpacity = useSharedValue(0.1);
  const borderColor = useSharedValue(0); // 0 for grey, 1 for primary

  const onFocus = useCallback(() => {
    scale.value = withSpring(1.02, REANIMATED_CONFIG.SPRING.GENTLE);
    borderOpacity.value = withTiming(1, REANIMATED_CONFIG.TIMING.FAST);
    borderColor.value = withTiming(1, REANIMATED_CONFIG.TIMING.FAST);
  }, [scale, borderOpacity, borderColor]);

  const onBlur = useCallback(() => {
    scale.value = withSpring(1, REANIMATED_CONFIG.SPRING.GENTLE);
    borderOpacity.value = withTiming(0.1, REANIMATED_CONFIG.TIMING.FAST);
    borderColor.value = withTiming(0, REANIMATED_CONFIG.TIMING.FAST);
  }, [scale, borderOpacity, borderColor]);

  const animatedStyle = useAnimatedStyle(() => {
    const primaryBlue = "rgba(59, 130, 246, 1)"; // Primary color
    const greyColor = "rgba(156, 163, 175, 0.5)"; // Grey color

    const currentColor = interpolateColor(
      borderColor.value,
      [0, 1],
      [greyColor, primaryBlue]
    );

    return {
      transform: [{ scale: scale.value }],
      borderColor: currentColor,
      shadowOpacity: borderOpacity.value * 0.3,
    };
  });

  return { onFocus, onBlur, animatedStyle };
};
