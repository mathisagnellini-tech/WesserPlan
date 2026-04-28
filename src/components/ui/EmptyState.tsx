import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Aucune donnée',
  message,
  icon,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-12 text-center px-6 ${className}`}>
      <div className="w-12 h-12 rounded-full bg-[var(--bg-card-solid)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-muted)]">
        {icon ?? <Inbox size={22} />}
      </div>
      <div className="space-y-1 max-w-md">
        <h3 className="text-base font-bold text-[var(--text-primary)]">{title}</h3>
        {message && <p className="text-sm text-[var(--text-secondary)]">{message}</p>}
      </div>
      {action}
    </div>
  );
};

export default EmptyState;
