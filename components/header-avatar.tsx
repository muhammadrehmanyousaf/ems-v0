"use client";

import React from "react";
import Link from "next/link";
import { Spinner } from "./ui/spinner" // Import custom hook
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/authFunction";

type AvatarComponent = {
    loading: boolean
    user: any
}
const HeaderAvatar = ({loading, user}: AvatarComponent) => {

    const handleLogout = () => {
        logout(); // Call the logout function
      };

    let userRole = user?.roles[0].id;

  if (loading) {
    return <Spinner size="sm" className="bg-black dark:bg-white mr-4" />;
  }

  if (user) {
    if (userRole === 1 || userRole === 2) {
      return (
        <Link href="/dashboard">
          <Button size="sm">Dashboard</Button>
        </Link>
      );
    } else if (userRole === 3) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <Avatar>
              <AvatarFallback className="uppercase bg-[#ed6b00] text-white hover:bg-[#ed6b00]/90">
                {user.fullName?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>{user.fullName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Liked Venues</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }

  // If no user is logged in
  return (
    <Link href="/login">
      <Button size="sm">List Your Business</Button>
    </Link>
  );
};

export default HeaderAvatar;
