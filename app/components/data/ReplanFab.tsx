import { Link, useParams } from "react-router";
import { Bot } from "lucide-react";
import { useTranslation } from "react-i18next";

export function ReplanFab() {
  const { lang } = useParams<{ lang: string }>();
  const { t } = useTranslation();
  return (
    <Link
      to={`/${lang}/chat`}
      className="btn btn-sm btn-secondary gap-2 shadow-sm"
      aria-label={t("data.replan")}
    >
      <Bot className="size-4" />
      <span>{t("data.replan")}</span>
    </Link>
  );
}
