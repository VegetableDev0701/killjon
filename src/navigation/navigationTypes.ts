import { NativeBottomTabScreenProps } from "@react-navigation/bottom-tabs/unstable";
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";

// Product type for IAP
export interface IAPProduct {
  id: string;
  displayName?: string;
  description?: string;
  displayPrice?: string;
}

// Stack Navigator Params
export type RootStackParamList = {
  MyListings: undefined;
  Welcome: undefined;
  ChooseCountry: undefined;
  MainApp: undefined;
  Chat: undefined;
  ListingForm: { edit?: boolean; item?: any };
  Favorites: undefined;
  TermsOfUse: undefined;
  WebView: { url: string };
  SeeMore: { searchId: string; category: string };
  PrivacyPolicy: undefined;
  SelectCategory: undefined;
  VerificationForm: undefined;
  MerchantListings: {
    merchantId: string;
    merchantName: string;
    total_listings: number;
    shareUrl?: string;
    qrCodeUrl?: string;
  };
  StoreLocation: undefined;
  ArticleDetail: { articleId: string };
  LanguageSelection: undefined;
  Feedback: undefined;
  PhotoSource: { onImageSelected: (uri: string) => void };
  Boost: undefined;
  PremiumUpgrade: undefined;
  ProductListingDetails: {
    item: any;
  };
  ProductScrappedDetails: {
    item: any;
  };
};

export type BottomTabParamList = {
  HomeTab: undefined;
  AnalyticsTab: undefined;
  SearchTab: undefined;
  LabsTab: undefined;
  ProfileTab: undefined;
};

export type NavigationProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type UseNavigationProps<T extends keyof RootStackParamList> =
  NativeStackNavigationProp<RootStackParamList, T>;

type CombinedParamList = BottomTabParamList & RootStackParamList;

export type BottomTabProps<T extends keyof CombinedParamList> =
  NativeBottomTabScreenProps<CombinedParamList, T>;
