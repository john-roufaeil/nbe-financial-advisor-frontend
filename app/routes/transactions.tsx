import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeftRight, Plus } from "lucide-react";
import {
  TransactionsTab,
  type TransactionsTabHandle,
} from "@/components/data/TransactionsTab";
import { ReplanFab } from "@/components/data/ReplanFab";
import { PageBanner } from "@/components/shared/PageBanner";
import { usePageTitle } from "@/lib/use-page-title";

export default function Transactions() {
  const { t } = useTranslation();
  usePageTitle(t("data.transactions"));
  const tabRef = useRef<TransactionsTabHandle>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("add")) {
      tabRef.current?.openAdd();
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete("add");
        return next;
      });
    }
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 md:p-6">
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
