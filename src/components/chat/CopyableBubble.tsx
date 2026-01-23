import Clipboard from "@react-native-clipboard/clipboard";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

import { useTranslation } from "react-i18next";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { toast } from "sonner-native";

interface CopyableBubbleProps {
  text: string;
  isUser: boolean;
}

const CopyableBubble: React.FC<CopyableBubbleProps> = ({ text, isUser }) => {
  const { t } = useTranslation();

  const scaleAnim = useSharedValue(1);

  const animatedScaleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleAnim.value }],
    };
  });

  const handleLongPress = () => {
    scaleAnim.value = withSequence(
      withTiming(1.08, { duration: 180, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 180, easing: Easing.in(Easing.ease) })
    );
    Clipboard.setString(text);
    toast.success(t("chat.textCopiedToClipboard"));
  };

  return (
    <Animated.View
      style={[
        styles.copyableBubble,
        animatedScaleStyle,
        isUser ? styles.copyableBubbleUser : styles.copyableBubbleAi,
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={handleLongPress}
        accessibilityLabel="Copy message"
      >
        <Text style={isUser ? styles.userMessageText : styles.aiMessageText}>
          {text}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  copyableBubble: {
    maxWidth: "95%",
  },
  copyableBubbleUser: {
    alignSelf: "flex-end",
  },
  copyableBubbleAi: {
    alignSelf: "flex-start",
  },
  userMessageText: {
    color: "#ffffff",
    fontSize: 16,
  },
  aiMessageText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "left",
  },
});

export default CopyableBubble;
