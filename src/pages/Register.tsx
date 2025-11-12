import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { Crown, Mail, Lock, User, Chrome, Loader2, Eye, EyeOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useApi";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { apiClient } from "@/lib/api";
import logger from "@/lib/logger";
import ParticlesBackground from "@/components/ParticlesBackground";
import AnimatedGradient from "@/components/AnimatedGradient";
import FloatingShapes from "@/components/FloatingShapes";
import GradientOrbs from "@/components/GradientOrbs";

const Register = () => {
  const navigate = useNavigate();
  const { register, isRegistering, registerError } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const response = await apiClient.register(formData);
    logger.info("✅ Registered:", response.user);

    // Redirect only after successful registration
    navigate("/dashboard");
  } catch (err) {
    console.error("❌ Registration failed:", err);
  }
};


  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Multi-Layer Animated Background */}
      <div className="fixed inset-0 w-full h-full -z-10">
        {/* Base: Gradient Orbs */}
        <GradientOrbs />
        
        {/* Layer 1: Floating Geometric Shapes */}
        <FloatingShapes />
        
        {/* Layer 2: Animated Gradient Waves */}
        <AnimatedGradient />
        
        {/* Layer 3: Interactive Particles */}
        <ParticlesBackground />
      </div>
      
      <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[var(--shadow-glow-primary)]">
              <Crown className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-[hsl(263,70%,60%)] to-[hsl(190,95%,60%)] bg-clip-text text-transparent">
              SwipeRush
            </span>
          </div>
          <p className="text-base text-muted-foreground font-medium">{t("auth.beginJourney")}</p>
          <div className="mt-4">
            <LanguageSwitcher />
          </div>
        </div>

        <Card className="glass-card border-border/50 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow-primary)] transition-all duration-300 rounded-xl overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold">{t("auth.createAccount")}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground/80 mt-1">
              {t("auth.joinThousands")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleRegister} className="space-y-5">
              {registerError && (
                <Alert variant="destructive" className="text-sm">
                  <AlertDescription className="text-xs">
                    {registerError.message || t("auth.registrationFailed")}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-foreground">
                  {t("auth.username")}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="challenger123"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="pl-10 h-11 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                    disabled={isRegistering}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  {t("auth.email")}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="pl-10 h-11 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                    disabled={isRegistering}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  {t("auth.password")}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="pl-10 pr-10 h-11 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                    disabled={isRegistering}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-sm"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground/70 pl-1">
                  Must be at least 8 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  {t("auth.confirmPassword")}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="pl-10 pr-10 h-11 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                    disabled={isRegistering}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full h-11 text-sm font-semibold shadow-lg"
                disabled={isRegistering}>
                {isRegistering ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("auth.creatingAccount")}
                  </>
                ) : (
                  t("auth.createAccount")
                )}
              </Button>

              <div className="relative my-6">
                <Separator className="bg-border/50" />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs font-medium text-muted-foreground/80">
                  {t("common.or") || "OR"}
                </span>
              </div>

              <Button type="button" variant="glass" className="w-full h-11 text-sm font-medium border-border/50 hover:border-border transition-all">
                <Chrome className="w-4 h-4 mr-2" />
                {t("auth.continueWithGoogle")}
              </Button>

              <div className="text-center pt-2 border-t border-border/50">
                <p className="text-xs sm:text-sm text-muted-foreground/90">
                  {t("auth.alreadyHaveAccount")}{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline hover:text-primary/80 transition-colors font-semibold"
                    onClick={() => navigate("/login")}>
                    {t("auth.signIn")}
                  </button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← {t("common.back")} {t("navigation.home")}
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Register;
