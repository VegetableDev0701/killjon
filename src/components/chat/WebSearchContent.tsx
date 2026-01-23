import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Markdown from "react-native-markdown-display";
import Animated from "react-native-reanimated";
import { ChatMessage as ChatMessageType } from "../../store/chatStore";
import WebSearchSources from "./WebSearchSources";
import { markdownStyles } from "./markdownStyles";

interface WebSearchContentProps {
  content: ChatMessageType["content"];
  animatedStyle?: any;
  onSourcePress: (url: string) => void;
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

const WebSearchContent: React.FC<WebSearchContentProps> = ({
  content,
  animatedStyle,
  onSourcePress,
}) => {
  const webContent = content;

  const webSearchContent = (
    <View style={styles.webSearchMessageContainer}>
      {/* AI Message */}
      <View style={styles.aiMessageContainer}>
        {isMarkdown(webContent.message || webContent.text || "") ? (
          <Markdown style={markdownStyles}>
            {webContent.message || webContent.text || ""}
          </Markdown>
        ) : (
          <Text style={styles.aiMessageText}>
            {webContent.message || webContent.text || ""}
          </Text>
        )}
      </View>
      {/* Web Search Sources */}
      {(() => {
        const sources = webContent.sources || [];
        if (Array.isArray(sources) && sources.length > 0) {
          return (
            <WebSearchSources sources={sources} onSourcePress={onSourcePress} />
          );
        } else {
          return null;
        }
      })()}
    </View>
  );

  return webContent.pointer ? (
    <Animated.View style={animatedStyle}>{webSearchContent}</Animated.View>
  ) : (
    webSearchContent
  );
};

const styles = StyleSheet.create({
  webSearchMessageContainer: {
    flexDirection: "column",
  },
  aiMessageContainer: {
    display: "flex",
    flexDirection: "column",
    marginBottom: 10,
  },
  aiMessageText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "left",
  },
});

export default WebSearchContent;
