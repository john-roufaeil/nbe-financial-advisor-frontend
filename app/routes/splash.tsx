import { Link, Navigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Wallet, Target, Bot } from "lucide-react";
import { AuthLayout } from "@/components/shared/AuthLayout";
import { useAuthStore } from "@/store/use-auth-store";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { usePageTitle } from "@/lib/use-page-title";

const FEATURES = [
  { icon: Wallet, key: "track" },
  { icon: Target, key: "goals" },
  { icon: Bot, key: "advisor" },
] as const;

export default function Splash() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  usePageTitle(t("splash.welcome"));
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const onboardingStarted = useOnboardingStore((s) => s.started);
  const begin = useOnboardingStore((s) => s.begin);

  if (isAuthenticated) return <Navigate to={`/${lang}/dashboard`} replace />;

  return (
    <AuthLayout>
      <div className="mx-auto flex flex-col gap-10">
        <img src="/logo.webp" alt={t("app.name")} className="mx-auto w-1/2" />

        <div className="flex flex-col gap-1.5 text-center">
          <h1 className="text-2xl font-semibold text-balance">{t("splash.welcome")}</h1>
          <p className="text-base-content/60">{t("splash.tagline")}</p>
        </div>

        <ul className="flex flex-col gap-4">
          {FEATURES.map(({ icon: Icon, key }) => (
            <li key={key} className="flex items-start gap-3">
              <span className="bg-primary/10 text-primary grid size-10 shrink-0 place-items-center rounded-lg">
                <Icon className="size-4.5" />
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {t(`authPanel.features.${key}.title`)}
                </p>
                <p className="text-base-content/60 mt-0.5 text-xs">
                  {t(`authPanel.features.${key}.description`)}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-3">
          {onboardingStarted && (
            <Link to={`/${lang}/onboarding`} className="btn btn-primary">
              {t("splash.continue")}
            </Link>
          )}
          <Link
            to={`/${lang}/onboarding`}
            onClick={() => begin()}
            className={`btn ${onboardingStarted ? "btn-outline btn-primary" : "btn-primary"}`}
          >
            {t("splash.getStarted")}
          </Link>
          <Link to={`/${lang}/sign-in`} className="btn btn-ghost">
            {t("splash.login")}
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
