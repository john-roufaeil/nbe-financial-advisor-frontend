import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBankStatements } from "@/queries/bank-statements";
import { useAccounts } from "@/queries/accounts";
import { getBankCode, getBankName } from "@/lib/banks";
import { BankStatementDetailModal } from "@/components/bank-statements/BankStatementDetailModal";
import { BankStatementCard } from "@/components/bank-statements/BankStatementCard";
import { DataToolbar } from "@/components/shared/layout/DataToolbar";
import { PagedListSection } from "@/components/shared/layout/PagedListSection";
import { useBankStatementFilters } from "@/lib/use-bank-statement-filters";

export function BankStatementsTab() {
  const { t } = useTranslation();
  const f = useBankStatementFilters();
  const detailModalRef = useRef<HTMLDialogElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Bumped on every openDetail call so the effect below always re-fires —
  // including reopening the SAME statement after closing, where selectedId
  // itself wouldn't change and so wouldn't retrigger the effect on its own.
  const [openNonce, setOpenNonce] = useState(0);

  const { data: accounts } = useAccounts();
  const accountOptions = (accounts ?? []).map((a) => {
    const code = getBankCode(a.bank_name);
    const bankLabel = t(`banks.${code}`, getBankName(code) ?? a.bank_name);
    return { key: a.id, label: `${bankLabel} ${a.masked_account_number}` };
  });

  const { data, isPending, isError, isFetching, refetch } = useBankStatements({
    accountId: f.account || undefined,
    status: f.filter === "all" ? undefined : f.filter,
    q: f.search.trim() || undefined,
    from: f.fromDate || undefined,
    to: f.toDate || undefined,
    sort: f.sort,
    offset: (f.page - 1) * f.pageSize,
    limit: f.pageSize,
  });

  function openDetail(id: string) {
    setSelectedId(id);
    setOpenNonce((n) => n + 1);
  }

  // The modal is keyed on selectedId, so switching statements remounts it with a new
  // <dialog> node. Calling showModal() synchronously in openDetail would fire on the
  // old node just before it's replaced, so defer to an effect keyed on openNonce
  // (not selectedId, so re-selecting the same id doesn't reopen without a fresh call).
  useEffect(() => {
    if (selectedId) detailModalRef.current?.showModal();
  }, [openNonce]);

  return (
    <PagedListSection
      toolbar={
        <DataToolbar
          search={f.searchInput}
          onSearchChange={f.updateSearch}
          searching={
            f.searchInput.trim() !== f.search.trim() ||
            (isFetching && f.search.trim() !== "")
          }
          fromDate={f.fromDate}
          onFromDateChange={f.updateFromDate}
          toDate={f.toDate}
          onToDateChange={f.updateToDate}
          filters={f.FILTERS}
          filter={f.filter}
          onFilterChange={f.updateFilter}
          filterLabel={(value) => t(`common.filters.${value}`)}
          accounts={accountOptions}
          account={f.account}
          onAccountChange={f.updateAccount}
          sort={f.sort}
          onSortChange={f.setSort}
          hasActiveFilters={f.hasActiveFilters}
          onClearAll={f.clearAllFilters}
          showDividers={false}
        />
      }
      isPending={isPending}
      isFetching={isFetching}
      isError={isError}
      onRetry={() => refetch()}
      items={data?.items}
      total={data?.total}
      renderItem={(doc, viewMode) => (
        <BankStatementCard
          key={doc.id}
          doc={doc}
          view={viewMode}
          onOpen={() => openDetail(doc.id)}
        />
      )}
      emptyIcon={FileText}
      emptyLabel={t("bankStatements.empty")}
      page={f.page}
      pageSize={f.pageSize}
      onPageChange={f.setPage}
      onPageSizeChange={f.updatePageSize}
      totalLabelKey="bankStatements.pagination.total"
    >
      <BankStatementDetailModal
        key={selectedId}
        ref={detailModalRef}
        bankStatementId={selectedId}
      />
    </PagedListSection>
  );
}
