"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/dashboard/layout/page-container";
import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { UsersAPI, type ApiUser } from "@/lib/api/dashboard";
import axiosInstance from "@/lib/axiosConfig";
import { BACKEND_URL } from "@/lib/backend-url";
import { toast } from "sonner";
import { User, Building2, Lock } from "lucide-react";
import { useUser } from "@/context/UserContext";

// ── Avatar ────────────────────────────────────────────────────────────────────
function ProfileAvatar({ name }: { name?: string }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";
  const colors = [
    "bg-violet-100 text-violet-700",
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-orange-100 text-orange-700",
    "bg-rose-100 text-rose-700",
  ];
  const color = colors[(initials.charCodeAt(0) || 0) % colors.length];
  return (
    <div className={`h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold shrink-0 ${color}`}>
      {initials}
    </div>
  );
}

// ── Reusable field ─────────────────────────────────────────────────────────────
function Field({
  label, id, name, value, onChange, type = "text", placeholder,
}: {
  label: string; id: string; name: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <Input id={id} name={name} type={type} value={value} onChange={onChange}
        placeholder={placeholder} className="h-9" />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { refreshUser } = useUser();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [profile, setProfile] = useState({
    fullName: "", phoneNumber: "", city: "", subArea: "",
    bookingEmail: "", primaryContactNumber: "", secondaryContactNumber: "",
    website: "", officeAddress: "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });

  useEffect(() => {
    UsersAPI.getMyProfile()
      .then(({ user: u }) => {
        setUser(u);
        const x = u as unknown as Record<string, string>;
        setProfile({
          fullName:               u.fullName          || "",
          phoneNumber:            u.phoneNumber        || "",
          city:                   u.city               || "",
          subArea:                x.subArea            || "",
          bookingEmail:           x.bookingEmail       || "",
          primaryContactNumber:   x.primaryContactNumber   || "",
          secondaryContactNumber: x.secondaryContactNumber || "",
          website:                x.website            || "",
          officeAddress:          x.officeAddress      || "",
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
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageContainer>
        <div className="max-w-3xl space-y-5">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-3xl space-y-5">
        <Heading title="Profile Settings" />

        {/* ── Header card ──────────────────────────────── */}
        <Card>
          <CardContent className="flex items-center gap-5 py-5">
            <ProfileAvatar name={user?.fullName} />
            <div className="min-w-0">
              <p className="text-xl font-semibold leading-tight truncate">
                {user?.fullName || "—"}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {user?.isVendor && user?.vendorType && (
                  <Badge className="bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100">
                    {user.vendorType}
                  </Badge>
                )}
                {user?.roles?.map((r) => (
                  <Badge key={r.id} variant="outline" className="capitalize text-xs">
                    {r.name}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Personal & business info ──────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-muted-foreground" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5">
            <form onSubmit={saveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name"      id="fullName"    name="fullName"    value={profile.fullName}    onChange={onProfileChange} placeholder="Your full name" />
                <Field label="Phone Number"   id="phoneNumber" name="phoneNumber" value={profile.phoneNumber} onChange={onProfileChange} placeholder="+92 300 0000000" />
                <Field label="City"           id="city"        name="city"        value={profile.city}        onChange={onProfileChange} placeholder="e.g. Lahore" />
                <Field label="Area / Sub-area" id="subArea"    name="subArea"     value={profile.subArea}     onChange={onProfileChange} placeholder="e.g. DHA Phase 5" />
              </div>

              <Separator />

              <p className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Business Contact
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Booking Email"       id="bookingEmail"           name="bookingEmail"           value={profile.bookingEmail}           onChange={onProfileChange} type="email" placeholder="bookings@yourbusiness.com" />
                <Field label="Primary Contact"     id="primaryContactNumber"   name="primaryContactNumber"   value={profile.primaryContactNumber}   onChange={onProfileChange} placeholder="+92 300 0000000" />
                <Field label="Secondary Contact"   id="secondaryContactNumber" name="secondaryContactNumber" value={profile.secondaryContactNumber} onChange={onProfileChange} placeholder="+92 300 0000000" />
                <Field label="Website"             id="website"                name="website"                value={profile.website}                onChange={onProfileChange} placeholder="https://yourbusiness.com" />
                <div className="sm:col-span-2">
                  <Field label="Office Address" id="officeAddress" name="officeAddress" value={profile.officeAddress} onChange={onProfileChange} placeholder="Full office address" />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={savingProfile} className="min-w-[120px]">
                  {savingProfile ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ── Change password ───────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4 text-muted-foreground" />
              Change Password
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5">
            <form onSubmit={savePassword} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Current Password"   id="currentPassword"  name="currentPassword"  value={passwords.currentPassword}  onChange={onPasswordChange} type="password" placeholder="Enter current password" />
                </div>
                <Field label="New Password"          id="newPassword"      name="newPassword"      value={passwords.newPassword}      onChange={onPasswordChange} type="password" placeholder="Min 6 characters" />
                <Field label="Confirm New Password"  id="confirmPassword"  name="confirmPassword"  value={passwords.confirmPassword}  onChange={onPasswordChange} type="password" placeholder="Repeat new password" />
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="outline" disabled={savingPassword} className="min-w-[160px]">
                  {savingPassword ? "Updating…" : "Update Password"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
