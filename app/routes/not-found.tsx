import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/store/use-auth-store";
import { usePageTitle } from "@/lib/use-page-title";

export default function NotFound() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  usePageTitle("404");
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const home = isAuthenticated ? `/${lang}/dashboard` : `/${lang}`;
  return (
    <div className="bg-base-200 flex min-h-screen flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-base-content/70">{t("notFound.message")}</p>
      <Link to={home} className="btn btn-primary">
        {t("notFound.backHome")}
      </Link>
    </div>
  );
}
