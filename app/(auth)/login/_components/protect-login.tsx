"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import Cookies from "js-cookie";

const ProtectLogin = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Get authentication info from localStorage & cookies
  const localStorageUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const localStorageToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const cookiesUser = Cookies.get("user");
  const cookiesToken = Cookies.get("token");

  const isLoggedIn = (localStorageUser && localStorageToken) || (cookiesUser && cookiesToken);

  useEffect(() => {
    if (isLoggedIn && pathname === "/login") {
      // Redirect logged-in users trying to access /login back to dashboard
      router.replace("/");
    }
  }, [isLoggedIn, pathname, router]);

  if (!isLoggedIn) {
    return <LoginForm />;
  }

  return null;
};

export default ProtectLogin;
