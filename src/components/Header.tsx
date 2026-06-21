import { useState } from 'react';
import { Globe, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { PlaceholderImage } from './PlaceholderImage';
import { HeaderConfig, SiteLogos } from '../types';

export function Header({ 
  previewConfig, 
  previewLogos, 
  isHome: propIsHome 
}: { 
  previewConfig?: HeaderConfig; 
  previewLogos?: SiteLogos; 
  isHome?: boolean;
} = {}) {
  const config = useStore((state) => state.config) as any;
  const storeLogos = useStore((state) => state.logos);
  const storeHeaderConfig = useStore((state) => state.headerConfig);
  const audioAnnouncement = useStore((state) => state.audioAnnouncement);
  const { t, i18n } = useTranslation();

  let isHome = propIsHome;
  if (isHome === undefined) {
    try {
      const location = useLocation();
      isHome = location.pathname === "/";
    } catch {
      isHome = false;
    }
  }

  const [zoomLevel, setZoomLevel] = useState(100);

  const handleZoomIn = () => {
    if (zoomLevel < 120) {
      const newZoom = zoomLevel + 10;
      setZoomLevel(newZoom);
      document.documentElement.style.fontSize = `${newZoom}%`;
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 80) {
      const newZoom = zoomLevel - 10;
      setZoomLevel(newZoom);
      document.documentElement.style.fontSize = `${newZoom}%`;
    }
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
    document.documentElement.style.fontSize = '100%';
  };

  const currentLang = i18n.language?.split('-')[0] || 'en';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('i18nextLng', nextLang);
  };

  const logos = (previewLogos || storeLogos) as any;
  const headerText = (previewConfig || storeHeaderConfig) as any;

  const sanitizeHeaderEnglishText = (text: string) => {
    if (!text) return "";
    return text
      .replace(/northeast\s+fronti[er|re|r]*\s+railw[ay|ya|y]*/i, "")
      .replace(/north\s+fronti[er|re|r]*\s+railw[ay|ya|y]*/i, "")
      .trim();
  };

  return (
    <header className="w-full bg-white">
      {/* Top Government Strip */}
      <div className="bg-gradient-to-r from-[#162a45] via-[#244673] to-[#162a45] text-[white] py-2.5 border-b-[2px] border-[#cda052]/45 shadow-[0_2px_10px_rgba(0,0,0,0.15)]">
        <div className="w-full mx-auto px-4 sm:px-8 xl:px-16 2xl:px-24 flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm font-medium gap-2 text-center">
          <div className="flex flex-wrap gap-2 sm:gap-4 items-center justify-center">
            {logos?.govLogo?.enabled && (
              logos.govLogo.image ? (
                <div className="h-6 flex items-center justify-center shrink-0">
                  <img 
                    src={logos.govLogo.image} 
                    alt="Gov Logo" 
                    className="w-auto object-contain" 
                    style={{ 
                      height: logos.govLogo.customHeight ? `${logos.govLogo.customHeight}px` : '1rem',
                      maxHeight: '100%',
                      maxWidth: '100%'
                    }} 
                  />
                </div>
              ) : (
                <PlaceholderImage text="Gov Logo" className="h-4 w-12 !bg-transparent text-gray-300 border-none" />
              )
            )}
            <span className="leading-tight font-sans">अपरेंटिस प्रबंधन पोर्टल / Apprentice Management Portal</span>
            <span className="hidden sm:inline text-slate-400">|</span>
            {logos?.ministryLogo?.enabled && (
              logos.ministryLogo.image ? (
                <div className="h-6 flex items-center justify-center shrink-0 hidden sm:flex">
                  <img 
                    src={logos.ministryLogo.image} 
                    alt="Ministry Logo" 
                    className="w-auto object-contain" 
                    style={{ 
                      height: logos.ministryLogo.customHeight ? `${logos.ministryLogo.customHeight}px` : '1rem',
                      maxHeight: '100%',
                      maxWidth: '100%'
                    }} 
                  />
                </div>
              ) : (
                <PlaceholderImage text="Min Logo" className="h-4 w-12 !bg-transparent text-gray-300 border-none hidden sm:inline-block" />
              )
            )}
            <span className="hidden sm:inline text-slate-300">कटिहार मंडल / Katihar Division</span>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-4 items-center justify-center mt-1 sm:mt-0">
            <span className="hidden sm:flex items-center gap-1">
              <Mail className="w-4 h-4" /> 
              Email: {config.email ? config.email.replace(/@/g, '[at]').replace(/\./g, '[dot]') : 'office[dot]rrbpnbe[at]railnet[dot]gov[dot]in'}
            </span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <div className="flex items-center text-xs sm:text-sm font-semibold rounded bg-white/10 overflow-hidden shadow-[0_0_0_1px_rgba(255,255,255,0.2)]">
              <button onClick={handleZoomOut} className="px-2 py-[1.5px] hover:bg-white/20 transition-colors border-r border-white/20" title={t('zoom_out')}>A-</button>
              <button onClick={handleZoomReset} className="px-2 py-[1.5px] hover:bg-white/20 transition-colors border-r border-white/20" title={t('zoom_normal')}>A</button>
              <button onClick={handleZoomIn} className="px-2 py-[1.5px] hover:bg-white/20 transition-colors" title={t('zoom_in')}>A+</button>
            </div>
            
            <button 
              onClick={() => {
                const nextLang = currentLang === 'en' ? 'hi' : 'en';
                i18n.changeLanguage(nextLang);
                localStorage.setItem('i18nextLng', nextLang);
              }}
              className="flex items-center gap-1 bg-[#e31837] text-white hover:bg-red-700 text-[10px] sm:text-xs font-bold leading-none rounded-lg border border-red-500 shadow-md transition-all duration-150 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 select-none ml-1 sm:ml-2 shrink-0 px-2 py-1"
              title={currentLang === 'en' ? 'Translate to Hindi / हिंदी में अनुवाद करें' : 'Switch Layout back to English'}
            >
              <Globe className="w-3.5 h-3.5 animate-pulse" />
              <span>{currentLang === 'en' ? 'हिंदी' : 'English'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header / Branding */}
      <div className={`w-full bg-[#dbebfc] border-t-2 border-[#b5915f] relative transition-all duration-300 ${isHome ? 'pb-[46px]' : 'pb-2 sm:pb-3'}`}>
        <div className={`w-full mx-auto px-4 sm:px-8 xl:px-16 2xl:px-24 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6 relative z-10 transition-all duration-300 ${isHome ? 'py-3 sm:py-5' : 'py-2 sm:py-2.5'}`}>
          
          {/* Left: Railway Logo and Title */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 max-w-full overflow-hidden">
            {logos?.railwayLogo?.enabled && (
               logos.railwayLogo.image ? (
                <div 
                  className={`flex items-center justify-center shrink-0 overflow-hidden ${
                    isHome 
                      ? 'w-20 h-20 sm:w-28 sm:h-28 md:w-[130px] md:h-[130px]' 
                      : 'w-12 h-12 sm:w-16 sm:h-16'
                  }`}
                >
                  <img 
                    src={logos.railwayLogo.image} 
                    alt="Railway Logo" 
                    className="object-contain mix-blend-multiply"
                    style={{ 
                      height: logos.railwayLogo.customHeight ? `${logos.railwayLogo.customHeight}px` : '100%', 
                      width: 'auto',
                      maxHeight: '100%',
                      maxWidth: '100%'
                    }}
                  />
                </div>
              ) : (
                <PlaceholderImage text="Logo" className={`shrink-0 transition-all duration-300 ${isHome ? 'w-20 h-20 sm:w-24 sm:h-24' : 'w-12 h-12 sm:w-16 sm:h-16'}`} />
              )
            )}
            
            <div className="flex flex-col items-center justify-center text-center">
              {headerText.mainTitleEnabled && (
                <div className={`border-b-[2.5px] border-[#2e3791] pb-0.5 inline-block transition-all duration-300 ${isHome ? 'mb-1.5' : 'mb-0.5'}`}>
                  <h1 className={`font-black text-[#2e3791] tracking-tight leading-none uppercase transition-all duration-300 ${isHome ? 'text-2xl sm:text-3xl md:text-4xl lg:text-[2.25rem]' : 'text-base sm:text-lg md:text-xl'}`} style={{ fontFamily: "Arial, sans-serif", WebkitTextStroke: isHome ? "0.5px #2e3791" : "0.2px #2e3791" }}>
                    {headerText.mainTitleText}
                  </h1>
                </div>
              )}
              
              <div className="flex flex-col items-center text-[#911d1d]">
                {headerText.railwayEnglishEnabled && sanitizeHeaderEnglishText(headerText.railwayEnglishText) && (
                  <h2 className={`font-bold tracking-wide uppercase leading-tight transition-all duration-300 ${isHome ? 'text-sm sm:text-base md:text-lg lg:text-xl' : 'text-[11px] sm:text-xs md:text-sm'}`} style={{ fontFamily: "Arial, sans-serif" }}>
                    {sanitizeHeaderEnglishText(headerText.railwayEnglishText)}
                  </h2>
                )}
                
                {headerText.divisionEnglishEnabled && sanitizeHeaderEnglishText(headerText.divisionEnglishText) && (
                  <h3 className={`font-bold tracking-wide uppercase leading-tight transition-all duration-300 ${isHome ? 'text-sm sm:text-base md:text-lg lg:text-xl' : 'text-[11px] sm:text-xs md:text-sm'}`} style={{ fontFamily: "Arial, sans-serif" }}>
                    {sanitizeHeaderEnglishText(headerText.divisionEnglishText)}
                  </h3>
                )}
              </div>
            </div>
          </div>

          {/* Center: Audio Player & Merit Prevail */}
          <div className="flex flex-col items-center justify-center shrink-0 w-full sm:w-auto mt-1 md:mt-0 relative">
            {isHome && audioAnnouncement?.enabled && audioAnnouncement?.audio && (
              <audio 
                controls 
                controlsList="nodownload noplaybackrate"
                className="h-[40px] md:h-[44px] w-[260px] md:w-[320px] mb-2 md:mb-3 shadow-sm rounded-full overflow-hidden"
                src={audioAnnouncement.audio}
              >
                Your browser does not support the audio element.
              </audio>
            )}
            
            {isHome && (
              <div 
                className="font-black text-[1.4rem] md:text-[2rem] tracking-widest uppercase text-center bg-gradient-to-b from-[#ffffff] via-[#d1d5db] to-[#6b7280] bg-clip-text text-transparent"
                style={{
                  fontFamily: "'Brush Script MT', 'Dancing Script', cursive",
                  WebkitTextStroke: "1px #1e3a8a",
                  filter: "drop-shadow(3px 3px 3px rgba(0,0,0,0.4))"
                }}
              >
                LET MERIT PREVAIL
              </div>
            )}
          </div>

          {/* Right: National Emblem */}
          {isHome && (
            <div className="hidden md:flex items-center shrink-0">
              {logos?.nationalEmblem?.enabled && (
                logos.nationalEmblem.image ? (
                  <div className="w-16 h-20 sm:w-20 sm:h-28 md:w-24 md:h-[120px] flex items-center justify-center shrink-0 overflow-hidden">
                    <img 
                      src={logos.nationalEmblem.image} 
                      alt="National Emblem" 
                      className="object-contain mix-blend-multiply"
                      style={{ 
                        height: logos.nationalEmblem.customHeight ? `${logos.nationalEmblem.customHeight}px` : '100%',
                        width: 'auto',
                        maxHeight: '100%',
                        maxWidth: '100%'
                      }}
                    />
                  </div>
                ) : (
                   <PlaceholderImage text="Emblem" className="w-16 h-20 shrink-0" />
                )
              )}
            </div>
          )}

        </div>

        {/* Track Area with Stations & Train */}
        {isHome && (
          <div className="absolute left-0 bottom-0 right-0 h-[46px] overflow-hidden flex items-end">
             {/* Stations in Background */}
             <div className="absolute top-[8px] left-[15%] flex items-end z-0 opacity-90">
                {/* Station structure transparent silhouette */}
                <div className="w-[100px] sm:w-[140px] h-[24px] bg-transparent relative flex flex-col justify-end pb-1">
                   {/* Board with focus light */}
                   <div className="absolute top-0 left-2 right-2 h-[14px] bg-red-600 rounded-sm flex items-center justify-center text-[7px] sm:text-[9px] text-white font-bold tracking-widest whitespace-nowrap px-1 shadow-[0_0_10px_2px_rgba(255,255,255,0.5)] z-10">
                      KATIHAR JN
                   </div>
                   {/* Pillars dark */}
                   <div className="absolute bottom-0 left-4 w-[2px] h-[14px] bg-[#111]"></div>
                   <div className="absolute bottom-0 right-4 w-[2px] h-[14px] bg-[#111]"></div>
                </div>
             </div>
             
             <div className="absolute top-[10px] right-[10%] flex items-end z-0 opacity-90">
                {/* Station structure transparent silhouette */}
                <div className="w-[120px] sm:w-[160px] h-[22px] bg-transparent relative flex flex-col justify-end pb-1">
                   {/* Board with focus light */}
                   <div className="absolute top-0 left-2 right-2 h-[14px] bg-[#2e3791] rounded-sm flex items-center justify-center text-[7px] sm:text-[9px] text-white font-bold tracking-widest whitespace-nowrap px-1 shadow-[0_0_10px_2px_rgba(255,255,255,0.5)] z-10">
                      NEW JALPAIGURI
                   </div>
                   {/* Pillars dark */}
                   <div className="absolute bottom-0 left-5 w-[2px] h-[12px] bg-[#111]"></div>
                   <div className="absolute bottom-0 right-5 w-[2px] h-[12px] bg-[#111]"></div>
                </div>
             </div>

             {/* Green Signals */}
             <div className="absolute bottom-[14px] left-[30%] w-[2px] h-[18px] bg-[#222] z-0 flex flex-col justify-start items-center">
                <div className="w-2.5 h-3.5 bg-black rounded-sm mt-[1px] flex flex-col items-center justify-center gap-[1px]">
                   <div className="w-[3px] h-[3px] bg-gray-600 rounded-full"></div>
                   <div className="w-[3px] h-[3px] bg-[#00ff00] rounded-full shadow-[0_0_6px_2px_#00ff00]"></div>
                </div>
             </div>
             
             <div className="absolute bottom-[14px] left-[70%] w-[2px] h-[18px] bg-[#222] z-0 flex flex-col justify-start items-center">
                <div className="w-2.5 h-3.5 bg-black rounded-sm mt-[1px] flex flex-col items-center justify-center gap-[1px]">
                   <div className="w-[3px] h-[3px] bg-gray-600 rounded-full"></div>
                   <div className="w-[3px] h-[3px] bg-[#00ff00] rounded-full shadow-[0_0_6px_2px_#00ff00]"></div>
                </div>
             </div>

             {/* Track Base */}
             <div className="absolute bottom-0 left-0 right-0 h-[14px] overflow-hidden flex items-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] border-t border-[#333] z-10 bg-[#4a4a4a]">
                {/* Stones/Ballast */}
                <div className="absolute inset-0 ballast-texture opacity-80"></div>
                
                {/* Sleepers */}
                <div className="absolute inset-x-0 top-[1px] bottom-[1px] train-track-texture opacity-90"></div>
                
                {/* Rails */}
                <div className="absolute inset-x-0 top-[3px] h-[2px] bg-gradient-to-b from-[#e0e0e0] to-[#888] shadow-[0_1px_1px_rgba(0,0,0,0.9)] z-10"></div>
                <div className="absolute inset-x-0 bottom-[3px] h-[2px] bg-gradient-to-b from-[#e0e0e0] to-[#888] shadow-[0_1px_1px_rgba(0,0,0,0.9)] z-10"></div>
             </div>

             {/* Train */}
             <div className="absolute bottom-[10px] flex items-end drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] z-20 left-0" style={{ animation: "moveTrain 15s linear infinite" }}>
                <div className="flex items-end">
                  {/* Rear Engine (Left) */}
                  <div className="w-16 sm:w-24 h-[22px] sm:h-[28px] bg-gradient-to-b from-[#f8f9fa] to-[#e5e7eb] relative shrink-0" 
                       style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%, 0 90%, 7% 40%)' }}>
                     {/* Base Dark Strip */}
                     <div className="absolute bottom-0 left-0 right-0 h-[4px] sm:h-[5px] bg-[#1f2937]"></div>
                     {/* Blue Strip */}
                     <div className="absolute bottom-[4px] sm:bottom-[5px] left-0 right-0 h-[2px] sm:h-[3px] bg-[#1e40af]"></div>
                     {/* Black Front/Rear Window Area */}
                     <div className="absolute top-[4px] sm:top-[5px] left-3 right-0 h-[7px] sm:h-[9px] bg-[#111827]" style={{ clipPath: 'polygon(8% 0, 100% 0, 100% 100%, 0 100%)' }}></div>
                     
                     {/* Doors / details */}
                     <div className="absolute top-[4px] bottom-[4px] right-[4px] w-[4px] sm:w-[6px] bg-[#d1d5db] border border-gray-400"></div>
                     <div className="absolute top-[6px] right-[5px] w-[2px] h-[5px] bg-[#111827]"></div>

                     {/* Wheels */}
                     <div className="absolute -bottom-[2px] left-[30%] w-1.5 h-1.5 bg-black rounded-full"></div>
                     <div className="absolute -bottom-[2px] right-[20%] w-1.5 h-1.5 bg-black rounded-full"></div>
                  </div>
                  
                  {/* Coaches */}
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-24 sm:w-32 h-[22px] sm:h-[28px] bg-gradient-to-b from-[#f8f9fa] to-[#e5e7eb] ml-[1px] relative shrink-0">
                       {/* Base Dark Strip */}
                       <div className="absolute bottom-0 left-0 right-0 h-[4px] sm:h-[5px] bg-[#1f2937]"></div>
                       {/* Window Strip */}
                       <div className="absolute top-[4px] sm:top-[5px] left-0 right-0 h-[7px] sm:h-[9px] bg-[#111827] flex justify-evenly items-center shadow-inner">
                          <div className="w-[1.5px] h-[80%] bg-[#4b5563] opacity-60"></div>
                          <div className="w-[1.5px] h-[80%] bg-[#4b5563] opacity-60"></div>
                          <div className="w-[1.5px] h-[80%] bg-[#4b5563] opacity-60"></div>
                          <div className="w-[1.5px] h-[80%] bg-[#4b5563] opacity-60"></div>
                       </div>
                       {/* Text */}
                       <div className="absolute top-[11px] sm:top-[14px] left-0 right-0 flex justify-center items-center pointer-events-none">
                          <span className="text-[#1a365d] font-extrabold text-[5px] sm:text-[6px] tracking-[0.2em] whitespace-nowrap opacity-100">
                            वंदे भारत - VANDE BHARAT
                          </span>
                       </div>
                       {/* Blue Strip */}
                       <div className="absolute bottom-[4px] sm:bottom-[5px] left-0 right-0 h-[2px] sm:h-[3px] bg-[#1e40af]"></div>
                       {/* Doors */}
                       <div className="absolute top-[4px] bottom-[4px] left-[2px] w-[4px] sm:w-[6px] bg-[#d1d5db] border border-gray-400"></div>
                       <div className="absolute top-[6px] left-[3px] w-[2px] h-[5px] bg-[#111827]"></div>
                       
                       <div className="absolute top-[4px] bottom-[4px] right-[2px] w-[4px] sm:w-[6px] bg-[#d1d5db] border border-gray-400"></div>
                       <div className="absolute top-[6px] right-[3px] w-[2px] h-[5px] bg-[#111827]"></div>

                       {/* Wheels */}
                       <div className="absolute -bottom-[2px] left-[20%] w-1.5 h-1.5 bg-black rounded-full"></div>
                       <div className="absolute -bottom-[2px] right-[20%] w-1.5 h-1.5 bg-black rounded-full"></div>
                    </div>
                  ))}
                
                  {/* Front Engine (Right) */}
                  <div className="w-16 sm:w-24 h-[22px] sm:h-[28px] bg-gradient-to-b from-[#f8f9fa] to-[#e5e7eb] ml-[1px] relative shrink-0"
                       style={{ clipPath: 'polygon(0 0, 80% 0, 93% 40%, 100% 90%, 100% 100%, 0 100%)' }}>
                     {/* Base Dark Strip */}
                     <div className="absolute bottom-0 left-0 right-0 h-[4px] sm:h-[5px] bg-[#1f2937]"></div>
                     {/* Blue Strip */}
                     <div className="absolute bottom-[4px] sm:bottom-[5px] left-0 right-0 h-[2px] sm:h-[3px] bg-[#1e40af]"></div>
                     
                     {/* Black Front Window Area */}
                     <div className="absolute top-[4px] sm:top-[5px] left-0 right-3 h-[7px] sm:h-[9px] bg-[#111827]" style={{ clipPath: 'polygon(0 0, 92% 0, 100% 100%, 0 100%)' }}></div>
                     
                     {/* Doors */}
                     <div className="absolute top-[4px] bottom-[4px] left-[4px] w-[4px] sm:w-[6px] bg-[#d1d5db] border border-gray-400"></div>
                     <div className="absolute top-[6px] left-[5px] w-[2px] h-[5px] bg-[#111827]"></div>

                     {/* Headlight */}
                     <div className="absolute bottom-1 right-0.5 w-1.5 h-1.5 bg-gray-300 rounded-full z-10"></div>

                     {/* Wheels */}
                     <div className="absolute -bottom-[2px] left-[20%] w-1.5 h-1.5 bg-black rounded-full"></div>
                     <div className="absolute -bottom-[2px] right-[30%] w-1.5 h-1.5 bg-black rounded-full"></div>
                  </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </header>
  );
}
