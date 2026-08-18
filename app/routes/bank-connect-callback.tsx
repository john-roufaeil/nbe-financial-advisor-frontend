import { useTranslation } from "react-i18next";
import { AuthLayout } from "@/components/shared/layout/AuthLayout";
import { usePageTitle } from "@/lib/use-page-title";
import { useBankOAuthCallback } from "@/lib/use-bank-oauth-callback";

/** Landing page for both bank-OAuth flows (bank login and connect-a-bank) —
 * see useBankOAuthCallback for the actual callback handling. */
export default function BankConnectCallback() {
  const { t } = useTranslation();
  usePageTitle(t("common.addAccount.connecting"));
  useBankOAuthCallback();

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="loading loading-spinner loading-lg" />
        <p className="text-base-content/70">{t("common.addAccount.connecting")}</p>
      </div>
    </AuthLayout>
  );
}
