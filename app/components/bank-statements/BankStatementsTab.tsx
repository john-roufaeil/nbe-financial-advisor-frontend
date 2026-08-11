import { useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBankStatements } from "@/queries/bank-statements";
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

  const { data, isPending, isError, isFetching, refetch } = useBankStatements({
    type: f.filter === "all" ? undefined : f.filter,
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

  // BankStatementDetailModal below is keyed on selectedId, so switching to a
  // different statement remounts it with a brand-new <dialog> node — calling
  // showModal() synchronously in openDetail (as before) would fire on the
  // OLD node just before it's replaced. Deferring to an effect guarantees
  // detailModalRef already points at the current (post-remount) node.
  useEffect(() => {
    if (selectedId) detailModalRef.current?.showModal();
    // openNonce is the real trigger (see its declaration) — selectedId is
    // read, not re-triggered on, since re-selecting the same id shouldn't
    // reopen on its own without a matching openDetail call.
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
          sort={f.sort}
          onSortChange={f.setSort}
          hasActiveFilters={f.hasActiveFilters}
          onClearAll={f.clearAllFilters}
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
