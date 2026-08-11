import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import * as adminApi from "@/api/admin";
import type {
  AdminCategoryListParams,
  AdminFeedbackListParams,
  AdminIssueListParams,
  AdminProductListParams,
} from "@/api/admin";
import type {
  AdminCategoryCreateBody,
  AdminCategoryUpdateBody,
  AdminLoginBody,
  AdminProductCreateBody,
  AdminProductUpdateBody,
  IssueStatus,
} from "@/types/admin";
import { QUERY_ROOTS } from "@/lib/constants/query-keys";
import { toastSuccess, toastApiError } from "@/lib/toast";
import { useAdminAuthStore } from "@/store/use-admin-auth-store";

/** Admin data hooks — call the API module directly. */
export const adminKeys = {
  all: [QUERY_ROOTS.admin] as const,
  categories: (params: AdminCategoryListParams) =>
    [...adminKeys.all, "categories", params] as const,
  products: (params: AdminProductListParams) =>
    [...adminKeys.all, "products", params] as const,
  feedback: (params: AdminFeedbackListParams) =>
    [...adminKeys.all, "feedback", params] as const,
  issues: (params: AdminIssueListParams) => [...adminKeys.all, "issues", params] as const,
};

export function useAdminLogin() {
  const login = useAdminAuthStore((s) => s.login);
  return useMutation({
    mutationFn: (body: AdminLoginBody) => adminApi.adminLogin(body),
    onSuccess: (session) =>
      login({
        accessToken: session.access_token,
        adminId: session.admin_id,
        role: session.role,
      }),
    onError: (error) => toastApiError(error),
  });
}

export function useAdminCategories(params: AdminCategoryListParams) {
  return useQuery({
    queryKey: adminKeys.categories(params),
    queryFn: () => adminApi.getAdminCategories(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminProducts(params: AdminProductListParams) {
  return useQuery({
    queryKey: adminKeys.products(params),
    queryFn: () => adminApi.getAdminProducts(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminFeedback(params: AdminFeedbackListParams) {
  return useQuery({
    queryKey: adminKeys.feedback(params),
    queryFn: () => adminApi.getAdminFeedback(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminIssues(params: AdminIssueListParams) {
  return useQuery({
    queryKey: adminKeys.issues(params),
    queryFn: () => adminApi.getAdminIssues(params),
    placeholderData: keepPreviousData,
  });
}

/**
 * Cheap overview counts for the dashboard header (one row each, `limit: 1`,
 * just to read `.count`). Deliberately separate cache entries from the tab
 * queries above (different params) rather than trying to share — these are
 * for the summary strip, not for rendering rows.
 */
export function useAdminOverviewCounts() {
  const categories = useAdminCategories({ limit: 1 });
  const products = useAdminProducts({ limit: 1 });
  const openIssues = useAdminIssues({ limit: 1, status: "open" });
  const feedback = useAdminFeedback({ limit: 1 });

  return {
    categoriesCount: categories.data?.count,
    productsCount: products.data?.count,
    openIssuesCount: openIssues.data?.count,
    feedbackCount: feedback.data?.count,
    isLoading:
      categories.isLoading ||
      products.isLoading ||
      openIssues.isLoading ||
      feedback.isLoading,
  };
}

/** Shared shape for every admin write: run, invalidate the tab's lists, toast. */
function useAdminMutation<TVars, TData>(
  mutationFn: (vars: TVars) => Promise<TData>,
  segment: "categories" | "products" | "issues",
  successToastKey: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...adminKeys.all, segment] });
      toastSuccess(successToastKey);
    },
    onError: (error) => toastApiError(error),
  });
}

export function useCreateAdminCategory() {
  return useAdminMutation(
    (body: AdminCategoryCreateBody) => adminApi.createAdminCategory(body),
    "categories",
    "admin.toast.categoryCreated",
  );
}

export function useUpdateAdminCategory() {
  return useAdminMutation(
    ({ id, body }: { id: string; body: AdminCategoryUpdateBody }) =>
      adminApi.updateAdminCategory(id, body),
    "categories",
    "admin.toast.categoryUpdated",
  );
}

export function useDeleteAdminCategory() {
  return useAdminMutation(
    (id: string) => adminApi.deleteAdminCategory(id),
    "categories",
    "admin.toast.categoryDeleted",
  );
}

export function useCreateAdminProduct() {
  return useAdminMutation(
    (body: AdminProductCreateBody) => adminApi.createAdminProduct(body),
    "products",
    "admin.toast.productCreated",
  );
}

export function useUpdateAdminProduct() {
  return useAdminMutation(
    ({ id, body }: { id: string; body: AdminProductUpdateBody }) =>
      adminApi.updateAdminProduct(id, body),
    "products",
    "admin.toast.productUpdated",
  );
}

export function useDeleteAdminProduct() {
  return useAdminMutation(
    (id: string) => adminApi.deleteAdminProduct(id),
    "products",
    "admin.toast.productDeleted",
  );
}

export function useUpdateAdminIssue() {
  return useAdminMutation(
    ({ id, status }: { id: string; status: IssueStatus }) =>
      adminApi.updateAdminIssue(id, status),
    "issues",
    "admin.toast.issueUpdated",
  );
}
