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
import { Crown, Mail, Lock, Chrome, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useApi";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useToast } from "@/components/ui/use-toast";

const Login = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login, isLoggingIn, loginError } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ Show error toast dynamically when loginError changes
  useEffect(() => {
    if (loginError) {
      toast({
        title: "❌ Login failed",
        description:
          loginError.message ||
          (loginError as any).error ||
          t("auth.loginFailed"),
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
      await login({ email, password });

      await queryClient.invalidateQueries({ queryKey: ["profile"] });

      toast({
        title: "✅ Successfully logged in",
        description: "Welcome back!",
        duration: 2500,
        className:
          "border-green-500 bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-100",
      });

      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "⚠️ Unexpected error",
        description: "Please try again later.",
        duration: 3000,
        className:
          "border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Crown className="w-10 h-10 text-primary" />
            <span className="text-3xl font-bold bg-gradient-to-r from-[hsl(263,70%,60%)] to-[hsl(190,95%,60%)] bg-clip-text text-transparent">
              ChallengeQuest
            </span>
          </div>
          <p className="text-muted-foreground">{t("auth.welcomeBack")}</p>
          <div className="mt-4">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Login Card */}
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>{t("auth.signIn")}</CardTitle>
            <CardDescription>{t("auth.enterCredentials")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoggingIn}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoggingIn}
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="hero"
                className="w-full"
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

              <div className="relative my-4">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  OR
                </span>
              </div>

              <Button type="button" variant="glass" className="w-full">
                <Chrome className="w-4 h-4" />
                {t("auth.continueWithGoogle")}
              </Button>

              <div className="text-center text-sm">
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => {
                    /* TODO: Password reset */
                  }}>
                  {t("auth.forgotPassword")}
                </button>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                {t("auth.dontHaveAccount")}{" "}
                <button
                  type="button"
                  className="text-primary hover:underline font-semibold"
                  onClick={() => navigate("/register")}>
                  {t("auth.signUp")}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Back button */}
        <div className="text-center mt-6">
          <Button variant="ghost" onClick={() => navigate("/")}>
            ← {t("common.back")} {t("navigation.home")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
