import { RizonButton } from "@/components/ui/rizon-button";
import { useAuth } from "@/contexts/auth.context";
import { useOnboarding } from "@/contexts/onboarding.context";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const OnboardingTestScreen = () => {
  const { setShowInitialSheet, onboardingStatus } = useOnboarding();
  const { logout, user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  // Show onboarding status for debugging/demo
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Rizon App</Text>
          {user && (
            <Text style={styles.userEmail}>Logged in as: {user.email}</Text>
          )}
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <RizonButton
            title="Logout"
            onPress={handleLogout}
            variant="secondary"
          />
        </View>

        {/* Onboarding Status */}
        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>Current Onboarding Status:</Text>
          <Text style={styles.statusText}>
            {onboardingStatus
              ? `isNewUser: ${onboardingStatus.isNewUser}\n` +
                `hasSeenInitialOnboarding: ${onboardingStatus.hasSeenInitialOnboarding}\n`
              : "No status loaded yet."}
          </Text>
        </View>

        {/* Test Buttons */}
        <View style={styles.section}>
          <View style={styles.buttonContainer}>
            <RizonButton
              title="Show Initial Sheet (Test)"
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default OnboardingTestScreen;

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  logoutSection: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  statusBox: {
    backgroundColor: "#f0f4ff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  statusTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 6,
    color: "#003366",
  },
  statusText: {
    fontSize: 15,
    color: "#003366",
  },
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
