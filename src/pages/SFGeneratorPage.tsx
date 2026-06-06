import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { SF1Generator } from '../components/SF1Generator';
import { SF4Generator } from '../components/SF4Generator';
import { SF11Generator } from '../components/SF11Generator';
import { SF5Generator } from '../components/SF5Generator';
import { FileText, Info, X, Clock } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<string>("");
  const [infoModalSf, setInfoModalSf] = useState<string | null>(null);
  
  const sfDescriptions = useStore((state) => state.sfDescriptions);
  const issuedSFs = useStore((state) => state.issuedSFs) || [];
  const today = new Date().toISOString().split('T')[0];

  const config = useStore((state) => state.config) as any;
  const isSfAuthenticated = useStore((state) => state.isSfAuthenticated);
  const sfAuthenticatedAt = useStore((state) => state.sfAuthenticatedAt);
  const sfLogin = useStore((state) => state.sfLogin);
  const sfLogout = useStore((state) => state.sfLogout);

  const [msLeft, setMsLeft] = useState<number | null>(null);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isSfAuthenticated || !sfAuthenticatedAt) {
      setMsLeft(null);
      return;
    }
    
    const durationMs = parseInt(config.sfSessionDuration || "30", 10) * 60 * 1000;
    
    const updateTimer = () => {
      const elapsedMs = Date.now() - new Date(sfAuthenticatedAt).getTime();
      const remainingMs = Math.max(0, durationMs - elapsedMs);
      setMsLeft(remainingMs);
      
      if (remainingMs <= 0) {
        sfLogout();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 33); // Update high-frequency for precise centisecond counting
    return () => clearInterval(interval);
  }, [isSfAuthenticated, sfAuthenticatedAt, config.sfSessionDuration, sfLogout]);

  const formatFractionalTime = (ms: number | null): string => {
    if (ms === null || ms <= 0) return "00:00.00";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');
    const cc = String(centiseconds).padStart(2, '0');
    
    return `${mm}:${ss}.${cc}`;
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctCode = config.sfPasscode || "124612";
    if (passcodeInput === correctCode) {
      sfLogin();
      setErrorMsg("");
      setPasscodeInput("");
    } else {
      setErrorMsg("Incorrect Password");
    }
  };

  const handleLogout = () => {
    sfLogout();
  };

  const getPendingHighlights = (sfType: string) => {
    return issuedSFs.filter(sf => sf.sfType === sfType && !sf.isFinalised && sf.issuedDate < today).length;
  };

  const renderContent = () => {
    if (!activeTab) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50/50">
          <div className="max-w-md mx-auto p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Select a Standard Form</h3>
            <p className="text-sm text-gray-500">
              Please choose any Standard Form from the "Types of Standard Form" list on the left to start generating.
            </p>
          </div>
        </div>
      );
    }
    switch (activeTab) {
      case "SF-1":
        return <SF1Generator />;
      case "SF-4":
        return <SF4Generator />;
      case "SF-5":
        return <SF5Generator />;
      case "SF-11":
        return <SF11Generator />;
      default:
        return <PlaceholderGenerator sf={activeTab} />;
    }
  };

  if (!isSfAuthenticated || (msLeft !== null && msLeft <= 0)) {
    return (
      <div className="w-full flex-1 flex items-center justify-center bg-gray-50/50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Office Use Only</h2>
            <p className="text-sm text-gray-500 mt-2">
              Authentication required. Enter the access password to continue.
            </p>
          </div>
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="text-left">
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                Access Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={passcodeInput}
                onChange={(e) => {
                  setPasscodeInput(e.target.value);
                  setErrorMsg("");
                }}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 text-sm font-medium ${
                  errorMsg ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                }`}
                placeholder="Enter password..."
                autoFocus
              />
              {errorMsg && (
                <p className="mt-1.5 text-xs text-red-600 font-semibold">
                  {errorMsg}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow-md transition-all uppercase tracking-wide text-sm"
            >
              Access Generator & Inbox
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1920px] mx-auto flex-1 flex flex-col bg-gray-100 h-[calc(100vh-4rem)] p-4 lg:px-8 lg:py-6 gap-6 overflow-hidden">
      {/* Top Tabs & Auth status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between shrink-0 border-b border-gray-300 pb-2 sm:pb-0 gap-3">
        <div className="flex">
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

        {/* Counter and Log Out option */}
        <div className="flex items-center gap-3 px-2 self-end sm:self-auto">
          {msLeft !== null && (
            <span className="text-xs text-gray-700 font-bold font-mono bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              Session: <span className="text-red-600 tabular-nums">{formatFractionalTime(msLeft)}</span>
            </span>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition shadow-sm uppercase tracking-wider"
          >
            Log Out
          </button>
        </div>
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
