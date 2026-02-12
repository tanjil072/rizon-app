import { AuthService, AuthState } from "@/services/auth.service";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type AuthContextType = AuthState & {
  sendAuthLink: (
    email: string,
  ) => Promise<{ success: boolean; token?: string; link?: string }>;
  verifyAuthLink: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  debugToken: string | null;
  debugLink: string | null;
  linkSentSuccessfully: boolean;
  clearDebugInfo: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    sessionToken: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const [debugToken, setDebugToken] = useState<string | null>(null);
  const [debugLink, setDebugLink] = useState<string | null>(null);
  const [linkSentSuccessfully, setLinkSentSuccessfully] = useState(false);

  const initializationRef = useRef(false);

  const checkAuthStatus = async () => {
    try {
      const token = await AuthService.getSessionToken();
      if (token) {
        console.log("[AUTH_CONTEXT] Found session token, fetching user...");
        // Try to fetch user data from backend
        let user = await AuthService.getUserFromSession(token);

        // If backend fetch fails, try to use cached user data
        if (!user) {
          console.log(
            "[AUTH_CONTEXT] Backend fetch failed, trying cached user data",
          );
          user = await AuthService.getUserData();
        }

        setAuthState((prev) => ({
          ...prev,
          user: user || null,
          sessionToken: token,
          isAuthenticated: true,
          isLoading: false,
        }));
      } else {
        setAuthState((prev) => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error("[AUTH_CONTEXT] Error checking auth status:", error);
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Failed to check authentication status",
      }));
    }
  };

  useEffect(() => {
    if (!initializationRef.current) {
      initializationRef.current = true;
      checkAuthStatus();
    }
  }, []);

  const sendAuthLink = async (
    email: string,
  ): Promise<{ success: boolean; token?: string; link?: string }> => {
    // setAuthState((prev) => ({ ...prev, error: null, isLoading: true }));

    try {
      const result = await AuthService.sendAuthLink(email);
      if (!result.success) {
        setAuthState((prev) => ({
          ...prev,
          error: result.error || "Failed to send auth link",
          isLoading: false,
        }));
        return { success: false };
      }

      // Store debug info globally
      if (result.token) {
        console.log(
          "[AUTH_CONTEXT] 🟢 Setting global debugToken:",
          result.token,
        );
        setDebugToken(result.token);
        setDebugLink(result.link || null);
      }

      console.log("[AUTH_CONTEXT] 🟢 Setting linkSentSuccessfully to true");
      setLinkSentSuccessfully(true);

      setAuthState((prev) => ({ ...prev, isLoading: false }));
      return { success: true, token: result.token, link: result.link };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      setAuthState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      return { success: false };
    }
  };

  const verifyAuthLink = async (token: string): Promise<boolean> => {
    setAuthState((prev) => ({ ...prev, error: null, isLoading: true }));
    try {
      console.log("[AUTH_CONTEXT] Verifying token with backend...");
      const result = await AuthService.verifyAuthLink(token);
      console.log("[AUTH_CONTEXT] Backend response:", result);

      if (!result.success) {
        const errorMsg = result.error || "Failed to verify token";
        console.error("[AUTH_CONTEXT] Verification failed:", errorMsg);
        setAuthState((prev) => ({
          ...prev,
          error: errorMsg,
          isLoading: false,
        }));
        return false;
      }

      console.log("[AUTH_CONTEXT] Verification successful!");
      setAuthState((prev) => ({
        ...prev,
        user: result.user || null,
        sessionToken: result.sessionToken || null,
        isAuthenticated: !!result.sessionToken,
        isLoading: false,
      }));

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      console.error(
        "[AUTH_CONTEXT] Exception during verification:",
        errorMessage,
      );
      setAuthState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      return false;
    }
  };

  const logout = async () => {
    try {
      await AuthService.clearSession();
      setAuthState({
        user: null,
        sessionToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      setDebugToken(null);
      setDebugLink(null);
    } catch (error) {
      console.error("[AUTH_CONTEXT] Error during logout:", error);
    }
  };

  const clearDebugInfo = () => {
    console.log("[AUTH_CONTEXT] Clearing debug info");
    setDebugToken(null);
    setDebugLink(null);
    setLinkSentSuccessfully(false);
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        sendAuthLink,
        verifyAuthLink,
        logout,
        checkAuthStatus,
        debugToken,
        debugLink,
        linkSentSuccessfully,
        clearDebugInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
