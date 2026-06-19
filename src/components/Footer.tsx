import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { PlaceholderImage } from './PlaceholderImage';

export function Footer() {
  const config = useStore((state) => state.config) as any;
  const logos = useStore((state) => state.logos) || {};
  const { t } = useTranslation();
  
  return (
    <footer className="bg-[#294f7c] text-gray-200 mt-12 py-8 mt-auto">
      <div className="w-full mx-auto px-4 sm:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2 mb-4">
            {t('footer_contact_info')}
          </h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {config.contactAddress}
          </p>
          <div className="mt-4 text-sm">
            <p><strong>{t('footer_mobile')}</strong> {config.contactMobile}</p>
            <p><strong>{t('footer_email')}</strong> {config.contactEmail}</p>
          </div>
        </div>

        <div>
           <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2 mb-4">
            {t('nav_important_links')}
          </h3>
          <ul className="text-sm space-y-2">
            <li><Link to="/" className="hover:text-white transition-colors">{t('nav_home')}</Link></li>
            <li><Link to="/about" className="hover:text-white transition-colors">{t('nav_about')}</Link></li>
            <li><Link to="/notifications" className="hover:text-white transition-colors">{t('nav_apprentice_notification')}</Link></li>
            <li><Link to="/results" className="hover:text-white transition-colors">{t('nav_results')}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white border-b border-gray-600 pb-2 mb-4">
            {t('footer_about_portal')}
          </h3>
          <p className="text-sm leading-relaxed">
            {t('footer_about_text')}
          </p>
        </div>
      </div>

      <div className="w-full mx-auto px-4 sm:px-8 mt-8 pt-6 border-t border-[#15304a] flex flex-col md:flex-row justify-between items-center text-xs">
        <p>{t('footer_copyright', { year: new Date().getFullYear() })}</p>
        
        <div className="mt-4 md:mt-0 flex items-center justify-center py-1 font-[Inter,sans-serif]">
          <style>{`
            @keyframes rainbow-border-glow {
              0% {
                border-color: #3b82f6;
                box-shadow: 0 0 8px rgba(59, 130, 246, 0.6), inset 0 0 4px rgba(59, 130, 246, 0.4);
              }
              25% {
                border-color: #ec4899;
                box-shadow: 0 0 8px rgba(236, 72, 153, 0.6), inset 0 0 4px rgba(236, 72, 153, 0.4);
              }
              50% {
                border-color: #10b981;
                box-shadow: 0 0 8px rgba(16, 185, 129, 0.6), inset 0 0 4px rgba(16, 185, 129, 0.4);
              }
              75% {
                border-color: #f59e0b;
                box-shadow: 0 0 8px rgba(245, 158, 11, 0.6), inset 0 0 4px rgba(245, 158, 11, 0.4);
              }
              100% {
                border-color: #3b82f6;
                box-shadow: 0 0 8px rgba(59, 130, 246, 0.6), inset 0 0 4px rgba(59, 130, 246, 0.4);
              }
            }
            @keyframes red-text-sweep {
              0% {
                background-position: 0% 0;
              }
              100% {
                background-position: -300% 0;
              }
            }
            .lighting-border {
              animation: rainbow-border-glow 4s linear infinite;
              background-color: rgba(15, 32, 51, 0.9);
            }
            .lighting-text {
              background: linear-gradient(
                90deg,
                #ff1818 0%,
                #ffffff 12%,
                #10b981 25%,
                #ffffff 38%,
                #ffea00 50%,
                #ffffff 62%,
                #ff1818 75%,
                #ffffff 88%,
                #ff1818 100%
              );
              background-size: 300% auto;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
              color: transparent;
              animation: red-text-sweep 5s linear infinite;
              display: inline-block;
            }
          `}</style>
          <div className="lighting-border border-2 px-4 py-1.5 rounded-full flex items-center justify-center">
            <p className="text-xs font-bold tracking-wide lighting-text">
              {config.developerCreditText && config.developerCreditText !== "Prshant Kumar singh , Sr.Clerk/Katihar Div."
                ? config.developerCreditText
                : "Developed & Managed by - Prashant Kumar Singh, Sr.Clerk/P/KIR"}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
