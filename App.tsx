import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, StatusBar } from "react-native";
import Config from "react-native-config";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from "sonner-native";
import UpdateModal from "./src/components/UpdateModal";
import {
  useNotificationHandlers,
  useNotifications,
} from "./src/hooks/useNotifications";
import "./src/i18n/i18n";
import { LanguageProvider } from "./src/i18n/LanguageContext";
import AppNavigator from "./src/navigation/AppNavigator";
import {
  sessionManager,
  trackAppOpen,
} from "./src/services/firebaseAnalyticsService";
import {
  checkAppVersion,
  VersionCheckResult,
} from "./src/services/versionCheck";
import { useAuthStore } from "./src/store/authStore";
// @ts-ignore
import "./global.css";

const httpLink = new HttpLink({
  uri: Config.API_URL + "/graphql",
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
});

// Create cache with aggressive cache policies disabled
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Disable caching for all queries by default
        getItemsByCategoryAndHids: {
          read: () => undefined, // Always return undefined to force refetch
        },
        chats: {
          read: () => undefined,
        },
        chat: {
          read: () => undefined,
        },
      },
    },
  },
  // Disable result caching
  resultCaching: false,
});

const client = new ApolloClient({
  link: httpLink,
  cache: cache,
  // Set default fetch policy to no-cache
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "no-cache",
      errorPolicy: "all",
    },
    query: {
      fetchPolicy: "no-cache",
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
  // Disable query deduplication to ensure fresh data
  queryDeduplication: false,
});

// Create a ref to access the client from outside
export const apolloClientRef = { current: client };

function App(): React.JSX.Element {
  const [updatesResult, setUpdatesResult] = useState<
    VersionCheckResult | undefined
  >();
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const { isLoggedIn, userProfile } = useAuthStore();

  // Setup notifications after login
  useNotifications();

  // Handle all notification interactions (foreground, background, quit state)
  useNotificationHandlers((message) => {
    // Handle notification opened (background/quit state)
    console.log("[App] Notification opened:", message);
    // TODO: Add navigation logic based on message.data
    // Example:
    // if (message.data?.screen === 'Chat' && message.data?.chatId) {
    //   navigation.navigate('Chat', { chatId: message.data.chatId });
    // }
  });

  // Track app open and session management
  useEffect(() => {
    if (isLoggedIn && userProfile?.id) {
      trackAppOpen(userProfile.id);
      sessionManager.startSession(userProfile.id);
    }
  }, [isLoggedIn, userProfile?.id]);

  // Track app state changes for session management
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // App has come to the foreground
        if (isLoggedIn && userProfile?.id) {
          trackAppOpen(userProfile.id);
          sessionManager.startSession(userProfile.id);
        }
      } else if (
        appState.current === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        // App has gone to the background
        if (isLoggedIn && userProfile?.id) {
          sessionManager.endSession();
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isLoggedIn, userProfile?.id]);

  useEffect(() => {
    // Initialize Google Sign-In
    GoogleSignin.configure({
      webClientId: Config.GOOGLE_WEB_CLIENT_ID || "",
      iosClientId: Config.GOOGLE_IOS_CLIENT_ID || "",
      offlineAccess: true,
      hostedDomain: "",
      forceCodeForRefreshToken: true,
    });

    // Check app version
    (async () => {
      try {
        const result = await checkAppVersion();
        if (result.needsUpdate) {
          setUpdatesResult(result);
        }
      } catch (error) {
        console.error("Version check failed:", error);
      }
    })();
  }, []);

  return (
    <ApolloProvider client={client}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaProvider>
            <LanguageProvider>
              <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

              <AppNavigator />
              <Toaster
                position="top-center"
                theme="dark"
                closeButton
                swipeToDismissDirection="left"
              />
              {updatesResult && <UpdateModal {...updatesResult} />}
            </LanguageProvider>
          </SafeAreaProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ApolloProvider>
  );
}

export default App;
