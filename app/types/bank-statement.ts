export type BankStatementType = "pdf" | "image" | "doc";

export type BankStatementStatus = "uploading" | "processing" | "failed" | "processed";

/** Non-translated status literals, deduplicated across bank-statement components. */
export const BANK_STATEMENT_STATUS = {
  uploading: "uploading",
  processing: "processing",
  failed: "failed",
  processed: "processed",
} as const;

export interface ExtractedTransaction {
  id: string;
  datetime: string;
  title: string;
  category: string;
  type: "income" | "expense";
  amount: number;
  /** Carried through from normalization for round-trip on approve; not shown or editable. */
  merchantNormalized?: string | null;
  balance?: number | null;
  extraFields?: unknown;
}

export interface BankStatement {
  id: string;
  /**
   * Optional: StatementFileSerializer carries no original filename, MIME type or
   * byte size — the backend needs to add `original_filename` / `mime_type` /
   * `file_size` before these can be populated.
   */
  name?: string;
  type?: BankStatementType;
  sizeKb?: number;
  uploadDate: string;
  status: BankStatementStatus;
  errorMessage?: string;
  /**
   * When `status` is "failed", which phase failed: an "upload" failure means the
   * file never landed (prompt a fresh re-upload), while "processing" means the
   * file uploaded but extraction failed (a plain retry can re-run it).
   */
  failedStage?: "upload" | "processing";
  extractedTransactions?: ExtractedTransaction[];
  approved?: boolean;
  approvedAt?: number;
  bankName?: string;
  /** The bank account the statement was filed under, when the backend resolved one. */
  accountId?: string;
  /** Last 4 digits OCR read off the statement, used to pre-select a matching account in step 1. */
  perceivedAccountNumber?: string;
  /** Whether step 1 (confirm the bank account) is done. Gates the 2-step review flow. */
  accountConfirmed?: boolean;
  /** Whether extracted rows can be edited/deleted in the current data source. */
  canEditTransactions?: boolean;
  /** Whether a new row can be added to this statement (false against the real API). */
  canAddTransactions?: boolean;
}

/** Same accept rules as the chat composer's attachment adapter — images and office/pdf docs only. */
export const BANK_STATEMENT_UPLOAD_ACCEPT =
  "image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Client-side cap for a single statement upload, enforced before it ever reaches the network. */
export const BANK_STATEMENT_MAX_SIZE_MB = 10;
export const BANK_STATEMENT_MAX_SIZE_BYTES = BANK_STATEMENT_MAX_SIZE_MB * 1024 * 1024;

export function inferBankStatementType(file: File): BankStatementType | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) return "pdf";
  if (
    file.type === "application/msword" ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    /\.docx?$/i.test(file.name)
  ) {
    return "doc";
  }
  return null;
}
