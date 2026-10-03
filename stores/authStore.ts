import { create } from "zustand";

type StoredUser = {
  id: string;
  name: string;
  email: string;
};

type AuthStore = {
  user: StoredUser | null;
  token: string | null;
  setAuth: (user: StoredUser, token: string) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => set({ user, token }),
  clearAuth: () => set({ user: null, token: null })
}));
