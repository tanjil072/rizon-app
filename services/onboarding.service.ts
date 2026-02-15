import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { AuthService } from "./auth.service";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

export type OnboardingStatus = {
  isNewUser: boolean;
  onboardingComplete: boolean;
};

export type FeedbackPayload = {
  feedback: string;
  userId?: string;
};

export const OnboardingService = {
  /**
   * Check onboarding status from backend
   */
  async checkOnboardingStatus(): Promise<OnboardingStatus> {
    try {
      // Get session token
      const sessionToken = await AuthService.getSessionToken();
      if (!sessionToken) {
        console.log("[ONBOARDING] No session token, user not authenticated");
        return {
          isNewUser: false,
          onboardingComplete: true,
        };
      }

      // Fetch onboarding status from backend
      const response = await fetch(`${API_BASE_URL}/api/onboarding/status`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          "[ONBOARDING] Failed to fetch onboarding status:",
          response.status,
        );
        // Fall back to local storage if backend fails
        return await this.getLocalOnboardingStatus();
      }

      const data = await response.json();
      console.log("[ONBOARDING] Backend onboarding status:", data);

      return {
        isNewUser: data.is_new_user || false,
        onboardingComplete: data.onboarding_complete || false,
      };
    } catch (error) {
      console.error("[ONBOARDING] Error checking status:", error);
      // Fall back to local storage
      return await this.getLocalOnboardingStatus();
    }
  },

  /**
   * Fallback to local storage if backend is unavailable
   */
  async getLocalOnboardingStatus(): Promise<OnboardingStatus> {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem(
        "hasSeenInitialOnboarding",
      );
      const isNewUserFlag = await AsyncStorage.getItem("isNewUser");

      return {
        isNewUser: isNewUserFlag === "true" && !hasSeenOnboarding,
        onboardingComplete: !!hasSeenOnboarding,
      };
    } catch (error) {
      console.error("[ONBOARDING] Error checking local status:", error);
      return {
        isNewUser: false,
        onboardingComplete: true,
      };
    }
  },

  /**
   * Mark onboarding as complete on backend
   */
  async completeOnboarding(): Promise<boolean> {
    try {
      const sessionToken = await AuthService.getSessionToken();
      if (!sessionToken) {
        console.error("[ONBOARDING] No session token found");
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/onboarding/complete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error(
          "[ONBOARDING] Failed to mark onboarding complete:",
          response.status,
        );
        // Still mark locally even if backend fails
        await AsyncStorage.setItem("hasSeenInitialOnboarding", "true");
        return false;
      }

      // Also mark locally for offline support
      await AsyncStorage.setItem("hasSeenInitialOnboarding", "true");
      console.log("[ONBOARDING] Onboarding marked as complete");
      return true;
    } catch (error) {
      console.error("[ONBOARDING] Error completing onboarding:", error);
      // Still mark locally
      await AsyncStorage.setItem("hasSeenInitialOnboarding", "true");
      return false;
    }
  },

  /**
   * Mark user as no longer new (not a first-time user)
   */
  async markUserAsExisting(): Promise<boolean> {
    try {
      const sessionToken = await AuthService.getSessionToken();
      if (!sessionToken) {
        console.error("[ONBOARDING] No session token found");
        return false;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/onboarding/mark-existing-user`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        console.error(
          "[ONBOARDING] Failed to mark user as existing:",
          response.status,
        );
        return false;
      }

      console.log("[ONBOARDING] User marked as existing");
      return true;
    } catch (error) {
      console.error("[ONBOARDING] Error marking user as existing:", error);
      return false;
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
