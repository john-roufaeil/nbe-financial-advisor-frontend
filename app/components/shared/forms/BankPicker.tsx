import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Plus, Search } from "lucide-react";
import { BANK_CODES, getBankCode, getBankLogo, getBankName } from "@/lib/banks";
import { EntityPicker } from "@/components/shared/forms/EntityPicker";

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
  error,
  ariaDescribedBy,
}: {
  value: string;
  onChange: (bankCodeOrName: string) => void;
  className?: string;
  error?: boolean;
  ariaDescribedBy?: string;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

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
  }

  return (
    <EntityPicker
      className={className}
      error={error}
      ariaDescribedBy={ariaDescribedBy}
      items={results}
      getKey={(code) => code}
      onSelect={select}
      listClassName="max-h-30"
      emptyMessage={t("common.noResults")}
      trigger={
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {value && (
            <img
              src={getBankLogo(selectedCode)}
              alt=""
              className="size-4.5 shrink-0 rounded-full object-cover"
            />
          )}
          <span className={`truncate ${selectedLabel ? "" : "text-base-content/40"}`}>
            {selectedLabel || t("common.addAccount.bankPlaceholder")}
          </span>
        </span>
      }
      search={
        <label className="input input-bordered input-sm flex items-center gap-2">
          <Search data-no-flip className="size-3.5 opacity-50" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("common.addAccount.bankSearchPlaceholder")}
            maxLength={20}
            className="w-full"
          />
        </label>
      }
      renderItem={(code) => (
        <>
          <img
            src={getBankLogo(code)}
            alt=""
            className="size-5 shrink-0 rounded-full object-cover"
          />
          <span className="flex-1 truncate">
            {t(`banks.${code}`, getBankName(code) ?? code)}
          </span>
          {selectedCode === code && <Check data-no-flip className="size-4 shrink-0" />}
        </>
      )}
      footer={(close) =>
        query.trim() && !exactMatch ? (
          <button
            type="button"
            onClick={() => {
              select(query.trim());
              close();
            }}
            className="border-base-300 hover:bg-base-200 focus-visible:outline-primary/50 flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-2 py-1.5 text-start text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <Plus className="size-4 shrink-0" />
            <span className="truncate">
              {t("common.addAccount.addCustomBank", { name: query.trim() })}
            </span>
          </button>
        ) : null
      }
    />
  );
}
