import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MapPin, Clock, Trophy, Users, Award, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { UPLOADS_BASE } from '@/lib/config';
import { getLevelName } from '@/lib/levelNames';

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
  // Handle base64 images, http URLs, and file paths
  const imageUrl = image ? (
    image.startsWith('data:image') || image.startsWith('http') 
      ? image 
      : `${UPLOADS_BASE}/uploads/${image}`
  ) : null;

  return (
    <Card className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-background via-background/95 to-background shadow-lg hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:border-primary/40 transition-all duration-300">
      {/* Subtle border glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
      
      {imageUrl && (
        <div className="relative w-full h-40 sm:h-56 overflow-hidden bg-muted/20">
          <img 
            src={imageUrl} 
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
            className="group-hover:scale-110 transition-transform duration-500"
            onError={(e) => {
              // Hide image on error
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent" />
          
          {/* Top badges */}
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
            <Badge className={`${difficultyColors[difficulty]} text-foreground text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-lg font-semibold shadow-md`}>
              {difficulty.toUpperCase()}
            </Badge>
          </div>
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex flex-col gap-2">
            <Badge className="text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 bg-background/90 backdrop-blur-sm border border-primary/30 rounded-lg font-medium shadow-md">
              {category}
            </Badge>
            {requiredLevel && (
              <Badge className="text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 bg-background/90 backdrop-blur-sm border border-primary/30 rounded-lg font-medium shadow-md">
                <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 inline" />
                {getLevelName(requiredLevel)}
              </Badge>
            )}
          </div>
        </div>
      )}
      
      <CardHeader className={imageUrl ? "pt-4 sm:pt-6 px-4 sm:px-6 pb-3 sm:pb-4" : "px-4 sm:px-6 pb-3 sm:pb-4 pt-4 sm:pt-6"}>
        {!imageUrl && (
          <div className="flex items-start justify-between mb-3 sm:mb-4 gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge className="text-xs sm:text-sm px-3 py-1.5 bg-primary/10 border-primary/30 rounded-lg font-medium">
                {category}
              </Badge>
              {requiredLevel && (
                <Badge className="text-xs sm:text-sm px-3 py-1.5 bg-primary/10 border-primary/30 rounded-lg font-medium">
                  <Award className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 inline" />
                  {getLevelName(requiredLevel)}
                </Badge>
              )}
            </div>
            <Badge className={`${difficultyColors[difficulty]} text-foreground text-xs sm:text-sm px-3 py-1.5 rounded-lg font-semibold`}>
              {difficulty.toUpperCase()}
            </Badge>
          </div>
        )}
        <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold group-hover:text-primary transition-colors line-clamp-2 mb-2 sm:mb-3">{title}</CardTitle>
        <CardDescription className="line-clamp-2 text-sm sm:text-base text-muted-foreground/80 leading-relaxed">{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-6 pb-4 sm:pb-6">
        {/* Data Row */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm sm:text-base">
          <div className="flex items-center gap-2.5 sm:gap-3 text-muted-foreground">
            <div className="p-1.5 sm:p-2 rounded-lg bg-accent/10">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            </div>
            <div>
              <div className="font-semibold text-foreground">{xpReward}</div>
              <div className="text-xs text-muted-foreground">XP</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3 text-muted-foreground">
            <div className="p-1.5 sm:p-2 rounded-lg bg-secondary/10">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
            </div>
            <div>
              <div className="font-semibold text-foreground">{participants}</div>
              <div className="text-xs text-muted-foreground">{t("dashboard.players")}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3 text-muted-foreground">
            <div className="p-1.5 sm:p-2 rounded-lg bg-success/10">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
            </div>
            <div>
              <div className="font-semibold text-foreground">{totalStages}</div>
              <div className="text-xs text-muted-foreground">{t("dashboard.stages")}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3 text-muted-foreground">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-foreground">{deadline}</div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
          </div>
        </div>

        {status === "active" && (
          <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{t("dashboard.progress")}</span>
              <span className="font-semibold">{stagesCompleted}/{totalStages} {t("dashboard.stages")}</span>
            </div>
            <Progress value={progressPercentage} className="h-2.5" />
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex gap-3 pt-2">
          {status === "available" && (
            <Button 
              className="flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary via-primary to-secondary hover:from-primary/90 hover:via-primary/90 hover:to-secondary/90 text-primary-foreground shadow-lg hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] transition-all duration-300 rounded-xl"
              onClick={onJoin}
            >
              {t("dashboard.joinChallenge")}
            </Button>
          )}
          {status === "active" && (
            <Button 
              className="flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-secondary via-secondary to-accent hover:from-secondary/90 hover:via-secondary/90 hover:to-accent/90 text-secondary-foreground shadow-lg hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all duration-300 rounded-xl"
              onClick={onViewDetails}
            >
              {t("dashboard.continueChallenge")}
            </Button>
          )}
          {status === "completed" && (
            <Button 
              variant="outline" 
              className="flex-1 h-11 sm:h-12 text-sm sm:text-base font-semibold rounded-xl" 
              disabled
            >
              {t("dashboard.challengeCompleted")}
            </Button>
          )}
          <Button 
            variant="outline" 
            size="icon"
            className="h-11 sm:h-12 w-11 sm:w-12 rounded-xl border-2 hover:bg-primary/10 hover:border-primary/50 hover:text-primary transition-all duration-300"
            onClick={onViewDetails}
          >
            <Eye className="w-5 h-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChallengeCard;
