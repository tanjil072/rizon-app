import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8080";

export type AuthUser = {
  id: string;
  email: string;
  createdAt: string;
};

export type AuthState = {
  user: AuthUser | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
};

class AuthServiceImpl {
  /**
   * Send auth link to email
   */
  async sendAuthLink(email: string): Promise<{
    success: boolean;
    error?: string;
    token?: string;
    link?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || "Failed to send auth link",
        };
      }

      // In development, log the response
      const data = await response.json();
      console.log("[AUTH] Auth link response:", data);

      // Return token and link for development/testing
      return {
        success: true,
        token: data.token,
        link: data.link,
      };
    } catch (error) {
      console.error("[AUTH] Error sending auth link:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  }

  /**
   * Verify auth link token and get session
   */
  async verifyAuthLink(token: string): Promise<{
    success: boolean;
    user?: AuthUser;
    sessionToken?: string;
    isNewUser?: boolean;
    error?: string;
  }> {
    try {
      console.log(
        "[AUTH_SERVICE] Sending verification request to:",
        `${API_BASE_URL}/api/auth/verify`,
      );
      console.log("[AUTH_SERVICE] Token:", token);

      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      console.log("[AUTH_SERVICE] Response status:", response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error("[AUTH_SERVICE] Verification failed:", error);
        return { success: false, error: error.message || "Invalid token" };
      }

      const data = await response.json();
      console.log("[AUTH_SERVICE] Verification successful:", data);

      // Save session token securely
      if (data.session_token) {
        await this.saveSessionToken(data.session_token);
      }

      // Save user data
      if (data.user) {
        await this.saveUserData(data.user);
      }

      // Save isNewUser flag
      if (data.is_new_user !== undefined) {
        await this.saveIsNewUserFlag(data.is_new_user);
      }

      return {
        success: true,
        user: data.user,
        sessionToken: data.session_token,
        isNewUser: data.is_new_user,
      };
    } catch (error) {
      console.error("[AUTH_SERVICE] Error verifying auth link:", error);
      return { success: false, error: "Failed to verify token" };
    }
  }

  /**
   * Save session token to secure storage
   */
  async saveSessionToken(token: string): Promise<void> {
    try {
      // Try to save to secure store first (native)
      try {
        await SecureStore.setItemAsync("sessionToken", token);
        console.log("[AUTH] Session token saved to secure store");
      } catch {
        // Fallback to AsyncStorage for web/development
        await AsyncStorage.setItem("sessionToken", token);
        console.log("[AUTH] Session token saved to AsyncStorage");
      }
    } catch (error) {
      console.error("[AUTH] Error saving session token:", error);
    }
  }

  /**
   * Get saved session token
   */
  async getSessionToken(): Promise<string | null> {
    try {
      // Try secure store first
      try {
        const token = await SecureStore.getItemAsync("sessionToken");
        if (token) {
          console.log("[AUTH] Session token retrieved from secure store");
          return token;
        }
      } catch {
        // Fallback to AsyncStorage
        const token = await AsyncStorage.getItem("sessionToken");
        if (token) {
          console.log("[AUTH] Session token retrieved from AsyncStorage");
          return token;
        }
      }
      return null;
    } catch (error) {
      console.error("[AUTH] Error retrieving session token:", error);
      return null;
    }
  }

  /**
   * Clear session
   */
  async clearSession(): Promise<void> {
    try {
      try {
        await SecureStore.deleteItemAsync("sessionToken");
      } catch {
        await AsyncStorage.removeItem("sessionToken");
      }
      await AsyncStorage.removeItem("userData");
      await AsyncStorage.removeItem("isNewUser");
      await AsyncStorage.removeItem("hasSeenInitialOnboarding");
      await AsyncStorage.removeItem("onboardingTriggered");
      console.log("[AUTH] Session cleared");
    } catch (error) {
      console.error("[AUTH] Error clearing session:", error);
    }
  }

  /**
   * Save user data alongside session token
   */
  async saveUserData(user: AuthUser): Promise<void> {
    try {
      await AsyncStorage.setItem("userData", JSON.stringify(user));
      console.log("[AUTH] User data saved", user.email);
    } catch (error) {
      console.error("[AUTH] Error saving user data:", error);
    }
  }

  /**
   * Save isNewUser flag from auth verification
   */
  async saveIsNewUserFlag(isNewUser: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem("isNewUser", isNewUser.toString());
      console.log("[AUTH] New user flag saved:", isNewUser);
    } catch (error) {
      console.error("[AUTH] Error saving isNewUser flag:", error);
    }
  }

  /**
   * Get isNewUser flag
   */
  async getIsNewUserFlag(): Promise<boolean | null> {
    try {
      const flag = await AsyncStorage.getItem("isNewUser");
      if (flag !== null) {
        console.log("[AUTH] New user flag retrieved:", flag);
        return flag === "true";
      }
      return null;
    } catch (error) {
      console.error("[AUTH] Error getting isNewUser flag:", error);
      return null;
    }
  }

  /**
   * Get saved user data
   */
  async getUserData(): Promise<AuthUser | null> {
    try {
      const userData = await AsyncStorage.getItem("userData");
      if (userData) {
        console.log("[AUTH] User data retrieved from storage");
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error("[AUTH] Error getting user data:", error);
      return null;
    }
  }

  /**
   * Get user from session token
   */
  async getUserFromSession(sessionToken: string): Promise<AuthUser | null> {
    try {
      if (!sessionToken) {
        console.error("[AUTH_SERVICE] No session token provided");
        return null;
      }

      console.log(
        "[AUTH_SERVICE] Fetching user from session with token:",
        sessionToken?.substring(0, 10) + "...",
      );
      console.log("[AUTH_SERVICE] API URL:", API_BASE_URL);

      const url = `${API_BASE_URL}/api/auth/me`;
      console.log("[AUTH_SERVICE] Request URL:", url);

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("[AUTH_SERVICE] API Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          "[AUTH_SERVICE] Failed to fetch user:",
          response.status,
          errorText,
        );
        return null;
      }

      const data = await response.json();
      console.log(
        "[AUTH_SERVICE] Full response:",
        JSON.stringify(data, null, 2),
      );
      console.log("[AUTH_SERVICE] User data:", data.user);

      return data.user || null;
    } catch (error) {
      if (error instanceof TypeError) {
        const message = (error as any).message || "";
        if (message.includes("Network request failed")) {
          console.error("[AUTH_SERVICE] Network connection failed:", {
            message: error.message,
            apiUrl: API_BASE_URL,
            suggestion: "Check if backend is running and IP address is correct",
          });
        } else if (message.includes("Aborted")) {
          console.error("[AUTH_SERVICE] Request timeout (10s):", API_BASE_URL);
        } else {
          console.error("[AUTH_SERVICE] Network error:", {
            message: error.message,
            cause: (error as any).cause,
            stack: error.stack,
          });
        }
      } else if (error instanceof Error) {
        console.error("[AUTH_SERVICE] Error fetching user from session:", {
          message: error.message,
          stack: error.stack,
        });
      } else {
        console.error("[AUTH_SERVICE] Unknown error fetching user:", error);
      }
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.getSessionToken();
    return !!token;
  }
}

export const AuthService = new AuthServiceImpl();
