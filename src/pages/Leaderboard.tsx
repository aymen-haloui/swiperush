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
  Crown,
  Trophy,
  Medal,
  Award,
  Zap,
  Loader2,
  LogOut,
} from "lucide-react";
import { useLeaderboard } from "@/hooks/useApi";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const Leaderboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    setIsAuthenticated(!!token); // true if token exists
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setIsAuthenticated(false);

    toast({
      title: "✅ Successfully logged out",
      description: "Hope to see you again soon!",
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}>
            <Crown className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-[hsl(263,70%,60%)] to-[hsl(190,95%,60%)] bg-clip-text text-transparent">
              ChallengeQuest
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>

            {!isAuthenticated && (
              <Button variant="glass" onClick={() => navigate("/login")}>
                Sign In
              </Button>
            )}
            {isAuthenticated && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Logout</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {isLoading && (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading leaderboard...</p>
          </div>
        )}
        {error && !isLoading && (
          <div className="text-center py-16 text-muted-foreground">
            Failed to load leaderboard.
          </div>
        )}
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Trophy className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-primary">
              Global Rankings
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[hsl(263,70%,60%)] to-[hsl(190,95%,60%)] bg-clip-text text-transparent">
              Leaderboard
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Compete with the best challengers worldwide and claim your spot at
            the top
          </p>
        </div>

        {/* Top 3 Podium */}
        {!!globalLeaderboard.length && (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
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
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="glass-card">
            <TabsTrigger value="all">All Time</TabsTrigger>
            <TabsTrigger value="weekly">This Week</TabsTrigger>
            <TabsTrigger value="challenge">Current Challenge</TabsTrigger>
          </TabsList>

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
        <div className="glass-card rounded-2xl p-8 text-center mt-12 border-2 border-primary/20">
          <h2 className="text-2xl font-bold mb-4">
            Think you can <span className="text-primary">compete?</span>
          </h2>
          <p className="text-muted-foreground mb-6">
            Join now and start climbing the ranks!
          </p>
          <Button
            variant="hero"
            size="lg"
            onClick={() => navigate("/register")}>
            Start Competing
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
