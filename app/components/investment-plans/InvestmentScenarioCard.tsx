import { Link, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Bot, Clock3, Pencil, ShoppingBag, Trash2 } from "lucide-react";
import { Money } from "@/components/shared/Money";
import { ScenarioStatusBadge } from "@/components/investment-plans/ScenarioStatusBadge";
import {
  useDeleteInvestmentScenario,
  useDeletePlannedAllocation,
} from "@/queries/investment-scenarios";
import { useConfirmStore } from "@/store/use-confirm-store";
import { useChatStore } from "@/store/use-chat-store";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { formatDateTime } from "@/lib/format";
import { useNumberDisplay } from "@/lib/use-number-display";
import { ROUTE_SEGMENTS, localizedPath } from "@/lib/constants/routes";
import type {
  InvestmentAllocation,
  SavedInvestmentScenario,
} from "@/types/investment-scenario";

function isPending(scenario: SavedInvestmentScenario, allocation: InvestmentAllocation) {
  return (
    scenario.allocation_states.find(
      (state) => state.instrument_id === allocation.instrument_id,
    )?.state !== "purchased"
  );
}

export function InvestmentScenarioCard({
  scenario,
  onPurchase,
  onEdit,
}: {
  scenario: SavedInvestmentScenario;
  onPurchase: (allocation: InvestmentAllocation) => void;
  onEdit: (allocation: InvestmentAllocation) => void;
}) {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const formatN = useNumberDisplay(true);
  const timeFormat = useDisplayPreferencesStore((state) => state.timeFormat);
  const dateFormat = useDisplayPreferencesStore((state) => state.dateFormat);
  const confirm = useConfirmStore((state) => state.confirm);
  const deleteScenario = useDeleteInvestmentScenario();
  const deleteAllocation = useDeletePlannedAllocation();
  const currency = t(`currency.${scenario.payload.currency}`, scenario.payload.currency);
  const pendingAllocations = scenario.payload.allocations.filter((allocation) =>
    isPending(scenario, allocation),
  );
  const purchasedCount = scenario.payload.allocations.length - pendingAllocations.length;
  const remainingPlanned = pendingAllocations.reduce(
    (sum, allocation) => sum + allocation.target_amount,
    0,
  );

  function remove() {
    confirm({
      title: t("investmentPlans.confirm.deleteTitle"),
      message: t("investmentPlans.confirm.deleteMessage"),
      confirmLabel: t("investmentPlans.confirm.deleteAction"),
      onConfirm: () => deleteScenario.mutate(scenario.id),
    });
  }

  function removeAllocation(allocation: InvestmentAllocation) {
    confirm({
      title: t("investmentPlans.confirm.removeItemTitle"),
      message: t("investmentPlans.confirm.removeItemMessage", {
        investment: allocation.display_name,
      }),
      confirmLabel: t("investmentPlans.confirm.removeItemAction"),
      onConfirm: () =>
        deleteAllocation.mutate({
          scenarioId: scenario.id,
          instrumentId: allocation.instrument_id,
        }),
    });
  }

  function openSourceChat() {
    if (scenario.source_conversation_id) {
      useChatStore.getState().setCurrentConversationId(scenario.source_conversation_id);
    }
  }

  if (pendingAllocations.length === 0) return null;

  return (
    <article className="border-base-300 bg-base-100 animate-entry flex min-w-0 flex-col overflow-hidden rounded-xl border shadow-sm">
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold">{scenario.title}</h3>
              <span className="badge badge-warning badge-sm">
                {t("investmentPlans.card.planned")}
              </span>
            </div>
            <p className="text-base-content/55 mt-1 text-xs">
              {t("investmentPlans.card.pendingCount", {
                count: pendingAllocations.length,
              })}
            </p>
            <Money className="text-primary mt-1 block text-sm font-semibold tabular-nums">
              {t("investmentPlans.card.remainingPlanned")}: {formatN(remainingPlanned)}{" "}
              {currency}
            </Money>
          </div>
          <ScenarioStatusBadge status={scenario.quote_status} />
        </div>

        {purchasedCount > 0 && (
          <p className="border-success/20 bg-success/5 text-success rounded-lg border p-3 text-xs">
            {t("investmentPlans.card.movedCount", { count: purchasedCount })}
          </p>
        )}

        <ul className="flex flex-col gap-3">
          {pendingAllocations.map((allocation) => {
            const unit = t(
              `chat.tools.investment.unit.${allocation.unit}`,
              allocation.unit,
            );
            return (
              <li
                key={allocation.instrument_id}
                className="border-base-300 flex min-w-0 flex-col gap-3 rounded-lg border p-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium">{allocation.display_name}</span>
                      {allocation.priority && (
                        <span className="badge badge-primary badge-outline badge-xs">
                          {t("chat.tools.investment.priority", {
                            priority: allocation.priority,
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-base-content/55 mt-0.5 text-xs">
                      {allocation.percentage}% {t("investmentPlans.card.ofPlan")}
                    </p>
                  </div>
                  <Money className="font-semibold tabular-nums">
                    {formatN(allocation.target_amount)} {currency}
                  </Money>
                </div>

                <dl className="bg-base-200/50 grid grid-cols-2 gap-3 rounded-md p-2.5 text-xs">
                  <div>
                    <dt className="text-base-content/50">
                      {t("investmentPlans.card.estimatedQuantity")}
                    </dt>
                    <dd className="mt-0.5 font-medium tabular-nums">
                      {formatN(allocation.quantity)} {unit}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-base-content/50">
                      {t("investmentPlans.card.planPrice")}
                    </dt>
                    <dd className="mt-0.5 font-medium tabular-nums">
                      {formatN(allocation.unit_price)} {currency}/{unit}
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(allocation)}
                    className="btn btn-outline btn-sm gap-2"
                  >
                    <Pencil className="size-4" />
                    {t("investmentPlans.card.edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onPurchase(allocation)}
                    className="btn btn-primary btn-sm gap-2"
                  >
                    <ShoppingBag className="size-4" />
                    {t("investmentPlans.card.bought")}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAllocation(allocation)}
                    disabled={deleteAllocation.isPending}
                    className="btn btn-ghost btn-sm text-error gap-2"
                  >
                    <Trash2 className="size-4" />
                    {t("investmentPlans.card.removeItem")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="text-base-content/45 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          <span className="flex items-center gap-1">
            <Clock3 className="size-3" />
            {t("investmentPlans.card.savedOn", {
              date: formatDateTime(scenario.saved_at, timeFormat, t, dateFormat),
            })}
          </span>
          {scenario.oldest_observed_at && (
            <span>
              {t("investmentPlans.card.quotesAsOf", {
                date: formatDateTime(
                  scenario.oldest_observed_at,
                  timeFormat,
                  t,
                  dateFormat,
                ),
              })}
            </span>
          )}
        </div>
      </div>

      <div className="border-base-300 bg-base-200/35 mt-auto flex items-center gap-1 border-t p-2">
        <Link
          to={localizedPath(lang!, ROUTE_SEGMENTS.chat)}
          onClick={openSourceChat}
          className="btn btn-ghost btn-sm gap-2"
        >
          <Bot className="size-4" />
          {t("investmentPlans.card.reviewAdvisor")}
        </Link>
        <button
          type="button"
          onClick={remove}
          disabled={deleteScenario.isPending}
          className="btn btn-ghost btn-sm text-error ms-auto gap-2"
        >
          <Trash2 className="size-4" />
          {t("investmentPlans.card.removePlan")}
        </button>
      </div>
    </article>
  );
}
