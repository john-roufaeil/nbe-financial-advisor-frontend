import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { LogOut, ShieldAlert, User } from "lucide-react";
import { PersonalDataSections } from "@/components/profile/PersonalDataSections";
import { VerifyEmailBanner } from "@/components/profile/VerifyEmailBanner";
import { IssuesSection } from "@/components/profile/IssuesSection";
import { AccountManagementSection } from "@/components/profile/AccountManagementSection";
import { PageBanner } from "@/components/shared/layout/PageBanner";
import { PreferencesMenu } from "@/components/shared/preferences/PreferencesMenu";
import { useAuthStore } from "@/store/use-auth-store";
import { usePageTitle } from "@/lib/use-page-title";
import { useLogout } from "@/queries/auth";
import { useMe } from "@/queries/profile";
import { useConsentStatus } from "@/queries/consent";
import { localizedPath } from "@/lib/constants/routes";

export default function Profile() {
  const { t } = useTranslation();
  usePageTitle(t("nav.profile"));
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const { mutate: signOutRemote } = useLogout();
  const { data: user } = useMe();
  // Default to showing while user is still loading (undefined), same as the
  // banner's own prior unconditional-show behavior — hide only once we
  // positively know either applies: no password (bank-login account, whose
  // identity was already proven by bank OTP) or the email link was actually
  // clicked.
  const showVerifyEmail = user?.has_password !== false && user?.email_verified !== true;
  // See RequireAuth.tsx: declining terms_of_service restricts every other
  // route to here, and restricts this page itself to account housekeeping.
  // While consent history is still loading, treat it as agreed (same as
  // RequireAuth's termsPending gate) rather than flashing the restricted
  // view for every user before it resolves.
  const { isActive: hasAgreedToTerms, isPending: termsPending } =
    useConsentStatus("terms_of_service");
  const isRestricted = !termsPending && !hasAgreedToTerms;

  function handleSignOut() {
    // Best-effort: invalidate the refresh token server-side.
    // Local state is cleared regardless, even if the request fails.
    signOutRemote();
    logout();
    navigate(localizedPath(lang!));
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 md:p-6">
      <PageBanner
        title={t("nav.profile")}
        subtitle={t("nav.profileSubtitle")}
        icon={User}
        actions={
          <button
            type="button"
            onClick={handleSignOut}
            className="btn btn-outline btn-error btn-sm bg-base-200 hover:bg-error gap-2"
          >
            <LogOut className="size-4" />
            {t("settings.signOut")}
          </button>
        }
      />

      {isRestricted && (
        <div
          role="alert"
          className="alert border-warning/30 bg-warning/10 animate-entry items-start gap-3 sm:items-center"
        >
          <ShieldAlert className="text-warning size-5 shrink-0" />
          <span className="flex-1 text-sm">{t("settings.termsDeclinedBanner")}</span>
        </div>
      )}
      {showVerifyEmail && <VerifyEmailBanner />}
      <PersonalDataSections restricted={isRestricted} />
      <PreferencesMenu />
      <IssuesSection />
      <AccountManagementSection />
    </div>
  );
}
