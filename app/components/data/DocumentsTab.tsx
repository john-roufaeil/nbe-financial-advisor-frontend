import { useEffect, useRef, useState } from "react";
import type { ComponentType, CSSProperties } from "react";
import {
  Trash2,
  Loader2,
  TriangleAlert,
  CircleCheck,
  ClockCheck,
  FileText,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { DocumentRecord } from "@/types/document";
import { formatDate } from "@/lib/format";
import { BankBadge } from "@/components/shared/BankBadge";
import { useDocuments, useDeleteDocument } from "@/queries/documents";
import { Pagination } from "@/components/data/Pagination";
import { DocumentDetailModal } from "@/components/data/DocumentDetailModal";
import { DataToolbar } from "@/components/shared/DataToolbar";
import { useConfirmStore } from "@/store/use-confirm-store";
import {
  ListSkeleton,
  CardGridSkeleton,
  ErrorState,
  EmptyState,
} from "@/components/shared/QueryState";
import { useViewModeStore, type ViewMode } from "@/store/use-view-mode-store";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";

/** List = single column of rows; grid = responsive cards. */
const VIEW_CONTAINER = {
  list: "flex flex-col gap-2",
  grid: "grid gap-2 sm:grid-cols-2 xl:grid-cols-3",
} as const;

const FILTERS = ["all", "pdf", "image", "doc"] as const;
type Filter = (typeof FILTERS)[number];

function formatSize(kb: number, t: (key: string) => string) {
  return kb >= 1024
    ? `${(kb / 1024).toFixed(1)} ${t("units.mb")}`
    : `${kb} ${t("units.kb")}`;
}

/** The real API returns neither filename nor size (see DocumentRecord). */
function documentSubtitle(doc: DocumentRecord, t: (key: string) => string) {
  const parts = [formatDate(doc.uploadDate)];
  if (doc.sizeKb !== undefined) parts.push(formatSize(doc.sizeKb, t));
  return parts.join(" · ");
}

const PROCESSED_BADGE_DURATION_MS = 5000;
const PROCESSED_BADGE_FADE_MS = 400;

function StatusPill({
  tone,
  icon: Icon,
  spin,
  label,
  style,
  className = "",
}: {
  tone: string;
  icon: ComponentType<{ className?: string; "data-no-flip"?: boolean }>;
  spin?: boolean;
  label: string;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <span
      style={style}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tone} ${className}`}
    >
      <Icon data-no-flip className={`size-3.5 ${spin ? "animate-spin" : ""}`} />
      {label}
    </span>
  );
}

function StatusBadge({ doc }: { doc: DocumentRecord }) {
  const { t } = useTranslation();
  const [showProcessed, setShowProcessed] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!doc.approved || !doc.approvedAt) {
      setShowProcessed(false);
      return;
    }
    const elapsed = Date.now() - doc.approvedAt;
    const remaining = PROCESSED_BADGE_DURATION_MS - elapsed;
    if (remaining <= 0) {
      setShowProcessed(false);
      return;
    }
    setShowProcessed(true);
    setFading(false);
    const fadeTimer = setTimeout(
      () => setFading(true),
      Math.max(remaining - PROCESSED_BADGE_FADE_MS, 0),
    );
    const hideTimer = setTimeout(() => setShowProcessed(false), remaining);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [doc.approved, doc.approvedAt]);

  if (doc.status === "uploading" || doc.status === "processing") {
    return (
      <StatusPill
        tone="bg-info/10 text-info"
        icon={Loader2}
        spin
        label={t(`data.documentStatus.${doc.status}`)}
      />
    );
  }
  if (doc.status === "failed") {
    return (
      <StatusPill
        tone="bg-error/10 text-error"
        icon={TriangleAlert}
        label={t("data.documentStatus.failed")}
      />
    );
  }
  if (!doc.approved) {
    return (
      <StatusPill
        tone="bg-warning/10 text-warning"
        icon={ClockCheck}
        label={t("data.documentStatus.pendingApproval")}
      />
    );
  }
  if (!showProcessed) return null;
  return (
    <StatusPill
      tone="bg-success/10 text-success"
      icon={CircleCheck}
      label={t("data.documentStatus.processed")}
      style={{ transitionDuration: `${PROCESSED_BADGE_FADE_MS}ms` }}
      className={`transition-opacity ${fading ? "opacity-0" : "opacity-100"}`}
    />
  );
}

function DocumentCard({
  doc,
  view,
  onOpen,
}: {
  doc: DocumentRecord;
  view: ViewMode;
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const deleteDocument = useDeleteDocument();
  const confirm = useConfirmStore((s) => s.confirm);
  const isGrid = view === "grid";

  const logoAndText = (
    <BankBadge
      bank={doc.bankName}
      className="flex-1"
      subtitle={
        <>
          {doc.name || t("data.documentFallbackName")} · {documentSubtitle(doc, t)}
        </>
      }
    />
  );

  const status = <StatusBadge doc={doc} />;

  const deleteButton = (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        confirm({
          title: t("confirm.deleteDocumentTitle"),
          message: t("confirm.deleteMessage"),
          onConfirm: () => deleteDocument.mutate(doc.id),
        });
      }}
      className="btn btn-ghost btn-sm btn-square text-error shrink-0"
      aria-label={t("actions.delete", {
        name: doc.name || t("data.documentFallbackName"),
      })}
    >
      <Trash2 className="size-4" />
    </button>
  );

  if (isGrid) {
    return (
      <li
        onClick={onOpen}
        className="border-base-300 bg-base-100 hover:border-primary flex cursor-pointer flex-col gap-3 rounded-lg border p-3 transition-colors"
      >
        {logoAndText}
        <div className="border-base-200 flex items-center gap-2 border-t pt-2">
          {status}
          <div className="ms-auto">{deleteButton}</div>
        </div>
      </li>
    );
  }

  return (
    <li
      onClick={onOpen}
      className="border-base-300 bg-base-100 hover:border-primary flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
    >
      {logoAndText}
      {status}
      {deleteButton}
    </li>
  );
}

export function DocumentsTab() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const detailModalRef = useRef<HTMLDialogElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const viewMode = useViewModeStore((s) => s.mode);

  const { data, isPending, isError, refetch } = useDocuments({
    type: filter === "all" ? undefined : filter,
    q: search.trim() || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
    offset: (page - 1) * pageSize,
    limit: pageSize,
  });

  function openDetail(id: string) {
    setSelectedId(id);
    detailModalRef.current?.showModal();
  }

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize));

  function updatePageSize(size: number) {
    setPageSize(size);
    setPage(1);
  }

  function updateSearch(value: string) {
    setSearch(value);
    setPage(1);
  }
  function updateFilter(value: Filter) {
    setFilter(value);
    setPage(1);
  }
  function updateFromDate(value: string) {
    setFromDate(value);
    setPage(1);
  }
  function updateToDate(value: string) {
    setToDate(value);
    setPage(1);
  }

  return (
    <div className="mb-20 flex flex-col gap-4">
      <DataToolbar
        search={search}
        onSearchChange={updateSearch}
        fromDate={fromDate}
        onFromDateChange={updateFromDate}
        toDate={toDate}
        onToDateChange={updateToDate}
        filters={FILTERS}
        filter={filter}
        onFilterChange={updateFilter}
        filterLabel={(f) => t(`data.filters.${f}`)}
        pageSize={pageSize}
        onPageSizeChange={updatePageSize}
      />

      {isPending ? (
        viewMode === "grid" ? (
          <CardGridSkeleton />
        ) : (
          <ListSkeleton />
        )
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : data.items.length > 0 ? (
        <ul className={`animate-fade-in ${VIEW_CONTAINER[viewMode]}`}>
          {data.items.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              view={viewMode}
              onOpen={() => openDetail(doc.id)}
            />
          ))}
        </ul>
      ) : (
        <EmptyState icon={FileText} label={t("data.documentsEmpty")} />
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        total={data?.total ?? 0}
        pageSize={pageSize}
        onChange={setPage}
        onPageSizeChange={updatePageSize}
      />

      <DocumentDetailModal ref={detailModalRef} documentId={selectedId} />
    </div>
  );
}
