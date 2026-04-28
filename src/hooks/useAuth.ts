import { useMsal } from '@azure/msal-react';
import { useCallback, useEffect } from 'react';
import { msalConfig, loginRequest, apiRequest } from '@/lib/auth';
import { InteractionRequiredAuthError } from '@azure/msal-browser';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { instance, accounts } = useMsal();
  const account = instance.getActiveAccount() || accounts[0] || null;

  const userName = account?.name ?? null;
  const userEmail = account?.username ?? null;
  const userId = account?.homeAccountId ?? null;
  const userOid = (account?.idTokenClaims as { oid?: string } | undefined)?.oid ?? null;

  const setStoreUser = useAuthStore((s) => s.setUser);
  const clearStoreUser = useAuthStore((s) => s.clear);

  // Mirror current user into the Zustand store so service-layer code (which
  // can't use hooks) can read the OID when stamping Supabase rows.
  useEffect(() => {
    if (account) {
      setStoreUser({
        oid: userOid,
        name: userName,
        email: userEmail,
        isAuthenticated: true,
      });
    } else {
      clearStoreUser();
    }
  }, [account, userOid, userName, userEmail, setStoreUser, clearStoreUser]);

  const logout = useCallback(() => {
    clearStoreUser();
    instance.logoutRedirect({
      account: account ?? undefined,
      postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri,
    });
  }, [instance, account, clearStoreUser]);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!account) return null;
    try {
      const response = await instance.acquireTokenSilent({ ...apiRequest, account });
      return response.accessToken;
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        instance.loginRedirect(loginRequest).catch(() => {});
      }
      return null;
    }
  }, [instance, account]);

  return {
    isAuthenticated: !!account,
    userName,
    userEmail,
    userId,
    userOid,
    account,
    logout,
    getToken,
  };
}
