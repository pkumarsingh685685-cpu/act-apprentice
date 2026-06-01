import React, { useState } from 'react';
import { AlertTriangle, PlayCircle, X, Maximize } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';

export function WarningBox({ className }: { className?: string }) {
  const warningConfig = useStore((state) => state.warningConfig);
  const videoConfig = useStore((state) => state.videoConfig);
  const { t } = useTranslation();
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!warningConfig?.enabled || !warningConfig?.text) return null;

  const hasVideo = videoConfig?.enabled && videoConfig?.url;

  return (
    <>
      <div className={`bg-red-50 border-l-4 border-red-600 p-4 rounded-r-lg shadow-sm w-full animate-pulse-slow ${className || ''}`}>
        <style>{`
          @keyframes pulse-border {
            0%, 100% { border-color: rgb(220 38 38); background-color: rgb(254 242 242); }
            50% { border-color: rgb(185 28 28); background-color: rgb(254 226 226); }
          }
          .animate-pulse-slow {
            animation: pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}</style>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-800 text-lg mb-1 tracking-wider uppercase">{t('warning_title')}</h3>
              <p className="text-red-700 font-medium text-sm md:text-base leading-relaxed">
                {warningConfig.text}
              </p>
            </div>
          </div>
          
          {hasVideo && (
            <div className="shrink-0 flex flex-col items-center justify-center border-l border-red-200 pl-4">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex flex-col items-center justify-center p-2 text-red-700 hover:text-red-900 transition-colors group"
                title="Watch Warning Video"
              >
                <div className="relative">
                  <PlayCircle className="w-8 h-8 mb-1 group-hover:scale-110 transition-transform" />
                  <div className="absolute -bottom-1 -right-1 bg-red-100 rounded-full p-0.5">
                    <Maximize className="w-3 h-3 text-red-800" />
                  </div>
                </div>
                <span className="text-xs font-bold whitespace-nowrap">Play Info</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {hasVideo && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12">
          {/* Blurred overlay background */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          {/* Modal content */}
          <div className="relative w-full max-w-4xl bg-black rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 bg-slate-900 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="text-white font-bold tracking-wide">Important Information</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="w-full aspect-video bg-black relative flex items-center justify-center">
              <video 
                src={videoConfig.url} 
                controls 
                autoPlay
                className="w-full h-full object-contain"
                disablePictureInPicture
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
