import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Eye,
  EyeOff,
  LogOut,
  User,
  Crown,
  Mail,
  Calendar,
  Shield,
  KeyRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProfile, useAuth } from "@/hooks/useApi";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";

const Profile = () => {
  console.log("🌍 API base URL =", import.meta.env.VITE_API_URL);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [changing, setChanging] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) navigate("/login");
  }, [navigate]);

  // Load user profile
  const { data: profile, isLoading, error } = useProfile();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleChangePassword = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }

    try {
      setChanging(true);
      setErrorMsg(null);
      setMessage(null);

      const token = localStorage.getItem("auth_token");
      const baseUrl = import.meta.env.VITE_API_URL;
      const res = await fetch(`${baseUrl}/auth/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setErrorMsg(data.message || "Failed to change password.");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setChanging(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Failed to load profile. Please try logging in again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // XP and level logic
  const currentLevelXP = (profile.level - 1) * 1000;
  const nextLevelXP = profile.level * 1000;
  const xpProgress =
    ((profile.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/dashboard")}>
            <Crown className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-[hsl(263,70%,60%)] to-[hsl(190,95%,60%)] bg-clip-text text-transparent">
              ChallengeQuest
            </span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Profile Content */}
      <main className="container mx-auto px-4 py-10 space-y-8">
        {/* Profile Info */}
        <Card className="glass-card border border-primary/20 rounded-xl max-w-4xl mx-auto">
          <CardContent className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[var(--shadow-glow-primary)]">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="avatar"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-primary-foreground" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  {profile.firstName} {profile.lastName}
                </h1>
                <p className="text-muted-foreground">@{profile.username}</p>
              </div>
            </div>

            {/* Stats and Info */}
            <div className="grid md:grid-cols-3 gap-6 pt-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <span>
                  Joined {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <span>
                  {profile.isAdmin ? "Administrator" : "Standard User"}
                </span>
              </div>
            </div>

            {/* XP Progress */}
            <div className="space-y-2 pt-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Level Progress</span>
                <span className="font-semibold">
                  {profile.xp} / {nextLevelXP} XP
                </span>
              </div>
              <Progress value={xpProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>
        {/* Change Password Section */}
        {/* Change Password Section */}
        <Card className="glass-card border border-border/40 max-w-4xl mx-auto transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.3)]">
          <CardContent className="p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" /> Change Password
              </h2>
              {changing && (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              )}
            </div>

            {/* Status Alerts */}
            {errorMsg && (
              <Alert variant="destructive" className="animate-fade-in">
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}
            {message && (
              <Alert className="border border-green-500/40 bg-green-500/10 animate-fade-in">
                <AlertDescription className="text-green-600">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            {/* Inputs Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  key: "current",
                  placeholder: "Current Password",
                  value: passwordData.currentPassword,
                },
                {
                  key: "new",
                  placeholder: "New Password",
                  value: passwordData.newPassword,
                },
                {
                  key: "confirm",
                  placeholder: "Confirm Password",
                  value: passwordData.confirmPassword,
                },
              ].map((field) => (
                <div key={field.key} className="relative group">
                  <Input
                    type={
                      showPassword[field.key as keyof typeof showPassword]
                        ? "text"
                        : "password"
                    }
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        [`${field.key}Password`]: e.target.value,
                      } as typeof passwordData)
                    }
                    className="pr-10 focus:ring-2 focus:ring-primary/40 transition-all"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-primary transition-colors"
                    onClick={() =>
                      setShowPassword({
                        ...showPassword,
                        [field.key]:
                          !showPassword[field.key as keyof typeof showPassword],
                      })
                    }>
                    {showPassword[field.key as keyof typeof showPassword] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>

            {/* Action Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleChangePassword}
                disabled={changing}
                className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all rounded-lg shadow-md">
                {changing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Change Password
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
