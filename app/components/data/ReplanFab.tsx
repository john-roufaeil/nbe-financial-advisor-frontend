import { Link, useParams } from "react-router";
import { PencilSparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ReplanFab() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  return (
    <Link
      to={`/${lang}/chat`}
      className="btn btn-secondary gap-2 shadow-sm"
      aria-label={t("data.replan")}
    >
      <PencilSparkles className="size-4" />
      <span className="hidden sm:inline">{t("data.replan")}</span>
    </Link>
  );
}
