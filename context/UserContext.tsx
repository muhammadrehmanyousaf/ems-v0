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
  // Subscription tier (§17.1). Flows in via verifyWithServer; absent =
  // treat as 'free'. Drives soft upgrade nudges (lib/entitlements.ts).
  subscriptionTier?: "free" | "pro" | "premium";
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
        /**
         * A valid token but no cached user is NOT a dead session — most often
         * it is a half-written one, and tearing it down here logs the vendor
         * out of every tab they have open.
         *
         * `login()` writes USER_ID, TOKEN, USER_DATA, SESSION_EXPIRY in that
         * order. Every other tab listens for a `storage` event on TOKEN and
         * re-initialises the moment it lands — one write BEFORE USER_DATA
         * exists. That tab read a token with no user, called clearAuthData(),
         * and wiped localStorage, which is shared. The tab that had just
         * signed in was signed straight back out, and the observed wreckage
         * was exactly this: token and user_id gone, user_data and the jti left
         * behind by whichever write landed after the wipe.
         *
         * A vendor with the dashboard open in two tabs hit this every time
         * they signed in. So: trust the token, and ask the server who it
         * belongs to. Only a genuinely bad token clears the session, via the
         * 401 path in verifyWithServer's caller.
         */
        if (validateSession()) {
          await verifyWithServer();
        } else {
          clearAuthData();
        }
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
      /**
       * Only a TOKEN change is a real auth event.
       *
       * USER_DATA was in this list too, and that created a cross-tab loop:
       * verifyWithServer() writes USER_DATA on every successful verify, a
       * `storage` event fires in every OTHER tab, that tab re-runs
       * initializeSession(), which sets isLoading(true) — blanking its header —
       * and then verifies and writes USER_DATA itself, bouncing the event back.
       *
       * With two tabs of the site open, the avatar could vanish under the
       * cursor mid-click for a routine profile refresh that changed nothing.
       *
       * A token appearing, changing or disappearing is a login, a refresh or a
       * logout, and those genuinely need the session rebuilt. A user-data write
       * is housekeeping — the `userLogin` event already covers the case where
       * another tab logs in.
       */
      if (event.key === STORAGE_KEYS.TOKEN) {
        // A token REMOVED elsewhere is a real logout — follow it immediately.
        // A token that just appeared is the middle of another tab's login,
        // whose remaining keys land microseconds later. Re-initialising on
        // that instant is what used to read a token with no user and wipe the
        // shared session. Let the write finish first; `userLogin` already
        // covers the same-document case with no delay.
        if (event.newValue == null) {
          clearAuthData();
          return;
        }
        setTimeout(() => initializeSession(), 50);
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
