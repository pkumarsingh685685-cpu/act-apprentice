import React, { useState } from "react";
import { Sliders, Award, Image, ShieldAlert, Check, Upload, Trash2 } from "lucide-react";

export interface PrintSettings {
  watermark: "none" | "CONFIDENTIAL" | "OFFICIAL_USE" | "DRAFT";
  seal: "none" | "text" | "upload";
  customSealText: string;
  sealImageData: string | null;
  signature: "none" | "cursive" | "upload";
  sigCursiveText: string;
  sigImageData: string | null;
  sigScale?: number;
  sigXOffset?: number;
  sigYOffset?: number;
}

interface PrintCustomizerProps {
  settings: PrintSettings;
  onChange: (updated: PrintSettings) => void;
}

export function PrintCustomizer({ settings, onChange }: PrintCustomizerProps) {
  const [showConfig, setShowConfig] = useState(false);

  const updateSetting = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => {
    onChange({
      ...settings,
      [key]: value
    });
  };

  const handleSigImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          updateSetting("sigImageData", event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSealImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          updateSetting("sealImageData", event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getWatermarkLabel = (type: string) => {
    switch (type) {
      case "CONFIDENTIAL": return "CONFIDENTIAL";
      case "OFFICIAL_USE": return "OFFICIAL USE ONLY";
      case "DRAFT": return "DRAFT ONLY";
      default: return "No Watermark";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-4 font-sans">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-widest hover:text-indigo-800 transition-colors cursor-pointer"
        >
          <Sliders className="w-4 h-4 shrink-0" />
          <span>Configure Print settings (Watermarks, Seals, Signatures)</span>
        </button>
        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
          Active Customizer
        </span>
      </div>

      {showConfig && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 pt-4 border-t border-gray-100 animate-fadeIn">
          
          {/* Section 1: Watermarks */}
          <div className="space-y-3">
            <h5 className="text-[11px] font-black text-gray-800 uppercase tracking-wider flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              Document Watermark
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(["none", "CONFIDENTIAL", "OFFICIAL_USE", "DRAFT"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateSetting("watermark", type)}
                  className={`px-2.5 py-1.5 text-[10px] rounded-lg border font-bold uppercase text-left transition-all cursor-pointer flex items-center justify-between ${
                    settings.watermark === type
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="whitespace-normal break-words pr-1 leading-snug">{getWatermarkLabel(type)}</span>
                  {settings.watermark === type && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
                </button>
              ))}
            </div>
            {settings.watermark !== "none" && (
              <p className="text-[9px] text-amber-600 font-extrabold uppercase bg-amber-50 rounded p-1.5 leading-tight">
                ⚠️ watermark will print as diagonal low-opacity text: "{getWatermarkLabel(settings.watermark)}"
              </p>
            )}
          </div>

          {/* Section 2: Official Seals */}
          <div className="space-y-3">
            <h5 className="text-[11px] font-black text-gray-800 uppercase tracking-wider flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-blue-500" />
              Official Stamp / Seal
            </h5>
            <div className="grid grid-cols-1 gap-1.5">
              {[
                { k: "none", val: "No stamp" },
                { k: "text", val: "Custom Text" },
                { k: "upload", val: "Upload BMP/PNG" }
              ].map((item) => (
                <button
                  key={item.k}
                  type="button"
                  onClick={() => updateSetting("seal", item.k as any)}
                  className={`px-2 py-1.5 text-[10px] rounded-lg border font-bold uppercase text-left tracking-tight transition-all cursor-pointer flex items-center justify-between ${
                    settings.seal === item.k
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="whitespace-normal break-words pr-1 leading-snug">{item.val}</span>
                  {settings.seal === item.k && <Check className="w-2.5 h-2.5 text-indigo-600 shrink-0" />}
                </button>
              ))}
            </div>

            {settings.seal === "text" && (
              <input
                type="text"
                placeholder="Seal custom text..."
                value={settings.customSealText}
                onChange={(e) => updateSetting("customSealText", e.target.value)}
                className="w-full text-[10px] px-2 py-1 rounded border border-gray-300 focus:ring-1 focus:ring-indigo-500 bg-white"
              />
            )}

            {settings.seal === "upload" && (
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[9px] font-extrabold text-slate-500 uppercase bg-slate-50 border border-slate-200 py-1 px-2 rounded cursor-pointer hover:bg-slate-100 transition-colors">
                  <Upload className="w-3 h-3" />
                  <span>Choose Image File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSealImageUpload}
                    className="hidden"
                  />
                </label>
                {settings.sealImageData && (
                  <div className="flex items-center justify-between text-[9px] bg-emerald-50 border border-emerald-100 p-1 rounded">
                    <span className="text-emerald-700 font-semibold truncate max-w-[120px]">Image Loaded</span>
                    <button
                      type="button"
                      onClick={() => updateSetting("sealImageData", null)}
                      className="text-rose-600 hover:text-rose-800"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Digital Signatures */}
          <div className="space-y-3">
            <h5 className="text-[11px] font-black text-gray-800 uppercase tracking-wider flex items-center gap-1">
              <Image className="w-3.5 h-3.5 text-emerald-500" />
              Digital Signature
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
              {[
                { k: "none", val: "Blank" },
                { k: "cursive", val: "Cursive" },
                { k: "upload", val: "PNG Sign" }
              ].map((item) => (
                <button
                  key={item.k}
                  type="button"
                  onClick={() => updateSetting("signature", item.k as any)}
                  className={`px-1.5 rounded-lg py-1.5 border text-[9px] font-bold uppercase text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    settings.signature === item.k
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <span className="whitespace-normal break-words">{item.val}</span>
                  {settings.signature === item.k && <Check className="w-2.5 h-2.5 text-indigo-600 shrink-0" />}
                </button>
              ))}
            </div>

            {settings.signature === "cursive" && (
              <input
                type="text"
                placeholder="Enter officer cursive name..."
                value={settings.sigCursiveText}
                onChange={(e) => updateSetting("sigCursiveText", e.target.value)}
                className="w-full text-[10px] px-2 py-1 rounded border border-gray-300 focus:ring-1 focus:ring-indigo-500 bg-white"
              />
            )}

            {settings.signature === "upload" && (
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[9px] font-extrabold text-slate-500 uppercase bg-slate-50 border border-slate-200 py-1 px-2 rounded cursor-pointer hover:bg-slate-100 transition-colors">
                  <Upload className="w-3 h-3" />
                  <span>Choose Transparent JPG/PNG</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSigImageUpload}
                    className="hidden"
                  />
                </label>
                {settings.sigImageData && (
                  <div className="flex items-center justify-between text-[9px] bg-emerald-50 border border-emerald-100 p-1 rounded">
                    <span className="text-emerald-700 font-semibold truncate max-w-[120px]">Signature Loaded</span>
                    <button
                      type="button"
                      onClick={() => updateSetting("sigImageData", null)}
                      className="text-rose-600 hover:text-rose-800"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Signature Fine Adjustment Controls */}
            {settings.signature !== "none" && (
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 mt-2 space-y-2.5 animate-fadeIn">
                <div className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">
                  Signature Position Adjustments
                </div>
                
                {/* Scale Slider */}
                <div>
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-600 mb-0.5">
                    <span>Scale / Size:</span>
                    <span className="font-mono text-indigo-600 font-black">{settings.sigScale ?? 100}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="200"
                    value={settings.sigScale ?? 100}
                    onChange={(e) => updateSetting("sigScale", Number(e.target.value))}
                    className="w-full accent-indigo-650 h-1 bg-gray-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* X Offset Slider */}
                <div>
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-600 mb-0.5">
                    <span>Horizontal Offset:</span>
                    <span className="font-mono text-indigo-600 font-black">{settings.sigXOffset ?? 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    value={settings.sigXOffset ?? 0}
                    onChange={(e) => updateSetting("sigXOffset", Number(e.target.value))}
                    className="w-full accent-indigo-650 h-1 bg-gray-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Y Offset Slider */}
                <div>
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-600 mb-0.5">
                    <span>Vertical Position (Y):</span>
                    <span className="font-mono text-indigo-600 font-black">{settings.sigYOffset ?? 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="-120"
                    max="120"
                    value={settings.sigYOffset ?? 0}
                    onChange={(e) => updateSetting("sigYOffset", Number(e.target.value))}
                    className="w-full accent-indigo-650 h-1 bg-gray-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// Inline printer helper that takes print variables and appends styling elements dynamically to standard forms
export function RenderPrintOverlayWatermark({ watermark }: { watermark: string }) {
  if (!watermark || watermark === "none") return null;
  const text = watermark === "CONFIDENTIAL" 
    ? "CONFIDENTIAL" 
    : watermark === "OFFICIAL_USE" 
    ? "OFFICIAL USE ONLY" 
    : "DRAFT ONLY";

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center opacity-[0.04] select-none select-none">
      <div className="text-6xl md:text-8xl font-black tracking-widest text-[#001A4D] uppercase font-sans rotate-[-35deg]" style={{ wordSpacing: "0.25em" }}>
        {text}
      </div>
    </div>
  );
}

export function RenderPrintOverlaySeal({ seal, customSealText, sealImageData }: { seal: string, customSealText: string, sealImageData: string | null }) {
  if (seal === "none") return null;

  if (seal === "upload" && sealImageData) {
    return (
      <div className="w-24 h-24 my-1 opacity-80 border border-indigo-400 p-1 rounded-full flex items-center justify-center overflow-hidden shrink-0 inline-block">
        <img src={sealImageData} alt="Seal logo" className="w-full h-full object-contain" />
      </div>
    );
  }

  const sealTitle = customSealText || "OFFICIAL SEAL";
  const sealSubtitle = "Northeast Frontier Railway";

  return (
    <div className="w-24 h-24 rounded-full border-4 border-dashed border-indigo-800/80 p-1 flex flex-col justify-center items-center text-center opacity-85 shrink-0 inline-block bg-white text-indigo-900 select-none shadow-sm mt-2 relative">
      <div className="w-20 h-20 rounded-full border border-indigo-800/60 flex flex-col justify-center items-center p-0.5">
        <span className="text-[6px] font-black tracking-tight leading-none uppercase text-indigo-900 break-words max-w-[65px]">{sealTitle}</span>
        <div className="w-4 h-[1px] bg-indigo-800 my-0.5"></div>
        <span className="text-[5px] font-extrabold tracking-wide uppercase text-indigo-800/80 leading-none truncate max-w-[65px]">{sealSubtitle}</span>
      </div>
    </div>
  );
}

export function RenderPrintOverlaySignature({ 
  signature, 
  sigCursiveText, 
  sigImageData, 
  defaultName,
  scale = 100,
  xOffset = 0,
  yOffset = 0
}: { 
  signature: string, 
  sigCursiveText: string, 
  sigImageData: string | null, 
  defaultName: string,
  scale?: number,
  xOffset?: number,
  yOffset?: number
}) {
  if (signature === "none") return null;

  const style = {
    transform: `translate(${xOffset}px, ${yOffset}px) scale(${scale / 100})`,
    transformOrigin: "center center",
    transition: "transform 0.05s ease-out",
    display: "inline-block"
  };

  if (signature === "upload" && sigImageData) {
    return (
      <div className="min-h-[45px] flex items-center justify-center pointer-events-none mt-1">
        <img 
          src={sigImageData} 
          alt="Signature Upload" 
          style={style}
          className="h-11 max-w-[150px] object-contain mix-blend-multiply" 
        />
      </div>
    );
  }

  if (signature === "cursive") {
    return (
      <div 
        className="min-h-[35px] mt-2 italic text-lg text-indigo-900/90 font-semibold tracking-wide flex items-center justify-center filter drop-shadow-sm leading-none" 
        style={{ fontFamily: "'Playfair Display', Georgia, serif", ...style }}
      >
        {sigCursiveText || defaultName || "Authorized Sign"}
      </div>
    );
  }

  return null;
}
