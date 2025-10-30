import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Trophy,
  Users,
  Clock,
  MapPin,
  CheckCircle,
  Circle,
  Lock,
  QrCode,
  Upload,
  Navigation,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
// 👈 make sure this function exists
import { getChallengeById } from "@/lib/api";
const ChallengeDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Fetch challenge from backend

  useEffect(() => {
    const fetchChallenge = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await getChallengeById(id);
        setChallenge(response); // ✅ set the state with the fetched data
      } catch (err) {
        console.error(err);
        setError("An error occurred while loading challenge data.");
      } finally {
        setLoading(false);
      }
    };
    fetchChallenge();
  }, [id]);

  // ✅ Stage icon display
  const getStageIcon = (status: string) => {
    if (status === "completed")
      return <CheckCircle className="w-5 h-5 text-success" />;
    if (status === "active")
      return <Circle className="w-5 h-5 text-secondary" />;
    return <Lock className="w-5 h-5 text-muted-foreground" />;
  };

  // ✅ Handle loading and errors
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading challenge...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );

  if (!challenge)
    return (
      <div className="flex justify-center items-center h-screen text-gray-400">
        Challenge not found.
      </div>
    );

  const progress =
    challenge.stages?.length > 0
      ? (challenge.stages.filter((s: any) => s.status === "completed").length /
          challenge.stages.length) *
        100
      : 0;

  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(challenge.endDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );
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
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Challenge Header */}
        <div className="glass-card rounded-xl p-8 mb-8 border border-primary/20">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline">{challenge.category}</Badge>
                <Badge className="bg-accent text-accent-foreground">
                  {challenge.difficulty?.toUpperCase()}
                </Badge>
              </div>

              <h1 className="text-4xl font-bold mb-4">{challenge.title}</h1>
              <p className="text-muted-foreground text-lg mb-6">
                {challenge.description}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Trophy className="w-4 h-4 text-accent" />
                  <span>{challenge.xpReward} XP</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-secondary" />
                  <span>{challenge._count?.progress || 0} players</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{daysLeft} days left</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-success" />
                  <span>{challenge.stages?.length || 0} stages</span>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Overall Progress
                  </span>
                  <span className="font-semibold">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
            </div>

            <div className="md:w-80">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <h3 className="font-bold mb-4">Challenge Story</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {challenge.story || "No story provided for this challenge."}
                  </p>
                  <Button variant="hero" className="w-full">
                    View Map
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Stages */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-6">Challenge Stages</h2>

          {challenge.stages?.length > 0 ? (
            challenge.stages.map((stage: any, index: number) => (
              <Card
                key={stage.id}
                className={`glass-card border ${
                  stage.status === "active"
                    ? "border-secondary"
                    : "border-border/50"
                }`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[var(--shadow-glow-primary)]">
                      {getStageIcon(stage.status)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold">
                            Stage {index + 1}: {stage.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {stage.location}
                          </p>
                        </div>
                        <Badge variant="outline">+{stage.xpReward} XP</Badge>
                      </div>

                      <p className="text-muted-foreground mb-4">
                        {stage.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {stage.verificationType?.includes("QR") && (
                            <QrCode className="w-4 h-4" />
                          )}
                          {stage.verificationType?.includes("Photo") && (
                            <Upload className="w-4 h-4" />
                          )}
                          {stage.verificationType?.includes("GPS") && (
                            <Navigation className="w-4 h-4" />
                          )}
                          <span>{stage.verificationType}</span>
                        </div>

                        {stage.status === "completed" && (
                          <Badge className="bg-success text-success-foreground">
                            Completed ✓
                          </Badge>
                        )}
                        {stage.status === "active" && (
                          <Button variant="secondary">Submit Proof</Button>
                        )}
                        {stage.status === "locked" && (
                          <Button variant="ghost" disabled>
                            Locked
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground">
              No stages found for this challenge.
            </p>
          )}
        </div>

        {/* Leaderboard Preview */}
        <Card className="glass-card border-border/50 mt-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Challenge Leaderboard</h3>
              <Button variant="ghost" onClick={() => navigate("/leaderboard")}>
                View All →
              </Button>
            </div>
            <p className="text-muted-foreground">
              Coming soon: leaderboard integration for this challenge.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChallengeDetail;
