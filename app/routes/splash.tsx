import { Link, Navigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Wallet, Target, Bot } from "lucide-react";
import { AuthLayout } from "@/components/shared/layout/AuthLayout";
import { useAuthStore } from "@/store/use-auth-store";
import { useOnboardingStore } from "@/store/use-onboarding-store";
import { usePageTitle } from "@/lib/use-page-title";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";

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
  const begin = useOnboardingStore((s) => s.begin);

  if (isAuthenticated)
    return <Navigate to={localizedPath(lang!, ROUTE_SEGMENTS.dashboard)} replace />;

  return (
    <AuthLayout>
      <div className="mx-auto flex w-full flex-col gap-10">
        <img src="/logo.webp" alt={t("app.name")} className="mx-auto w-1/2 max-w-50" />

        <div className="flex flex-col gap-1.5 text-center">
          <h1 className="text-2xl font-semibold text-balance">{t("splash.welcome")}</h1>
          <p className="text-base-content/60">{t("splash.tagline")}</p>
        </div>

        <ul className="grid w-full grid-cols-3 gap-3">
          {FEATURES.map(({ icon: Icon, key }) => (
            <li
              key={key}
              className="bg-primary/10 flex aspect-square flex-col items-center justify-center gap-2 rounded-xl p-2 text-center"
            >
              <span className="text-primary grid size-10 shrink-0 place-items-center rounded-lg">
                <Icon className="size-6 lg:size-8" />
              </span>
              <p className="w-2/3 text-sm font-medium text-balance">
                {t(`authPanel.features.${key}.title`)}
              </p>
            </li>
          ))}
        </ul>

        <div className="flex w-full flex-col gap-3">
          <Link
            to={localizedPath(lang!, ROUTE_SEGMENTS.onboarding)}
            onClick={() => begin()}
            className="btn btn-primary"
          >
            {t("splash.getStarted")}
          </Link>
          <Link
            to={localizedPath(lang!, ROUTE_SEGMENTS.signIn)}
            className="btn btn-ghost"
          >
            {t("splash.login")}
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
