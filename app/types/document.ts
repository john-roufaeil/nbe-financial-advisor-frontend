export type DocumentType = "pdf" | "image" | "doc";

export type DocumentStatus = "uploading" | "processing" | "failed" | "processed";

export interface ExtractedTransaction {
  id: string;
  datetime: string;
  title: string;
  category: string;
  type: "income" | "expense";
  amount: number;
}

export interface DocumentRecord {
  id: string;
  /**
   * Optional: StatementFileSerializer carries no original filename, MIME type or
   * byte size, so these are populated only in mock mode. The backend needs
   * `original_filename` / `mime_type` / `file_size` before the real API can.
   */
  name?: string;
  type?: DocumentType;
  sizeKb?: number;
  uploadDate: string;
  status: DocumentStatus;
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
  /** Whether extracted rows can be edited/deleted in the current data source. */
  canEditTransactions?: boolean;
  /** Whether a new row can be added to this statement (false against the real API). */
  canAddTransactions?: boolean;
}

/** Same accept rules as the chat composer's attachment adapter — images and office/pdf docs only. */
export const DOCUMENT_UPLOAD_ACCEPT =
  "image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function inferDocumentType(file: File): DocumentType | null {
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
