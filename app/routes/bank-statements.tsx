import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Plus } from "lucide-react";
import { BankStatementsTab } from "@/components/bank-statements/BankStatementsTab";
import { AddBankStatementModal } from "@/components/bank-statements/AddBankStatementModal";
import { ReplanFab } from "@/components/shared/ReplanFab";
import { PageBanner } from "@/components/shared/layout/PageBanner";
import { usePageTitle } from "@/lib/use-page-title";
import { useConsumeOpenAddState } from "@/lib/use-consume-open-add-state";

export default function BankStatements() {
  const { t } = useTranslation();
  usePageTitle(t("bankStatements.title"));
  const modalRef = useRef<HTMLDialogElement>(null);

  useConsumeOpenAddState(() => modalRef.current?.showModal());

  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-4 p-4 md:p-6">
      <PageBanner
        title={t("bankStatements.title")}
        subtitle={t("bankStatements.subtitle")}
        icon={FileText}
        actions={
          <>
            <button
              type="button"
              onClick={() => modalRef.current?.showModal()}
              className="btn btn-sm text-primary bg-primary-content hover:bg-primary-content/90 gap-2 border-none shadow-sm"
            >
              <Plus className="size-4" />
              <span>{t("bankStatements.add.add")}</span>
            </button>
            <ReplanFab />
          </>
        }
      />

      <BankStatementsTab />
      <AddBankStatementModal ref={modalRef} />
    </div>
  );
}
