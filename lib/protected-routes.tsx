"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/hooks/getLoggedinUser";

const ProtectedRoutes = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = getUser();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;

    const localStorageUser = localStorage.getItem("user");
    const localStorageToken = localStorage.getItem("token");

    if (localStorageUser && localStorageToken && (user?.roles[0]?.id === 1 || user?.roles[0]?.id === 2)) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return isAuthorized ? <>{children}</> : null;
};

export default ProtectedRoutes;
