declare module "react-native-config" {
  export interface NativeConfig {
    ENV?: string;
    API_URL?: string;
    API_KEY?: string;
    GOOGLE_MAP_API_KEY?: string;
    GOOGLE_MAP_BASE_URL?: string;
    GOOGLE_WEB_CLIENT_ID?: string;
    GOOGLE_IOS_CLIENT_ID?: string;
    GOOGLE_IOS_REVERSE_CLIENT_ID?: string;
    APP_DISPLAY_NAME?: string;
    APP_VERSION?: string;
    IOS_APP_BUILD_NUMBER?: string;
    ANDROID_APP_BUILD_NUMBER?: string;
    IOS_APP_ID?: string;
    PACKAGE_NAME?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
