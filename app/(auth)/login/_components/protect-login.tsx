"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { useUser } from "@/context/UserContext";
import { safeRedirect } from "@/lib/auth/safe-redirect";
import { isOpsOnly } from "@/lib/ops/ops-role";

const ProtectLogin = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useUser();

  useEffect(() => {
    // Only redirect if we're not loading, session isn't marked expired, and user is authenticated
    if (!isLoading && isAuthenticated && pathname === "/login" && searchParams?.get("reason") !== "expired") {
      const explicit = safeRedirect(searchParams?.get("redirect"));
      if (explicit) {
        router.replace(explicit);
        return;
      }
      if (isOpsOnly(user)) {
        router.replace("/ops");
        return;
      }
      const isDashUser =
        user?.isVendor === true ||
        user?.isSuperAdmin === true ||
        user?.roles?.some(
          (role: any) =>
            role.id === 1 ||
            role.id === 2 ||
            role.name?.toLowerCase() === "super admin" ||
            role.name?.toLowerCase() === "vendor" ||
            role.name?.toLowerCase() === "admin"
        );
      router.replace(isDashUser ? "/dashboard" : "/");
    }
  }, [isAuthenticated, isLoading, pathname, searchParams, router, user]);
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bridal-gold-dark mx-auto"></div>
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
