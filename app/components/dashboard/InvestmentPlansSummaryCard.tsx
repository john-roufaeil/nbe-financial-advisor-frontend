import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Bot, ChartNoAxesCombined, ShieldCheck } from "lucide-react";
import { Money } from "@/components/shared/Money";
import { ScenarioStatusBadge } from "@/components/investment-plans/ScenarioStatusBadge";
import { CardSkeleton } from "@/components/shared/skeletons/CardSkeleton";
import { useInvestmentScenarios } from "@/queries/investment-scenarios";
import { useNumberDisplay } from "@/lib/use-number-display";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";
import type { SavedInvestmentScenario } from "@/types/investment-scenario";

function pendingInstrumentIds(scenario: SavedInvestmentScenario) {
  return new Set(
    scenario.allocation_states
      .filter((state) => state.state === "planned")
      .map((state) => state.instrument_id),
  );
}

export function InvestmentPlansSummaryCard() {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const formatN = useNumberDisplay(true);
  const { data, isPending, isError } = useInvestmentScenarios("saved", 100);

  if (isPending) {
    return (
      <CardSkeleton
        bare
        icon={ChartNoAxesCombined}
        rows={[{ kind: "progress" }, { kind: "progress" }]}
        className="p-4"
      />
    );
  }

  const scenario = data?.find((item) => pendingInstrumentIds(item).size > 0);
  const pendingIds = scenario ? pendingInstrumentIds(scenario) : new Set<string>();
  const pendingTotal =
    scenario?.payload.allocations
      .filter((allocation) => pendingIds.has(allocation.instrument_id))
      .reduce((sum, allocation) => sum + allocation.target_amount, 0) ?? 0;
  const plansPath = localizedPath(lang!, ROUTE_SEGMENTS.investmentPlans);

  return (
    <section className="flex min-w-0 flex-col gap-3 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="bg-primary/10 text-primary grid size-8 shrink-0 place-items-center rounded-lg">
            <ChartNoAxesCombined className="size-4" />
          </span>
          <h2 className="truncate text-sm font-semibold">
            {t("investmentPlans.dashboard.title")}
          </h2>
        </div>
        <Link to={plansPath} className="btn btn-ghost btn-xs">
          {t("investmentPlans.dashboard.viewAll")}
        </Link>
      </div>

      {isError || !scenario ? (
        <div className="border-base-300 bg-base-200/30 flex flex-col items-start gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base-content/55 max-w-xl text-sm">
            {t("investmentPlans.dashboard.empty")}
          </p>
          <Link
            to={localizedPath(lang!, ROUTE_SEGMENTS.chat)}
            className="btn btn-primary btn-sm gap-2"
          >
            <Bot className="size-4" />
            {t("investmentPlans.dashboard.start")}
          </Link>
        </div>
      ) : (
        <Link
          to={plansPath}
          className="border-base-300 bg-base-200/30 hover:border-primary/40 focus-visible:outline-primary/50 flex flex-col gap-3 rounded-lg border p-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{scenario.title}</p>
              <Money className="text-lg font-semibold tabular-nums">
                {formatN(pendingTotal)} {t("currency.EGP")}
              </Money>
            </div>
            <ScenarioStatusBadge status={scenario.quote_status} />
          </div>
          <div className="flex flex-wrap gap-2">
            {scenario.payload.allocations
              .filter((allocation) => pendingIds.has(allocation.instrument_id))
              .map((allocation) => (
                <span
                  key={allocation.instrument_id}
                  className="badge badge-outline badge-sm max-w-full gap-1"
                >
                  <span className="max-w-40 truncate">{allocation.display_name}</span>
                  {allocation.priority && (
                    <span className="text-primary font-semibold">
                      #{allocation.priority}
                    </span>
                  )}
                  <span className="font-semibold tabular-nums">
                    {formatN(allocation.target_amount)} {t("currency.EGP")}
                  </span>
                </span>
              ))}
          </div>
          <p className="text-base-content/50 flex items-center gap-1.5 text-xs">
            <ShieldCheck className="size-3.5" />
            {t("investmentPlans.card.noTrade")}
          </p>
        </Link>
      )}
    </section>
  );
}
