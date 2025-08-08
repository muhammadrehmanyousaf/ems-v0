"use client"

import { useRouter } from "next/navigation"
import Cookies from 'js-cookie'


export default function DashboardPage() {
  const router = useRouter();
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    Cookies.remove("token")
    Cookies.remove("user")
    router.replace("/login");
  };
  
  return (
    <div>
      Home
    </div>
  );
}