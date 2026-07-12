import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { LogOut, User } from "lucide-react";
import { PersonalDataSections } from "@/components/profile/PersonalDataSections";
import { PageBanner } from "@/components/shared/PageBanner";
import { PreferencesMenu } from "@/components/shared/PreferencesMenu";
import { useAuthStore } from "@/store/use-auth-store";
import { usePageTitle } from "@/lib/use-page-title";
import * as authApi from "@/api/auth";

export default function Profile() {
  const { t } = useTranslation();
  usePageTitle(t("nav.profile"));
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  function handleSignOut() {
    // Best-effort: invalidate the refresh token server-side. Local state is
    // cleared regardless, even if the request fails (offline, already expired).
    authApi.logout().catch(() => {});
    logout();
    navigate(`/${lang}`);
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

      <PreferencesMenu />
      <PersonalDataSections />
    </div>
  );
}
