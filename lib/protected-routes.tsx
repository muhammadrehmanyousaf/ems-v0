"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useUser } from "@/context/UserContext";
import { clearAuthStorage, expiredLoginUrl } from "@/lib/auth/session";

const ProtectedRoutes = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, isLoading } = useUser();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoading) return;

    const token = localStorage.getItem("auth_token") || Cookies.get("auth_token");
    const userData = localStorage.getItem("user_data") || Cookies.get("user_data");

    if (!token || !userData || !isAuthenticated || !user) {
      setIsAuthorized(false);
      // WP34 (SETUP-035): the auth COOKIES are what middleware.ts reads as
      // "signed in". If we got here they are stale (the context could not build a
      // session from them), so sending the browser to a bare /login makes the
      // middleware bounce it straight back to /dashboard, which rendered nothing:
      // a loop with no way out. Remove them first, then go with a way back.
      const here = `${window.location.pathname}${window.location.search}`;
      if (token || userData) {
        clearAuthStorage();
        router.replace(expiredLoginUrl(here));
      } else {
        // Nothing to clean up: a plain sign-out, or a visitor who never signed in.
        router.replace("/login");
      }
      return;
    }

    // Allow access if user is a vendor (isVendor flag) or has admin/vendor role
    const hasAccess =
      user.isVendor === true ||
      user.roles?.some(
        (role: any) =>
          role.id === 1 ||
          role.id === 2 ||
          role.name?.toLowerCase() === "super admin" ||
          role.name?.toLowerCase() === "vendor" ||
          role.name?.toLowerCase() === "admin"
      );

    if (hasAccess) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
      router.replace("/");
    }
  }, [user, isAuthenticated, isLoading, router]);

  if (isLoading || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    // Never an empty page: say where the person is going.
    return (
      <div className="flex items-center justify-center min-h-screen text-sm text-muted-foreground" role="status">
        Redirecting…
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoutes;
