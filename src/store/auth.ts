import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  token: string | null;
  email: string | null;
  login: (token: string, email: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      email: null,
      login: (token, email) => set({ token, email }),
      logout: () => set({ token: null, email: null }),
    }),
    { name: "phishcatch-auth" }
  )
);

// true cuando el componente ya se montó en el navegador
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}