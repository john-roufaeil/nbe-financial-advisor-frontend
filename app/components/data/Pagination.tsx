import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-1">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="btn btn-ghost btn-sm gap-1 disabled:opacity-30"
      >
        <ChevronLeft className="size-4" />
        {t("data.pagination.prev")}
      </button>
      <span className="text-base-content/50 text-xs">
        {t("data.pagination.page", { page, totalPages })}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="btn btn-ghost btn-sm gap-1 disabled:opacity-30"
      >
        {t("data.pagination.next")}
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
