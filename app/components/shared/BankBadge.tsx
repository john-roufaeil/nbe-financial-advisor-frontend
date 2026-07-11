import { useBankInfo } from "@/lib/banks";

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
