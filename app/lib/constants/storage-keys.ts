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
  /** sessionStorage — the pending BankConnection id, set right before redirecting
   *  to the bank's OAuth page so /bank-connect/callback (a fixed, unprefixed
   *  path with no room for it in the query string) knows which connection to
   *  confirm once the provider redirects back. */
  pendingBankConnectionId: "nbe_pending_bank_connection_id",
} as const;
