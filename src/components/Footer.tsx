import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store/useStore';
import { PlaceholderImage } from './PlaceholderImage';

export function Footer() {
  const config = useStore((state) => state.config) as any;
  const logos = useStore((state) => state.logos) || {};
  const { t } = useTranslation();
  
  return (
    <footer className="bg-[#1c3f60] text-gray-200 mt-12 py-8 mt-auto">
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
        
        <div className="mt-4 md:mt-0 flex flex-col items-center justify-center relative w-full md:w-auto overflow-visible py-2">
          <style>{`
            @keyframes wedding-lights {
              0%, 100% { 
                color: #FFD700; 
                text-shadow: 0 0 5px #FFD700, 0 0 10px #FFD700, 0 0 15px #FF8C00;
                transform: scale(1);
              }
              50% { 
                color: #FFFDE7; 
                text-shadow: 0 0 10px #FFD700, 0 0 20px #FFD700, 0 0 30px #FFD700, 0 0 40px #FFA500;
                transform: scale(1.02);
              }
            }
          `}</style>
          
          <p className="relative z-10 font-bold text-sm md:text-base tracking-wider md:tracking-widest capitalize px-4"
             style={{ animation: "wedding-lights 2.5s infinite alternate ease-in-out" }}>
            {config.developerCreditText || 'Prshant Kumar singh , Sr.Clerk/Katihar Div.'}
          </p>
        </div>
      </div>
    </footer>
  );
}
