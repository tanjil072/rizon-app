import * as Linking from "expo-linking";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";

const prefix = Platform.OS === "web" ? "http://localhost:8081" : "rizon://";

// Simple linking config - just prevent "unmatched route" errors
// The useDeepLinkingHandler does all the real work
export const linking = {
  prefixes: ["rizon://", "https://app.rizon.app"],
  config: {
    screens: {
      login: "*", // Match any unmatched path to login screen
      "(tabs)": {
        screens: {
          index: "",
        },
      },
    },
  },
};

export function useDeepLinkingHandler(
  onAuthTokenReceived: (token: string) => Promise<void> | void,
) {
  const hasProcessedInitialUrl = useRef(false);
  const processedTokens = useRef<Set<string>>(new Set());

  useEffect(() => {
    let isMounted = true;

    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log("[DEEP_LINKING] Received deep link:", url);

      if (!url || !isMounted) return;

      // Extract token from the URL
      const token = extractTokenFromURL(url);

      if (token) {
        // Check if we've already processed this token
        if (processedTokens.current.has(token)) {
          console.log(
            "[DEEP_LINKING] Token already processed, skipping:",
            token,
          );
          return;
        }

        console.log("[DEEP_LINKING] Extracted token:", token);
        console.log("[DEEP_LINKING] Calling auth callback immediately...");

        // Mark token as being processed
        processedTokens.current.add(token);

        // Call callback immediately without setTimeout to avoid unmounting issues
        try {
          Promise.resolve(onAuthTokenReceived(token))
            .then(() => {
              console.log("[DEEP_LINKING] Token processed successfully");
            })
            .catch((error) => {
              console.error("[DEEP_LINKING] Error processing token:", error);
              // Remove from processed set on error so it can be retried
              processedTokens.current.delete(token);
            });
        } catch (error) {
          console.error("[DEEP_LINKING] Error calling callback:", error);
          // Remove from processed set on error so it can be retried
          processedTokens.current.delete(token);
        }
      } else {
        console.warn("[DEEP_LINKING] No token found in URL:", url);
      }
    };

    // Listen for deep link events when app is already running
    const subscription = Linking.addEventListener("url", handleDeepLink);

    // Check for initial URL (when app is launched from a deep link)
    // Only do this once to prevent infinite loops
    const checkInitialURL = async () => {
      if (hasProcessedInitialUrl.current) {
        console.log("[DEEP_LINKING] Initial URL already processed, skipping");
        return;
      }

      try {
        const url = await Linking.getInitialURL();
        if (url != null) {
          console.log("[DEEP_LINKING] Initial URL on app launch:", url);
          hasProcessedInitialUrl.current = true;
          await handleDeepLink({ url });
        } else {
          console.log("[DEEP_LINKING] No initial URL found");
          hasProcessedInitialUrl.current = true;
        }
      } catch (error) {
        console.error("[DEEP_LINKING] Error checking initial URL:", error);
        hasProcessedInitialUrl.current = true;
      }
    };

    checkInitialURL();

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, [onAuthTokenReceived]);
}

/**
 * Generate deep link URL for authentication
 */
export function generateAuthDeepLink(token: string): string {
  return `rizon://auth?token=${encodeURIComponent(token)}`;
}

/**
 * Extract authentication token from deep link
 */
export function extractTokenFromURL(url: string): string | null {
  try {
    // Handle rizon:// scheme
    if (url.includes("rizon://")) {
      const urlObj = new URL(url.replace("rizon://", "http://localhost/"));
      const token = urlObj.searchParams.get("token");
      if (token) return token;
    }

    // Handle https:// scheme (for email links)
    if (url.includes("https://")) {
      const urlObj = new URL(url);
      const token = urlObj.searchParams.get("token");
      if (token) return token;
    }

    // Fallback: manual parsing for query string
    const match = url.match(/token=([^&\s]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch (error) {
    console.error("[DEEP_LINKING] Error parsing URL:", error);
    return null;
  }
}

/**
 * Test deep link by opening it
 * Useful for development and testing
 */
export async function testDeepLink(url: string): Promise<void> {
  try {
    console.log("[DEEP_LINKING] Testing deep link:", url);
    await Linking.openURL(url);
  } catch (error) {
    console.error("[DEEP_LINKING] Error opening URL:", error);
  }
}

/**
 * Simulate a deep link for testing (without opening URL)
 * Useful when app scheme isn't registered yet
 */
export async function simulateDeepLink(
  url: string,
  handler: (token: string) => Promise<void> | void,
): Promise<void> {
  const token = extractTokenFromURL(url);
  if (token) {
    console.log("[DEEP_LINKING] Simulating deep link with token:", token);
    try {
      await Promise.resolve(handler(token));
      console.log("[DEEP_LINKING] Token processed successfully");
    } catch (error) {
      console.error("[DEEP_LINKING] Error processing token:", error);
    }
  } else {
    console.warn("[DEEP_LINKING] No token found in URL:", url);
  }
}
