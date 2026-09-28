import React from 'react';

interface DilloVoiceWaveProps {
  state: 'idle' | 'listening' | 'processing' | 'speaking';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const DilloVoiceWave: React.FC<DilloVoiceWaveProps> = ({ state, className = '', size = 'sm' }) => {
  if (state === 'idle') return null;

  const barCount = state === 'speaking' ? 7 : 5;
  const sizeMap = { sm: 'h-6', md: 'h-10', lg: 'h-16' };
  const barWidthMap = { sm: 'w-1', md: 'w-1.5', lg: 'w-2' };

  return (
    <div className={`flex items-center justify-center gap-[3px] ${sizeMap[size]} ${className}`} aria-hidden="true">
      <style>{`
        @keyframes dilloWaveListen {
          0%, 100% { height: 30%; }
          50% { height: 100%; }
        }
        @keyframes dilloWaveProcess {
          0%, 100% { height: 20%; opacity: 0.5; }
          50% { height: 60%; opacity: 1; }
        }
        @keyframes dilloWaveSpeak {
          0% { height: 15%; }
          25% { height: 85%; }
          50% { height: 40%; }
          75% { height: 95%; }
          100% { height: 15%; }
        }
      `}</style>
      {Array.from({ length: barCount }).map((_, i) => {
        let animStyle: React.CSSProperties = {};
        let colorClass = 'bg-[#C4A760]';

        if (state === 'listening') {
          animStyle = {
            animationName: 'dilloWaveListen',
            animationDuration: `${0.6 + (i * 0.08)}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: `${i * 100}ms`,
          };
          colorClass = 'bg-emerald-400';
        } else if (state === 'processing') {
          animStyle = {
            animationName: 'dilloWaveProcess',
            animationDuration: '1.2s',
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: `${i * 150}ms`,
          };
          colorClass = 'bg-[#C4A760]';
        } else if (state === 'speaking') {
          animStyle = {
            animationName: 'dilloWaveSpeak',
            animationDuration: `${0.5 + (i * 0.07)}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDelay: `${i * 80}ms`,
          };
          colorClass = i % 2 === 0 ? 'bg-[#C4A760]' : 'bg-emerald-400';
        }

        return (
          <span
            key={i}
            className={`${barWidthMap[size]} rounded-full ${colorClass}`}
            style={{
              ...animStyle,
              height: '20%',
            }}
          />
        );
      })}
    </div>
  );
};
