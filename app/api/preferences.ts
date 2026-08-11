import { apiClient } from "@/api/client";
import { API_ENDPOINTS } from "@/lib/constants/api";
import type { UpdateUserPreferencesBody, UserPreferences } from "@/types/preferences";

interface RawUserPreferences {
  language: string;
  currency_display_format: string;
  date_format: string;
  budget_cycle_start_day: number;
  default_view: string;
  retain_raw_documents: boolean;
  updated_at: string;
}

function toUserPreferences(raw: RawUserPreferences): UserPreferences {
  return {
    language: raw.language,
    currencyDisplayFormat: raw.currency_display_format,
    dateFormat: raw.date_format as UserPreferences["dateFormat"],
    budgetCycleStartDay: raw.budget_cycle_start_day,
    defaultView: raw.default_view,
    retainRawDocuments: raw.retain_raw_documents,
    updatedAt: raw.updated_at,
  };
}

function toRawBody(body: UpdateUserPreferencesBody): Record<string, unknown> {
  const raw: Record<string, unknown> = {};
  if (body.language !== undefined) raw.language = body.language;
  if (body.currencyDisplayFormat !== undefined) {
    raw.currency_display_format = body.currencyDisplayFormat;
  }
  if (body.dateFormat !== undefined) raw.date_format = body.dateFormat;
  if (body.budgetCycleStartDay !== undefined) {
    raw.budget_cycle_start_day = body.budgetCycleStartDay;
  }
  if (body.defaultView !== undefined) raw.default_view = body.defaultView;
  if (body.retainRawDocuments !== undefined) {
    raw.retain_raw_documents = body.retainRawDocuments;
  }
  return raw;
}

/** Never 404s for a signed-in user — the backend lazily creates a defaults row on first access. */
export async function getPreferences(): Promise<UserPreferences> {
  const res = await apiClient.get<RawUserPreferences>(API_ENDPOINTS.usersMePreferences);
  return toUserPreferences(res.data);
}

export async function updatePreferences(
  body: UpdateUserPreferencesBody,
): Promise<UserPreferences> {
  const res = await apiClient.patch<RawUserPreferences>(
    API_ENDPOINTS.usersMePreferences,
    toRawBody(body),
  );
  return toUserPreferences(res.data);
}
