import React from 'react';

interface TagProps {
  label: string;
}

export const Tag: React.FC<TagProps> = ({ label }) => {
  let colors =
    "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/80 border border-slate-200/70 dark:border-white/10";

  if (label === 'Homme' || label === 'Femme') {
    colors =
      "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-white/60 border border-slate-200/60 dark:border-white/5";
  }

  return (
    <span
      className={`text-[11px] tracking-tight font-medium px-2 py-0.5 rounded-md mr-1 mb-1 inline-block ${colors}`}
    >
      {label}
    </span>
  );
};
