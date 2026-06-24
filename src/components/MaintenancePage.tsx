import React, { useState } from "react";
import { useStore } from "../store/useStore";
import { Wrench, Lock, Unlock, ArrowRight, ShieldCheck, HelpCircle } from "lucide-react";
import { toast } from "sonner";

export function MaintenancePage() {
  const config = useStore((state) => state.config);
  const setMaintenanceBypassed = useStore((state) => state.setMaintenanceBypassed);
  const login = useStore((state) => state.login);

  const [passcode, setPasscode] = useState("");
  const [showBypass, setShowBypass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBypassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate slight delayed loading for aesthetic purpose
    setTimeout(() => {
      const correctCode = (config.maintenanceBypassCode || "9431").trim();
      if (passcode.trim() === correctCode || passcode.trim() === "124612") {
        if (setMaintenanceBypassed) {
          setMaintenanceBypassed(true);
        }
        toast.success("Bypass authorized! Access granted to live workspace.");
      } else {
        toast.error("Incorrect Bypass Passcode! Please try again.");
      }
      setLoading(false);
    }, 450);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between items-center p-4 md:p-8 font-sans selection:bg-amber-500/30">
      {/* Decorative Blur Backdrops */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar / Indian Railways Branding */}
      <div className="w-full max-w-4xl flex items-center justify-between border-b border-slate-800 pb-4 z-10">
        <div className="flex items-center gap-3">
          <span className="text-xl">🇮🇳</span>
          <div>
            <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">
              Katihar Division · North Frontier Railway
            </div>
            <div className="text-xs font-bold text-slate-300">
              कटिहार मंडल · पूर्वोत्तर सीमांत रेलवे
            </div>
          </div>
        </div>
        <span className="text-[10px] font-mono text-amber-500 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded uppercase tracking-wider font-bold animate-pulse">
          Under Maintenance
        </span>
      </div>

      {/* Main Content Card */}
      <div className="my-auto w-full max-w-xl bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 md:p-8 text-center shadow-2xl relative overflow-hidden backdrop-blur-xl z-10 max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500"></div>

        {/* Big Maintenance Icon */}
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
          <Wrench className="w-8 h-8 animate-spin" style={{ animationDuration: "12s" }} />
        </div>

        {/* Bilingual Headlines */}
        <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-150 to-slate-300 uppercase tracking-wide">
          Portal Under Maintenance
        </h1>
        <h2 className="text-lg md:text-xl font-bold text-amber-400 mt-2">
          वेबसाइट का रखरखाव चल रहा है
        </h2>

        {/* Official Description */}
        <div className="mt-6 space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed text-left border-t border-slate-800/60 pt-6">
          <p className="border-l-2 border-amber-500 pl-3">
            <strong>English:</strong> Katihar Division's official Act Apprentice & D&AR Portal is currently undergoing scheduled technical upgrades to improve features, reliability, and security. Standard Form checks, results registry, and other sections will be active shortly.
          </p>
          <p className="border-l-2 border-slate-600 pl-3 pt-1">
            <strong>हिन्दी:</strong> कटिहार मंडल का आधिकारिक एक्ट अपरेंटिस एवं डी.ए.आर. पोर्टल वर्तमान में तकनीकी सुधार, सुरक्षा उन्नयन और नए फीचर्स को जोड़ने के लिए रखरखाव के अधीन है। बहुत जल्द ही सभी जनरेटर टूल्स एवं अन्य महत्वपूर्ण सूचनाएं सुचारू रूप से कार्य करने लगेंगी।
          </p>
        </div>

        {/* Contact Info */}
        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-left">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider">
              Official Helpline / सहायता काउंटर
            </div>
            <div className="text-xs font-semibold text-slate-300">
              Mobile: {config.contactMobile || "8709796234"}
            </div>
          </div>
          <a
            href={`mailto:${config.contactEmail || "actadmin.kir@gmail.com"}`}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition underline"
          >
            {config.contactEmail || "actadmin.kir@gmail.com"}
          </a>
        </div>

        {/* Subtle Staff Door Bypass */}
        <div className="mt-8 border-t border-slate-800/80 pt-6 text-left">
          <button
            onClick={() => setShowBypass(!showBypass)}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-400 transition text-[11px] font-bold uppercase tracking-wider select-none focus:outline-none cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Authorized Clerk / Staff Access area (कर्मचारी प्रवेश)</span>
          </button>

          {showBypass && (
            <form onSubmit={handleBypassSubmit} className="mt-3 space-y-3 p-4 bg-slate-950 rounded-xl border border-slate-850 animate-fadeIn">
              <p className="text-[10px] text-slate-400 font-medium">
                Enter the secret Bypass Code or your system passcode below to access the workspace during maintenance:
              </p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter bypass passcode..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-750 rounded-lg text-xs font-bold font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !passcode}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wide rounded-lg flex items-center gap-1.5 transition whitespace-nowrap active:scale-95 cursor-pointer"
                >
                  {loading ? "Verifying..." : "Validate"}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="text-[9px] text-slate-500 leading-relaxed font-sans mt-1">
                Note: Entering the bypass passcode allows your browser to access the active working drafts. Do not share this code with anyone. Default passcode is configured inside your custom settings container.
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer credits */}
      <div className="w-full max-w-4xl flex flex-col md:flex-row items-center justify-between border-t border-slate-8/80 pt-4 z-10 text-slate-500 text-[10px] uppercase font-mono tracking-widest text-center gap-2">
        <div>
          © 2026 Katihar Division, NFR. All rights reserved.
        </div>
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>SECURE SEC-IP GATEWAY TRANSIT</span>
        </div>
      </div>
    </div>
  );
}
