import { useStore } from '../store/useStore';
import { PlaceholderImage } from './PlaceholderImage';
import { HeaderConfig, SiteLogos } from '../types';

export function Header({ previewConfig, previewLogos }: { previewConfig?: HeaderConfig, previewLogos?: SiteLogos } = {}) {
  const config = useStore((state) => state.config);
  const storeLogos = useStore((state) => state.logos);
  const storeHeaderConfig = useStore((state) => state.headerConfig);
  const audioAnnouncement = useStore((state) => state.audioAnnouncement);

  const logos = previewLogos || storeLogos;
  const headerText = previewConfig || storeHeaderConfig;

  return (
    <header className="w-full bg-white">
      {/* Top Government Strip */}
      <div className="bg-[#1c3f60] text-white py-1">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center text-xs sm:text-sm">
          <div className="flex gap-4 items-center">
            {logos.govLogo.enabled && (
              logos.govLogo.image ? (
                <img src={logos.govLogo.image} alt="Gov Logo" className="h-4 w-auto object-contain" />
              ) : (
                <PlaceholderImage text="Gov Logo" className="h-4 w-12 !bg-transparent text-gray-300 border-none" />
              )
            )}
            <span>भारत सरकार / Government of India</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">रेल मंत्रालय / Ministry of Railways</span>
          </div>
          <div className="flex gap-4 mt-1 sm:mt-0">
            <span>Helpline: {config.helpline}</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">{config.email}</span>
          </div>
        </div>
      </div>

      {/* Main Header / Branding */}
      <div className="w-full bg-[#dbebfc] border-t-2 border-[#b5915f] border-b-[12px] border-[#152060]">
        <div className="max-w-[1400px] mx-auto px-4 py-3 sm:py-5 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Left: Railway Logo and Title */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 max-w-full overflow-hidden">
            {logos.railwayLogo.enabled && (
              logos.railwayLogo.image ? (
                <img 
                  src={logos.railwayLogo.image} 
                  alt="Railway Logo" 
                  className="w-16 h-16 sm:w-24 sm:h-24 md:w-[110px] md:h-[110px] object-contain mix-blend-multiply"
                />
              ) : (
                <PlaceholderImage text="Logo" className="w-16 h-16 sm:w-20 sm:h-20 shrink-0" />
              )
            )}
            
            <div className="flex flex-col items-center justify-center text-center">
              {headerText.mainTitleEnabled && (
                <div className="border-b-[2.5px] border-[#2e3791] pb-0.5 mb-1.5 inline-block">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[2.2rem] font-black text-[#2e3791] tracking-tight leading-none" style={{ fontFamily: "Arial, sans-serif", WebkitTextStroke: "0.5px #2e3791" }}>
                    {headerText.mainTitleText}
                  </h1>
                </div>
              )}
              
              <div className="flex flex-col items-center text-[#911d1d]">
                {(headerText.railwayHindiEnabled || headerText.railwayEnglishEnabled) && (
                  <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold tracking-wide uppercase leading-tight" style={{ fontFamily: "Arial, sans-serif" }}>
                    {[
                      headerText.railwayHindiEnabled ? headerText.railwayHindiText : '',
                      headerText.railwayEnglishEnabled ? headerText.railwayEnglishText : ''
                    ].filter(Boolean).join(' / ')}
                  </h2>
                )}
                
                {(headerText.divisionHindiEnabled || headerText.divisionEnglishEnabled) && (
                  <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold tracking-wide uppercase leading-tight" style={{ fontFamily: "Arial, sans-serif" }}>
                    {[
                      headerText.divisionHindiEnabled ? headerText.divisionHindiText : '',
                      headerText.divisionEnglishEnabled ? headerText.divisionEnglishText : ''
                    ].filter(Boolean).join(' / ')}
                  </h3>
                )}
              </div>
            </div>
          </div>

          {/* Center: Audio Player & Merit Prevail */}
          <div className="flex flex-col items-center justify-center shrink-0 w-full sm:w-auto mt-2 md:mt-0 relative">
            {audioAnnouncement.enabled && audioAnnouncement.audio && (
              <audio 
                controls 
                controlsList="nodownload noplaybackrate"
                className="h-[40px] md:h-[44px] w-[260px] md:w-[320px] mb-2 md:mb-3 shadow-sm rounded-full overflow-hidden"
                src={audioAnnouncement.audio}
              >
                Your browser does not support the audio element.
              </audio>
            )}
            
            <div 
              className="text-[#64b525] font-extrabold text-lg md:text-xl tracking-wider drop-shadow-sm uppercase text-center"
              style={{
                fontFamily: "Georgia, serif",
                textShadow: "1px 1px 0px white, -1px -1px 0px white, 1px -1px 0px white, -1px 1px 0px white"
              }}
            >
              LET MERIT PREVAIL
            </div>
          </div>

          {/* Right: National Emblem */}
          <div className="hidden md:flex items-center shrink-0">
            {logos.nationalEmblem.enabled && (
              logos.nationalEmblem.image ? (
                <img 
                  src={logos.nationalEmblem.image} 
                  alt="National Emblem" 
                  className="w-16 h-20 sm:w-20 sm:h-28 md:w-24 md:h-[120px] object-contain mix-blend-multiply"
                />
              ) : (
                 <PlaceholderImage text="Emblem" className="w-16 h-20 shrink-0" />
              )
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
