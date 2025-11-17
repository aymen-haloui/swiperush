import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UPLOADS_BASE } from '@/lib/config';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Crown, Users, Trophy, Activity, Plus, Eye, Loader2, User as UserIcon, Tag, Edit, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useChallenges, useLeaderboardStats } from "@/hooks/useApi";
import { Badge } from "@/components/ui/badge";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { useCreateCategory } from "@/hooks/useApi";
import { toast } from "@/hooks/use-toast";
import { apiClient, Level, CreateLevelRequest, UpdateLevelRequest, Challenge, CreateChallengeRequest, Category, CreateCategoryRequest, UpdateCategoryRequest, User } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  // Category dialog state
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryIcon, setCategoryIcon] = useState("");
  const [categoryColor, setCategoryColor] = useState("");

  // Level dialog state
  const queryClient = useQueryClient();
  const [isLevelDialogOpen, setIsLevelDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [levelNumber, setLevelNumber] = useState("");
  const [levelName, setLevelName] = useState("");
  const [levelMinXP, setLevelMinXP] = useState("");
  const [levelMaxXP, setLevelMaxXP] = useState("");

  const { data: statsData, isLoading: statsLoading } = useLeaderboardStats();
  const { data: challengesData, isLoading: challengesLoading } = useChallenges({ status: 'all', limit: 100 });
  const createCategoryMutation = useCreateCategory();

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['categories', true],
    queryFn: () => apiClient.getCategories(true),
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) => apiClient.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "✅ Category Updated!",
        description: "Category has been successfully updated.",
        duration: 3000,
      });
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
    },
    onError: (err: Error) => {
      toast({
        title: "❌ Error Updating Category",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: "✅ Category Deleted!",
        description: "Category has been successfully deleted.",
        duration: 3000,
      });
    },
    onError: (err: Error) => {
      toast({
        title: "❌ Error Deleting Category",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Category dialog state (for create/edit)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryDescription("");
    setCategoryIcon("");
    setCategoryColor("");
  };

  const handleOpenCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryName(category.name || "");
      setCategoryDescription(category.description || "");
      setCategoryIcon(category.icon || "");
      setCategoryColor(category.color || "");
    } else {
      resetCategoryForm();
    }
    setIsCategoryDialogOpen(true);
  };

  // Fetch users/players
  const [playerSearch, setPlayerSearch] = useState("");
  const [playerFilterActive, setPlayerFilterActive] = useState<boolean | undefined>(undefined);
  
  const { data: playersData, isLoading: playersLoading } = useQuery<{ users: User[]; total: number }>({
    queryKey: ['users', playerSearch, playerFilterActive],
    queryFn: () => apiClient.getAllUsers({
      search: playerSearch || undefined,
      isActive: playerFilterActive,
      limit: 100,
    }),
  });

  // Toggle user status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: (id: string) => apiClient.toggleUserStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: "✅ User Status Updated!",
        description: "User status has been successfully updated.",
        duration: 3000,
      });
    },
    onError: (err: Error) => {
      toast({
        title: "❌ Error Updating User Status",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Fetch levels
  const { data: levels = [], isLoading: levelsLoading, refetch: refetchLevels } = useQuery<Level[]>({
    queryKey: ['levels', true],
    queryFn: () => apiClient.getLevels(true),
  });

  // Create level mutation
  const createLevelMutation = useMutation({
    mutationFn: (data: CreateLevelRequest) => apiClient.createLevel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
      toast({
        title: "✅ Level Created!",
        description: "Level has been successfully created.",
        duration: 3000,
      });
      setIsLevelDialogOpen(false);
      resetLevelForm();
    },
    onError: (err: Error) => {
      toast({
        title: "❌ Error Creating Level",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Update level mutation
  const updateLevelMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLevelRequest }) => apiClient.updateLevel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
      toast({
        title: "✅ Level Updated!",
        description: "Level has been successfully updated.",
        duration: 3000,
      });
      setIsLevelDialogOpen(false);
      resetLevelForm();
    },
    onError: (err: Error) => {
      toast({
        title: "❌ Error Updating Level",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  // Delete level mutation
  const deleteLevelMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteLevel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['levels'] });
      toast({
        title: "✅ Level Deleted!",
        description: "Level has been successfully deleted.",
        duration: 3000,
      });
    },
    onError: (err: Error) => {
      toast({
        title: "❌ Error Deleting Level",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const resetLevelForm = () => {
    setEditingLevel(null);
    setLevelNumber("");
    setLevelName("");
    setLevelMinXP("");
    setLevelMaxXP("");
  };

  const handleOpenLevelDialog = (level?: Level) => {
    if (level) {
      setEditingLevel(level);
      setLevelNumber(level.number.toString());
      setLevelName(level.name);
      setLevelMinXP(level.minXP.toString());
      setLevelMaxXP(level.maxXP?.toString() || "");
    } else {
      resetLevelForm();
    }
    setIsLevelDialogOpen(true);
  };

  const handleSaveLevel = () => {
    if (!levelNumber.trim() || !levelName.trim() || !levelMinXP.trim()) {
      toast({
        title: "❌ Validation Error",
        description: "Level number, name, and min XP are required.",
        variant: "destructive",
      });
      return;
    }

    const number = parseInt(levelNumber);
    const minXP = parseInt(levelMinXP);
    const maxXP = levelMaxXP.trim() ? parseInt(levelMaxXP) : undefined;

    if (isNaN(number) || number < 1) {
      toast({
        title: "❌ Validation Error",
        description: "Level number must be at least 1.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(minXP) || minXP < 0) {
      toast({
        title: "❌ Validation Error",
        description: "Min XP must be non-negative.",
        variant: "destructive",
      });
      return;
    }

    if (maxXP !== undefined && (isNaN(maxXP) || maxXP <= minXP)) {
      toast({
        title: "❌ Validation Error",
        description: "Max XP must be greater than Min XP.",
        variant: "destructive",
      });
      return;
    }

    if (editingLevel) {
      updateLevelMutation.mutate({
        id: editingLevel.id,
        data: {
          number,
          name: levelName.trim(),
          minXP,
          maxXP,
        },
      });
    } else {
      createLevelMutation.mutate({
        number,
        name: levelName.trim(),
        minXP,
        maxXP,
        isActive: true,
      });
    }
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  // Delete challenge mutation
  const deleteChallengeMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteChallenge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      setIsDeleteDialogOpen(false);
      setSelectedChallenge(null);
      toast({
        title: "✅ Challenge Deleted!",
        description: "Challenge has been successfully deleted.",
        duration: 3000,
      });
    },
    onError: (err: Error) => {
      toast({
        title: "❌ Error Deleting Challenge",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteChallenge = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteChallenge = () => {
    if (selectedChallenge) {
      deleteChallengeMutation.mutate(selectedChallenge.id);
    }
  };
  
  const stats = {
    activeChallenges: challengesData?.challenges?.length ?? 0,
    totalPlayers: statsData?.totalUsers ?? 0,
    activePlayers: 0,
    topPerformers: statsData?.topUser ? 1 : 0,
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      toast({
        title: "❌ Validation Error",
        description: "Category name is required.",
        variant: "destructive",
      });
      return;
    }

    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        data: {
          name: categoryName.trim(),
          description: categoryDescription.trim() || undefined,
          icon: categoryIcon.trim() || undefined,
          color: categoryColor.trim() || undefined,
        },
      });
    } else {
      await createCategoryMutation.mutateAsync({
        name: categoryName.trim(),
        description: categoryDescription.trim() || undefined,
        icon: categoryIcon.trim() || undefined,
        color: categoryColor.trim() || undefined,
      });
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
    }
  };


  const activeChallenges = (challengesData?.challenges ?? []).map((c) => ({
    id: c.id,
    name: c.title,
    participants: c._count?.progress ?? 0,
    completionRate: 0,
    status: "Active",
  }));

  return (
    <div className="min-h-screen">
      <Navbar variant="admin" />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Stats Overview */}
        {(statsLoading || challengesLoading) && (
          <div className="flex items-center gap-2 text-muted-foreground mb-3 sm:mb-4">
            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> <span className="text-xs sm:text-sm">Loading...</span>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card className="glass-card border-primary/20">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
              <CardDescription className="text-xs sm:text-sm">Active Challenges</CardDescription>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold">{stats.activeChallenges}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-success">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="truncate">Currently Running</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-secondary/20">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
              <CardDescription className="text-xs sm:text-sm">Total Players</CardDescription>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold">{stats.totalPlayers}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-secondary">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="truncate">{stats.activePlayers} Active Now</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-accent/20">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
              <CardDescription className="text-xs sm:text-sm">Active Players</CardDescription>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold">{stats.activePlayers}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-accent">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="truncate">In Challenges</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
              <CardDescription className="text-xs sm:text-sm">Top Performers</CardDescription>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold">{stats.topPerformers}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="truncate">This Week</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <TabsList className="glass-card w-full sm:w-auto overflow-x-auto flex-nowrap justify-start sm:justify-center">
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap">Overview</TabsTrigger>
            <TabsTrigger value="challenges" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap">Challenges</TabsTrigger>
            <TabsTrigger value="categories" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap">Categories</TabsTrigger>
            <TabsTrigger value="difficulty" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap">Difficulty</TabsTrigger>
            <TabsTrigger value="levels" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap">Levels</TabsTrigger>
            <TabsTrigger value="players" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap">Players</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Active Challenges */}
            <Card className="glass-card border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle>Active Challenges</CardTitle>
                    <CardDescription>Currently running challenges</CardDescription>
                  </div>
                  <Button variant="hero" size="sm" className="text-xs sm:text-sm h-8 sm:h-10" onClick={() => navigate("/admin/create-challenge")}>
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline ml-2">Create New</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-2 sm:space-y-3">
                  {activeChallenges.length === 0 && (
                    <div className="text-sm text-muted-foreground py-4">No active challenges.</div>
                  )}
                  {activeChallenges.map((challenge) => (
                    <div key={challenge.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg bg-muted/20 border border-border/50">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base truncate">{challenge.name}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{challenge.participants} participants</p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                        <div className="text-left sm:text-right">
                          <p className="text-xs sm:text-sm text-muted-foreground">Completion Rate</p>
                          <p className="font-bold text-success text-sm sm:text-base">{challenge.completionRate}%</p>
                        </div>
                        <Badge className="bg-success text-success-foreground text-xs">{challenge.status}</Badge>
                        <Button variant="outline" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0" onClick={() => navigate(`/challenge/${challenge.id}`)}>
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="challenges" className="space-y-6">
            <Card className="glass-card border-border/50">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle>Challenge Management</CardTitle>
                    <CardDescription>View, edit, and delete challenges</CardDescription>
                  </div>
                  <Button variant="hero" size="sm" className="text-xs sm:text-sm h-8 sm:h-10" onClick={() => navigate("/admin/create-challenge")}>
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="ml-1.5 sm:ml-2">Create Challenge</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {challengesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !challengesData?.challenges || challengesData.challenges.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">No challenges created yet</p>
                    <Button variant="hero" size="sm" className="text-xs sm:text-sm h-8 sm:h-10" onClick={() => navigate("/admin/create-challenge")}>
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="ml-1.5 sm:ml-2">Create First Challenge</span>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {challengesData.challenges.map((challenge) => {
                      const now = new Date();
                      const startDate = new Date(challenge.startDate);
                      const endDate = new Date(challenge.endDate);
                      let status = 'upcoming';
                      if (now >= startDate && now <= endDate) {
                        status = 'active';
                      } else if (now > endDate) {
                        status = 'completed';
                      }

                      // Handle base64 images, http URLs, and file paths
                      const imageUrl = challenge.image ? (
                        challenge.image.startsWith('data:image') || challenge.image.startsWith('http') 
                          ? challenge.image 
                          : `${UPLOADS_BASE}/uploads/${challenge.image}`
                      ) : null;

                      return (
                        <div
                          key={challenge.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg bg-muted/20 border border-border/50 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0 w-full sm:w-auto">
                            {imageUrl && (
                              <img 
                                src={imageUrl} 
                                alt={challenge.title}
                                style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                                className="flex-shrink-0 hidden sm:block"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            {imageUrl && (
                              <img 
                                src={imageUrl} 
                                alt={challenge.title}
                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                                className="flex-shrink-0 sm:hidden"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                <h3 className="font-semibold text-sm sm:text-base truncate">{challenge.title}</h3>
                                <Badge variant={status === 'active' ? 'default' : status === 'completed' ? 'secondary' : 'outline'} className="text-xs">
                                  {status === 'active' ? 'Active' : status === 'upcoming' ? 'Upcoming' : 'Completed'}
                                </Badge>
                                {!challenge.isActive && (
                                  <Badge variant="destructive" className="text-xs">Inactive</Badge>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mb-1.5">
                                {challenge.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                                <span>{challenge.category}</span>
                                <span>•</span>
                                <span>{challenge.difficulty}</span>
                                <span>•</span>
                                <span>Lv {challenge.requiredLevel}</span>
                                <span>•</span>
                                <span>{challenge._count?.progress || 0} participants</span>
                                <span>•</span>
                                <span>{challenge.stages.length} stages</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 sm:flex-none h-8 text-xs sm:text-sm"
                              onClick={() => navigate(`/admin/edit-challenge/${challenge.id}`)}
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1 sm:flex-none h-8 text-xs sm:text-sm"
                              onClick={() => handleDeleteChallenge(challenge)}
                              disabled={deleteChallengeMutation.isPending}
                            >
                              {deleteChallengeMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="levels">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Level Management</CardTitle>
                    <CardDescription>Create and manage player levels with XP ranges</CardDescription>
                  </div>
                  <Button variant="hero" onClick={() => handleOpenLevelDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Level
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {levelsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : levels.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">No levels configured yet</p>
                    <Button variant="hero" onClick={() => handleOpenLevelDialog()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Level
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {levels
                      .sort((a, b) => a.number - b.number)
                      .map((level) => (
                        <div
                          key={level.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline" className="text-lg px-3 py-1">
                                Level {level.number}
                              </Badge>
                              <h3 className="font-semibold text-lg">{level.name}</h3>
                              {!level.isActive && (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {level.minXP} - {level.maxXP ?? '∞'} XP
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenLevelDialog(level)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${level.name}?`)) {
                                  deleteLevelMutation.mutate(level.id);
                                }
                              }}
                              disabled={deleteLevelMutation.isPending}
                            >
                              {deleteLevelMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Delete'
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Category Management</CardTitle>
                    <CardDescription>Create and manage challenge categories</CardDescription>
                  </div>
                  <Button variant="hero" onClick={() => handleOpenCategoryDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {categoriesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Tag className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">No categories created yet</p>
                    <Button variant="hero" onClick={() => handleOpenCategoryDialog()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Category
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {category.icon && (
                              <span className="text-2xl">{category.icon}</span>
                            )}
                            <h3 className="font-semibold text-lg">{category.name}</h3>
                            {!category.isActive && (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                            {category.color && (
                              <div 
                                className="w-6 h-6 rounded-full border border-border"
                                style={{ backgroundColor: category.color }}
                              />
                            )}
                          </div>
                          {category.description && (
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenCategoryDialog(category)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
                                deleteCategoryMutation.mutate(category.id);
                              }
                            }}
                            disabled={deleteCategoryMutation.isPending}
                          >
                            {deleteCategoryMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Delete'
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="difficulty">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Difficulty Settings</CardTitle>
                    <CardDescription>Manage difficulty levels shown in the client side</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-success text-success-foreground">EASY</Badge>
                        <span className="font-medium">Easy Difficulty</span>
                      </div>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Challenges with easy difficulty are shown to all players
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-accent text-accent-foreground">MEDIUM</Badge>
                        <span className="font-medium">Medium Difficulty</span>
                      </div>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Challenges with medium difficulty are shown to all players
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-destructive text-destructive-foreground">HARD</Badge>
                        <span className="font-medium">Hard Difficulty</span>
                      </div>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Challenges with hard difficulty are shown to all players
                    </p>
                  </div>
                  <div className="mt-4 p-4 rounded-lg bg-background/50 border border-border/50">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> Difficulty levels are predefined (EASY, MEDIUM, HARD) and cannot be modified. 
                      All difficulty levels are currently enabled and visible to players in the client dashboard.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="players">
            <Card className="glass-card border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Player Management</CardTitle>
                    <CardDescription>View and manage all players in the system</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Search players by username, email, or name..."
                        value={playerSearch}
                        onChange={(e) => setPlayerSearch(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Select
                      value={playerFilterActive === undefined ? "all" : playerFilterActive ? "active" : "inactive"}
                      onValueChange={(value) => {
                        if (value === "all") setPlayerFilterActive(undefined);
                        else if (value === "active") setPlayerFilterActive(true);
                        else setPlayerFilterActive(false);
                      }}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Players</SelectItem>
                        <SelectItem value="active">Active Only</SelectItem>
                        <SelectItem value="inactive">Inactive Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {playersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !playersData?.users || playersData.users.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No players found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {playersData.users.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/50"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold">
                            {player.avatar ? (
                              <img src={player.avatar} alt={player.username} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span>{player.username.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{player.username}</h3>
                              {player.isAdmin && (
                                <Badge variant="default" className="bg-primary">Admin</Badge>
                              )}
                              {!player.isActive && (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{player.email}</span>
                              {player.firstName && player.lastName && (
                                <>
                                  <span>•</span>
                                  <span>{player.firstName} {player.lastName}</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>Level {player.level}</span>
                              <span>•</span>
                              <span>{player.xp} XP</span>
                              <span>•</span>
                              <span>{player._count?.challengeProgress || 0} challenges completed</span>
                              {player.rank && (
                                <>
                                  <span>•</span>
                                  <span>Rank #{player.rank}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={player.isActive ? "destructive" : "default"}
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to ${player.isActive ? 'deactivate' : 'activate'} "${player.username}"?`)) {
                                toggleUserStatusMutation.mutate(player.id);
                              }
                            }}
                            disabled={toggleUserStatusMutation.isPending}
                          >
                            {toggleUserStatusMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              player.isActive ? 'Deactivate' : 'Activate'
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Analytics and reports</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => {
        setIsCategoryDialogOpen(open);
        if (!open) resetCategoryForm();
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Create New Category'}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update category information.'
                : 'Add a new category that can be used when creating challenges.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                placeholder="e.g., Urban Exploration"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-description">Description (optional)</Label>
              <Textarea
                id="category-description"
                placeholder="Brief description of this category"
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category-icon">Icon (optional)</Label>
                <Input
                  id="category-icon"
                  placeholder="Icon name or emoji"
                  value={categoryIcon}
                  onChange={(e) => setCategoryIcon(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-color">Color (optional)</Label>
                <Input
                  id="category-color"
                  type="color"
                  value={categoryColor}
                  onChange={(e) => setCategoryColor(e.target.value)}
                  className="h-10"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCategoryDialogOpen(false);
                resetCategoryForm();
              }}
              disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCategory}
              disabled={(createCategoryMutation.isPending || updateCategoryMutation.isPending) || !categoryName.trim()}
              variant="hero"
            >
              {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Level Dialog */}
      <Dialog open={isLevelDialogOpen} onOpenChange={(open) => {
        setIsLevelDialogOpen(open);
        if (!open) resetLevelForm();
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingLevel ? 'Edit Level' : 'Create New Level'}</DialogTitle>
            <DialogDescription>
              {editingLevel
                ? 'Update level information and XP ranges.'
                : 'Create a new level that players can reach by earning XP.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level-number">Level Number *</Label>
                <Input
                  id="level-number"
                  type="number"
                  placeholder="1"
                  value={levelNumber}
                  onChange={(e) => setLevelNumber(e.target.value)}
                  min="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level-name">Level Name *</Label>
                <Input
                  id="level-name"
                  placeholder="e.g., Novice, Explorer, Master"
                  value={levelName}
                  onChange={(e) => setLevelName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level-min-xp">Min XP *</Label>
                <Input
                  id="level-min-xp"
                  type="number"
                  placeholder="0"
                  value={levelMinXP}
                  onChange={(e) => setLevelMinXP(e.target.value)}
                  min="0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="level-max-xp">Max XP (optional)</Label>
                <Input
                  id="level-max-xp"
                  type="number"
                  placeholder="Leave empty for unlimited"
                  value={levelMaxXP}
                  onChange={(e) => setLevelMaxXP(e.target.value)}
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to make this level unlimited
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsLevelDialogOpen(false);
                resetLevelForm();
              }}
              disabled={createLevelMutation.isPending || updateLevelMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveLevel}
              disabled={
                (createLevelMutation.isPending || updateLevelMutation.isPending) ||
                !levelNumber.trim() ||
                !levelName.trim() ||
                !levelMinXP.trim()
              }
              variant="hero"
            >
              {(createLevelMutation.isPending || updateLevelMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingLevel ? 'Update Level' : 'Create Level'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Challenge Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => setIsDeleteDialogOpen(open)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Delete Challenge</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedChallenge?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setIsDeleteDialogOpen(false); setSelectedChallenge(null); }}
              disabled={deleteChallengeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteChallenge}
              disabled={deleteChallengeMutation.isPending}
            >
              {deleteChallengeMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Delete Challenge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
