import React, { useState, useEffect } from 'react';
import { MsalProvider, useMsal } from '@azure/msal-react';
import { msalInstance, loginRequest, apiRequest } from '@/lib/auth';
import { LogIn, Loader2 } from 'lucide-react';

// Module-level token getter for services
export async function getAccessTokenSilent(): Promise<string | null> {
  const account = msalInstance.getActiveAccount();
  if (!account) return null;
  try {
    const res = await msalInstance.acquireTokenSilent({ ...apiRequest, account });
    return res.accessToken;
  } catch {
    return null;
  }
}

function LoginPage() {
  const { instance } = useMsal();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    instance.loginRedirect(loginRequest).catch((error) => {
      console.error('Login failed:', error);
      setIsLoading(false);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]">
      <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-[#FF5B2B] rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">W</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">WesserPlan</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Planification & Operations
          </p>
        </div>

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#FF5B2B] hover:bg-[#e5512a] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <LogIn size={18} />
          )}
          {isLoading ? 'Redirection...' : 'Se connecter avec Microsoft'}
        </button>

        <p className="text-xs text-[var(--text-secondary)] mt-4">
          Authentification via Microsoft Entra ID
        </p>
      </div>
    </div>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { instance, accounts, inProgress } = useMsal();
  const account = instance.getActiveAccount() || accounts[0] || null;

  // Set active account for module-level getAccessTokenSilent
  useEffect(() => {
    if (account && !instance.getActiveAccount()) {
      instance.setActiveAccount(account);
    }
  }, [account, instance]);

  // Loading state during redirect
  if (inProgress !== 'none' && !account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-page)]">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  if (!account) {
    return <LoginPage />;
  }

  return <>{children}</>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // MSAL is initialized (and any redirect response handled) in main.tsx
  // before React mounts, so we just wrap the tree in MsalProvider here.
  return (
    <MsalProvider instance={msalInstance}>
      <AuthGate>{children}</AuthGate>
    </MsalProvider>
  );
}
