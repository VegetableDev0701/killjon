import Config from "react-native-config";
import Reactotron from "reactotron-react-native";
import ReactotronMMKV from "reactotron-react-native-mmkv";
import { storage } from "./src/utils/storage";

Reactotron.configure({
  name: Config.APP_DISPLAY_NAME,
})
  .useReactNative({
    networking: {
      ignoreUrls: /symbolicate/,
    },
  })
  .use(ReactotronMMKV({ storage }))
  .connect();
