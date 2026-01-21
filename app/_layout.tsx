import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { InitialOnboardingSheet } from "@/components/onboarding";
import { OnboardingProvider } from "@/contexts/onboarding.context";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <OnboardingProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />

      <InitialOnboardingSheet />
    </OnboardingProvider>
  );
}
