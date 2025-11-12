import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedButton } from "@/components/ui/animated-button";
import { FloatingCard } from "@/components/ui/floating-card";
import { Progress } from "@/components/ui/progress";
import { MapPin, Clock, Trophy, Users, Award } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UPLOADS_BASE } from '@/lib/config';

interface ChallengeCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  xpReward: number;
  image?: string;
  requiredLevel?: number;
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
  image,
  requiredLevel,
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
  const imageUrl = image ? (image.startsWith('http') ? image : `${UPLOADS_BASE}/uploads/${image}`) : null;

  return (
    <FloatingCard floating glow>
    <Card className="glass-card border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-[var(--shadow-glow-primary)] group overflow-hidden">
      {imageUrl && (
        <div className="relative w-full h-48 overflow-hidden">
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
          <div className="absolute top-3 right-3">
            <Badge className={`${difficultyColors[difficulty]} text-foreground`}>
              {difficulty.toUpperCase()}
            </Badge>
          </div>
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
              {category}
            </Badge>
            {requiredLevel && (
              <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">
                <Award className="w-3 h-3 mr-1" />
                Lv {requiredLevel}
              </Badge>
            )}
          </div>
        </div>
      )}
      <CardHeader className={imageUrl ? "pt-4" : ""}>
        {!imageUrl && (
          <div className="flex items-start justify-between mb-2">
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                {category}
              </Badge>
              {requiredLevel && (
                <Badge variant="outline" className="text-xs">
                  <Award className="w-3 h-3 mr-1" />
                  Lv {requiredLevel}
                </Badge>
              )}
            </div>
            <Badge className={`${difficultyColors[difficulty]} text-foreground`}>
              {difficulty.toUpperCase()}
            </Badge>
          </div>
        )}
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
            <AnimatedButton variant="hero" className="flex-1" shimmer glow onClick={onJoin}>
              {t("dashboard.joinChallenge")}
            </AnimatedButton>
          )}
          {status === "active" && (
            <AnimatedButton variant="secondary" className="flex-1" shimmer onClick={onViewDetails}>
              {t("dashboard.continueChallenge")}
            </AnimatedButton>
          )}
          {status === "completed" && (
            <Button variant="glass" className="flex-1" disabled>
              {t("dashboard.challengeCompleted")}
            </Button>
          )}
          <AnimatedButton variant="outline" onClick={onViewDetails}>
            {t("dashboard.viewDetails")}
          </AnimatedButton>
        </div>
      </CardContent>
    </Card>
    </FloatingCard>
  );
};

export default ChallengeCard;
