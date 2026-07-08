/** Backend returns a short bank code (e.g. "NBE"); map it to its full commercial name and logo. */
export const BANK_NAMES: Record<string, string> = {
  NBE: "National Bank of Egypt",
  CIB: "Commercial International Bank",
  BM: "Banque Misr",
};

export const BANK_CODES = Object.keys(BANK_NAMES);

export const UNKNOWN_BANK_LOGO = "/banks/unknown.png";

export function getBankName(bankCode?: string): string | undefined {
  return bankCode ? BANK_NAMES[bankCode] : undefined;
}

/** Logo files live in public/banks/, named exactly after the bank code (e.g. "NBE.png"). */
export function getBankLogo(bankCode?: string): string {
  if (!bankCode || !(bankCode in BANK_NAMES)) return UNKNOWN_BANK_LOGO;
  return `/banks/${encodeURIComponent(bankCode)}.png`;
}
