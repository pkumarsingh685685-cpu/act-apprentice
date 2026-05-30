import { Image as ImageIcon } from 'lucide-react';

export function PlaceholderImage({ text, className = "" }: { text: string, className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center bg-gray-50 text-gray-400 border border-gray-200 border-dashed rounded overflow-hidden ${className}`}>
      <ImageIcon className="w-8 h-8 opacity-40 mb-1 shrink-0" />
      <span className="text-[10px] font-medium text-center px-1 leading-tight">{text}</span>
    </div>
  );
}
