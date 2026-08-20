import { forwardRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { TriangleAlert } from "lucide-react";
import { BaseModal } from "@/components/shared/modals/BaseModal";
import { Button } from "@/components/shared/Button";
import { useDeleteMyAccount } from "@/queries/profile";
import { useAuthStore } from "@/store/use-auth-store";
import { closeDialog } from "@/lib/close-dialog";
import { localizedPath } from "@/lib/constants/routes";

const CONFIRM_WORD = "DELETE";

/**
 * Deleting cascades to every one of the user's rows (accounts,
 * transactions, budgets, conversations, statements — MeView.delete's
 * docstring) and can't be undone, so a plain Confirm/Cancel dialog isn't
 * enough friction — the user has to type CONFIRM_WORD before the button
 * even enables, same convention as GitHub/similar high-stakes deletions.
 */
export const DeleteAccountModal = forwardRef<HTMLDialogElement>(
  function DeleteAccountModal(_props, ref) {
    const { t } = useTranslation();
    const { lang } = useParams<{ lang: string }>();
    const navigate = useNavigate();
    const logout = useAuthStore((s) => s.logout);
    const deleteAccount = useDeleteMyAccount();
    const [confirmText, setConfirmText] = useState("");
    const canDelete = confirmText.trim().toUpperCase() === CONFIRM_WORD;

    function handleClose() {
      setConfirmText("");
    }

    function handleDelete() {
      if (!canDelete) return;
      deleteAccount.mutate(undefined, {
        onSuccess: () => {
          logout();
          navigate(localizedPath(lang!));
        },
      });
    }

    return (
      <BaseModal
        ref={ref}
        onClose={handleClose}
        title={t("settings.deleteAccountTitle")}
        icon={
          <span className="bg-error/10 text-error grid size-9 shrink-0 place-items-center rounded-full">
            <TriangleAlert className="size-5" />
          </span>
        }
        actions={
          <>
            <Button
              type="button"
              className="btn btn-error"
              disabled={!canDelete}
              loading={deleteAccount.isPending}
              onClick={handleDelete}
            >
              {t("settings.deleteAccount")}
            </Button>
            <button
              type="button"
              onClick={() => closeDialog(ref)}
              className="btn btn-ghost"
            >
              {t("actions.cancel")}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-base-content/60 text-sm">
            {t("settings.deleteAccountMessage")}
          </p>
          <label className="flex flex-col gap-1">
            <span className="text-sm">
              {t("settings.deleteAccountConfirmLabel", { word: CONFIRM_WORD })}
            </span>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_WORD}
              autoComplete="off"
              className="input input-bordered w-full font-mono"
            />
          </label>
        </div>
      </BaseModal>
    );
  },
);
