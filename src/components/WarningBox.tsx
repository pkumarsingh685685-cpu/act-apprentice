import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useStore } from '../store/useStore';

export function WarningBox({ className }: { className?: string }) {
  const warningConfig = useStore((state) => state.warningConfig);

  if (!warningConfig?.enabled || !warningConfig?.text) return null;

  return (
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
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-red-800 text-lg mb-1 tracking-wider uppercase">WARNING</h3>
          <p className="text-red-700 font-medium text-sm md:text-base leading-relaxed">
            {warningConfig.text}
          </p>
        </div>
      </div>
    </div>
  );
}
