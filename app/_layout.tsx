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
  const [hasSeenInitialAuthCheck, setHasSeenInitialAuthCheck] = useState(false);

  // Handle deep links with auth tokens
  useDeepLinkingHandler(async (token: string | null) => {
    console.log(
      "[ROOT_LAYOUT] 🔗 Deep link handler called with token:",
      !!token,
    );
    if (!token) {
      // No token found in deep link, show login
      console.log("[ROOT_LAYOUT] No token in deep link");
      router.replace("/login");
      return;
    }
    if (token === "ALREADY_PROCESSED") {
      // Token was already processed, show login and clear loading
      console.log("[ROOT_LAYOUT] Token already processed");
      router.replace("/login");
      return;
    }
    console.log("[ROOT_LAYOUT] ✅ Processing auth token");
    try {
      const success = await verifyAuthLink(token);
      console.log("[ROOT_LAYOUT] Verification result:", success);

      if (success) {
        console.log("[ROOT_LAYOUT] ✅ Auth successful, navigating to tabs");
        await AsyncStorage.setItem("isNewLogin", "true");
        triggerOnboardingAfterLogin();
        router.replace("/(tabs)");
      } else {
        console.log("[ROOT_LAYOUT] ❌ Auth failed, showing login");
        router.replace("/login");
      }
    } catch (error) {
      console.error("[ROOT_LAYOUT] Error:", error);
      router.replace("/login");
    }
  });

  // Monitor auth state and navigation
  useEffect(() => {
    // Give navigation time to settle
    if (!isNavigationReady) {
      console.log("[ROOT_LAYOUT] Setting navigation ready");
      setIsNavigationReady(true);
      return;
    }

    // Mark when we've seen the initial auth check
    if (isNavigationReady && !isLoading && !hasSeenInitialAuthCheck) {
      console.log(
        "[ROOT_LAYOUT] ✅ Initial auth check complete, auth state:",
        isAuthenticated,
      );
      setHasSeenInitialAuthCheck(true);
    }

    const currentScreen = segments[0];
    const onAuthFlowScreen =
      currentScreen === "login" || currentScreen === "auth" || !segments.length;

    console.log("[ROOT_LAYOUT] Navigation check:", {
      isLoading,
      isAuthenticated,
      currentScreen,
      onAuthFlowScreen,
      hasSeenInitialAuthCheck,
    });

    // Only enable navigation redirect after initial auth check
    if (!hasSeenInitialAuthCheck) {
      console.log("[ROOT_LAYOUT] Waiting for initial auth check...");
      return;
    }

    if (isLoading) {
      console.log("[ROOT_LAYOUT] Still loading");
      return;
    }

    if (!isAuthenticated && !onAuthFlowScreen) {
      console.log("[ROOT_LAYOUT] Not authenticated, redirecting to login");
      router.replace("/login");
    } else if (isAuthenticated && onAuthFlowScreen) {
      console.log("[ROOT_LAYOUT] Authenticated, redirecting to tabs");
      router.replace("/(tabs)");
    }
  }, [
    isAuthenticated,
    isLoading,
    segments,
    isNavigationReady,
    hasSeenInitialAuthCheck,
    router,
  ]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="auth" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
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
