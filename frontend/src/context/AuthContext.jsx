import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client.js";

const AuthContext = createContext(null);
const TOKEN_KEY = "family-calendar-token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [pendingUser, setPendingUser] = useState(null);
  const [welcome, setWelcome] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest("/auth/me", { token });
        if (!cancelled) {
          setUser(data.user);
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMe();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      pendingUser,
      welcome,
      loading,
      isAuthenticated: Boolean(token && user),
      isApproved: user?.status === "APPROVED",
      isSuperAdmin: Boolean(user?.isSuperAdmin && user?.status === "APPROVED"),
      isFamilyAdmin: Boolean(user?.isFamilyAdmin && user?.status === "APPROVED"),
      isAdmin: Boolean(user?.isManager && user?.status === "APPROVED"),
      async login(loginId, password) {
        try {
          const data = await apiRequest("/auth/login", {
            method: "POST",
            body: { loginId, password },
          });
          localStorage.setItem(TOKEN_KEY, data.token);
          setToken(data.token);
          setUser(data.user);
          setPendingUser(null);
          const coverUrl = data.user?.familyBackgroundUrl || data.user?.clanBackgroundUrl;
          if (coverUrl) {
            setWelcome({
              url: coverUrl,
              name: data.user.familyBackgroundUrl ? data.user.familyName : data.user.clanName || "우리가족",
            });
          }
          return { ok: true, user: data.user };
        } catch (error) {
          if (error.status === 403 && error.data?.status === "PENDING") {
            setPendingUser(error.data.user || { loginId, status: "PENDING" });
            return { ok: false, pending: true, message: error.message };
          }
          throw error;
        }
      },
      async register(payload) {
        return apiRequest("/auth/register", {
          method: "POST",
          body: payload,
        });
      },
      async refreshUser() {
        if (!token) {
          return null;
        }
        const data = await apiRequest("/auth/me", { token });
        setUser(data.user);
        return data.user;
      },
      dismissWelcome() {
        setWelcome(null);
      },
      logout() {
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        setPendingUser(null);
        setWelcome(null);
      },
    }),
    [token, user, pendingUser, welcome, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있습니다.");
  }
  return context;
}
