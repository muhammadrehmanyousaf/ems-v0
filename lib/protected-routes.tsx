"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

const ProtectedRoutes = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, isLoading } = useUser();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoading) return;

    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user_data");

    if (!token || !userData || !isAuthenticated || !user) {
      setIsAuthorized(false);
      router.replace("/login");
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
};

export default ProtectedRoutes;
