import { create } from "zustand";

interface CompleteProfileModalState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/** Drives CompleteProfileModal, opened once per login by
 * useCheckProfileCompletion when the user has no employment_status yet. */
export const useCompleteProfileModalStore = create<CompleteProfileModalState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
