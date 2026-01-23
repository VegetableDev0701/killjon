import { X } from "lucide-react-native";
import React, { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import WebView from "react-native-webview";
import { NavigationProps } from "../navigation/navigationTypes";
import { IS_IOS } from "../utils/constants";

const WebViewScreen = ({ route, navigation }: NavigationProps<"WebView">) => {
  const { t } = useTranslation();
  const { url } = route.params;

  const isValidUrl = url && /^https?:\/\//.test(url);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={navigation.goBack} style={styles.closeButton}>
          <X size={24} color="#fff" />
        </Pressable>
      ),
      unstable_headerRightItems: (props) => [
        {
          type: "button",
          label: "Close",
          onPress: navigation.goBack,
          icon: {
            name: "xmark",
            type: "sfSymbol",
          },
        },
      ],
      headerBackVisible: false,
      headerStyle: { backgroundColor: "transparent" },
      contentStyle: {
        flex: 1,
        height: "100%",
        width: "100%",
      },
      headerTitle: "",
      presentation: IS_IOS ? "formSheet" : undefined,
    });
  }, [navigation]);

  if (!isValidUrl) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t("common.invalidUrl")}</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar animated barStyle={"light-content"} />
      <WebView
        source={{ uri: url }}
        style={styles.webView}
        cacheEnabled={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <ActivityIndicator
            size="large"
            color="#c1fe00"
            style={styles.loadingContainer}
          />
        )}
      />
    </>
  );
};

const styles = StyleSheet.create({
  webView: {
    flex: 1,
    borderRadius: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#fff",
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  closeButton: {
    borderRadius: 32,
    padding: 8,
    borderWidth: 1,
  },
});

export default WebViewScreen;
