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
        <div className="relative w-full h-32 sm:h-48 overflow-hidden">
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
            <Badge className={`${difficultyColors[difficulty]} text-foreground text-xs`}>
              {difficulty.toUpperCase()}
            </Badge>
          </div>
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex gap-1 sm:gap-2">
            <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm px-1.5 sm:px-2">
              {category}
            </Badge>
            {requiredLevel && (
              <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm px-1.5 sm:px-2">
                <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                Lv {requiredLevel}
              </Badge>
            )}
          </div>
        </div>
      )}
      <CardHeader className={imageUrl ? "pt-2 sm:pt-4 px-3 sm:px-6 pb-2 sm:pb-4" : "px-3 sm:px-6 pb-2 sm:pb-4"}>
        {!imageUrl && (
          <div className="flex items-start justify-between mb-1 sm:mb-2">
            <div className="flex gap-1 sm:gap-2">
              <Badge variant="outline" className="text-xs px-1.5 sm:px-2">
                {category}
              </Badge>
              {requiredLevel && (
                <Badge variant="outline" className="text-xs px-1.5 sm:px-2">
                  <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                  Lv {requiredLevel}
                </Badge>
              )}
            </div>
            <Badge className={`${difficultyColors[difficulty]} text-foreground text-xs`}>
              {difficulty.toUpperCase()}
            </Badge>
          </div>
        )}
        <CardTitle className="text-base sm:text-xl group-hover:text-primary transition-colors line-clamp-1">{title}</CardTitle>
        <CardDescription className="line-clamp-1 sm:line-clamp-2 text-xs sm:text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-4 px-3 sm:px-6 pb-3 sm:pb-6">
        {/* Mobile: Inline info at bottom */}
        <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground md:hidden">
          <span className="flex items-center gap-1">
            <Trophy className="w-3 h-3 text-accent" />
            <span className="font-semibold">{xpReward} XP</span>
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 text-secondary" />
            <span>{participants} {t("dashboard.players")}</span>
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-success" />
            <span>{totalStages} {t("dashboard.stages")}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-primary" />
            <span>{deadline}</span>
          </span>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden md:grid grid-cols-2 gap-3 text-sm">
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
          <div className="space-y-1 sm:space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t("dashboard.progress")}</span>
              <span>{stagesCompleted}/{totalStages} {t("dashboard.stages")}</span>
            </div>
            <Progress value={progressPercentage} className="h-1.5 sm:h-2" />
          </div>
        )}

        <div className="flex gap-1.5 sm:gap-2 pt-1 sm:pt-2">
          {status === "available" && (
            <AnimatedButton variant="hero" className="flex-1 text-xs sm:text-sm h-9 sm:h-10" shimmer glow onClick={onJoin}>
              {t("dashboard.joinChallenge")}
            </AnimatedButton>
          )}
          {status === "active" && (
            <AnimatedButton variant="secondary" className="flex-1 text-xs sm:text-sm h-9 sm:h-10" shimmer onClick={onViewDetails}>
              {t("dashboard.continueChallenge")}
            </AnimatedButton>
          )}
          {status === "completed" && (
            <Button variant="glass" className="flex-1 text-xs sm:text-sm h-9 sm:h-10" disabled>
              {t("dashboard.challengeCompleted")}
            </Button>
          )}
          <AnimatedButton variant="outline" className="text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-4" onClick={onViewDetails}>
            <span className="hidden sm:inline">{t("dashboard.viewDetails")}</span>
            <span className="sm:hidden">View</span>
          </AnimatedButton>
        </div>
      </CardContent>
    </Card>
    </FloatingCard>
  );
};

export default ChallengeCard;
