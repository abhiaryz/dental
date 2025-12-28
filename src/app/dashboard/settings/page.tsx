"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useTranslations, useLocale } from 'next-intl';
import { updateLanguage } from "@/actions/settings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Settings } from "lucide-react";
import { settingsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const t = useTranslations('Settings');
  const currentLocale = useLocale();
  const { data: session, update } = useSession();
  const { toast } = useToast();
  
  // Profile state
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [languageSaving, setLanguageSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Password state
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
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

    void fetchProfile();
  }, [toast]);

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

  const handleLanguageChange = async (value: string) => {
    try {
      setLanguageSaving(true);
      await updateLanguage(value);
      
      toast({
        title: "Success",
        description: t('saved'),
      });

      // Reload to apply changes
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update language",
        variant: "destructive",
      });
    } finally {
      setLanguageSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
            <Settings className="size-6 sm:size-8 text-primary shrink-0" />
            <span>{t('title')}</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <div className="relative -mx-4 sm:mx-0">
          <div className="overflow-x-auto px-4 sm:px-0 pb-2 scrollbar-hide">
            <TabsList className="inline-flex sm:w-full justify-start gap-2 rounded-2xl bg-white/80 p-2 shadow-md min-w-max">
              <TabsTrigger value="profile" className="px-3 sm:px-4 py-2">Profile</TabsTrigger>
              <TabsTrigger value="security" className="px-3 sm:px-4 py-2">Security</TabsTrigger>
              <TabsTrigger value="notifications" className="px-3 sm:px-4 py-2">Notifications</TabsTrigger>
              <TabsTrigger value="system" className="px-3 sm:px-4 py-2">{t('system')}</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileLoading ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="min-touch"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input 
                      type="email" 
                      value={email} 
                      disabled 
                      className="bg-muted min-touch"
                      style={{ fontSize: '16px' }}
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
                      className="bg-muted capitalize min-touch"
                      style={{ fontSize: '16px' }}
                    />
                  </div>
                  <Separator />
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={profileSaving || !name}
                    className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 min-touch"
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
                  className="min-touch"
                  style={{ fontSize: '16px' }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input 
                  type="password" 
                  placeholder="Enter new password (min 8 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="min-touch"
                  style={{ fontSize: '16px' }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm New Password</label>
                <Input 
                  type="password" 
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="min-touch"
                  style={{ fontSize: '16px' }}
                />
              </div>
              <Separator />
              <Button 
                onClick={handleChangePassword}
                disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 min-touch"
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
              <Button variant="outline" disabled className="w-full sm:w-auto min-touch">Enable 2FA</Button>
              <p className="text-xs text-muted-foreground">
                Two-factor authentication will be available in a future update
              </p>
            </CardContent>
          </Card>
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
              <CardTitle>{t('system')} Settings</CardTitle>
              <CardDescription>Configure application behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('language')}</label>
                <Select 
                  value={currentLocale} 
                  onValueChange={handleLanguageChange}
                  disabled={languageSaving}
                >
                  <SelectTrigger className="min-touch">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi (हिंदी)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Timezone</label>
                <Input defaultValue="Pacific Time (PT)" disabled className="bg-muted min-touch" style={{ fontSize: '16px' }} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Format</label>
                <Input defaultValue="MM/DD/YYYY" disabled className="bg-muted min-touch" style={{ fontSize: '16px' }} />
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
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" disabled className="flex-1 sm:flex-none min-touch">Export Data</Button>
                <Button variant="outline" className="flex-1 sm:flex-none min-touch" disabled>Clear Cache</Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Data export and management tools will be available in a future update
              </p>
              <Separator />
              <div>
                <p className="text-sm font-medium text-destructive mb-2">Danger Zone</p>
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto border-destructive text-destructive hover:bg-destructive hover:text-white min-touch"
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
