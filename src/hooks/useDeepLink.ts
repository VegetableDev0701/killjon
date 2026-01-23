import { useCallback, useEffect } from "react";
import { DeepLinkData, deepLinkService } from "../services/deepLinkService";

export const useDeepLink = (onDeepLink: (data: DeepLinkData) => void) => {
  const handleDeepLink = useCallback(
    (data: DeepLinkData) => {
      onDeepLink(data);
    },
    [onDeepLink]
  );

  useEffect(() => {
    // Add listener for deep links
    const unsubscribe = deepLinkService.addListener(handleDeepLink);

    // Check for initial URL (app opened from deep link)
    deepLinkService.getInitialURL().then(async (url) => {
      if (url) {
        const data = deepLinkService.parseURL(url);
        if (data) {
          // Call the service's handleDeepLink method directly to fetch merchant data
          await deepLinkService.handleDeepLink(data);
        }
      }
    });

    return unsubscribe;
  }, [handleDeepLink]);

  return {
    generateMerchantURL:
      deepLinkService.generateMerchantURL.bind(deepLinkService),
    openURL: deepLinkService.openURL.bind(deepLinkService),
  };
};
