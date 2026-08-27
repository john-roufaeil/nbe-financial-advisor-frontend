import { useTranslation } from "react-i18next";
import type { SavedInvestmentScenario } from "@/types/investment-scenario";

const STATUS_TONE: Record<SavedInvestmentScenario["quote_status"], string> = {
  current: "badge-success",
  needs_refresh: "badge-warning",
  unavailable: "badge-error",
  mock: "badge-neutral",
  user_supplied: "badge-info",
};

export function ScenarioStatusBadge({
  status,
}: {
  status: SavedInvestmentScenario["quote_status"];
}) {
  const { t } = useTranslation();
  return (
    <span className={`badge badge-sm ${STATUS_TONE[status]}`}>
      {t(`investmentPlans.quoteStatus.${status}`)}
    </span>
  );
}
