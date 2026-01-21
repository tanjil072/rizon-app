import * as Linking from "expo-linking";
import { Platform } from "react-native";

// const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://api.rizon.app";

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
  async checkOnboardingStatus() {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      // mock response
      return {
        isNewUser: true,
        hasSeenInitialOnboarding: false,
      };
    } catch (error) {
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
      // simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 500));

      return true;
    } catch (error) {
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
