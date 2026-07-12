import { useTranslation } from "react-i18next";
import type { BankStatement } from "@/types/bank-statement";
import { formatSize } from "@/lib/format";
import { useBankInfo } from "@/lib/banks";

/** The modal's icon (bank logo) and title (bank name + filename/size subtitle). */
export function useBankStatementModalHeader(doc: BankStatement | undefined) {
  const { t } = useTranslation();
  const { label: bankLabel, logo: bankLogo } = useBankInfo(doc?.bankName);
  const fileMeta = [
    doc?.type && t(`data.filters.${doc.type}`),
    doc?.sizeKb !== undefined && formatSize(doc.sizeKb, t),
  ]
    .filter(Boolean)
    .join(" · ");

  if (!doc) return { icon: undefined, title: undefined };

  return {
    icon: (
      <img src={bankLogo} alt="" className="size-9 shrink-0 rounded-full object-cover" />
    ),
    title: (
      <span className="flex min-w-0 flex-col">
        <span className="truncate">{bankLabel}</span>
        <span className="text-base-content/50 truncate text-xs font-normal">
          {doc.name || t("data.bankStatementFallbackName")}
          {fileMeta && ` · ${fileMeta}`}
        </span>
      </span>
    ),
  };
}
