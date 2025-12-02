"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { settingsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { toast } = useToast();
  
  // Profile state
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Password state
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Clinic state
  const [clinic, setClinic] = useState<any>(null);
  const [clinicLoading, setClinicLoading] = useState(false);
  const [clinicSaving, setClinicSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [clinicFormData, setClinicFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    phone: "",
    email: "",
    website: "",
    registrationNumber: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const data = await settingsAPI.getProfile();
      setProfile(data);
      setName(data.name || "");
      setEmail(data.email || "");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setProfileSaving(true);
      const updatedProfile = await settingsAPI.updateProfile({ name });
      
      // Update session with new name
      await update({
        ...session,
        user: {
          ...session?.user,
          name: updatedProfile.name,
        },
      });

      setProfile(updatedProfile);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    try {
      setPasswordSaving(true);
      await settingsAPI.updatePassword(currentPassword, newPassword);
      
      toast({
        title: "Success",
        description: "Password updated successfully",
      });

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const fetchClinicSettings = async () => {
    try {
      setClinicLoading(true);
      const response = await fetch("/api/clinic/settings");
      if (!response.ok) throw new Error("Failed to fetch clinic settings");
      const data = await response.json();
      setClinic(data);
      setClinicFormData({
        name: data.name || "",
        address: data.address || "",
        city: data.city || "",
        state: data.state || "",
        pinCode: data.pinCode || "",
        phone: data.phone || "",
        email: data.email || "",
        website: data.website || "",
        registrationNumber: data.registrationNumber || "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load clinic settings",
        variant: "destructive",
      });
    } finally {
      setClinicLoading(false);
    }
  };

  const handleSaveClinic = async () => {
    try {
      setClinicSaving(true);
      const response = await fetch("/api/clinic/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clinicFormData),
      });
      
      if (!response.ok) throw new Error("Failed to update clinic");
      
      toast({
        title: "Success",
        description: "Clinic settings updated successfully",
      });
      
      await fetchClinicSettings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update clinic settings",
        variant: "destructive",
      });
    } finally {
      setClinicSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setLogoUploading(true);
      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch("/api/clinic/update-logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload logo");

      const data = await response.json();
      
      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });

      setClinic({ ...clinic, logo: data.logo });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setLogoUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="clinic">Clinic</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input 
                      type="email" 
                      value={email} 
                      disabled 
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed. Contact support if you need to update it.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <Input 
                      value={profile?.role || ""} 
                      disabled 
                      className="bg-muted capitalize"
                    />
                  </div>
                  <Separator />
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={profileSaving || !name}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {profileSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Save Changes
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Password</label>
                <Input 
                  type="password" 
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input 
                  type="password" 
                  placeholder="Enter new password (min 8 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm New Password</label>
                <Input 
                  type="password" 
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Separator />
              <Button 
                onClick={handleChangePassword}
                disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {passwordSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Update Password
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Status</p>
                  <p className="text-sm text-muted-foreground">Two-factor authentication is currently disabled</p>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              <Separator />
              <Button variant="outline" disabled>Enable 2FA</Button>
              <p className="text-xs text-muted-foreground">
                Two-factor authentication will be available in a future update
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clinic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clinic Information</CardTitle>
              <CardDescription>Manage your clinic details and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {clinicLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="size-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Clinic Logo</label>
                    {clinic?.logo && (
                      <div className="mb-2">
                        <img 
                          src={clinic.logo} 
                          alt="Clinic Logo" 
                          className="h-20 w-20 object-contain border rounded"
                        />
                      </div>
                    )}
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={logoUploading}
                    />
                    {logoUploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
                  </div>
                  
                  <Separator />
                  
                  {/* Clinic Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Clinic Name *</label>
                    <Input 
                      value={clinicFormData.name} 
                      onChange={(e) => setClinicFormData({ ...clinicFormData, name: e.target.value })}
                      placeholder="Enter clinic name"
                    />
                  </div>
                  
                  {/* Address */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Address</label>
                    <Input 
                      value={clinicFormData.address} 
                      onChange={(e) => setClinicFormData({ ...clinicFormData, address: e.target.value })}
                      placeholder="Enter street address"
                    />
                  </div>
                  
                  {/* City, State, PIN Code */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">City</label>
                      <Input 
                        value={clinicFormData.city} 
                        onChange={(e) => setClinicFormData({ ...clinicFormData, city: e.target.value })}
                        placeholder="City"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">State</label>
                      <Input 
                        value={clinicFormData.state} 
                        onChange={(e) => setClinicFormData({ ...clinicFormData, state: e.target.value })}
                        placeholder="State"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">PIN Code</label>
                      <Input 
                        value={clinicFormData.pinCode} 
                        onChange={(e) => setClinicFormData({ ...clinicFormData, pinCode: e.target.value })}
                        placeholder="PIN"
                      />
                    </div>
                  </div>
                  
                  {/* Phone & Email */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone</label>
                      <Input 
                        value={clinicFormData.phone} 
                        onChange={(e) => setClinicFormData({ ...clinicFormData, phone: e.target.value })}
                        placeholder="Phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input 
                        type="email"
                        value={clinicFormData.email} 
                        onChange={(e) => setClinicFormData({ ...clinicFormData, email: e.target.value })}
                        placeholder="Email address"
                      />
                    </div>
                  </div>
                  
                  {/* Website & Registration Number */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Website</label>
                      <Input 
                        value={clinicFormData.website} 
                        onChange={(e) => setClinicFormData({ ...clinicFormData, website: e.target.value })}
                        placeholder="www.example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Registration Number</label>
                      <Input 
                        value={clinicFormData.registrationNumber} 
                        onChange={(e) => setClinicFormData({ ...clinicFormData, registrationNumber: e.target.value })}
                        placeholder="Registration number"
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <Button 
                    onClick={handleSaveClinic}
                    disabled={clinicSaving || !clinicFormData.name}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {clinicSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Save Clinic Settings
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
          
          <Button 
            variant="outline" 
            onClick={fetchClinicSettings}
            disabled={clinicLoading}
          >
            {clinicLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Load Clinic Settings
          </Button>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive updates via email</p>
                </div>
                <Badge className="bg-success text-success-foreground">Enabled</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive alerts via SMS</p>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive browser notifications</p>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Advanced notification preferences will be available in a future update
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure application behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Language</label>
                <Input defaultValue="English (US)" disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Timezone</label>
                <Input defaultValue="Pacific Time (PT)" disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Format</label>
                <Input defaultValue="MM/DD/YYYY" disabled className="bg-muted" />
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                System settings customization will be available in a future update
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Manage your data and account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" disabled>Export Data</Button>
              <Button variant="outline" className="ml-2" disabled>Clear Cache</Button>
              <p className="text-xs text-muted-foreground">
                Data export and management tools will be available in a future update
              </p>
              <Separator />
              <div>
                <p className="text-sm font-medium text-destructive mb-2">Danger Zone</p>
                <Button 
                  variant="outline" 
                  className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                  disabled
                >
                  Delete Account
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Account deletion will require admin approval
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
