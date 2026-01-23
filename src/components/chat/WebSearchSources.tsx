import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Source {
  title: string;
  url: string;
  snippet?: string;
  description?: string;
  favicon?: string;
  source?: string;
}

interface WebSearchSourcesProps {
  sources: Source[];
  onSourcePress: (url: string) => void;
}

// Helper function to clean URL
const cleanUrl = (url: string): string => {
  return url.replace(/`/g, "").trim();
};

// Helper function to extract domain from URL
const getDomainFromUrl = (url: string): string => {
  try {
    // Clean the URL by removing backticks and extra spaces
    const cleanedUrl = cleanUrl(url);
    const domain = new URL(cleanedUrl).hostname.replace("www.", "");
    return domain;
  } catch {
    return url.replace(/`/g, "").trim();
  }
};

// Helper function to clean HTML tags and decode HTML entities
const cleanHtmlContent = (htmlContent: string): string => {
  if (!htmlContent) return "";

  // Remove HTML tags
  let cleaned = htmlContent.replace(/<[^>]*>/g, "");

  // Decode common HTML entities
  const htmlEntities: { [key: string]: string } = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
    "&copy;": "©",
    "&reg;": "®",
    "&trade;": "™",
    "&hellip;": "...",
    "&mdash;": "—",
    "&ndash;": "–",
    "&lsquo;": "'",
    "&rsquo;": "'",
    "&ldquo;": '"',
    "&rdquo;": '"',
  };

  Object.entries(htmlEntities).forEach(([entity, replacement]) => {
    cleaned = cleaned.replace(new RegExp(entity, "g"), replacement);
  });

  return cleaned.trim();
};

const WebSearchSources: React.FC<WebSearchSourcesProps> = ({
  sources,
  onSourcePress,
}) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  const handleSourcePress = async (url: string) => {
    try {
      const cleanedUrl = cleanUrl(url);
      onSourcePress(cleanedUrl);
    } catch (error) {
      console.error("Error opening URL:", error);
    }
  };

  return (
    <View style={styles.webSearchContainer}>
      <View style={styles.webSearchHeader}>
        <View style={styles.webSearchIconContainer}>
          <Text style={styles.webSearchIcon}>🔍</Text>
        </View>
        <Text style={styles.webSearchTitle}>Web Search Results</Text>
      </View>

      <View style={styles.sourcesContainer}>
        {sources?.map((source, idx) => {
          const cleanedUrl = cleanUrl(source.url);
          const cleanedFavicon = source.favicon
            ? cleanUrl(source.favicon)
            : null;
          return (
            <TouchableOpacity
              key={idx}
              style={styles.sourceItem}
              onPress={() => handleSourcePress(source.url)}
            >
              <View style={styles.sourceHeader}>
                {cleanedFavicon ? (
                  <Image
                    source={{ uri: cleanedFavicon }}
                    style={styles.sourceFavicon}
                  />
                ) : (
                  <View style={styles.sourceFaviconPlaceholder}>
                    <Text style={styles.sourceFaviconText}>
                      {getDomainFromUrl(cleanedUrl).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.sourceInfo}>
                  <Text style={styles.sourceTitle} numberOfLines={2}>
                    {source.title}
                  </Text>
                  <Text style={styles.sourceUrl} numberOfLines={1}>
                    {getDomainFromUrl(cleanedUrl)}
                  </Text>
                </View>
              </View>
              {(source.snippet || source.description) && (
                <Text style={styles.sourceSnippet} numberOfLines={3}>
                  {cleanHtmlContent(source.snippet || source.description || "")}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  webSearchContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 12,
  },
  webSearchHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  webSearchIconContainer: {
    backgroundColor: "rgba(193,254,0,0.1)",
    borderRadius: 12,
    marginRight: 8,
    padding: 8,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  webSearchIcon: {
    color: "#c1fe00",
    fontSize: 16,
    fontWeight: "bold",
  },
  webSearchTitle: {
    color: "#c1fe00",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "left",
  },
  sourcesContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 12,
  },
  sourceItem: {
    backgroundColor: "rgba(0, 0, 0, 0.02)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 5,
  },
  sourceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sourceFavicon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 8,
  },
  sourceFaviconPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  sourceFaviconText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  sourceInfo: {
    flex: 1,
  },
  sourceTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  sourceUrl: {
    color: "#c1fe00",
    fontSize: 12,
    marginBottom: 4,
  },
  sourceSnippet: {
    color: "#ccc",
    fontSize: 12,
  },
});

export default WebSearchSources;
