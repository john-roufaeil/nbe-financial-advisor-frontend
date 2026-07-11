import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Plus, Search } from "lucide-react";
import { BANK_CODES, getBankCode, getBankLogo, getBankName } from "@/lib/banks";

/**
 * Searchable dropdown of registered banks. `onChange` receives the bank's
 * short code (e.g. "NBE") for a registry match, so logo/translation lookups
 * stay correct regardless of locale — never the localized display label.
 * Falls back to letting the user add a bank name that isn't in our registry
 * (e.g. a smaller bank we don't have a logo/translation for yet); `onChange`
 * receives that raw name in that case.
 */
export function BankPicker({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (bankCodeOrName: string) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCode = getBankCode(value);
  const selectedLabel = value
    ? selectedCode
      ? t(`banks.${selectedCode}`, getBankName(selectedCode) ?? value)
      : value
    : "";

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const codes = q
      ? BANK_CODES.filter((code) =>
          t(`banks.${code}`, getBankName(code) ?? code)
            .toLowerCase()
            .includes(q),
        )
      : BANK_CODES;
    return codes.slice(0, 30);
  }, [query, t]);

  const exactMatch = results.some(
    (code) =>
      t(`banks.${code}`, getBankName(code) ?? code).toLowerCase() ===
      query.trim().toLowerCase(),
  );

  function select(bankName: string) {
    onChange(bankName);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="input input-bordered input-sm flex w-full items-center justify-between gap-2"
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {value && (
            <img
              src={getBankLogo(selectedCode)}
              alt=""
              className="size-4.5 shrink-0 rounded-full object-cover"
            />
          )}
          <span className={`truncate ${selectedLabel ? "" : "text-base-content/40"}`}>
            {selectedLabel || t("data.addAccount.bankPlaceholder")}
          </span>
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="menu bg-base-100 border-base-300 absolute z-20 mt-1 w-full flex-col gap-1 rounded-lg border p-2 shadow-lg">
            <label className="input input-bordered input-sm flex items-center gap-2">
              <Search className="size-3.5 opacity-50" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("data.addAccount.bankSearchPlaceholder")}
                maxLength={20}
                className="w-full"
              />
            </label>
            <ul className="max-h-30 overflow-y-auto">
              {results.map((code) => {
                const label = t(`banks.${code}`, getBankName(code) ?? code);
                return (
                  <li key={code}>
                    <button
                      type="button"
                      onClick={() => select(code)}
                      className="hover:bg-base-200 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm"
                    >
                      <img
                        src={getBankLogo(code)}
                        alt=""
                        className="size-5 shrink-0 rounded-full object-cover"
                      />
                      <span className="flex-1 truncate">{label}</span>
                      {selectedCode === code && <Check className="size-4 shrink-0" />}
                    </button>
                  </li>
                );
              })}
              {results.length === 0 && (
                <li className="text-base-content/50 px-2 py-1.5 text-sm">
                  {t("data.noResults")}
                </li>
              )}
            </ul>
            {query.trim() && !exactMatch && (
              <button
                type="button"
                onClick={() => select(query.trim())}
                className="border-base-300 hover:bg-base-200 flex items-center gap-2 rounded-md border border-dashed px-2 py-1.5 text-start text-sm"
              >
                <Plus className="size-4 shrink-0" />
                <span className="truncate">
                  {t("data.addAccount.addCustomBank", { name: query.trim() })}
                </span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
