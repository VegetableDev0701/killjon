import { LegendListRef } from "@legendapp/list";
import { AnimatedLegendList } from "@legendapp/list/reanimated";
import { X } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import FastImage from "react-native-fast-image";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { IS_IOS, screenHeight, screenWidth } from "../../utils/constants";
import {
  LiquidGlassContainer,
  liquidGlassProps,
} from "../../utils/liquidGlass";

const DISMISS_THRESHOLD_RATIO = 0.2;
const SCALE_INTERPOLATION_RANGE = [0, 0.3];
const SCALE_VALUES = [1, 0.8];
const IMAGE_HEIGHT_RATIO = 0.8;
const INITIAL_DELAY = 100;

interface Props {
  visible: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
  backgroundColor?: string;
}

const FullScreenImageViewer: React.FC<Props> = ({
  visible,
  images,
  initialIndex = 0,
  onClose,
  backgroundColor = "rgba(0, 0, 0, 0.95)",
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<LegendListRef>(null);
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible && images.length > 0) {
      setCurrentIndex(initialIndex);
      scale.value = 1;
      translateY.value = 0;

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Scroll to initial index after a small delay to ensure FlatList is rendered
      timeoutRef.current = setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialIndex,
          animated: false,
        });
      }, INITIAL_DELAY);
    }

    // Cleanup timeout on unmount or dependency change
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [visible, initialIndex, images.length, scale, translateY]);

  // Memoized scroll handler to prevent recreation
  const handleScroll = useCallback((event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    setCurrentIndex(index);
  }, []);

  // Memoized pan gesture to prevent recreation
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((event) => {
          // Handle vertical swipe for dismiss gesture only
          if (Math.abs(event.translationY) > Math.abs(event.translationX)) {
            translateY.value = event.translationY;
            const progress = Math.abs(event.translationY) / screenHeight;
            scale.value = interpolate(
              progress,
              SCALE_INTERPOLATION_RANGE,
              SCALE_VALUES,
              Extrapolation.CLAMP
            );
          }
        })
        .onEnd((event) => {
          // Handle dismiss gesture
          if (Math.abs(event.translationY) > Math.abs(event.translationX)) {
            if (
              Math.abs(event.translationY) >
              screenHeight * DISMISS_THRESHOLD_RATIO
            ) {
              runOnJS(onClose)();
            } else {
              translateY.value = withSpring(0);
              scale.value = withSpring(1);
            }
          }
        })
        .enabled(IS_IOS),
    [onClose, scale, translateY]
  );

  // Memoized animated style to prevent recreation
  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: translateY.value }, { scale: scale.value }],
    }),
    []
  );

  // Memoized render function to prevent recreation
  const renderImage = useCallback(
    ({ item }: { item: string }) => (
      <Animated.View style={[styles.imageContainer, animatedStyle]}>
        <FastImage
          source={{ uri: item }}
          resizeMode={FastImage.resizeMode.contain}
          style={[styles.image, { height: screenHeight * IMAGE_HEIGHT_RATIO }]}
        />
      </Animated.View>
    ),
    [animatedStyle]
  );

  // Memoized key extractor for better FlatList performance
  const keyExtractor = useCallback(
    (item: string, index: number) => `${item}-${index}`,
    []
  );

  if (!visible || images.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.flex}>
          <GestureDetector gesture={panGesture}>
            <SafeAreaView style={[styles.flex, { backgroundColor }]}>
              {/* Close Button */}
              <View style={styles.closeButtonContainer}>
                <LiquidGlassContainer
                  {...liquidGlassProps}
                  style={styles.backButtonContainer}
                >
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeButton}
                    activeOpacity={0.7}
                  >
                    <X size={24} strokeWidth={3} color="white" />
                  </TouchableOpacity>
                </LiquidGlassContainer>
              </View>

              {/* Horizontal FlatList with Images */}
              <AnimatedLegendList
                ref={flatListRef}
                data={images}
                renderItem={renderImage}
                keyExtractor={keyExtractor}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleScroll}
                snapToInterval={screenWidth}
                snapToAlignment="start"
                decelerationRate="fast"
                bounces={false}
              />

              {/* Pagination Dots */}
              <View style={styles.paginationContainer}>
                {images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === currentIndex
                        ? styles.activeDot
                        : styles.inactiveDot,
                    ]}
                  />
                ))}
              </View>
            </SafeAreaView>
          </GestureDetector>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  imageContainer: {
    width: screenWidth,
    height: screenHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: screenWidth,
  },
  closeButtonContainer: {
    position: "absolute",
    right: 24,
    top: 60,
    zIndex: 100,
  },
  backButtonContainer: {
    borderRadius: 24,
  },
  closeButton: {
    padding: 12,
  },
  counterContainer: {
    position: "absolute",
    left: 24,
    top: 48,
    zIndex: 10,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  counterText: {
    fontSize: 14,
    fontWeight: "500",
    color: "white",
  },
  paginationContainer: {
    position: "absolute",
    bottom: 64,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  paginationDot: {
    height: 12,
    width: 12,
    borderRadius: 6,
  },
  activeDot: {
    backgroundColor: "#c1fe00",
  },
  inactiveDot: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
});

export default FullScreenImageViewer;
