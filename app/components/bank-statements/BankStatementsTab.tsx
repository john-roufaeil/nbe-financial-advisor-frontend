import { useRef, useState } from "react";
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

  const { data, isPending, isError, refetch } = useBankStatements({
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
    detailModalRef.current?.showModal();
  }

  return (
    <PagedListSection
      toolbar={
        <DataToolbar
          search={f.searchInput}
          onSearchChange={f.updateSearch}
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
      <BankStatementDetailModal ref={detailModalRef} bankStatementId={selectedId} />
    </PagedListSection>
  );
}
