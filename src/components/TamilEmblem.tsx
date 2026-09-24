import React from 'react';

interface TamilEmblemProps {
  className?: string;
  size?: number;
}

export const TamilEmblem: React.FC<TamilEmblemProps> = ({ 
  className = "w-11 h-11", 
  size = 44 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Tamil Nadu Legal Assistance Official Emblem"
    >
      {/* Outer Seal Circle */}
      <circle cx="50" cy="50" r="47" fill="#7A1C28" stroke="#B87314" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="42" fill="#0B2545" stroke="#F5F2EA" strokeWidth="1" strokeDasharray="3 2" />
      
      {/* Temple Gopuram Silhouette in Center Top */}
      <path 
        d="M50 16 L53 21 L55 21 L56 26 L58 26 L61 35 L39 35 L42 26 L44 26 L45 21 L47 21 Z" 
        fill="#D4881A" 
      />
      {/* Gopuram Kalasam Tip */}
      <circle cx="50" cy="14.5" r="1.5" fill="#D4881A" />
      <path d="M49 16 L51 16 L50 13 Z" fill="#D4881A" />

      {/* Justice Balance Beam */}
      <rect x="28" y="37" width="44" height="3" rx="1.5" fill="#F5F2EA" />
      {/* Center Pillar */}
      <rect x="48.5" y="35" width="3" height="36" rx="1.5" fill="#D4881A" />
      {/* Pillar Base */}
      <path d="M40 71 L60 71 L56 75 L44 75 Z" fill="#D4881A" />
      <rect x="38" y="75" width="24" height="2" rx="1" fill="#F5F2EA" />

      {/* Left Pan Chains & Pan */}
      <line x1="31" y1="39" x2="24" y2="52" stroke="#F5F2EA" strokeWidth="1.2" />
      <line x1="31" y1="39" x2="38" y2="52" stroke="#F5F2EA" strokeWidth="1.2" />
      <path d="M22 52 Q31 59 40 52 Z" fill="#D4881A" stroke="#F5F2EA" strokeWidth="1" />

      {/* Right Pan Chains & Pan */}
      <line x1="69" y1="39" x2="62" y2="52" stroke="#F5F2EA" strokeWidth="1.2" />
      <line x1="69" y1="39" x2="76" y2="52" stroke="#F5F2EA" strokeWidth="1.2" />
      <path d="M60 52 Q69 59 78 52 Z" fill="#D4881A" stroke="#F5F2EA" strokeWidth="1" />

      {/* Lower Ribbon / Banner */}
      <path 
        d="M24 78 Q50 84 76 78 L73 85 Q50 89 27 85 Z" 
        fill="#B87314" 
      />
      
      {/* Tamil Inscription Dots / Stars */}
      <circle cx="18" cy="50" r="2" fill="#D4881A" />
      <circle cx="82" cy="50" r="2" fill="#D4881A" />
    </svg>
  );
};

export const TamilBorderPattern: React.FC<{ className?: string }> = ({ className = "w-full h-3" }) => {
  return (
    <div className={`overflow-hidden flex items-center justify-center opacity-85 select-none ${className}`} aria-hidden="true">
      <svg width="100%" height="12" viewBox="0 0 1200 12" fill="none" preserveAspectRatio="repeat-x">
        <pattern id="tamil-kolam" width="40" height="12" patternUnits="userSpaceOnUse">
          {/* Traditional Temple Wall / Gopuram geometric wave */}
          <path d="M0 6 L10 0 L20 6 L30 0 L40 6 L30 12 L20 6 L10 12 Z" fill="#7A1C28" opacity="0.3" />
          <circle cx="20" cy="6" r="2" fill="#B87314" />
          <line x1="0" y1="6" x2="40" y2="6" stroke="#B87314" strokeWidth="0.8" opacity="0.4" />
        </pattern>
        <rect width="100%" height="12" fill="url(#tamil-kolam)" />
      </svg>
    </div>
  );
};
