import { RizonButton } from "@/components/ui/rizon-button";
import { RizonInput } from "@/components/ui/rizon-input";
import { useOnboarding } from "@/contexts/onboarding.context";
import { OnboardingService } from "@/services/onboarding.service";
import React, { useRef, useState } from "react";
import { Text, View } from "react-native";
import { styles } from "./styles";

type FeedbackSheetProps = {
  onClose: () => void;
};

export const FeedbackSheet = ({ onClose }: FeedbackSheetProps) => {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isSubmittingRef = useRef(false);
  const { setOnboardingStatus } = useOnboarding();

  const handleSendFeedback = async () => {
    if (isSubmittingRef.current) return;
    if (!feedback.trim()) {
      setError("Please enter your feedback");
      return;
    }
    setError("");
    setLoading(true);
    isSubmittingRef.current = true;
    try {
      const success = await OnboardingService.submitFeedback({
        feedback: feedback.trim(),
      });
      if (success) {
        setOnboardingStatus({
          isNewUser: false,
          hasSeenInitialOnboarding: true,
          onboardingCompletedAt: new Date().toISOString(),
        });
        setFeedback("");
        setLoading(false);
        isSubmittingRef.current = false;
        onClose();
      } else {
        setError("Failed to send feedback. Please try again.");
        setLoading(false);
        isSubmittingRef.current = false;
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Help us improve Rizon</Text>
      <Text style={styles.subtitle}>
        Tell us what didn&apos;t feel right, we read every message
      </Text>
      <View style={styles.inputContainer}>
        <RizonInput
          placeholder="Type your feedback here"
          value={feedback}
          onChangeText={(text) => {
            setFeedback(text);
            if (error) setError("");
          }}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={styles.textArea}
          error={error}
          editable={!loading}
        />
      </View>
      <RizonButton
        title="Send feedback"
        onPress={handleSendFeedback}
        variant="primary"
        loading={loading}
        disabled={loading || !feedback.trim()}
        style={styles.sendButton}
      />
    </View>
  );
};
