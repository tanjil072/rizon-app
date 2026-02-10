import * as Linking from "expo-linking";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

const prefix = Platform.OS === "web" ? "http://localhost:8081" : "rizon://";

export const linking = {
  prefixes: [prefix, "rizon://", "rizonapp://"],
  config: {
    screens: {
      auth: "auth",
      "(tabs)": {
        screens: {
          index: "",
        },
      },
    },
  },
};

export function useDeepLinkingHandler(
  onAuthTokenReceived: (token: string) => void,
) {
  const navigationRef = useRef<any>(null);

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      console.log("[DEEP_LINKING] Received deep link:", url);

      if (!url) return;

      // Parse the URL to extract the token
      const parsedUrl = url.replace(/.*?:\/\//g, "");
      const [path, query] = parsedUrl.split("?");

      console.log("[DEEP_LINKING] Path:", path, "Query:", query);

      if (path === "auth" && query) {
        const params = new URLSearchParams(query);
        const token = params.get("token");

        if (token) {
          console.log("[DEEP_LINKING] Extracted token:", token);
          onAuthTokenReceived(token);
        }
      }
    };

    // Listen for deep link events
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Check for initial URL (when app is launched from a deep link)
    const checkInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url != null) {
        console.log("[DEEP_LINKING] Initial URL:", url);
        handleDeepLink({ url });
      }
    };

    checkInitialURL();

    return () => {
      subscription.remove();
    };
  }, [onAuthTokenReceived]);

  return navigationRef;
}

/**
 * Extract authentication token from deep link
 */
export function extractTokenFromURL(url: string): string | null {
  try {
    const parsed = new URL(url.replace("rizon://", "http://localhost/"));
    return parsed.searchParams.get("token");
  } catch {
    // Try manual parsing
    const match = url.match(/token=([^&]+)/);
    return match ? match[1] : null;
  }
}
