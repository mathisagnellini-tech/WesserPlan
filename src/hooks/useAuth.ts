import { useMsal } from '@azure/msal-react';
import { useCallback } from 'react';
import { msalConfig, loginRequest, apiRequest } from '@/lib/auth';
import { InteractionRequiredAuthError } from '@azure/msal-browser';

export function useAuth() {
  const { instance, accounts } = useMsal();
  const account = instance.getActiveAccount() || accounts[0] || null;

  const userName = account?.name ?? null;
  const userEmail = account?.username ?? null;
  const userId = account?.homeAccountId ?? null;

  const logout = useCallback(() => {
    instance.logoutRedirect({
      account: account ?? undefined,
      postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri,
    });
  }, [instance, account]);

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
    account,
    logout,
    getToken,
  };
}
