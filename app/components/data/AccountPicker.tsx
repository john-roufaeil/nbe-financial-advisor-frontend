import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Search } from "lucide-react";
import { getBankCode, getBankLogo, getBankName, UNKNOWN_BANK_LOGO } from "@/lib/banks";
import { EntityPicker } from "@/components/shared/EntityPicker";
import type { BankAccount } from "@/types/account";

/** Dropdown of the user's linked bank accounts, showing each account's bank logo. */
export function AccountPicker({
  accounts,
  value,
  onChange,
  onAddNew,
  disabled,
  placeholder,
  error,
}: {
  accounts: BankAccount[] | undefined;
  value: string;
  onChange: (accountId: string) => void;
  onAddNew: () => void;
  disabled?: boolean;
  placeholder?: string;
  error?: boolean;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const selected = accounts?.find((a) => a.id === value);
  const selectedCode = getBankCode(selected?.bank_name);
  const selectedLabel = selected
    ? t(`banks.${selectedCode}`, getBankName(selectedCode) ?? selected.bank_name)
    : "";

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts ?? [];
    return (accounts ?? []).filter((a) => {
      const code = getBankCode(a.bank_name);
      const label = t(`banks.${code}`, getBankName(code) ?? a.bank_name);
      return (
        label.toLowerCase().includes(q) ||
        a.masked_account_number.toLowerCase().includes(q)
      );
    });
  }, [accounts, query, t]);

  return (
    <EntityPicker
      items={results}
      getKey={(a) => a.id}
      onSelect={(a) => {
        onChange(a.id);
        setQuery("");
      }}
      disabled={disabled}
      error={error}
      emptyMessage={t("data.noResults")}
      search={
        <label className="input input-bordered input-sm flex items-center gap-2">
          <Search className="size-3.5 opacity-50" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("data.addTransaction.accountSearchPlaceholder")}
            maxLength={40}
            className="w-full"
          />
        </label>
      }
      trigger={
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {selected && (
            <img
              src={getBankLogo(selectedCode)}
              alt=""
              className="size-4.5 shrink-0 rounded-full object-cover"
            />
          )}
          <span className={`truncate ${selected ? "" : "text-base-content/40"}`}>
            {selected
              ? `${selectedLabel} ${selected.masked_account_number}`
              : (placeholder ?? "")}
          </span>
        </span>
      }
      renderItem={(a) => {
        const code = getBankCode(a.bank_name);
        const label = t(`banks.${code}`, getBankName(code) ?? a.bank_name);
        return (
          <>
            <img
              src={getBankLogo(code)}
              alt=""
              className="size-5 shrink-0 rounded-full object-cover"
            />
            <span className="flex-1 truncate">
              {label} {a.masked_account_number}
            </span>
            {value === a.id && <Check className="size-4 shrink-0" />}
          </>
        );
      }}
      footer={(close) => (
        <button
          type="button"
          onClick={() => {
            close();
            setQuery("");
            onAddNew();
          }}
          className="border-base-300 hover:bg-base-200 focus-visible:outline-primary/50 flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-2 py-1.5 text-start text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <img
            src={UNKNOWN_BANK_LOGO}
            alt=""
            className="size-5 shrink-0 rounded-full object-cover"
          />
          <span className="truncate">{t("data.addTransaction.addNewAccount")}</span>
        </button>
      )}
    />
  );
}
