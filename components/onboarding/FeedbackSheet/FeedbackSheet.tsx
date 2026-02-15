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
  const { completeOnboarding } = useOnboarding();

  const handleSendFeedback = async () => {
    // Prevent double submission
    if (isSubmittingRef.current) {
      console.log("[FEEDBACK] Submission already in progress");
      return;
    }

    if (!feedback.trim()) {
      setError("Please enter your feedback");
      return;
    }

    setError("");
    setLoading(true);
    isSubmittingRef.current = true;

    try {
      console.log("[FEEDBACK] Submitting feedback...");

      const success = await OnboardingService.submitFeedback({
        feedback: feedback.trim(),
      });

      if (success) {
        console.log("[FEEDBACK] Feedback submitted successfully");

        // Mark onboarding as completed on backend
        await completeOnboarding();

        // Clear feedback and close sheet after a short delay
        setFeedback("");
        setLoading(false);
        isSubmittingRef.current = false;

        // Wait a bit before closing to show success
        setTimeout(() => {
          onClose();
        }, 300);
      } else {
        console.error("[FEEDBACK] Feedback submission failed");
        setError("Failed to send feedback. Please try again.");
        setLoading(false);
        isSubmittingRef.current = false;
      }
    } catch (error) {
      console.error("[FEEDBACK] Error:", error);
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
        title={loading ? "Sending..." : "Send feedback"}
        onPress={handleSendFeedback}
        variant="primary"
        loading={loading}
        disabled={loading || !feedback.trim()}
        style={styles.sendButton}
      />
    </View>
  );
};
