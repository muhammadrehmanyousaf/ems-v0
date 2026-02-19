"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/hooks/use-toast";
import { User, Mail, Phone, Save, Edit3, CheckCircle, AlertCircle, Shield, Lock, Key, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import axiosInstance from "@/lib/axiosConfig";
import { BACKEND_URL } from "@/lib/backend-url";

interface UserProfile {
  fullName: string;
  email: string;
  phoneNumber: string;
  roleIds: Array<number>;
}

interface PasswordForm {
  oldPassword: string;
  newPassword: string;
  repeatPassword: string;
}

const ProfilePage = () => {
  const { user, isAuthenticated, isLoading, logout } = useUser();
  
  // Function to update header in real-time without reload
  const updateHeaderInRealTime = (updatedProfile: UserProfile) => {
    // Dispatch a custom event to notify the header component
    if (typeof window !== 'undefined') {
      const updateEvent = new CustomEvent('profileUpdated', {
        detail: {
          fullName: updatedProfile.fullName,
          email: updatedProfile.email,
          phoneNumber: updatedProfile.phoneNumber
        }
      });
      window.dispatchEvent(updateEvent);
    }
  };
  
  const [profile, setProfile] = useState<UserProfile>({
    fullName: "",
    email: "",
    phoneNumber: "",
    roleIds: [3]
  });
  
  // Ensure all profile values are always strings to prevent controlled/uncontrolled warnings
  const safeProfile = {
    fullName: String(profile.fullName || ""),
    email: String(profile.email || ""),
    phoneNumber: String(profile.phoneNumber || ""),
    roleIds: [3]
  };
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    oldPassword: "",
    newPassword: "",
    repeatPassword: ""
  });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const router = useRouter();

  // Fetch user profile on component mount
  useEffect(() => {
    if (user && !isLoading) {
      loadUserProfile();
    } else if (!isLoading && !user) {
      setIsLoadingProfile(false);
    }
  }, [user, isLoading]);

  const loadUserProfile = () => {
    try {
      setIsLoadingProfile(true);

      if (user) {
        // Set profile from the user data fetched by the context
        const initialProfile = {
          fullName: user.fullName || "",
          email: user.email || "",
          phoneNumber: user.phoneNumber || "",
          roleIds: [3]
        };
        
        setProfile(initialProfile);
        setOriginalProfile(initialProfile);
        setIsLoadingProfile(false); // Stop loading immediately since we have user data
        
        // Then fetch fresh data from API in background
        fetchProfileFromAPI(user.id);
      } else {
        setIsLoadingProfile(false);
      }
    } catch (error) {
      setIsLoadingProfile(false);
    }
  };

    const fetchProfileFromAPI = async (userId: string) => {
    try {
      const res = await axiosInstance.get(`${BACKEND_URL}api/v1/users?id=${userId}`);
      const data = res.data;

      if (data.data && Array.isArray(data.data)) {
        const userData = data.data.find((u: any) => u.id === userId);
        if (userData) {
          setProfile(userData);
          setOriginalProfile(userData);
        }
      } else if (data.data && data.data.fullName) {
        setProfile(data.data);
        setOriginalProfile(data.data);
      } else if (data.fullName) {
        setProfile(data);
        setOriginalProfile(data);
      }
    } catch {
      // Keep the context data if API fails
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      return updated;
    });
  };

    const handleSave = async () => {
    try {
      setIsSaving(true);
      
      if (!user || !user.id) {
        throw new Error('User ID not found');
      }
      
      const requestBody = {
        ...profile,
        roleIds: [3],
        id: user.id
      };
      const res = await axiosInstance.patch(`${BACKEND_URL}api/v1/users?id=${user.id}`, requestBody);

      let updatedData = profile;
      const resData = res.data;
      if (resData?.data?.fullName) {
        updatedData = resData.data;
      } else if (resData?.fullName) {
        updatedData = resData;
      }
      
      // Update the profile state with new data - this updates the UI immediately!
      setProfile(updatedData);
      setOriginalProfile(updatedData);
      setIsEditing(false);
      setLastUpdated(new Date()); // Track when profile was last updated
      
      // Update header in real-time without reload!
      updateHeaderInRealTime(updatedData);
      
      // Also update the user context if available (for header display)
      if (typeof window !== 'undefined' && localStorage.getItem('user_id')) {
        // Update localStorage with new name if it changed
        const currentUser = JSON.parse(localStorage.getItem('user_data') || '{}');
        if (updatedData.fullName && currentUser.fullName !== updatedData.fullName) {
          currentUser.fullName = updatedData.fullName;
          localStorage.setItem('user_data', JSON.stringify(currentUser));
        }
      }
      
      toast({
        title: "Profile Updated! 🎉",
        description: "Your profile has been updated successfully. The changes are now visible everywhere!",
      });
    } catch (error) {
      let errorMessage = "Failed to update profile";
      if (error instanceof Error) {
        errorMessage = `Failed to update profile: ${error.message}`;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      if (passwordForm.newPassword !== passwordForm.repeatPassword) {
        toast({
          title: "Error",
          description: "New passwords do not match!",
          variant: "destructive",
        });
        return;
      }

      setIsPasswordChanging(true);
      
      if (!user || !user.id) {
        throw new Error('User ID not found');
      }

      await axiosInstance.post(`${BACKEND_URL}api/v1/users/change-password`, {
        userId: user.id,
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });

      // Success! Clear password form
      setPasswordForm({
        oldPassword: "",
        newPassword: "",
        repeatPassword: ""
      });

      // Show success message
      toast({
        title: "Password Changed Successfully! 🔐",
        description: "Your password has been updated. You will be logged out for security reasons.",
      });

      // Wait a moment for user to see the message, then logout
      setTimeout(() => {
        // Use the proper logout function for security
        logout();
        // Redirect to login page
        router.push('/login');
      }, 2000); // 2 second delay

    } catch (error) {
      let errorMessage = "Failed to change password. Please try again.";
      if (error instanceof Error) {
        errorMessage = `Failed to change password: ${error.message}`;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPasswordChanging(false);
    }
  };

  const handleCancel = () => {
    if (originalProfile) {
      setProfile(originalProfile);
    }
    setIsEditing(false);
  };

  const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
    if (score <= 2) return { score: 2, label: "Fair", color: "bg-orange-500" };
    if (score <= 3) return { score: 3, label: "Good", color: "bg-yellow-500" };
    if (score <= 4) return { score: 4, label: "Strong", color: "bg-green-500" };
    return { score: 5, label: "Very Strong", color: "bg-emerald-500" };
  };

  const hasChanges = () => {
    if (!originalProfile) {
      return false;
    }
    
    // Ensure we're comparing strings
    const currentName = String(profile.fullName || "");
    const currentEmail = String(profile.email || "");
    const currentPhone = String(profile.phoneNumber || "");
    
    const originalName = String(originalProfile.fullName || "");
    const originalEmail = String(originalProfile.email || "");
    const originalPhone = String(originalProfile.phoneNumber || "");
    
    const nameChanged = currentName !== originalName;
    const emailChanged = currentEmail !== originalEmail;
    const phoneChanged = currentPhone !== originalPhone;
    
    return nameChanged || emailChanged || phoneChanged;
  };



  if (isLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-50/80 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Page title skeleton */}
          <div className="text-center mb-8">
            <div className="h-10 w-56 skeleton-shimmer rounded-lg mx-auto mb-3" />
            <div className="h-5 w-80 skeleton-shimmer rounded mx-auto" />
          </div>

          {/* Profile card skeleton */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
            {/* Purple gradient header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full" />
                  <div>
                    <div className="h-5 w-44 bg-white/30 rounded mb-2" />
                    <div className="h-3 w-56 bg-white/20 rounded" />
                  </div>
                </div>
                <div className="h-9 w-28 bg-white/20 rounded-lg" />
              </div>
            </div>
            {/* Form fields */}
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Full Name", width: "w-20" },
                  { label: "Email Address", width: "w-28" },
                  { label: "Phone Number", width: "w-28" },
                ].map((field, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 skeleton-shimmer rounded" />
                      <div className={`h-4 ${field.width} skeleton-shimmer rounded`} />
                    </div>
                    <div className="h-10 w-full skeleton-shimmer rounded-lg border-2 border-neutral-100" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Password card skeleton */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm mt-6 overflow-hidden">
            {/* Blue gradient header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full" />
                <div>
                  <div className="h-5 w-40 bg-white/30 rounded mb-2" />
                  <div className="h-3 w-48 bg-white/20 rounded" />
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {["Current Password", "New Password"].map((label, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 skeleton-shimmer rounded" />
                      <div className="h-4 w-32 skeleton-shimmer rounded" />
                    </div>
                    <div className="h-10 w-full skeleton-shimmer rounded-lg border-2 border-neutral-100" />
                  </div>
                ))}
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 skeleton-shimmer rounded" />
                    <div className="h-4 w-40 skeleton-shimmer rounded" />
                  </div>
                  <div className="h-10 w-full skeleton-shimmer rounded-lg border-2 border-neutral-100" />
                </div>
              </div>
              <div className="flex justify-end mt-6 pt-6 border-t border-neutral-200">
                <div className="h-11 w-44 skeleton-shimmer rounded-lg" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-50/80 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-50/80 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">Profile Settings</h1>
          <p className="text-lg text-neutral-600">Manage your account information and preferences</p>
        </div>

        {/* Profile Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                                 <div>
                   <CardTitle className="text-xl">Personal Information</CardTitle>
                   <CardDescription className="text-purple-100">
                     Update your basic profile details
                     {lastUpdated && (
                       <span className="block text-xs text-purple-200 mt-1">
                         Last updated: {lastUpdated.toLocaleString()}
                       </span>
                     )}
                   </CardDescription>
                 </div>
              </div>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 border-white/30 text-white hover:text-white"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-500" />
                  Full Name
                </Label>
                                 <Input
                   id="fullName"
                   type="text"
                   value={profile.fullName || ""}
                   onChange={(e) => handleInputChange('fullName', e.target.value)}
                   disabled={!isEditing}
                   className={`border-2 transition-all duration-200 ${
                     isEditing 
                       ? 'border-purple-200 focus:border-purple-500 focus:ring-purple-500/20' 
                       : 'border-neutral-200 bg-neutral-50'
                   }`}
                   placeholder="Enter your full name"
                 />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-500" />
                  Email Address
                </Label>
                                 <Input
                   id="email"
                   type="email"
                   value={profile.email || ""}
                   onChange={(e) => handleInputChange('email', e.target.value)}
                   disabled={!isEditing}
                   className={`border-2 transition-all duration-200 ${
                     isEditing 
                       ? 'border-purple-200 focus:border-purple-500 focus:ring-purple-500/20' 
                       : 'border-neutral-200 bg-neutral-50'
                   }`}
                   placeholder="Enter your email"
                 />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-purple-500" />
                  Phone Number
                </Label>
                                 <Input
                   id="phoneNumber"
                   type="tel"
                   value={profile.phoneNumber || ""}
                   onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                   disabled={!isEditing}
                   className={`border-2 transition-all duration-200 ${
                     isEditing 
                       ? 'border-purple-200 focus:border-purple-500 focus:ring-purple-500/20' 
                       : 'border-neutral-200 bg-neutral-50'
                   }`}
                   placeholder="Enter your phone number"
                 />
              </div>


            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-neutral-200">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="lg"
                  className="border-neutral-300 text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </Button>
                                                   <Button
                    onClick={handleSave}
                    disabled={!hasChanges() || isSaving}
                    size="lg"
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                  {isSaving ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}

                         {/* Changes Indicator */}
             {isEditing && hasChanges() && (
               <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                 <AlertCircle className="w-4 h-4 text-blue-600" />
                 <span className="text-sm text-blue-700">You have unsaved changes</span>
               </div>
             )}
             
             {/* Last Updated Indicator */}
             {lastUpdated && !isEditing && (
               <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                 <CheckCircle className="w-4 h-4 text-green-600" />
                 <span className="text-sm text-green-700">
                   Profile updated successfully at {lastUpdated.toLocaleTimeString()}
                 </span>
               </div>
             )}
          </CardContent>
        </Card>

        {/* Password Change Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm mt-6">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl">Change Password</CardTitle>
                                 <CardDescription className="text-blue-100">
                   Update your account password
                   <span className="block text-xs text-blue-200 mt-1">
                     ⚠️ You will be automatically logged out after changing your password
                   </span>
                 </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Old Password */}
              <div className="space-y-2">
                <Label htmlFor="oldPassword" className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-500" />
                  Current Password
                </Label>
                <div className="relative">
                  <Input
                    id="oldPassword"
                    type={showOldPassword ? "text" : "password"}
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                    className="border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-500" />
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500/20 pr-10"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordForm.newPassword && (
                  <div className="space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i <= getPasswordStrength(passwordForm.newPassword).score
                              ? getPasswordStrength(passwordForm.newPassword).color
                              : "bg-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${
                      getPasswordStrength(passwordForm.newPassword).score <= 1 ? "text-red-600" :
                      getPasswordStrength(passwordForm.newPassword).score <= 2 ? "text-orange-600" :
                      getPasswordStrength(passwordForm.newPassword).score <= 3 ? "text-yellow-600" :
                      "text-green-600"
                    }`}>
                      {getPasswordStrength(passwordForm.newPassword).label}
                    </p>
                  </div>
                )}
              </div>

              {/* Repeat New Password */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="repeatPassword" className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="repeatPassword"
                    type={showRepeatPassword ? "text" : "password"}
                    value={passwordForm.repeatPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, repeatPassword: e.target.value }))}
                    className={`border-2 focus:ring-blue-500/20 pr-10 ${
                      passwordForm.repeatPassword && passwordForm.repeatPassword !== passwordForm.newPassword
                        ? "border-red-300 focus:border-red-500"
                        : "border-blue-200 focus:border-blue-500"
                    }`}
                    placeholder="Repeat new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showRepeatPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordForm.repeatPassword && passwordForm.repeatPassword !== passwordForm.newPassword && (
                  <p className="text-xs text-red-600">Passwords do not match</p>
                )}
              </div>
            </div>

            {/* Password Change Button */}
            <div className="flex items-center justify-end mt-6 pt-6 border-t border-neutral-200">
              <Button
                onClick={handlePasswordChange}
                disabled={!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.repeatPassword || isPasswordChanging}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isPasswordChanging ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Changing Password...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Change Password
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-500">
            Need help? Contact our support team for assistance
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
