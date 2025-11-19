import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AvatarWithProgress from "@/components/AvatarWithProgress";
import { useProfile } from "@/hooks/useApi";
import { useTranslation } from "react-i18next";
import { getProgressPercent, xpToNextLevel, getLevelForXp } from "@/lib/levelThresholds";

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const { data: profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t("profile.loading")}</p>
      </div>
    );
  }

  const xp = profile?.xp || 0;
  const level = profile?.level || getLevelForXp(xp);
  const progress = getProgressPercent(xp);
  const xpRemaining = xpToNextLevel(xp);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar variant="client" />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="flex items-center justify-center md:justify-start">
            <AvatarWithProgress size={128} progress={Math.round(progress)} src={profile?.avatar || null} alt={profile?.username || 'avatar'} strokeWidth={10} />
          </div>

          <div className="md:col-span-2">
            <h1 className="text-2xl font-bold">{profile?.firstName} {profile?.lastName}</h1>
            <p className="text-muted-foreground">@{profile?.username}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div>{t('profile.level')}: <strong>{level}</strong></div>
              <div>{t('profile.xp')}: <strong>{xp}</strong></div>
              <div>{t('profile.levelProgress')}: <strong>{progress}%</strong></div>
              <div>{t('profile.xpToNext') ?? 'XP to next'}: <strong>{xpRemaining}</strong></div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
