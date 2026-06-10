import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NfrOrgMap } from '../components/NfrOrgMap';
import { Info, HelpCircle, Map, Landmark, Award, ShieldAlert } from 'lucide-react';
import { SEO } from '../components/SEO';

export default function About() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const [activeTab, setActiveTab] = useState<'info' | 'org_map'>('info');

  return (
    <div className="w-full px-4 py-8 max-w-7xl mx-auto">
      <SEO title="About Us | Personnel Branch KIR" />
      
      {/* Tab Navigation buttons */}
      <div className="flex border-b border-gray-200 mb-6 bg-gray-50 p-1.5 rounded-xl border">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'info'
              ? 'bg-[#1c3f60] text-white shadow-md'
              : 'text-gray-600 hover:text-[#1c3f60] hover:bg-white'
          }`}
          id="btn-about-info"
        >
          <Landmark size={18} />
          {currentLang === 'hi' ? 'अधिनियम शिक्षु सेल के बारे में' : 'About ACT Apprentice Cell'}
        </button>
        <button
          onClick={() => setActiveTab('org_map')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition-all ${
            activeTab === 'org_map'
              ? 'bg-[#1c3f60] text-white shadow-md'
              : 'text-gray-600 hover:text-[#1c3f60] hover:bg-white'
          }`}
          id="btn-about-org-map"
        >
          <Map size={18} />
          {currentLang === 'hi' ? 'NFR संगठन एवं कार्यशाला मानचित्र' : 'NFR Organization & Workshop Map'}
        </button>
      </div>

      {activeTab === 'info' ? (
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden text-gray-800 leading-relaxed transition-all">
          <div className="bg-[#1c3f60] p-6 text-white border-b-4 border-[#e31837] flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2.5">
                <Landmark size={24} className="text-amber-400" />
                {t('about_title')}
              </h1>
              <p className="text-xs text-blue-200 mt-1 uppercase tracking-widest font-semibold">
                Personnel Branch - Katihar Division (NFR)
              </p>
            </div>
            <Award size={36} className="text-amber-400/80 hidden sm:block shrink-0" />
          </div>
          
          <div className="p-6 md:p-8 space-y-8 text-sm md:text-base">
            <div className="prose max-w-none text-gray-700 space-y-4">
              <p className="leading-relaxed first-letter:text-3xl first-letter:font-bold first-letter:text-[#1c3f60] first-letter:mr-1">
                {t('about_p1')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h2 className="text-lg font-bold text-[#1c3f60] mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-red-600 rounded-full inline-block" />
                  {t('about_h_objective')}
                </h2>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                  {t('about_p2')}
                </p>
              </div>

              <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h2 className="text-lg font-bold text-[#1c3f60] mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block" />
                  {t('about_h_location')}
                </h2>
                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                  {t('about_p3')}
                </p>
              </div>
            </div>

            <div className="bg-amber-50 border-2 border-amber-200/60 rounded-xl p-5 mt-8 flex items-start gap-4">
              <div className="bg-amber-100 p-2 rounded-lg text-amber-700 shrink-0">
                <ShieldAlert size={20} className="animate-pulse" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-wider text-amber-800 block">
                  Official Advisory Note
                </span>
                <p className="text-amber-900 text-sm font-semibold leading-relaxed">
                  {t('about_alert')}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="transition-all animate-fade-in">
          <NfrOrgMap />
        </div>
      )}
    </div>
  );
}
