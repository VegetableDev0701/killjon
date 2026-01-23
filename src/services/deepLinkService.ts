import { Linking, NativeEventEmitter, NativeModules } from "react-native";
import axiosClient from "../utils/axiosClient";

interface DeepLinkData {
  url: string;
  merchantId?: string;
  merchantSlug?: string;
  merchantData?: {
    user_id: string;
    brand_name: string;
    share_url: string;
    qr_code_url: string;
  };
}

class DeepLinkService {
  private listeners: ((data: DeepLinkData) => void)[] = [];
  private eventEmitter: NativeEventEmitter | null = null;

  constructor() {
    this.initializeEventListeners();
  }

  private initializeEventListeners() {
    // Listen for Universal Links from iOS
    if (NativeModules.RCTDeviceEventEmitter) {
      this.eventEmitter = new NativeEventEmitter();

      this.eventEmitter.addListener(
        "UniversalLinkReceived",
        async (data: DeepLinkData) => {
          await this.handleDeepLink(data);
        }
      );
    }

    // Listen for app state changes to handle cold starts
    Linking.addEventListener("url", this.handleLinkingURL);
  }

  private handleLinkingURL = async (event: { url: string }) => {
    const data = this.parseURL(event.url);
    if (data) {
      await this.handleDeepLink(data);
    }
  };

  public parseURL(url: string): DeepLinkData | null {
    try {
      // Parse URL manually since URL constructor is not available in React Native
      const urlMatch = url.match(/^https?:\/\/([^\/]+)(.*)$/);
      if (!urlMatch) {
        return null;
      }

      const hostname = urlMatch[1];
      const pathname = urlMatch[2];

      // Handle https://nodoia.app/m/{slug} and https://www.nodoia.app/m/{slug} formats
      if (
        (hostname === "nodoia.app" || hostname === "www.nodoia.app") &&
        pathname.startsWith("/m/")
      ) {
        const pathParts = pathname.split("/");
        const merchantSlug = pathParts[2]; // /m/{slug}

        return {
          url,
          merchantSlug,
        };
      }
    } catch (error) {
      console.log(error);
      // Silent error handling
    }

    return null;
  }

  public async handleDeepLink(data: DeepLinkData) {
    // If we have a slug, fetch merchant data first
    if (data.merchantSlug) {
      try {
        const response = await axiosClient.get(
          `/api/merchant/slug/${data.merchantSlug}`
        );

        if (response.data?.data) {
          const merchantData = response.data.data;

          // Update data with merchant information
          data.merchantData = {
            user_id: merchantData.user_id,
            brand_name: merchantData.brand_name,
            share_url: merchantData.share_url,
            qr_code_url: merchantData.qr_code_url,
          };
        }
      } catch (error) {
        console.log(error);
        // Silent error handling
      }
    }

    this.listeners.forEach((listener) => listener(data));
  }

  public addListener(listener: (data: DeepLinkData) => void) {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public async getInitialURL(): Promise<string | null> {
    try {
      return await Linking.getInitialURL();
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  public async openURL(url: string): Promise<boolean> {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  public generateMerchantURL(merchantId: string): string {
    return `https://nodoia.app/m/merchant/${merchantId}`;
  }
}

export const deepLinkService = new DeepLinkService();
export type { DeepLinkData };
