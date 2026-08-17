import React, { useState, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

export function FloatingZoomControl() {
  const [zoom, setZoom] = useState(() => {
    const saved = localStorage.getItem("site-zoom-level");
    return saved ? parseInt(saved, 10) : 100;
  });

  useEffect(() => {
    // Save in storage
    localStorage.setItem("site-zoom-level", zoom.toString());
    
    // Apply zoom on document body
    const body = document.body;
    if (body) {
      (body.style as any).zoom = `${zoom}%`;
    }
  }, [zoom]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 150));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 70));
  };

  const handleReset = () => {
    setZoom(100);
  };

  return (
    <div className="fixed bottom-6 left-6 z-[9999] flex items-center gap-1.5 bg-white/95 backdrop-blur-md border border-slate-250 shadow-xl rounded-full px-3 py-1.5 hover:shadow-2xl hover:bg-white transition-all select-none print:hidden">
      <div className="flex items-center gap-0.5">
        <button
          onClick={handleZoomOut}
          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          title="Zoom Out / छोटा करें"
          id="zoomOutBtn"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        
        <span className="text-[11px] font-extrabold text-slate-700 min-w-[36px] text-center font-mono">
          {zoom}%
        </span>

        <button
          onClick={handleZoomIn}
          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          title="Zoom In / बड़ा करें"
          id="zoomInBtn"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="w-[1px] h-3.5 bg-slate-200 mx-0.5"></div>

      <button
        onClick={handleReset}
        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        title="Reset to 100% / सामान्य करें"
        id="zoomResetBtn"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
