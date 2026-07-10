import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
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
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("add")) {
      modalRef.current?.showModal();
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("add");
        return next;
      });
    }
  }, []);

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
