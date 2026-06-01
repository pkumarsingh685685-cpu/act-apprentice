import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "../store/useStore";
import { DocumentPanel } from "../components/DocumentPanel";
import { FileText, Award, Bell, ExternalLink, X } from "lucide-react";
import { Link } from "react-router-dom";
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
      <div className={`w-full h-full rounded-lg shadow-sm bg-white group relative overflow-hidden flex flex-col min-h-[150px] border border-gray-200 ${className || ""}`}>
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
  const meritPanels = useStore((state) => state.meritPanels);
  const results = useStore((state) => state.results);
  const darCirculars = useStore((state) => state.darCirculars);
  const actCirculars = useStore((state) => state.actCirculars);
  const links = useStore((state) => state.links);
  const { t } = useTranslation();

  // Combine top 5 newest items across all categories for the marquee
  const allDocuments = [
    ...(notices || []).map((n) => ({ ...n, id: `notice-${n.id}`, title: `${t('doc_type_notice')} ${n.title}` })),
    ...(meritPanels || []).map((n) => ({ ...n, id: `merit-${n.id}`, title: `${t('doc_type_merit')} ${n.title}` })),
    ...(results || []).map((n) => ({ ...n, id: `result-${n.id}`, title: `${t('doc_type_result')} ${n.title}` })),
    ...(darCirculars || []).map((n) => ({ ...n, id: `dar-${n.id}`, title: `${t('doc_type_dar')} ${n.title}` })),
    ...(actCirculars || []).map((n) => ({ ...n, id: `act-${n.id}`, title: `${t('doc_type_act')} ${n.title}` })),
  ];

  const top5Recent = allDocuments
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

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
          <marquee
            behavior="scroll"
            direction="left"
            scrollamount="5"
            className="flex-1 font-bold text-black tracking-wide"
          >
            {config.marqueeText}
          </marquee>
        </div>
      </div>

      {/* Hero / Dashboard Grid */}
      <div className="w-full mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        {/* Left Col: Hero Image & Quick Links */}
        <div className={`${leftColSpan} flex flex-col gap-6 h-full`}>
          <HeroSlider />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickLinkCard
              to="/notifications"
              icon={<Bell className="w-8 h-8" />}
              title={t('home_notifications')}
              color="bg-blue-50 text-blue-700"
            />
            <QuickLinkCard
              to="/merit"
              icon={<Award className="w-8 h-8" />}
              title={t('home_merit_panel')}
              color="bg-emerald-50 text-emerald-700"
            />
            <QuickLinkCard
              to="/results"
              icon={<FileText className="w-8 h-8" />}
              title={t('home_results')}
              color="bg-purple-50 text-purple-700"
            />
            <QuickLinkCard
              to="/dar-circulars"
              icon={<FileText className="w-8 h-8" />}
              title={t('home_circulars')}
              color="bg-orange-50 text-orange-700"
            />
          </div>

          {/* Disclosures & Disclaimer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-rose-50 p-4 rounded-xl shadow-sm border border-rose-200">
              <h3 className="font-semibold text-rose-900 border-b border-rose-200 pb-2 mb-2">{t('home_disclosures')}</h3>
              <p className="text-sm text-rose-800">
                {t('home_disclosures_text')}
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-xl shadow-sm border border-orange-200 h-full">
              <h3 className="font-semibold text-orange-900 border-b border-orange-200 pb-2 mb-2">{t('home_disclaimer')}</h3>
              <p className="text-sm text-orange-800">
                {t('home_disclaimer_text')}
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Notice Board */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-full">
          <DocumentPanel
            title={t('home_latest_news')}
            items={top5Recent}
            theme="news"
            isMarquee={true}
            scrollSpeed="10s"
            className="flex-[2] w-full min-h-0"
          />
          <VideoPlayerBox className="shrink-0 w-full" />
          <NoticeBoardImage className="flex-[1.2] w-full flex flex-col" />
        </div>
      </div>

      {/* Circulars Section */}
      <div className="w-full mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <DocumentPanel
          title={t('home_latest_dar')}
          items={darCirculars}
          theme="teal"
        />
        <DocumentPanel
          title={t('home_latest_act')}
          items={actCirculars}
          theme="purple"
        />
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
      className={`flex flex-col items-center justify-center p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all group ${color}`}
    >
      <div className="mb-3 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-semibold text-center text-sm md:text-base">
        {title}
      </h3>
    </Link>
  );
}
