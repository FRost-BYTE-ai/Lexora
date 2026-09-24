import React from 'react';
import appIconImg from '../assets/images/lexora_app_icon_1790274934737.jpg';

interface LexoraLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const LexoraLogo: React.FC<LexoraLogoProps> = ({ className = '', size = 'md', showText = true }) => {
  const dimension = size === 'sm' ? 28 : size === 'lg' ? 56 : 38;

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div 
        className="relative flex items-center justify-center rounded-xl overflow-hidden flex-shrink-0 shadow-xs"
        style={{ width: dimension, height: dimension }}
      >
        <img 
          src={appIconImg} 
          alt="Lexora App Icon" 
          className="w-full h-full object-cover rounded-xl"
        />
      </div>

      {showText && (
        <div className="min-w-0 flex flex-col text-left">
          <span className="font-serif font-bold text-sm tracking-widest text-[#17244F] dark:text-white uppercase leading-none">
            LEXORA
          </span>
          <span className="text-[9px] text-[#73777F] dark:text-zinc-400 font-medium tracking-wider uppercase mt-1 block">
            TAMIL-FIRST LEGAL
          </span>
        </div>
      )}
    </div>
  );
};
