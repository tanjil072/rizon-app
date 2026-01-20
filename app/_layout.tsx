import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { OnboardingManager } from "@/components/onboarding/onboarding-manager";
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

      <OnboardingManager />
    </OnboardingProvider>
  );
}
