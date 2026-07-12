import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeftRight, Plus } from "lucide-react";
import { TransactionsTab } from "@/components/data/TransactionsTab";
import { type TransactionsTabHandle } from "@/lib/use-transaction-modals";
import { ReplanFab } from "@/components/data/ReplanFab";
import { PageBanner } from "@/components/shared/PageBanner";
import { usePageTitle } from "@/lib/use-page-title";
import { useConsumeOpenAddState } from "@/lib/use-consume-open-add-state";

export default function Transactions() {
  const { t } = useTranslation();
  usePageTitle(t("data.transactions"));
  const tabRef = useRef<TransactionsTabHandle>(null);

  useConsumeOpenAddState(() => tabRef.current?.openAdd());

  return (
    <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col gap-4 p-4 md:p-6">
      <PageBanner
        title={t("data.transactions")}
        subtitle={t("data.transactionsSubtitle")}
        icon={ArrowLeftRight}
        actions={
          <>
            <button
              type="button"
              onClick={() => tabRef.current?.openAdd()}
              className="btn btn-sm text-primary bg-primary-content hover:bg-primary-content/90 gap-2 border-none shadow-sm"
            >
              <Plus className="size-4" />
              <span>{t("data.addTransaction.add")}</span>
            </button>
            <ReplanFab />
          </>
        }
      />

      <TransactionsTab ref={tabRef} />
    </div>
  );
}
