
import React, { useEffect, useState } from 'react';
import Logo from './Logo';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    // Total duration: 5000ms
    // Increment by 1 every 50ms = 100 steps * 50ms = 5000ms
    const timer = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsVisible(false);
            setTimeout(onComplete, 800); // Wait for fade out animation
          }, 500);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-cyber-950 transition-opacity duration-1000 ${loadingProgress === 100 ? 'opacity-0' : 'opacity-100'}`}>
      {/* Background Neural Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        <div className="grid grid-cols-12 gap-10 rotate-12 scale-150">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center space-y-12 scale-110 md:scale-150">
        <Logo size={120} className="animate-float" />
        
        <div className="w-64 space-y-4">
          <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-blue-400 to-purple-500 transition-all duration-300" 
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <div className="flex justify-between items-center px-1">
            <span className="mono text-[8px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">
              Initializing Core...
            </span>
            <span className="mono text-[8px] font-black text-slate-500 uppercase">
              {loadingProgress}%
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-12 left-0 right-0 text-center">
        <p className="mono text-[9px] font-black text-slate-700 uppercase tracking-[0.8em]">
          Powered by Quantum Reach Intelligence
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
