import React from "react";
import { Cloud, CheckCircle, RotateCcw, Loader2, Save } from "lucide-react";
import { DraftStatus } from "../hooks/useAutoSaveDraft";

interface DraftIndicatorProps {
  status: DraftStatus;
  onManualSave: () => void;
  onClear: () => void;
  sfName: string;
}

export function DraftIndicator({ status, onManualSave, onClear, sfName }: DraftIndicatorProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md mb-4 mt-1 font-sans">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${status.isSaving ? "bg-amber-950/40 text-amber-400" : "bg-indigo-950/40 text-indigo-400"}`}>
          {status.isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Cloud className="w-4 h-4 animate-pulse" />
          )}
        </div>
        <div>
          <h4 className="text-xs font-extrabold text-slate-100 uppercase tracking-widest flex items-center gap-1.5 leading-none">
            {sfName} Console Draft Mode
            {status.isSaving && (
              <span className="text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-black lowercase animate-pulse">
                saving...
              </span>
            )}
          </h4>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            {status.lastSavedCloud ? (
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3" /> Auto-saved: {status.lastSavedCloud} (Local & Cloud backup)
              </span>
            ) : status.lastSavedLocal ? (
              <span>Auto-saved Locally: {status.lastSavedLocal}</span>
            ) : (
              <span>Begin typing to activate real-time auto-saving (5s cycle)</span>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-center">
        <button
          type="button"
          onClick={onManualSave}
          className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg border border-indigo-500 font-bold uppercase tracking-widest flex items-center gap-1.5 shadow transition-all cursor-pointer"
          title="Backup draft immediately"
        >
          <Save className="w-3.5 h-3.5" />
          Backup Cloud
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm(`Are you sure you want to clear this draft and restart the ${sfName} form?`)) {
              onClear();
            }
          }}
          className="bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-350 hover:text-white text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 font-semibold uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer"
          title="Reset this form"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restart Form
        </button>
      </div>
    </div>
  );
}
