/** Backend returns a short bank code (e.g. "NBE"); map it to its full commercial name and logo. */
export const BANK_NAMES: Record<string, string> = {
  NBE: "National Bank of Egypt",
  CIB: "Commercial International Bank",
  BM: "Banque Misr",
  HSBC: "HSBC Bank Egypt",
  BDC: "Banque du Caire",
  HDB: "Housing and Development Bank",
  ABE: "Agricultural Bank of Egypt",
  SCB: "Suez Canal Bank",
  EALB: "Egyptian Arab Land Bank",
  EDBE: "Export Development Bank of Egypt",
  IDB: "Industrial Development Bank",
  UB: "The United Bank",
  "QNB Alahli": "QNB Al Ahli",
  AAIB: "Arab African International Bank",
  EGBANK: "Egyptian Gulf Bank",
  SAIB: "Société Arabe Internationale de Banque",
  FIBE: "Faisal Islamic Bank of Egypt",
  ADIB: "Abu Dhabi Islamic Bank - Egypt",
  CA: "Crédit Agricole Egypt",
  ENBD: "Emirates NBD - Egypt",
  AIBANK: "Arab Investment Bank",
  MIDB: "Misr Iran Development Bank",
  ALX: "Bank of Alexandria",
  AUB: "Ahli United Bank - Egypt",
  NBK: "National Bank of Kuwait - Egypt",
  ABK: "Al Ahli Bank of Kuwait - Egypt",
  KFH: "Kuwait Finance House - Egypt",
  AB: "Arab Bank - Egypt",
  ATTI: "Attijariwafa Bank",
  MASH: "Mashreq Bank",
  CITI: "Citibank",
  NSB: "Nasser Social Bank",
  NIB: "National Investment Bank",
  FABM: "First Abu Dhabi Bank Misr",
  ADCB: "Abu Dhabi Commercial Bank - Egypt",
  ALBARAKA: "Al Baraka Bank Egypt",
  BLOM: "BLOM Bank Egypt",
  ABC: "Arab Banking Corporation",
  AIB: "Arab International Bank",
  DB: "Deutsche Bank",
  JP: "JP Morgan Chase",
  BNS: "Bank of Nova Scotia",
  BNP: "BNP Paribas",
  INTESA: "Intesa Sanpaolo",
  SOCIETE: "Société Générale",
  STANDARD: "Standard Chartered",
  CITIC: "CITIC Bank",
  AFREXIM: "Afreximbank",
  GULF: "Gulf Bank",
};

export const BANK_CODES = Object.keys(BANK_NAMES);

export const UNKNOWN_BANK_LOGO = "/banks/unknown.png";

export function getBankName(bankCode?: string): string | undefined {
  return bankCode ? BANK_NAMES[bankCode] : undefined;
}

const CODES_BY_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(BANK_NAMES).map(([code, name]) => [name.toLowerCase(), code]),
);

/** Lowercase, strip punctuation, and collapse whitespace so near-identical names compare equal. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const NORMALIZED_NAMES: [code: string, tokens: string[]][] = Object.entries(
  BANK_NAMES,
).map(([code, name]) => [code, normalize(name).split(" ")]);

/**
 * Best-effort match for names the backend spells slightly differently than ours
 * — extra/missing/reordered words ("HSBC Egypt" vs "HSBC Bank Egypt"), different
 * punctuation, etc. Every word of the shorter name must appear in the longer one,
 * and among candidates that qualify we pick the one with the highest word overlap
 * ratio so a more specific name (e.g. "National Bank of Kuwait - Egypt") doesn't
 * steal a match that belongs to a shorter, closer one ("National Bank of Egypt").
 */
function fuzzyMatchCode(bank: string): string | undefined {
  const targetTokens = normalize(bank).split(" ").filter(Boolean);
  if (targetTokens.length === 0) return undefined;

  let bestCode: string | undefined;
  let bestRatio = 0;
  for (const [code, nameTokens] of NORMALIZED_NAMES) {
    const shared = targetTokens.filter((tok) => nameTokens.includes(tok)).length;
    if (shared === 0) continue;
    const isSubset = shared === targetTokens.length || shared === nameTokens.length;
    if (!isSubset) continue;

    const union = new Set([...targetTokens, ...nameTokens]).size;
    const ratio = shared / union;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestCode = code;
    }
  }
  // Require reasonable overlap so a single generic word ("bank") doesn't match everything.
  return bestRatio >= 0.4 ? bestCode : undefined;
}

/**
 * Resolves a bank code from a code ("NBE"), a full commercial name
 * ("National Bank of Egypt"), or a close variant of either (different casing,
 * punctuation, or wording like "The National Bank of Egypt"). GET /accounts
 * returns `bank_name` as a full name, while statements return the short code —
 * this accepts both, plus near-matches. Returns undefined for banks we have no
 * logo or translation for.
 */
export function getBankCode(bank?: string): string | undefined {
  if (!bank) return undefined;
  if (bank in BANK_NAMES) return bank;
  const exact = CODES_BY_NAME[bank.toLowerCase()];
  if (exact) return exact;
  return fuzzyMatchCode(bank);
}

/** Logo files live in public/banks/, named exactly after the bank code (e.g. "NBE.png"). */
export function getBankLogo(bankCode?: string): string {
  if (!bankCode || !(bankCode in BANK_NAMES)) return UNKNOWN_BANK_LOGO;
  return `/banks/${encodeURIComponent(bankCode)}.png`;
}
