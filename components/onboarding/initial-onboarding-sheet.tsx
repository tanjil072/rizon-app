import { RizonBottomSheet } from "@/components/ui/rizon-bottom-sheet";
import { RizonButton } from "@/components/ui/rizon-button";
import { RIZON_LOGO } from "@/constants/assets";
import { useOnboarding } from "@/contexts/onboarding.context";
import { OnboardingService } from "@/services/onboarding.service";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { FeedbackSheet } from "./feedback-sheet";
import { ReviewSheet } from "./review-sheet";

type InitialOnboardingSheetProps = {
  visible: boolean;
};

export const InitialOnboardingSheet = ({
  visible,
}: InitialOnboardingSheetProps) => {
  const [sheetState, setSheetState] = React.useState(0);
  const { setShowInitialSheet } = useOnboarding();

  // Mark as seen when sheet is first shown
  React.useEffect(() => {
    if (visible) {
      OnboardingService.markOnboardingSheetSeen();
    }
  }, [visible]);

  const handleClose = () => {
    setShowInitialSheet(false);
    setSheetState(0); // Reset state for next time
  };

  const onNotYetPress = () => {
    setSheetState(1);
  };
  const onLovingItPress = () => {
    setSheetState(2);
  };
  return (
    <RizonBottomSheet
      visible={visible}
      onClose={handleClose}
      enableBackdropDismiss={sheetState === 0}
    >
      {sheetState === 0 && (
        <View style={styles.container}>
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Image
                source={RIZON_LOGO}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </View>

          <Text style={styles.title}>Enjoying Rizon so far?</Text>
          <Text style={styles.subtitle}>
            Your feedback helps us build a better money experience.
          </Text>

          <View style={styles.buttonsContainer}>
            <View style={styles.buttonRow}>
              <RizonButton
                title="Not yet"
                onPress={onNotYetPress}
                variant="outline"
                style={styles.button}
              />
              <RizonButton
                title="Yes, loving it"
                onPress={onLovingItPress}
                variant="primary"
                style={styles.button}
              />
            </View>
          </View>
        </View>
      )}
      {sheetState === 1 && <FeedbackSheet onClose={handleClose} />}
      {sheetState === 2 && <ReviewSheet onClose={handleClose} />}
    </RizonBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 24,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    backgroundColor: "#FFFF13",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 60,
    height: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "400",
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 16,
    color: "#868AA5",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  buttonsContainer: {
    width: "100%",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 100,
  },
});
