import { useTranslation } from "react-i18next";
import { AuthLayout } from "@/components/shared/layout/AuthLayout";
import { usePageTitle } from "@/lib/use-page-title";
import { useBankOAuthCallback } from "@/lib/use-bank-oauth-callback";

/** OAuth redirect landing page for mock-bank sign-in. The URL name is retained
 * because it is the registered provider redirect URI. */
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
