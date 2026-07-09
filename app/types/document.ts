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
  name: string;
  type: DocumentType;
  uploadDate: string;
  sizeKb: number;
  status: DocumentStatus;
  errorMessage?: string;
  extractedTransactions?: ExtractedTransaction[];
  approved?: boolean;
  approvedAt?: number;
  bankName?: string;
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
