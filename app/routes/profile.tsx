import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { LogOut } from "lucide-react";
import { PersonalDataSections } from "@/components/data/PersonalDataSections";
import { useAuthStore } from "@/store/use-auth-store";
import { usePageTitle } from "@/lib/use-page-title";

export default function Profile() {
  const { t } = useTranslation();
  usePageTitle(t("nav.profile"));
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  function handleSignOut() {
    logout();
    navigate(`/${lang}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{t("nav.profile")}</h1>
        <button
          type="button"
          onClick={handleSignOut}
          className="btn btn-outline btn-error btn-sm gap-2"
        >
          <LogOut className="size-4" />
          {t("settings.signOut")}
        </button>
      </div>

      <PersonalDataSections />
    </div>
  );
}
