"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { useUser } from "@/context/UserContext";

const ProtectLogin = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useUser();
  
  useEffect(() => {
    // Only redirect if we're not loading and user is authenticated
    if (!isLoading && isAuthenticated && pathname === "/login") {
      console.log("ProtectLogin: User is authenticated, redirecting from login page");
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, pathname, router]);
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show login form
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // If user is authenticated, don't render anything (will redirect)
  return null;
};

export default ProtectLogin;
