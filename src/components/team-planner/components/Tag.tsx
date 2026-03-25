import React from 'react';

interface TagProps {
  label: string;
}

export const Tag: React.FC<TagProps> = ({ label }) => {
  // Default glass style
  let colors = "bg-black/20 text-white/90 border border-white/10";
  
  // We keep subtle hints but rely more on the card background for the main color impact
  if (label === 'Homme' || label === 'Femme') colors = "bg-black/10 text-white/70 border border-white/5";

  return (
    <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded-full mr-1 mb-1 inline-block backdrop-blur-sm ${colors}`}>
      {label}
    </span>
  );
};