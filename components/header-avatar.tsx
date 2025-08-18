"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Spinner } from "./ui/spinner"
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
  Shield
} from "lucide-react";

type AvatarComponent = {
    loading: boolean
    user: any
}

const HeaderAvatar = ({loading, user}: AvatarComponent) => {
    const { logout } = useUser();
    const [localUser, setLocalUser] = useState<any>(user);

    // Debug logging
    useEffect(() => {
        console.log("🔍 HeaderAvatar - Props:", { loading, user });
        console.log("🔍 HeaderAvatar - Local state:", { localUser });
    }, [loading, user, localUser]);

    // Update localUser when user prop changes
    useEffect(() => {
        console.log('Header: user prop changed, updating localUser:', user);
        setLocalUser(user);
    }, [user]);

    // Listen for profile updates from the profile page
    useEffect(() => {
        const handleProfileUpdate = (event: CustomEvent) => {
            console.log('Header received profile update:', event.detail);
            setLocalUser((prev: any) => ({
                ...prev,
                ...event.detail
            }));
        };

        // Add event listener
        window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);
        
        // Cleanup
        return () => {
            window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
        };
    }, []);

    // Use localUser state for display, fallback to prop user
    const displayUser = localUser || user;

    const handleLogout = () => {
        logout();
    };

    // Safely get user role with proper null checks
    let userRole;
    try {
        userRole = displayUser?.roles?.[0]?.id;
        console.log("🔍 HeaderAvatar - User role:", userRole);
    } catch (error) {
        console.warn('Could not get user role:', error);
        userRole = null;
    }

    if (loading) {
        console.log("🔍 HeaderAvatar - Showing loading spinner");
        return (
            <div className="flex items-center justify-center">
                <Spinner size="sm" className="text-rose-500" />
            </div>
        );
    }

    if (displayUser) {
        console.log("🔍 HeaderAvatar - User is logged in, role:", userRole);
        // If we can't determine the role, treat as regular user
        if (!userRole) {
            console.log('User role not found, treating as regular user');
            userRole = 3; // Default to regular user
        }
        
        if (userRole === 1 || userRole === 2) {
            console.log("🔍 HeaderAvatar - Rendering admin dashboard button");
            // Admin/Manager Dashboard
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold group"
                        >
                            <Crown className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                            Dashboard
                            <ChevronDown className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform duration-200" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-white border border-neutral-200 shadow-xl rounded-xl mr-8">
                        <DropdownMenuLabel className="flex items-center gap-2 text-neutral-900 font-semibold">
                            <Shield className="w-4 h-4 text-rose-500" />
                            Admin Panel
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard" className="flex items-center gap-3 w-full cursor-pointer">
                                <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                                    <Building className="w-4 h-4 text-rose-600" />
                                </div>
                                <div>
                                    <div className="font-semibold text-neutral-900">Dashboard</div>
                                    <div className="text-xs text-neutral-500">Manage platform</div>
                                </div>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/settings" className="flex items-center gap-3 w-full cursor-pointer">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Settings className="w-4 h-4 text-blue-600" />
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
        } else if (userRole === 3) {
            console.log("🔍 HeaderAvatar - Rendering user profile avatar");
            // Regular User
            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-0 h-auto hover:bg-rose-50 transition-all duration-200 group"
                        >
                            <Avatar className="w-10 h-10 border-2 border-rose-200 group-hover:border-rose-400 transition-all duration-200 shadow-lg group-hover:shadow-xl">
                                <AvatarImage src={displayUser.profileImage} alt={displayUser.fullName} />
                                <AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-600 text-white font-semibold text-lg group-hover:scale-110 transition-transform duration-200">
                                    {displayUser.fullName?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 bg-white border border-neutral-200 shadow-xl rounded-xl mr-8">
                        <DropdownMenuLabel className="flex items-start gap-3 p-4 border-b border-neutral-100">
                            <Avatar className="w-12 h-12 border-2 border-rose-200 flex-shrink-0">
                                <AvatarImage src={displayUser.profileImage} alt={displayUser.fullName} />
                                <AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-600 text-white font-semibold text-xl">
                                    {displayUser.fullName?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <div className="font-bold text-neutral-900 text-lg truncate">{displayUser.fullName}</div>
                                <div className="text-sm text-neutral-500 break-words leading-tight">{displayUser.email}</div>
                            </div>
                        </DropdownMenuLabel>
                        
                        <div className="p-2 space-y-1">
                            <DropdownMenuItem asChild>
                                <Link href="/user/profile" className="flex items-center gap-3 w-full cursor-pointer p-3 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all duration-200">
                                    <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                                        <User className="w-4 h-4 text-rose-600" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-neutral-900">Profile</div>
                                        <div className="text-xs text-neutral-500">Manage account</div>
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                            

                            
                            <DropdownMenuItem asChild>
                                <Link href="/user/bookings" className="flex items-center gap-3 w-full cursor-pointer p-3 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all duration-200">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-neutral-900">Bookings</div>
                                        <div className="text-xs text-neutral-500">Your appointments</div>
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem asChild>
                                <Link href="/user/favorites" className="flex items-center gap-3 w-full cursor-pointer p-3 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all duration-200">
                                    <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                                        <Heart className="w-4 h-4 text-pink-600" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-neutral-900">Favorites</div>
                                        <div className="text-xs text-neutral-500">Saved vendors</div>
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem asChild>
                                <Link href="/user/reviews" className="flex items-center gap-3 w-full cursor-pointer p-3 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all duration-200">
                                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                        <Star className="w-4 h-4 text-yellow-600" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-neutral-900">Reviews</div>
                                        <div className="text-xs text-neutral-500">Your feedback</div>
                                    </div>
                                </Link>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem asChild>
                                <Link href="/user/settings" className="flex items-center gap-3 w-full cursor-pointer p-3 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all duration-200">
                                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <Settings className="w-4 h-4 text-gray-600" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-neutral-900">Settings</div>
                                        <div className="text-xs text-neutral-500">Preferences</div>
                                    </div>
                                </Link>
                            </DropdownMenuItem>
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

    console.log("🔍 HeaderAvatar - No user logged in, showing business registration button");
    // If no user is logged in - Show "List Your Business" button
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button 
                    size="sm" 
                    className="hidden md:flex bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 font-semibold group"
                >
                    <Award className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                    <span className="hidden lg:inline">List Your Business</span>
                    <span className="lg:hidden">Sign In</span>
                    <ChevronDown className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform duration-200" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-white border border-neutral-200 shadow-xl rounded-xl mr-8">
                <DropdownMenuLabel className="flex items-center gap-3 p-4 border-b border-neutral-100">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <div className="font-bold text-neutral-900 text-lg">Join Our Platform</div>
                        <div className="text-sm text-neutral-500">Grow your business</div>
                    </div>
                </DropdownMenuLabel>
                
                <div className="p-2 space-y-1">
                    <DropdownMenuItem asChild>
                        <Link href="/login" className="flex items-center gap-3 w-full cursor-pointer p-3 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all duration-200">
                            <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center">
                                <User className="w-4 h-4 text-rose-600" />
                            </div>
                            <div>
                                <div className="font-semibold text-neutral-900">Sign In</div>
                                <div className="text-xs text-neutral-500">Access your account</div>
                            </div>
                        </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                        <Link href="/register" className="flex items-center gap-3 w-full cursor-pointer p-3 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all duration-200">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                <Building className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                                <div className="font-semibold text-neutral-900">Register Business</div>
                                <div className="text-xs text-neutral-500">Create new account</div>
                            </div>
                        </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                        <Link href="/vendor-guide" className="flex items-center gap-3 w-full cursor-pointer p-3 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all duration-200">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Star className="w-4 h-4 text-blue-600" />
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
