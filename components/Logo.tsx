
import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
  layout?: 'vertical' | 'horizontal';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 64, showText = true, layout = 'vertical', className = "" }) => {
  const isHorizontal = layout === 'horizontal';
  
  return (
    <div className={`flex ${isHorizontal ? 'flex-row items-center space-x-4' : 'flex-col items-center justify-center'} ${className}`}>
      <div className="relative group" style={{ width: size, height: size }}>
        {/* Glow Effect Background */}
        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
        
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_8px_rgba(99,102,241,0.4)] relative z-10"
        >
          <defs>
            <linearGradient id="qrGradientMain" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="accentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
          
          {/* The Q - Concurrent base */}
          <path
            d="M50 15 C30 15 15 30 15 50 C15 70 30 85 50 85 C58 85 66 82 72 77 L85 90"
            stroke="url(#qrGradientMain)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* The R - Sharing the left spine of the Q's inner space */}
          <path
            d="M40 35 V65 M40 35 H58 C65 35 65 48 58 48 H40 M58 48 L68 65"
            stroke="white"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_3px_rgba(255,255,255,0.8)]"
          />
          
          {/* Accent dot on the Q tail junction */}
          <circle cx="72" cy="77" r="4" fill="#38bdf8" className="animate-pulse" />
        </svg>
      </div>
      
      {showText && (
        <div className={`${isHorizontal ? 'text-left' : 'mt-4 text-center'}`}>
          <span className={`block font-black uppercase tracking-[0.2em] text-white glow-text-neon ${isHorizontal ? 'text-lg' : 'text-2xl'}`}>
            Intelligence
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
