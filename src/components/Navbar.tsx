import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Crown, LogOut, User as UserIcon, ShieldCheck, Plus, Home, ArrowLeft, Trophy, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth, useProfile } from "@/hooks/useApi";
import { useTranslation } from "react-i18next";
import { apiClient } from "@/lib/api";

interface NavbarProps {
  /**
   * The variant/style of the navbar
   * - 'client': Fixed client navbar (Logo, Dashboard, Leaderboard, Language, Theme, Profile, Logout)
   * - 'admin': Fixed admin navbar (Logo, Dashboard, Leaderboard, Admin Dashboard, Language, Theme, Profile, Logout)
   * - 'default': Standard navbar (Landing - for backward compatibility)
   * - 'profile': Profile page (for backward compatibility)
   * - 'leaderboard': Leaderboard page (for backward compatibility)
   * - 'challenge-detail': Challenge detail page (shows back button)
   * - 'create-challenge': Create challenge page (shows back to admin)
   */
  variant?: 'client' | 'admin' | 'default' | 'dashboard' | 'profile' | 'leaderboard' | 'challenge-detail' | 'create-challenge';
  
  /**
   * Custom title override (optional)
   * If not provided, uses default title based on variant and user state
   */
  title?: string;
  
  /**
   * Click handler for title/logo (optional)
   * If not provided, uses default navigation based on variant
   */
  onTitleClick?: () => void;
}

const Navbar = ({ variant = 'default', title, onTitleClick }: NavbarProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { data: profile } = useProfile();
  const isAuthenticated = apiClient.isAuthenticated();
  const isAdmin = profile?.isAdmin ?? false;

  // Determine default title
  const getDefaultTitle = (): string => {
    if (title) return title;
    
    switch (variant) {
      case 'admin':
        return 'Admin Dashboard';
      case 'dashboard':
        return isAdmin ? 'Admin Dashboard' : 'SwipeRush';
      case 'profile':
      case 'challenge-detail':
      case 'create-challenge':
      case 'default':
      default:
        return 'SwipeRush';
    }
  };

  // Determine default title click handler
  const handleTitleClick = () => {
    if (onTitleClick) {
      onTitleClick();
      return;
    }

    switch (variant) {
      case 'admin':
      case 'dashboard':
      case 'profile':
        navigate('/dashboard');
        break;
      case 'challenge-detail':
      case 'default':
      default:
        navigate('/');
        break;
      case 'create-challenge':
        navigate('/admin');
        break;
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navbarTitle = getDefaultTitle();
  const titleIsClickable = variant !== 'admin' && variant !== 'dashboard' && variant !== 'create-challenge' && variant !== 'client';

  // Fixed client variant: Logo, Dashboard, Leaderboard, Language, Theme, Profile, Logout
  if (variant === 'client') {
    return (
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50 shadow-sm">
        <div className="w-full max-w-full px-3 sm:px-6 h-12 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo/Title */}
          <div
            className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink transition-all duration-200 cursor-pointer hover:opacity-80 active:scale-95"
            onClick={() => navigate('/dashboard')}
          >
            <div className="relative flex items-center justify-center" style={{ width: '1.5rem', height: '1.5rem' }}>
              <Crown className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary flex-shrink-0 drop-shadow-sm hover:drop-shadow-lg transition-all" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              <div className="absolute inset-0 bg-primary/20 blur-xl opacity-50 -z-10" />
            </div>
            <span className="text-sm sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[hsl(263,70%,60%)] via-[hsl(263,70%,65%)] to-[hsl(190,95%,60%)] bg-clip-text text-transparent truncate drop-shadow-sm">SwipeRush</span>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
            {/* Dashboard Button - Desktop */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/dashboard")}
                  className="hidden sm:inline-flex text-sm px-4 py-2 hover:bg-primary/10 hover:text-primary dark:hover:text-primary hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-200 rounded-lg"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Go to dashboard</p>
              </TooltipContent>
            </Tooltip>
            {/* Dashboard Button - Mobile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/dashboard")}
                  className="sm:hidden h-9 w-9 hover:bg-primary/10 hover:text-primary dark:hover:text-primary hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-200 rounded-lg"
                >
                  <LayoutDashboard className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Go to dashboard</p>
              </TooltipContent>
            </Tooltip>

            {/* Leaderboard Button - Desktop */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/leaderboard")}
                  className="hidden sm:inline-flex text-sm px-4 py-2 hover:bg-primary/10 hover:text-primary dark:hover:text-primary hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-200 rounded-lg"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Leaderboard
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View leaderboard</p>
              </TooltipContent>
            </Tooltip>
            {/* Leaderboard Button - Mobile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/leaderboard")}
                  className="sm:hidden h-9 w-9 hover:bg-primary/10 hover:text-primary dark:hover:text-primary hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-200 rounded-lg"
                >
                  <Trophy className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View leaderboard</p>
              </TooltipContent>
            </Tooltip>

            {/* Admin Dashboard Button - Desktop - Only show if user is admin */}
            {isAdmin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/admin")}
                    className="hidden sm:inline-flex text-sm px-4 py-2 hover:bg-primary/10 hover:text-primary dark:hover:text-primary hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-200 rounded-lg"
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Go to admin dashboard</p>
                </TooltipContent>
              </Tooltip>
            )}
            {/* Admin Dashboard Button - Mobile - Only show if user is admin */}
            {isAdmin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/admin")}
                    className="sm:hidden h-9 w-9 hover:bg-primary/10 hover:text-primary dark:hover:text-primary hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-200 rounded-lg"
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Go to admin dashboard</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Language Switcher (hidden on very small screens) */}
            <div className="hidden sm:inline-block">
              <LanguageSwitcher />
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Profile Icon */}
            {isAuthenticated && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/profile")}
                    className="h-9 w-9 sm:h-11 sm:w-11 hover:bg-primary/10 hover:text-primary dark:hover:text-primary hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-200 rounded-lg"
                  >
                    <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View your profile</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Logout Icon */}
            {isAuthenticated && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="h-9 w-9 sm:h-11 sm:w-11 hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-200 rounded-lg"
                  >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Logout from your account</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </header>
    );
  }

  // Fixed admin variant: Logo, Dashboard, Leaderboard, Admin Dashboard, Language, Theme, Profile, Logout
  if (variant === 'admin') {
    return (
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50 shadow-sm">
        <div className="w-full max-w-full px-3 sm:px-6 h-12 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo/Title */}
          <div
            className="flex items-center gap-1 sm:gap-2 min-w-0 flex-shrink transition-all duration-200 cursor-pointer hover:opacity-80 active:scale-95"
            onClick={() => navigate('/admin')}
          >
            <div className="relative flex items-center justify-center" style={{ width: '1.5rem', height: '1.5rem' }}>
              <Crown className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-primary flex-shrink-0 drop-shadow-sm hover:drop-shadow-lg transition-all" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              <div className="absolute inset-0 bg-primary/20 blur-xl opacity-50 -z-10" />
            </div>
            <span className="text-xs sm:text-base md:text-lg lg:text-xl font-bold bg-gradient-to-r from-[hsl(263,70%,60%)] via-[hsl(263,70%,65%)] to-[hsl(190,95%,60%)] bg-clip-text text-transparent truncate drop-shadow-sm">Admin Dashboard</span>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
            {/* Dashboard Button - Desktop */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/dashboard")}
                  className="hidden sm:inline-flex text-sm px-4 py-2 hover:bg-primary/10 hover:text-primary dark:hover:text-primary hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-200 rounded-lg"
                >
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Go to dashboard</p>
              </TooltipContent>
            </Tooltip>
            {/* Dashboard Button - Mobile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/dashboard")}
                  className="sm:hidden h-9 w-9 hover:bg-primary/10 hover:text-primary dark:hover:text-primary hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-200 rounded-lg"
                >
                  <LayoutDashboard className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Go to dashboard</p>
              </TooltipContent>
            </Tooltip>

            {/* Leaderboard Button - Desktop */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/leaderboard")}
                  className="hidden sm:inline-flex text-sm px-4 py-2 hover:bg-primary/10 hover:text-primary dark:hover:text-primary hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-200 rounded-lg"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Leaderboard
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View leaderboard</p>
              </TooltipContent>
            </Tooltip>
            {/* Leaderboard Button - Mobile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/leaderboard")}
                  className="sm:hidden h-9 w-9 hover:bg-primary/10 hover:text-primary dark:hover:text-primary hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-200 rounded-lg"
                >
                  <Trophy className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View leaderboard</p>
              </TooltipContent>
            </Tooltip>

            {/* Admin Dashboard Button - Desktop */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/admin")}
                  className="hidden sm:inline-flex text-sm px-4 py-2 hover:bg-primary/10 hover:text-primary dark:hover:text-primary hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-200 rounded-lg"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Go to admin dashboard</p>
              </TooltipContent>
            </Tooltip>
            {/* Admin Dashboard Button - Mobile */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/admin")}
                  className="sm:hidden h-9 w-9 hover:bg-primary/10 hover:text-primary dark:hover:text-primary hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-200 rounded-lg"
                >
                  <ShieldCheck className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Go to admin dashboard</p>
              </TooltipContent>
            </Tooltip>

            {/* Language Switcher (hidden on very small screens) */}
            <div className="hidden sm:inline-block">
              <LanguageSwitcher />
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Profile Icon */}
            {isAuthenticated && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/profile")}
                    className="h-9 w-9 sm:h-11 sm:w-11 hover:bg-primary/10 hover:text-primary dark:hover:text-primary hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-200 rounded-lg"
                  >
                    <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View your profile</p>
                </TooltipContent>
              </Tooltip>
            )}

            {/* Logout Icon */}
            {isAuthenticated && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="h-9 w-9 sm:h-11 sm:w-11 hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all duration-200 rounded-lg"
                  >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Logout from your account</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </header>
    );
  }

  // Special layout for create-challenge: back button on left, title in center, empty space on right
  if (variant === 'create-challenge') {
    return (
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="w-full max-w-full px-3 sm:px-6 h-12 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/admin")}
                  className="text-xs sm:text-sm px-2 sm:px-4 h-9 sm:h-10 flex-shrink-0 hover:bg-primary/10 hover:text-primary dark:hover:text-primary transition-all duration-200"
                >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2 hidden sm:inline" />
                <span className="hidden sm:inline">Back to Admin</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Return to admin dashboard</p>
            </TooltipContent>
          </Tooltip>
          <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent text-center truncate flex-1 min-w-0">
            {navbarTitle}
          </h1>
          <div className="w-12 sm:w-24 flex-shrink-0" />
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50 shadow-sm">
      <div className="w-full max-w-full px-3 sm:px-4 h-12 sm:h-16 flex items-center justify-between gap-2">
        {/* Logo/Title */}
        <div
          className={`flex items-center gap-1 sm:gap-2 min-w-0 flex-shrink transition-all duration-200 ${titleIsClickable ? 'cursor-pointer hover:opacity-80 active:scale-95' : ''}`}
          onClick={titleIsClickable ? handleTitleClick : undefined}
        >
          <div className="relative">
            <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0 drop-shadow-sm" />
            <div className="absolute inset-0 bg-primary/20 blur-xl opacity-50 -z-10" />
          </div>
          <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-[hsl(263,70%,60%)] via-[hsl(263,70%,65%)] to-[hsl(190,95%,60%)] bg-clip-text text-transparent truncate drop-shadow-sm">{navbarTitle}</span>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
          {/* Language Switcher & Theme Toggle - shown for most variants */}
          {(variant === 'default' || variant === 'dashboard' || variant === 'profile' || variant === 'leaderboard') && (
            <>
              <div className="hidden sm:inline-block">
                <LanguageSwitcher />
              </div>
              <ThemeToggle />
            </>
          )}

          {/* Variant-specific buttons */}
          {variant === 'default' && (
            <>
              {!isAuthenticated ? (
                <>
                  {/* Login Button - Desktop */}
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/login")}
                    className="hidden sm:inline-flex text-sm px-4 py-2 hover:bg-primary/10 hover:text-primary dark:hover:text-primary hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-200 rounded-lg"
                  >
                    {t("navigation.login")}
                  </Button>
                  {/* Login Button - Mobile */}
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/login")}
                    className="sm:hidden text-xs px-2 h-9 hover:bg-primary/10 hover:text-primary dark:hover:text-primary transition-all duration-200"
                  >
                    {t("navigation.login")}
                  </Button>
                  <Button
                    variant="hero"
                    onClick={() => navigate("/register")}
                    className="text-xs sm:text-sm px-2 sm:px-4 h-9 sm:h-10 shadow-md hover:shadow-lg transition-all hover:scale-105"
                  >
                    <span className="hidden sm:inline">{t("landing.getStarted")}</span>
                    <span className="sm:hidden">Start</span>
                  </Button>
                </>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="h-9 w-9 sm:h-10 sm:w-10 hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20 transition-all duration-200"
                    >
                      <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Logout from your account</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          )}

          {variant === 'dashboard' && (
            <>
              {isAdmin && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      onClick={() => navigate("/admin")}
                      className="hidden sm:inline-flex text-sm px-4 py-2 hover:bg-primary/10 hover:text-primary dark:hover:text-primary hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-200 rounded-lg"
                    >
                      <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Admin Panel</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Go to admin panel</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {isAdmin && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="hero"
                      onClick={() => navigate("/admin/create-challenge")}
                      className="text-xs sm:text-sm px-2 sm:px-4 h-9 sm:h-10"
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                      <span className="hidden sm:inline">New Challenge</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create a new challenge</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/profile")}
                    className="h-9 w-9 sm:h-11 sm:w-11 hover:bg-primary/10 hover:text-primary dark:hover:text-primary hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-200 rounded-lg"
                  >
                    <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View your profile</p>
                </TooltipContent>
              </Tooltip>
              {isAuthenticated && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="h-9 w-9 sm:h-10 sm:w-10 hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20 transition-all duration-200"
                    >
                      <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Logout from your account</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          )}


          {variant === 'profile' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="h-9 w-9 sm:h-10 sm:w-10 hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Logout from your account</p>
              </TooltipContent>
            </Tooltip>
          )}

          {variant === 'challenge-detail' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/dashboard")}
                  className="text-xs sm:text-sm px-2 sm:px-4 h-9 sm:h-10 flex-shrink-0 hover:bg-primary/10 hover:text-primary dark:hover:text-primary dark:hover:bg-primary/20 transition-all duration-200"
                >
                  <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2 hidden sm:inline" />
                  <span className="hidden sm:inline">Back to Dashboard</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Return to dashboard</p>
              </TooltipContent>
            </Tooltip>
          )}


          {/* Leaderboard-specific buttons */}
          {variant === 'leaderboard' && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/dashboard")}
                    className="hidden sm:inline-flex text-sm px-4 py-2 hover:bg-primary/10 hover:text-primary dark:hover:text-primary hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-200 rounded-lg"
                  >
                    Dashboard
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Go to your dashboard</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/dashboard")}
                    className="sm:hidden h-9 w-9 hover:bg-primary/10 hover:text-primary dark:hover:text-primary transition-all duration-200"
                  >
                    <Home className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Go to your dashboard</p>
                </TooltipContent>
              </Tooltip>
              {!isAuthenticated && (
              <Button
                variant="glass"
                onClick={() => navigate("/login")}
                className="text-xs sm:text-sm px-2 sm:px-4 h-9 sm:h-10 hover:bg-primary/10 hover:text-primary dark:hover:text-primary transition-all duration-200"
              >
                Sign In
              </Button>
              )}
              {isAuthenticated && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="h-9 w-9 sm:h-10 sm:w-10 hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20 transition-all duration-200"
                    >
                      <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Logout from your account</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

