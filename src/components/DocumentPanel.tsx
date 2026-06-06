import React, { useRef, useState, useEffect } from "react";
import { FileText, Download, Eye, Zap, Calendar, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { DocumentItem } from "../types";
import { NewBadge } from "./NewBadge";

interface DocumentPanelProps {
  title: string;
  items: DocumentItem[];
  theme?: "blue" | "red" | "emerald" | "amber" | "purple" | "teal" | "orange" | "rose" | "indigo" | "news";
  isMarquee?: boolean;
  scrollSpeed?: string;
  className?: string; // Add className
}

const themeStyles = {
  blue: {
    header: "bg-[#1c3f60] text-white",
    containerBg: "bg-white",
    containerBorder: "border-[#1c3f60]/20",
    itemBg: "bg-white",
    itemHover: "hover:bg-gray-50",
    itemBorder: "border-gray-100",
    text: "text-gray-900",
  },
  red: {
    header: "bg-[#b91c1c] text-white",
    containerBg: "bg-[#fffdf0]",
    containerBorder: "border-[#e31837]/30",
    itemBg: "bg-[#fffdf0]",
    itemHover: "hover:bg-[#fff5c2]",
    itemBorder: "border-[#f0e6b2]",
    text: "text-gray-900",
  },
  emerald: {
    header: "bg-emerald-600 text-white",
    containerBg: "bg-emerald-50",
    containerBorder: "border-emerald-200",
    itemBg: "bg-emerald-50",
    itemHover: "hover:bg-emerald-100",
    itemBorder: "border-emerald-200",
    text: "text-emerald-900",
  },
  amber: {
    header: "bg-amber-600 text-white",
    containerBg: "bg-amber-50",
    containerBorder: "border-amber-200",
    itemBg: "bg-amber-50",
    itemHover: "hover:bg-amber-100",
    itemBorder: "border-amber-200",
    text: "text-black font-bold text-base sm:text-lg",
  },
  purple: {
    header: "bg-purple-600 text-white",
    containerBg: "bg-purple-50",
    containerBorder: "border-purple-200",
    itemBg: "bg-purple-50",
    itemHover: "hover:bg-purple-100",
    itemBorder: "border-purple-200",
    text: "text-purple-900",
  },
  teal: {
    header: "bg-teal-600 text-white",
    containerBg: "bg-teal-50",
    containerBorder: "border-teal-200",
    itemBg: "bg-teal-50",
    itemHover: "hover:bg-teal-100",
    itemBorder: "border-teal-200",
    text: "text-teal-900",
  },
  orange: {
    header: "bg-orange-600 text-white",
    containerBg: "bg-orange-50",
    containerBorder: "border-orange-200",
    itemBg: "bg-orange-50",
    itemHover: "hover:bg-orange-100",
    itemBorder: "border-orange-200",
    text: "text-orange-900",
  },
  rose: {
    header: "bg-rose-600 text-white",
    containerBg: "bg-rose-50",
    containerBorder: "border-rose-200",
    itemBg: "bg-rose-50",
    itemHover: "hover:bg-rose-100",
    itemBorder: "border-rose-200",
    text: "text-rose-900",
  },
  indigo: {
    header: "bg-indigo-600 text-white",
    containerBg: "bg-indigo-50",
    containerBorder: "border-indigo-200",
    itemBg: "bg-indigo-50",
    itemHover: "hover:bg-indigo-100",
    itemBorder: "border-indigo-200",
    text: "text-indigo-900",
  },
  news: {
    header: "bg-[#1f3535] text-white shadow-[0_4px_10px_rgb(0,0,0,0.1)]", // slightly darker for header
    containerBg: "bg-[#f0ffff]",
    containerBorder: "ring-1 ring-[#1f3535]/10",
    itemBg: "bg-transparent",
    itemHover: "hover:bg-[#e0f7f7]",
    itemBorder: "border-[#1f3535]/10",
    text: "text-[#1f3535]",
  }
};

export function DocumentPanel({
  title,
  items,
  theme = "blue",
  isMarquee = false,
  scrollSpeed = "20s",
  className = "",
}: DocumentPanelProps) {
  const currentTheme = themeStyles[theme] || themeStyles.blue;
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // useEffect(() => { ... }) disabled in favor of HTML marquee element

  // Sort items by order, then by date descending
  const sortedItems = [...(items || [])].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const content =
    sortedItems.length === 0 ? (
      <div className="p-8 text-center text-gray-500 text-sm">
        {t('table_no_notices')}
      </div>
    ) : (
      theme === "news" ? (
        <div className="relative pl-2 pr-2 py-1 mb-1">
          {sortedItems.map((item, index) => (
            <div
              key={item.id}
              className="relative flex gap-2.5 items-start mb-3 group cursor-pointer border-b border-[#1f3535]/10 pb-2 last:border-0"
              onClick={() => {
                if (item.downloadLink && item.downloadLink !== "#") window.open(item.downloadLink, "_blank");
                else if (item.viewLink && item.viewLink !== "#") window.open(item.viewLink, "_blank");
              }}
            >
              <div className="flex-1 bg-transparent py-0.5 transition-all duration-300 relative">
                 <div className="flex flex-col gap-1">
                   <div className="flex-1">
                     <div className="flex items-center gap-1.5 flex-wrap">
                       <h3 className="font-[Cambria] font-semibold text-slate-800 text-[13px] leading-snug group-hover:text-teal-700 transition-colors">
                         {item.title}
                       </h3>
                       {item.isNew && <NewBadge />}
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-1 shrink-0 text-[10px] text-slate-500 font-medium px-1">
                     <Calendar className="w-2.5 h-2.5 text-slate-400" />
                     {new Date(item.date).toLocaleDateString(i18n.language === 'hi' ? "hi-IN" : "en-IN", {
                       year: "numeric",
                       month: "short",
                       day: "numeric",
                     })}
                   </div>
                 </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        sortedItems.map((item) => (
          <div
            key={item.id}
            className={`p-4 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b last:border-0 relative ${currentTheme.itemBg} ${currentTheme.itemHover} ${currentTheme.itemBorder}`}
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <a 
                  href={item.downloadLink || item.viewLink || "#"} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`font-medium leading-tight hover:text-blue-600 hover:underline transition-colors cursor-pointer decoration-2 underline-offset-2 ${currentTheme.text}`}
                >
                  {item.title}
                </a>
                {item.isNew && <NewBadge />}
              </div>
              <div className="text-xs text-gray-500 font-mono">
                {t('panel_posted')}{" "}
                {new Date(item.date).toLocaleDateString(i18n.language === 'hi' ? "hi-IN" : "en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0 relative z-10">
              {item.viewLink && item.viewLink !== "#" && (
                <a
                  href={item.viewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-sm font-medium transition-colors cursor-pointer"
                >
                  <Eye className="w-4 h-4" /> {t('panel_view')}
                </a>
              )}
              {item.downloadLink && item.downloadLink !== "#" && (
                <a
                  href={item.downloadLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" /> {t('panel_download')}
                </a>
              )}
            </div>
          </div>
        ))
      )
    );

  return (
    <div
      className={`${theme === 'news' ? 'rounded-xl shadow-lg border-0' : 'rounded-lg shadow-sm border'} overflow-hidden flex flex-col ${currentTheme.containerBg} ${currentTheme.containerBorder} ${className || (isMarquee ? "h-[380px]" : "")}`}
    >
      <div
        className={`p-4 font-semibold flex items-center shrink-0 relative z-20 ${currentTheme.header}`}
      >
        <h2 className="flex items-center gap-2 justify-center flex-1 ml-10">
          <FileText className="w-5 h-5" />
          {title}
        </h2>
        <span className="text-xs bg-white/20 py-1 px-3 rounded-full shrink-0">
          {(items || []).length} {t('panel_items')}
        </span>
      </div>

      {isMarquee ? (
        <div className={`flex flex-col flex-1 min-h-0 ${currentTheme.containerBg}`}>
          <div
            className={`flex-1 relative overflow-hidden ${currentTheme.containerBg}`}
          >
            <marquee
              direction="up"
              behavior="scroll"
              scrollamount="2" // Add some scrollspeed controls here if needed
              className="h-full w-full block"
              onMouseOver={(e: React.MouseEvent<HTMLMarqueeElement>) => e.currentTarget.stop()}
              onMouseOut={(e: React.MouseEvent<HTMLMarqueeElement>) => e.currentTarget.start()}
            >
              <div className="flex flex-col pb-8">
                {content}
              </div>
            </marquee>
          </div>
          {theme === "news" && (
            <div className="border-t border-[#1f3535] bg-[#1f3535]/10 shrink-0 flex justify-center py-3 relative z-20 shadow-[0_-4px_10px_rgb(0,0,0,0.02)]">
               <button 
                 onClick={() => navigate('/notice-board')}
                 className="flex items-center gap-1.5 text-sm font-semibold text-teal-100 hover:text-white px-5 py-2 rounded-full bg-[#1f3535] hover:bg-[#2a4545] transition-colors border border-[#2a4545] hover:border-teal-400 shadow-sm hover:shadow"
               >
                 {t('home_view_all', 'View All News')}
                 <ChevronRight className="w-4 h-4" />
               </button>
            </div>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
          {content}
        </div>
      )}
    </div>
  );
}
