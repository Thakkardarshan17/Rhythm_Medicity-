import React, { useState } from 'react';
import { Sparkles, Mic, MessageSquare, Bot } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { DilloModal } from './DilloModal';

export const DilloFloatingButton: React.FC = () => {
  const { dilloSettings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [initialVoice, setInitialVoice] = useState(false);

  // If Admin disabled the AI Assistant, hide it completely
  if (dilloSettings.ai_enabled === false) {
    return null;
  }

  const assistantName = dilloSettings.assistant_name || 'Dillo';

  const handleOpenVoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInitialVoice(true);
    setIsOpen(true);
  };

  const handleOpenChat = () => {
    setInitialVoice(false);
    setIsOpen(true);
  };

  return (
    <>
      <style>{`
        @keyframes dilloPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 4px 15px rgba(196, 167, 96, 0.3); }
          50% { transform: scale(1.03); box-shadow: 0 6px 25px rgba(196, 167, 96, 0.5); }
        }
        @keyframes dilloGlowHalo {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
      `}</style>

      {/* Floating Action Button Container */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 group">
        
        {/* Quick Voice Trigger Badge on hover */}
        {dilloSettings.voice_enabled && (
          <button
            type="button"
            onClick={handleOpenVoice}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-white text-[#006655] shadow-lg border border-[#006655]/20 hover:bg-[#E0F2ED] transition-all transform hover:scale-105 opacity-0 group-hover:opacity-100 duration-300"
            title={`Speak with ${assistantName}`}
            aria-label={`Speak directly with ${assistantName}`}
          >
            <Mic className="w-4 h-4 text-[#006655] animate-pulse" />
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Talk to {assistantName}</span>
          </button>
        )}

        {/* Main Floating Sphere Button */}
        <button
          type="button"
          onClick={handleOpenChat}
          className="relative flex items-center gap-2 sm:gap-2.5 px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-[#003329] via-[#004C3D] to-[#006655] text-white shadow-xl hover:shadow-2xl border-2 border-[#C4A760]/60 hover:border-[#C4A760] transition-all duration-300 active:scale-95"
          style={{ animation: 'dilloPulse 3s ease-in-out infinite' }}
          aria-label={`Open ${assistantName} AI Healthcare Voice Assistant`}
        >
          {/* Animated Glow Halo */}
          <span
            className="absolute -inset-1.5 rounded-full bg-[#C4A760]/20 blur-md -z-10"
            style={{ animation: 'dilloGlowHalo 3s ease-in-out infinite' }}
          />

          {/* Assistant Avatar / Icon */}
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#C4A760] to-[#997E3B] text-white flex items-center justify-center font-black text-xs shadow-inner overflow-hidden border border-white/30 shrink-0">
            {dilloSettings.assistant_avatar ? (
              <img
                src={dilloSettings.assistant_avatar}
                alt={assistantName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            )}
          </div>

          {/* Name & Subtitle */}
          <div className="flex flex-col items-start">
            <span className="font-extrabold text-xs sm:text-sm tracking-tight text-white leading-none">
              🤖 {assistantName}
            </span>
            <span className="text-[9px] sm:text-[10px] text-[#93D3C3] leading-none mt-0.5 font-medium">
              Talk to {assistantName}
            </span>
          </div>

          {/* Mic icon */}
          <Mic className="w-4 h-4 text-[#C4A760] shrink-0" />

          {/* Online green indicator badge */}
          <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full shadow-xs" />
        </button>
      </div>

      {/* Dillo Interactive Modal */}
      <DilloModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialVoiceStart={initialVoice}
      />
    </>
  );
};
