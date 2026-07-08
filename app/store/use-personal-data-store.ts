import { create } from "zustand";

export interface PersonalDataState {
  profile: { fullName: string; dob: string; nationalId: string };
  contact: { email: string; phone: string };
  address: { country: string; city: string; addressLine: string };
  financial: { employmentStatus: string; monthlyIncome: string; riskTolerance: string };
  updateSection: <K extends "profile" | "contact" | "address" | "financial">(
    section: K,
    values: PersonalDataState[K],
  ) => void;
}

export const usePersonalDataStore = create<PersonalDataState>((set) => ({
  profile: {
    fullName: "Amina El-Sayed",
    dob: "1992-04-18",
    nationalId: "29204181234567",
  },
  contact: { email: "amina.elsayed@example.com", phone: "+20 100 123 4567" },
  address: {
    country: "Egypt",
    city: "Cairo",
    addressLine: "12 Nile Corniche St, Zamalek",
  },
  financial: {
    employmentStatus: "Employed",
    monthlyIncome: "42,000 EGP",
    riskTolerance: "Moderate",
  },
  updateSection: (section, values) =>
    set({ [section]: values } as Partial<PersonalDataState>),
}));
