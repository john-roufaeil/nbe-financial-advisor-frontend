import { useTranslation } from "react-i18next";
import { getBankCode, getBankLogo, getBankName } from "@/lib/banks";

/** Resolves a bank's logo and localized display name from either a code or full name. */
function useBankInfo(bank?: string) {
  const { t } = useTranslation();
  const code = getBankCode(bank);
  const label = code ? t(`banks.${code}`, getBankName(code) ?? code) : bank;
  return { code, label, logo: getBankLogo(code) };
}

/** Bank logo + name, used anywhere a bank account, statement, or transaction needs to identify its bank. */
export function BankBadge({
  bank,
  subtitle,
  size = "size-9",
  className = "",
}: {
  bank?: string;
  /** Optional line rendered under the bank name instead of the name itself taking the subtitle slot. */
  subtitle?: React.ReactNode;
  size?: string;
  className?: string;
}) {
  const { label, logo } = useBankInfo(bank);

  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <img
        src={logo}
        alt={label ?? ""}
        className={`${size} shrink-0 rounded-full object-cover`}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        {subtitle && <p className="text-base-content/50 truncate text-xs">{subtitle}</p>}
      </div>
    </div>
  );
}
