/** localStorage keys. `nbe_` prefix is the app namespace. Changing a value
 *  orphans existing persisted data, so keep values byte-identical. */
export const STORAGE_KEYS = {
  theme: "nbe_theme",
  lang: "nbe_lang",
  auth: "nbe_auth",
  pageSize: "nbe_data_page_size",
  sidebar: "nbe_sidebar",
  displayPreferences: "nbe_display_preferences",
  dashboardPreferences: "nbe_dashboard_preferences",
  accessibility: "accessibility-settings",
  adminAuth: "nbe_admin_auth",
  messageFeedback: "nbe_message_feedback",
  messageAttachments: "nbe_message_attachments",
  conversationTitles: "nbe_conversation_titles",
} as const;
