import { Configuration, LogLevel, PublicClientApplication } from '@azure/msal-browser';

const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
const tenantId = import.meta.env.VITE_AZURE_TENANT_ID;
const apiAppId = import.meta.env.VITE_AZURE_API_APP_ID || clientId;
const redirectUri = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri,
    postLogoutRedirectUri: redirectUri,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
  system: {
    loggerOptions: {
      logLevel: import.meta.env.DEV ? LogLevel.Verbose : LogLevel.Error,
      piiLoggingEnabled: false,
    },
  },
};

/** Scopes for interactive login — includes API scope so consent is granted. */
export const loginRequest = {
  scopes: ['User.Read', 'openid', 'profile', `api://${apiAppId}/FR.Web.Read`],
  // Force work account selection when personal MS account exists with same email
  extraQueryParameters: { domain_hint: 'wesser.fr' },
};

/** Scopes for acquiring the token used when calling the backend API. */
export const apiRequest = {
  scopes: [`api://${apiAppId}/FR.Web.Read`],
};

export const msalInstance = new PublicClientApplication(msalConfig);
