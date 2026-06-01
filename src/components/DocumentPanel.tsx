import { FileText, Download, Eye, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
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
    header: "bg-slate-800 text-white shadow-md",
    containerBg: "bg-gradient-to-b from-amber-50 to-orange-50",
    containerBorder: "border-orange-200",
    itemBg: "bg-transparent",
    itemHover: "hover:bg-orange-100/50",
    itemBorder: "border-orange-200/50",
    text: "text-slate-900 text-[14px] sm:text-[15px] leading-snug font-medium",
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
      sortedItems.map((item) => (
        <div
          key={item.id}
          className={`p-4 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b last:border-0 relative ${currentTheme.itemBg} ${currentTheme.itemHover} ${currentTheme.itemBorder}`}
        >
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-medium leading-tight ${currentTheme.text}`}>
                {item.title}
              </h3>
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
            {!isMarquee && item.viewLink && item.viewLink !== "#" && (
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
    );

  return (
    <div
      className={`rounded-lg shadow-sm border overflow-hidden flex flex-col ${currentTheme.containerBg} ${currentTheme.containerBorder} ${className || (isMarquee ? "h-[380px]" : "")}`}
    >
      <div
        className={`p-4 font-semibold flex items-center justify-between shrink-0 relative z-20 ${currentTheme.header}`}
      >
        <h2 className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {title}
        </h2>
        <span className="text-xs bg-white/20 py-1 px-3 rounded-full">
          {(items || []).length} {t('panel_items')}
        </span>
      </div>

      {isMarquee ? (
        <div
          className={`flex-1 relative overflow-hidden ${currentTheme.containerBg}`}
        >
          <style>{`
            @keyframes marqueeVertical {
              0% { transform: translateY(100%); }
              100% { transform: translateY(-100%); }
            }
            .animate-marqueeVertical {
              animation: marqueeVertical ${scrollSpeed} linear infinite;
            }
            .animate-marqueeVertical:hover {
              animation-play-state: paused;
            }
          `}</style>
          <div className="absolute w-full animate-marqueeVertical">
            {content}
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
          {content}
        </div>
      )}
    </div>
  );
}
