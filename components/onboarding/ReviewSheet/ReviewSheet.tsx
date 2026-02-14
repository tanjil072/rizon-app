import { RizonButton } from "@/components/ui/rizon-button";
import { APP_STORE_ICON } from "@/constants/assets";
import { useOnboarding } from "@/contexts/onboarding.context";
import { OnboardingService } from "@/services/onboarding.service";
import React from "react";
import { Image, Text, View } from "react-native";
import { styles } from "./styles";

type ReviewSheetProps = {
  onClose: () => void;
};

export const ReviewSheet = ({ onClose }: ReviewSheetProps) => {
  const { setOnboardingStatus } = useOnboarding();
  const handleLeaveReview = async () => {
    OnboardingService.openAppStore();
    setTimeout(async () => {
      await AsyncStorage.setItem("hasSeenInitialOnboarding", "true");
      await AsyncStorage.setItem("isNewUser", "false");
      onClose();
      setOnboardingStatus({
        isNewUser: false,
        hasSeenInitialOnboarding: true,
        onboardingCompletedAt: new Date().toISOString(),
      });
    }, 500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Image
          source={APP_STORE_ICON}
          style={styles.icon}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>Got a minute to help us grow?</Text>
      <Text style={styles.subtitle}>
        It takes less than a minute and helps us a lot
      </Text>
      <RizonButton
        title="Leave a review"
        onPress={handleLeaveReview}
        variant="primary"
        style={styles.reviewButton}
      />
    </View>
  );
};
