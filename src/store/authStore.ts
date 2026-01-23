import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { apolloClientRef } from "../../App";
import {
  AuthService,
  GoogleLoginPayload,
  LoginPayload,
  UserProfile,
} from "../services/authService";
import {
  clearAnalyticsUser,
  setAnalyticsUserId,
  setUserProperties,
  trackMerchantProfileUpdate,
} from "../services/firebaseAnalyticsService";
import { MerchantService } from "../services/merchantService";
import { authUtils } from "../utils/axiosClient";
import { storage } from "../utils/storage";
import { useChatStore } from "./chatStore";

interface MerchantDetails {
  id: string;
  user_id: string;
  brand_name: string;
  logo_url: string | null;
  slug: string;
  category: string;
  status: string;
  share_url: string;
  qr_code_url: string | null;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  totalListings: number;
  createdAt: string;
  updatedAt: string;
}

type UserState = {
  userProfile: UserProfile | null;
  merchantDetails: MerchantDetails | null;
  isLoggedIn: boolean;
  hasCompletedOnboarding: boolean;
  selectedCountry: string | null;
  logIn: (payload: LoginPayload) => Promise<void>;
  logInWithGoogle: (payload: GoogleLoginPayload) => Promise<void>;
  logOut: () => Promise<void>;
  forceLogout: () => Promise<void>;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  getUserProfile: () => Promise<UserProfile | null>;
  getMerchantDetails: () => Promise<MerchantDetails | null>;
  updateName: (firstName: string, lastName: string) => Promise<void>;
  setSelectedCountry: (country: string) => void;
};

export const useAuthStore = create(
  persist<UserState>(
    (set, get) => ({
      mode: "explorer",
      userProfile: null,
      merchantDetails: null,
      isLoggedIn: false,
      hasCompletedOnboarding: false,
      selectedCountry: null,
      logIn: async (payload: LoginPayload) => {
        const loginUser = await AuthService.getUserLogin(payload);

        if (loginUser?.success && loginUser.data) {
          await authUtils.storeTokens(
            loginUser.data.accessToken,
            loginUser.data.refreshToken
          );

          let countryData = null;
          if (loginUser.data.user?.country) {
            countryData = loginUser.data.user.country;
          }

          set((state) => ({
            ...state,
            userProfile: loginUser.data.user,
            isLoggedIn: true,
            selectedCountry: countryData,
          }));

          // Set Firebase Analytics user ID and properties
          await setAnalyticsUserId(loginUser.data.user.id);
          await setUserProperties({
            country: countryData || "unknown",
          });
        }
      },
      logInWithGoogle: async (payload: GoogleLoginPayload) => {
        const loginUser = await AuthService.getUserGoogleLogin(payload);

        if (loginUser?.success && loginUser.data) {
          await authUtils.storeTokens(
            loginUser.data.accessToken,
            loginUser.data.refreshToken
          );

          let countryData = null;
          if (loginUser.data.user?.country) {
            countryData = loginUser.data.user.country;
          }

          set((state) => ({
            ...state,
            userProfile: loginUser.data.user,
            isLoggedIn: true,
            selectedCountry: countryData,
          }));

          // Set Firebase Analytics user ID and properties
          await setAnalyticsUserId(loginUser.data.user.id);
          await setUserProperties({
            country: countryData || "unknown",
          });
        }
      },
      logOut: async () => {
        if (apolloClientRef.current) {
          await apolloClientRef.current.clearStore();
        }

        const { resetStore } = useChatStore.getState();
        resetStore();

        await authUtils.clearTokens();

        // Clear Firebase Analytics user data
        await clearAnalyticsUser();

        set((state) => ({
          ...state,
          userProfile: null,
          merchantDetails: null,
          isLoggedIn: false,
          selectedCountry: null,
        }));
      },
      forceLogout: async () => {
        try {
          if (apolloClientRef.current) {
            await apolloClientRef.current.clearStore();
          }

          const { resetStore } = useChatStore.getState();
          resetStore();

          await authUtils.clearTokens();

          // Clear Firebase Analytics user data
          await clearAnalyticsUser();

          set((state) => ({
            ...state,
            userProfile: null,
            merchantDetails: null,
            isLoggedIn: false,
            selectedCountry: null,
            hasCompletedOnboarding: false, // Reset onboarding for forced logout
          }));
        } catch (error) {
          console.error("Force logout error:", error);
          // Even if cleanup fails, ensure user is logged out
          await clearAnalyticsUser();
          set((state) => ({
            ...state,
            userProfile: null,
            merchantDetails: null,
            isLoggedIn: false,
            selectedCountry: null,
            hasCompletedOnboarding: false,
          }));
        }
      },
      completeOnboarding: () => {
        set((state) => ({
          ...state,
          hasCompletedOnboarding: true,
        }));
      },
      resetOnboarding: () => {
        set((state) => ({
          ...state,
          hasCompletedOnboarding: false,
        }));
      },
      getUserProfile: async () => {
        const userProfile = await AuthService.getUserProfile();

        if (userProfile) {
          set((state) => ({
            ...state,
            userProfile,
          }));
        }

        return userProfile;
      },
      getMerchantDetails: async () => {
        try {
          const currentState = get();
          if (!currentState.userProfile?.id) {
            return null;
          }

          const response = await MerchantService.getMerchantDetails(
            currentState.userProfile.id
          );

          if (response?.success && response.data) {
            set((state) => ({
              ...state,
              merchantDetails: response.data,
            }));
            return response.data;
          }

          return null;
        } catch (error) {
          console.error("Error fetching merchant details:", error);
          return null;
        }
      },
      updateName: async (firstName: string, lastName: string) => {
        const response = await AuthService.getUserNameUpdated(
          firstName,
          lastName
        );
        if (response?.firstName && response?.lastName) {
          const currentState = get();
          set((state) => ({
            ...state,
            userProfile: state.userProfile
              ? {
                  ...state.userProfile,
                  firstName: response.firstName,
                  lastName: response.lastName,
                }
              : null,
          }));

          // Track merchant profile update if user is a verified merchant
          if (
            currentState.userProfile?.id &&
            currentState.userProfile?.verifiedStatus === "VERIFIED"
          ) {
            trackMerchantProfileUpdate(currentState.userProfile.id);
          }
        }
      },
      setSelectedCountry: (country: string) => {
        set((state) => ({
          ...state,
          selectedCountry: country,
        }));
      },
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => ({
        setItem: (name: string, value: string) => {
          storage.set(name, value);
        },
        getItem: (name: string) => {
          const value = storage.getString(name);
          return value ?? null;
        },
        removeItem: (name: string) => {
          storage.remove(name);
        },
      })),
    }
  )
);

// Set up the force logout handler for axios interceptor
authUtils.setForceLogoutHandler(async () => {
  const { forceLogout } = useAuthStore.getState();
  await forceLogout();
});
