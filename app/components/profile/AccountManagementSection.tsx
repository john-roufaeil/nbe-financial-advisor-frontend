import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Settings2 } from "lucide-react";
import { useMe, useRequestDataExport } from "@/queries/profile";
import { useRequestPasswordReset, useLogoutAllDevices } from "@/queries/auth";
import { useConfirmStore } from "@/store/use-confirm-store";
import { Button } from "@/components/shared/Button";
import { Tooltip } from "@/components/shared/Tooltip";
import { SettingsGroup } from "@/components/shared/SettingsGroup";
import { ConsentModal } from "@/components/profile/ConsentModal";
import { DeleteAccountModal } from "@/components/profile/DeleteAccountModal";
import { toastSuccess } from "@/lib/toast";

function Row({
  title,
  description,
  danger = false,
  children,
}: {
  title: string;
  description: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="flex flex-col items-start justify-between gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${danger ? "text-error" : ""}`}>
          {title}
        </span>
        <span className="text-base-content/60 text-xs">{description}</span>
      </div>
      <div className="shrink-0 self-end sm:self-auto">{children}</div>
    </li>
  );
}

/**
 * Account-level actions, separate from PreferencesMenu's display/locale
 * settings: change password, end other sessions, privacy consent, a full
 * data export, and account deletion. One plain divided list rather than a
 * bordered card per row — five stacked cards read as noise for what's
 * fundamentally a settings list.
 */
export function AccountManagementSection() {
  const { t } = useTranslation();
  const { data: user } = useMe();
  const confirm = useConfirmStore((s) => s.confirm);
  const requestReset = useRequestPasswordReset();
  const logoutAll = useLogoutAllDevices();
  const requestExport = useRequestDataExport();
  const deleteModalRef = useRef<HTMLDialogElement>(null);
  const consentModalRef = useRef<HTMLDialogElement>(null);

  // Bank-login-created accounts never set a password (VerifyEmailBanner's
  // same has_password check) — nothing to reset for them.
  const hasPassword = user?.has_password !== false;
  // Both data export and a password-reset link go to `user.email` — an
  // unverified email could belong to someone else (typo at signup), so both
  // are gated on it the same way the backend gates export
  // (core/views/profile.py's MeDataExportView). Bank-login accounts skip
  // this: their identity is already OTP-proven.
  const canUseVerifiedEmail = !hasPassword || user?.email_verified === true;

  function handleChangePassword() {
    if (!user) return;
    requestReset.mutate(
      { email: user.email },
      { onSuccess: () => toastSuccess("settings.accountManagement.changePassword.sent") },
    );
  }

  function handleLogoutAll() {
    confirm({
      title: t("settings.accountManagement.logoutAll.confirmTitle"),
      message: t("settings.accountManagement.logoutAll.confirmMessage"),
      confirmLabel: t("settings.accountManagement.logoutAll.confirmAction"),
      tone: "default",
      onConfirm: () => {
        logoutAll.mutate(undefined, {
          onSuccess: () => toastSuccess("settings.accountManagement.logoutAll.done"),
        });
      },
    });
  }

  return (
    <div className="card border-base-300 bg-base-100 animate-entry border shadow-sm">
      <div className="card-body gap-3 p-4">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
            <Settings2 className="size-4.5" />
          </span>
          <h2 className="card-title flex-1 text-base">
            {t("settings.accountManagement.title")}
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          <SettingsGroup title={t("settings.accountManagement.groups.security")}>
            <ul className="divide-base-300 flex flex-col divide-y">
              {hasPassword && (
                <Row
                  title={t("settings.accountManagement.changePassword.title")}
                  description={t("settings.accountManagement.changePassword.description")}
                >
                  <Tooltip
                    content={
                      canUseVerifiedEmail
                        ? ""
                        : t("settings.accountManagement.dataExport.verifyFirst")
                    }
                  >
                    <Button
                      className="btn btn-outline btn-sm"
                      loading={requestReset.isPending}
                      disabled={!canUseVerifiedEmail}
                      onClick={handleChangePassword}
                    >
                      {t("settings.accountManagement.changePassword.action")}
                    </Button>
                  </Tooltip>
                </Row>
              )}

              <Row
                title={t("settings.accountManagement.logoutAll.title")}
                description={t("settings.accountManagement.logoutAll.description")}
              >
                <Button
                  className="btn btn-outline btn-sm"
                  loading={logoutAll.isPending}
                  onClick={handleLogoutAll}
                >
                  {t("settings.accountManagement.logoutAll.action")}
                </Button>
              </Row>
            </ul>
          </SettingsGroup>

          <SettingsGroup title={t("settings.accountManagement.groups.privacy")}>
            <ul className="divide-base-300 flex flex-col divide-y">
              <Row
                title={t("settings.accountManagement.consent.title")}
                description={t("settings.accountManagement.consent.description")}
              >
                <Button
                  className="btn btn-outline btn-sm"
                  onClick={() => consentModalRef.current?.showModal()}
                >
                  {t("settings.accountManagement.consent.manage")}
                </Button>
              </Row>

              <Row
                title={t("settings.accountManagement.dataExport.title")}
                description={t("settings.accountManagement.dataExport.description")}
              >
                <Tooltip
                  content={
                    canUseVerifiedEmail
                      ? ""
                      : t("settings.accountManagement.dataExport.verifyFirst")
                  }
                >
                  <Button
                    className="btn btn-outline btn-sm"
                    loading={requestExport.isPending}
                    disabled={!canUseVerifiedEmail}
                    onClick={() => requestExport.mutate()}
                  >
                    {t("settings.accountManagement.dataExport.action")}
                  </Button>
                </Tooltip>
              </Row>
            </ul>
          </SettingsGroup>

          <SettingsGroup title={t("settings.accountManagement.groups.dangerZone")}>
            <ul className="divide-base-300 flex flex-col divide-y">
              <Row
                danger
                title={t("settings.accountManagement.deleteAccount.title")}
                description={t("settings.accountManagement.deleteAccount.description")}
              >
                <button
                  type="button"
                  onClick={() => deleteModalRef.current?.showModal()}
                  className="btn btn-outline btn-error btn-sm"
                >
                  {t("settings.deleteAccount")}
                </button>
              </Row>
            </ul>
          </SettingsGroup>
        </div>
      </div>

      <DeleteAccountModal ref={deleteModalRef} />
      <ConsentModal ref={consentModalRef} />
    </div>
  );
}
