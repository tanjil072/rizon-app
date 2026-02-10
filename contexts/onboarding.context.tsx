import {
  OnboardingService,
  OnboardingStatus,
} from "@/services/onboarding.service";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
  triggerOnboardingAfterLogin: () => void;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [showInitialSheet, setShowInitialSheet] = useState(false);
  const [onboardingStatus, setOnboardingStatus] =
    useState<OnboardingStatus | null>(null);

  const timeoutRef = useRef<number | null>(null);
  const hasInitializedRef = useRef(false);

  const checkOnboarding = async () => {
    try {
      const status = await OnboardingService.checkOnboardingStatus();
      setOnboardingStatus(status);

      // Only show initial sheet if user is new AND hasn't seen onboarding
      // AND the flag is explicitly set via triggerOnboardingAfterLogin
      const hasSeenFlag = await AsyncStorage.getItem("onboardingTriggered");
      const shouldShowInitialSheet =
        status.isNewUser && !status.hasSeenInitialOnboarding && hasSeenFlag;

      if (shouldShowInitialSheet) {
        // Clear the flag and show sheet
        await AsyncStorage.removeItem("onboardingTriggered");
        timeoutRef.current = setTimeout(() => {
          setShowInitialSheet(true);
        }, 500);
      }
    } catch (error) {
      console.error("Error checking onboarding:", error);
    }
  };

  const triggerOnboardingAfterLogin = async () => {
    try {
      // Check if this is the first time user is logging in on this device
      const hasCompletedOnboarding = await AsyncStorage.getItem(
        "hasSeenInitialOnboarding",
      );

      if (!hasCompletedOnboarding) {
        // Mark that onboarding should be shown
        await AsyncStorage.setItem("onboardingTriggered", "true");
        // Trigger the check
        setTimeout(() => {
          checkOnboarding();
        }, 300);
      }
    } catch (error) {
      console.error("Error triggering onboarding:", error);
    }
  };

  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      checkOnboarding();
    }

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
        triggerOnboardingAfterLogin,
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
