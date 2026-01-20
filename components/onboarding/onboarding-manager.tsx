import { InitialOnboardingSheet } from "@/components/onboarding/initial-onboarding-sheet";
import { useOnboarding } from "@/contexts/onboarding.context";
import React from "react";

export const OnboardingManager = () => {
  const { showInitialSheet } = useOnboarding();

  return <InitialOnboardingSheet visible={showInitialSheet} />;
};
