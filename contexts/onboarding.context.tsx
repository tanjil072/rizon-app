import {
  OnboardingService,
  OnboardingStatus,
} from "@/services/onboarding.service";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type OnboardingContextType = {
  showInitialSheet: boolean;
  setShowInitialSheet: (show: boolean) => void;
  onboardingStatus: OnboardingStatus | null;
  setOnboardingStatus: React.Dispatch<
    React.SetStateAction<OnboardingStatus | null>
  >;
  checkOnboarding: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [showInitialSheet, setShowInitialSheet] = useState(false);
  const [onboardingStatus, setOnboardingStatus] =
    useState<OnboardingStatus | null>(null);

  const timeoutRef = useRef<number | null>(null);

  const checkOnboarding = async () => {
    try {
      const status = await OnboardingService.checkOnboardingStatus();
      setOnboardingStatus(status);

      const shouldShowInitialSheet =
        status.isNewUser && !status.hasSeenInitialOnboarding;

      if (shouldShowInitialSheet) {
        timeoutRef.current = setTimeout(() => {
          setShowInitialSheet(true);
        }, 500);
      }
    } catch (error) {
      console.error("Error checking onboarding:", error);
    }
  };

  useEffect(() => {
    checkOnboarding();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        showInitialSheet,
        setShowInitialSheet,
        onboardingStatus,
        setOnboardingStatus,
        checkOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
