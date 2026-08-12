export type PreferenceDateFormat = "DD/MM/YYYY" | "MM/DD/YYYY";

/**
 * GET/PATCH /users/me/preferences. Only `dateFormat` and `language` have a
 * frontend equivalent today (DateFormatSwitcher's dmy/mdy toggle, the
 * language switcher) and are the only ones this app reads or writes —
 * `currencyDisplayFormat`, `budgetCycleStartDay`, `defaultView`, and
 * `retainRawDocuments` have no UI concept yet and round-trip through PATCH
 * untouched (partial updates never send fields that aren't set).
 */
export interface UserPreferences {
  language: string;
  currencyDisplayFormat: string;
  dateFormat: PreferenceDateFormat;
  budgetCycleStartDay: number;
  defaultView: string;
  retainRawDocuments: boolean;
  updatedAt: string;
}

export type UpdateUserPreferencesBody = Partial<Omit<UserPreferences, "updatedAt">>;
