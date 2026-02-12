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
      const success = await verifyAuthLink(token);
      console.log("[ROOT_LAYOUT] Verification result:", success);

      if (success) {
        await AsyncStorage.setItem("isNewLogin", "true");
        triggerOnboardingAfterLogin();
        router.replace("/(tabs)");
      } else {
        router.replace("/login");
      }
    } catch (error) {
      console.error("[ROOT_LAYOUT] Error:", error);
      router.replace("/login");
    }
  });

  // Monitor auth state and navigation
  useEffect(() => {
    if (!isNavigationReady) {
      setIsNavigationReady(true);
      return;
    }

    const currentScreen = segments[0];
    const onAuthFlowScreen =
      currentScreen === "login" || currentScreen === "auth" || !segments.length;

    if (isLoading) {
      return;
    }

    if (!isAuthenticated && !onAuthFlowScreen) {
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
