import { useMemo, useState } from "react";
import { Search, FileText, Image as ImageIcon, File, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  getDocuments,
  formatDate,
  type DocumentRecord,
  type DocumentType,
} from "@/lib/demo-transactions";
import { Pagination } from "@/components/data/Pagination";

const PAGE_SIZE = 10;
const FILTERS = ["all", "pdf", "image", "doc"] as const;
type Filter = (typeof FILTERS)[number];

const TYPE_ICONS: Record<DocumentType, typeof FileText> = {
  pdf: FileText,
  image: ImageIcon,
  doc: File,
};

function formatSize(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

function DocumentCard({ doc }: { doc: DocumentRecord }) {
  const { t } = useTranslation();
  const Icon = TYPE_ICONS[doc.type];
  return (
    <li className="border-base-300 bg-base-100 flex items-center gap-3 rounded-lg border p-3">
      <span className="bg-info/10 text-info grid size-9 shrink-0 place-items-center rounded-lg">
        <Icon className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{doc.name}</p>
        <p className="text-base-content/50 text-xs">
          {formatDate(doc.uploadDate)} · {formatSize(doc.sizeKb)}
        </p>
      </div>
      <button
        type="button"
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
  const documents = useMemo(() => getDocuments(), []);

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
        <label className="input input-bordered input-sm flex min-w-0 flex-1 items-center gap-2">
          <Search className="text-base-content/40 size-4 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
            placeholder={t("data.search")}
            className="min-w-0 grow"
          />
        </label>
        <div className="flex min-w-0 flex-wrap items-center gap-3 sm:shrink-0 sm:flex-nowrap">
          <label className="text-base-content/50 flex shrink-0 items-center gap-1.5 text-xs">
            {t("data.dateFrom")}
            <input
              type="date"
              value={fromDate}
              onChange={(e) => updateFromDate(e.target.value)}
              className="input input-bordered input-sm"
            />
          </label>
          <label className="text-base-content/50 flex shrink-0 items-center gap-1.5 text-xs">
            {t("data.dateTo")}
            <input
              type="date"
              value={toDate}
              onChange={(e) => updateToDate(e.target.value)}
              className="input input-bordered input-sm"
            />
          </label>
          <div className="join border-base-300 shrink-0 rounded-lg border">
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
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </ul>
      ) : (
        <p className="text-base-content/50 py-6 text-center text-sm">
          {t("data.noResults")}
        </p>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
