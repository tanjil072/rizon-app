import { RizonButton } from "@/components/ui/rizon-button";
import { APP_STORE_ICON } from "@/constants/assets";
import { OnboardingService } from "@/services/onboarding.service";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

type ReviewSheetProps = {
  onClose: () => void;
};

export const ReviewSheet = ({ onClose }: ReviewSheetProps) => {
  const handleLeaveReview = () => {
    OnboardingService.openAppStore();
    // Close the sheet after opening the store
    setTimeout(() => {
      onClose();
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

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 16,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: "#E8F4FD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    overflow: "hidden",
  },
  icon: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: "400",
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#868AA5",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  reviewButton: {
    width: "100%",
  },
});
