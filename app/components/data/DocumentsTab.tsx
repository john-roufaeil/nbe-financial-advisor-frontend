import { useEffect, useRef, useState } from "react";
import {
  Search,
  Trash2,
  Loader2,
  TriangleAlert,
  CircleCheck,
  ClockCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatDate, type DocumentRecord } from "@/lib/demo-transactions";
import { getBankLogo, getBankName } from "@/lib/banks";
import { useDocumentsStore } from "@/store/use-documents-store";
import { Pagination } from "@/components/data/Pagination";
import { DocumentDetailModal } from "@/components/data/DocumentDetailModal";
import { DateField } from "@/components/shared/DateField";
import { useConfirmStore } from "@/store/use-confirm-store";

const PAGE_SIZE = 10;
const FILTERS = ["all", "pdf", "image", "doc"] as const;
type Filter = (typeof FILTERS)[number];

function formatSize(kb: number, t: (key: string) => string) {
  return kb >= 1024
    ? `${(kb / 1024).toFixed(1)} ${t("units.mb")}`
    : `${kb} ${t("units.kb")}`;
}

const PROCESSED_BADGE_DURATION_MS = 5000;
const PROCESSED_BADGE_FADE_MS = 400;

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
      <span className="text-base-content/50 flex items-center gap-1 text-xs">
        <Loader2 className="size-3 animate-spin" />
        {t(`data.documentStatus.${doc.status}`)}
      </span>
    );
  }
  if (doc.status === "failed") {
    return (
      <span className="text-error flex items-center gap-1 text-xs">
        <TriangleAlert className="size-3" />
        {t("data.documentStatus.failed")}
      </span>
    );
  }
  if (!doc.approved) {
    return (
      <span className="text-warning flex items-center gap-1 text-xs">
        <ClockCheck className="size-3" />
        {t("data.documentStatus.pendingApproval")}
      </span>
    );
  }
  if (!showProcessed) return null;
  return (
    <span
      style={{ transitionDuration: `${PROCESSED_BADGE_FADE_MS}ms` }}
      className={`text-success flex items-center gap-1 text-xs transition-opacity ${fading ? "opacity-0" : "opacity-100"}`}
    >
      <CircleCheck data-no-flip className="size-3" />
      {t("data.documentStatus.processed")}
    </span>
  );
}

function DocumentCard({ doc, onOpen }: { doc: DocumentRecord; onOpen: () => void }) {
  const { t } = useTranslation();
  const removeDocument = useDocumentsStore((s) => s.removeDocument);
  const confirm = useConfirmStore((s) => s.confirm);
  return (
    <li
      onClick={onOpen}
      className="border-base-300 bg-base-100 hover:border-primary flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
    >
      <img
        src={getBankLogo(doc.bankName)}
        alt={
          doc.bankName
            ? t(`banks.${doc.bankName}`, getBankName(doc.bankName) ?? doc.bankName)
            : ""
        }
        className="size-9 shrink-0 rounded-full object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{doc.name}</p>
        <p className="text-base-content/50 text-xs">
          {formatDate(doc.uploadDate)} · {formatSize(doc.sizeKb, t)}
        </p>
      </div>
      <StatusBadge doc={doc} />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          confirm({
            title: t("confirm.deleteDocumentTitle"),
            message: t("confirm.deleteMessage"),
            onConfirm: () => removeDocument(doc.id),
          });
        }}
        className="btn btn-ghost btn-sm btn-square text-error shrink-0"
        aria-label={t("actions.delete", { name: doc.name })}
      >
        <Trash2 className="size-4" />
      </button>
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
  const documents = useDocumentsStore((s) => s.documents);
  const detailModalRef = useRef<HTMLDialogElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function openDetail(id: string) {
    setSelectedId(id);
    detailModalRef.current?.showModal();
  }

  const filtered = documents.filter((doc) => {
    const matchesFilter = filter === "all" || doc.type === filter;
    const matchesSearch =
      !search.trim() || doc.name.toLowerCase().includes(search.toLowerCase());
    const matchesDate =
      (!fromDate || doc.uploadDate >= fromDate) && (!toDate || doc.uploadDate <= toDate);
    return matchesFilter && matchesSearch && matchesDate;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
    <div className="flex flex-col gap-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
        <label className="input input-bordered flex w-full flex-1 items-center gap-2 px-3 py-2">
          <Search className="text-base-content/40 size-4 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
            placeholder={t("data.search")}
            className="w-full min-w-0 grow"
          />
        </label>
        <div className="flex min-w-0 flex-col gap-3 sm:shrink-0 sm:flex-row sm:flex-nowrap sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <DateField
              label={t("data.dateFrom")}
              value={fromDate}
              onChange={updateFromDate}
            />
            <DateField label={t("data.dateTo")} value={toDate} onChange={updateToDate} />
          </div>
          <div className="join border-base-300 w-fit shrink-0 rounded-lg border">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => updateFilter(f)}
                className={`btn btn-sm join-item cursor-pointer ${filter === f ? "btn-accent" : "btn-ghost"}`}
              >
                {t(`data.filters.${f}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {pageItems.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {pageItems.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} onOpen={() => openDetail(doc.id)} />
          ))}
        </ul>
      ) : (
        <p className="text-base-content/50 py-6 text-center text-sm">
          {t("data.noResults")}
        </p>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <DocumentDetailModal ref={detailModalRef} documentId={selectedId} />
    </div>
  );
}
