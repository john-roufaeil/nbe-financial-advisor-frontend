import { Landmark } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBankConnections } from "@/queries/bank-connections";
import { formatDate } from "@/lib/format";
import { useDisplayPreferencesStore } from "@/store/use-display-preferences-store";
import { CardSkeleton } from "@/components/shared/skeletons/CardSkeleton";
import type { BankConnection, BankConnectionStatus } from "@/types/bank-connections";

const STATUS_BADGE_CLASS: Record<BankConnectionStatus, string> = {
  pending_otp: "badge-warning",
  linked: "badge-success",
  revoked: "badge-ghost",
  failed: "badge-error",
};

function ConnectionRow({ connection }: { connection: BankConnection }) {
  const { t } = useTranslation();
  const dateFormat = useDisplayPreferencesStore((s) => s.dateFormat);
  const date = connection.linked_at ?? connection.created_at;

  return (
    <li className="border-base-300 bg-base-100 flex min-w-0 items-center gap-3 rounded-lg border p-3">
      <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-full">
        <Landmark data-no-flip className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {t(
            `bankConnections.providers.${connection.provider_slug}`,
            connection.provider_slug,
          )}
        </p>
        <p className="text-base-content/50 truncate text-xs">
          {formatDate(date, dateFormat)}
        </p>
      </div>
      <span className={`badge ${STATUS_BADGE_CLASS[connection.status]} shrink-0 text-xs`}>
        {t(`bankConnections.status.${connection.status}`)}
      </span>
    </li>
  );
}

/**
 * Read-only list of the user's bank connections (pending/linked/revoked/failed).
 * Linking a new bank happens from BankAccountsCard's "Connect bank account"
 * button — this card is purely status visibility, since there's no revoke
 * endpoint on the backend yet.
 */
export function LinkedBanksCard() {
  const { t } = useTranslation();
  const { data: connections, isPending, isError } = useBankConnections();

  if (isPending) {
    return (
      <CardSkeleton
        icon={Landmark}
        className="animate-entry sm:col-span-2"
        rows={[{ kind: "progress" }]}
      />
    );
  }

  if (isError) {
    return (
      <div className="card border-base-300 bg-base-100 border shadow-sm sm:col-span-2">
        <div className="card-body p-4">
          <p className="text-error text-sm">{t("bankConnections.error")}</p>
        </div>
      </div>
    );
  }

  if (connections.length === 0) return null;

  return (
    <div className="card border-base-300 bg-base-100 animate-entry min-w-0 border shadow-sm sm:col-span-2">
      <div className="card-body gap-4 p-4">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
            <Landmark className="size-4.5" />
          </span>
          <h2 className="card-title flex-1 text-base">{t("bankConnections.title")}</h2>
        </div>
        <ul className="flex flex-col gap-2">
          {connections.map((connection) => (
            <ConnectionRow key={connection.id} connection={connection} />
          ))}
        </ul>
      </div>
    </div>
  );
}
