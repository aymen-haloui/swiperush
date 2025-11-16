import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ChallengeCard from "@/components/ChallengeCard";
import { Search, Trophy, Zap, Target, LogOut, Loader2, Medal, Users, Award, Coins, Package, UserPlus, Settings, Flame, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import CircularProgress from "@/components/CircularProgress";
import { getLevelName } from "@/lib/levelNames";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  useProfile,
  useChallenges,
  useUserChallenges,
  useAuth,
  useCategories,
  useLevels,
} from "@/hooks/useApi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/ui/sonner";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout } = useAuth();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  // Fetch categories and levels from backend
  const { data: categories, isLoading: categoriesLoading } =
    useCategories(false);
  const { data: levels = [], isLoading: levelsLoading } = useLevels(false);

  // Fetch user profile and challenges
  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = useProfile();
  const {
    data: challengesData,
    isLoading: challengesLoading,
    error: challengesError,
  } = useChallenges({
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    difficulty: difficultyFilter !== "all" ? difficultyFilter : undefined,
    status: "all",
  });
  const { data: userChallenges, isLoading: userChallengesLoading } =
    useUserChallenges();

  // Get unique categories from existing challenges (for legacy support)
  const challengeCategories = React.useMemo(() => {
    if (!challengesData?.challenges) return [];
    const uniqueCategories = new Set<string>();
    challengesData.challenges.forEach((challenge) => {
      if (challenge.category) {
        uniqueCategories.add(challenge.category);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [challengesData]);

  // Combine categories from table and from challenges (avoid duplicates)
  const allCategories = React.useMemo(() => {
    const categoryMap = new Map<
      string,
      { name: string; icon?: string; isFromTable: boolean }
    >();

    // Add categories from Category table
    if (categories) {
      categories.forEach((cat) => {
        if (cat.isActive) {
          categoryMap.set(cat.name, {
            name: cat.name,
            icon: cat.icon,
            isFromTable: true,
          });
        }
      });
    }

    // Add categories from challenges (legacy support)
    challengeCategories.forEach((catName) => {
      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, { name: catName, isFromTable: false });
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [categories, challengeCategories]);

  const handleLogout = () => {
    logout();
    toast({
      title: "✅ Successfully logged out",
      description: "Hope to see you again soon!",
      duration: 2500,
      className:
        "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100",
    });

    navigate("/");
  };

  // adjust path if needed

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      const response = await apiClient.joinChallenge(challengeId);

      toast({
        title: "🎯 Challenge joined successfully!",
        description: `You’ve joined the challenge and can start progressing.`,
        duration: 2500,
        className:
          "border-green-500 bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-100",
      });

      // Wait for the toast to display before reloading
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong. Try again later.";
      toast({
        title: "⚠️ Failed to join challenge",
        description: errorMessage,
        duration: 3000,
        className:
          "border-red-500 bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-100",
      });
    }
  };

  const handleViewDetails = (challengeId: string) => {
    navigate(`/challenge/${challengeId}`);
  };

  // Helper function to calculate deadline text based on challenge status
  const getDeadlineText = (startDate: string, endDate: string): string => {
    const now = new Date().getTime();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    // Challenge hasn't started yet
    if (now < start) {
      const daysUntilStart = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
      return `Starts in ${daysUntilStart} ${
        daysUntilStart === 1 ? "day" : "days"
      }`;
    }

    // Challenge has ended
    if (now >= end) {
      return "Ended";
    }

    // Challenge is active
    const daysLeft = Math.max(
      0,
      Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    );
    return `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`;
  };

  // Filter challenges based on search query and user level
  const filteredChallenges =
    challengesData?.challenges.filter((challenge) => {
      // Filter by search query
      const matchesSearch =
        challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        challenge.description.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by user level - only show challenges user can join
      const canJoin =
        !profile || challenge.requiredLevel <= (profile.level || 1);

      return matchesSearch && canJoin;
    }) || [];

  // Get active challenges count
  const activeChallengesCount =
    userChallenges?.filter((cp) => cp.status === "ACTIVE").length || 0;
  
  // Get completed challenges count
  const completedChallengesCount =
    userChallenges?.filter((cp) => cp.status === "COMPLETED").length || 0;

  // Get available challenges count (challenges user can join)
  const availableChallengesCount = filteredChallenges?.filter((challenge) => {
    const now = new Date();
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);
    const isAvailable = now >= startDate && now <= endDate && challenge.isActive;
    const userHasJoined = userChallenges?.some((uc) => uc.challengeId === challenge.id);
    return isAvailable && !userHasJoined;
  }).length || 0;
  
  // Calculate currency (using XP as currency for now, can be extended)
  const currency = profile?.xp || 0;

  // Calculate XP progress based on actual level system
  const currentLevelInfo = React.useMemo(() => {
    if (!profile || levels.length === 0) return null;

    // Find the current level based on user's XP
    const currentLevel = levels.find(
      (level) =>
        level.isActive &&
        profile.xp >= level.minXP &&
        (level.maxXP === null ||
          level.maxXP === undefined ||
          profile.xp <= level.maxXP)
    );

    return (
      currentLevel || levels.find((l) => l.isActive && l.number === 1) || null
    );
  }, [profile, levels]);

  const nextLevelInfo = React.useMemo(() => {
    if (!currentLevelInfo || levels.length === 0) return null;

    // Find the next level
    const nextLevel = levels
      .filter((l) => l.isActive && l.number > currentLevelInfo.number)
      .sort((a, b) => a.number - b.number)[0];

    return nextLevel || null;
  }, [currentLevelInfo, levels]);

  // Calculate XP progress for current level
  const currentLevelXP = currentLevelInfo?.minXP || 0;
  const nextLevelXP =
    nextLevelInfo?.minXP ||
    (currentLevelInfo?.maxXP ?? currentLevelInfo?.minXP ?? 0);
  const xpProgress =
    profile && nextLevelXP > currentLevelXP
      ? Math.min(
          100,
          Math.max(
            0,
            ((profile.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) *
              100
          )
        )
      : 100;

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (profileError) {
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar variant="client" />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 flex-1">
        {/* Simplified User Stats Card */}
        <div className="relative rounded-2xl p-6 sm:p-10 mb-6 sm:mb-10 bg-gradient-to-br from-background/95 via-background/90 to-background/95 border-2 border-primary/30 shadow-xl dark:shadow-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 group/card">
          {/* Enhanced background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-50 group-hover/card:opacity-70 transition-opacity duration-300" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-secondary/3 opacity-30 group-hover/card:opacity-50 transition-opacity duration-300" />
          
          {/* Enhanced border glow */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 -z-10 blur-xl" />
          
          {/* Neon border effect for high-rank players */}
          {profile?.rank && profile.rank <= 10 && (
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/40 via-secondary/40 to-primary/40 opacity-0 group-hover/card:opacity-30 transition-opacity duration-500 -z-10 blur-2xl animate-pulse" />
          )}
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8 sm:gap-10">
              {/* Avatar with Circular Progress */}
              <div className="flex flex-col items-center gap-5">
                <div className="relative group">
                  <CircularProgress
                    value={xpProgress}
                    size={120}
                    strokeWidth={4}
                    className="sm:w-40 sm:h-40"
                    currentColor="text-primary"
                    remainingColor="text-muted/30"
                  >
                    <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center overflow-hidden border-[3px] border-background flex-shrink-0 shadow-lg transition-all duration-300 group-hover:scale-105 ${profile?.rank && profile.rank <= 10 ? 'shadow-[0_0_40px_rgba(139,92,246,0.7)] ring-[3px] ring-primary/60 animate-pulse' : 'shadow-[0_0_20px_rgba(139,92,246,0.3)]'}`}>
                      {profile?.avatar ? (
                        <img
                          src={profile.avatar}
                          alt={profile.username || "User"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-primary-foreground" />
                      )}
                    </div>
                  </CircularProgress>
                </div>
              </div>
              
              {/* Profile Info */}
              <div className="flex-1 w-full md:w-auto text-center md:text-left space-y-4 sm:space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-center md:justify-start gap-4 flex-wrap">
                    <h2 className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text tracking-tight">
                      {profile?.username || t("dashboard.welcome")}
                    </h2>
                    {currentLevelInfo && (
                      <Badge className="bg-gradient-to-r from-primary/25 to-secondary/25 text-foreground border-2 border-primary/40 px-4 py-1.5 text-sm font-semibold shadow-md">
                        {getLevelName(currentLevelInfo.number)}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Extra Profile Info Row */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm sm:text-base">
                    {profile?.rank && (
                      <div className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors duration-200 cursor-default group/rank">
                        <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-accent group-hover/rank:scale-110 transition-transform duration-200" />
                        <span className="font-medium">Rank #{profile.rank}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-200 cursor-default group/challenges">
                      <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary group-hover/challenges:scale-110 transition-transform duration-200" />
                      <span className="font-medium">{availableChallengesCount} Available</span>
                    </div>
                    {profile?.rank && (
                      <div className="flex items-center gap-2 text-muted-foreground hover:text-secondary transition-colors duration-200 cursor-default group/leaderboard">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-secondary group-hover/leaderboard:scale-110 transition-transform duration-200" />
                        <span className="font-medium">#{profile.rank} Leaderboard</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* XP Progress */}
                <div className="space-y-3 pt-3 border-t-2 border-border/60 group/xp">
                  <div className="flex items-center justify-between text-base sm:text-lg">
                    <span className="text-muted-foreground font-medium group-hover/xp:text-foreground transition-colors duration-200">XP Progress</span>
                    <span className="font-bold text-primary text-lg sm:text-xl group-hover/xp:scale-110 transition-transform duration-200">{Math.round(xpProgress)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <span className="font-semibold text-foreground group-hover/xp:text-primary transition-colors duration-200">{profile?.xp || 0} / {nextLevelXP || "∞"} XP</span>
                    <span className="font-medium text-muted-foreground group-hover/xp:text-foreground transition-colors duration-200">{nextLevelInfo ? `→ ${getLevelName(nextLevelInfo.number)}` : 'Max Level'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4 mb-6 sm:mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground" />
            <Input
              placeholder={t("dashboard.searchChallenges")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 sm:pl-12 h-11 sm:h-12 text-sm sm:text-base rounded-xl border-2 shadow-sm focus:shadow-md focus:border-primary/50 transition-all"
            />
          </div>
          <div className="flex gap-3">
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              disabled={categoriesLoading || challengesLoading}>
              <SelectTrigger className="md:w-[220px] h-11 sm:h-12 text-sm sm:text-base rounded-xl border-2 shadow-sm hover:shadow-md focus:shadow-md focus:border-primary/50 transition-all">
                <SelectValue placeholder={t("dashboard.category")}>
                  {categoryFilter !== "all" && allCategories.find(c => c.name === categoryFilter) ? (
                    <>
                      {allCategories.find(c => c.name === categoryFilter)?.icon && (
                        <span className="mr-2">{allCategories.find(c => c.name === categoryFilter)?.icon}</span>
                      )}
                      {allCategories.find(c => c.name === categoryFilter)?.name}
                    </>
                  ) : (
                    t("dashboard.category")
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("dashboard.allCategories")}
                </SelectItem>
                {allCategories.length > 0
                  ? allCategories.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>
                        {cat.icon && <span className="mr-2">{cat.icon}</span>}
                        {cat.name}
                      </SelectItem>
                    ))
                  : !categoriesLoading &&
                    !challengesLoading && (
                      <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                        No levels available
                      </div>
                    )}
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="md:w-[220px] h-11 sm:h-12 text-sm sm:text-base rounded-xl border-2 shadow-sm hover:shadow-md focus:shadow-md focus:border-primary/50 transition-all">
                <SelectValue placeholder={t("dashboard.difficulty")}>
                  {difficultyFilter !== "all" ? (
                    <>
                      <span className="mr-2">
                        {difficultyFilter === "easy" ? "🟢" : difficultyFilter === "medium" ? "🟡" : difficultyFilter === "hard" ? "🔴" : ""}
                      </span>
                      {difficultyFilter === "easy" ? t("dashboard.easy") : difficultyFilter === "medium" ? t("dashboard.medium") : difficultyFilter === "hard" ? t("dashboard.hard") : t("dashboard.difficulty")}
                    </>
                  ) : (
                    t("dashboard.difficulty")
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("dashboard.allDifficulties")}
                </SelectItem>
                <SelectItem value="easy">{t("dashboard.easy")}</SelectItem>
                <SelectItem value="medium">{t("dashboard.medium")}</SelectItem>
                <SelectItem value="hard">{t("dashboard.hard")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Challenges Tabs */}
        <Tabs defaultValue="all" className="space-y-4 sm:space-y-8">
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <TabsList className="glass-card w-max sm:w-auto inline-flex h-auto p-1.5 sm:p-2 gap-2 rounded-2xl border border-primary/20 shadow-lg">
              <TabsTrigger 
                value="all" 
                className="text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-secondary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_20px_rgba(139,92,246,0.4)] data-[state=active]:border data-[state=active]:border-primary/40 transition-all duration-200 font-semibold"
              >
                {t("dashboard.availableChallenges")}
              </TabsTrigger>
              <TabsTrigger 
                value="active" 
                className="text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-secondary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_20px_rgba(139,92,246,0.4)] data-[state=active]:border data-[state=active]:border-primary/40 transition-all duration-200 font-semibold"
              >
                {t("dashboard.activeChallenges")} <span className="hidden sm:inline">({activeChallengesCount})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-secondary/20 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_20px_rgba(139,92,246,0.4)] data-[state=active]:border data-[state=active]:border-primary/40 transition-all duration-200 font-semibold"
              >
                {t("dashboard.completedChallenges")}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-4 sm:mt-8">
            {challengesLoading ? (
              <div className="text-center py-12 sm:py-16">
                <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin mx-auto mb-4 sm:mb-6" />
                <p className="text-sm sm:text-base text-muted-foreground">
                  {t("dashboard.loadingChallenges")}
                </p>
              </div>
            ) : challengesError ? (
              <Alert variant="destructive">
                <AlertDescription>
                  {t("dashboard.failedToLoadChallenges")}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {filteredChallenges.map((challenge) => {
                  const userProgress = userChallenges?.find(
                    (uc) => uc.challengeId === challenge.id
                  );
                  const status = userProgress
                    ? userProgress.status === "COMPLETED"
                      ? "completed"
                      : "active"
                    : "available";

                  const completedStages =
                    userProgress?.stages.filter((s) => s.status === "COMPLETED")
                      .length || 0;

                  return (
                    <ChallengeCard
                      key={challenge.id}
                      id={challenge.id}
                      title={challenge.title}
                      description={challenge.description}
                      category={challenge.category}
                      difficulty={
                        challenge.difficulty.toLowerCase() as
                          | "easy"
                          | "medium"
                          | "hard"
                      }
                      xpReward={challenge.xpReward}
                      image={challenge.image}
                      requiredLevel={challenge.requiredLevel}
                      deadline={getDeadlineText(
                        challenge.startDate,
                        challenge.endDate
                      )}
                      participants={challenge._count.progress}
                      status={status as "available" | "active" | "completed"}
                      stagesCompleted={completedStages}
                      totalStages={challenge.stages.length}
                      onJoin={() => handleJoinChallenge(challenge.id)}
                      onViewDetails={() => handleViewDetails(challenge.id)}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-4 sm:mt-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {userChallenges
                ?.filter((uc) => uc.status === "ACTIVE")
                .map((userChallenge) => {
                  const challenge = challengesData?.challenges.find(
                    (c) => c.id === userChallenge.challengeId
                  );
                  if (!challenge) return null;

                  const completedStages = userChallenge.stages.filter(
                    (s) => s.status === "COMPLETED"
                  ).length;

                  return (
                    <ChallengeCard
                      key={challenge.id}
                      id={challenge.id}
                      title={challenge.title}
                      description={challenge.description}
                      category={challenge.category}
                      difficulty={
                        challenge.difficulty.toLowerCase() as
                          | "easy"
                          | "medium"
                          | "hard"
                      }
                      xpReward={challenge.xpReward}
                      image={challenge.image}
                      requiredLevel={challenge.requiredLevel}
                      deadline={getDeadlineText(
                        challenge.startDate,
                        challenge.endDate
                      )}
                      participants={challenge._count.progress}
                      status="active"
                      stagesCompleted={completedStages}
                      totalStages={challenge.stages.length}
                      onViewDetails={() => handleViewDetails(challenge.id)}
                    />
                  );
                })}
            </div>
          </TabsContent>

          <TabsContent value="available" className="mt-4 sm:mt-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {filteredChallenges
                .filter((challenge) => {
                  // Not already joined
                  const notJoined = !userChallenges?.some(
                    (uc) => uc.challengeId === challenge.id
                  );
                  // User level is sufficient
                  const canJoin =
                    !profile || challenge.requiredLevel <= (profile.level || 1);
                  return notJoined && canJoin;
                })
                .map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    id={challenge.id}
                    title={challenge.title}
                    description={challenge.description}
                    category={challenge.category}
                    difficulty={
                      challenge.difficulty.toLowerCase() as
                        | "easy"
                        | "medium"
                        | "hard"
                    }
                    xpReward={challenge.xpReward}
                    image={challenge.image}
                    deadline={getDeadlineText(
                      challenge.startDate,
                      challenge.endDate
                    )}
                    participants={challenge._count.progress}
                    status="available"
                    onJoin={() => handleJoinChallenge(challenge.id)}
                    onViewDetails={() => handleViewDetails(challenge.id)}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-4 sm:mt-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {userChallenges
                ?.filter((uc) => uc.status === "COMPLETED")
                .map((userChallenge) => {
                  const challenge = challengesData?.challenges.find(
                    (c) => c.id === userChallenge.challengeId
                  );
                  if (!challenge) return null;

                  return (
                    <ChallengeCard
                      key={challenge.id}
                      id={challenge.id}
                      title={challenge.title}
                      description={challenge.description}
                      category={challenge.category}
                      difficulty={
                        challenge.difficulty.toLowerCase() as
                          | "easy"
                          | "medium"
                          | "hard"
                      }
                      xpReward={challenge.xpReward}
                      image={challenge.image}
                      requiredLevel={challenge.requiredLevel}
                      deadline="Completed"
                      participants={challenge._count.progress}
                      status="completed"
                      stagesCompleted={challenge.stages.length}
                      totalStages={challenge.stages.length}
                      onViewDetails={() => handleViewDetails(challenge.id)}
                    />
                  );
                })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Dashboard;
