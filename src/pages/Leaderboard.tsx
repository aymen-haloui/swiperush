import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Trophy,
  Medal,
  Award,
  Zap,
  Loader2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";
import { useLeaderboard } from "@/hooks/useApi";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const Leaderboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    setIsAuthenticated(!!token); // true if token exists
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setIsAuthenticated(false);

    toast({
      title: t('notifications.logoutSuccess.title'),
      description: t('notifications.logoutSuccess.description'),
      duration: 2500,
      className:
        "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100",
    });

    navigate("/");
  };
  const navigate = useNavigate();
  const { data, isLoading, error } = useLeaderboard("ALL_TIME", 50);
  const globalLeaderboard = (data?.leaderboard || []).map((u, idx) => ({
    rank: idx + 1,
    username: u.username,
    xp: u.xp,
    level: u.level,
    completedChallenges: u.completedChallenges,
  }));

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-accent" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-muted-foreground" />;
    if (rank === 3) return <Award className="w-6 h-6 text-[#CD7F32]" />;
    return <span className="font-bold text-muted-foreground">#{rank}</span>;
  };

  const getRankClass = (rank: number) => {
    if (rank === 1) return "border-accent shadow-[var(--shadow-glow-accent)]";
    if (rank === 2) return "border-muted-foreground/50";
    if (rank === 3) return "border-[#CD7F32]/50";
    return "border-border/50";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar variant="client" />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 flex-1">
        {isLoading && (
          <div className="text-center py-8 sm:py-16">
            <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-muted-foreground">Loading leaderboard...</p>
          </div>
        )}
        {error && !isLoading && (
          <div className="text-center py-8 sm:py-16 text-muted-foreground text-sm sm:text-base">
            Failed to load leaderboard.
          </div>
        )}
        {/* Hero Section */}
        <div className="text-center mb-6 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 mb-3 sm:mb-4">
            <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-accent" />
            <span className="text-xs sm:text-sm font-semibold text-primary">
              Global Rankings
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-2 sm:mb-4">
            <span className="bg-gradient-to-r from-[hsl(263,70%,60%)] to-[hsl(190,95%,60%)] bg-clip-text text-transparent">
              Leaderboard
            </span>
          </h1>

          <p className="text-sm sm:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
            Compete with the best challengers worldwide and claim your spot at
            the top
          </p>
        </div>

        {/* Top 3 Podium */}
        {!!globalLeaderboard.length && (
          <div className="grid md:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-12">
            {globalLeaderboard.slice(0, 3).map((player, index) => {
              const positions = [1, 0, 2]; // Reorder for podium effect (2nd, 1st, 3rd)
              const actualIndex = positions.indexOf(index);
              const playerData = globalLeaderboard[actualIndex];

              return (
                <div
                  key={playerData.rank}
                  className={`glass-card rounded-xl p-6 border-2 ${getRankClass(
                    playerData.rank
                  )} ${playerData.rank === 1 ? "md:-mt-4" : "md:mt-4"}`}>
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[var(--shadow-glow-primary)]">
                      {getRankIcon(playerData.rank)}
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      {playerData.username}
                    </h3>
                    <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-semibold mb-4">
                      <Zap className="w-3 h-3" />
                      {playerData.xp} XP
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Level</p>
                        <p className="font-bold text-lg">{playerData.level}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Completed</p>
                        <p className="font-bold text-lg">
                          {playerData.completedChallenges}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Leaderboard Tabs */}
        <Tabs defaultValue="all" className="space-y-3 sm:space-y-6">
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <TabsList className="glass-card w-max sm:w-auto inline-flex h-9 sm:h-10 p-1">
              <TabsTrigger value="all" className="text-xs sm:text-sm px-3 sm:px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                All Time
              </TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs sm:text-sm px-3 sm:px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                This Week
              </TabsTrigger>
              <TabsTrigger value="challenge" className="text-xs sm:text-sm px-3 sm:px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                Current Challenge
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-3">
            {globalLeaderboard.slice(3).map((player) => (
              <Card
                key={player.rank}
                className="glass-card border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex items-center justify-center">
                        {getRankIcon(player.rank)}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{player.username}</h3>
                        <p className="text-sm text-muted-foreground">
                          Level {player.level}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 text-sm">
                      <div className="text-center hidden md:block">
                        <p className="text-muted-foreground">Level</p>
                        <p className="font-bold">{player.level}</p>
                      </div>
                      <div className="text-center hidden md:block">
                        <p className="text-muted-foreground">Completed</p>
                        <p className="font-bold">
                          {player.completedChallenges}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">XP</p>
                        <p className="font-bold text-accent">{player.xp}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="weekly">
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Weekly leaderboard will be updated soon!</p>
            </div>
          </TabsContent>

          <TabsContent value="challenge">
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Select a challenge to view its leaderboard</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <div className="glass-card rounded-xl sm:rounded-2xl p-4 sm:p-8 text-center mt-6 sm:mt-12 border-2 border-primary/20">
          <h2 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-4">
            Think you can <span className="text-primary">compete?</span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            Join now and start climbing the ranks!
          </p>
          <Button
            variant="hero"
            size="default"
            className="text-sm sm:text-base h-9 sm:h-10"
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/register")}>
            {isAuthenticated ? "Go to Dashboard" : "Start Competing"}
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Leaderboard;
