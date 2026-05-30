import { FileText, Download, Eye, Zap } from "lucide-react";
import { DocumentItem } from "../types";
import { NewBadge } from "./NewBadge";

interface DocumentPanelProps {
  title: string;
  items: DocumentItem[];
  theme?: "blue" | "red";
  isMarquee?: boolean;
  scrollSpeed?: string;
}

export function DocumentPanel({
  title,
  items,
  theme = "blue",
  isMarquee = false,
  scrollSpeed = "20s",
}: DocumentPanelProps) {
  const isBlue = theme === "blue";

  // Sort items by order, then by date descending
  const sortedItems = [...items].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const content =
    sortedItems.length === 0 ? (
      <div className="p-8 text-center text-gray-500 text-sm">
        No items available at the moment.
      </div>
    ) : (
      sortedItems.map((item) => (
        <div
          key={item.id}
          className={`p-4 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b last:border-0 relative ${
            isBlue
              ? "bg-white hover:bg-gray-50 border-gray-100"
              : "bg-[#fffdf0] hover:bg-[#fff5c2] border-[#f0e6b2]"
          }`}
        >
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-gray-900 leading-tight">
                {item.title}
              </h3>
              {item.isNew && <NewBadge />}
            </div>
            <div className="text-xs text-gray-500 font-mono">
              Posted:{" "}
              {new Date(item.date).toLocaleDateString("en-IN", {
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
                <Eye className="w-4 h-4" /> View
              </a>
            )}
            {item.downloadLink && item.downloadLink !== "#" && (
              <a
                href={item.downloadLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download
              </a>
            )}
          </div>
        </div>
      ))
    );

  return (
    <div
      className={`rounded-lg shadow-sm border overflow-hidden flex flex-col ${
        isBlue
          ? "bg-white border-[#1c3f60]/20"
          : "bg-[#fffdf0] border-[#e31837]/30"
      } ${isMarquee ? "h-[380px]" : ""}`}
    >
      <div
        className={`p-4 font-semibold text-white flex items-center justify-between shrink-0 relative z-20 ${
          isBlue ? "bg-[#1c3f60]" : "bg-[#b91c1c]"
        }`}
      >
        <h2 className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {title}
        </h2>
        <span className="text-xs bg-white/20 py-1 px-3 rounded-full">
          {items.length} items
        </span>
      </div>

      {isMarquee ? (
        <div
          className={`flex-1 relative overflow-hidden ${
            isBlue ? "bg-white" : "bg-[#fffdf0]"
          }`}
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
