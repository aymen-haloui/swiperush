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
import { Search, Trophy, Zap, Target, LogOut, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
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
        {/* User Stats */}
        <div className="glass-card rounded-xl p-3 sm:p-6 mb-4 sm:mb-8 border border-primary/20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-6">
            <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[var(--shadow-glow-primary)] overflow-hidden border-2 border-background flex-shrink-0">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.username || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-2xl font-bold truncate">
                  {profile?.username || t("dashboard.welcome")}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {profile?.rank
                    ? `${t("leaderboard.rank")} #${profile.rank}`
                    : t("leaderboard.unranked")}
                </p>
                {/* Mobile: Level Progress inline */}
                <div className="md:hidden mt-1">
                  {currentLevelInfo && (
                    <span className="text-xs text-muted-foreground">
                      Level {currentLevelInfo.number}: {profile?.xp || 0}/{nextLevelXP || "∞"} XP
                    </span>
                  )}
                  <Progress value={xpProgress} className="h-1.5 mt-1" />
                </div>
              </div>
            </div>

            {/* Desktop: Level Progress */}
            <div className="hidden md:flex flex-1 max-w-md space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("dashboard.levelProgress")}
                </span>
                <span className="font-semibold">
                  {profile?.xp || 0} / {nextLevelXP || "∞"}{" "}
                  {t("leaderboard.xp")}
                  {currentLevelInfo && (
                    <span className="text-xs text-muted-foreground ml-2">
                      (Level {currentLevelInfo.number}: {currentLevelInfo.name})
                    </span>
                  )}
                </span>
              </div>
              <Progress value={xpProgress} className="h-3" />
            </div>

            {/* XP and Active Challenges - Inline on mobile */}
            <div className="flex md:grid md:grid-cols-2 gap-2 sm:gap-4 w-full md:w-auto">
              <div className="flex items-center gap-1 sm:gap-2 text-accent flex-1 md:flex-col md:text-center">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="text-base sm:text-2xl font-bold">{profile?.xp || 0}</span>
                <span className="text-xs text-muted-foreground hidden sm:inline md:block">
                  {t("dashboard.totalXP")}
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-secondary flex-1 md:flex-col md:text-center">
                <Target className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="text-base sm:text-2xl font-bold">
                  {activeChallengesCount}
                </span>
                <span className="text-xs text-muted-foreground hidden sm:inline md:block">
                  {t("dashboard.activeChallenges")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-2 sm:left-3 top-2.5 sm:top-3 h-3.5 sm:h-4 w-3.5 sm:w-4 text-muted-foreground" />
            <Input
              placeholder={t("dashboard.searchChallenges")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 sm:pl-10 h-9 sm:h-10 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
              disabled={categoriesLoading || challengesLoading}>
              <SelectTrigger className="md:w-[200px] h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder={t("dashboard.category")} />
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
              <SelectTrigger className="md:w-[200px] h-9 sm:h-10 text-xs sm:text-sm">
                <SelectValue placeholder={t("dashboard.difficulty")} />
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
        <Tabs defaultValue="all" className="space-y-3 sm:space-y-6">
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <TabsList className="glass-card w-max sm:w-auto inline-flex h-9 sm:h-10 p-1">
              <TabsTrigger value="all" className="text-xs sm:text-sm px-3 sm:px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                {t("dashboard.availableChallenges")}
              </TabsTrigger>
              <TabsTrigger value="active" className="text-xs sm:text-sm px-3 sm:px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                {t("dashboard.activeChallenges")} <span className="hidden sm:inline">({activeChallengesCount})</span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs sm:text-sm px-3 sm:px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                {t("dashboard.completedChallenges")}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-3 sm:space-y-6 mt-3 sm:mt-6">
            {challengesLoading ? (
              <div className="text-center py-8 sm:py-12">
                <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto mb-3 sm:mb-4" />
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
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
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

          <TabsContent value="active" className="mt-3 sm:mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
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

          <TabsContent value="available" className="mt-3 sm:mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
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

          <TabsContent value="completed" className="mt-3 sm:mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
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
