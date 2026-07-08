import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { DocumentsTab } from "@/components/data/DocumentsTab";
import { AddDocumentModal } from "@/components/data/AddDocumentModal";
import { ReplanFab } from "@/components/data/ReplanFab";
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{t("data.documents")}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => modalRef.current?.showModal()}
            className="btn btn-primary btn-sm gap-2"
          >
            <Plus className="size-4" />
            {t("data.addDocument.add")}
          </button>
          <ReplanFab />
        </div>
      </div>

      <DocumentsTab />
      <AddDocumentModal ref={modalRef} />
    </div>
  );
}
