import React from 'react';

interface TagProps {
  label: string;
}

export const Tag: React.FC<TagProps> = ({ label }) => {
  // Default glass style
  let colors = "bg-slate-900/10 dark:bg-black/20 text-slate-700 dark:text-white/90 border border-slate-900/10 dark:border-white/10";

  // We keep subtle hints but rely more on the card background for the main color impact
  if (label === 'Homme' || label === 'Femme') colors = "bg-slate-900/5 dark:bg-black/10 text-slate-600 dark:text-white/70 border border-slate-900/5 dark:border-white/5";

  return (
    <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded-full mr-1 mb-1 inline-block backdrop-blur-sm ${colors}`}>
      {label}
    </span>
  );
};
