export const BANKS = [
  "National Bank of Egypt",
  "Bank Misr",
  "Commercial International Bank",
] as const;

export type BankName = (typeof BANKS)[number];

export const UNKNOWN_BANK_LOGO = "/banks/unknown.png";

/** Logo files live in public/banks/, named exactly after the bank (e.g. "Bank Misr.png"). */
export function getBankLogo(bankName?: string): string {
  if (!bankName || !(BANKS as readonly string[]).includes(bankName))
    return UNKNOWN_BANK_LOGO;
  return `/banks/${encodeURIComponent(bankName)}.png`;
}
