import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { TriangleAlert } from "lucide-react";
import { useAuthStore } from "@/store/use-auth-store";

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
    <dialog ref={ref} className="modal">
      <div className="modal-box flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="bg-error/10 text-error grid size-9 shrink-0 place-items-center rounded-full">
            <TriangleAlert className="size-5" />
          </span>
          <h3 className="text-lg font-semibold">{t("sessionExpired.title")}</h3>
        </div>
        <p className="text-base-content/60 text-sm">{t("sessionExpired.message")}</p>
        <div className="modal-action">
          <button type="button" onClick={handleSignIn} className="btn btn-primary">
            {t("sessionExpired.action")}
          </button>
        </div>
      </div>
    </dialog>
  );
}
