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

// Constants for storage keys
const STORAGE_KEYS = {
  USER_ID: 'user_id',
  TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  SESSION_EXPIRY: 'session_expiry'
} as const;

// Session duration (24 hours)
const SESSION_DURATION = 24 * 60 * 60 * 1000;

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Validate token and session
  const validateSession = (): boolean => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN) || Cookies.get(STORAGE_KEYS.TOKEN);
      const sessionExpiry = localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY) || Cookies.get(STORAGE_KEYS.SESSION_EXPIRY);
      
      if (!token) {
        console.log("❌ No token found");
        return false;
      }

      if (sessionExpiry && Date.now() > parseInt(sessionExpiry)) {
        console.log("❌ Session expired");
        clearAuthData();
        return false;
      }

      return true;
    } catch (error) {
      console.error("❌ Error validating session:", error);
      return false;
    }
  };

  // Clear all authentication data
  const clearAuthData = () => {
    console.log("🧹 Clearing authentication data");
    
    // Clear localStorage
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Clear cookies
    Object.values(STORAGE_KEYS).forEach(key => {
      Cookies.remove(key);
    });
    
    // Clear state
    setUser(null);
    setIsAuthenticated(false);
  };

  // Initialize user session
  const initializeSession = async () => {
    try {
      setIsLoading(true);
      console.log("🚀 Initializing user session...");

      // Check if we have valid session
      if (!validateSession()) {
        console.log("❌ No valid session found");
        setIsLoading(false);
        return;
      }

      // Get stored user data from localStorage or cookies
      const storedUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA) || Cookies.get(STORAGE_KEYS.USER_DATA);
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID) || Cookies.get(STORAGE_KEYS.USER_ID);

      if (storedUserData && userId) {
        try {
          const userData = JSON.parse(storedUserData);
          console.log("✅ Found stored user data:", userData);
          
          // Set user immediately for better UX
          setUser(userData);
          setIsAuthenticated(true);
          
          // Verify with server in background
          verifyWithServer();
        } catch (error) {
          console.error("❌ Error parsing stored user data:", error);
          clearAuthData();
        }
      } else {
        console.log("❌ No stored user data found");
        clearAuthData();
      }
    } catch (error) {
      console.error("❌ Error initializing session:", error);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  // Verify user with server
  const verifyWithServer = async () => {
    try {
      console.log("🔍 Verifying user with server...");
      const userData = await getLoggedInUser();
      
      if (userData && userData.data) {
        console.log("✅ Server verification successful:", userData.data);
        
        // Update stored data in both localStorage and cookies
        const user = userData.data;
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        Cookies.set(STORAGE_KEYS.USER_DATA, JSON.stringify(user), { expires: 1 });
        setUser(user);
        setIsAuthenticated(true);
      } else {
        console.log("❌ Server verification failed");
        clearAuthData();
      }
    } catch (error) {
      console.error("❌ Error verifying with server:", error);
      // Don't clear data on network errors, keep local session
    }
  };

  // Login function
  const login = (userData: User, token: string) => {
    try {
      console.log("🔐 Logging in user:", userData);
      
      // Calculate session expiry
      const sessionExpiry = Date.now() + SESSION_DURATION;
      
      // Store authentication data
      localStorage.setItem(STORAGE_KEYS.USER_ID, userData.id.toString());
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      localStorage.setItem(STORAGE_KEYS.SESSION_EXPIRY, sessionExpiry.toString());
      
      // Store in cookies for cross-tab access
      Cookies.set(STORAGE_KEYS.USER_ID, userData.id.toString(), { expires: 1 });
      Cookies.set(STORAGE_KEYS.TOKEN, token, { expires: 1 });
      Cookies.set(STORAGE_KEYS.SESSION_EXPIRY, sessionExpiry.toString(), { expires: 1 });
      
      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      
      console.log("✅ Login successful");
      console.log("✅ Session expires:", new Date(sessionExpiry).toLocaleString());
      
      // Broadcast login event to other tabs
      window.dispatchEvent(new CustomEvent('userLogin', { detail: userData }));
      
      // Dispatch login event for favorites sync
      window.dispatchEvent(new CustomEvent('user-login'));
      
    } catch (error) {
      console.error("❌ Login error:", error);
      clearAuthData();
    }
  };

  // Logout function
  const logout = () => {
    console.log("🚪 Logging out user");
    
    // Clear all data
    clearAuthData();
    
    // Broadcast logout event to other tabs
    window.dispatchEvent(new CustomEvent('userLogout'));
    
    // Dispatch logout event for favorites sync
    window.dispatchEvent(new CustomEvent('user-logout'));
    
    // Force page reload to ensure clean state
    window.location.reload();
  };

  // Refresh user data
  const refreshUser = async () => {
    await verifyWithServer();
  };

  // Initialize on mount
  useEffect(() => {
    initializeSession();
  }, []);

  // Listen for cross-tab events
  useEffect(() => {
    const handleUserLogin = (event: CustomEvent) => {
      console.log("🔄 Received login event from another tab");
      const userData = event.detail;
      setUser(userData);
      setIsAuthenticated(true);
    };

    const handleUserLogout = () => {
      console.log("🔄 Received logout event from another tab");
      clearAuthData();
    };

    // Listen for storage changes (cross-tab synchronization)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.TOKEN || event.key === STORAGE_KEYS.USER_DATA) {
        console.log("🔄 Storage change detected, reinitializing session");
        initializeSession();
      }
    };

    // Listen for visibility change (tab focus)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log("🔄 Tab became visible, checking session");
        initializeSession();
      }
    };

    // Add event listeners
    window.addEventListener('userLogin', handleUserLogin as EventListener);
    window.addEventListener('userLogout', handleUserLogout);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      window.removeEventListener('userLogin', handleUserLogin as EventListener);
      window.removeEventListener('userLogout', handleUserLogout);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Periodic session validation
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated && !validateSession()) {
        console.log("⏰ Session expired during periodic check");
        clearAuthData();
      }
    }, 60000); // Check every minute

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
