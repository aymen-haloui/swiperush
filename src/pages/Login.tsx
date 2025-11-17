import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Crown, Mail, Lock, Chrome, Loader2, Eye, EyeOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useApi";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useToast } from "@/components/ui/use-toast";
import ParticlesBackground from "@/components/ParticlesBackground";
import AnimatedGradient from "@/components/AnimatedGradient";
import FloatingShapes from "@/components/FloatingShapes";
import GradientOrbs from "@/components/GradientOrbs";

const Login = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login, isLoggingIn, loginError } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ✅ Show error toast dynamically when loginError changes
  useEffect(() => {
    if (loginError) {
      toast({
        title: t('notifications.loginFailed.title'),
        description:
          loginError.message ||
          (loginError instanceof Error ? loginError.message : undefined) ||
          t('notifications.loginFailed.description'),
        duration: 3000,
        className:
          "border-red-500 bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-100",
      });
    }
  }, [loginError, toast, t]);

  // ✅ Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await login({ email, password }); // from your useAuth() hook

      // ✅ Store token securely
      if (res?.token) {
        localStorage.setItem("auth_token", res.token);
      }

      // ✅ Optional: store minimal user info if you need it later
      if (res?.user) {
        localStorage.setItem("user_email", res.user.email);
        localStorage.setItem("is_admin", String(res.user.isAdmin));
      }

      await queryClient.invalidateQueries({ queryKey: ["profile"] });

      // ✅ Redirect based on admin status
      if (res?.user?.isAdmin) {
        toast({
          title: t('notifications.welcomeAdmin.title'),
          description: t('notifications.welcomeAdmin.description') || 'Redirecting you to the admin dashboard...',
          duration: 2500,
          className:
            "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-100",
        });
        navigate("/admin");
      } else {
        toast({
          title: t('notifications.loginSuccess.title'),
          description: t('notifications.loginSuccess.description') || 'Welcome back!',
          duration: 2500,
          className:
            "border-green-500 bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-100",
        });
        navigate("/dashboard");
      }
    } catch (error: unknown) {
      console.error("Login failed:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Invalid email or password.";
      toast({
        title: t('notifications.loginFailed.title'),
        description: errorMessage || t('notifications.loginFailed.description'),
        duration: 3000,
        variant: "destructive",
      });
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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[var(--shadow-glow-primary)]">
              <Crown className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-[hsl(263,70%,60%)] to-[hsl(190,95%,60%)] bg-clip-text text-transparent">
              SwipeRush
            </span>
          </div>
          <p className="text-base text-muted-foreground font-medium">{t("auth.welcomeBack")}</p>
          <div className="mt-4">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Login Card */}
        <Card className="glass-card border-border/50 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-glow-primary)] transition-all duration-300 rounded-xl overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold">{t("auth.signIn")}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground/80 mt-1">
              {t("auth.enterCredentials")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleLogin} className="space-y-5">
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                    disabled={isLoggingIn}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                    required
                    disabled={isLoggingIn}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-sm"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  >
                    {showPassword ? (
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
                disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("auth.signingIn")}
                  </>
                ) : (
                  t("auth.signIn")
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

              <div className="text-center pt-2">
                <button
                  type="button"
                  className="text-xs sm:text-sm text-primary hover:underline hover:text-primary/80 transition-colors font-medium"
                  onClick={() => {
                    /* TODO: Password reset */
                  }}>
                  {t("auth.forgotPassword")}
                </button>
              </div>

              <div className="text-center pt-2 border-t border-border/50">
                <p className="text-xs sm:text-sm text-muted-foreground/90">
                  {t("auth.dontHaveAccount")}{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline hover:text-primary/80 transition-colors font-semibold"
                    onClick={() => navigate("/register")}>
                    {t("auth.signUp")}
                  </button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Back button */}
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

export default Login;
