import { useState } from "react";
import { useStore } from "../store/useStore";
import { DocumentPanel } from "../components/DocumentPanel";
import { FileText, Award, Bell, ExternalLink, X } from "lucide-react";
import { Link } from "react-router-dom";
import { PlaceholderImage } from "../components/PlaceholderImage";

import { HeroSlider } from "../components/HeroSlider";

function NoticeBoardImage() {
  const noticeImage = useStore((state) => state.noticeImage);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!noticeImage.enabled) return null;

  return (
    <>
      <style>{`
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div className="w-full rounded-lg shadow-sm bg-white group relative overflow-hidden p-[2px]">
        <div
          className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0 280deg, rgba(227,24,55,0.8) 360deg)",
            animation: "spin-slow 3s linear infinite",
          }}
        />
        <div className="relative z-10 bg-white w-full rounded-md overflow-hidden">
          {noticeImage.image ? (
            <div
              onClick={() => setIsModalOpen(true)}
              className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden text-center flex flex-col items-center justify-center cursor-pointer block"
            >
              <img
                src={noticeImage.image}
                alt={noticeImage.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
            <div className="relative w-full aspect-[4/3] bg-gray-100 flex items-center justify-center">
              <PlaceholderImage
                text="Railway Notice Image"
                className="!bg-transparent text-gray-400 border-none w-full h-full opacity-50"
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
  const config = useStore((state) => state.config);
  const notices = useStore((state) => state.notices);
  const meritPanels = useStore((state) => state.meritPanels);
  const results = useStore((state) => state.results);
  const darCirculars = useStore((state) => state.darCirculars);
  const actCirculars = useStore((state) => state.actCirculars);
  const links = useStore((state) => state.links);

  // Combine top 5 newest items across all categories for the marquee
  const allDocuments = [
    ...notices.map((n) => ({ ...n, id: `notice-${n.id}`, title: `[Notice] ${n.title}` })),
    ...meritPanels.map((n) => ({ ...n, id: `merit-${n.id}`, title: `[Merit] ${n.title}` })),
    ...results.map((n) => ({ ...n, id: `result-${n.id}`, title: `[Result] ${n.title}` })),
    ...darCirculars.map((n) => ({ ...n, id: `dar-${n.id}`, title: `[DAR Circular] ${n.title}` })),
    ...actCirculars.map((n) => ({ ...n, id: `act-${n.id}`, title: `[Act Circular] ${n.title}` })),
  ];

  const top5Recent = allDocuments
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="flex-1 flex flex-col pt-4 pb-8 space-y-6">
      {/* Marquee Section */}
      <div className="max-w-7xl mx-auto px-4 w-full">
        <div className="bg-red-50 border border-red-200 px-4 py-2 flex items-center rounded-md font-medium text-sm shadow-sm overflow-hidden">
          <div className="shrink-0 font-bold bg-[#e31837] text-white px-3 py-1 rounded shadow-sm mr-3 uppercase tracking-wider text-xs">
            Latest Updates
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
      <div className="max-w-7xl mx-auto px-4 w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Hero Image & Quick Links */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <HeroSlider />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QuickLinkCard
              to="/notifications"
              icon={<Bell className="w-8 h-8" />}
              title="Notifications"
              color="bg-blue-50 text-blue-700"
            />
            <QuickLinkCard
              to="/merit"
              icon={<Award className="w-8 h-8" />}
              title="Merit Panel"
              color="bg-emerald-50 text-emerald-700"
            />
            <QuickLinkCard
              to="/results"
              icon={<FileText className="w-8 h-8" />}
              title="Results"
              color="bg-purple-50 text-purple-700"
            />
            <QuickLinkCard
              to="/dar-circulars"
              icon={<FileText className="w-8 h-8" />}
              title="Circulars"
              color="bg-orange-50 text-orange-700"
            />
          </div>
        </div>

        {/* Right Col: Notice Board */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <DocumentPanel
            title="Notice Board"
            items={top5Recent}
            theme="red"
            isMarquee={true}
            scrollSpeed="10s"
          />
          <NoticeBoardImage />
        </div>
      </div>

      {/* Circulars Section */}
      <div className="max-w-7xl mx-auto px-4 w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <DocumentPanel
          title="Latest DAR Circulars"
          items={darCirculars}
          theme="blue"
        />
        <DocumentPanel
          title="Latest Act Apprentice Circulars"
          items={actCirculars}
          theme="blue"
        />
      </div>

      {/* Important Links */}
      <div className="max-w-7xl mx-auto px-4 w-full mt-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 font-semibold text-gray-800 bg-gray-50 border-b border-gray-200">
            <h3>Railways Website Link</h3>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {links
              .sort((a, b) => a.order - b.order)
              .map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 border border-gray-100 rounded-md hover:bg-blue-50 hover:border-blue-200 transition-colors group"
                >
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                    {link.name}
                  </span>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
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
