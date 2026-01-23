import { StyleSheet } from "react-native";

// Markdown styles for beautiful formatting
export const markdownStyles = StyleSheet.create({
  body: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "left",
  },
  heading1: {
    color: "#e8e8e8",
    fontSize: 16,
    //fontWeight: "bold" as const,
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    color: "#e8e8e8",
    fontSize: 20,
    fontWeight: "bold" as const,
    marginTop: 14,
    marginBottom: 6,
  },
  heading3: {
    color: "#e8e8e8",
    fontSize: 18,
    fontWeight: "bold" as const,
    marginTop: 12,
    marginBottom: 4,
  },
  heading4: {
    color: "#e8e8e8",
    fontSize: 16,
    fontWeight: "bold" as const,
    marginTop: 10,
    marginBottom: 4,
  },
  heading5: {
    color: "#e8e8e8",
    fontSize: 14,
    fontWeight: "bold" as const,
    marginTop: 8,
    marginBottom: 4,
  },
  heading6: {
    color: "#e8e8e8",
    fontSize: 12,
    fontWeight: "bold" as const,
    marginTop: 6,
    marginBottom: 4,
  },
  paragraph: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  strong: {
    color: "#c1fe00",
    fontWeight: "bold" as const,
  },
  em: {
    fontStyle: "italic" as const,
    color: "#e0e0e0",
  },
  link: {
    color: "#c1fe00",
    textDecorationLine: "underline" as const,
  },
  list_item: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 4,
  },
  bullet_list: {
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 8,
  },
  code_block: {
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#c1fe00",
  },
  code_inline: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontFamily: "monospace",
    fontSize: 14,
  },
  blockquote: {
    backgroundColor: "rgba(193,254,0,0.1)",
    borderLeftWidth: 4,
    borderLeftColor: "#c1fe00",
    paddingLeft: 12,
    marginVertical: 8,
    fontStyle: "italic" as const,
  },
  hr: {
    backgroundColor: "rgba(255,255,255,0.2)",
    height: 1,
    marginVertical: 16,
  },
  table: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    marginVertical: 8,
  },
  thead: {
    backgroundColor: "rgba(193,254,0,0.1)",
  },
  th: {
    color: "#c1fe00",
    fontWeight: "bold" as const,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
  },
  td: {
    color: "#fff",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
});
