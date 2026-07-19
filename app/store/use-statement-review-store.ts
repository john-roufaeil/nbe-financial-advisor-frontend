import { create } from "zustand";

/**
 * The statement a chat message's "Review" button is currently opening.
 *
 * A statement card is rendered per assistant message deep inside the
 * assistant-ui primitive tree, but the review modal is mounted once at the
 * thread root — this store is the bridge between them, mirroring
 * use-notifications-modal-store's open/close shape. `statementId` doubles as
 * the open flag: non-null means "show the review modal for this statement".
 */
interface StatementReviewState {
  statementId: string | null;
  open: (id: string) => void;
  close: () => void;
}

export const useStatementReviewStore = create<StatementReviewState>((set) => ({
  statementId: null,
  open: (id) => set({ statementId: id }),
  close: () => set({ statementId: null }),
}));
