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
  triggerOnboardingAfterLogin: () => void;
  completeOnboarding: () => Promise<void>;
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

  /**
   * Check onboarding status from backend
   * Backend is the source of truth for whether user has completed onboarding
   */
  const checkOnboarding = async () => {
    try {
      console.log(
        "[ONBOARDING_CONTEXT] Checking onboarding status from backend",
      );

      // Get status from backend (backend is source of truth)
      const status = await OnboardingService.checkOnboardingStatus();
      console.log(
        "[ONBOARDING_CONTEXT] Onboarding status from backend:",
        status,
      );

      setOnboardingStatus(status);

      // Show initial sheet ONLY if:
      // 1. User is new (is_new_user = true)
      // 2. User hasn't completed onboarding (onboarding_complete = false)
      // These values come from backend after auth
      const shouldShowInitialSheet =
        status.isNewUser && !status.onboardingComplete;

      console.log("[ONBOARDING_CONTEXT] Should show sheet?", {
        isNewUser: status.isNewUser,
        onboardingComplete: status.onboardingComplete,
        shouldShow: shouldShowInitialSheet,
      });

      if (shouldShowInitialSheet) {
        timeoutRef.current = setTimeout(() => {
          console.log("[ONBOARDING_CONTEXT] Showing initial onboarding sheet");
          setShowInitialSheet(true);
        }, 500);
      }
    } catch (error) {
      console.error("[ONBOARDING_CONTEXT] Error checking onboarding:", error);
    }
  };

  /**
   * Triggered after successful login to check and show onboarding
   */
  const triggerOnboardingAfterLogin = async () => {
    try {
      console.log(
        "[ONBOARDING_CONTEXT] Triggering onboarding flow after login",
      );

      // Check onboarding status immediately after login
      // The backend has just returned is_new_user and onboarding_complete
      setTimeout(() => {
        checkOnboarding();
      }, 300);
    } catch (error) {
      console.error("[ONBOARDING_CONTEXT] Error triggering onboarding:", error);
    }
  };

  /**
   * Mark onboarding as complete on backend
   */
  const completeOnboarding = async () => {
    try {
      console.log("[ONBOARDING_CONTEXT] Completing onboarding");
      await OnboardingService.completeOnboarding();
      await OnboardingService.markUserAsExisting();

      // Update local state
      setOnboardingStatus((prev) =>
        prev ? { ...prev, onboardingComplete: true, isNewUser: false } : null,
      );
      setShowInitialSheet(false);

      console.log("[ONBOARDING_CONTEXT] Onboarding completed");
    } catch (error) {
      console.error("[ONBOARDING_CONTEXT] Error completing onboarding:", error);
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
        completeOnboarding,
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
