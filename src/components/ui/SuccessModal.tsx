import React, { useEffect } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import assets from "../../assets";
import { screenWidth } from "../../utils/constants";

interface SuccessModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  primaryAction: {
    label: string;
    onPress: () => void;
  };
  secondaryAction: {
    label: string;
    onPress: () => void;
  };
  accentColor?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  onClose,
  title,
  message,
  primaryAction,
  secondaryAction,
  accentColor = "#c1fe00",
}) => {
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.8);
  const confettiAnim = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      fadeAnim.value = withTiming(1, { duration: 300 });
      scaleAnim.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });

      // Animate confetti after modal appears
      confettiAnim.value = withDelay(
        300,
        withSpring(1, {
          damping: 12,
          stiffness: 100,
        })
      );
    } else {
      fadeAnim.value = withTiming(0, { duration: 200 });
      scaleAnim.value = withTiming(0.8, { duration: 200 });
      confettiAnim.value = withTiming(0, { duration: 200 });
    }
  }, [visible, fadeAnim, scaleAnim, confettiAnim]);

  const handlePrimaryAction = () => {
    primaryAction.onPress();
    onClose();
  };

  const handleSecondaryAction = () => {
    secondaryAction.onPress();
    onClose();
  };

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
    };
  });

  const modalAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleAnim.value }],
    };
  });

  const confettiAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: confettiAnim.value,
      transform: [{ scale: confettiAnim.value }],
    };
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
        <View style={styles.backdrop} />

        <Animated.View style={[styles.modalContainer, modalAnimatedStyle]}>
          {/* Success Illustration */}
          <View style={styles.illustrationContainer}>
            <Animated.View style={confettiAnimatedStyle}>
              <Image
                source={assets.celebration}
                style={styles.celebrationImage}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: accentColor }]}
              onPress={handlePrimaryAction}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {primaryAction.label}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSecondaryAction}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>
                {secondaryAction.label}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 24,
    padding: 20,
    width: screenWidth - 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  illustrationContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  celebrationImage: {
    height: 200,
  },
  content: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 16,
    color: "#ffffff",
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.9,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    width: "50%",
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0a0a0a",
    textAlign: "center",
  },
  secondaryButton: {
    width: "50%",
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    textAlign: "center",
  },
});

export default SuccessModal;
