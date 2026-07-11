import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Bot, ClipboardList, PieChart, Target } from "lucide-react";

/**
 * Shown instead of the goals + budget cards when the user has no plan yet.
 * Deliberately not an error or a skeleton — a planless account is a normal,
 * expected state (a brand-new user who skipped onboarding's budget step).
 */
export function NoPlanCard() {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();

  return (
    <div className="card border-base-300 bg-base-100 animate-entry h-full border border-dashed shadow-sm">
      <div className="card-body items-center justify-center gap-5 p-8 text-center sm:p-12">
        <div className="relative grid place-items-center">
          <span
            aria-hidden="true"
            className="bg-primary/5 absolute size-24 rounded-full blur-xl"
          />
          <span className="bg-primary/10 text-primary relative grid size-16 place-items-center rounded-lg">
            <ClipboardList className="size-8" />
          </span>
        </div>

        <div className="flex max-w-md flex-col gap-2">
          <h2 className="text-lg font-semibold">{t("dashboard.noPlan.title")}</h2>
          <p className="text-base-content/60 text-sm">
            {t("dashboard.noPlan.description")}
          </p>
        </div>

        <ul className="text-base-content/70 flex flex-col gap-2 text-sm sm:flex-row sm:gap-6">
          <li className="flex items-center justify-center gap-2">
            <Target className="text-primary size-4 shrink-0" />
            {t("dashboard.noPlan.benefitGoal")}
          </li>
          <li className="flex items-center justify-center gap-2">
            <PieChart className="text-primary size-4 shrink-0" />
            {t("dashboard.noPlan.benefitBudget")}
          </li>
        </ul>

        <Link to={`/${lang}/chat`} className="btn btn-primary gap-2">
          <Bot className="size-4" />
          {t("dashboard.noPlan.cta")}
        </Link>
      </div>
    </div>
  );
}
