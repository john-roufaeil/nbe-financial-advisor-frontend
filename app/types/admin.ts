/**
 * Admin API shapes — mirrors core/serializers/administration.py and
 * core/serializers/categories.py on the backend. Admin auth is a completely
 * separate credential space from end-user auth: tokens are NOT
 * interchangeable, and it has its own refresh/logout endpoints
 * (POST /admin/auth/refresh, POST /admin/auth/logout — SEC-009), separate
 * from the end-user ones.
 */

export interface AdminLoginBody {
  email: string;
  password: string;
}

export type AdminRole = "reviewer" | "super_admin";

/**
 * Shared by POST /admin/auth/login and POST /admin/auth/refresh — see
 * AdminLoginResponseSerializer's docstring (core/serializers/administration.py)
 * for why those two responses are identical in shape. No `refresh_token`
 * field — it's set as an httpOnly cookie instead, so it's never readable by
 * client-side JavaScript, even via a successful XSS attack.
 */
export interface AdminLoginResponse {
  access_token: string;
  admin_id: string;
  role: AdminRole;
}

/** DRF LimitOffsetPagination envelope — every admin list endpoint uses it. */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Row from GET /admin/categories (same CategorySerializer as the user API). */
export interface AdminCategory {
  id: string;
  name: string;
  label: string;
  category_type: "income" | "expense";
  is_fallback: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminCategoryCreateBody {
  name: string;
  label: string;
  category_type: "income" | "expense";
  is_fallback?: boolean;
}

export type AdminCategoryUpdateBody = Partial<AdminCategoryCreateBody>;

export interface AdminProduct {
  id: string;
  title: string;
  description: string | null;
  categories: string[];
  tags: string[];
  /** Free-form JSONB payload on the backend — displayed, not edited field-by-field. */
  features: Record<string, unknown> | null;
  external_link: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AdminProductCreateBody {
  title: string;
  description?: string;
  categories?: string[];
  tags?: string[];
  features?: Record<string, unknown> | null;
  external_link?: string;
  is_active?: boolean;
  /** Seed texts for recommendation embeddings — create-time only. */
  problem_statements?: string[];
}

export type AdminProductUpdateBody = Partial<
  Omit<AdminProductCreateBody, "problem_statements">
>;

/** Row from GET /admin/feedback (AdminReactionSerializer) — read-only. */
export interface AdminFeedbackEntry {
  id: string;
  user_id: string;
  target_type: string;
  target_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

/** GET /admin/onboarding-templates row — StarterTemplateSerializer minus
 * `is_suggested`, which is computed per-request from a signed-in user's own
 * profile on the public endpoint and meaningless for an admin session (see
 * AdminOnboardingTemplateListCreateView's docstring). Backed by
 * pfm-reference-data/onboarding-templates/*.json, not a DB table — no `id`,
 * `template_key` is the identity. */
export interface AdminTemplateAllocation {
  category: string;
  allocated_percentage: number;
}

export interface AdminTemplate {
  template_key: string;
  name: string;
  description: string;
  allocations: AdminTemplateAllocation[];
}

export interface AdminTemplateCreateBody {
  template_key: string;
  name: string;
  description?: string;
  allocations: AdminTemplateAllocation[];
}

/** `template_key` is never reassignable through PATCH — it's the object's identity. */
export type AdminTemplateUpdateBody = Partial<
  Omit<AdminTemplateCreateBody, "template_key">
>;

export const ISSUE_STATUSES = ["open", "in_review", "resolved", "dismissed"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];

export interface AdminIssue {
  id: string;
  user_id: string;
  description: string;
  status: IssueStatus;
  created_at: string;
  resolved_at: string | null;
}
