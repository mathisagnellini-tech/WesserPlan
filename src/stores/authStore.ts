import { create } from 'zustand';

/**
 * Mirrors authenticated user info so non-React code (services) can stamp
 * Supabase rows with the Azure AD object identifier without going through
 * MSAL hooks.
 *
 * Populated by useAuth on every render; read by services when writing.
 */

export interface AuthUser {
  oid: string | null;
  name: string | null;
  email: string | null;
}

interface AuthStoreState extends AuthUser {
  isAuthenticated: boolean;
  setUser: (user: Partial<AuthUser> & { isAuthenticated?: boolean }) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  oid: null,
  name: null,
  email: null,
  isAuthenticated: false,
  setUser: (user) =>
    set((state) => ({
      ...state,
      ...user,
      isAuthenticated: user.isAuthenticated ?? !!(user.oid ?? state.oid),
    })),
  clear: () => set({ oid: null, name: null, email: null, isAuthenticated: false }),
}));

/** Non-hook accessor for service layer. Returns the current user or null. */
export const getCurrentUser = (): AuthUser | null => {
  const state = useAuthStore.getState();
  if (!state.isAuthenticated) return null;
  return { oid: state.oid, name: state.name, email: state.email };
};

/** Convenience: just the OID for stamping rows. */
export const getCurrentUserOid = (): string | null => useAuthStore.getState().oid;
