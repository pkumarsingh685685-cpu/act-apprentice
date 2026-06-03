import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { SF1Generator } from '../components/SF1Generator';
import { SF11Generator } from '../components/SF11Generator';
import { FileText, Info, X } from 'lucide-react';
import Inbox from './Inbox';
import { useLocation } from 'react-router-dom';

const SF_TABS = [
  "SF-1", "SF-2", "SF-3", "SF-4", "SF-5", "SF-6", "SF-7", 
  "SF-8", "SF-9", "SF-10", "SF-11", "SF-12", "SF-13", "SF-14"
];

function PlaceholderGenerator({ sf }: { sf: string }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 p-8 text-gray-500">
      <div className="text-center">
        <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">{sf} Generator</h2>
        <p>This standard form generator is currently under development.</p>
      </div>
    </div>
  );
}

export default function SFGeneratorPage() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') as "TYPE_OF_STANDARD_FORM" | "INBOX" || "TYPE_OF_STANDARD_FORM";

  const [mainTab, setMainTab] = useState<"TYPE_OF_STANDARD_FORM" | "INBOX">(initialTab);
  const [activeTab, setActiveTab] = useState<string>("SF-1");
  const [infoModalSf, setInfoModalSf] = useState<string | null>(null);
  
  const sfDescriptions = useStore((state) => state.sfDescriptions);
  const issuedSFs = useStore((state) => state.issuedSFs) || [];
  const today = new Date().toISOString().split('T')[0];

  const getPendingHighlights = (sfType: string) => {
    return issuedSFs.filter(sf => sf.sfType === sfType && !sf.isFinalised && sf.issuedDate < today).length;
  };

  const renderContent = () => {
    switch (activeTab) {
      case "SF-1":
        return <SF1Generator />;
      case "SF-11":
        return <SF11Generator />;
      default:
        return <PlaceholderGenerator sf={activeTab} />;
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto flex-1 flex flex-col bg-gray-100 h-[calc(100vh-4rem)] p-4 lg:px-8 lg:py-6 gap-6 overflow-hidden">
      {/* Top Tabs */}
      <div className="flex shrink-0 border-b border-gray-300">
        <button
          onClick={() => setMainTab("TYPE_OF_STANDARD_FORM")}
          className={`px-8 py-3 font-bold text-sm transition-colors uppercase ${
            mainTab === "TYPE_OF_STANDARD_FORM"
              ? "text-blue-700 border-b-[3px] border-blue-700 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] rounded-t-lg"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
          }`}
        >
          Type of Standard Form
        </button>
        <button
          onClick={() => setMainTab("INBOX")}
          className={`px-8 py-3 font-bold text-sm transition-colors uppercase ${
            mainTab === "INBOX"
              ? "text-blue-700 border-b-[3px] border-blue-700 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] rounded-t-lg"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
          } ml-2`}
        >
          Inbox
        </button>
      </div>

      {mainTab === "TYPE_OF_STANDARD_FORM" && (
        <div className="flex-1 flex flex-col xl:flex-row gap-6 overflow-hidden relative">
          {/* Sidebar with Tabs */}
          <div className="w-full xl:w-64 shrink-0 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col z-20 overflow-hidden">
            <div className="bg-[#152060] text-white p-4 font-bold text-sm text-center uppercase tracking-wide">
              Types of Standard Form
            </div>
            <div className="flex-1 overflow-y-auto bg-[#e7cfb4] p-3">
              <ul className="flex flex-col gap-3">
                {SF_TABS.map((sf) => {
                  const pendingCount = getPendingHighlights(sf);
                  const hasPending = pendingCount > 0;
                  
                  return (
                  <li key={sf} className="relative">
                    {hasPending && (
                      <div className="absolute -inset-1 bg-red-400 rounded-lg animate-pulse opacity-50 z-0"></div>
                    )}
                    <div 
                      className={`relative z-10 flex items-center justify-between p-3 cursor-pointer transition-all border rounded-lg shadow-sm ${
                        activeTab === sf 
                          ? 'bg-blue-600 text-white border-blue-700 font-bold scale-[1.02]' 
                          : 'bg-[#fcf8f2] text-gray-800 border-[#d1b89d] hover:bg-white hover:border-gray-300'
                      }`}
                      onClick={() => setActiveTab(sf)}
                    >
                      <span className="font-semibold flex items-center gap-2">
                        {sf}
                        {hasPending && (
                           <span className="flex items-center justify-center min-w-[20px] h-5 bg-red-600 border border-white text-white rounded-full text-xs font-bold animate-bounce shadow-md px-1" title={`${pendingCount} Pending Final Issue`}>
                             ! 
                           </span>
                        )}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setInfoModalSf(sf);
                        }}
                        className={`p-1 rounded-full transition-colors tooltip-trigger ${
                          activeTab === sf ? 'text-white hover:bg-blue-700' : 'text-blue-600 hover:bg-blue-100'
                        }`}
                        title={`Info about ${sf}`}
                      >
                        <Info size={16} />
                      </button>
                    </div>
                  </li>
                )})}
              </ul>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden relative z-10 w-full h-full min-w-0">
            {renderContent()}
          </div>
        </div>
      )}

      {mainTab === "INBOX" && (
        <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden relative z-10 w-full h-full min-w-0 max-w-5xl mx-auto">
          <Inbox />
        </div>
      )}

      {/* Info Modal */}
      {infoModalSf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full relative">
            <button 
              onClick={() => setInfoModalSf(null)} 
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-800"
            >
              <X size={20} />
            </button>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                <Info className="text-blue-600" /> {infoModalSf} Details
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {sfDescriptions[infoModalSf] || 'No description available for this form.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
