import { useTranslation } from "react-i18next";
import { useConsentHistory, useGrantConsent, useRevokeConsent } from "@/queries/consent";
import {
  CONSENT_TYPES,
  CURRENT_POLICY_VERSION,
  type ConsentRecord,
  type ConsentType,
} from "@/types/consent";

/**
 * On/off state for each consent type, not a history log — the backend still
 * keeps a full append-only record (ConsentRecord's docstring), this just
 * surfaces the CURRENT state derived from it: the newest row for a given
 * type is the active one (granted_at set + revoked_at null = on).
 */
export function PrivacyConsentToggles({
  onViewPolicy,
}: {
  onViewPolicy: (type: ConsentType) => void;
}) {
  const { t } = useTranslation();
  const { data, isPending } = useConsentHistory();
  const grant = useGrantConsent();
  const revoke = useRevokeConsent();

  const latestByType = new Map<string, ConsentRecord>();
  for (const record of data ?? []) {
    if (!latestByType.has(record.consentType))
      latestByType.set(record.consentType, record);
  }

  return (
    <>
      {CONSENT_TYPES.map((type) => {
        const latest = latestByType.get(type);
        const isOn = !!latest?.grantedAt && !latest?.revokedAt;
        const label = t(`settings.accountManagement.consent.types.${type}`);
        const pending =
          (grant.isPending && grant.variables?.consentType === type) ||
          (revoke.isPending && latest?.id === revoke.variables);

        return (
          <div
            key={type}
            className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"
          >
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-sm">{label}</span>
              <button
                type="button"
                onClick={() => onViewPolicy(type)}
                className="text-primary cursor-pointer text-xs hover:underline"
              >
                {t("settings.accountManagement.consent.viewText")}
              </button>
            </div>
            <input
              type="checkbox"
              checked={isOn}
              disabled={isPending || pending}
              onChange={() => {
                if (isOn && latest) {
                  revoke.mutate(latest.id);
                } else {
                  grant.mutate({
                    consentType: type,
                    policyVersion: CURRENT_POLICY_VERSION,
                  });
                }
              }}
              className="toggle toggle-primary toggle-sm"
              aria-label={label}
            />
          </div>
        );
      })}
    </>
  );
}
