import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { SF1Generator } from '../components/SF1Generator';
import { SF2Generator } from '../components/SF2Generator';
import { SF4Generator } from '../components/SF4Generator';
import { SF11Generator } from '../components/SF11Generator';
import { SF5Generator } from '../components/SF5Generator';
import { SF14IIGenerator } from '../components/SF14IIGenerator';
import { FileText, Info, X, Clock, ExternalLink, Inbox as InboxIcon, Link as LinkIcon, Briefcase, FileSpreadsheet } from 'lucide-react';
import Inbox from './Inbox';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ApoAllotmentPage from './ApoAllotmentPage';
import { DarPositionManager } from '../components/DarPositionManager';
import { PromptIssuedSFModal } from '../components/PromptIssuedSFModal';

const SF_TABS = [
  "SF-1", "SF-2", "SF-3", "SF-4", "SF-5", "SF-6", "SF-7", 
  "SF-8", "SF-9", "SF-10", "SF-11", "SF-12", "SF-13", "SF-14(II)", "SF-14"
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
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab') as "TYPE_OF_STANDARD_FORM" | "INBOX" | "OFFICE_LINKS" | "WORK_ALLOTMENT" | "DAR_POSITION";
  const savedTab = localStorage.getItem("lastSelectedSFTab") as "TYPE_OF_STANDARD_FORM" | "INBOX" | "OFFICE_LINKS" | "WORK_ALLOTMENT" | "DAR_POSITION";
  const initialTab = tabParam || savedTab || "TYPE_OF_STANDARD_FORM";

  const [mainTab, setMainTab] = useState<"TYPE_OF_STANDARD_FORM" | "INBOX" | "OFFICE_LINKS" | "WORK_ALLOTMENT" | "DAR_POSITION">(initialTab);

  const selectMainTab = (tab: "TYPE_OF_STANDARD_FORM" | "INBOX" | "OFFICE_LINKS" | "WORK_ALLOTMENT" | "DAR_POSITION") => {
    setMainTab(tab);
    localStorage.setItem("lastSelectedSFTab", tab);
    const qParams = new URLSearchParams(location.search);
    qParams.set('tab', tab);
    navigate({ search: qParams.toString() }, { replace: true });
  };

  useEffect(() => {
    const qParams = new URLSearchParams(location.search);
    const tabParam = qParams.get('tab') as "TYPE_OF_STANDARD_FORM" | "INBOX" | "OFFICE_LINKS" | "WORK_ALLOTMENT" | "DAR_POSITION";
    if (tabParam) {
      setMainTab(tabParam);
    } else {
      const saved = localStorage.getItem("lastSelectedSFTab") as any;
      if (saved) {
        setMainTab(saved);
      }
    }
  }, [location.search]);

  const [activeTab, setActiveTab] = useState<string>("");
  const [infoModalSf, setInfoModalSf] = useState<string | null>(null);
  
  const sfDescriptions = useStore((state) => state.sfDescriptions);
  const issuedSFs = useStore((state) => state.issuedSFs) || [];
  const internalLinks = useStore((state) => state.internalLinks) || [];
  const pending_sf4_drafts = useStore((state) => state.pending_sf4_drafts) || [];
  const today = new Date().toISOString().split('T')[0];

  const config = useStore((state) => state.config) as any;
  const isSfAuthenticated = useStore((state) => state.isSfAuthenticated);
  const sfAuthenticatedAt = useStore((state) => state.sfAuthenticatedAt);
  const sfLogin = useStore((state) => state.sfLogin);
  const sfLogout = useStore((state) => state.sfLogout);

  const [msLeft, setMsLeft] = useState<number | null>(null);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showSessionWarning, setShowSessionWarning] = useState(false);

  useEffect(() => {
    if (!isSfAuthenticated || !sfAuthenticatedAt) {
      setMsLeft(null);
      setShowSessionWarning(false);
      return;
    }
    
    const durationMs = parseInt(config.sfSessionDuration || "30", 10) * 60 * 1000;
    
    const updateTimer = () => {
      const elapsedMs = Date.now() - new Date(sfAuthenticatedAt).getTime();
      const remainingMs = Math.max(0, durationMs - elapsedMs);
      setMsLeft(remainingMs);
      
      if (remainingMs <= 0) {
        sfLogout();
        setShowSessionWarning(false);
      } else if (remainingMs <= 60000) { // 1 minute remaining
        if (document.visibilityState === 'visible') {
          setShowSessionWarning(true);
        } else {
          setShowSessionWarning(false);
        }
      } else {
        setShowSessionWarning(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 200);
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
    let count = issuedSFs.filter(sf => sf.sfType === sfType && !sf.isFinalised && sf.issuedDate < today).length;
    if (sfType === "SF-4") {
      const pendingCount = pending_sf4_drafts.filter((d: any) => d.status === "pending").length;
      count += pendingCount;
    }
    return count;
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
        return <SF1Generator onBack={() => setActiveTab("")} />;
      case "SF-2":
        return <SF2Generator onBack={() => setActiveTab("")} />;
      case "SF-4":
        return <SF4Generator onBack={() => setActiveTab("")} />;
      case "SF-5":
        return <SF5Generator onBack={() => setActiveTab("")} />;
      case "SF-11":
        return <SF11Generator onBack={() => setActiveTab("")} />;
      case "SF-14(II)":
      case "SF-14":
        return <SF14IIGenerator onBack={() => setActiveTab("")} />;
      default:
        return <PlaceholderGenerator sf={activeTab} />;
    }
  };

  if (!isSfAuthenticated || (msLeft !== null && msLeft <= 0)) {
    return (
      <div className="w-full flex-1 flex items-center justify-center bg-gray-50/50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 shadow-xl text-center space-y-6 relative">
          <button
            onClick={() => navigate("/")}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-650 transition-colors cursor-pointer p-1 rounded-full hover:bg-gray-100"
            title="Close and return to Home"
          >
            <X className="w-6 h-6" />
          </button>
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
    <div className="w-full max-w-full mx-auto flex-1 flex flex-col bg-gray-100 h-[calc(100vh-4rem)] p-2 lg:px-4 lg:py-4 gap-4 overflow-hidden">
      {/* Premium 3D Digital Console Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 p-2.5 sm:p-3 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.08)] flex flex-col lg:flex-row lg:items-center lg:justify-between shrink-0 gap-4 relative overflow-hidden backdrop-blur-md z-30">
        {/* Dynamic decorative backdrop accents */}
        <div className="absolute top-0 left-1/4 w-36 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent blur-sm animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-44 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60" />

        {/* Counter and Log Out option (Right side, and on top in mobile) */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 px-1.5 py-1 bg-slate-950/40 border border-slate-800/80 rounded-xl shrink-0 z-10 order-1 lg:order-2 w-full lg:w-auto">
          {msLeft !== null && (
            <span className="text-[10px] sm:text-[11px] text-slate-300 font-black font-mono bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-850 shadow-inner flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]"></span>
              <Clock className="w-3 h-3 text-emerald-500" />
              SESSION: <span className="text-red-400 tracking-wider tabular-nums font-black">{formatFractionalTime(msLeft)}</span>
            </span>
          )}
          <button
            onClick={() => {
              if (activeTab) {
                setActiveTab("");
              } else if (mainTab !== "TYPE_OF_STANDARD_FORM") {
                selectMainTab("TYPE_OF_STANDARD_FORM");
              } else {
                navigate("/");
              }
            }}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-100 text-[11px] font-black px-3 py-1.5 rounded-lg transition-colors border border-slate-700 cursor-pointer active:translate-y-[2px] uppercase tracking-widest shadow-sm hover:text-white shrink-0"
            title="Go Back / पीछे जाएं"
          >
            ← Back / पीछे
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black px-3.5 py-1.5 rounded-lg transition-colors shadow-[0_2.5px_0_0_#4338ca] cursor-pointer hover:shadow-[0_4px_12px_rgba(99,102,241,0.35)] active:translate-y-[1.5px] active:shadow-none uppercase tracking-widest shrink-0"
          >
            🏠 Home
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black px-3.5 py-1.5 rounded-lg transition-colors shadow-[0_2.5px_0_0_#9f1239] cursor-pointer active:translate-y-[1.5px] active:shadow-none uppercase tracking-widest shrink-0"
          >
            Log Out
          </button>
        </div>

        {/* Tabs Container (Types Of SF, Inbox, Office Links, Work Allotment, DAR position - Left side, strictly on a single horizontal row) */}
        <div className="flex flex-row items-center justify-start gap-2 sm:gap-3 z-10 w-full lg:w-auto order-2 lg:order-1 overflow-x-auto whitespace-nowrap scrollbar-none py-1">
          {/* TAB 1: TYPE OF STANDARD FORM */}
          <button
            onClick={() => selectMainTab("TYPE_OF_STANDARD_FORM")}
            className={`relative px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-2.5 overflow-hidden select-none group cursor-pointer shrink-0 ${
              mainTab === "TYPE_OF_STANDARD_FORM"
                ? "bg-gradient-to-b from-indigo-600 to-indigo-700 text-white shadow-[0_0_15px_rgba(99,102,241,0.4),0_3px_0_0_#4338ca,inset_0_1px_1px_rgba(255,255,255,0.3)] translate-y-[1.5px]"
                : "bg-slate-950/65 hover:bg-slate-950/90 border border-slate-800 text-slate-400 hover:text-white shadow-[0_3px_0_0_#020617,inset_0_1px_1px_rgba(255,255,255,0.05)] hover:shadow-[0_3px_8px_rgba(99,102,241,0.12),0_3px_0_0_#020617,inset_0_1px_1px_rgba(255,255,255,0.08)] hover:-translate-y-[1.5px] active:translate-y-[0px] active:shadow-[0_1.5px_0_0_#020617]"
            }`}
          >
            {mainTab === "TYPE_OF_STANDARD_FORM" && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            )}
            <FileText className={`w-4 h-4 shrink-0 ${mainTab === "TYPE_OF_STANDARD_FORM" ? "text-indigo-200 animate-pulse" : "text-slate-500 group-hover:text-indigo-400"} transition-colors`} />
            <div className="text-left font-sans">
              <span className="block text-[8px] font-bold text-indigo-300 uppercase tracking-widest leading-none mb-0.5">
                Form Module
              </span>
              <span className="block text-xs font-black tracking-wide uppercase">
                Types Of SF
              </span>
            </div>
            <span className="ml-1 sm:ml-1.5 bg-slate-900/60 text-slate-400 text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-800">
              {SF_TABS.length}
            </span>
          </button>

          {/* TAB 2: INBOX */}
          <button
            onClick={() => selectMainTab("INBOX")}
            className={`relative px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-2.5 overflow-hidden select-none group cursor-pointer shrink-0 ${
              mainTab === "INBOX"
                ? "bg-gradient-to-b from-indigo-600 to-indigo-700 text-white shadow-[0_0_15px_rgba(99,102,241,0.4),0_3px_0_0_#4338ca,inset_0_1px_1px_rgba(255,255,255,0.3)] translate-y-[1.5px]"
                : "bg-slate-950/65 hover:bg-slate-950/90 border border-slate-800 text-slate-400 hover:text-white shadow-[0_3px_0_0_#020617,inset_0_1px_1px_rgba(255,255,255,0.05)] hover:shadow-[0_3px_8px_rgba(99,102,241,0.12),0_3px_0_0_#020617,inset_0_1px_1px_rgba(255,255,255,0.08)] hover:-translate-y-[1.5px] active:translate-y-[0px] active:shadow-[0_1.5px_0_0_#020617]"
            }`}
          >
            {mainTab === "INBOX" && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            )}
            <InboxIcon className={`w-4 h-4 shrink-0 ${mainTab === "INBOX" ? "text-indigo-200 animate-pulse" : "text-slate-500 group-hover:text-indigo-400"} transition-colors`} />
            <div className="text-left font-sans">
              <span className="block text-[8px] font-bold text-indigo-300 uppercase tracking-widest leading-none mb-0.5">
                Messaging
              </span>
              <span className="block text-xs font-black tracking-wide uppercase">
                Inbox
              </span>
            </div>
            {issuedSFs.length > 0 && (
              <span className="ml-1 sm:ml-1.5 bg-rose-950/80 text-rose-300 text-[10px] font-sans font-black px-1.5 py-0.5 rounded border border-rose-850 animate-pulse">
                {issuedSFs.length}
              </span>
            )}
          </button>

          {/* TAB 3: OFFICE LINKS */}
          <button
            onClick={() => selectMainTab("OFFICE_LINKS")}
            className={`relative px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-2.5 overflow-hidden select-none group cursor-pointer shrink-0 ${
              mainTab === "OFFICE_LINKS"
                ? "bg-gradient-to-b from-indigo-600 to-indigo-700 text-white shadow-[0_0_15px_rgba(99,102,241,0.4),0_3px_0_0_#4338ca,inset_0_1px_1px_rgba(255,255,255,0.3)] translate-y-[1.5px]"
                : "bg-slate-950/65 hover:bg-slate-950/90 border border-slate-800 text-slate-400 hover:text-white shadow-[0_3px_0_0_#020617,inset_0_1px_1px_rgba(255,255,255,0.05)] hover:shadow-[0_3px_8px_rgba(99,102,241,0.12),0_3px_0_0_#020617,inset_0_1px_1px_rgba(255,255,255,0.08)] hover:-translate-y-[1.5px] active:translate-y-[0px] active:shadow-[0_1.5px_0_0_#020617]"
            }`}
          >
            {mainTab === "OFFICE_LINKS" && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            )}
            <LinkIcon className={`w-4 h-4 shrink-0 ${mainTab === "OFFICE_LINKS" ? "text-indigo-200 animate-pulse" : "text-slate-500 group-hover:text-indigo-400"} transition-colors`} />
            <div className="text-left font-sans">
              <span className="block text-[8px] font-bold text-indigo-300 uppercase tracking-widest leading-none mb-0.5">
                Portals
              </span>
              <span className="block text-xs font-black tracking-wide uppercase">
                Office Links
              </span>
            </div>
            {internalLinks.length > 0 && (
              <span className="ml-1 sm:ml-1.5 bg-slate-900/60 text-slate-400 text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-800">
                {internalLinks.length}
              </span>
            )}
          </button>

          {/* TAB 4: WORK ALLOTMENT */}
          <button
            onClick={() => selectMainTab("WORK_ALLOTMENT")}
            className={`relative px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-2.5 overflow-hidden select-none group cursor-pointer shrink-0 ${
              mainTab === "WORK_ALLOTMENT"
                ? "bg-gradient-to-b from-indigo-600 to-indigo-700 text-white shadow-[0_0_15px_rgba(99,102,241,0.4),0_3px_0_0_#4338ca,inset_0_1px_1px_rgba(255,255,255,0.3)] translate-y-[1.5px]"
                : "bg-slate-950/65 hover:bg-slate-950/90 border border-slate-800 text-slate-400 hover:text-white shadow-[0_3px_0_0_#020617,inset_0_1px_1px_rgba(255,255,255,0.05)] hover:shadow-[0_3px_8px_rgba(99,102,241,0.12),0_3px_0_0_#020617,inset_0_1px_1px_rgba(255,255,255,0.08)] hover:-translate-y-[1.5px] active:translate-y-[0px] active:shadow-[0_1.5px_0_0_#020617]"
            }`}
          >
            {mainTab === "WORK_ALLOTMENT" && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            )}
            <Briefcase className={`w-4 h-4 shrink-0 ${mainTab === "WORK_ALLOTMENT" ? "text-indigo-200 animate-pulse" : "text-slate-500 group-hover:text-indigo-400"} transition-colors`} />
            <div className="text-left font-sans">
              <span className="block text-[8px] font-bold text-indigo-300 uppercase tracking-widest leading-none mb-0.5">
                Personnel
              </span>
              <span className="block text-xs font-black tracking-wide uppercase">
                {t("nav_apo_allotment")}
              </span>
            </div>
          </button>

          {/* TAB 5: DAR POSITION */}
          <button
            onClick={() => selectMainTab("DAR_POSITION")}
            className={`relative px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-2.5 overflow-hidden select-none group cursor-pointer shrink-0 ${
              mainTab === "DAR_POSITION"
                ? "bg-gradient-to-b from-[#b45309] to-[#92400e] text-white shadow-[0_0_15px_rgba(245,158,11,0.3),0_3px_0_0_#78350f,inset_0_1px_1px_rgba(255,255,255,0.3)] translate-y-[1.5px]"
                : "bg-slate-950/65 hover:bg-slate-950/90 border border-slate-800 text-slate-400 hover:text-white shadow-[0_3px_0_0_#020617,inset_0_1px_1px_rgba(255,255,255,0.05)] hover:shadow-[0_3px_8px_rgba(245,158,11,0.12),0_3px_0_0_#020617,inset_0_1px_1px_rgba(255,255,255,0.08)] hover:-translate-y-[1.5px] active:translate-y-[0px] active:shadow-[0_1.5px_0_0_#020617]"
            }`}
          >
            {mainTab === "DAR_POSITION" && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
            )}
            <FileSpreadsheet className={`w-4 h-4 shrink-0 ${mainTab === "DAR_POSITION" ? "text-amber-200 animate-pulse" : "text-slate-500 group-hover:text-amber-450"} transition-colors`} />
            <div className="text-left font-sans">
              <span className="block text-[8px] font-bold text-amber-300 uppercase tracking-widest leading-none mb-0.5">
                Disciplinary
              </span>
              <span className="block text-xs font-black tracking-wide uppercase">
                DAR Position
              </span>
            </div>
          </button>
        </div>
      </div>

      {mainTab === "TYPE_OF_STANDARD_FORM" && (
        <div className="flex-1 flex flex-col gap-6 overflow-hidden relative">
          {/* Premium Purple Gradient 3D Navigation Bar */}
          <div className="w-full bg-gradient-to-r from-[#4C1D95] via-[#7C3AED] to-[#4C1D95] border border-white/15 shadow-2xl shrink-0 rounded-2xl overflow-hidden z-20 p-4">
            <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              <div className="flex items-center justify-between min-w-[1240px] gap-3 px-1 py-1">
                {SF_TABS.map((sf) => {
                  const label = sf.replace('-', ' '); // "SF-1" -> "SF 1"
                  const isActive = activeTab === sf;
                  const pendingCount = getPendingHighlights(sf);
                  const hasPending = pendingCount > 0;
                  
                  return (
                    <div
                      key={sf}
                      onClick={() => setActiveTab(sf)}
                      className={`relative flex items-center justify-center h-14 px-3.5 rounded-xl cursor-pointer select-none transition-all duration-300 flex-1 group ${
                        isActive
                          ? "bg-white/20 border border-white/40 text-white font-extrabold shadow-[0_0_15px_rgba(196,181,253,0.65),0_1px_0_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.5)] translate-y-[1px]"
                          : "bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 text-white font-bold shadow-[0_3px_0_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_4px_12px_rgba(167,139,250,0.45),0_3px_0_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] hover:-translate-y-[2px]"
                      }`}
                    >
                      <span className="font-bold text-[13px] tracking-wider uppercase flex items-center gap-1.5 whitespace-nowrap text-center justify-center">
                        {label}
                        {hasPending && (
                          <span className={sf === "SF-4" ? "inline-flex items-center justify-center w-5 h-5 bg-red-600 rounded-full text-[11px] text-white font-extrabold animate-pulse ring-2 ring-white shadow-[0_0_8px_rgba(239,68,68,0.9)]" : "inline-flex items-center justify-center w-4 h-4 bg-red-500 rounded-full text-[10px] text-white font-black animate-pulse"}>
                            {sf === "SF-4" ? pendingCount : "!"}
                          </span>
                        )}
                      </span>
                      
                      {/* Interactive Help Trigger */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setInfoModalSf(sf);
                        }}
                        className={`ml-1.5 p-0.5 rounded-full transition-all duration-200 focus:outline-none z-30 ${
                          isActive 
                            ? "text-white hover:bg-white/20" 
                            : "opacity-40 group-hover:opacity-100 text-white/70 hover:text-white hover:bg-white/15"
                        }`}
                        title={`Info about ${sf}`}
                      >
                        <Info size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
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

      {mainTab === "OFFICE_LINKS" && (
        <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-y-auto p-6 max-w-5xl mx-auto w-full z-10 h-full min-h-[400px]">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-xl font-bold text-gray-800 uppercase flex items-center gap-2">
              <span className="w-2.5 h-6 bg-emerald-600 rounded-full inline-block"></span>
              Internal / Office Links
            </h2>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
              Confidential division portal links for registered staff & clerk desks
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(internalLinks || []).map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-emerald-400 hover:bg-emerald-50/20 transition-all duration-300 group"
              >
                <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div className="overflow-hidden flex-1">
                  <h3 className="font-bold text-base text-gray-800 group-hover:text-emerald-700 transition-colors leading-snug truncate uppercase tracking-wide">
                    {link.name}
                  </h3>
                  <p className="text-xs font-mono text-gray-400 mt-1.5 truncate">
                    {link.url}
                  </p>
                </div>
              </a>
            ))}
            {(!internalLinks || internalLinks.length === 0) && (
              <div className="text-center p-12 text-gray-400 font-medium col-span-full">
                No internal links configured yet.
              </div>
            )}
          </div>
        </div>
      )}

      {mainTab === "WORK_ALLOTMENT" && (
        <div className="flex-1 bg-slate-950 border border-slate-850 rounded-xl shadow-2xl flex flex-col overflow-hidden w-full z-10 h-full relative">
          {/* Subheader */}
          <div className="bg-slate-900 border-b border-slate-850 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-5 bg-violet-600 rounded-full inline-block animate-pulse"></span>
                {t("nav_apo_allotment")} - Interactive Diagram
              </h2>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <ApoAllotmentPage isEmbedded={true} />
          </div>
        </div>
      )}

      {mainTab === "DAR_POSITION" && (
        <div className="flex-1 bg-slate-950 border border-slate-850 rounded-2xl shadow-2xl flex flex-col overflow-hidden p-4 w-full z-10 h-full">
          <DarPositionManager />
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

      {/* 3D Prompt Dispatch Audit Modal */}
      <PromptIssuedSFModal />

      {/* Session Expiring Soon Security Warning Modal */}
      {showSessionWarning && msLeft !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 font-sans">
          <div className="bg-white rounded-3xl border border-red-100 shadow-[0_25px_50px_-12px_rgba(220,38,38,0.25)] p-8 max-w-md w-full relative overflow-hidden space-y-6 transform scale-100 transition-all">
            {/* Ambient red header accent */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-red-100 animate-pulse">
                <Clock className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                  Session Security Timeout
                </h2>
                <h3 className="text-lg font-medium text-red-600">
                  सत्र समाप्त होने वाला है!
                </h3>
              </div>
              
              <p className="text-sm text-gray-600 leading-relaxed">
                Your secure Office Use session will automatically log out in{" "}
                <span className="font-extrabold text-red-600 text-lg tabular-nums">
                  {Math.ceil(msLeft / 1000)}
                </span>{" "}
                seconds due to inactivity. Do you want to stay logged in?
              </p>
              
              <p className="text-xs text-gray-400">
                सुरक्षा कारणों से आपकी वर्तमान लॉगिन अवधि समाप्त हो रही है। क्या आप काम जारी रखना चाहते हैं?
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => {
                  sfLogin();
                  setShowSessionWarning(false);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl shadow-lg transition-all uppercase tracking-wider text-sm cursor-pointer"
              >
                Yes, Keep Working / काम जारी रखें
              </button>
              
              <button
                onClick={() => {
                  sfLogout();
                  setShowSessionWarning(false);
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 font-bold py-2.5 rounded-xl transition-all uppercase tracking-wider text-xs cursor-pointer text-center"
              >
                Logout Now / लॉग आउट करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
