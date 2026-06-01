import React from 'react';
import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();
  return (
    <div className="w-full px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden text-gray-800 leading-relaxed">
         <div className="bg-[#1c3f60] p-6 text-white border-b-4 border-[#e31837]">
          <h1 className="text-2xl font-bold">{t('about_title')}</h1>
        </div>
        
        <div className="p-6 md:p-8 space-y-6 text-sm md:text-base">
          <p>
            {t('about_p1')}
          </p>

          <h2 className="text-xl font-bold text-[#1c3f60] mt-8 mb-4 border-b pb-2">{t('about_h_objective')}</h2>
          <p>
            {t('about_p2')}
          </p>

          <h2 className="text-xl font-bold text-[#1c3f60] mt-8 mb-4 border-b pb-2">{t('about_h_location')}</h2>
          <p>
            {t('about_p3')}
          </p>

          <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mt-8 flex items-start gap-3">
             <div className="text-blue-600 shrink-0 mt-1">ℹ️</div>
             <p className="text-blue-900 text-sm font-medium">
               {t('about_alert')}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
