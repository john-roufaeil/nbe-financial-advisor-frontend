import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Plus } from "lucide-react";
import { getBankCode, getBankLogo, getBankName } from "@/lib/banks";
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
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = accounts?.find((a) => a.id === value);
  const selectedCode = getBankCode(selected?.bank_name);
  const selectedLabel = selected
    ? t(`banks.${selectedCode}`, getBankName(selectedCode) ?? selected.bank_name)
    : "";

  function select(accountId: string) {
    onChange(accountId);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={`input input-bordered input-sm flex w-full items-center justify-between gap-2 ${error ? "input-error" : ""} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      >
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
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </button>

      {open && !disabled && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="menu bg-base-100 border-base-300 absolute z-20 mt-1 w-full flex-col gap-1 rounded-lg border p-2 shadow-lg">
            <ul className="max-h-40 overflow-y-auto">
              {accounts?.map((a) => {
                const code = getBankCode(a.bank_name);
                const label = t(`banks.${code}`, getBankName(code) ?? a.bank_name);
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => select(a.id)}
                      className="hover:bg-base-200 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm"
                    >
                      <img
                        src={getBankLogo(code)}
                        alt=""
                        className="size-5 shrink-0 rounded-full object-cover"
                      />
                      <span className="flex-1 truncate">
                        {label} {a.masked_account_number}
                      </span>
                      {value === a.id && <Check className="size-4 shrink-0" />}
                    </button>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAddNew();
              }}
              className="border-base-300 hover:bg-base-200 flex items-center gap-2 rounded-md border border-dashed px-2 py-1.5 text-start text-sm"
            >
              <Plus className="size-4 shrink-0" />
              <span className="truncate">{t("data.addTransaction.addNewAccount")}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
