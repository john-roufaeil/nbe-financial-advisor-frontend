import { Link, Navigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useAuthStore } from "@/store/use-auth-store";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { usePageTitle } from "@/lib/use-page-title";

export default function Splash() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  usePageTitle(t("splash.welcome"));
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const onboardingStarted = useOnboardingStore((s) => s.started);
  const resetOnboarding = useOnboardingStore((s) => s.reset);

  if (isAuthenticated) return <Navigate to={`/${lang}/dashboard`} replace />;

  return (
    <div className="bg-base-200 relative flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <div className="absolute inset-e-4 top-4 w-28">
        <LanguageSwitcher />
      </div>

      <img src="/logo.webp" alt={t("app.name")} className="h-16 w-auto" />

      <div className="mb-20 flex flex-col items-center gap-1.5 text-center">
        <p className="text-base-content max-w-sm text-lg font-medium">
          {t("splash.welcome")}
        </p>
        <p className="text-base-content/60 text- max-w-sm">{t("splash.tagline")}</p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        {onboardingStarted && (
          <Link to={`/${lang}/onboarding`} className="btn btn-primary">
            {t("splash.continue")}
          </Link>
        )}
        <Link
          to={`/${lang}/consent`}
          onClick={() => onboardingStarted && resetOnboarding()}
          className={`btn ${onboardingStarted ? "btn-outline btn-primary" : "btn-primary"}`}
        >
          {t("splash.getStarted")}
        </Link>
        <Link to={`/${lang}/sign-in`} className="btn btn-outline">
          {t("splash.login")}
        </Link>
      </div>
    </div>
  );
}
