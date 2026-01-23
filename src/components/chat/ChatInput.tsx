import {
  AudioLines,
  BarChart2,
  Check,
  House,
  Lightbulb,
  MicOff,
  Send,
  User2,
  X,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { trigger } from "react-native-haptic-feedback";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabParamList } from "../../navigation/navigationTypes";
import { useAudioRecording } from "../../services/audioRecordingService";
import { IS_IOS, VivrationOption } from "../../utils/constants";

// --- Types ---
interface Props {
  inputText: string;
  setInputText: (text: string) => void;
  onSend: (text: string) => void;
  inputRef: React.RefObject<TextInput | null>;
  isVoiceDisabled?: boolean;
  isSending?: boolean;
  placeholder?: string;
  maxLength?: number;
  onOpenMerchantsModal?: () => void;
  previousTab?: keyof BottomTabParamList;
}

// --- Main Component ---
export const ChatInput = ({
  inputText,
  setInputText,
  onSend,
  inputRef,
  isVoiceDisabled = false,
  isSending = false,
  placeholder,
  maxLength = 2000,
  onOpenMerchantsModal,
  previousTab = "HomeTab",
}: Props) => {
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();
  // Get the icon component based on previousTab
  const getPreviousTabIcon = () => {
    const iconProps = { size: 24, color: "#c1fe00" };
    switch (previousTab) {
      case "HomeTab":
        return <House {...iconProps} />;
      case "AnalyticsTab":
        return <BarChart2 {...iconProps} />;
      case "LabsTab":
        return <Lightbulb {...iconProps} />;
      case "ProfileTab":
        return <User2 {...iconProps} />;
      default:
        return <House {...iconProps} />;
    }
  };

  // --- Audio Recording Hook ---
  const {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecording({
    onRecordingStart: () => {
      trigger("impactMedium", VivrationOption);
    },
    onRecordingEnd: () => {
      trigger("impactLight", VivrationOption);
    },
    onTranscriptionComplete: (text: string) => {
      setInputText(text);
      trigger("notificationSuccess", VivrationOption);
    },
    onTranscriptionError: () => {
      trigger("notificationError", VivrationOption);
    },
  });

  // --- Derived State ---
  const hasText = useMemo(() => inputText.trim().length > 0, [inputText]);
  const canSend = useMemo(
    () => hasText && !isSending && !isRecording && !isTranscribing,
    [hasText, isSending, isRecording, isTranscribing]
  );
  const isInRecordingMode = useMemo(
    () => isRecording || isTranscribing,
    [isRecording, isTranscribing]
  );

  // --- Animation Shared Values ---
  const micPulse = useSharedValue(1);
  const sendButtonScale = useSharedValue(1);
  const transcribingDots = useSharedValue(0);
  const slideX = useSharedValue(Dimensions.get("window").width);

  // --- Event Handlers ---
  const handleTextChange = useCallback(
    (text: string) => {
      if (text.length <= maxLength) {
        setInputText(text);
      }
    },
    [setInputText, maxLength]
  );

  const handleSend = useCallback(() => {
    if (canSend) {
      sendButtonScale.value = withSequence(
        withTiming(0.9, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      onSend(inputText);
    }
  }, [canSend, onSend, sendButtonScale, inputText]);

  const handleStartRecording = useCallback(async () => {
    if (isVoiceDisabled || isInRecordingMode) return;
    setInputText("");
    trigger("impactMedium", VivrationOption);
    await startRecording();
  }, [isVoiceDisabled, isInRecordingMode, startRecording, setInputText]);

  const handleStopRecording = useCallback(async () => {
    await stopRecording();
  }, [stopRecording]);

  const handleCancelRecording = useCallback(async () => {
    await cancelRecording();
    setInputText("");
  }, [cancelRecording, setInputText]);

  // --- Animations ---
  // Slide-in animation on mount (right to left)
  useEffect(() => {
    slideX.value = withTiming(0, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [slideX]);

  useEffect(() => {
    if (isRecording) {
      micPulse.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1
      );
    } else {
      micPulse.value = withTiming(1, { duration: 300 });
    }
  }, [isRecording, micPulse]);

  useEffect(() => {
    if (isTranscribing) {
      transcribingDots.value = withRepeat(
        withTiming(1, { duration: 1000 }),
        -1
      );
    } else {
      transcribingDots.value = withTiming(0, { duration: 200 });
    }
  }, [isTranscribing, transcribingDots]);

  const animatedTextInputStyle = useAnimatedStyle(() => ({
    opacity: isInRecordingMode ? 0 : 1,
    transform: [
      {
        translateY: interpolate(isInRecordingMode ? 1 : 0, [0, 1], [0, -5]),
      },
    ],
  }));

  const animatedRecordingStyle = useAnimatedStyle(() => ({
    opacity: isInRecordingMode ? 1 : 0,
    transform: [
      {
        translateY: interpolate(isInRecordingMode ? 1 : 0, [0, 1], [10, 0]),
      },
    ],
  }));

  const animatedMicStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micPulse.value }],
  }));

  const animatedSendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
    opacity: canSend ? 1 : 0.6,
  }));

  const animatedTranscribingDotsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(transcribingDots.value, [0, 0.5, 1], [0.3, 1, 0.3]),
  }));

  // Slide animation style for the entire component
  const animatedSlideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
  }));

  // --- Render Methods ---
  const renderTextInput = () => (
    <Animated.View style={[styles.textInputContainer, animatedTextInputStyle]}>
      <TextInput
        ref={inputRef}
        placeholder={
          placeholder || t("chat.inputPlaceholder") || "Ask me anything..."
        }
        placeholderTextColor="#666666"
        style={styles.textInput}
        multiline
        selectionColor={"#c1fe00"}
        cursorColor={"#c1fe00"}
        value={inputText}
        onChangeText={handleTextChange}
        editable={!isInRecordingMode && !isSending}
        maxLength={maxLength}
        textAlignVertical="top"
        scrollEnabled={true}
        pointerEvents={isInRecordingMode ? "none" : "auto"}
        submitBehavior="blurAndSubmit"
        underlineColorAndroid="transparent"
        returnKeyType="search"
        onSubmitEditing={handleSend}
      />
    </Animated.View>
  );

  const renderRecordingUI = () => (
    <Animated.View style={[styles.recordingContainer, animatedRecordingStyle]}>
      <TouchableOpacity
        onPress={handleCancelRecording}
        style={styles.cancelButton}
        disabled={isTranscribing}
        accessibilityLabel={t("chat.cancelRecording")}
        accessibilityHint={isTranscribing ? t("chat.transcribing") : undefined}
      >
        <X size={24} color={isTranscribing ? "#555" : "#ff6b6b"} />
      </TouchableOpacity>
      <View style={styles.recordingTextContainer}>
        {isTranscribing ? (
          <Animated.Text
            style={[styles.recordingText, animatedTranscribingDotsStyle]}
          >
            {t("chat.transcribing")}
          </Animated.Text>
        ) : (
          <Text style={styles.recordingText}>{t("chat.recording")}</Text>
        )}
      </View>
    </Animated.View>
  );

  const renderActionButton = () => {
    if (canSend) {
      return (
        <TouchableOpacity
          onPress={handleSend}
          style={styles.sendButton}
          accessibilityLabel={t("chat.sendMessage")}
          accessibilityRole="button"
        >
          <Animated.View style={animatedSendButtonStyle}>
            <Send size={22} color="#111" />
          </Animated.View>
        </TouchableOpacity>
      );
    }

    if (isInRecordingMode) {
      return (
        <TouchableOpacity
          onPress={handleStopRecording}
          style={styles.confirmButton}
          accessibilityLabel={t("chat.confirmRecording")}
          accessibilityRole="button"
        >
          <Check size={24} color="#111" />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        onPress={handleStartRecording}
        disabled={isVoiceDisabled}
        style={[styles.micButton, { opacity: isVoiceDisabled ? 0.5 : 1 }]}
        accessibilityLabel={
          isVoiceDisabled
            ? t("chat.voiceInputDisabled")
            : t("chat.startVoiceRecording")
        }
        accessibilityRole="button"
        accessibilityState={{ disabled: isVoiceDisabled }}
      >
        <Animated.View style={animatedMicStyle}>
          {isVoiceDisabled ? (
            <MicOff size={24} color="#666" />
          ) : (
            <View
              className="flex-row items-center gap-2 rounded-full bg-white px-3 py-2"
              style={{ backgroundColor: "#c1fe00" }}
            >
              <AudioLines size={24} color="#1a1a1a" />
              <Text style={styles.voiceButtonText}>
                {t("chat.voiceButton")}
              </Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View
      style={[
        {
          flexDirection: "row",
          alignItems: "flex-end",
          marginHorizontal: 16,
        },
        animatedSlideStyle,
      ]}
    >
      {/* Bag icon outside the input container */}
      <TouchableOpacity
        onPress={() => {
          trigger("impactLight", VivrationOption);
          // Slide out animation (left to right) - halfway only
          const screenWidth = Dimensions.get("window").width;
          const handleNavigation = () => {
            onOpenMerchantsModal?.();
          };
          slideX.value = withTiming(
            screenWidth / 2, // Slide halfway only
            {
              duration: 300,
              easing: Easing.in(Easing.cubic),
            }
          );
          if (onOpenMerchantsModal) {
            handleNavigation();
          }
        }}
        className="items-center justify-center rounded-full"
        style={{
          width: 55,
          height: 55,
          marginBottom: IS_IOS ? bottom : bottom + 8,
          backgroundColor: "#1a1a1a",
        }}
        activeOpacity={0.7}
        accessibilityLabel={t("chat.openMerchants")}
        accessibilityRole="button"
      >
        {getPreviousTabIcon()}
      </TouchableOpacity>

      {/* Input container */}
      <Animated.View
        style={[
          styles.container,
          {
            marginBottom: IS_IOS ? bottom : bottom + 8,
          },
        ]}
      >
        {renderTextInput()}
        {renderRecordingUI()}
        <View style={styles.actionButtonContainer}>{renderActionButton()}</View>
      </Animated.View>
    </Animated.View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginLeft: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    backgroundColor: "#1a1a1a",
    borderRadius: 28,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxHeight: 250,
    paddingTop: 8,
    paddingBottom: 8,
  },
  textInputContainer: {
    flex: 1,
    justifyContent: "center",
    position: "relative",
    minHeight: 40, // Ensure minimum touchable height
  },
  textInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "400",
    paddingVertical: 12,
    paddingHorizontal: 0,
    minHeight: 40,
    textAlignVertical: "top",
    includeFontPadding: false,
  },
  recordingContainer: {
    position: "absolute",
    left: 16,
    right: 56,
    top: 8,
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    pointerEvents: "box-none", // Allow touches to pass through to underlying elements
  },
  cancelButton: {
    padding: 8,
    marginRight: 8,
  },
  recordingTextContainer: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  recordingText: {
    color: "#c1fe00",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  actionButtonContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#c1fe00",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#c1fe00",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#c1fe00",
    justifyContent: "center",
    alignItems: "center",
  },
  micButton: {
    //width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  voiceButtonText: {
    color: "#1a1a1a",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
