import React, { useCallback, useEffect } from "react";
import { Modal, ModalProps, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "../../utils/clsxUtils";
import { ANYDO_EASING, ANYDO_SPRING } from "../../utils/reanimatedUtils";

interface AnimatedModalProps extends Omit<ModalProps, "children"> {
  children: React.ReactNode;
  isVisible: boolean;
  onClose: () => void;
  className?: string;
  backdropOpacity?: number;
  slideFromBottom?: boolean;
}

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  children,
  isVisible,
  onClose,
  className = "",
  backdropOpacity = 0.5,
  slideFromBottom = true,
  ...modalProps
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(slideFromBottom ? 1000 : 0);
  const backdropOpacityValue = useSharedValue(0);
  const scale = useSharedValue(0.9);

  // Show animation
  useEffect(() => {
    if (isVisible) {
      backdropOpacityValue.value = withTiming(backdropOpacity, {
        duration: 350,
        easing: ANYDO_EASING.entrance,
      });
      translateY.value = withSpring(0, ANYDO_SPRING.smooth);
      scale.value = withSpring(1, ANYDO_SPRING.smooth);
    }
  }, [isVisible, backdropOpacity]);

  // Hide animation
  const handleClose = useCallback(() => {
    backdropOpacityValue.value = withTiming(0, {
      duration: 250,
      easing: ANYDO_EASING.exit,
    });
    translateY.value = withTiming(
      slideFromBottom ? 1000 : -1000,
      {
        duration: 250,
        easing: ANYDO_EASING.exit,
      },
      (finished) => {
        if (finished) {
          runOnJS(onClose)();
        }
      }
    );
    scale.value = withTiming(0.9, {
      duration: 250,
      easing: ANYDO_EASING.exit,
    });
  }, [onClose, slideFromBottom]);

  // Animated styles
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacityValue.value,
  }));

  const modalContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  if (!isVisible) return null;

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
      {...modalProps}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={styles.backdropPressable} onPress={handleClose} />
        </Animated.View>

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContent,
            modalContentStyle,
            { paddingBottom: insets.bottom },
          ]}
          className={cn("rounded-t-3xl bg-background", className)}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdropPressable: {
    flex: 1,
  },
  modalContent: {
    maxHeight: "90%",
    overflow: "hidden",
  },
});
