import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Calendar,
  Shield,
  KeyRound,
  Trophy,
  Zap,
  Target,
  Award,
  Activity,
  User,
  Edit,
  UserCircle,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import logger from "@/lib/logger";
import { API_BASE_URL } from '@/lib/config';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfile, useAuth, useUserChallenges, useUserRank, useUpdateProfile } from "@/hooks/useApi";
import { useTranslation } from "react-i18next";

const Profile = () => {
  logger.debug('🌍 API base URL =', API_BASE_URL);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();

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
  const [changingEmail, setChangingEmail] = useState(false);
  const [changingUsername, setChangingUsername] = useState(false);
  const [emailData, setEmailData] = useState({
    newEmail: "",
    confirmEmail: "",
  });
  const [usernameData, setUsernameData] = useState({
    newUsername: "",
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  // Load user profile and challenges
  const { data: profile, isLoading, error } = useProfile();
  const { data: userChallenges, isLoading: challengesLoading } = useUserChallenges();
  const { data: userRank } = useUserRank('ALL_TIME');
  const updateProfileMutation = useUpdateProfile();

  // Redirect if not authenticated
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) navigate("/login");
  }, [navigate]);

  // Calculate stats
  const stats = {
    totalXP: profile?.xp || 0,
    level: profile?.level || 1,
    rank: userRank?.rank || profile?.rank || null,
    activeChallenges: userChallenges?.filter(c => c.status === 'ACTIVE').length || 0,
    completedChallenges: userChallenges?.filter(c => c.status === 'COMPLETED').length || 0,
    totalChallenges: userChallenges?.length || 0,
  };

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
      toast({
        title: t('notifications.missingFields.title'),
        description: t('notifications.missingFields.description', { error: 'Please fill in all password fields.' }),
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: t('notifications.passwordsDontMatch.title'),
        description: t('notifications.passwordsDontMatch.description') || 'Make sure the new and confirm passwords are identical.',
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      setChanging(true);

  const token = localStorage.getItem("auth_token");
  const baseUrl = API_BASE_URL;
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
        toast({
          title: t('notifications.passwordChanged.title'),
          description: t('notifications.passwordChanged.description') || 'Your password has been updated securely.',
          duration: 3000,
          className:
            "border-green-500 bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-100",
        });

        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast({
          title: t('notifications.passwordChangeFailed.title'),
          description: data.message || t('notifications.passwordChangeFailed.description'),
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch {
      toast({
        title: t('notifications.networkError.title'),
        description: t('notifications.networkError.description'),
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setChanging(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!emailData.newEmail || !emailData.confirmEmail) {
      toast({
        title: t('notifications.missingFields.title'),
        description: t('notifications.missingFields.description', { error: 'Please fill in both email fields.' }),
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (emailData.newEmail !== emailData.confirmEmail) {
      toast({
        title: t('notifications.passwordsDontMatch.title'),
        description: t('notifications.passwordsDontMatch.description') || 'Make sure both email addresses are identical.',
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.newEmail)) {
      toast({
        title: t('notifications.genericError.title'),
        description: t('notifications.genericError.description') || 'Please enter a valid email address.',
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (emailData.newEmail === profile?.email) {
      toast({
        title: t('notifications.genericError.title'),
        description: t('notifications.genericError.description') || 'This is already your current email address.',
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      setChangingEmail(true);
      await updateProfileMutation.mutateAsync({ email: emailData.newEmail });
      
      toast({
        title: t('notifications.emailChanged.title'),
        description: t('notifications.emailChanged.description') || 'Your email address has been updated.',
        duration: 3000,
        className:
          "border-green-500 bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-100",
      });

      setEmailData({
        newEmail: "",
        confirmEmail: "",
      });
    } catch (error: any) {
      toast({
        title: t('notifications.emailChangeFailed.title'),
        description: error?.response?.data?.message || error?.message || t('notifications.emailChangeFailed.description'),
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setChangingEmail(false);
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast({
        title: t('notifications.genericError.title'),
        description: t('notifications.genericError.description') || 'Please select an image file (PNG, JPG, GIF, or WEBP).',
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('notifications.fileTooLarge.title'),
        description: t('notifications.fileTooLarge.description'),
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setProfilePicture(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicturePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadProfilePicture = async () => {
    if (!profilePicture) {
      toast({
        title: t('notifications.genericError.title'),
        description: t('notifications.genericError.description') || 'Please select a profile picture to upload.',
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      setUploadingPicture(true);
      const imageData = await fileToBase64(profilePicture);
      await updateProfileMutation.mutateAsync({ avatar: imageData });
      
      toast({
        title: t('notifications.profilePicUpdated.title'),
        description: t('notifications.profilePicUpdated.description') || 'Your profile picture has been updated successfully.',
        duration: 3000,
        className:
          "border-green-500 bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-100",
      });

      // Clear the file input and preview
      setProfilePicture(null);
      setProfilePicturePreview(null);
      
      // Reset file input
      const fileInput = document.getElementById('profile-picture-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      toast({
        title: t('notifications.uploadFailed.title'),
        description: error?.response?.data?.message || error?.message || t('notifications.uploadFailed.description'),
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleChangeUsername = async () => {
    if (!usernameData.newUsername) {
      toast({
        title: t('notifications.missingFields.title'),
        description: t('notifications.missingFields.description', { error: 'Please enter a new username.' }),
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Basic username validation
    if (usernameData.newUsername.length < 3) {
      toast({
        title: t('notifications.genericError.title'),
        description: t('notifications.genericError.description') || 'Username must be at least 3 characters long.',
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (usernameData.newUsername === profile?.username) {
      toast({
        title: t('notifications.genericError.title'),
        description: t('notifications.genericError.description') || 'This is already your current username.',
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    try {
      setChangingUsername(true);
      await updateProfileMutation.mutateAsync({ username: usernameData.newUsername });
      
      toast({
        title: t('notifications.usernameChanged.title'),
        description: t('notifications.usernameChanged.description') || 'Your username has been updated.',
        duration: 3000,
        className:
          "border-green-500 bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-100",
      });

      setUsernameData({
        newUsername: "",
      });
    } catch (error: any) {
      toast({
        title: t('notifications.usernameChangeFailed.title'),
        description: error?.response?.data?.message || error?.message || t('notifications.usernameChangeFailed.description'),
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setChangingUsername(false);
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
    <div className="min-h-screen flex flex-col">
      <Navbar variant="client" />

      {/* Profile Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-10 space-y-4 sm:space-y-8 max-w-6xl">
        {/* Profile Header */}
        <Card className="glass-card border border-primary/20 rounded-xl">
          <CardContent className="p-4 sm:p-8">
            <div className="flex flex-col md:flex-row items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[var(--shadow-glow-primary)] border-2 sm:border-4 border-background">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="avatar"
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 sm:w-16 sm:h-16 text-primary-foreground" />
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-3 mb-1 sm:mb-2 flex-wrap">
                  <h1 className="text-2xl sm:text-4xl font-bold">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  {profile.isAdmin && (
                    <Badge className="bg-accent text-accent-foreground text-xs sm:text-sm">
                      <Shield className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm sm:text-lg mb-2 sm:mb-3">@{profile.username}</p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                  </div>
                  {stats.rank && (
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-accent" />
                      <span>Rank #{stats.rank}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* XP Progress */}
            <div className="space-y-2 pt-4 border-t border-border/50">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  Level {stats.level} Progress
                </span>
                <span className="font-semibold">
                  {profile.xp} / {nextLevelXP} XP
                </span>
              </div>
              <Progress value={xpProgress} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{nextLevelXP - profile.xp} XP until Level {stats.level + 1}</span>
                <span>{Math.round(xpProgress)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <Card className="glass-card border-primary/20">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                <span className="text-lg sm:text-2xl font-bold">{stats.totalXP}</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Total XP</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-secondary/20">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
                <span className="text-lg sm:text-2xl font-bold">{stats.level}</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Level</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-accent/20">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
                <span className="text-lg sm:text-2xl font-bold">{stats.activeChallenges}</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card className="glass-card border-success/20">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center justify-between mb-1 sm:mb-2">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                <span className="text-lg sm:text-2xl font-bold">{stats.completedChallenges}</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Challenges and Settings */}
        <Tabs defaultValue="challenges" className="space-y-6">
          <TabsList className="glass-card">
            <TabsTrigger value="challenges">
              <Activity className="w-4 h-4 mr-2" />
              My Challenges ({stats.totalChallenges})
            </TabsTrigger>
            <TabsTrigger value="settings">
              <KeyRound className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="challenges" className="space-y-6">
            {challengesLoading ? (
              <Card className="glass-card">
                <CardContent className="p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading your challenges...</p>
                </CardContent>
              </Card>
            ) : stats.totalChallenges === 0 ? (
              <Card className="glass-card">
                <CardContent className="p-12 text-center">
                  <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">No Challenges Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start your journey by joining a challenge from the dashboard!
                  </p>
                  <Button variant="hero" onClick={() => navigate("/dashboard")}>
                    Browse Challenges
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Active Challenges */}
                {stats.activeChallenges > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <Activity className="w-6 h-6 text-primary" />
                      Active Challenges ({stats.activeChallenges})
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      {userChallenges
                        ?.filter(c => c.status === 'ACTIVE')
                        .map((userChallenge) => {
                          const completedStages = userChallenge.stages.filter(
                            s => s.status === 'COMPLETED'
                          ).length;
                          const totalStages = userChallenge.challenge?.stages?.length || 0;
                          const progress = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;
                          
                          if (!userChallenge.challenge) return null;
                          
                          return (
                            <Card key={userChallenge.id} className="glass-card border-primary/20 hover:border-primary/50 transition-all">
                              <CardHeader>
                                <div className="flex items-start justify-between mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    {userChallenge.challenge.category || 'Challenge'}
                                  </Badge>
                                  <Badge className="bg-primary text-primary-foreground">
                                    ACTIVE
                                  </Badge>
                                </div>
                                <CardTitle className="text-lg">{userChallenge.challenge.title}</CardTitle>
                                <CardDescription className="line-clamp-2">
                                  {userChallenge.challenge.description || 'No description'}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Progress</span>
                                    <span>{completedStages}/{totalStages} stages</span>
                                  </div>
                                  <Progress value={progress} className="h-2" />
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Trophy className="w-4 h-4 text-accent" />
                                  <span>{userChallenge.challenge.xpReward || 0} XP reward</span>
                                </div>
                                <Button 
                                  variant="hero" 
                                  className="w-full"
                                  onClick={() => navigate(`/challenge/${userChallenge.challengeId}`)}
                                >
                                  Continue Challenge
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        })
                        .filter(Boolean)}
                    </div>
                  </div>
                )}

                {/* Completed Challenges */}
                {stats.completedChallenges > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <Trophy className="w-6 h-6 text-success" />
                      Completed Challenges ({stats.completedChallenges})
                    </h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      {userChallenges
                        ?.filter(c => c.status === 'COMPLETED')
                        .slice(0, 6)
                        .map((userChallenge) => {
                          if (!userChallenge.challenge) return null;
                          return (
                            <Card key={userChallenge.id} className="glass-card border-success/20 hover:border-success/50 transition-all">
                              <CardHeader>
                                <div className="flex items-start justify-between mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    {userChallenge.challenge.category || 'Challenge'}
                                  </Badge>
                                  <Badge className="bg-success text-success-foreground">
                                    COMPLETED
                                  </Badge>
                                </div>
                                <CardTitle className="text-lg">{userChallenge.challenge.title}</CardTitle>
                                <CardDescription className="line-clamp-2">
                                  {userChallenge.challenge.description || 'No description'}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Trophy className="w-4 h-4 text-accent" />
                                  <span>Earned {userChallenge.challenge.xpReward || 0} XP</span>
                                </div>
                                {userChallenge.completedAt && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    <span>Completed {new Date(userChallenge.completedAt).toLocaleDateString()}</span>
                                  </div>
                                )}
                                <Button 
                                  variant="outline" 
                                  className="w-full"
                                  onClick={() => navigate(`/challenge/${userChallenge.challengeId}`)}
                                >
                                  View Details
                                </Button>
                              </CardContent>
                            </Card>
                          );
                        })
                        .filter(Boolean)}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Change Profile Picture Section */}
            <Card className="glass-card border border-border/40 transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.3)]">
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" /> Profile Picture
                  </h2>
                  {uploadingPicture && (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  )}
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Current/Preview Avatar */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[var(--shadow-glow-primary)] border-4 border-background overflow-hidden">
                      {profilePicturePreview ? (
                        <img
                          src={profilePicturePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : profile?.avatar ? (
                        <img
                          src={profile.avatar}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-16 h-16 text-primary-foreground" />
                      )}
                    </div>
                    {profilePicturePreview && (
                      <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 border-4 border-background">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Upload Section */}
                  <div className="flex-1 space-y-4 w-full md:w-auto">
                    <div>
                      <label htmlFor="profile-picture-input" className="cursor-pointer">
                        <div className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-primary/50 rounded-lg hover:border-primary hover:bg-primary/5 transition-all">
                          <Upload className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium text-primary">
                            {profilePicture ? 'Change Picture' : 'Upload Picture'}
                          </span>
                        </div>
                      </label>
                      <input
                        id="profile-picture-input"
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                      <p className="text-xs text-muted-foreground mt-2 text-center md:text-left">
                        Supported formats: PNG, JPG, GIF, WEBP (Max 5MB)
                      </p>
                    </div>

                    {profilePicture && (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={handleUploadProfilePicture}
                          disabled={uploadingPicture}
                          className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-all rounded-lg shadow-md"
                        >
                          {uploadingPicture && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Upload Picture
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setProfilePicture(null);
                            setProfilePicturePreview(null);
                            const fileInput = document.getElementById('profile-picture-input') as HTMLInputElement;
                            if (fileInput) fileInput.value = '';
                          }}
                          disabled={uploadingPicture}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change Password Section */}
            <Card className="glass-card border border-border/40 transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.3)]">
          <CardContent className="p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" /> {t("profile.changePassword")}
              </h2>
              {changing && (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              )}
            </div>

            {/* Status Alerts */}

            {/* Inputs Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                {
                  key: "current",
                  placeholder: t("profile.currentPassword"),
                  value: passwordData.currentPassword,
                },
                {
                  key: "new",
                  placeholder: t("profile.newPassword"),
                  value: passwordData.newPassword,
                },
                {
                  key: "confirm",
                  placeholder: t("profile.confirmNewPassword"),
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
                className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-all rounded-lg shadow-md">
                {changing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Change Password
              </Button>
            </div>
          </CardContent>
            </Card>

            {/* Change Email Section */}
            <Card className="glass-card border border-border/40 transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.3)]">
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" /> Change Email
                  </h2>
                  {changingEmail && (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Current Email
                    </label>
                    <Input
                      type="email"
                      value={profile?.email || ""}
                      disabled
                      className="bg-muted/50"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        New Email
                      </label>
                      <Input
                        type="email"
                        placeholder="Enter new email"
                        value={emailData.newEmail}
                        onChange={(e) =>
                          setEmailData({ ...emailData, newEmail: e.target.value })
                        }
                        className="focus:ring-2 focus:ring-primary/40 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Confirm New Email
                      </label>
                      <Input
                        type="email"
                        placeholder="Confirm new email"
                        value={emailData.confirmEmail}
                        onChange={(e) =>
                          setEmailData({ ...emailData, confirmEmail: e.target.value })
                        }
                        className="focus:ring-2 focus:ring-primary/40 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleChangeEmail}
                    disabled={changingEmail}
                    className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-all rounded-lg shadow-md">
                    {changingEmail && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Change Email
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Change Username Section */}
            <Card className="glass-card border border-border/40 transition-all duration-300 hover:shadow-[0_0_25px_rgba(99,102,241,0.3)]">
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-primary" /> Change Username
                  </h2>
                  {changingUsername && (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      Current Username
                    </label>
                    <Input
                      type="text"
                      value={`@${profile?.username || ""}`}
                      disabled
                      className="bg-muted/50"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                      New Username
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter new username"
                      value={usernameData.newUsername}
                      onChange={(e) =>
                        setUsernameData({ newUsername: e.target.value })
                      }
                      className="focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Username must be at least 3 characters long.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleChangeUsername}
                    disabled={changingUsername}
                    className="px-6 py-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-all rounded-lg shadow-md">
                    {changingUsername && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Change Username
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
