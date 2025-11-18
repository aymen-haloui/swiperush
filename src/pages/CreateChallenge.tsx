import { useState } from "react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, MapPin, Save, Loader2, X, Trash2, Upload } from "lucide-react";
import Navbar from "@/components/Navbar";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { apiClient, CreateChallengeRequest } from "@/lib/api";
import { useCategories, useCreateChallenge } from "@/hooks/useApi";
import { UPLOADS_BASE } from '@/lib/config';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Level, Challenge } from "@/lib/api";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Stage {
  id: number;
  title: string;
  description: string;
  gps: string;
  radius?: number;
  qrCode?: string;
  qrCodeFile?: File | null;
}

const CreateChallenge = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;
  const queryClient = useQueryClient();
  
  // Fetch categories from backend
  const { data: categories, isLoading: categoriesLoading } = useCategories(false);
  const createChallengeMutation = useCreateChallenge();
  
  // Fetch challenge for edit mode
  const { data: challenge, isLoading: challengeLoading } = useQuery<Challenge>({
    queryKey: ['challenge', id],
    queryFn: () => apiClient.getChallengeById(id!),
    enabled: isEditMode && !!id,
  });
  
  // Update challenge mutation
  const updateChallengeMutation = useMutation({
    mutationFn: (data: Partial<CreateChallengeRequest>) => apiClient.updateChallenge(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenge', id] });
      toast({
        title: t('notifications.challengeUpdated.title'),
        description: t('notifications.challengeUpdated.description'),
        duration: 3000,
      });
      navigate("/admin");
    },
    onError: (err: Error) => {
      toast({
        title: "❌ Error Updating Challenge",
        description: err.message || "An unexpected error occurred.",
        duration: 4000,
        variant: "destructive",
      });
    },
  });
  
  // Fetch levels from backend
  const { data: levels = [], isLoading: levelsLoading } = useQuery<Level[]>({
    queryKey: ['levels'],
    queryFn: () => apiClient.getLevels(false),
  });
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [requiredLevel, setRequiredLevel] = useState<number>(1);
  const [xpReward, setXpReward] = useState(500);
  const [startDate, setStartDate] = useState("");
  const [duration, setDuration] = useState(24);
  const [maxParticipants, setMaxParticipants] = useState<number | undefined>(undefined);
  const [challengeImage, setChallengeImage] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | undefined>(undefined);
  const [challengeLocation, setChallengeLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Stages state
  const [stages, setStages] = useState<Stage[]>([
    { id: 1, title: "", description: "", gps: "", radius: 50 }
  ]);
  
  // Load challenge data when in edit mode
  React.useEffect(() => {
    if (isEditMode && challenge) {
      setTitle(challenge.title || "");
      setDescription(challenge.description || "");
      setCategory(challenge.category || "");
      setDifficulty((challenge.difficulty?.toLowerCase() as "easy" | "medium" | "hard") || "easy");
      if (challenge.latitude && challenge.longitude) {
        setChallengeLocation({ lat: challenge.latitude, lng: challenge.longitude });
      }
      setRequiredLevel(challenge.requiredLevel || 1);
      setXpReward(challenge.xpReward || 500);
      
      const start = new Date(challenge.startDate);
      const end = new Date(challenge.endDate);
      const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      
      // Format date for datetime-local input
      const year = start.getFullYear();
      const month = String(start.getMonth() + 1).padStart(2, '0');
      const day = String(start.getDate()).padStart(2, '0');
      const hours = String(start.getHours()).padStart(2, '0');
      const minutes = String(start.getMinutes()).padStart(2, '0');
      setStartDate(`${year}-${month}-${day}T${hours}:${minutes}`);
      setDuration(Math.round(durationHours));
      
      setMaxParticipants(challenge.maxParticipants || undefined);
      setExistingImageUrl(challenge.image);
      
      // Load stages
      if (challenge.stages && challenge.stages.length > 0) {
        setStages(challenge.stages.map((stage, index) => ({
          id: index + 1,
          title: stage.title || "",
          description: stage.description || "",
          gps: "",
          radius: stage.radius || 50,
          qrCode: stage.qrCode,
        })));
      }
    }
  }, [challenge, isEditMode]);

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const addStage = () => {
    const maxId = stages.length > 0 ? Math.max(...stages.map(s => s.id)) : 0;
    setStages([...stages, { id: maxId + 1, title: "", description: "", gps: "", radius: 50 }]);
  };

  const removeStage = (stageId: number) => {
    if (stages.length > 1) {
      setStages(stages.filter(s => s.id !== stageId));
    } else {
      toast({
        title: t('notifications.validationError.title'),
        description: t('notifications.validationError.description', { error: 'At least one stage is required.' }),
        variant: "destructive",
      });
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validation
  if (!title.trim() || !description.trim() || !category || !startDate) {
    toast({
      title: t('notifications.validationError.title'),
      description: t('notifications.validationError.description', { error: 'Please fill in all required fields.' }),
      variant: "destructive",
    });
    return;
  }

  if (stages.length === 0) {
    toast({
      title: t('notifications.validationError.title'),
      description: t('notifications.validationError.description', { error: 'Please add at least one stage.' }),
      variant: "destructive",
    });
    return;
  }

  try {
    // Calculate endDate from startDate + duration
    const startDateTime = new Date(startDate);
    if (isNaN(startDateTime.getTime())) {
      throw new Error("Invalid start date");
    }

    const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 60 * 1000);
    
    // Validate stages and process QR codes (GPS disabled - QR codes only)
    const validatedStages = await Promise.all(stages.map(async (stage, index) => {
      if (!stage.title.trim() || !stage.description.trim()) {
        throw new Error(`Stage ${index + 1} is missing required fields`);
      }

      // GPS coordinates are no longer required (GPS functionality disabled)
      
      // Process QR code: if file is uploaded, convert to base64; otherwise use existing qrCode string
      let qrCodeData: string | undefined = undefined;
      if (stage.qrCodeFile) {
        // Validate file type
        const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
        if (!validImageTypes.includes(stage.qrCodeFile.type)) {
          throw new Error(`Stage ${index + 1} QR code must be an image file (PNG, JPG, GIF, or WEBP)`);
        }
        // Validate file size (max 2MB)
        if (stage.qrCodeFile.size > 2 * 1024 * 1024) {
          throw new Error(`Stage ${index + 1} QR code image must be smaller than 2MB`);
        }
        qrCodeData = await fileToBase64(stage.qrCodeFile);
      } else if (stage.qrCode && stage.qrCode.trim()) {
        qrCodeData = stage.qrCode.trim();
      }

      // QR code is now required for all stages
      if (!qrCodeData) {
        throw new Error(`Stage ${index + 1} requires a QR code. Please upload a QR code image.`);
      }

      return {
        order: index + 1,
        title: stage.title.trim(),
        description: stage.description.trim(),
        // GPS coordinates disabled - set to default values
        latitude: 0,
        longitude: 0,
        radius: 50,
        qrCode: qrCodeData,
      };
    }));

    // Process challenge image if provided
    let challengeImageData: string | undefined = undefined;
    if (challengeImage) {
      // Validate file type
      const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!validImageTypes.includes(challengeImage.type)) {
        toast({
          title: t('notifications.validationError.title'),
          description: t('notifications.validationError.description', { error: 'Challenge image must be an image file (PNG, JPG, GIF, or WEBP)' }),
          variant: "destructive",
        });
        return;
      }
      // Validate file size (max 5MB)
      if (challengeImage.size > 5 * 1024 * 1024) {
        toast({
          title: t('notifications.validationError.title'),
          description: t('notifications.validationError.description', { error: 'Challenge image must be smaller than 5MB' }),
          variant: "destructive",
        });
        return;
      }
      challengeImageData = await fileToBase64(challengeImage);
    }

    const challengeData = {
      title: title.trim(),
      description: description.trim(),
      category: category,
      difficulty: difficulty.toUpperCase() as "EASY" | "MEDIUM" | "HARD",
      requiredLevel: requiredLevel,
      xpReward: xpReward,
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      ...(challengeImageData && { image: challengeImageData }),
      ...(maxParticipants && maxParticipants > 0 && { maxParticipants }),
      ...(challengeLocation && challengeLocation.lat !== 0 && challengeLocation.lng !== 0 && { latitude: challengeLocation.lat, longitude: challengeLocation.lng }),
      stages: validatedStages,
    };

    if (isEditMode) {
      await updateChallengeMutation.mutateAsync(challengeData);
    } else {
      await createChallengeMutation.mutateAsync(challengeData);
      toast({
        title: t('notifications.challengeCreated.title'),
        description: t('notifications.challengeCreated.description'),
        duration: 3000,
      });
      navigate("/admin");
    }
  } catch (err) {
    toast({
      title: isEditMode ? t('notifications.challengeUpdateError.title') : t('notifications.challengeCreateError.title'),
      description: err instanceof Error ? err.message : t('notifications.challengeCreateError.description'),
      duration: 4000,
      variant: "destructive",
    });
  }
};

  // Show loading state while fetching challenge for edit
  if (isEditMode && challengeLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading challenge...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="create-challenge" title={isEditMode ? "Edit Challenge" : "Create New Challenge"} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Set up the main details of your challenge</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="challenge-image">Challenge Cover Image (optional)</Label>
                {challengeImage ? (
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/20">
                    <img
                      src={URL.createObjectURL(challengeImage)}
                      alt="Challenge preview"
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{challengeImage.name}</p>
                      <p className="text-xs text-muted-foreground">{(challengeImage.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setChallengeImage(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : existingImageUrl && isEditMode ? (
                  <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/20">
                    <img
                      src={existingImageUrl.startsWith('http') ? existingImageUrl : `${UPLOADS_BASE}/uploads/${existingImageUrl}`}
                      alt="Current challenge image"
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Current image</p>
                      <p className="text-xs text-muted-foreground">Upload a new image to replace</p>
                    </div>
                    <label htmlFor="challenge-image" className="mr-2">
                      <Button type="button" variant="outline" size="sm">Change</Button>
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setExistingImageUrl(undefined)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="challenge-image" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-primary/50 rounded-md hover:border-primary">
                        <Upload className="w-5 h-5 text-primary" />
                        <span className="text-sm text-primary">{t('createChallenge.uploadPicture') || 'Upload Picture'}</span>
                      </div>
                    </label>
                    <input
                      id="challenge-image"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setChallengeImage(file);
                      }}
                      className="hidden"
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Upload a cover image for your challenge. Supported formats: PNG, JPG, GIF, WEBP (max 5MB)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t('createChallenge.nameLabel') || 'Challenge Name'}</Label>
                <Input
                  id="name"
                  placeholder={t('createChallenge.namePlaceholder') || 'Enter challenge name'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Describe your challenge" 
                  rows={3} 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required 
                />
              </div>

              {/* Challenge Location Map */}
              <div className="space-y-2">
                <Label>Challenge Location (Optional)</Label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="challenge-lat" className="text-sm">Latitude</Label>
                    <Input
                      id="challenge-lat"
                      type="number"
                      step="any"
                      placeholder="e.g., 40.7128"
                      value={challengeLocation?.lat || ""}
                      onChange={(e) => {
                        const lat = parseFloat(e.target.value);
                        if (!isNaN(lat)) {
                          setChallengeLocation(prev => ({ lat, lng: prev?.lng || 0 }));
                        } else {
                          setChallengeLocation(null);
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="challenge-lng" className="text-sm">Longitude</Label>
                    <Input
                      id="challenge-lng"
                      type="number"
                      step="any"
                      placeholder="e.g., -74.0060"
                      value={challengeLocation?.lng || ""}
                      onChange={(e) => {
                        const lng = parseFloat(e.target.value);
                        if (!isNaN(lng)) {
                          setChallengeLocation(prev => ({ lat: prev?.lat || 0, lng }));
                        } else {
                          setChallengeLocation(null);
                        }
                      }}
                    />
                  </div>
                </div>
                {challengeLocation && challengeLocation.lat !== 0 && challengeLocation.lng !== 0 && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-border/50">
                    <iframe
                      width="100%"
                      height="300"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${challengeLocation.lng - 0.01},${challengeLocation.lat - 0.01},${challengeLocation.lng + 0.01},${challengeLocation.lat + 0.01}&layer=mapnik&marker=${challengeLocation.lat},${challengeLocation.lng}`}
                    />
                    <div className="p-2 bg-muted/20 text-xs text-center text-muted-foreground">
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${challengeLocation.lat}&mlon=${challengeLocation.lng}&zoom=15`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        View larger map
                      </a>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Add the main location for this challenge. This helps participants understand where the challenge takes place.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory} disabled={categoriesLoading}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select category"} />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      ) : categories && categories.length > 0 ? (
                        categories
                          .filter(cat => cat.isActive)
                          .map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.icon && <span className="mr-2">{cat.icon}</span>}
                              {cat.name}
                            </SelectItem>
                          ))
                      ) : (
                          <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                          No levels available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={difficulty} onValueChange={(value) => setDifficulty(value as "easy" | "medium" | "hard")}>
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requiredLevel">Required Level</Label>
                  <Select 
                    value={requiredLevel.toString()} 
                    onValueChange={(value) => setRequiredLevel(Number(value))}
                    disabled={levelsLoading}
                  >
                    <SelectTrigger id="requiredLevel">
                      <SelectValue placeholder={levelsLoading ? "Loading levels..." : "Select level"} />
                    </SelectTrigger>
                    <SelectContent>
                      {levelsLoading ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      ) : levels && levels.length > 0 ? (
                        levels
                          .filter(level => level.isActive)
                          .sort((a, b) => a.number - b.number)
                          .map((level) => (
                            <SelectItem key={level.id} value={level.number.toString()}>
                              Level {level.number}: {level.name} ({level.minXP}{level.maxXP ? ` - ${level.maxXP}` : '+'} XP)
                            </SelectItem>
                          ))
                      ) : (
                        <SelectItem value="1" disabled>No levels available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date & Time</Label>
                  <Input 
                    id="startDate" 
                    type="datetime-local" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (hours)</Label>
                  <Input 
                    id="duration" 
                    type="number" 
                    placeholder="24" 
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value) || 24)}
                    min="1"
                    required 
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="xpReward">XP Reward</Label>
                  <Input 
                    id="xpReward" 
                    type="number" 
                    placeholder="500" 
                    value={xpReward}
                    onChange={(e) => setXpReward(Number(e.target.value) || 500)}
                    min="1"
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxParticipants">Max Participants (optional)</Label>
                  <Input 
                    id="maxParticipants" 
                    type="number" 
                    placeholder="Leave empty for unlimited" 
                    value={maxParticipants || ""}
                    onChange={(e) => setMaxParticipants(e.target.value ? Number(e.target.value) : undefined)}
                    min="1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Stages */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Challenge Stages</CardTitle>
                  <CardDescription>Define the stages participants will complete</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addStage}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Stage
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {stages.map((stage, index) => (
                <Card key={stage.id} className="bg-muted/20 border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Stage {index + 1}</CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeStage(stage.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`stage-name-${stage.id}`}>Stage Name *</Label>
                      <Input 
                        id={`stage-name-${stage.id}`} 
                        placeholder="Enter stage name" 
                        value={stage.title}
                        onChange={(e) => {
                          const updatedStages = stages.map(s => 
                            s.id === stage.id ? { ...s, title: e.target.value } : s
                          );
                          setStages(updatedStages);
                        }}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`stage-desc-${stage.id}`}>Description *</Label>
                      <Textarea 
                        id={`stage-desc-${stage.id}`} 
                        placeholder="Describe this stage" 
                        rows={2}
                        value={stage.description}
                        onChange={(e) => {
                          const updatedStages = stages.map(s => 
                            s.id === stage.id ? { ...s, description: e.target.value } : s
                          );
                          setStages(updatedStages);
                        }}
                        required
                      />
                    </div>

                    {/* GPS coordinates and radius removed - GPS functionality disabled */}

                    <div className="space-y-2">
                      <Label htmlFor={`stage-qr-${stage.id}`}>QR Code Image *</Label>
                      {stage.qrCodeFile ? (
                        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/20">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{stage.qrCodeFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(stage.qrCodeFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              const updatedStages = stages.map(s => 
                                s.id === stage.id ? { ...s, qrCodeFile: null, qrCode: undefined } : s
                              );
                              setStages(updatedStages);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            id={`stage-qr-${stage.id}`}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                            className="cursor-pointer"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const updatedStages = stages.map(s => 
                                  s.id === stage.id ? { ...s, qrCodeFile: file, qrCode: undefined } : s
                                );
                                setStages(updatedStages);
                              }
                            }}
                          />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-muted-foreground cursor-help">
                                Upload a QR code image. Players will scan this to unlock the next stage.
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Supported formats: PNG, JPG, GIF, WEBP (max 2MB)</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate("/admin")}>
              Cancel
            </Button>
            <Button type="submit" variant="hero">
              <Save className="w-4 h-4 mr-2" />
              {isEditMode ? "Update Challenge" : "Create Challenge"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChallenge;
