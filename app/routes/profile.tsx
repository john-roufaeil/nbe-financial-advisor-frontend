import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { LogOut, Trash2, User } from "lucide-react";
import { PersonalDataSections } from "@/components/profile/PersonalDataSections";
import { VerifyEmailBanner } from "@/components/profile/VerifyEmailBanner";
import { IssuesSection } from "@/components/profile/IssuesSection";
import { PageBanner } from "@/components/shared/layout/PageBanner";
import { PreferencesMenu } from "@/components/shared/preferences/PreferencesMenu";
import { useAuthStore } from "@/store/use-auth-store";
import { useConfirmStore } from "@/store/use-confirm-store";
import { usePageTitle } from "@/lib/use-page-title";
import { useLogout } from "@/queries/auth";
import { useMe, useDeleteMyAccount } from "@/queries/profile";
import { localizedPath } from "@/lib/constants/routes";

export default function Profile() {
  const { t } = useTranslation();
  usePageTitle(t("nav.profile"));
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const { mutate: signOutRemote } = useLogout();
  const deleteAccount = useDeleteMyAccount();
  const confirm = useConfirmStore((s) => s.confirm);
  const { data: user } = useMe();
  // Default to showing while user is still loading (undefined), same as the
  // banner's own prior unconditional-show behavior — hide only once we
  // positively know either applies: no password (bank-login account, whose
  // identity was already proven by bank OTP) or the email link was actually
  // clicked.
  const showVerifyEmail = user?.has_password !== false && user?.email_verified !== true;

  function handleSignOut() {
    // Best-effort: invalidate the refresh token server-side.
    // Local state is cleared regardless, even if the request fails.
    signOutRemote();
    logout();
    navigate(localizedPath(lang!));
  }

  function handleDeleteAccount() {
    confirm({
      title: t("settings.deleteAccountTitle"),
      message: t("settings.deleteAccountMessage"),
      onConfirm: () => {
        deleteAccount.mutate(undefined, {
          onSuccess: () => {
            logout();
            navigate(localizedPath(lang!));
          },
        });
      },
    });
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

      {showVerifyEmail && <VerifyEmailBanner />}
      <PreferencesMenu />
      <PersonalDataSections />
      <IssuesSection />

      <button
        type="button"
        onClick={handleDeleteAccount}
        disabled={deleteAccount.isPending}
        className="btn btn-outline btn-error btn-sm gap-2 self-start"
      >
        <Trash2 className="size-4" />
        {t("settings.deleteAccount")}
      </button>
    </div>
  );
}
