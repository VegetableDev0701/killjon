import {
  NavigationContainer,
  useNavigationContainerRef,
} from "@react-navigation/native";
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import React, { useCallback, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { LoginSheetProvider } from "../utils/LoginSheetContext";
import { RootStackParamList } from "./navigationTypes";

// Screen Imports
import ArticleDetailScreen from "../screens/ArticleDetailScreen";
import ChatScreen from "../screens/ChatScreen";
import ChooseCountryScreen from "../screens/ChooseCountryScreen";
import FavoritesScreen from "../screens/FavoritesScreen";
import ListingFormScreen from "../screens/ListingForm";
import MerchantListingsScreen from "../screens/MerchantListingsScreen";
import MyListingsScreen from "../screens/MyListingsScreen";
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen";
import SeeMoreScreen from "../screens/SeeMoreScreen";
import SelectCategoryScreen from "../screens/SelectCategoryScreen";
import StoreLocationScreen from "../screens/StoreLocationScreen";
import TermsOfUseScreen from "../screens/TermsOfUseScreen";
import VerificationScreen from "../screens/VerificationScreen";
import WebViewScreen from "../screens/WebViewScreen";
import WelcomeScreen from "../screens/WelcomeScreen";
import BottomTabNavigator from "./BottomTabNavigator";

// Profile Modal Screens
import { ProductListingDetailsModal } from "../screens/ProductListingDetailsModal";
import BoostModal from "../screens/profile/BoostModal";
import FeedbackModal from "../screens/profile/FeedbackModal";
import LanguageSelectionModal from "../screens/profile/LanguageSelectionModal";
import PhotoSourceModal from "../screens/profile/PhotoSourceModal";
import PremiumUpgradeModal from "../screens/profile/PremiumUpgradeModal";

import { useDeepLink } from "../hooks/useDeepLink";
import { ProductScrappedDetailsModal } from "../screens/ProductScrappedDetailsModal";
import { navigationService } from "../services/navigationService";
import { useAuthStore } from "../store/authStore";

const Stack = createNativeStackNavigator<RootStackParamList>();

// Any.do-inspired smooth transitions
const STACK_SCREEN_OPTIONS: NativeStackNavigationOptions = {
  headerShown: false,
  animation: "default",
  gestureEnabled: true,
  gestureDirection: "horizontal",
  animationDuration: 350,
  animationTypeForReplace: "push",
};

const WELCOME_SCREEN_OPTIONS: NativeStackNavigationOptions = {
  ...STACK_SCREEN_OPTIONS,
  animation: "slide_from_bottom",
  gestureDirection: "vertical",
  animationDuration: 400,
};

// Smooth cross-fade for main screen transitions
const MAIN_SCREEN_OPTIONS: NativeStackNavigationOptions = {
  ...STACK_SCREEN_OPTIONS,
  animation: "fade",
  animationDuration: 300,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
  },
  webViewContent: {
    flex: 1,
    height: "100%",
    width: "100%",
  },
});

const AppNavigator = () => {
  const { isLoggedIn, selectedCountry } = useAuthStore();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

  useEffect(() => {
    navigationService.setNavigationRef(navigationRef);
  }, [navigationRef]);

  // Handle deep links
  const handleDeepLink = useCallback(
    (data: {
      url: string;
      merchantId?: string;
      merchantSlug?: string;
      merchantData?: {
        user_id: string;
        brand_name: string;
        share_url: string;
        qr_code_url: string;
      };
    }) => {
      if (navigationRef.isReady()) {
        // Handle slug-based deep links (new format)
        if (data.merchantData) {
          try {
            navigationRef.navigate("MerchantListings", {
              merchantId: data.merchantData.user_id,
              merchantName: data.merchantData.brand_name,
              total_listings: 0, // Will be fetched by the screen
              shareUrl: data.merchantData.share_url,
              qrCodeUrl: data.merchantData.qr_code_url,
            });
          } catch (error) {
            console.log(error);
            // Silent error handling
          }
        }
        // Handle legacy ID-based deep links
        else if (data.merchantId) {
          try {
            navigationRef.navigate("MerchantListings", {
              merchantId: data.merchantId,
              merchantName: "Merchant", // We'll fetch the actual name from the API
              total_listings: 0,
            });
          } catch (error) {
            console.log(error);
            // Silent error handling
          }
        }
      }
    },
    [navigationRef]
  );

  useDeepLink(handleDeepLink);

  useEffect(() => {
    if (navigationRef.isReady()) {
      let routeName: keyof RootStackParamList;

      if (!isLoggedIn) {
        routeName = "Welcome";
      } else if (!selectedCountry) {
        routeName = "ChooseCountry";
      } else {
        routeName = "MainApp";
      }

      navigationRef.reset({
        index: 0,
        routes: [{ name: routeName }],
      });
    }
  }, [isLoggedIn, selectedCountry, navigationRef]);

  return (
    <View style={styles.container}>
      <NavigationContainer ref={navigationRef}>
        <LoginSheetProvider>
          <Stack.Navigator
            initialRouteName="Welcome"
            screenOptions={STACK_SCREEN_OPTIONS}
          >
            <Stack.Group>
              <Stack.Screen
                name="Welcome"
                component={WelcomeScreen}
                options={WELCOME_SCREEN_OPTIONS}
              />
              <Stack.Screen
                name="ChooseCountry"
                component={ChooseCountryScreen}
                options={MAIN_SCREEN_OPTIONS}
              />
              <Stack.Screen
                name="MainApp"
                component={BottomTabNavigator}
                options={{
                  ...STACK_SCREEN_OPTIONS,
                  animation: "fade",
                  animationDuration: 300,
                  headerTitle: "Home",
                }}
              />
            </Stack.Group>

            {/* Secondary screens with smooth slide transitions */}
            <Stack.Group screenOptions={STACK_SCREEN_OPTIONS}>
              <Stack.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                  ...STACK_SCREEN_OPTIONS,
                  animation: "fade",
                  contentStyle: { backgroundColor: "#0a0a0a" },
                }}
              />
              <Stack.Screen name="SeeMore" component={SeeMoreScreen} />
              <Stack.Screen name="MyListings" component={MyListingsScreen} />
              <Stack.Screen name="Favorites" component={FavoritesScreen} />
              <Stack.Screen
                name="SelectCategory"
                component={SelectCategoryScreen}
              />
              <Stack.Screen name="ListingForm" component={ListingFormScreen} />
              <Stack.Screen
                name="PrivacyPolicy"
                component={PrivacyPolicyScreen}
              />
              <Stack.Screen name="TermsOfUse" component={TermsOfUseScreen} />
              <Stack.Screen
                name="VerificationForm"
                component={VerificationScreen}
              />
              <Stack.Screen
                name="MerchantListings"
                component={MerchantListingsScreen}
              />
              <Stack.Screen
                name="StoreLocation"
                component={StoreLocationScreen}
              />
              <Stack.Screen
                name="ArticleDetail"
                component={ArticleDetailScreen}
              />
            </Stack.Group>

            {/* Modal screens with smooth bottom sheet style */}
            <Stack.Group
              screenOptions={{
                presentation: "formSheet",
                animation: "slide_from_bottom",
                animationDuration: 350,
                sheetAllowedDetents: "fitToContents",
                sheetGrabberVisible: true,
                headerShown: false,
              }}
            >
              <Stack.Screen
                name="WebView"
                component={WebViewScreen}
                options={{ headerShown: true }}
              />
              <Stack.Screen
                name="LanguageSelection"
                component={LanguageSelectionModal}
              />
              <Stack.Screen name="Feedback" component={FeedbackModal} />
              <Stack.Screen name="PhotoSource" component={PhotoSourceModal} />
              <Stack.Screen name="Boost" component={BoostModal} />
              <Stack.Screen
                name="PremiumUpgrade"
                component={PremiumUpgradeModal}
              />
              <Stack.Screen
                name="ProductListingDetails"
                component={ProductListingDetailsModal}
              />
              <Stack.Screen
                name="ProductScrappedDetails"
                component={ProductScrappedDetailsModal}
              />
            </Stack.Group>
          </Stack.Navigator>
        </LoginSheetProvider>
      </NavigationContainer>
    </View>
  );
};

export default React.memo(AppNavigator);
