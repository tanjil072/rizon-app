import { RizonBottomSheet } from "@/components/ui/rizon-bottom-sheet";
import { useOnboarding } from "@/contexts/onboarding.context";
import { OnboardingService } from "@/services/onboarding.service";
import React from "react";
import { FeedbackSheet } from "../FeedbackSheet/FeedbackSheet";
import { ReviewSheet } from "../ReviewSheet/ReviewSheet";
import { InitialOnboardingContent } from "./InitialOnboardingContent";

export const InitialOnboardingSheet = () => {
  const [sheetState, setSheetState] = React.useState(0);
  const { showInitialSheet, setShowInitialSheet } = useOnboarding();

  React.useEffect(() => {
    if (showInitialSheet) {
      OnboardingService.markOnboardingSheetSeen();
    }
  }, [showInitialSheet]);

  const handleClose = () => {
    setShowInitialSheet(false);
    setSheetState(0);
  };

  const onNotYetPress = () => setSheetState(1);
  const onLovingItPress = () => setSheetState(2);

  return (
    <RizonBottomSheet
      visible={showInitialSheet}
      onClose={handleClose}
      enableBackdropDismiss
    >
      {sheetState === 0 && (
        <InitialOnboardingContent
          onNotYetPress={onNotYetPress}
          onLovingItPress={onLovingItPress}
        />
      )}
      {sheetState === 1 && <FeedbackSheet onClose={handleClose} />}
      {sheetState === 2 && <ReviewSheet onClose={handleClose} />}
    </RizonBottomSheet>
  );
};
