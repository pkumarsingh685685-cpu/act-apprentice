import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "../store/useStore";
import { DocumentPanel } from "../components/DocumentPanel";
import { FileText, Award, Bell, ExternalLink, X, User, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { PlaceholderImage } from "../components/PlaceholderImage";

import { HeroSlider } from "../components/HeroSlider";
import { VideoPlayerBox } from "../components/VideoPlayerBox";

function NoticeBoardImage({ className }: { className?: string }) {
  const noticeImage = useStore((state) => state.noticeImage);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!noticeImage?.enabled) return null;

  return (
    <>
      <style>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div className={`w-full h-full rounded-lg shadow-sm bg-white group relative overflow-hidden flex flex-col min-h-[60px] border border-gray-200 ${className || ""}`}>
        <div className="relative z-10 bg-white w-full h-full rounded-md overflow-hidden flex flex-col flex-1">
          {noticeImage.image ? (
            <div
              onClick={() => setIsModalOpen(true)}
              className="relative w-full h-full bg-black overflow-hidden text-center flex flex-col items-center justify-center cursor-pointer block flex-1"
            >
              <img
                src={noticeImage.image}
                alt={noticeImage.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {(noticeImage.title || noticeImage.description) && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-left pointer-events-none">
                  {noticeImage.title && (
                    <h4 className="text-white font-semibold text-lg">
                      {noticeImage.title}
                    </h4>
                  )}
                  {noticeImage.description && (
                    <p className="text-gray-200 text-sm mt-1">
                      {noticeImage.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="relative w-full h-full bg-gray-100 flex items-center justify-center flex-1">
              <PlaceholderImage
                text="Railway Notice Image"
                className="!bg-transparent text-gray-400 border-none w-full h-full opacity-50 absolute inset-0"
              />
            </div>
          )}
        </div>
      </div>

      {isModalOpen && noticeImage.image && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="relative max-w-3xl w-auto max-h-[85vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute -top-12 right-0 md:-right-10 text-white hover:text-gray-300 transition-colors p-2 bg-black/20 rounded-full"
            >
              <X className="w-8 h-8" />
            </button>
            <img
              src={noticeImage.image}
              alt={noticeImage.title || "Notice Image"}
              className="max-w-full max-h-[85vh] object-contain rounded shadow-2xl border-4 border-white/10 bg-black/50"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default function Home() {
  const config = useStore((state) => state.config) as any;
  const notices = useStore((state) => state.notices);
  const notifications = useStore((state) => state.notifications);
  const meritPanels = useStore((state) => state.meritPanels);
  const results = useStore((state) => state.results);
  const links = useStore((state) => state.links);
  const issuedSFs = useStore((state) => state.issuedSFs) || [];
  
  const isSfAuthenticated = useStore((state) => state.isSfAuthenticated);
  const sfAuthenticatedAt = useStore((state) => state.sfAuthenticatedAt);
  const sfLogin = useStore((state) => state.sfLogin);
  const sfLogout = useStore((state) => state.sfLogout);

  const { t } = useTranslation();

  const today = new Date().toISOString().split('T')[0];
  const hasPendingSFs = issuedSFs.some(sf => !sf.isFinalised && sf.issuedDate < today);

  const sessionDurationMinutes = parseInt(config.sfSessionDuration || "30", 10);
  let isStillValid = false;
  if (isSfAuthenticated && sfAuthenticatedAt) {
    const elapsedMinutes = (Date.now() - new Date(sfAuthenticatedAt).getTime()) / 60000;
    if (elapsedMinutes < sessionDurationMinutes) {
      isStillValid = true;
    } else {
      sfLogout();
    }
  }

  const [isOfficePasswordModalOpen, setIsOfficePasswordModalOpen] = useState(false);
  const [officePassword, setOfficePassword] = useState("");
  const [officePasswordError, setOfficePasswordError] = useState("");
  const [redirectTab, setRedirectTab] = useState<string | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    localStorage.removeItem("lastSelectedSFTab");
    localStorage.removeItem("lastSelectedDARSubTab");
  }, []);

  const handleOfficeUseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setRedirectTab(null);
    if (isStillValid) {
      navigate("/sf-generator");
    } else {
      setIsOfficePasswordModalOpen(true);
      setOfficePassword("");
      setOfficePasswordError("");
    }
  };

  const handleOfficePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = config.sfPasscode || "124612";
    if (officePassword === correctPassword) {
      sfLogin();
      setIsOfficePasswordModalOpen(false);
      const targetQuery = redirectTab ? `?tab=${redirectTab}` : "";
      navigate(`/sf-generator${targetQuery}`);
    } else {
      setOfficePasswordError("Incorrect Password");
    }
  };

  // Combine top newest items across all categories for the marquee
  const allDocuments = [
    ...(notices || []).map((n) => ({ ...n, id: `notice-${n.id}`, title: n.title })),
    ...(notifications || []).map((n) => ({ ...n, id: `notification-${n.id}`, title: n.title })),
    ...(meritPanels || []).map((n) => ({ ...n, id: `merit-${n.id}`, title: n.title })),
    ...(results || []).map((n) => ({ ...n, id: `result-${n.id}`, title: n.title })),
  ];

  const topRecent = allDocuments
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  const videoConfig = useStore((state) => state.videoConfig);

  const leftColSpan = "lg:col-span-3";

  return (
    <div className="flex-1 flex flex-col pt-4 pb-8 space-y-6">
      {/* Marquee Section */}
      <div className="w-full mx-auto px-4 md:px-8">
        <div className="bg-red-50 border border-red-200 px-4 py-2 flex items-center rounded-md font-medium text-sm shadow-sm overflow-hidden">
          <div className="shrink-0 font-bold bg-[#e31837] text-white px-3 py-1 rounded shadow-sm mr-3 uppercase tracking-wider text-xs">
            {t('home_latest_updates')}
          </div>
          <div className="flex-1 flex overflow-hidden relative">
            <marquee
              behavior="scroll"
              direction="left"
              scrollamount="5"
              className="w-full font-bold text-black tracking-wide"
            >
              {config.marqueeText}
            </marquee>
          </div>
        </div>
      </div>

      {/* Hero / Dashboard Grid */}
      <div className="w-full mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch mt-6">
        {/* Left Col: Hero Image & Quick Links */}
        <div className={`${leftColSpan} flex flex-col gap-6 h-full`}>
          <HeroSlider />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <QuickLinkCard
              to="/notifications"
              icon={<Bell className="w-8 h-8 md:w-8 md:h-8 w-7 h-7" />}
              title={t('home_notifications')}
              color="bg-blue-50 text-blue-700"
            />
            <button
              onClick={handleOfficeUseClick}
              className="relative flex flex-col items-center justify-center p-3.5 sm:p-5 md:p-6 rounded-lg shadow-sm border border-emerald-200 transition-all group bg-emerald-50 text-emerald-700 hover:shadow-md cursor-pointer"
            >
              {hasPendingSFs && (
                <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-red-600 rounded-full animate-ping z-10"></div>
              )}
              {hasPendingSFs && (
                <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-red-600 rounded-full z-10 border border-white"></div>
              )}
              <div className="mb-3 group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 md:w-8 md:h-8 w-7 h-7" />
              </div>
              <h3 className="font-semibold text-center text-xs sm:text-sm md:text-base leading-tight">
                Office Dashboard
              </h3>
            </button>
            <QuickLinkCard
              to="/ai-search"
              icon={<Search className="w-8 h-8 md:w-8 md:h-8 w-7 h-7" />}
              title={t('nav_ai_search') || 'Nav AI Search'}
              color="bg-purple-50 text-purple-700"
            />
            <button
              onClick={(e) => {
                e.preventDefault();
                if (isStillValid) {
                  navigate(`/sf-generator?tab=OFFICE_ORDERS`);
                } else {
                  setIsOfficePasswordModalOpen(true);
                  setRedirectTab("OFFICE_ORDERS");
                  setOfficePassword("");
                  setOfficePasswordError("");
                }
              }}
              className="flex flex-col items-center justify-center p-3.5 sm:p-5 md:p-6 rounded-lg shadow-sm border border-gray-105 hover:shadow-md transition-all group bg-orange-50 text-orange-705 cursor-pointer"
            >
              <div className="mb-3 group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 md:w-8 md:h-8 w-7 h-7" />
              </div>
              <h3 className="font-semibold text-center text-xs sm:text-sm md:text-base leading-tight">
                {t('home_circulars')}
              </h3>
            </button>
            <Link
              to="/candidate-login"
              className="flex flex-col items-center justify-center p-3.5 sm:p-5 md:p-6 rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.5)] border border-red-200 hover:shadow-[0_0_25px_rgba(239,68,68,0.8)] hover:-translate-y-1 transition-all group bg-gradient-to-br from-red-50 to-red-100 text-red-700 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-red-400 opacity-20 blur-xl rounded-full scale-150 animate-pulse"></div>
              <div className="mb-3 group-hover:scale-110 transition-transform relative z-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-red-400 opacity-30 blur-md rounded-full"></div>
                <User className="w-8 h-8 md:w-8 md:h-8 w-7 h-7" />
              </div>
              <h3 className="font-bold text-center text-xs sm:text-sm md:text-base relative z-10 leading-tight">
                {t('nav_candidate_login') || 'Candidate Login'}
              </h3>
            </Link>
          </div>

          {/* Disclosures & Disclaimer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl shadow-sm border border-[#00FFFF]/20 bg-[#00FFFF]">
              <h3 className="font-bold text-slate-800 border-b border-slate-800/20 pb-2 mb-2 text-center uppercase">{t('home_disclosures')}</h3>
              <p className="text-sm text-slate-800">
                {t('home_disclosures_text')}
              </p>
            </div>
            <div className="p-4 rounded-xl shadow-sm h-full border border-[#8FBC8B]/20 bg-[#8FBC8B]">
              <h3 className="font-bold text-slate-800 border-b border-slate-800/20 pb-2 mb-2 text-center uppercase">{t('home_disclaimer')}</h3>
              <p className="text-sm text-slate-800">
                {t('home_disclaimer_text')}
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Notice Board */}
        <div className="lg:col-span-1 relative flex flex-col gap-3 h-full min-h-[600px] lg:min-h-0">
          <div className="lg:absolute lg:inset-0 flex flex-col gap-3 h-full max-h-full">
            <DocumentPanel
              title={t('home_latest_news')}
              items={topRecent}
              theme="news"
              isMarquee={true}
              scrollSpeed="10s"
              className="flex-[1.5] w-full min-h-0"
            />
            <VideoPlayerBox className="flex-[0.6] w-full min-h-[80px] lg:min-h-0 text-sm" />
            <NoticeBoardImage className="flex-[0.8] w-full flex flex-col min-h-[100px] lg:min-h-0" />
          </div>
        </div>
      </div>



      {/* Important Links */}
      <div className="w-full mx-auto px-4 md:px-8 mt-4">
        <div className="bg-emerald-50 rounded-xl shadow-md border border-emerald-200 overflow-hidden">
          <div className="p-5 font-bold text-white bg-emerald-600 tracking-wide uppercase text-lg shadow-inner">
            <h3>{t('home_railways_link')}</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 bg-emerald-50">
            {(links || [])
              .sort((a, b) => a.order - b.order)
              .map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-300 shadow-sm hover:shadow-md group transform hover:-translate-y-1"
                >
                  <span className="text-sm font-bold text-emerald-900 group-hover:text-emerald-700 tracking-wider flex-1 pr-2">
                    {link.name}
                  </span>
                  <ExternalLink className="w-5 h-5 text-emerald-600 group-hover:text-emerald-800 flex-shrink-0" />
                </a>
              ))}
          </div>
        </div>
      </div>

      {/* Important Message Section */}
      {config.importantMessageEnabled === "true" && config.importantMessageText && (
        <div className="w-full mx-auto px-4 md:px-8 mt-4">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-red-500 rounded-lg p-3.5 md:p-4 shadow-[0_4px_15px_rgba(239,68,68,0.12)] flex flex-col md:flex-row items-start md:items-center gap-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-400/5 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 w-20 h-20 bg-red-400/5 rounded-full blur-lg pointer-events-none" />
            
            <div className="flex-shrink-0 bg-red-650 text-white p-2 rounded-lg shadow-md border border-red-500 animate-pulse flex items-center justify-center">
              <span className="text-base">📢</span>
            </div>
            
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-red-700 font-extrabold text-xs md:text-sm tracking-wider uppercase flex items-center gap-1.5">
                  🔔 IMPORTANT MESSAGE / महत्वपूर्ण संदेश
                </h3>
                <span className="bg-red-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-widest shadow-sm">
                  ATTENTION
                </span>
              </div>
              <p className="text-slate-900 text-xs md:text-sm font-bold tracking-wide text-justify md:text-left leading-relaxed">
                {config.importantMessageText}
              </p>
            </div>
          </div>
        </div>
      )}

      {isOfficePasswordModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setIsOfficePasswordModalOpen(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsOfficePasswordModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center border-b pb-2">
              Office Dashboard
            </h2>
            <form onSubmit={handleOfficePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={officePassword}
                  onChange={(e) => {
                    setOfficePassword(e.target.value);
                    setOfficePasswordError("");
                  }}
                  className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${officePasswordError ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Enter access password"
                  autoFocus
                />
                {officePasswordError && (
                  <p className="mt-1 text-sm text-red-600 font-medium">
                    {officePasswordError}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-md shadow-md transition-colors"
              >
                Access Generator
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickLinkCard({
  to,
  icon,
  title,
  color,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  color: string;
}) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center p-3.5 sm:p-5 md:p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all group ${color}`}
    >
      <div className="mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-semibold text-center text-xs sm:text-sm md:text-base leading-tight">
        {title}
      </h3>
    </Link>
  );
}
