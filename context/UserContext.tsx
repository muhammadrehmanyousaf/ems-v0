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
  profileImage?: string;
  isVendor?: boolean;
  vendorType?: string;
  isSuperAdmin?: boolean;
  roles: Array<{ id: number; name: string }>;
}

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER_ID: 'user_id',
  TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  SESSION_EXPIRY: 'session_expiry'
} as const;

const SESSION_DURATION = 24 * 60 * 60 * 1000;

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
          setUser(userData);
          setIsAuthenticated(true);
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
        const user = userData.data;
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        Cookies.set(STORAGE_KEYS.USER_DATA, JSON.stringify(user), { expires: 1 });
        setUser(user);
        setIsAuthenticated(true);
      } else {
        clearAuthData();
      }
    } catch {
      // Don't clear data on network errors, keep local session
    }
  };

  const login = (userData: User, token: string) => {
    try {
      const sessionExpiry = Date.now() + SESSION_DURATION;

      localStorage.setItem(STORAGE_KEYS.USER_ID, userData.id.toString());
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRY, sessionExpiry.toString());

      Cookies.set(STORAGE_KEYS.USER_ID, userData.id.toString(), { expires: 1 });
      Cookies.set(STORAGE_KEYS.TOKEN, token, { expires: 1 });
      Cookies.set(STORAGE_KEYS.SESSION_EXPIRY, sessionExpiry.toString(), { expires: 1 });

      setUser(userData);
      setIsAuthenticated(true);

      window.dispatchEvent(new CustomEvent('userLogin', { detail: userData }));
      window.dispatchEvent(new CustomEvent('user-login'));
    } catch {
      clearAuthData();
    }
  };

  const logout = () => {
    clearAuthData();
    window.dispatchEvent(new CustomEvent('userLogout'));
    window.dispatchEvent(new CustomEvent('user-logout'));
    window.location.reload();
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
      login,
      logout,
      refreshUser
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
