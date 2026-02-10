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
  async sendAuthLink(
    email: string,
  ): Promise<{ success: boolean; error?: string }> {
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

      return { success: true };
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
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || "Invalid token" };
      }

      const data = await response.json();

      // Save session token securely
      if (data.session_token) {
        await this.saveSessionToken(data.session_token);
      }

      return {
        success: true,
        user: data.user,
        sessionToken: data.session_token,
        isNewUser: data.is_new_user,
      };
    } catch (error) {
      console.error("[AUTH] Error verifying auth link:", error);
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
      console.log("[AUTH] Session cleared");
    } catch (error) {
      console.error("[AUTH] Error clearing session:", error);
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
