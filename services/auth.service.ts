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
   * Get all authentication-related data from backend and storage
   */
  async getAllAuthData(): Promise<{
    user: AuthUser | null;
    sessionToken: string | null;
    isNewUser: boolean | null;
    hasSeenInitialOnboarding: boolean | null;
    error?: string;
  }> {
    try {
      const sessionToken = await this.getSessionToken();
      let user: AuthUser | null = null;
      let error: string | undefined = undefined;
      if (sessionToken) {
        user = await this.getUserFromSession(sessionToken);
        if (!user) {
          error = "Failed to fetch user from backend.";
        }
      }
      const isNewUser = await this.getIsNewUserFlag();
      let hasSeenInitialOnboarding: boolean | null = null;
      try {
        const onboardingFlag = await AsyncStorage.getItem(
          "hasSeenInitialOnboarding",
        );
        if (onboardingFlag !== null) {
          hasSeenInitialOnboarding = onboardingFlag === "true";
        }
      } catch (e) {
        // ignore onboarding flag error
      }
      return {
        user,
        sessionToken,
        isNewUser,
        hasSeenInitialOnboarding,
        ...(error ? { error } : {}),
      };
    } catch (e) {
      return {
        user: null,
        sessionToken: null,
        isNewUser: null,
        hasSeenInitialOnboarding: null,
        error: "Failed to get all auth data.",
      };
    }
  }
  /**
   * Save session token to secure storage
   */
  async saveSessionToken(token: string): Promise<void> {
    try {
      console.log("[AUTH] Saving session token...");

      // Primary: Save to AsyncStorage (most reliable for dev)
      try {
        await AsyncStorage.setItem("sessionToken", token);
        console.log("[AUTH] ✅ Session token saved to AsyncStorage");
      } catch (error) {
        console.error("[AUTH] Failed to save to AsyncStorage:", error);
        throw error;
      }

      // Secondary: also try SecureStore (for production)
      try {
        await SecureStore.setItemAsync("sessionToken", token);
        console.log("[AUTH] ✅ Session token also saved to SecureStore");
      } catch (error) {
        console.warn(
          "[AUTH] SecureStore save failed (expected in dev), but AsyncStorage succeeded",
        );
      }
    } catch (error) {
      console.error("[AUTH] Critical: Failed to save session token:", error);
      throw error;
    }
  }

  /**
   * Get saved session token
   */
  async getSessionToken(): Promise<string | null> {
    try {
      console.log("[AUTH] Attempting to retrieve session token...");

      // Primary: try AsyncStorage (most reliable for dev)
      const asyncToken = await AsyncStorage.getItem("sessionToken");
      if (asyncToken) {
        console.log("[AUTH] ✅ Session token retrieved from AsyncStorage");
        return asyncToken;
      }

      // Fallback: try SecureStore
      try {
        const secureToken = await SecureStore.getItemAsync("sessionToken");
        if (secureToken) {
          console.log("[AUTH] ✅ Session token retrieved from SecureStore");
          // Copy to AsyncStorage for future reliability
          await AsyncStorage.setItem("sessionToken", secureToken);
          return secureToken;
        }
      } catch (e) {
        console.log("[AUTH] SecureStore retrieval failed (expected in dev)");
      }

      console.log("[AUTH] ❌ No session token found in any storage");
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
      console.log("[AUTH] Clearing all session data...");

      // Clear from both storages
      try {
        await AsyncStorage.removeItem("sessionToken");
        console.log("[AUTH] Cleared sessionToken from AsyncStorage");
      } catch (e) {
        console.warn("[AUTH] Failed to clear from AsyncStorage:", e);
      }

      try {
        await SecureStore.deleteItemAsync("sessionToken");
        console.log("[AUTH] Cleared sessionToken from SecureStore");
      } catch (e) {
        console.warn("[AUTH] Failed to clear from SecureStore:", e);
      }

      // Clear all other auth data
      const keysToRemove = [
        "userData",
        "isNewUser",
        "hasSeenInitialOnboarding",
        "onboardingTriggered",
      ];

      for (const key of keysToRemove) {
        try {
          await AsyncStorage.removeItem(key);
        } catch (e) {
          console.warn(`[AUTH] Failed to clear ${key}:`, e);
        }
      }

      console.log("[AUTH] ✅ Session fully cleared");
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
