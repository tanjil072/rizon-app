import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { InitialOnboardingSheet } from "@/components/onboarding";
import { AuthProvider, useAuth } from "@/contexts/auth.context";
import {
  OnboardingProvider,
  useOnboarding,
} from "@/contexts/onboarding.context";
import { useDeepLinkingHandler } from "@/utils/deep-linking";
import { ActivityIndicator, View } from "react-native";

export const unstable_settings = {
  anchor: "(tabs)",
};

/**
 * Root Layout Component - handles navigation and auth flow
 */
function RootLayoutContent() {
  const { isAuthenticated, isLoading, verifyAuthLink } = useAuth();
  const { triggerOnboardingAfterLogin } = useOnboarding();
  const router = useRouter();
  const segments = useSegments();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // Handle deep links with auth tokens
  useDeepLinkingHandler(async (token: string) => {
    console.log("[ROOT_LAYOUT] Processing auth token:", token);
    try {
      console.log("[ROOT_LAYOUT] Calling verifyAuthLink...");
      const success = await verifyAuthLink(token);
      console.log("[ROOT_LAYOUT] verifyAuthLink result:", success);

      if (success) {
        console.log("[ROOT_LAYOUT] Auth successful, triggering onboarding");
        // Mark this as new user login to show onboarding
        await AsyncStorage.setItem("isNewLogin", "true");
        triggerOnboardingAfterLogin();
        // Navigate to home
        console.log("[ROOT_LAYOUT] Navigating to home...");
        router.replace("/(tabs)");
      } else {
        console.error("[ROOT_LAYOUT] Auth verification failed");
        // Navigate back to login
        console.log("[ROOT_LAYOUT] Navigating to login...");
        router.replace("/login");
      }
    } catch (error) {
      console.error("[ROOT_LAYOUT] Error in deep link handler:", error);
      router.replace("/login");
    }
  });

  // Monitor auth state and navigation
  useEffect(() => {
    if (!isNavigationReady) {
      setIsNavigationReady(true);
      return;
    }

    const onLoginScreen = segments[0] === "login" || !segments.length;

    if (isLoading) {
      return;
    }

    if (!isAuthenticated && !onLoginScreen) {
      // Redirect to login only if not already there
      console.log("[ROOT_LAYOUT] Redirecting to login");
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, segments, isNavigationReady, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
      {isAuthenticated && <InitialOnboardingSheet />}
    </>
  );
}

/**
 * Root Layout Provider Wrapper
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <OnboardingProvider>
        <RootLayoutContent />
      </OnboardingProvider>
    </AuthProvider>
  );
}
