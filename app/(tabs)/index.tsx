import { RizonButton } from "@/components/ui/rizon-button";
import { useOnboarding } from "@/contexts/onboarding.context";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const OnboardingTestScreen = () => {
  const { setShowInitialSheet, onboardingStatus } = useOnboarding();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Onboarding Test Screen</Text>

        <Text style={styles.description}>
          Use the buttons below to manually trigger each onboarding bottom sheet
          for testing purposes.
        </Text>

        {/* Onboarding Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Onboarding Status</Text>
          {onboardingStatus ? (
            <View style={styles.statusBox}>
              <Text style={styles.text}>
                Is New User: {onboardingStatus.isNewUser ? "Yes" : "No"}
              </Text>
              <Text style={styles.text}>
                Has Seen Initial Onboarding:{" "}
                {onboardingStatus.hasSeenInitialOnboarding ? "Yes" : "No"}
              </Text>
              {onboardingStatus.onboardingCompletedAt && (
                <Text style={styles.text}>
                  Completed At: {onboardingStatus.onboardingCompletedAt}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.text}>Loading status...</Text>
          )}
        </View>

        {/* Test Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Bottom Sheets</Text>

          <View style={styles.buttonContainer}>
            <RizonButton
              title="Show Initial Sheet"
              onPress={() => setShowInitialSheet(true)}
              variant="primary"
            />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Testing Instructions</Text>
          <View style={styles.instructionBox}>
            <Text style={styles.instruction}>
              1. Click &quot;Show Initial Sheet&quot; to test the first
              onboarding screen
            </Text>
            <Text style={styles.instruction}>
              2. In the Initial Sheet, click &quot;Not yet&quot; to see the
              Feedback Sheet
            </Text>
            <Text style={styles.instruction}>
              3. In the Initial Sheet, click &quot;Yes, loving it&quot; to see
              the Review Sheet
            </Text>
            <Text style={styles.instruction}>
              4. Test feedback submission with actual text
            </Text>
            <Text style={styles.instruction}>
              5. Test the &quot;Leave a review&quot; button (opens app store)
            </Text>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.noteBox}>
            <Text style={styles.note}>
              • The Initial Sheet cannot be dismissed by tapping the backdrop
            </Text>
            <Text style={styles.note}>
              • Feedback Sheet prevents race conditions during submission
            </Text>
            <Text style={styles.note}>
              • Review Sheet opens the appropriate app store based on platform
            </Text>
            <Text style={styles.note}>
              • In production, the Initial Sheet shows automatically after
              onboarding
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OnboardingTestScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 0,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#000",
  },
  description: {
    fontSize: 16,
    marginBottom: 32,
    lineHeight: 22,
    opacity: 0.8,
    color: "#000",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#000",
  },
  text: {
    fontSize: 16,
    color: "#000",
  },
  statusBox: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonContainer: {
    marginBottom: 12,
  },
  instructionBox: {
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  instruction: {
    lineHeight: 20,
  },
  noteBox: {
    backgroundColor: "rgba(255, 149, 0, 0.1)",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  note: {
    lineHeight: 20,
    fontSize: 14,
  },
});
