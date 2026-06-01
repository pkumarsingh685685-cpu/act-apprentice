import { useStore } from '../store/useStore';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';

export default function LinksPage() {
  const links = useStore((state) => state.externalLinks);
  const { t } = useTranslation();

  return (
    <div className="w-full px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-[#1c3f60]/20 overflow-hidden">
        <div className="p-4 font-semibold text-white flex items-center justify-between bg-[#1c3f60]">
          <h2>{t('nav_important_links')}</h2>
        </div>
        
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {(links || []).sort((a,b)=>a.order-b.order).map(link => (
            <a 
              key={link.id} 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 border border-gray-100 rounded-md hover:bg-blue-50 hover:border-blue-200 transition-colors group shadow-sm hover:shadow"
            >
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{link.name}</span>
              <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-600 shrink-0 ml-2" />
            </a>
          ))}
          {(!links || links.length === 0) && (
            <div className="col-span-full p-8 text-center text-gray-500">
               {t('links_no_configured')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
