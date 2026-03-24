"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Spinner } from "./ui/spinner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useUser } from "@/context/UserContext";
import {
  User,
  Settings,
  Heart,
  Calendar,
  LogOut,
  Building,
  Star,
  Award,
  ChevronDown,
  Crown,
  Shield,
  DollarSign,
  MessageCircle,
} from "lucide-react";

type AvatarComponent = {
  loading: boolean;
  user: any;
};

const HeaderAvatar = ({ loading, user }: AvatarComponent) => {
  const { logout } = useUser();
  const [localUser, setLocalUser] = useState<any>(user);

  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      setLocalUser((prev: any) => ({ ...prev, ...event.detail }));
    };
    window.addEventListener("profileUpdated", handleProfileUpdate as EventListener);
    return () => {
      window.removeEventListener("profileUpdated", handleProfileUpdate as EventListener);
    };
  }, []);

  const displayUser = localUser || user;

  const handleLogout = () => {
    logout();
  };

  const hasDashboardAccess = displayUser
    ? displayUser.isVendor === true ||
      displayUser.isSuperAdmin === true ||
      displayUser.roles?.some(
        (role: any) =>
          role.id === 1 ||
          role.id === 2 ||
          role.name?.toLowerCase() === "super admin" ||
          role.name?.toLowerCase() === "vendor" ||
          role.name?.toLowerCase() === "admin"
      )
    : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <Spinner size="sm" className="text-purple-500" />
      </div>
    );
  }

  if (displayUser) {
    if (hasDashboardAccess) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold group"
            >
              <Crown className="w-4 h-4 mr-2 text-gold-300 group-hover:scale-110 transition-transform duration-200" />
              Dashboard
              <ChevronDown className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform duration-200" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white border border-purple-100 shadow-xl rounded-xl mr-8">
            <DropdownMenuLabel className="flex items-center gap-2 text-purple-900 font-semibold">
              <Shield className="w-4 h-4 text-purple-500" />
              Admin Panel
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="flex items-center gap-3 w-full cursor-pointer">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Building className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold text-neutral-900">Dashboard</div>
                  <div className="text-xs text-neutral-500">Manage platform</div>
                </div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="flex items-center gap-3 w-full cursor-pointer">
                <div className="w-8 h-8 bg-gold-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-gold-600" />
                </div>
                <div>
                  <div className="font-semibold text-neutral-900">Settings</div>
                  <div className="text-xs text-neutral-500">Configure system</div>
                </div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-3 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <LogOut className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <div className="font-semibold">Logout</div>
                <div className="text-xs text-neutral-500">Sign out</div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    } else {
      // Regular User
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="p-0 h-auto hover:bg-purple-50 transition-all duration-200 group"
            >
              <Avatar className="w-10 h-10 border-2 border-purple-200 group-hover:border-purple-400 transition-all duration-200 shadow-lg group-hover:shadow-xl">
                <AvatarImage src={displayUser.profileImage} alt={displayUser.fullName} />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-700 text-white font-semibold text-lg group-hover:scale-110 transition-transform duration-200">
                  {displayUser.fullName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 bg-white border border-purple-100 shadow-xl rounded-xl mr-8">
            <DropdownMenuLabel className="flex items-start gap-3 p-4 border-b border-purple-50">
              <Avatar className="w-12 h-12 border-2 border-purple-200 flex-shrink-0">
                <AvatarImage src={displayUser.profileImage} alt={displayUser.fullName} />
                <AvatarFallback className="bg-gradient-to-br from-purple-600 to-purple-700 text-white font-semibold text-xl">
                  {displayUser.fullName?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-neutral-900 text-lg truncate">{displayUser.fullName}</div>
                <div className="text-sm text-neutral-500 break-words leading-tight">{displayUser.email}</div>
              </div>
            </DropdownMenuLabel>

            <div className="p-2 space-y-1">
              {[
                { href: "/user/profile", icon: User, name: "Profile", desc: "Manage account", color: "purple" },
                { href: "/user/bookings", icon: Calendar, name: "Bookings", desc: "Your appointments", color: "gold" },
                { href: "/user/conversations", icon: MessageCircle, name: "Messages", desc: "Your conversations", color: "purple" },
                { href: "/user/favorites", icon: Heart, name: "Favorites", desc: "Saved vendors", color: "gold" },
                { href: "/user/reviews", icon: Star, name: "Reviews", desc: "Your feedback", color: "gold" },
                { href: "/user/payments", icon: DollarSign, name: "Payments", desc: "Manage payments", color: "purple" },
                { href: "/user/settings", icon: Settings, name: "Settings", desc: "Preferences", color: "gold" },
              ].map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 w-full cursor-pointer p-3 rounded-lg hover:bg-purple-50 hover:text-purple-600 transition-all duration-200"
                  >
                    <div className={`w-8 h-8 ${item.color === "gold" ? "bg-gold-100" : "bg-purple-100"} rounded-lg flex items-center justify-center`}>
                      <item.icon className={`w-4 h-4 ${item.color === "gold" ? "text-gold-600" : "text-purple-600"}`} />
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900">{item.name}</div>
                      <div className="text-xs text-neutral-500">{item.desc}</div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>

            <DropdownMenuSeparator />

            <div className="p-2">
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-3 cursor-pointer p-3 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
              >
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <div className="font-semibold">Logout</div>
                  <div className="text-xs text-neutral-500">Sign out</div>
                </div>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }

  // No user logged in
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          className="hidden md:flex bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold group"
        >
          <Award className="w-4 h-4 mr-2 text-gold-300 group-hover:scale-110 transition-transform duration-200" />
          <span className="hidden lg:inline">List Your Business</span>
          <span className="lg:hidden">Sign In</span>
          <ChevronDown className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform duration-200" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-white border border-purple-100 shadow-xl rounded-xl mr-8">
        <DropdownMenuLabel className="flex items-center gap-3 p-4 border-b border-purple-50">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
            <Award className="w-6 h-6 text-gold-300" />
          </div>
          <div>
            <div className="font-bold text-neutral-900 text-lg">Join Our Platform</div>
            <div className="text-sm text-neutral-500">Grow your business</div>
          </div>
        </DropdownMenuLabel>

        <div className="p-2 space-y-1">
          <DropdownMenuItem asChild>
            <Link
              href="/login"
              className="flex items-center gap-3 w-full cursor-pointer p-3 rounded-lg hover:bg-purple-50 hover:text-purple-600 transition-all duration-200"
            >
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-neutral-900">Sign In</div>
                <div className="text-xs text-neutral-500">Access your account</div>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link
              href="/business-registration"
              className="flex items-center gap-3 w-full cursor-pointer p-3 rounded-lg hover:bg-purple-50 hover:text-purple-600 transition-all duration-200"
            >
              <div className="w-8 h-8 bg-gold-100 rounded-lg flex items-center justify-center">
                <Building className="w-4 h-4 text-gold-600" />
              </div>
              <div>
                <div className="font-semibold text-neutral-900">Register Business</div>
                <div className="text-xs text-neutral-500">Create new account</div>
              </div>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link
              href="/vendor-guide"
              className="flex items-center gap-3 w-full cursor-pointer p-3 rounded-lg hover:bg-purple-50 hover:text-purple-600 transition-all duration-200"
            >
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Star className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <div className="font-semibold text-neutral-900">Vendor Guide</div>
                <div className="text-xs text-neutral-500">Learn how to succeed</div>
              </div>
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default HeaderAvatar;
