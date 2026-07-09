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

const CODES_BY_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(BANK_NAMES).map(([code, name]) => [name.toLowerCase(), code]),
);

/**
 * Resolves a bank code from either a code ("NBE") or a full commercial name
 * ("National Bank of Egypt"). GET /accounts returns `bank_name` as a full name,
 * while statements return the short code — this accepts both. Returns undefined
 * for banks we have no logo or translation for.
 */
export function getBankCode(bank?: string): string | undefined {
  if (!bank) return undefined;
  if (bank in BANK_NAMES) return bank;
  return CODES_BY_NAME[bank.toLowerCase()];
}

/** Logo files live in public/banks/, named exactly after the bank code (e.g. "NBE.png"). */
export function getBankLogo(bankCode?: string): string {
  if (!bankCode || !(bankCode in BANK_NAMES)) return UNKNOWN_BANK_LOGO;
  return `/banks/${encodeURIComponent(bankCode)}.png`;
}
