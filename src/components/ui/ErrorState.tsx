import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
  fullHeight?: boolean;
}

function describeError(err: unknown): string {
  if (!err) return '';
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Une erreur est survenue',
  message,
  error,
  onRetry,
  className = '',
  fullHeight = false,
}) => {
  const detail = message ?? describeError(error);

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 text-center px-6 ${
        fullHeight ? 'h-full min-h-[300px]' : 'py-12'
      } ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
        <AlertTriangle size={22} />
      </div>
      <div className="space-y-1 max-w-md">
        <h3 className="text-base font-bold text-[var(--text-primary)]">{title}</h3>
        {detail && (
          <p className="text-sm text-[var(--text-secondary)] break-words">{detail}</p>
        )}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--accent-primary)] text-white hover:opacity-90 transition-opacity shadow-sm"
        >
          <RotateCw size={16} />
          Réessayer
        </button>
      )}
    </div>
  );
};

export default ErrorState;
