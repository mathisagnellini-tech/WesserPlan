import React from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

const RouteErrorElement: React.FC = () => {
  const error = useRouteError();

  let title = 'Erreur de chargement';
  let message = "Une erreur inattendue s'est produite. Vous pouvez recharger l'application ou revenir à l'accueil.";
  let detail: string | undefined;
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = 'Page introuvable';
      message = "La page demandée n'existe pas ou a été déplacée.";
    } else {
      title = `Erreur ${error.status}`;
      message = error.statusText || message;
    }
    detail = typeof error.data === 'string' ? error.data : undefined;
  } else if (error instanceof Error) {
    detail = error.message;
    stack = error.stack;
  } else if (typeof error === 'string') {
    detail = error;
  }

  if (import.meta.env.DEV) {
    console.error('Route error:', error);
  }

  const handleReload = () => window.location.reload();

  return (
    <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4">
      <div className="glass-card max-w-2xl w-full p-6 md:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="shrink-0 w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
              {title}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{message}</p>
          </div>
        </div>

        {detail && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-sm text-red-900 dark:text-red-300 font-mono break-words">
            {detail}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <button
            type="button"
            onClick={handleReload}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[var(--accent-primary)] rounded-lg hover:opacity-90 transition shadow-md shadow-[var(--accent-primary)]/25"
          >
            <RefreshCw size={16} /> Recharger l'application
          </button>
          <a
            href="/"
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg hover:bg-[var(--bg-card-solid)] hover:text-[var(--text-primary)] transition"
          >
            <Home size={16} /> Retour à l'accueil
          </a>
        </div>

        {stack && import.meta.env.DEV && (
          <details className="text-xs text-[var(--text-muted)]">
            <summary className="cursor-pointer font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-1">
              Détails techniques
            </summary>
            <pre className="mt-2 p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] overflow-auto max-h-64 font-mono text-[11px] text-[var(--text-secondary)] whitespace-pre-wrap break-words">
              {stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default RouteErrorElement;
