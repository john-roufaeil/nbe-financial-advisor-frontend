import { adminApiClient } from "@/api/admin-client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type {
  AdminCategory,
  AdminCategoryCreateBody,
  AdminCategoryUpdateBody,
  AdminFeedbackEntry,
  AdminIssue,
  AdminLoginBody,
  AdminLoginResponse,
  AdminProduct,
  AdminProductCreateBody,
  AdminProductUpdateBody,
  AdminTemplate,
  AdminTemplateCreateBody,
  AdminTemplateUpdateBody,
  IssueStatus,
  Paginated,
} from "@/types/admin";

export async function adminLogin(body: AdminLoginBody): Promise<AdminLoginResponse> {
  const res = await adminApiClient.post<AdminLoginResponse>(
    API_ENDPOINTS.adminAuthLogin,
    body,
  );
  return res.data;
}

/** Takes NO body — the refresh token rides along as an httpOnly cookie. */
export async function adminRefresh(): Promise<AdminLoginResponse> {
  const res = await adminApiClient.post<AdminLoginResponse>(
    API_ENDPOINTS.adminAuthRefresh,
  );
  return res.data;
}

export async function adminLogout(): Promise<void> {
  await adminApiClient.post(API_ENDPOINTS.adminAuthLogout);
}

/** Every admin list endpoint is LimitOffset-paginated ({count, results}). */
export interface AdminListParams {
  limit?: number;
  offset?: number;
}

/** Matches core/filters/categories.py's CategoryFilterSet (shared with the user-facing endpoint). */
export interface AdminCategoryListParams extends AdminListParams {
  category_type?: "income" | "expense";
}

/** Matches core/filters/administration.py's AdminProductFilterSet. */
export interface AdminProductListParams extends AdminListParams {
  is_active?: boolean;
  /** Exact match against one entry in the product's `categories` array. */
  category?: string;
}

/** Matches core/filters/administration.py's AdminIssueFilterSet. */
export interface AdminIssueListParams extends AdminListParams {
  status?: IssueStatus;
}

/** Matches core/filters/administration.py's AdminReactionFilterSet. `from`/`to` are ISO dates. */
export interface AdminFeedbackListParams extends AdminListParams {
  target_type?: string;
  rating?: number;
  from?: string;
  to?: string;
}

export async function getAdminCategories(
  params: AdminCategoryListParams = {},
): Promise<Paginated<AdminCategory>> {
  const res = await adminApiClient.get<Paginated<AdminCategory>>(
    API_ENDPOINTS.adminCategories,
    { params },
  );
  return res.data;
}

export async function createAdminCategory(
  body: AdminCategoryCreateBody,
): Promise<AdminCategory> {
  const res = await adminApiClient.post<AdminCategory>(
    API_ENDPOINTS.adminCategories,
    body,
  );
  return res.data;
}

export async function updateAdminCategory(
  id: string,
  body: AdminCategoryUpdateBody,
): Promise<AdminCategory> {
  const res = await adminApiClient.patch<AdminCategory>(
    API_ENDPOINTS.adminCategory(id),
    body,
  );
  return res.data;
}

export async function deleteAdminCategory(id: string): Promise<void> {
  await adminApiClient.delete(API_ENDPOINTS.adminCategory(id));
}

export async function getAdminProducts(
  params: AdminProductListParams = {},
): Promise<Paginated<AdminProduct>> {
  const res = await adminApiClient.get<Paginated<AdminProduct>>(
    API_ENDPOINTS.adminProducts,
    { params },
  );
  return res.data;
}

export async function createAdminProduct(
  body: AdminProductCreateBody,
): Promise<AdminProduct> {
  const res = await adminApiClient.post<AdminProduct>(API_ENDPOINTS.adminProducts, body);
  return res.data;
}

export async function updateAdminProduct(
  id: string,
  body: AdminProductUpdateBody,
): Promise<AdminProduct> {
  const res = await adminApiClient.patch<AdminProduct>(
    API_ENDPOINTS.adminProduct(id),
    body,
  );
  return res.data;
}

export async function deleteAdminProduct(id: string): Promise<void> {
  await adminApiClient.delete(API_ENDPOINTS.adminProduct(id));
}

/** GET /admin/onboarding-templates is a plain array, not LimitOffset-paginated
 * — there are only ever a handful of starter templates. */
export async function getAdminTemplates(): Promise<AdminTemplate[]> {
  const res = await adminApiClient.get<AdminTemplate[]>(
    API_ENDPOINTS.adminOnboardingTemplates,
  );
  return res.data;
}

export async function createAdminTemplate(
  body: AdminTemplateCreateBody,
): Promise<AdminTemplate> {
  const res = await adminApiClient.post<AdminTemplate>(
    API_ENDPOINTS.adminOnboardingTemplates,
    body,
  );
  return res.data;
}

export async function updateAdminTemplate(
  templateKey: string,
  body: AdminTemplateUpdateBody,
): Promise<AdminTemplate> {
  const res = await adminApiClient.patch<AdminTemplate>(
    API_ENDPOINTS.adminOnboardingTemplate(templateKey),
    body,
  );
  return res.data;
}

export async function deleteAdminTemplate(templateKey: string): Promise<void> {
  await adminApiClient.delete(API_ENDPOINTS.adminOnboardingTemplate(templateKey));
}

export async function getAdminFeedback(
  params: AdminFeedbackListParams = {},
): Promise<Paginated<AdminFeedbackEntry>> {
  const res = await adminApiClient.get<Paginated<AdminFeedbackEntry>>(
    API_ENDPOINTS.adminFeedback,
    { params },
  );
  return res.data;
}

export async function getAdminIssues(
  params: AdminIssueListParams = {},
): Promise<Paginated<AdminIssue>> {
  const res = await adminApiClient.get<Paginated<AdminIssue>>(API_ENDPOINTS.adminIssues, {
    params,
  });
  return res.data;
}

export async function updateAdminIssue(
  id: string,
  status: IssueStatus,
): Promise<AdminIssue> {
  const res = await adminApiClient.patch<AdminIssue>(API_ENDPOINTS.adminIssue(id), {
    status,
  });
  return res.data;
}
