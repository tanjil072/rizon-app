import {
  OnboardingService,
  OnboardingStatus,
} from "@/services/onboarding.service";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type OnboardingContextType = {
  showInitialSheet: boolean;
  setShowInitialSheet: (show: boolean) => void;
  onboardingStatus: OnboardingStatus | null;
  checkOnboarding: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [showInitialSheet, setShowInitialSheet] = useState(false);
  const [onboardingStatus, setOnboardingStatus] =
    useState<OnboardingStatus | null>(null);

  // Check onboarding status on mount
  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const status = await OnboardingService.checkOnboardingStatus();
      setOnboardingStatus(status);

      // Show initial sheet if user just completed onboarding
      // This checks if the user is new and has just seen the initial onboarding
      if (status.isNewUser && !status.hasSeenInitialOnboarding) {
        // Small delay to allow any notifications to appear first
        setTimeout(() => {
          setShowInitialSheet(true);
        }, 500);
      }
    } catch (error) {
      console.error("Error checking onboarding:", error);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        showInitialSheet,
        setShowInitialSheet,
        onboardingStatus,
        checkOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
