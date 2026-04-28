import React from 'react';

interface LoadingStateProps {
  label?: string;
  className?: string;
  fullHeight?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Chargement…',
  className = '',
  fullHeight = false,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${
        fullHeight ? 'h-full min-h-[300px]' : 'py-12'
      } ${className}`}
    >
      <div className="w-8 h-8 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
      <span className="text-sm font-medium text-[var(--text-muted)]">{label}</span>
    </div>
  );
};

export default LoadingState;
