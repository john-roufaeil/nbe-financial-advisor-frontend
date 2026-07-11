import { useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { FileText, Plus } from "lucide-react";
import { DocumentsTab } from "@/components/data/DocumentsTab";
import { AddDocumentModal } from "@/components/data/AddDocumentModal";
import { ReplanFab } from "@/components/data/ReplanFab";
import { PageBanner } from "@/components/shared/PageBanner";
import { usePageTitle } from "@/lib/use-page-title";

export default function Documents() {
  const { t } = useTranslation();
  usePageTitle(t("data.documents"));
  const modalRef = useRef<HTMLDialogElement>(null);
  const location = useLocation();
  const consumedOpenAdd = useRef(false);

  useEffect(() => {
    // Guard against firing twice for the same mount (e.g. dev double-effects)
    // and against a stray re-render seeing the not-yet-cleared state again.
    if (consumedOpenAdd.current) return;
    if ((location.state as { openAdd?: boolean } | null)?.openAdd) {
      consumedOpenAdd.current = true;
      modalRef.current?.showModal();
      // Clear via the raw history API (not react-router's navigate) so the
      // one-shot intent is wiped from this entry synchronously and
      // unconditionally — it doesn't depend on the router's navigation queue,
      // so it can't be skipped or lingered on, which would otherwise reopen
      // the modal on a later back/forward navigation to this entry.
      window.history.replaceState(null, "", location.pathname);
    }
  }, [location]);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-4 p-4 md:p-6">
      <PageBanner
        title={t("data.documents")}
        subtitle={t("data.documentsSubtitle")}
        icon={FileText}
        actions={
          <>
            <button
              type="button"
              onClick={() => modalRef.current?.showModal()}
              className="btn btn-sm text-primary bg-primary-content hover:bg-primary-content/90 gap-2 border-none shadow-sm"
            >
              <Plus className="size-4" />
              <span>{t("data.addDocument.add")}</span>
            </button>
            <ReplanFab />
          </>
        }
      />

      <DocumentsTab />
      <AddDocumentModal ref={modalRef} />
    </div>
  );
}
