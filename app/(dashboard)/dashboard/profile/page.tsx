"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { UsersAPI, type ApiUser } from "@/lib/api/dashboard";
import axiosInstance from "@/lib/axiosConfig";
import { BACKEND_URL } from "@/lib/backend-url";
import { toast } from "sonner";
import { User, Building2, Lock, Save } from "lucide-react";
import { useUser } from "@/context/UserContext";

import {
  PageContainer,
  PageHeader,
  SectionCard,
} from "@/components/user-dashboard";
import { Card } from "@/components/ui/card";

function ProfileAvatar({ name }: { name?: string }) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";
  return (
    <div className="h-20 w-20 rounded-full flex items-center justify-center font-display italic text-[26px] shrink-0 bg-bridal-cream border border-bridal-gold/55 text-bridal-gold-dark">
      {initials}
    </div>
  );
}

function Field({
  label,
  id,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-[11.5px] font-medium text-foreground">
        {label}
      </Label>
      <Input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}

export default function ProfilePage() {
  const { refreshUser } = useUser();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "",
    phoneNumber: "",
    city: "",
    subArea: "",
    bookingEmail: "",
    primaryContactNumber: "",
    secondaryContactNumber: "",
    website: "",
    officeAddress: "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    UsersAPI.getMyProfile()
      .then(({ user: u }) => {
        setUser(u);
        const x = u as unknown as Record<string, string>;
        setProfile({
          fullName: u.fullName || "",
          phoneNumber: u.phoneNumber || "",
          city: u.city || "",
          subArea: x.subArea || "",
          bookingEmail: x.bookingEmail || "",
          primaryContactNumber: x.primaryContactNumber || "",
          secondaryContactNumber: x.secondaryContactNumber || "",
          website: x.website || "",
          officeAddress: x.officeAddress || "",
        });
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const onProfileChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setProfile((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setPasswords((p) => ({ ...p, [e.target.name]: e.target.value }));

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await axiosInstance.patch(`${BACKEND_URL}api/v1/users/profile`, profile);
      toast.success("Profile updated");
      await refreshUser();
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSavingPassword(true);
    try {
      await axiosInstance.patch(`${BACKEND_URL}api/v1/users/change-password`, {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success("Password changed successfully");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response
        ?.data?.message;
      toast.error(msg || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  const eyebrow = (
    <>
      <span>Console</span>
      <span className="size-1 rounded-full bg-muted-foreground/40" />
      <span>Profile</span>
    </>
  );

  if (loading) {
    return (
      <PageContainer>
        <PageHeader
          eyebrow={eyebrow}
          title="Profile"
          description="Manage your account, business contact and security."
        />
        <Skeleton className="h-32" />
        <Skeleton className="h-72" />
        <Skeleton className="h-56" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        eyebrow={eyebrow}
        title="Profile"
        description="Manage your account, business contact and security."
      />

      {/* Identity card */}
      <Card className="p-5 flex items-center gap-5">
        <ProfileAvatar name={user?.fullName} />
        <div className="min-w-0 flex-1">
          <p className="font-display italic text-[22px] text-foreground leading-tight truncate">
            {user?.fullName || "—"}
          </p>
          <p className="text-[13px] text-muted-foreground mt-0.5 truncate">
            {user?.email}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {user?.isVendor && user?.vendorType ? (
              <span className="inline-flex items-center rounded-full border border-bridal-gold/45 bg-bridal-cream px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-bridal-gold-dark">
                {user.vendorType}
              </span>
            ) : null}
            {user?.roles?.map((r) => (
              <span
                key={r.id}
                className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground capitalize"
              >
                {r.name}
              </span>
            ))}
          </div>
        </div>
      </Card>

      {/* Personal + business contact */}
      <SectionCard
        title="Personal information"
        description="Your basic identity and where you operate."
      >
        <form onSubmit={saveProfile} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field
              label="Full name"
              id="fullName"
              name="fullName"
              value={profile.fullName}
              onChange={onProfileChange}
              placeholder="Your full name"
            />
            <Field
              label="Phone number"
              id="phoneNumber"
              name="phoneNumber"
              value={profile.phoneNumber}
              onChange={onProfileChange}
              placeholder="+92 300 0000000"
            />
            <Field
              label="City"
              id="city"
              name="city"
              value={profile.city}
              onChange={onProfileChange}
              placeholder="e.g. Lahore"
            />
            <Field
              label="Area / sub-area"
              id="subArea"
              name="subArea"
              value={profile.subArea}
              onChange={onProfileChange}
              placeholder="e.g. DHA Phase 5"
            />
          </div>

          <div className="pt-5 border-t border-border/60">
            <p className="text-[10.5px] uppercase tracking-[0.28em] font-medium text-bridal-gold-dark mb-4 inline-flex items-center gap-1.5">
              <Building2 className="size-3.5" />
              Business contact
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field
                label="Booking email"
                id="bookingEmail"
                name="bookingEmail"
                value={profile.bookingEmail}
                onChange={onProfileChange}
                type="email"
                placeholder="bookings@yourbusiness.com"
              />
              <Field
                label="Primary contact"
                id="primaryContactNumber"
                name="primaryContactNumber"
                value={profile.primaryContactNumber}
                onChange={onProfileChange}
                placeholder="+92 300 0000000"
              />
              <Field
                label="Secondary contact"
                id="secondaryContactNumber"
                name="secondaryContactNumber"
                value={profile.secondaryContactNumber}
                onChange={onProfileChange}
                placeholder="+92 300 0000000"
              />
              <Field
                label="Website"
                id="website"
                name="website"
                value={profile.website}
                onChange={onProfileChange}
                placeholder="https://yourbusiness.com"
              />
              <div className="sm:col-span-2">
                <Field
                  label="Office address"
                  id="officeAddress"
                  name="officeAddress"
                  value={profile.officeAddress}
                  onChange={onProfileChange}
                  placeholder="Full office address"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" size="sm" disabled={savingProfile} className="gap-1.5">
              <Save className="size-3.5" />
              {savingProfile ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </SectionCard>

      {/* Password */}
      <SectionCard
        title="Change password"
        description="Update your password to keep your account secure."
      >
        <form onSubmit={savePassword} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2">
              <Field
                label="Current password"
                id="currentPassword"
                name="currentPassword"
                value={passwords.currentPassword}
                onChange={onPasswordChange}
                type="password"
                placeholder="Enter current password"
              />
            </div>
            <Field
              label="New password"
              id="newPassword"
              name="newPassword"
              value={passwords.newPassword}
              onChange={onPasswordChange}
              type="password"
              placeholder="Min 6 characters"
            />
            <Field
              label="Confirm new password"
              id="confirmPassword"
              name="confirmPassword"
              value={passwords.confirmPassword}
              onChange={onPasswordChange}
              type="password"
              placeholder="Repeat new password"
            />
          </div>
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={savingPassword}
              className="gap-1.5"
            >
              <Lock className="size-3.5" />
              {savingPassword ? "Updating…" : "Update password"}
            </Button>
          </div>
        </form>
      </SectionCard>
    </PageContainer>
  );
}
