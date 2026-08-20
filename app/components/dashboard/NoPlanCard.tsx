import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Bot, ClipboardList, PieChart } from "lucide-react";
import { useCategoryBreakdown } from "@/queries/analytics";
import { currentPeriod } from "@/lib/budget-period";
import { CategoryLabel } from "@/components/shared/CategoryLabel";
import { useNumberDisplay } from "@/lib/use-number-display";

const TOP_CATEGORIES_SHOWN = 3;

/**
 * A planless user still has real transaction history — GET
 * /analytics/category-breakdown needs no budget plan, unlike the dashboard's
 * own allocations_summary (empty when has_plan is false). Gives them
 * something real to look at instead of just an upsell prompt.
 */
function TopCategoriesThisMonth() {
  const { t } = useTranslation();
  const formatN = useNumberDisplay();
  const { data } = useCategoryBreakdown(currentPeriod());
  const top = (data?.breakdown ?? []).slice(0, TOP_CATEGORIES_SHOWN);

  if (top.length === 0) return null;

  return (
    <ul className="border-base-300 flex w-full max-w-xs flex-col gap-2 border-t pt-4 text-start">
      <li className="text-base-content/50 text-xs font-medium">
        {t("dashboard.categoryBreakdown.title")}
      </li>
      {top.map((entry) => (
        <li
          key={entry.category}
          className="flex items-center justify-between gap-3 text-sm"
        >
          <CategoryLabel category={entry.category} className="min-w-0" />
          <span className="text-base-content/70 shrink-0 tabular-nums">
            {formatN(entry.amount)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Shown instead of the goals + budget cards when the user has no plan yet.
 * Deliberately not an error or a skeleton — a planless account is a normal,
 * expected state (a brand-new user who skipped onboarding's budget step).
 */
export function NoPlanCard() {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();

  return (
    <div className="animate-entry flex h-full flex-col items-center justify-center gap-5 text-center">
      <div className="relative grid place-items-center">
        <span
          aria-hidden="true"
          className="bg-primary/5 absolute size-24 rounded-full blur-xl"
        />
        <span className="bg-primary/10 text-primary relative grid size-16 place-items-center rounded-lg">
          <ClipboardList className="size-8" />
        </span>
      </div>

      <div className="flex max-w-md flex-col gap-2 text-balance">
        <h2 className="text-lg font-semibold">{t("dashboard.noPlan.title")}</h2>
        <p className="text-base-content/60 text-sm">
          {t("dashboard.noPlan.description")}
        </p>
      </div>

      <ul className="text-base-content/70 flex flex-col gap-2 text-sm sm:flex-row sm:gap-6">
        <li className="flex items-center justify-center gap-2">
          <PieChart className="text-primary size-4 shrink-0" />
          {t("dashboard.noPlan.benefitBudget")}
        </li>
      </ul>

      <Link to={`/${lang}/chat`} className="btn btn-primary gap-2">
        <Bot className="size-4" />
        {t("dashboard.noPlan.cta")}
      </Link>

      <TopCategoriesThisMonth />
    </div>
  );
}
