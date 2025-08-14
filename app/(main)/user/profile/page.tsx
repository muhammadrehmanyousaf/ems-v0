"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/hooks/use-toast";
import { User, Mail, Phone, Save, Edit3, CheckCircle, AlertCircle, Shield, Lock, Key } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Cookies from "js-cookie";

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
  console.log('🔍 ProfilePage - Component rendered!');
  
  const { user, isAuthenticated, isLoading, logout } = useUser();
  
  // Debug logging
  console.log('🔍 ProfilePage - Auth state:', { user: !!user, isAuthenticated, isLoading });
  console.log('🔍 ProfilePage - User data:', user);
  
  // Helper function to get auth token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || Cookies.get('auth_token') || '';
    }
    return '';
  };
  
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
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const router = useRouter();

  // Fetch user profile on component mount
  useEffect(() => {
    console.log('🔍 ProfilePage - useEffect triggered:', { user: !!user, isLoading });
    if (user && !isLoading) {
      console.log('🔍 ProfilePage - Loading user profile...');
      loadUserProfile();
    } else if (!isLoading && !user) {
      console.log('🔍 ProfilePage - No user found, stopping loading');
      setIsLoadingProfile(false);
    }
  }, [user, isLoading]);

  const loadUserProfile = () => {
    try {
      console.log('🔍 ProfilePage - loadUserProfile called');
      setIsLoadingProfile(true);
      
      if (user) {
        console.log('🔍 ProfilePage - Setting initial profile from user data');
        // Set profile from the user data fetched by the context
        const initialProfile = {
          fullName: user.fullName || "",
          email: user.email || "",
          phoneNumber: user.phoneNumber || "",
          roleIds: [3]
        };
        
        console.log('🔍 ProfilePage - Initial profile:', initialProfile);
        setProfile(initialProfile);
        setOriginalProfile(initialProfile);
        setIsLoadingProfile(false); // Stop loading immediately since we have user data
        
        // Then fetch fresh data from API in background
        fetchProfileFromAPI(user.id);
      } else {
        console.log('🔍 ProfilePage - No user data available');
        setIsLoadingProfile(false);
      }
    } catch (error) {
      console.error('🔍 ProfilePage - Error in loadUserProfile:', error);
      setIsLoadingProfile(false);
    }
  };

    const fetchProfileFromAPI = async (userId: string) => {
    try {
      // Try the authenticated endpoint first
      const response = await fetch(`http://localhost:3000/api/v1/users?id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const responseText = await response.text();
        
        if (responseText && responseText.trim() !== '') {
          try {
            const data = JSON.parse(responseText);
            
            // Check if we got user data or just a message
            if (data.data && Array.isArray(data.data)) {
              // If data.data is an array, find the user by ID
              const userData = data.data.find((user: any) => user.id === userId);
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
          } catch (parseError) {
            // Keep current data if parsing fails
          }
        }
      }
      // Keep the localStorage data if API fails
    } catch (error) {
      // Keep the localStorage data if API fails
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
      console.log(requestBody);
      const response = await fetch(`http://localhost:3000/api/v1/users?id=${user.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update profile: ${response.status}`);
      }

      // Get the response data to update the frontend
      let updatedData;
      try {
        const responseText = await response.text();
        
        if (responseText && responseText.trim() !== '') {
          updatedData = JSON.parse(responseText);
          
          // Check if the response contains the updated user data
          if (updatedData.data && updatedData.data.fullName) {
            // API returned updated user data
            updatedData = updatedData.data;
          } else if (updatedData.fullName) {
            // API returned user data directly
            updatedData = updatedData;
          } else {
            // API didn't return user data, use what we sent
            updatedData = profile;
          }
        } else {
          updatedData = profile;
        }
      } catch (parseError) {
        updatedData = profile;
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

      // Prepare request data
      const requestBody = {
        userId: user.id,
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      };

      // Make API call
      const response = await fetch(`http://localhost:3000/api/v1/users/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        // Try to get error details
        let errorData;
        try {
          const errorText = await response.text();
          errorData = JSON.parse(errorText);
        } catch (parseError) {
          errorData = { message: 'Unknown error' };
        }
        
        throw new Error(errorData.message || `Failed to change password: ${response.status}`);
      }

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
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="text-rose-500 mx-auto mb-4" />
          <p className="text-neutral-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">Profile Settings</h1>
          <p className="text-lg text-neutral-600">Manage your account information and preferences</p>
        </div>

        {/* Profile Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                                 <div>
                   <CardTitle className="text-xl">Personal Information</CardTitle>
                   <CardDescription className="text-rose-100">
                     Update your basic profile details
                     {lastUpdated && (
                       <span className="block text-xs text-rose-200 mt-1">
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
                  <User className="w-4 h-4 text-rose-500" />
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
                       ? 'border-rose-200 focus:border-rose-500 focus:ring-rose-500/20' 
                       : 'border-neutral-200 bg-neutral-50'
                   }`}
                   placeholder="Enter your full name"
                 />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-rose-500" />
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
                       ? 'border-rose-200 focus:border-rose-500 focus:ring-rose-500/20' 
                       : 'border-neutral-200 bg-neutral-50'
                   }`}
                   placeholder="Enter your email"
                 />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-rose-500" />
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
                       ? 'border-rose-200 focus:border-rose-500 focus:ring-rose-500/20' 
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
                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
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
                <Input
                  id="oldPassword"
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                  className="border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500/20"
                  placeholder="Enter current password"
                />
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                  <Key className="w-4 h-4 text-blue-500" />
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500/20"
                  placeholder="Enter new password"
                />
              </div>

              {/* Repeat New Password */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="repeatPassword" className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  Confirm New Password
                </Label>
                <Input
                  id="repeatPassword"
                  type="password"
                  value={passwordForm.repeatPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, repeatPassword: e.target.value }))}
                  className="border-2 border-blue-200 focus:border-blue-500 focus:ring-blue-500/20"
                  placeholder="Repeat new password"
                />
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
