/** localStorage keys. `nbe_` prefix is the app namespace. Changing a value
 *  orphans existing persisted data, so keep values byte-identical. */
export const STORAGE_KEYS = {
  theme: "nbe_theme",
  lang: "nbe_lang",
  auth: "nbe_auth",
  onboarding: "nbe_onboarding",
  dataSource: "nbe_data_source",
  pageSize: "nbe_data_page_size",
  sidebar: "nbe_sidebar",
  displayPreferences: "nbe_display_preferences",
  accessibility: "accessibility-settings",
  a11yPeekSeen: "nbe_a11y_peek_seen",
} as const;
