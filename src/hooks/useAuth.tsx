import {
  appleAuth,
  AppleRequestResponse,
} from "@invertase/react-native-apple-authentication";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner-native";
import { useAuthStore } from "../store/authStore";
import { IS_IOS } from "../utils/constants";

export const useAuth = () => {
  const { t } = useTranslation();
  const { logIn, logInWithGoogle } = useAuthStore();

  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [appleSignInAvailable, setAppleSignInAvailable] = useState(false);

  // Check Apple Sign In availability
  useEffect(() => {
    if (IS_IOS) {
      setAppleSignInAvailable(appleAuth.isSupported);
    }
  }, []);

  // Apple Sign In handler
  const handleAppleSignIn = useCallback(async () => {
    try {
      setIsAppleLoading(true);
      const response: AppleRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      // Ensure we have an identity token
      if (!response.identityToken) {
        throw new Error("No identity token received from Apple");
      }

      await logIn({
        idToken: response.identityToken,
        user: {
          name: {
            firstName: response.fullName?.givenName || "",
            lastName: response.fullName?.familyName || "",
          },
        },
      });
    } catch (error: any) {
      console.log(error.message);
      toast.error(t("auth.signInError"), {
        description: t("auth.unknownError"),
      });
    } finally {
      setIsAppleLoading(false);
    }
  }, [logIn, t]);

  // Google Sign In handler
  const handleGoogleSignIn = useCallback(async () => {
    try {
      setIsGoogleLoading(true);
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (response.data?.idToken && response.data.user) {
        await logInWithGoogle({
          idToken: response.data.idToken,
          user: {
            email: response.data.user.email,
            name: {
              firstName: response.data.user.givenName || "",
              lastName: response.data.user.familyName || "",
            },
          },
        });
      } else {
        throw new Error("No identity token received from Google");
      }
    } catch (error: any) {
      console.error("Google Sign-In Error:", error);
      let errorMessage = t("login.errorMessages.general");

      if (error.code === "SIGN_IN_CANCELLED") {
        errorMessage = t("login.errorMessages.cancelled");
      } else if (error.code === "IN_PROGRESS") {
        errorMessage = t("login.errorMessages.inProgress");
      } else if (error.code === "PLAY_SERVICES_NOT_AVAILABLE") {
        errorMessage = t("login.errorMessages.playServices");
      }

      toast.error(t("auth.signInError"), {
        description: errorMessage,
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }, [logInWithGoogle, t]);

  return {
    isAppleLoading,
    isGoogleLoading,
    appleSignInAvailable,
    handleAppleSignIn,
    handleGoogleSignIn,
    isAnyLoading: isAppleLoading || isGoogleLoading,
  };
};
