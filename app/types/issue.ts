export const ISSUE_STATUSES = ["open", "in_review", "resolved", "dismissed"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

/**
 * GET/POST /issues — the current user's own reported bugs/support requests.
 * Always starts `status: "open"`; only an admin can move it forward from
 * there (see admin/issues) — there's no user-facing way to change it.
 */
export interface Issue {
  id: string;
  description: string;
  status: IssueStatus;
  createdAt: string;
  resolvedAt: string | null;
}
