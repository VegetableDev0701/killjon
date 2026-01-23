import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  ANYDO_EASING,
  ANYDO_SPRING,
  ANYDO_TIMING,
} from "../../utils/reanimatedUtils";
import {
  ChatMessage as ChatMessageType,
  useChatStore,
} from "../../store/chatStore";
import MessageContentRenderer from "./MessageContentRenderer";
import AnimatedDotLoader from "./AnimatedDotLoader";

interface ChatMessageProps {
  item: ChatMessageType;
  reservedHeight?: number;
  onLayout?: (height: number) => void;
  isTyping?: boolean;
}

const TypingIndicator: React.FC = () => {
  const { t } = useTranslation();
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showText, setShowText] = useState(false);

  const typingMessages = [
    t("chat.typingMessages.searching"),
    t("chat.typingMessages.retrieving"),
    t("chat.typingMessages.preparing"),
  ];

  useEffect(() => {
    // Show text after 1.5 seconds
    const textTimer = setTimeout(() => {
      setShowText(true);
    }, 1500);

    return () => clearTimeout(textTimer);
  }, []);

  useEffect(() => {
    if (!showText) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex(
        (prevIndex) => (prevIndex + 1) % typingMessages.length
      );
    }, 2500); // Change message every 2.5 seconds

    return () => clearInterval(interval);
  }, [typingMessages.length, showText]);

  return (
    <View style={styles.typingIndicator}>
      <AnimatedDotLoader color="#ffffff" size={14} />
      {showText && (
        <Text style={styles.typingText}>
          {typingMessages[currentMessageIndex]}
        </Text>
      )}
    </View>
  );
};

const ChatMessage: React.FC<ChatMessageProps> = ({
  item,
  reservedHeight,
  onLayout,
}) => {
  const isUser = item.sender === "user";
  const { currentChat } = useChatStore();

  const opacity = useSharedValue(item.content.pointer ? 0 : 1);
  const translateY = useSharedValue(0);
  const hasAnimated = React.useRef(false);

  React.useEffect(() => {
    if (item.content.pointer) {
      opacity.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1, ANYDO_TIMING.screen)
      );
    }

    // Enhanced Any.do-style animation for new messages
    const isFirstUserMessage =
      currentChat?.Messages?.filter((m) => m.sender === "user").length === 1;
    const isTempMessage = item.id.startsWith("temp_msg_");
    if (isUser && isFirstUserMessage && isTempMessage && !hasAnimated.current) {
      translateY.value = 40;
      translateY.value = withSpring(0, ANYDO_SPRING.smooth);
      opacity.value = withTiming(1, ANYDO_TIMING.standard);
      hasAnimated.current = true;
    } else if (!isUser && !hasAnimated.current) {
      // Smooth entrance for AI messages
      translateY.value = 20;
      opacity.value = 0.5;
      translateY.value = withSpring(0, ANYDO_SPRING.smooth);
      opacity.value = withTiming(1, ANYDO_TIMING.standard);
      hasAnimated.current = true;
    }
  }, [item.id, currentChat?.Messages?.length]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });


  return (
    <>
      {item.content.type === "ai_chat" && item.content.isOptimistic && (
        <TypingIndicator />
      )}
      <Animated.View
        onLayout={(e) => {
          if (isUser && onLayout) {
            console.log("onLayout user");
            onLayout(e.nativeEvent.layout.height);
          }
        }}
        style={[
          item.content.type === "database_search"
            ? styles.databaseSearchContainer
            : styles.container,
          isUser ? styles.userContainer : styles.aiContainer,
          !isUser &&
          item.content.type === "ai_chat" &&
          item.content.isOptimistic &&
          reservedHeight
            ? { minHeight: reservedHeight }
            : {},
          animatedStyle,
        ]}
      >
        <MessageContentRenderer message={item} isUser={isUser} />
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: "95%",
    marginHorizontal: 8,
    padding: 12,
    borderRadius: 16,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  typingText: {
    color: "#ffffff",
    fontSize: 14,
    marginLeft: 8,
    fontWeight: "500",
  },
  userContainer: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    backgroundColor: "#1a1a1a",
    marginTop: 12,
  },
  aiContainer: {
    alignSelf: "center",
  },
  databaseSearchContainer: {
    width: "100%",
    marginHorizontal: 0,
    padding: 0,
    borderRadius: 0,
  },
});

export default ChatMessage;
