import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import {
  TransactionsTab,
  type TransactionsTabHandle,
} from "@/components/data/TransactionsTab";
import { ReplanFab } from "@/components/data/ReplanFab";
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">{t("data.transactions")}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => tabRef.current?.openAdd()}
            className="btn btn-primary btn-sm gap-2"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">{t("data.addTransaction.add")}</span>
          </button>
          <ReplanFab />
        </div>
      </div>

      <TransactionsTab ref={tabRef} />
    </div>
  );
}
