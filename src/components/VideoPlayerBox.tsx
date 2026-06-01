import React from 'react';
import { PlayCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

export function VideoPlayerBox() {
  const videoConfig = useStore((state) => state.videoConfig);

  if (!videoConfig?.enabled || !videoConfig?.url) return null;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col w-full h-full">
      <div className="bg-slate-800 p-3 flex items-center gap-2">
        <PlayCircle className="w-5 h-5 text-white" />
        <h2 className="text-white font-semibold flex-1 tracking-wide">Information Video</h2>
      </div>
      <div className="relative w-full overflow-hidden bg-black flex-1 min-h-[250px]">
        <video 
          src={videoConfig.url} 
          controls 
          className="absolute top-0 left-0 w-full h-full object-contain"
          preload="metadata"
        />
      </div>
    </div>
  );
}
