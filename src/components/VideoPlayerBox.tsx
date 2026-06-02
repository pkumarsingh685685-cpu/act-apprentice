import React from 'react';
import { PlayCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

export function VideoPlayerBox({ className }: { className?: string }) {
  const videoConfig = useStore((state) => state.videoConfig);

  if (!videoConfig?.enabled || !videoConfig?.url) return null;

  return (
      <div className={`bg-slate-50 border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col w-full ${className || ''}`}>
      <div className="bg-slate-800 p-1.5 flex items-center gap-1.5 justify-center shrink-0">
        <PlayCircle className="w-4 h-4 text-white" />
        <h2 className="text-white font-semibold tracking-wide text-center text-xs">Information Video</h2>
      </div>
      <div className="relative w-full overflow-hidden bg-black flex flex-col flex-1 min-h-[60px]">
        <video 
          src={videoConfig.url} 
          controls 
          className="w-full h-full object-cover"
          preload="metadata"
        />
      </div>
    </div>
  );
}
