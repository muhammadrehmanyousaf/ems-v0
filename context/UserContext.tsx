"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getLoggedInUser } from "@/lib/authFunction";
import Cookies from "js-cookie";

interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phoneNumber?: string;
  phoneE164?: string;
  profileImage?: string;
  isVendor?: boolean;
  vendorType?: string;
  isSuperAdmin?: boolean;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  roles: Array<{ id: number; name: string }>;
}

// 01-VR-ENHANCE-V1-FE — soft flags returned by the new login response.
export interface AuthFlags {
  emailVerified: boolean;
  phoneVerified: boolean;
  twoFactorEnabled: boolean;
  reviewProfile: boolean;
}

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  flags: AuthFlags | null;
  jti: string | null;
  /**
   * `extras` is optional; new login flow passes `{ jti, flags }` from the
   * extended login response. Existing call sites that pass only `(user, token)`
   * keep working.
   */
  login: (userData: User, token: string, extras?: { jti?: string; flags?: AuthFlags }) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  /** Mutate the cached flags after an OTP verification succeeds. */
  setFlags: (patch: Partial<AuthFlags>) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER_ID: 'user_id',
  TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  SESSION_EXPIRY: 'session_expiry',
  // 01-VR-ENHANCE-V1-FE
  JTI: 'auth_jti',
  FLAGS: 'auth_flags',
} as const;

const SESSION_DURATION = 24 * 60 * 60 * 1000;

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [flags, setFlagsState] = useState<AuthFlags | null>(null);
  const [jti, setJti] = useState<string | null>(null);

  const validateSession = (): boolean => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || Cookies.get(STORAGE_KEYS.TOKEN);
      const sessionExpiry = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY) || Cookies.get(STORAGE_KEYS.SESSION_EXPIRY);

      if (!token) return false;

      if (sessionExpiry && Date.now() > parseInt(sessionExpiry)) {
        clearAuthData();
        return false;
      }

      return true;
    } catch {
      return false;
    }
  };

  const clearAuthData = () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    Object.values(STORAGE_KEYS).forEach(key => {
      Cookies.remove(key);
    });
    setUser(null);
    setIsAuthenticated(false);
    setFlagsState(null);
    setJti(null);
  };

  const initializeSession = async () => {
    try {
      setIsLoading(true);

      if (!validateSession()) {
        setIsLoading(false);
        return;
      }

      const storedUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA) || Cookies.get(STORAGE_KEYS.USER_DATA);
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID) || Cookies.get(STORAGE_KEYS.USER_ID);

      if (storedUserData && userId) {
        try {
          const userData = JSON.parse(storedUserData);
          // Always derive isSuperAdmin from roles so it survives serialization
          const isSuperAdmin = userData.roles?.some(
            (r: any) => r.name?.toLowerCase() === "super admin"
          ) ?? false;
          setUser({ ...userData, isSuperAdmin });
          setIsAuthenticated(true);

          // Restore jti + flags from storage if present.
          const storedJti = localStorage.getItem(STORAGE_KEYS.JTI) || Cookies.get(STORAGE_KEYS.JTI);
          if (storedJti) setJti(storedJti);
          const storedFlags = localStorage.getItem(STORAGE_KEYS.FLAGS);
          if (storedFlags) {
            try { setFlagsState(JSON.parse(storedFlags)); } catch { /* ignore */ }
          }

          verifyWithServer();
        } catch {
          clearAuthData();
        }
      } else {
        clearAuthData();
      }
    } catch {
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const verifyWithServer = async () => {
    try {
      const userData = await getLoggedInUser();

      if (userData && userData.data) {
        const freshUser = userData.data;

        // Preserve isSuperAdmin flag — the /users/:id endpoint returns the plain
        // DB user; it doesn't re-compute isSuperAdmin. Derive it from roles instead.
        const isSuperAdmin = freshUser.roles?.some(
          (r: any) => r.name?.toLowerCase() === "super admin"
        ) ?? false;
        const mergedUser = { ...freshUser, isSuperAdmin };

        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(mergedUser));
        Cookies.set(STORAGE_KEYS.USER_DATA, JSON.stringify(mergedUser), { expires: 1 });
        setUser(mergedUser);
        setIsAuthenticated(true);
      }
      // If server returns no data (non-auth error like 400/404/500), keep the
      // local session intact — only the axios 401 interceptor should clear auth.
    } catch {
      // Network error or non-401 response — keep local session, don't log out
    }
  };

  const login = (
    userData: User,
    token: string,
    extras?: { jti?: string; flags?: AuthFlags }
  ) => {
    try {
      const sessionExpiry = Date.now() + SESSION_DURATION;

      // Derive isSuperAdmin from roles consistently so it persists correctly
      const isSuperAdmin = userData.roles?.some(
        (r: any) => r.name?.toLowerCase() === "super admin"
      ) ?? false;
      const userToStore = { ...userData, isSuperAdmin };

      localStorage.setItem(STORAGE_KEYS.USER_ID, userToStore.id.toString());
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userToStore));
      localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRY, sessionExpiry.toString());

      Cookies.set(STORAGE_KEYS.USER_ID, userToStore.id.toString(), { expires: 1 });
      Cookies.set(STORAGE_KEYS.TOKEN, token, { expires: 1 });
      Cookies.set(STORAGE_KEYS.SESSION_EXPIRY, sessionExpiry.toString(), { expires: 1 });

      // 01-VR-ENHANCE-V1-FE: persist jti + flags so the dashboard can render
      // verification banners pre-paint without an extra API call.
      if (extras?.jti) {
        localStorage.setItem(STORAGE_KEYS.JTI, extras.jti);
        Cookies.set(STORAGE_KEYS.JTI, extras.jti, { expires: 1 });
        setJti(extras.jti);
      }
      if (extras?.flags) {
        localStorage.setItem(STORAGE_KEYS.FLAGS, JSON.stringify(extras.flags));
        setFlagsState(extras.flags);
      }

      setUser(userToStore);
      setIsAuthenticated(true);

      window.dispatchEvent(new CustomEvent('userLogin', { detail: userToStore }));
      window.dispatchEvent(new CustomEvent('user-login'));
    } catch {
      clearAuthData();
    }
  };

  const setFlags = (patch: Partial<AuthFlags>) => {
    setFlagsState((prev) => {
      const next: AuthFlags = {
        emailVerified: false,
        phoneVerified: false,
        twoFactorEnabled: false,
        reviewProfile: true,
        ...(prev || {}),
        ...patch,
      };
      try {
        localStorage.setItem(STORAGE_KEYS.FLAGS, JSON.stringify(next));
      } catch {/* ignore */}
      return next;
    });
  };

  const logout = () => {
    clearAuthData();
    window.dispatchEvent(new CustomEvent('userLogout'));
    window.dispatchEvent(new CustomEvent('user-logout'));
    window.location.href = "/";
  };

  const refreshUser = async () => {
    await verifyWithServer();
  };

  useEffect(() => {
    initializeSession();
  }, []);

  useEffect(() => {
    const handleUserLogin = (event: CustomEvent) => {
      const userData = event.detail;
      setUser(userData);
      setIsAuthenticated(true);
    };

    const handleUserLogout = () => {
      clearAuthData();
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.TOKEN || event.key === STORAGE_KEYS.USER_DATA) {
        initializeSession();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Only re-validate session, don't refetch from server
        if (isAuthenticated && !validateSession()) {
          clearAuthData();
        }
      }
    };

    window.addEventListener('userLogin', handleUserLogin as EventListener);
    window.addEventListener('userLogout', handleUserLogout);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('userLogin', handleUserLogin as EventListener);
      window.removeEventListener('userLogout', handleUserLogout);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated]);

  // Periodic session validation
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated && !validateSession()) {
        clearAuthData();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <UserContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      flags,
      jti,
      login,
      logout,
      refreshUser,
      setFlags,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
