"use client";

import React, { useState, useEffect, useRef } from "react";
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
  LogIn,
  Building,
  Star,
  Sparkles,
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

  const accessRightNow = displayUser
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

  /**
   * Latch access ON for the life of a session, and only reset it when the user
   * actually changes.
   *
   * This is what made the menu flicker. The component returns three SEPARATE
   * <DropdownMenu> trees — one for a user with dashboard access, one for a user
   * without, one for logged out. React does not re-render across that boundary,
   * it unmounts one tree and mounts another, and Radix keeps `open` in internal
   * state, so the open menu is destroyed with the tree it lived in.
   *
   * `accessRightNow` is derived from `displayUser.roles`. UserContext refreshes
   * the user from /users/:id, which its own comment describes as "the plain DB
   * user" — it does not re-compute isSuperAdmin, and roles can come back thinner
   * than the copy in localStorage. So a routine background refresh flipped this
   * flag, swapped the tree, and closed the menu under the cursor. The stored
   * copy then restored it and it flipped back, which is the oscillation visible
   * in the recording: open, closed, open, closed, roughly twice a second, while
   * the pointer never moved.
   *
   * Access is not something that should appear and vanish twice a second. Once
   * we have seen that this user has it, that is the answer until the user
   * changes — a thinner refresh payload is missing information, not a
   * revocation. Keyed on user id so a different account starts clean, and
   * logout is unaffected because `displayUser` going null renders the
   * logged-out tree regardless.
   */
  const accessLatch = useRef<{ userId: unknown; value: boolean }>({
    userId: null,
    value: false,
  });
  const currentUserId = displayUser?.id ?? null;
  if (accessLatch.current.userId !== currentUserId) {
    accessLatch.current = { userId: currentUserId, value: false };
  }
  if (accessRightNow) accessLatch.current.value = true;
  const hasDashboardAccess = accessLatch.current.value;

  /**
   * Spin only when there is genuinely nothing to show.
   *
   * This used to be `if (loading)`, full stop — so any moment the session went
   * back into a loading state, the avatar was unmounted and replaced by a
   * spinner. Radix renders the dropdown as a child of this component, so
   * unmounting it takes an OPEN menu with it: the user clicks their avatar, the
   * menu appears, a background re-validation fires, and the menu vanishes under
   * the cursor mid-click.
   *
   * UserContext re-runs initializeSession() on any `storage` event for the
   * token or user keys, and that sets isLoading(true). A `storage` event fires
   * in every OTHER tab, so a second tab of the site — or any write to those
   * keys — was enough to blank the header of the tab being used.
   *
   * Re-validating something we already know must never remove it from the
   * screen. If we have a user, keep showing them while the check runs.
   */
  if (loading && !displayUser) {
    return (
      <div className="flex items-center justify-center">
        <Spinner size="sm" className="text-bridal-gold" />
      </div>
    );
  }

  if (displayUser) {
    /**
     * ONE DropdownMenu for both logged-in shapes — never two that swap.
     *
     * This used to be `if (hasDashboardAccess) return <DropdownMenu>… else
     * return <DropdownMenu>…`. Two sibling trees, so when the flag changed
     * React unmounted one and mounted the other, and Radix — which keeps `open`
     * in internal state — lost the open menu along with the tree it lived in.
     * That is the flicker in the recording: open, closed, open, closed, twice a
     * second, while the pointer never moved.
     *
     * The latch above stops the flag flipping, which fixes the trigger. This
     * removes the mechanism, so no future prop change can close the menu by
     * swapping the tree out from under it. Only the trigger and the items
     * differ now; the DropdownMenu itself is mounted once and stays.
     */
    const trigger = hasDashboardAccess ? (
      <Button
        variant="outline"
        size="sm"
        className="bg-gradient-to-r from-bridal-gold to-bridal-gold-dark hover:from-bridal-gold-dark hover:to-bridal-gold-dark text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold group"
      >
        <Crown className="w-4 h-4 mr-2 text-bridal-gold group-hover:scale-110 transition-transform duration-200" />
        Dashboard
        <ChevronDown className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform duration-200" />
      </Button>
    ) : (
      <Button
        variant="ghost"
        size="sm"
      className="p-0 h-auto hover:bg-bridal-cream dark:hover:bg-neutral-800 transition-all duration-200 group"
      >
        <Avatar className="w-10 h-10 border-2 border-bridal-gold/45 group-hover:border-bridal-gold/55 transition-all duration-200 shadow-lg group-hover:shadow-xl">
          <AvatarImage src={displayUser.profileImage} alt={displayUser.fullName} />
          <AvatarFallback className="bg-gradient-to-br from-bridal-gold to-bridal-gold-dark text-white font-semibold text-lg group-hover:scale-110 transition-transform duration-200">
            {displayUser.fullName?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Button>
    );

    const items = hasDashboardAccess ? (
      <>
        <DropdownMenuLabel className="flex items-center gap-2 text-bridal-charcoal font-semibold">
          <Shield className="w-4 h-4 text-bridal-gold" />
          Admin Panel
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
        <Link href="/dashboard" className="flex items-center gap-3 w-full cursor-pointer dark:hover:bg-neutral-800">
            <div className="w-8 h-8 bg-bridal-gold/15 rounded-lg flex items-center justify-center">
              <Building className="w-4 h-4 text-bridal-gold-dark" />
            </div>
            <div>
            <div className="font-semibold text-neutral-900 dark:text-neutral-100">Dashboard</div>
              <div className="text-xs text-neutral-500">Manage platform</div>
            </div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
        <Link href="/dashboard/settings" className="flex items-center gap-3 w-full cursor-pointer dark:hover:bg-neutral-800">
            <div className="w-8 h-8 bg-bridal-gold/15 rounded-lg flex items-center justify-center">
              <Settings className="w-4 h-4 text-bridal-gold-dark" />
            </div>
            <div>
            <div className="font-semibold text-neutral-900 dark:text-neutral-100">Settings</div>
              <div className="text-xs text-neutral-500">Configure system</div>
            </div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
        className="flex items-center gap-3 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
        >
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <LogOut className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <div className="font-semibold">Logout</div>
            <div className="text-xs text-neutral-500">Sign out</div>
          </div>
        </DropdownMenuItem>
      </>
    ) : (
      <>
        <DropdownMenuLabel className="flex items-start gap-3 p-4 border-b border-bridal-beige dark:border-neutral-800">
            <Avatar className="w-12 h-12 border-2 border-bridal-gold/45 flex-shrink-0">
              <AvatarImage src={displayUser.profileImage} alt={displayUser.fullName} />
              <AvatarFallback className="bg-gradient-to-br from-bridal-gold to-bridal-gold-dark text-white font-semibold text-xl">
                {displayUser.fullName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
            <div className="font-bold text-neutral-900 dark:text-neutral-100 text-lg truncate">{displayUser.fullName}</div>
              <div className="text-sm text-neutral-500 break-words leading-tight">{displayUser.email}</div>
            </div>
          </DropdownMenuLabel>

          <div className="p-2 space-y-1">
            {[
              { href: "/user/profile", icon: User, name: "Profile", desc: "Manage account", color: "purple" },
              { href: "/user/bookings", icon: Calendar, name: "Bookings", desc: "Your appointments", color: "gold" },
              { href: "/user/umbrellas", icon: Sparkles, name: "My Wedding", desc: "All your functions", color: "purple" },
              { href: "/user/conversations", icon: MessageCircle, name: "Messages", desc: "Your conversations", color: "purple" },
              { href: "/user/favorites", icon: Heart, name: "Favorites", desc: "Saved vendors", color: "gold" },
              { href: "/user/reviews", icon: Star, name: "Reviews", desc: "Your feedback", color: "gold" },
              { href: "/user/payments", icon: DollarSign, name: "Payments", desc: "Manage payments", color: "purple" },
              { href: "/user/settings", icon: Settings, name: "Settings", desc: "Preferences", color: "gold" },
            ].map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link
                  href={item.href}
                className="flex items-center gap-3 w-full cursor-pointer p-3 rounded-lg hover:bg-bridal-cream dark:hover:bg-neutral-800 hover:text-bridal-gold-dark dark:hover:text-bridal-gold/70 transition-all duration-200"
                >
                  <div className={`w-8 h-8 ${item.color === "gold" ? "bg-bridal-gold/15" : "bg-bridal-gold/15"} rounded-lg flex items-center justify-center`}>
                    <item.icon className={`w-4 h-4 ${item.color === "gold" ? "text-bridal-gold-dark" : "text-bridal-gold-dark"}`} />
                  </div>
                  <div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">{item.name}</div>
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
            className="flex items-center gap-3 cursor-pointer p-3 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all duration-200"
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
      </>
    );

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent
          className={hasDashboardAccess ? "w-56 bg-white dark:bg-neutral-900 border border-bridal-beige dark:border-neutral-800 shadow-xl rounded-xl mr-8" : "w-64 bg-white dark:bg-neutral-900 border border-bridal-beige dark:border-neutral-800 shadow-xl rounded-xl mr-8"}
        >
          {items}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // No user logged in
  return (
    <div className="hidden md:flex items-center gap-2">
      <Link href="/login">
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-4 font-semibold border-bridal-gold/45 dark:border-neutral-700 text-bridal-gold-dark dark:text-bridal-gold/70 hover:bg-bridal-cream dark:hover:bg-neutral-800 hover:border-bridal-gold/55 dark:hover:border-neutral-600 rounded-xl transition-all duration-200"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Sign In
        </Button>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            className="h-9 px-4 bg-gradient-to-r from-bridal-gold to-bridal-gold-dark hover:from-bridal-gold-dark hover:to-bridal-gold-dark text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold rounded-xl group"
          >
            <Award className="w-4 h-4 mr-2 text-bridal-gold group-hover:scale-110 transition-transform duration-200" />
            List Your Business
            <ChevronDown className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform duration-200" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64 bg-white dark:bg-neutral-900 border border-bridal-beige dark:border-neutral-800 shadow-xl rounded-xl mr-8">
          <DropdownMenuLabel className="flex items-center gap-3 p-4 border-b border-bridal-beige dark:border-neutral-800">
            <div className="w-12 h-12 bg-gradient-to-br from-bridal-gold to-bridal-gold-dark rounded-xl flex items-center justify-center shadow-lg">
              <Award className="w-6 h-6 text-bridal-gold" />
            </div>
            <div>
              <div className="font-bold text-neutral-900 dark:text-neutral-100 text-lg">Join Our Platform</div>
              <div className="text-sm text-neutral-500">Grow your business</div>
            </div>
          </DropdownMenuLabel>

          <div className="p-2 space-y-1">
            <DropdownMenuItem asChild>
              <Link
                href="/business-registration"
                className="flex items-center gap-3 w-full cursor-pointer p-3 rounded-lg hover:bg-bridal-cream dark:hover:bg-neutral-800 hover:text-bridal-gold-dark dark:hover:text-bridal-gold/70 transition-all duration-200"
              >
                <div className="w-8 h-8 bg-bridal-gold/15 rounded-lg flex items-center justify-center">
                  <Building className="w-4 h-4 text-bridal-gold-dark" />
                </div>
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">Register Business</div>
                  <div className="text-xs text-neutral-500">Create new account</div>
                </div>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                href="/vendor-guide"
                className="flex items-center gap-3 w-full cursor-pointer p-3 rounded-lg hover:bg-bridal-cream dark:hover:bg-neutral-800 hover:text-bridal-gold-dark dark:hover:text-bridal-gold/70 transition-all duration-200"
              >
                <div className="w-8 h-8 bg-bridal-gold/15 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-bridal-gold-dark" />
                </div>
                <div>
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100">Vendor Guide</div>
                  <div className="text-xs text-neutral-500">Learn how to succeed</div>
                </div>
              </Link>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default HeaderAvatar;
