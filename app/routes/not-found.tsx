import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Compass, ArrowLeft } from "lucide-react";
import { useAuthStore } from "@/store/use-auth-store";
import { usePageTitle } from "@/lib/use-page-title";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";

export default function NotFound() {
  const { lang } = useParams<{ lang: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  usePageTitle("404");
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // lang is the invalid raw segment (e.g. "foo") when LangLayout renders this
  // directly for a bad language prefix, not a real language — fall back to
  // the actual active i18n language (what the page is genuinely rendering
  // in) rather than linking into a /foo/... URL that doesn't exist either.
  const homeLang = SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)
    ? (lang as SupportedLanguage)
    : SUPPORTED_LANGUAGES.includes(i18n.language as SupportedLanguage)
      ? (i18n.language as SupportedLanguage)
      : DEFAULT_LANGUAGE;
  const home = isAuthenticated ? `/${homeLang}/dashboard` : `/${homeLang}`;

  return (
    <div className="bg-base-200 flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <img
        src="/logo.webp"
        alt={t("app.name")}
        className="animate-entry h-auto w-full max-w-40"
      />

      <div className="card border-base-300 bg-base-100 animate-entry w-full max-w-md border shadow-sm">
        <div className="card-body items-center gap-3 p-8 text-center">
          <span className="bg-primary/10 text-primary grid size-14 place-items-center rounded-full">
            <Compass data-no-flip className="size-7" />
          </span>

          <h1 className="text-primary text-5xl font-bold tracking-tight">404</h1>
          <p className="text-base-content/70 text-sm">{t("notFound.message")}</p>

          <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-outline gap-2"
            >
              <ArrowLeft className="size-4" />
              {t("notFound.goBack")}
            </button>
            <Link to={home} className="btn btn-primary">
              {t("notFound.backHome")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
