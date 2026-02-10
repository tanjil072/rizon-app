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
  const [verifyToken, setVerifyToken] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const router = useRouter();
  const {
    sendAuthLink,
    verifyAuthLink,
    debugToken,
    linkSentSuccessfully,
    clearDebugInfo,
  } = useAuth();

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
      await sendAuthLink(email);
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async () => {
    if (!verifyToken.trim()) {
      setError("Please enter a token");
      return;
    }

    setVerifyLoading(true);
    setError("");
    try {
      const success = await verifyAuthLink(verifyToken);
      if (success) {
        // Auth context will handle navigation
        router.replace("/(tabs)");
      } else {
        setError("Invalid token. Please try again.");
      }
    } catch (err) {
      setError("Failed to verify token. Please try again.");
      console.error(err);
    } finally {
      setVerifyLoading(false);
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
            {linkSentSuccessfully
              ? "Check your email for the login link"
              : "Enter your email to get started"}
          </Text>

          {!linkSentSuccessfully ? (
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

              {debugToken ? (
                <View style={styles.debugContainer}>
                  <Text style={styles.debugTitle}>
                    🔧 Development Mode - TOKEN AVAILABLE
                  </Text>
                  <Text style={styles.debugLabel}>
                    Token (check console for link):
                  </Text>
                  <Text style={styles.debugToken} selectable>
                    {debugToken}
                  </Text>
                  <Text style={styles.debugHint}>
                    Copy and paste token below to verify:
                  </Text>
                </View>
              ) : (
                <View style={styles.debugContainer}>
                  <Text style={styles.debugTitle}>
                    🔧 Development Mode - NO TOKEN
                  </Text>
                  <Text style={styles.debugWarning}>
                    No token received from backend. Check your console logs or
                    backend response.
                  </Text>
                  <Text style={styles.debugHint}>
                    If you have a token from backend logs, paste it below:
                  </Text>
                </View>
              )}

              <View style={styles.tokenInputContainer}>
                <RizonInput
                  label="Test Token (Development)"
                  placeholder="Paste token here"
                  value={verifyToken}
                  onChangeText={(text) => {
                    setVerifyToken(text);
                    if (error) setError("");
                  }}
                  autoCapitalize="none"
                  editable={!verifyLoading}
                  error={error}
                  multiline
                />
                <RizonButton
                  title={verifyLoading ? "Verifying..." : "Verify Token"}
                  onPress={handleVerifyToken}
                  variant="primary"
                  loading={verifyLoading}
                  disabled={verifyLoading || !verifyToken.trim()}
                  style={styles.verifyButton}
                />
              </View>

              <RizonButton
                title="Didn't receive email? Try again"
                onPress={() => {
                  setEmail("");
                  setVerifyToken("");
                  setError("");
                  clearDebugInfo();
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
  debugContainer: {
    backgroundColor: "#0ea5e9",
    borderWidth: 3,
    borderColor: "#0369a1",
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  debugLabel: {
    fontSize: 13,
    color: "#fff",
    marginBottom: 4,
    fontWeight: "600",
  },
  debugToken: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#000",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 4,
    marginBottom: 8,
    fontWeight: "600",
  },
  debugHint: {
    fontSize: 12,
    color: "#fff",
    fontStyle: "italic",
  },
  debugWarning: {
    fontSize: 13,
    color: "#fff",
    marginBottom: 8,
    fontWeight: "600",
  },
  tokenInputContainer: {
    marginVertical: 16,
  },
  verifyButton: {
    marginTop: 12,
  },
});
