import { RizonButton } from "@/components/ui/rizon-button";
import { RizonInput } from "@/components/ui/rizon-input";
import { useAuth } from "@/contexts/auth.context";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const router = useRouter();
  const { sendAuthLink } = useAuth();

  const handleSendLink = async () => {
    setError("");

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email");
      return;
    }

    setLoading(true);
    try {
      const success = await sendAuthLink(email);
      if (success) {
        setLinkSent(true);
      } else {
        setError("Failed to send auth link. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to Rizon</Text>
          <Text style={styles.subtitle}>
            {linkSent
              ? "Check your email for the login link"
              : "Enter your email to get started"}
          </Text>

          {!linkSent ? (
            <>
              <View style={styles.formContainer}>
                <RizonInput
                  label="Email"
                  placeholder="your@email.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError("");
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                  error={error}
                />
              </View>

              <RizonButton
                title={loading ? "Sending..." : "Send Login Link"}
                onPress={handleSendLink}
                variant="primary"
                loading={loading}
                disabled={loading || !email.trim()}
                style={styles.submitButton}
              />

              <Text style={styles.helpText}>
                We&apos;ll send you a secure link to log in. No password needed.
              </Text>
            </>
          ) : (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                A login link has been sent to {email}
              </Text>

              <Text style={styles.instructionText}>
                Click the link in your email to log in. The link will open the
                app automatically.
              </Text>

              <RizonButton
                title="Didn't receive email? Try again"
                onPress={() => {
                  setLinkSent(false);
                  setEmail("");
                }}
                variant="secondary"
                style={styles.tryAgainButton}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 32,
    lineHeight: 24,
  },
  formContainer: {
    marginBottom: 24,
  },
  submitButton: {
    marginBottom: 16,
  },
  helpText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
  successContainer: {
    paddingVertical: 24,
  },
  successText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 24,
  },
  tryAgainButton: {
    marginTop: 16,
  },
});
