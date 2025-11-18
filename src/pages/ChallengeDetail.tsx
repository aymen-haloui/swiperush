import { UPLOADS_BASE } from '@/lib/config';

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
  Navigation,
  Calendar,
  ScanLine,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getChallengeById, Challenge, StageProgress, apiClient, SubmitStageRequest } from "@/lib/api";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { QRCodeScanner } from "@/components/QRCodeScanner";
import { toast } from "@/hooks/use-toast";
const ChallengeDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [currentStageId, setCurrentStageId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ✅ Fetch challenge from backend

  useEffect(() => {
    const fetchChallenge = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await getChallengeById(id);
        console.log('Challenge data received:', response);
        console.log('Location data:', { 
          latitude: response.latitude, 
          longitude: response.longitude,
          hasLat: response.latitude != null,
          hasLng: response.longitude != null,
          latType: typeof response.latitude,
          lngType: typeof response.longitude
        });
        setChallenge(response); // ✅ set the state with the fetched data
      } catch (err) {
        console.error(err);
        setError(t('challenge.loadError'));
      } finally {
        setLoading(false);
      }
    };
    fetchChallenge();
  }, [id]);

  // ✅ Get stage status from user progress
  const getStageStatus = (stageId: string): 'PENDING' | 'COMPLETED' | 'SKIPPED' | 'LOCKED' => {
    // If user hasn't joined the challenge, all stages are locked
    if (!challenge?.userProgress) return 'LOCKED';
    
    const stageIndex = challenge.stages.findIndex(s => s.id === stageId);
    const stageProgress = challenge.userProgress.stages.find(sp => sp.stage.id === stageId);
    
    // If stage progress exists, return its status
    if (stageProgress) {
      return stageProgress.status as 'PENDING' | 'COMPLETED' | 'SKIPPED';
    }
    
    // For the first stage (index 0), if user has joined, it should be PENDING
    // This is handled by the backend when joining - first stage gets PENDING status
    if (stageIndex === 0) {
      // If user has joined but no progress entry exists yet, it's still pending
      // The backend should have created it, but handle edge case
      return 'PENDING';
    }
    
    // For subsequent stages, check if previous stage is completed
    if (stageIndex > 0) {
      const prevStageId = challenge.stages[stageIndex - 1].id;
      const prevStageProgress = challenge.userProgress.stages.find(sp => sp.stage.id === prevStageId);
      
      // If previous stage is completed, this stage is pending
      if (prevStageProgress && prevStageProgress.status === 'COMPLETED') {
        return 'PENDING';
      }
      
      // Otherwise, it's locked
      return 'LOCKED';
    }
    
    return 'LOCKED';
  };

  // Get user's current location
  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(`Failed to get location: ${error.message}`));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  // Handle QR code scan success
  const handleQRScanSuccess = async (decodedText: string) => {
    if (!currentStageId) return;

    try {
      setSubmitting(true);
      
      // GPS is disabled - use default coordinates
      // const location = await getCurrentLocation();

      // Find the stage
      const stage = challenge?.stages.find((s) => s.id === currentStageId);
      if (!stage) {
        throw new Error('Stage not found');
      }

      // Submit stage with QR code (GPS disabled)
      const submitData: SubmitStageRequest = {
        stageId: currentStageId,
        latitude: 0, // GPS disabled
        longitude: 0, // GPS disabled
        submissionType: 'QR_CODE',
        content: decodedText,
      };

      await apiClient.submitStage(submitData);

      toast({
        title: t('notifications.stageCompleted.title'),
        description: t('notifications.stageCompleted.description', { xp: 0 }) || 'QR code scanned successfully. Stage completed!',
        duration: 3000,
      });

      // Refresh challenge data
      const response = await getChallengeById(id!);
      setChallenge(response);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('challenge.submitFailed');
      toast({
        title: t('notifications.stageError.title'),
        description: errorMessage || t('notifications.stageError.description'),
        variant: "destructive",
        duration: 4000,
      });
    } finally {
      setSubmitting(false);
      setCurrentStageId(null);
    }
  };

  // Handle submit proof button click
  const handleSubmitProof = (stageId: string) => {
    const stage = challenge?.stages.find((s) => s.id === stageId);
    if (!stage) return;

    // If stage has QR code, open scanner
    if (stage.qrCode) {
      setCurrentStageId(stageId);
      setQrScannerOpen(true);
    } else {
      // For GPS-only stages, submit with location
      handleGPSSubmit(stageId);
    }
  };

  // GPS-only submission is disabled - all stages require QR codes
  const handleGPSSubmit = async (stageId: string) => {
    // This function is no longer used - all stages require QR codes
    toast({
      title: t('notifications.stageError.title'),
      description: t('notifications.stageError.description', { error: 'This stage requires QR code scanning. GPS submission is disabled.' }),
      variant: "destructive",
      duration: 4000,
    });
    // Legacy GPS submission code removed - GPS functionality is disabled
  };

  // ✅ Stage icon display
  const getStageIcon = (status: 'PENDING' | 'COMPLETED' | 'SKIPPED' | 'LOCKED') => {
    if (status === "COMPLETED")
      return <CheckCircle className="w-5 h-5 text-success" />;
    if (status === "PENDING")
      return <Circle className="w-5 h-5 text-secondary" />;
    return <Lock className="w-5 h-5 text-muted-foreground" />;
  };

  // ✅ Handle loading and errors
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <p>{t('challenge.loading')}</p>
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
      <div className="flex justify-center items-center h-screen text-muted-foreground">
        {t('challenge.notFound')}
      </div>
    );

  // Calculate progress from user's completed stages
  const progress =
    challenge.userProgress && challenge.stages?.length > 0
      ? (challenge.userProgress.stages.filter((sp: StageProgress) => sp.status === "COMPLETED").length /
          challenge.stages.length) *
        100
      : 0;

  // Calculate challenge duration in hours
  const startDate = new Date(challenge.startDate);
  const endDate = new Date(challenge.endDate);
  const durationHours = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
  const durationDays = Math.round(durationHours / 24);
  
  const daysLeft = Math.max(
    0,
    Math.ceil(
      (endDate.getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const isChallengeActive = new Date() >= startDate && new Date() <= endDate;
  const isChallengeUpcoming = new Date() < startDate;
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar variant="challenge-detail" />

      <div className="container mx-auto px-4 py-8">
        {/* Challenge Header */}
        <div className="glass-card rounded-xl p-8 mb-8 border border-primary/20 overflow-hidden">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Challenge Image */}
            {challenge.image && (
              <div className="md:w-1/2 h-64 md:h-auto flex-shrink-0">
                <img
                  src={challenge.image.startsWith('data:image') || challenge.image.startsWith('http') ? challenge.image : `${UPLOADS_BASE}/uploads/${challenge.image}`}
                  alt={challenge.title}
                  className="w-full h-full object-contain bg-muted/10 rounded-lg shadow-lg"
                  style={{ display: 'block' }}
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    try {
                      const img = e.currentTarget as HTMLImageElement;
                      console.warn('Image load error:', challenge.image);
                      // Simple inline SVG placeholder to avoid external dependency
                      const placeholderSvg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'><rect fill='%23f8fafc' width='100%' height='100%'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='Arial, Helvetica, sans-serif' font-size='28'>Image not available</text></svg>`;

                      // Prevent infinite loop: if placeholder already applied, hide the element
                      if (img.dataset['fallbackApplied'] === '1') {
                        img.style.display = 'none';
                        return;
                      }

                      img.src = `data:image/svg+xml;utf8,${encodeURIComponent(placeholderSvg)}`;
                      img.dataset['fallbackApplied'] = '1';
                    } catch (err) {
                      // Fallback: hide image if anything goes wrong
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }
                  }}
                />
              </div>
            )}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-semibold mb-3">{t('challenge.statsTitle')}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-accent" />
                      <div>
                        <div className="font-semibold">{challenge.xpReward} XP</div>
                        <div className="text-xs text-muted-foreground">Reward</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-secondary" />
                      <div>
                        <div className="font-semibold">{challenge._count?.progress || 0}{challenge.maxParticipants ? ` / ${challenge.maxParticipants}` : ''}</div>
                        <div className="text-xs text-muted-foreground">Players</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-success" />
                      <div>
                        <div className="font-semibold">{challenge.stages?.length || 0}</div>
                        <div className="text-xs text-muted-foreground">Stages</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <div>
                        <div className="font-semibold">{durationDays > 0 ? `${durationDays} days` : `${durationHours} hours`}</div>
                        <div className="text-xs text-muted-foreground">Duration</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">{t('challenge.scheduleTitle')}</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Start: {new Date(challenge.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>End: {new Date(challenge.endDate).toLocaleDateString()}</span>
                    </div>
                    {isChallengeActive && <div className="text-sm text-muted-foreground">{daysLeft} days left</div>}
                    {isChallengeUpcoming && <div className="text-sm text-muted-foreground">Starts in {Math.ceil((startDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days</div>}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3">{t('challenge.locationTitle')}</h4>
                {challenge.latitude != null && challenge.longitude != null && challenge.latitude !== 0 && challenge.longitude !== 0 ? (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-success" />
                    <div className="flex-1 text-sm">
                      <div className="font-semibold">{t('challenge.locationAvailable')}</div>
                      <div className="text-xs text-muted-foreground">{t('challenge.coordinatesHidden')}</div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 px-3 text-xs"
                      onClick={() => {
                        window.open(
                          `https://www.openstreetmap.org/?mlat=${challenge.latitude}&mlon=${challenge.longitude}&zoom=15`,
                          '_blank',
                          'noopener,noreferrer'
                        );
                      }}
                    >
                      {t('challenge.viewOnMap')}
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">{t('challenge.noLocation')}</div>
                )}
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-semibold">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-3" />
              </div>
            </div>

            <div className="md:w-80">
                {/* Right-side info card removed per request */}
            </div>
          </div>
        </div>

        {/* Stages */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-6">{t('challenge.stagesTitle')}</h2>

          {challenge.stages?.length > 0 ? (
            challenge.stages.map((stage, index: number) => {
              const stageStatus = getStageStatus(stage.id);
              const hasQrCode = !!stage.qrCode;
              
              return (
                <Card
                  key={stage.id}
                  className={`glass-card border ${
                    stageStatus === "PENDING"
                      ? "border-secondary"
                      : "border-border/50"
                  }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[var(--shadow-glow-primary)]">
                        {getStageIcon(stageStatus)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-bold">
                              Stage {index + 1}: {stage.title}
                            </h3>
                            {/* GPS coordinates removed - GPS functionality disabled */}
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-4">
                          {stage.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {hasQrCode && (
                              <>
                                <QrCode className="w-4 h-4" />
                                <span>{t('challenge.qrCodeLabel')}</span>
                              </>
                            )}
                            {!hasQrCode && (
                              <>
                                <Navigation className="w-4 h-4" />
                                <span>{t('challenge.gpsLocationLabel')}</span>
                              </>
                            )}
                          </div>

                          {stageStatus === "COMPLETED" && (
                            <Badge className="bg-success text-success-foreground">
                              {t('challenge.completedLabel')} ✓
                            </Badge>
                          )}
                          {stageStatus === "PENDING" && isChallengeActive && (
                            <Button 
                              variant="secondary" 
                              onClick={() => handleSubmitProof(stage.id)}
                              disabled={submitting || currentStageId === stage.id}
                            >
                              {hasQrCode ? (
                                <>
                                  <ScanLine className="w-4 h-4 mr-2" />
                                  {t('challenge.scanQrButton')}
                                </>
                              ) : (
                                t('challenge.submitProof')
                              )}
                            </Button>
                          )}
                          {stageStatus === "LOCKED" && (
                            <Button variant="ghost" disabled>
                              {t('challenge.lockedLabel')}
                            </Button>
                          )}
                          {stageStatus === "SKIPPED" && (
                            <Badge variant="outline">{t('challenge.skippedLabel')}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <p className="text-muted-foreground">
              {t('challenge.noStages')}
            </p>
          )}
        </div>

        {/* Leaderboard Preview */}
        <Card className="glass-card border-border/50 mt-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{t('challenge.leaderboardTitle')}</h3>
              <Button variant="ghost" onClick={() => navigate("/leaderboard")}>
                {t('challenge.viewAll')}
              </Button>
            </div>
            <p className="text-muted-foreground">
              {t('challenge.leaderboardComingSoon')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Scanner */}
      <QRCodeScanner
        open={qrScannerOpen}
        onClose={() => {
          setQrScannerOpen(false);
          setCurrentStageId(null);
        }}
        onScanSuccess={handleQRScanSuccess}
        stageTitle={currentStageId ? challenge?.stages.find(s => s.id === currentStageId)?.title : undefined}
      />
      <Footer />
    </div>
  );
};

export default ChallengeDetail;
