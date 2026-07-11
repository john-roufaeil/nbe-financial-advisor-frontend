import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { TriangleAlert } from "lucide-react";
import { useAuthStore } from "@/store/use-auth-store";
import { BaseModal } from "@/components/shared/BaseModal";

/** Global modal: prompts the user to sign in again once a refresh-on-401 fails. */
export function SessionExpiredModal() {
  const { t } = useTranslation();
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const ref = useRef<HTMLDialogElement>(null);
  const sessionExpired = useAuthStore((s) => s.sessionExpired);
  const clearSessionExpired = useAuthStore((s) => s.clearSessionExpired);

  useEffect(() => {
    if (sessionExpired) ref.current?.showModal();
    else ref.current?.close();
  }, [sessionExpired]);

  function handleSignIn() {
    clearSessionExpired();
    navigate(`/${lang ?? "en"}/sign-in`);
  }

  return (
    <BaseModal
      ref={ref}
      onClose={clearSessionExpired}
      title={t("sessionExpired.title")}
      icon={
        <span className="bg-error/10 text-error grid size-9 shrink-0 place-items-center rounded-full">
          <TriangleAlert className="size-5" />
        </span>
      }
      actions={
        <button type="button" onClick={handleSignIn} className="btn btn-primary">
          {t("sessionExpired.action")}
        </button>
      }
    >
      <p className="text-base-content/60 text-sm">{t("sessionExpired.message")}</p>
    </BaseModal>
  );
}
