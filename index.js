/**
 * @format
 */

import messaging from "@react-native-firebase/messaging";
import { AppRegistry, Text, TextInput } from "react-native";
import App from "./App";
import { name as appName } from "./app.json";

if (__DEV__) {
  import("./ReactotronConfig").then(() =>
    console.info("Reactotron Configured")
  );
}

Text.defaultProps = {
  allowFontScaling: false,
};
TextInput.defaultProps = {
  allowFontScaling: false,
};

// Background message handler - must be registered outside of app lifecycle
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("Background notification received:", remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
