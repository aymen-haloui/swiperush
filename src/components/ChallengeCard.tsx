import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MapPin, Clock, Trophy, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ChallengeCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  xpReward: number;
  
  deadline: string;
  participants: number;
  stagesCompleted?: number;
  totalStages?: number;
  status?: "available" | "active" | "completed";
  onJoin?: () => void;
  onViewDetails?: () => void;
}

const ChallengeCard = ({
  title,
  description,
  category,
  difficulty,
  xpReward,
  deadline,
  participants,
  stagesCompleted = 0,
  totalStages = 6,
  status = "available",
  onJoin,
  onViewDetails
}: ChallengeCardProps) => {
  const { t } = useTranslation();
  
  const difficultyColors = {
    easy: "bg-success",
    medium: "bg-accent",
    hard: "bg-destructive"
  };

  const progressPercentage = (stagesCompleted / totalStages) * 100;

  return (
    <Card className="glass-card border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-[var(--shadow-glow-primary)] group">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            {category}
          </Badge>
          <Badge className={`${difficultyColors[difficulty]} text-foreground`}>
            {difficulty.toUpperCase()}
          </Badge>
        </div>
        <CardTitle className="text-xl group-hover:text-primary transition-colors">{title}</CardTitle>
        <CardDescription className="line-clamp-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Trophy className="w-4 h-4 text-accent" />
            <span>{xpReward} {t("leaderboard.xp")}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4 text-secondary" />
            <span>{participants} {t("dashboard.players")}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4 text-primary" />
            <span>{deadline}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 text-success" />
            <span>{totalStages} {t("dashboard.stages")}</span>
          </div>
        </div>

        {status === "active" && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t("dashboard.progress")}</span>
              <span>{stagesCompleted}/{totalStages} {t("dashboard.stages")}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {status === "available" && (
            <Button variant="hero" className="flex-1" onClick={onJoin}>
              {t("dashboard.joinChallenge")}
            </Button>
          )}
          {status === "active" && (
            <Button variant="secondary" className="flex-1" onClick={onViewDetails}>
              {t("dashboard.continueChallenge")}
            </Button>
          )}
          {status === "completed" && (
            <Button variant="glass" className="flex-1" disabled>
              {t("dashboard.challengeCompleted")}
            </Button>
          )}
          <Button variant="outline" onClick={onViewDetails}>
            {t("dashboard.viewDetails")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChallengeCard;
