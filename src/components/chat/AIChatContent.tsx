import React from "react";
import { StyleSheet, Text } from "react-native";
import Markdown from "react-native-markdown-display";
import Animated from "react-native-reanimated";
import { ChatMessage as ChatMessageType } from "../../store/chatStore";
import { markdownStyles } from "./markdownStyles";

interface AIChatContentProps {
  content: ChatMessageType["content"];
  animatedStyle?: any;
}

// Helper function to check if content is markdown
const isMarkdown = (content: string): boolean => {
  const markdownPatterns = [
    /^#+\s+/m, // Headers
    /\*\*[^*]+\*\*/, // Bold text
    /\*[^*]+\*/, // Italic text
    /^[-*]\s+/m, // Unordered lists
    /^\d+\.\s+/m, // Ordered lists
    /\[([^\]]+)\]\(([^)]+)\)/, // Links
    /```[\s\S]*```/, // Code blocks
    /`[^`]+`/, // Inline code
  ];

  return markdownPatterns.some((pattern) => pattern.test(content));
};

const AIChatContent: React.FC<AIChatContentProps> = ({
  content,
  animatedStyle,
}) => {
  const aiContent = content;
  const aiMessage = aiContent.message || aiContent.text || "";

  const aiChatContent = isMarkdown(aiMessage) ? (
    <Markdown style={markdownStyles}>{aiMessage}</Markdown>
  ) : (
    <Text style={styles.aiMessageText}>{aiMessage}</Text>
  );

  return aiContent.pointer ? (
    <Animated.View style={animatedStyle}>{aiChatContent}</Animated.View>
  ) : (
    aiChatContent
  );
};

const styles = StyleSheet.create({
  aiMessageText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "left",
  },
});

export default AIChatContent;
