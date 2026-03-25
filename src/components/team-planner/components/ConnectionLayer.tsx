
import React, { useEffect, useState } from 'react';
import { Relationship, Person } from '../types';

interface ConnectionLayerProps {
  relationships: Relationship[];
  cards: Record<string, Person>;
  draggingCardId: string | null;
  highlightedCardId: string | null;
  showAll: boolean;
  isCompact: boolean;
}

export const ConnectionLayer: React.FC<ConnectionLayerProps> = ({ relationships, cards, draggingCardId, highlightedCardId, showAll, isCompact }) => {
  const [paths, setPaths] = useState<React.ReactElement[]>([]);
  
  useEffect(() => {
    const updatePaths = () => {
      const newPaths: React.ReactElement[] = [];

      relationships.forEach((rel) => {
        const el1 = document.getElementById(`card-${rel.sourceId}`);
        const el2 = document.getElementById(`card-${rel.targetId}`);

        if (el1 && el2) {
          const rect1 = el1.getBoundingClientRect();
          const rect2 = el2.getBoundingClientRect();
          const container = document.getElementById('board-container');
          if (!container) return;
          
          const containerRect = container.getBoundingClientRect();
          const x1 = rect1.left - containerRect.left + rect1.width / 2;
          const y1 = rect1.top - containerRect.top + rect1.height / 2;
          const x2 = rect2.left - containerRect.left + rect2.width / 2;
          const y2 = rect2.top - containerRect.top + rect2.height / 2;

          // Apple Style Curve: More organic, larger control points for a smooth 's' or arc
          const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          const curveFactor = Math.min(dist * 0.5, 150); // Dynamic curvature based on distance
          
          // Logic for vertical vs horizontal curvature optimization
          const isHorizontal = Math.abs(x1 - x2) > Math.abs(y1 - y2);
          
          let d = '';
          if (isHorizontal) {
              d = `M ${x1} ${y1} C ${x1 + curveFactor} ${y1}, ${x2 - curveFactor} ${y2}, ${x2} ${y2}`;
          } else {
              d = `M ${x1} ${y1} C ${x1} ${y1 + curveFactor}, ${x2} ${y2 - curveFactor}, ${x2} ${y2}`;
          }

          const isRelated = highlightedCardId && (rel.sourceId === highlightedCardId || rel.targetId === highlightedCardId);
          
          // --- APPLE VISIBILITY LOGIC ---
          let opacity = 0;
          let strokeWidth = 2;
          let filter = 'none';

          if (showAll) {
              opacity = 0.4; // Lighter opacity for background connections in light mode
              if (isRelated) { opacity = 1; strokeWidth = 4; filter = 'url(#glow)'; }
          } else {
              if (isRelated) { opacity = 1; strokeWidth = 4; filter = 'url(#glow)'; }
          }

          if (opacity === 0) return;

          const isConflict = rel.type === 'conflict';
          const isSynergy = rel.type === 'synergy';
          
          let strokeUrl = 'url(#gradient-affinity)';
          if (isConflict) strokeUrl = 'url(#gradient-conflict)';
          if (isSynergy) strokeUrl = 'url(#gradient-synergy)';
          
          newPaths.push(
            <g key={rel.id} style={{ transition: 'opacity 0.4s ease-in-out', opacity }}>
                {/* Shadow path for depth on light background */}
                <path 
                    d={d}
                    fill="none"
                    stroke="rgba(0,0,0,0.1)" // Darker shadow for light mode
                    strokeWidth={strokeWidth + 2}
                    className="blur-[2px]"
                />
                
                {/* Main animated path */}
                <path 
                    d={d}
                    fill="none"
                    stroke={strokeUrl}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={isConflict ? "10,10" : (isSynergy ? "5,5" : "200,200")} 
                    className={isConflict ? "animate-pulse-fast" : "animate-dash-flow"}
                    filter={filter}
                />

                {/* Optional: Midpoint Bubble for clearer identification */}
                {isRelated && (
                     <circle 
                        cx={(x1 + x2) / 2} 
                        cy={(y1 + y2) / 2} 
                        r={6} 
                        fill={isConflict ? '#f43f5e' : (isSynergy ? '#3b82f6' : '#10b981')} 
                        className="animate-pulse shadow-md"
                        stroke="white"
                        strokeWidth={2}
                     />
                )}
            </g>
          );
        }
      });

      setPaths(newPaths);
    };

    updatePaths();
    window.addEventListener('resize', updatePaths);
    // Use a ResizeObserver for more robust layout change detection
    const container = document.getElementById('board-container');
    const resizeObserver = new ResizeObserver(() => updatePaths());
    
    if (container) {
        container.addEventListener('scroll', updatePaths);
        resizeObserver.observe(container);
    }

    return () => {
      window.removeEventListener('resize', updatePaths);
      resizeObserver.disconnect();
      if (container) container.removeEventListener('scroll', updatePaths);
    };
  }, [relationships, cards, draggingCardId, highlightedCardId, showAll, isCompact]); 

  return (
    <svg 
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" 
        style={{ minWidth: '100%', minHeight: '100%' }}
    >
      <defs>
        {/* Apple Style Gradients - Tuned for Light Mode */}
        <linearGradient id="gradient-affinity" gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#10b981" stopOpacity="1" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
        </linearGradient>
        
        <linearGradient id="gradient-conflict" gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fb7185" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#f43f5e" stopOpacity="1" />
          <stop offset="100%" stopColor="#e11d48" stopOpacity="0.8" />
        </linearGradient>

        <linearGradient id="gradient-synergy" gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0.8" />
        </linearGradient>

        {/* Cinematic Glow Filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
      </defs>
      
      {/* CSS for Flow Animation embedded in SVG to ensure it works */}
      <style>
        {`
            @keyframes dash-flow {
                to {
                    stroke-dashoffset: -400;
                }
            }
            .animate-dash-flow {
                animation: dash-flow 8s linear infinite;
            }
            .animate-pulse-fast {
                animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
        `}
      </style>

      {paths}
    </svg>
  );
};
