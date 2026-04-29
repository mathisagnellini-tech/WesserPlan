import { msalInstance, loginRequest, apiRequest } from './auth';
import { InteractionRequiredAuthError } from '@azure/msal-browser';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

interface ProblemDetails {
  status: number;
  type?: string;
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public problemDetails?: ProblemDetails,
  ) {
    super(problemDetails?.detail || problemDetails?.title || `API error ${status}`);
    this.name = 'ApiError';
  }

  get validationErrors(): Record<string, string[]> | undefined {
    return this.problemDetails?.errors;
  }
}

async function getAccessToken(): Promise<string | null> {
  const account = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
  if (!account) return null;

  try {
    const response = await msalInstance.acquireTokenSilent({ ...apiRequest, account });
    return response.accessToken;
  } catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
      msalInstance.loginRedirect(loginRequest).catch(() => {});
    }
    return null;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 204 || response.status === 304) {
    return undefined as T;
  }

  if (!response.ok) {
    let problemDetails: ProblemDetails | undefined;
    try {
      problemDetails = await response.json();
    } catch {
      // Response body is not JSON
    }

    if (response.status === 401) {
      // Token expired — redirect to login
      msalInstance.loginRedirect(loginRequest).catch(() => {});
      throw new ApiError(401, problemDetails);
    }

    throw new ApiError(response.status, problemDetails);
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }

  return response.text() as unknown as T;
}

export const api = {
  get<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'GET' });
  },

  post<T>(endpoint: string, body?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: unknown): Promise<T> {
    return request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string): Promise<T> {
    return request<T>(endpoint, { method: 'DELETE' });
  },

  async upload<T>(endpoint: string, file: File): Promise<T> {
    const token = await getAccessToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = endpoint.startsWith('http')
      ? endpoint
      : `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: formData,
    });

    if (!response.ok) {
      let problemDetails: ProblemDetails | undefined;
      try {
        problemDetails = await response.json();
      } catch {
        // not JSON
      }
      throw new ApiError(response.status, problemDetails);
    }

    return response.json();
  },
};
