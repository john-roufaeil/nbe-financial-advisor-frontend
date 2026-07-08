export interface Transaction {
  id: string;
  datetime: string;
  title: string;
  category: string;
  type: "income" | "expense";
  amount: number;
}

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
}

export const TRANSACTION_CATEGORIES = [
  "Groceries",
  "Dining",
  "Transport",
  "Utilities",
  "Shopping",
  "Health",
  "Income",
] as const;

/** Fixed (non-random) placeholder data — no backend connected yet. Kept deterministic for SSR/CSR parity. */
export function getTransactions(): Transaction[] {
  return [
    {
      id: "t1",
      datetime: "2026-07-01T09:00:00",
      title: "Salary deposit",
      category: "Income",
      type: "income",
      amount: 42000,
    },
    {
      id: "t2",
      datetime: "2026-07-01T18:32:00",
      title: "Carrefour Market",
      category: "Groceries",
      type: "expense",
      amount: 650,
    },
    {
      id: "t3",
      datetime: "2026-06-29T13:05:00",
      title: "Uber ride",
      category: "Transport",
      type: "expense",
      amount: 120,
    },
    {
      id: "t4",
      datetime: "2026-06-28T21:10:00",
      title: "Cairo Kitchen restaurant",
      category: "Dining",
      type: "expense",
      amount: 380,
    },
    {
      id: "t5",
      datetime: "2026-06-27T08:15:00",
      title: "Electricity bill",
      category: "Utilities",
      type: "expense",
      amount: 540,
    },
    {
      id: "t6",
      datetime: "2026-06-26T11:40:00",
      title: "Freelance payment",
      category: "Income",
      type: "income",
      amount: 6500,
    },
    {
      id: "t7",
      datetime: "2026-06-25T16:20:00",
      title: "H&M",
      category: "Shopping",
      type: "expense",
      amount: 890,
    },
    {
      id: "t8",
      datetime: "2026-06-24T10:00:00",
      title: "Pharmacy",
      category: "Health",
      type: "expense",
      amount: 210,
    },
    {
      id: "t9",
      datetime: "2026-06-23T19:45:00",
      title: "Netflix subscription",
      category: "Shopping",
      type: "expense",
      amount: 150,
    },
    {
      id: "t10",
      datetime: "2026-06-22T07:30:00",
      title: "Gas station",
      category: "Transport",
      type: "expense",
      amount: 400,
    },
    {
      id: "t11",
      datetime: "2026-06-20T14:00:00",
      title: "Dividend payout",
      category: "Income",
      type: "income",
      amount: 1200,
    },
    {
      id: "t12",
      datetime: "2026-06-19T20:15:00",
      title: "Spinneys Market",
      category: "Groceries",
      type: "expense",
      amount: 720,
    },
    {
      id: "t13",
      datetime: "2026-06-18T12:30:00",
      title: "Dentist visit",
      category: "Health",
      type: "expense",
      amount: 950,
    },
    {
      id: "t14",
      datetime: "2026-06-17T09:00:00",
      title: "Water bill",
      category: "Utilities",
      type: "expense",
      amount: 180,
    },
    {
      id: "t15",
      datetime: "2026-06-15T15:50:00",
      title: "Cinema",
      category: "Dining",
      type: "expense",
      amount: 260,
    },
  ];
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Manual formatting (no Intl/locale) so server and client render identical
 * strings regardless of each environment's own timezone/locale settings.
 */
export function formatDateTime(iso: string) {
  const d = new Date(iso);
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${hours}:${minutes}`;
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
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

export function getDocuments(): DocumentRecord[] {
  return [
    {
      id: "d1",
      name: "Bank Statement - June 2026.pdf",
      type: "pdf",
      uploadDate: "2026-07-02",
      sizeKb: 245,
      status: "processed",
      approved: true,
    },
    {
      id: "d2",
      name: "National ID.jpg",
      type: "image",
      uploadDate: "2026-05-10",
      sizeKb: 1320,
      status: "processed",
      approved: true,
    },
    {
      id: "d3",
      name: "Salary Certificate.docx",
      type: "doc",
      uploadDate: "2026-04-22",
      sizeKb: 88,
      status: "processed",
      approved: true,
    },
    {
      id: "d4",
      name: "Bank Statement - May 2026.pdf",
      type: "pdf",
      uploadDate: "2026-06-02",
      sizeKb: 231,
      status: "processed",
      approved: true,
    },
    {
      id: "d5",
      name: "Utility Bill.pdf",
      type: "pdf",
      uploadDate: "2026-06-27",
      sizeKb: 96,
      status: "processed",
      approved: true,
    },
    {
      id: "d6",
      name: "Passport Photo.png",
      type: "image",
      uploadDate: "2026-03-15",
      sizeKb: 980,
      status: "processed",
      approved: true,
    },
    {
      id: "d7",
      name: "Lease Agreement.docx",
      type: "doc",
      uploadDate: "2026-02-01",
      sizeKb: 156,
      status: "processed",
      approved: true,
    },
    {
      id: "d8",
      name: "Bank Statement - April 2026.pdf",
      type: "pdf",
      uploadDate: "2026-05-03",
      sizeKb: 228,
      status: "processed",
      approved: true,
    },
  ];
}
