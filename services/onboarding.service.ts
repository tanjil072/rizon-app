import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

export type OnboardingStatus = {
  isNewUser: boolean;
  hasSeenInitialOnboarding: boolean;
  onboardingCompletedAt?: string;
};

export type FeedbackPayload = {
  feedback: string;
  userId?: string;
};

export const OnboardingService = {
  /**
   * Check if the user has just completed initial onboarding
   */
  async checkOnboardingStatus(): Promise<OnboardingStatus> {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem(
        "hasSeenInitialOnboarding",
      );

      // Check if we have the isNewUser flag from auth
      let isNewUser = false;
      try {
        const isNewUserFlag = await AsyncStorage.getItem("isNewUser");
        if (isNewUserFlag !== null) {
          // Use the flag from auth verification (more reliable than checking AsyncStorage)
          isNewUser = isNewUserFlag === "true";
          console.log(
            "[ONBOARDING] Using isNewUser from auth flag:",
            isNewUser,
          );
        } else {
          // Fall back to checking if hasSeenOnboarding is set
          isNewUser = !hasSeenOnboarding;
          console.log(
            "[ONBOARDING] Fallback - isNewUser based on hasSeenOnboarding:",
            isNewUser,
          );
        }
      } catch (error) {
        // If there's any error reading the flag, fall back to the old logic
        isNewUser = !hasSeenOnboarding;
      }

      return {
        isNewUser,
        hasSeenInitialOnboarding: !!hasSeenOnboarding,
      };
    } catch (error) {
      console.error("[ONBOARDING] Error checking status:", error);
      return {
        isNewUser: false,
        hasSeenInitialOnboarding: true,
      };
    }
  },

  /**
   * Send user feedback to backend
   */
  async submitFeedback(payload: FeedbackPayload): Promise<boolean> {
    try {
      // Get session token from storage (try SecureStore first, then AsyncStorage)
      let sessionToken: string | null = null;

      try {
        // Try secure store first (native iOS/Android)
        sessionToken = await SecureStore.getItemAsync("sessionToken");
        if (sessionToken) {
          console.log("[ONBOARDING] Session token retrieved from secure store");
        }
      } catch {
        // Fallback to AsyncStorage for web/development
        try {
          sessionToken = await AsyncStorage.getItem("sessionToken");
          if (sessionToken) {
            console.log(
              "[ONBOARDING] Session token retrieved from AsyncStorage",
            );
          }
        } catch {
          sessionToken = null;
        }
      }

      if (!sessionToken) {
        console.error("[ONBOARDING] No session token found");
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/feedback/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          content: payload.feedback,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("[ONBOARDING] Feedback submission failed:", error);
        return false;
      }

      console.log("[ONBOARDING] Feedback submitted successfully");
      return true;
    } catch (error) {
      console.error("[ONBOARDING] Error submitting feedback:", error);
      return false;
    }
  },

  /**
   * Mark that user has seen the initial onboarding sheet
   */
  async markOnboardingSheetSeen() {
    try {
      // simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.debug("Development: Could not mark onboarding sheet as seen");
    }
  },

  /**
   * Open app store for review based on platform
   */
  openAppStore(): void {
    const APP_STORE_ID = "YOUR_APP_STORE_ID"; // TODO: App Store ID
    const PLAY_STORE_ID = "YOUR_PLAY_STORE_ID"; // TODO: Play Store ID

    if (Platform.OS === "ios") {
      const url = `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`;
      Linking.openURL(url);
    } else if (Platform.OS === "android") {
      const url = `market://details?id=${PLAY_STORE_ID}`;
      Linking.openURL(url).catch(() => {
        // Fallback to web version if Play Store app is not installed
        Linking.openURL(
          `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}`,
        );
      });
    }
  },
};
