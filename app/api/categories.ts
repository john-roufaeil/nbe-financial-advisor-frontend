import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type { Category } from "@/types/category";

/** A row exactly as GET /categories returns it (CategorySerializer). */
interface RawCategory {
  id: string;
  name: string;
  label: string;
  category_type: "income" | "expense";
  is_fallback: boolean;
  created_at: string;
  updated_at: string;
}

function toCategory(raw: RawCategory): Category {
  return {
    name: raw.name,
    label: raw.label,
    type: raw.category_type,
    isFallback: raw.is_fallback,
  };
}

/**
 * GET /categories is one of the deliberately unpaginated endpoints (no
 * pagination_class on the backend's CategoryListView) — a bare array, not the
 * {count,results} envelope. Rows arrive ordered by (category_type, name), so
 * expenses come first; that order is what the palette mapping keys off.
 */
export async function getCategories(): Promise<Category[]> {
  const res = await apiClient.get<RawCategory[]>(API_ENDPOINTS.categories);
  return res.data.map(toCategory);
}
