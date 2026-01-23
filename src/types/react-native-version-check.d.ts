declare module "react-native-version-check" {
  interface VersionCheckOptions {
    provider?: "appStore" | "playStore";
  }

  interface NeedUpdateOptions {
    currentVersion: string;
    latestVersion: string;
  }

  interface NeedUpdateResult {
    isNeeded: boolean;
    storeUrl?: string;
    reason?: string;
  }

  interface AppStoreUrlOptions {
    appID: string;
  }

  interface PlayStoreUrlOptions {
    packageName: string;
  }

  const VersionCheck: {
    getCurrentVersion(): string;
    getLatestVersion(options?: VersionCheckOptions): Promise<string>;
    needUpdate(options?: NeedUpdateOptions): Promise<NeedUpdateResult>;
    getAppStoreUrl(options: AppStoreUrlOptions): Promise<string>;
    getPlayStoreUrl(options: PlayStoreUrlOptions): Promise<string>;
  };

  export default VersionCheck;
}
