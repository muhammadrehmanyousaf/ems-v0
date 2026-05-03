"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  User,
  Mail,
  Phone,
  Save,
  Edit3,
  CheckCircle,
  AlertCircle,
  Shield,
  Lock,
  Key,
  Eye,
  EyeOff,
  Camera,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import axiosInstance from "@/lib/axiosConfig";
import { BACKEND_URL } from "@/lib/backend-url";

import {
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/user-dashboard";

interface UserProfile {
  fullName: string;
  email: string;
  phoneNumber: string;
  profileImage?: string;
  roleIds: Array<number>;
}

interface PasswordForm {
  oldPassword: string;
  newPassword: string;
  repeatPassword: string;
}

const ProfilePage = () => {
  const { user, isAuthenticated, isLoading, logout } = useUser();

  const updateHeaderInRealTime = (updatedProfile: UserProfile) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("profileUpdated", {
          detail: {
            fullName: updatedProfile.fullName,
            email: updatedProfile.email,
            phoneNumber: updatedProfile.phoneNumber,
          },
        }),
      );
    }
  };

  const [profile, setProfile] = useState<UserProfile>({
    fullName: "",
    email: "",
    phoneNumber: "",
    roleIds: [3],
  });
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    oldPassword: "",
    newPassword: "",
    repeatPassword: "",
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const isSimpleUser =
    !user?.isVendor &&
    !user?.isSuperAdmin &&
    !user?.roles?.some(
      (r: any) =>
        r.name === "super admin" || r.name === "vendor" || r.name === "admin",
    );

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
        const initialProfile = {
          fullName: user.fullName || "",
          email: user.email || "",
          phoneNumber: user.phoneNumber || "",
          roleIds: [3],
        };
        setProfile(initialProfile);
        setOriginalProfile(initialProfile);
        setIsLoadingProfile(false);
        fetchProfileFromAPI(user.id);
      } else {
        setIsLoadingProfile(false);
      }
    } catch {
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
      // keep context data on failure
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (!user || !user.id) throw new Error("User ID not found");
      const requestBody = { ...profile, roleIds: [3], id: user.id };
      const res = await axiosInstance.patch(
        `${BACKEND_URL}api/v1/users?id=${user.id}`,
        requestBody,
      );
      let updatedData = profile;
      const resData = res.data;
      if (resData?.data?.fullName) updatedData = resData.data;
      else if (resData?.fullName) updatedData = resData;
      setProfile(updatedData);
      setOriginalProfile(updatedData);
      setIsEditing(false);
      setLastUpdated(new Date());
      updateHeaderInRealTime(updatedData);
      if (typeof window !== "undefined" && localStorage.getItem("user_id")) {
        const currentUser = JSON.parse(localStorage.getItem("user_data") || "{}");
        if (updatedData.fullName && currentUser.fullName !== updatedData.fullName) {
          currentUser.fullName = updatedData.fullName;
          localStorage.setItem("user_data", JSON.stringify(currentUser));
        }
      }
      toast({
        title: "Profile updated",
        description: "Your profile changes have been saved.",
      });
    } catch (error) {
      let errorMessage = "Failed to update profile";
      if (error instanceof Error) {
        errorMessage = `Failed to update profile: ${error.message}`;
      }
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      if (passwordForm.newPassword !== passwordForm.repeatPassword) {
        toast({
          title: "Error",
          description: "New passwords do not match.",
          variant: "destructive",
        });
        return;
      }
      setIsPasswordChanging(true);
      if (!user || !user.id) throw new Error("User ID not found");
      await axiosInstance.patch(`${BACKEND_URL}api/v1/users/change-password`, {
        currentPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ oldPassword: "", newPassword: "", repeatPassword: "" });
      toast({
        title: "Password changed",
        description: "You'll be signed out in a moment for security.",
      });
      setTimeout(() => {
        logout();
        router.push("/login");
      }, 2000);
    } catch (error) {
      let errorMessage = "Failed to change password. Please try again.";
      if (error instanceof Error) {
        errorMessage = `Failed to change password: ${error.message}`;
      }
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsPasswordChanging(false);
    }
  };

  const handleCancel = () => {
    if (originalProfile) setProfile(originalProfile);
    setIsEditing(false);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append("picture", file);
      const res = await axiosInstance.post(
        `${BACKEND_URL}api/v1/users/upload-profile-picture`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const serverImageUrl = res.data?.data?.profileImage;
      if (serverImageUrl) {
        setProfile((prev) => ({ ...prev, profileImage: serverImageUrl }));
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("profileUpdated", {
              detail: { profileImage: serverImageUrl },
            }),
          );
          const currentUser = JSON.parse(localStorage.getItem("user_data") || "{}");
          currentUser.profileImage = serverImageUrl;
          localStorage.setItem("user_data", JSON.stringify(currentUser));
        }
      }
      toast({ title: "Profile picture updated" });
    } catch {
      setImagePreview(null);
      toast({
        title: "Upload failed",
        description: "Could not upload profile picture.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (score <= 1) return { score: 1, label: "Weak", color: "bg-bridal-coral" };
    if (score <= 2) return { score: 2, label: "Fair", color: "bg-bridal-coral/70" };
    if (score <= 3) return { score: 3, label: "Good", color: "bg-bridal-gold/70" };
    if (score <= 4) return { score: 4, label: "Strong", color: "bg-bridal-sage" };
    return { score: 5, label: "Very strong", color: "bg-[#3F6B43]" };
  };

  const hasChanges = () => {
    if (!originalProfile) return false;
    return (
      String(profile.fullName || "") !== String(originalProfile.fullName || "") ||
      String(profile.email || "") !== String(originalProfile.email || "") ||
      String(profile.phoneNumber || "") !== String(originalProfile.phoneNumber || "")
    );
  };

  if (isLoading || isLoadingProfile) {
    return (
      <PageContainer>
        <PageHeader
          eyebrow={<><span>My account</span><span className="size-1 rounded-full bg-muted-foreground/40" /><span>Profile</span></>}
          title="Profile"
          description="Manage your personal information and account security."
        />
        <SectionCard title="Personal information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Security">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </SectionCard>
      </PageContainer>
    );
  }

  if (!user || !isAuthenticated) {
    return (
      <PageContainer>
        <SectionCard className="text-center" title="Sign in required">
          <p className="text-sm text-muted-foreground">
            Please log in to view your profile.
          </p>
        </SectionCard>
      </PageContainer>
    );
  }

  const headerEyebrow = (
    <>
      <span>My account</span>
      <span className="size-1 rounded-full bg-muted-foreground/40" />
      <span>Profile</span>
    </>
  );

  const profileActions = !isEditing ? (
    <Button onClick={() => setIsEditing(true)} variant="outline" size="sm" className="gap-1.5">
      <Edit3 className="size-3.5" />
      Edit profile
    </Button>
  ) : (
    <div className="flex items-center gap-2">
      <Button onClick={handleCancel} variant="ghost" size="sm">
        Cancel
      </Button>
      <Button
        onClick={handleSave}
        disabled={!hasChanges() || isSaving}
        size="sm"
        className="gap-1.5"
      >
        {isSaving ? <Spinner size="sm" className="mr-1" /> : <Save className="size-3.5" />}
        {isSaving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );

  return (
    <PageContainer>
      <PageHeader
        eyebrow={headerEyebrow}
        title="Profile"
        description="Manage your personal information and account security."
      />

      {/* Avatar + identity card */}
      <SectionCard
        title="Personal information"
        description="Your basic profile details — visible on bookings and reviews."
        action={profileActions}
      >
        <div className="flex items-start gap-5 mb-6 pb-6 border-b border-border/50">
          {isSimpleUser ? (
            <div className="relative group">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
                onChange={handleImageFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-border hover:border-bridal-gold/55 transition-colors block"
              >
                {imagePreview || profile.profileImage ? (
                  <img
                    src={imagePreview || profile.profileImage}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-bridal-cream flex items-center justify-center text-bridal-gold-dark text-2xl font-display italic">
                    {profile.fullName?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <span className="absolute inset-0 rounded-full bg-bridal-charcoal/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  {isUploadingImage ? (
                    <Spinner size="sm" className="text-bridal-ivory" />
                  ) : (
                    <Camera className="w-5 h-5 text-bridal-ivory" />
                  )}
                </span>
              </button>
            </div>
          ) : (
            <div className="h-20 w-20 rounded-full bg-bridal-cream border border-border flex items-center justify-center text-2xl font-display italic text-bridal-gold-dark">
              {profile.fullName?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-display italic text-[22px] text-foreground leading-tight">
              {profile.fullName || "Your name"}
            </p>
            <p className="text-[13px] text-muted-foreground mt-0.5 truncate">
              {profile.email || "—"}
            </p>
            {lastUpdated && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <CheckCircle className="size-3 text-[#3F6B43]" />
                Updated {lastUpdated.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-[12px] font-medium text-foreground inline-flex items-center gap-1.5">
              <User className="size-3.5 text-muted-foreground" />
              Full name
            </Label>
            <Input
              id="fullName"
              type="text"
              value={profile.fullName || ""}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              disabled={!isEditing}
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[12px] font-medium text-foreground inline-flex items-center gap-1.5">
              <Mail className="size-3.5 text-muted-foreground" />
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              value={profile.email || ""}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={!isEditing}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="phoneNumber" className="text-[12px] font-medium text-foreground inline-flex items-center gap-1.5">
              <Phone className="size-3.5 text-muted-foreground" />
              Phone number
            </Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={profile.phoneNumber || ""}
              onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              disabled={!isEditing}
              placeholder="+92 300 1234567"
            />
          </div>
        </div>

        {isEditing && hasChanges() && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-md border border-bridal-gold/45 bg-bridal-cream px-3 py-2 text-[12px] text-bridal-gold-dark">
            <AlertCircle className="size-3.5" />
            You have unsaved changes
          </div>
        )}
      </SectionCard>

      {/* Security card */}
      <SectionCard
        title="Security"
        description="Update your password. You'll be signed out after a successful change."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="oldPassword" className="text-[12px] font-medium text-foreground inline-flex items-center gap-1.5">
              <Lock className="size-3.5 text-muted-foreground" />
              Current password
            </Label>
            <div className="relative">
              <Input
                id="oldPassword"
                type={showOldPassword ? "text" : "password"}
                value={passwordForm.oldPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, oldPassword: e.target.value }))
                }
                placeholder="Enter current password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showOldPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-[12px] font-medium text-foreground inline-flex items-center gap-1.5">
              <Key className="size-3.5 text-muted-foreground" />
              New password
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                }
                placeholder="Enter new password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {passwordForm.newPassword && (
              <div className="space-y-1.5 pt-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= getPasswordStrength(passwordForm.newPassword).score
                          ? getPasswordStrength(passwordForm.newPassword).color
                          : "bg-border"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] font-medium text-muted-foreground">
                  {getPasswordStrength(passwordForm.newPassword).label}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="repeatPassword" className="text-[12px] font-medium text-foreground inline-flex items-center gap-1.5">
              <CheckCircle className="size-3.5 text-muted-foreground" />
              Confirm new password
            </Label>
            <div className="relative">
              <Input
                id="repeatPassword"
                type={showRepeatPassword ? "text" : "password"}
                value={passwordForm.repeatPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, repeatPassword: e.target.value }))
                }
                placeholder="Repeat new password"
                className={`pr-10 ${
                  passwordForm.repeatPassword &&
                  passwordForm.repeatPassword !== passwordForm.newPassword
                    ? "border-bridal-coral focus-visible:ring-bridal-coral/40"
                    : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showRepeatPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {passwordForm.repeatPassword &&
              passwordForm.repeatPassword !== passwordForm.newPassword && (
                <p className="text-[11px] text-bridal-coral">Passwords do not match</p>
              )}
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-border/60 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-[11.5px] text-muted-foreground inline-flex items-center gap-1.5">
            <Shield className="size-3.5" />
            You'll be signed out after a successful password change.
          </p>
          <Button
            onClick={handlePasswordChange}
            disabled={
              !passwordForm.oldPassword ||
              !passwordForm.newPassword ||
              !passwordForm.repeatPassword ||
              isPasswordChanging
            }
            size="sm"
            className="gap-1.5"
          >
            {isPasswordChanging ? (
              <Spinner size="sm" className="mr-1" />
            ) : (
              <Shield className="size-3.5" />
            )}
            {isPasswordChanging ? "Changing…" : "Change password"}
          </Button>
        </div>
      </SectionCard>
    </PageContainer>
  );
};

export default ProfilePage;
