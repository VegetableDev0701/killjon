import { useNavigation } from "@react-navigation/native";
import React, { useCallback } from "react";
import { StyleSheet, Text } from "react-native";
import Markdown from "react-native-markdown-display";
import { UseNavigationProps } from "../../navigation/navigationTypes";
import { ChatMessage as ChatMessageType } from "../../store/chatStore";
import AIChatContent from "./AIChatContent";
import CopyableBubble from "./CopyableBubble";
import DatabaseSearchContent from "./DatabaseSearchContent";
import { markdownStyles } from "./markdownStyles";
import WebSearchContent from "./WebSearchContent";

interface MessageContentRendererProps {
  message: ChatMessageType;
  isUser: boolean;
  animatedStyle?: any;
}

// Helper function to get displayable text content
const getDisplayContent = (content: any): string => {
  if (typeof content === "string") return content;
  if (typeof content === "object" && content !== null) {
    // Handle nested text structure
    if (content.text) {
      if (typeof content.text === "string") {
        return content.text;
      } else if (typeof content.text === "object" && content.text.text) {
        return content.text.text;
      }
    }
    if (content.message) return content.message;
    return JSON.stringify(content);
  }
  return "";
};

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

const MessageContentRenderer: React.FC<MessageContentRendererProps> = ({
  message,
  isUser,
  animatedStyle,
}) => {
  const navigation = useNavigation<UseNavigationProps<"Chat">>();

  const onSourcePress = useCallback(
    (url: string) => {
      navigation.navigate("WebView", { url });
    },
    [navigation]
  );

  const onSeeMore = useCallback(() => {
    navigation.navigate("SeeMore", {
      searchId: message.content.searchId || "",
      category: message.content.category || "vehicles",
    });
  }, [message, navigation]);

  // Handle database search content
  if (message.content && message.content.type === "database_search") {
    return (
      <DatabaseSearchContent
        content={message.content}
        onSeeMore={onSeeMore}
        data={message.content.products || []}
      />
    );
  }

  // Handle web search content
  if (message.content && message.content.type === "web_search") {
    return (
      <WebSearchContent
        content={message.content}
        animatedStyle={animatedStyle}
        onSourcePress={onSourcePress}
      />
    );
  }

  // Handle AI chat content
  if (message.content && message.content.type === "ai_chat") {
    return (
      <AIChatContent content={message.content} animatedStyle={animatedStyle} />
    );
  }

  // Handle other content types
  const displayContent = getDisplayContent(message.content);
  const isContentMarkdown = isMarkdown(displayContent);

  // For non-markdown AI messages, show copy functionality
  if (
    !isContentMarkdown &&
    typeof displayContent === "string" &&
    displayContent.trim().length > 0
  ) {
    return <CopyableBubble text={displayContent} isUser={isUser} />;
  }

  // For user messages
  if (isUser) {
    return <Text style={styles.userMessageText}>{displayContent}</Text>;
  }

  // Default fallback for markdown content
  return isContentMarkdown ? (
    <Markdown style={markdownStyles}>{displayContent}</Markdown>
  ) : (
    <Text style={styles.aiMessageText}>{displayContent}</Text>
  );
};

const styles = StyleSheet.create({
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

export default MessageContentRenderer;
