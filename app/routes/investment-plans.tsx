import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Bot, CalendarClock, ChartNoAxesCombined, ShieldCheck } from "lucide-react";
import { PageBanner } from "@/components/shared/layout/PageBanner";
import { CardSkeleton } from "@/components/shared/skeletons/CardSkeleton";
import { EmptyState, ErrorState } from "@/components/shared/QueryState";
import { InvestmentScenarioCard } from "@/components/investment-plans/InvestmentScenarioCard";
import { InvestmentHoldingModal } from "@/components/investment-plans/InvestmentHoldingModal";
import { PlannedPurchaseModal } from "@/components/investment-plans/PlannedPurchaseModal";
import { PlannedAllocationModal } from "@/components/investment-plans/PlannedAllocationModal";
import { InvestmentHoldingsPanel } from "@/components/investment-plans/InvestmentHoldingsPanel";
import { useInvestmentScenarios } from "@/queries/investment-scenarios";
import { useInvestmentHoldings } from "@/queries/investment-holdings";
import { usePageTitle } from "@/lib/use-page-title";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";
import type {
  InvestmentAllocation,
  SavedInvestmentScenario,
} from "@/types/investment-scenario";
import type { InvestmentHolding } from "@/types/investment-holding";

interface HoldingModalTarget {
  holding: InvestmentHolding | null;
  nonce: number;
}

interface PurchaseModalTarget {
  scenario: SavedInvestmentScenario | null;
  allocation: InvestmentAllocation | null;
  existingHolding: InvestmentHolding | null;
  nonce: number;
}

function hasPendingAllocation(scenario: SavedInvestmentScenario) {
  return scenario.payload.allocations.some(
    (allocation) =>
      scenario.allocation_states.find(
        (state) => state.instrument_id === allocation.instrument_id,
      )?.state !== "purchased",
  );
}

export default function InvestmentPlans() {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const { data = [], isPending, isError, refetch } = useInvestmentScenarios("saved", 100);
  const { data: holdings = [] } = useInvestmentHoldings();
  const pendingScenarios = data.filter(hasPendingAllocation);
  const holdingModalRef = useRef<HTMLDialogElement>(null);
  const purchaseModalRef = useRef<HTMLDialogElement>(null);
  const editPlanModalRef = useRef<HTMLDialogElement>(null);
  const [holdingTarget, setHoldingTarget] = useState<HoldingModalTarget>({
    holding: null,
    nonce: 0,
  });
  const [purchaseTarget, setPurchaseTarget] = useState<PurchaseModalTarget>({
    scenario: null,
    allocation: null,
    existingHolding: null,
    nonce: 0,
  });
  const [editPlanTarget, setEditPlanTarget] = useState<PurchaseModalTarget>({
    scenario: null,
    allocation: null,
    existingHolding: null,
    nonce: 0,
  });
  usePageTitle(t("investmentPlans.title"));

  useEffect(() => {
    if (holdingTarget.nonce > 0) holdingModalRef.current?.showModal();
  }, [holdingTarget]);

  useEffect(() => {
    if (purchaseTarget.nonce > 0) purchaseModalRef.current?.showModal();
  }, [purchaseTarget]);

  useEffect(() => {
    if (editPlanTarget.nonce > 0) editPlanModalRef.current?.showModal();
  }, [editPlanTarget]);

  function addHolding() {
    setHoldingTarget((current) => ({
      holding: null,
      nonce: current.nonce + 1,
    }));
  }

  function editHolding(holding: InvestmentHolding) {
    setHoldingTarget((current) => ({
      holding,
      nonce: current.nonce + 1,
    }));
  }

  function recordPurchase(
    scenario: SavedInvestmentScenario,
    allocation: InvestmentAllocation,
  ) {
    const existingHolding = holdings.find(
      (holding) => holding.instrument.id === allocation.instrument_id,
    );
    setPurchaseTarget((current) => ({
      scenario,
      allocation,
      existingHolding: existingHolding ?? null,
      nonce: current.nonce + 1,
    }));
  }

  function editPlannedAllocation(
    scenario: SavedInvestmentScenario,
    allocation: InvestmentAllocation,
  ) {
    setEditPlanTarget((current) => ({
      scenario,
      allocation,
      existingHolding: null,
      nonce: current.nonce + 1,
    }));
  }

  return (
    <div className="mx-auto mb-16 flex w-full max-w-6xl flex-col gap-4 p-4 md:p-6">
      <PageBanner
        title={t("investmentPlans.title")}
        subtitle={t("investmentPlans.subtitle")}
        icon={ChartNoAxesCombined}
        actions={
          <Link
            to={localizedPath(lang!, ROUTE_SEGMENTS.chat)}
            className="btn btn-sm text-primary bg-primary-content hover:bg-primary-content/90 gap-2 border-none shadow-sm"
          >
            <Bot className="size-4" />
            {t("investmentPlans.createWithAdvisor")}
          </Link>
        }
      />

      <div className="border-info/20 bg-info/5 text-base-content/70 flex items-start gap-2 rounded-xl border p-3 text-sm">
        <ShieldCheck className="text-info mt-0.5 size-4 shrink-0" />
        <p>{t("investmentPlans.educationalNotice")}</p>
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="planned-heading">
        <div className="flex items-center gap-3 px-1">
          <span className="bg-warning/15 text-warning-content grid size-9 place-items-center rounded-lg">
            <CalendarClock className="size-5" />
          </span>
          <div>
            <h2 id="planned-heading" className="font-semibold">
              {t("investmentPlans.planned.title")}
            </h2>
            <p className="text-base-content/55 text-xs">
              {t("investmentPlans.planned.subtitle")}
            </p>
          </div>
        </div>

        {isPending ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <CardSkeleton
              icon={CalendarClock}
              rows={Array.from({ length: 4 }, () => ({ kind: "text" as const }))}
              fullHeight
            />
            <CardSkeleton
              icon={CalendarClock}
              rows={Array.from({ length: 4 }, () => ({ kind: "text" as const }))}
              fullHeight
            />
          </div>
        ) : isError ? (
          <div className="border-base-300 bg-base-100 rounded-xl border p-4 shadow-sm">
            <ErrorState onRetry={() => refetch()} />
          </div>
        ) : pendingScenarios.length === 0 ? (
          <div className="border-base-300 bg-base-100 rounded-xl border p-4 shadow-sm">
            <EmptyState icon={CalendarClock} label={t("investmentPlans.planned.empty")} />
          </div>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-2">
            {pendingScenarios.map((scenario) => (
              <InvestmentScenarioCard
                key={scenario.id}
                scenario={scenario}
                onPurchase={(allocation) => recordPurchase(scenario, allocation)}
                onEdit={(allocation) => editPlannedAllocation(scenario, allocation)}
              />
            ))}
          </div>
        )}
      </section>

      <InvestmentHoldingsPanel onAdd={addHolding} onEdit={editHolding} />

      <InvestmentHoldingModal ref={holdingModalRef} holding={holdingTarget.holding} />
      <PlannedPurchaseModal
        ref={purchaseModalRef}
        scenario={purchaseTarget.scenario}
        allocation={purchaseTarget.allocation}
        existingHolding={purchaseTarget.existingHolding}
      />
      <PlannedAllocationModal
        ref={editPlanModalRef}
        scenario={editPlanTarget.scenario}
        allocation={editPlanTarget.allocation}
      />
    </div>
  );
}
