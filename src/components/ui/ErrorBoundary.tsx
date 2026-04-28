import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare state: ErrorBoundaryState;
  declare props: Readonly<ErrorBoundaryProps>;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App Error:', error, info);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--bg-main)] flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="shrink-0 w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                  Erreur de chargement
                </h1>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Une erreur inattendue s'est produite. Vous pouvez recharger l'application ou revenir à l'accueil.
                </p>
              </div>
            </div>

            {this.state.error?.message && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-sm text-red-900 dark:text-red-300 font-mono break-words">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <button
                type="button"
                onClick={this.handleReload}
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

            {this.state.error?.stack && (
              <details className="text-xs text-[var(--text-muted)]">
                <summary className="cursor-pointer font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-1">
                  Détails techniques
                </summary>
                <pre className="mt-2 p-3 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] overflow-auto max-h-64 font-mono text-[11px] text-[var(--text-secondary)] whitespace-pre-wrap break-words">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
