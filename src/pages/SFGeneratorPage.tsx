import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { SF1Generator } from '../components/SF1Generator';
import { SF2Generator } from '../components/SF2Generator';
import { SF3Generator } from '../components/SF3Generator';
import { SF4Generator } from '../components/SF4Generator';
import { SF11Generator } from '../components/SF11Generator';
import { SF5Generator } from '../components/SF5Generator';
import { SF14IIGenerator } from '../components/SF14IIGenerator';
import { FileText, Info, X, Clock, ExternalLink, Inbox as InboxIcon, Link as LinkIcon, Briefcase, FileSpreadsheet, Layers2, ShieldCheck, Stamp, Coins } from 'lucide-react';
import Inbox from './Inbox';
import { ClaimTaManager } from '../components/ClaimTaManager';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ApoAllotmentPage from './ApoAllotmentPage';
import { DarPositionManager } from '../components/DarPositionManager';
import HqMaterialManager from '../components/HqMaterialManager';
import { OfficePdfStamper } from '../components/OfficePdfStamper';
import { PromptIssuedSFModal } from '../components/PromptIssuedSFModal';
import { DARCirculars, ActCirculars } from './DocumentPages';

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
  const tabParam = queryParams.get('tab') as any;
  const savedTab = localStorage.getItem("lastSelectedSFTab") as any;
  const savedSubTab = localStorage.getItem("lastSelectedDARSubTab") as any;
  // fallback for legacy values in cookies/localStorage
  const fallbackTab = (savedTab === "TYPE_OF_STANDARD_FORM" || savedTab === "DAR_POSITION" || !savedTab) ? "DAR_SECTION" : savedTab;
  const initialTab = (tabParam === "TYPE_OF_STANDARD_FORM" || tabParam === "DAR_POSITION" || !tabParam) ? fallbackTab : tabParam;

  const [mainTab, setMainTab] = useState<"DAR_SECTION" | "PDF_STAMP" | "INBOX" | "OFFICE_LINKS" | "WORK_ALLOTMENT" | "OFFICE_ORDERS" | "CLAIM_TA">(
    initialTab === "HQ_MATERIAL" || initialTab === "INBOX" ? "DAR_SECTION" : initialTab
  );
  const [darSubTab, setDarSubTab] = useState<"TYPES_OF_SF" | "DAR_POSITION" | "HQ_MATERIAL" | "INBOX">(
    initialTab === "HQ_MATERIAL" 
      ? "HQ_MATERIAL" 
      : initialTab === "INBOX" 
        ? "INBOX" 
        : (savedSubTab || "TYPES_OF_SF")
  );

  const [taShowSidebars, setTaShowSidebars] = useState<boolean>(false);

  const selectDarSubTab = (sub: "TYPES_OF_SF" | "DAR_POSITION" | "HQ_MATERIAL" | "INBOX") => {
    setDarSubTab(sub);
    localStorage.setItem("lastSelectedDARSubTab", sub);
    const qParams = new URLSearchParams(location.search);
    qParams.set('tab', 'DAR_SECTION');
    qParams.set('sub', sub);
    navigate({ search: qParams.toString() }, { replace: true });
  };

  const selectMainTab = (tab: "DAR_SECTION" | "PDF_STAMP" | "INBOX" | "OFFICE_LINKS" | "WORK_ALLOTMENT" | "OFFICE_ORDERS" | "CLAIM_TA") => {
    if (tab === "INBOX") {
      setMainTab("DAR_SECTION");
      selectDarSubTab("INBOX");
      return;
    }
    setMainTab(tab);
    localStorage.setItem("lastSelectedSFTab", tab);
    const qParams = new URLSearchParams(location.search);
    qParams.set('tab', tab);
    qParams.delete('sub');
    navigate({ search: qParams.toString() }, { replace: true });
  };

  useEffect(() => {
    const qParams = new URLSearchParams(location.search);
    const tabParam = qParams.get('tab') as any;
    const subParam = qParams.get('sub') as any;
    if (tabParam) {
      if (tabParam === "TYPE_OF_STANDARD_FORM" || tabParam === "DAR_POSITION") {
        setMainTab("DAR_SECTION");
        setDarSubTab(tabParam === "TYPE_OF_STANDARD_FORM" ? "TYPES_OF_SF" : "DAR_POSITION");
      } else if (tabParam === "HQ_MATERIAL") {
        setMainTab("DAR_SECTION");
        setDarSubTab("HQ_MATERIAL");
      } else if (tabParam === "INBOX") {
        setMainTab("DAR_SECTION");
        setDarSubTab("INBOX");
      } else if (tabParam === "DAR_SECTION") {
        setMainTab("DAR_SECTION");
        if (subParam) {
          setDarSubTab(subParam);
        }
      } else {
        setMainTab(tabParam);
      }
    } else {
      const saved = localStorage.getItem("lastSelectedSFTab") as any;
      const savedSub = localStorage.getItem("lastSelectedDARSubTab") as any;
      if (saved) {
        if (saved === "TYPE_OF_STANDARD_FORM" || saved === "DAR_POSITION") {
          setMainTab("DAR_SECTION");
          setDarSubTab(saved === "TYPE_OF_STANDARD_FORM" ? "TYPES_OF_SF" : "DAR_POSITION");
        } else if (saved === "HQ_MATERIAL") {
          setMainTab("DAR_SECTION");
          setDarSubTab("HQ_MATERIAL");
        } else if (saved === "INBOX") {
          setMainTab("DAR_SECTION");
          setDarSubTab("INBOX");
        } else if (saved === "DAR_SECTION") {
          setMainTab("DAR_SECTION");
          if (savedSub) {
            setDarSubTab(savedSub);
          }
        } else {
          setMainTab(saved);
        }
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
      case "SF-3":
        return <SF3Generator onBack={() => setActiveTab("")} />;
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

  if (activeTab) {
    return (
      <div className="w-full h-screen flex flex-col bg-gray-50 overflow-hidden font-sans">
        {renderContent()}
      </div>
    );
  }

  const listTabs = [
    { id: "DAR_SECTION", label: "DAR Section", sub: "Disciplinary", icon: ShieldCheck },
    { id: "PDF_STAMP", label: "PDF Stamp Studio", sub: "Authority Seal Maker", icon: Stamp },
    { id: "INBOX", label: "Inbox", sub: "Messaging", icon: InboxIcon, badge: issuedSFs.length },
    { id: "OFFICE_LINKS", label: "Office Links", sub: "Portals", icon: LinkIcon },
    { id: "WORK_ALLOTMENT", label: t("nav_apo_allotment") || "Work Allotment", sub: "Personnel", icon: Briefcase },
    { id: "OFFICE_ORDERS", label: t("nav_circulars") || "Circulars", sub: "Office Orders", icon: FileText },
    { id: "CLAIM_TA", label: "Claim TA", sub: "Traveling Allowance", icon: Coins }
  ];

  return (
    <div className="w-full max-w-full mx-auto flex-1 flex flex-col lg:flex-row bg-gray-100 min-h-screen lg:h-[calc(100vh-4rem)] p-2 lg:p-4 gap-4 overflow-y-auto lg:overflow-hidden font-sans">
      {/* Premium left navigation vertical sidebar (Up to Down) layout */}
      <div className={`w-full lg:w-80 flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.08)] shrink-0 p-4 gap-4 backdrop-blur-md relative overflow-hidden z-30 ${
        mainTab === "CLAIM_TA" && !taShowSidebars ? "hidden" : "flex"
      }`}>
        {/* Decorative dynamic backdrop visuals */}
        <div className="absolute top-0 left-1/4 w-36 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent blur-sm animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-44 h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60" />

        {/* Console Header */}
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between gap-1 shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-700 flex items-center justify-center text-white font-extrabold text-xs shadow-md">
              NFR
            </div>
            <div>
              <h2 className="text-xs font-black text-white uppercase tracking-wider leading-none">
                Office Use Only
              </h2>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-1 block">
                Katihar Desk Console
              </span>
            </div>
          </div>
        </div>

        {/* Console Session Indicator */}
        {msLeft !== null && (
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-850 shadow-inner flex items-center justify-between gap-1.5 shrink-0 z-10">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
              <span className="text-[10px] text-slate-400 font-black tracking-wider uppercase truncate">Security Session</span>
            </div>
            <span className="text-[11px] text-red-400 tracking-wider font-mono font-bold">
              {formatFractionalTime(msLeft)}
            </span>
          </div>
        )}

        {/* Up-to-Down Vertical List Navigation Options */}
        <div className="flex flex-row lg:flex-col gap-2.5 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto scrollbar-none pb-1.5 lg:pb-0 whitespace-nowrap lg:whitespace-normal flex-1 z-10">
          {listTabs.map((tab) => {
            const isTabActive = mainTab === tab.id || (tab.id === "INBOX" && mainTab === "DAR_SECTION" && darSubTab === "INBOX");
            
            return (
              <button
                key={tab.id}
                onClick={() => selectMainTab(tab.id as any)}
                className={`relative px-4 py-2.5 rounded-xl transition-all duration-150 flex items-center gap-3 select-none group cursor-pointer shrink-0 lg:w-full text-left ${
                  isTabActive
                    ? "bg-gradient-to-b from-indigo-600 to-indigo-700 text-white shadow-[0_0_15px_rgba(99,102,241,0.3),0_3px_0_0_#4338ca,inset_0_1px_1px_rgba(255,255,255,0.25)] translate-y-[1px]"
                    : "bg-slate-950/50 hover:bg-slate-950/90 border border-slate-800 text-slate-400 hover:text-white shadow-[0_2.5px_0_0_#020617,inset_0_1px_1px_rgba(255,255,255,0.03)] hover:shadow-[0_2.5px_6px_rgba(99,102,241,0.08),0_2.5px_0_0_#020617,inset_0_1px_1px_rgba(255,255,255,0.05)] hover:-translate-y-[1.5px] active:translate-y-[0px]"
                }`}
              >
                {isTabActive && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                )}
                <tab.icon className={`w-4 h-4 shrink-0 ${isTabActive ? "text-indigo-150" : "text-slate-500 group-hover:text-indigo-400"} transition-colors`} />
                <div className="text-left font-sans leading-tight">
                  <span className={`block text-[8px] font-extrabold uppercase tracking-widest leading-none mb-0.5 ${isTabActive ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {tab.sub}
                  </span>
                  <span className="block text-xs font-black tracking-wide uppercase">
                    {tab.label}
                  </span>
                </div>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-auto bg-rose-600/90 text-rose-100 text-[10px] font-sans font-black px-1.5 py-0.5 rounded border border-rose-800 animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer / Exit Console Action Buttons */}
        <div className="border-t border-slate-850 pt-3 flex flex-row lg:flex-col gap-2 shrink-0 z-10">
          <div className="flex gap-2 w-full">
            <button
              onClick={() => {
                if (activeTab) {
                  setActiveTab("");
                } else if (mainTab !== "DAR_SECTION") {
                  selectMainTab("DAR_SECTION");
                } else {
                  navigate("/");
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-755 text-slate-250 text-[11px] font-bold px-3 py-2 rounded-xl transition-all border border-slate-705 cursor-pointer active:translate-y-[1.5px]"
              title="Go Back"
            >
              ← Back
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600/95 hover:bg-indigo-700 text-white text-[11px] font-bold px-3 py-2 rounded-xl transition-all shadow-[0_2px_0_0_#4338ca] cursor-pointer active:translate-y-[1.5px] active:shadow-none"
            >
              🏠 Home
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black py-2.5 rounded-xl transition-colors shadow-[0_2.5px_0_0_#9f1239] cursor-pointer active:translate-y-[1.5px] active:shadow-none uppercase tracking-widest"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Main Canvas Area (Right Side of Sidebar on Desktop) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto lg:overflow-hidden relative z-10 gap-4">

      {mainTab === "DAR_SECTION" && (
        <div className="flex-1 flex flex-col gap-4 overflow-hidden relative">
          {/* Sub Navigation Console under DAR SECTION */}
          <div className="flex items-center justify-start gap-2 bg-slate-200/50 p-1 rounded-xl max-w-full lg:max-w-2xl shrink-0 border border-slate-300 overflow-x-auto whitespace-nowrap scrollbar-none py-1">
            <button
              onClick={() => selectDarSubTab("TYPES_OF_SF")}
              className={`flex-1 py-1.5 px-3.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                darSubTab === "TYPES_OF_SF"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                  : "text-slate-600 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Types of SF
            </button>
            <button
              onClick={() => selectDarSubTab("DAR_POSITION")}
              className={`flex-1 py-1.5 px-3.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                darSubTab === "DAR_POSITION"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                  : "text-slate-600 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              DAR Position Register
            </button>
            <button
              onClick={() => selectDarSubTab("HQ_MATERIAL")}
              className={`flex-1 py-1.5 px-3.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                darSubTab === "HQ_MATERIAL"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                  : "text-slate-600 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              <Layers2 className="w-3.5 h-3.5" />
              HQ Material
            </button>
            <button
              onClick={() => selectDarSubTab("INBOX")}
              className={`flex-1 py-1.5 px-3.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 relative ${
                darSubTab === "INBOX"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                  : "text-slate-600 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              <InboxIcon className="w-3.5 h-3.5" />
              Inbox (संदेश)
              {issuedSFs.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  {issuedSFs.length}
                </span>
              )}
            </button>
          </div>

          {darSubTab === "TYPES_OF_SF" && (
            <div className="flex-1 flex flex-col gap-4 overflow-hidden relative">
              {/* Premium Purple Gradient 3D Navigation Bar */}
              <div className="w-full bg-gradient-to-r from-[#4C1D95] via-[#7C3AED] to-[#4C1D95] border border-white/15 shadow-2xl shrink-0 rounded-2xl overflow-hidden z-25 p-3">
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
                          className={`relative flex items-center justify-center h-12 px-3 rounded-xl cursor-pointer select-none transition-all duration-300 flex-1 group ${
                            isActive
                              ? "bg-white/20 border border-white/40 text-white font-extrabold shadow-[0_0_15px_rgba(196,181,253,0.65),0_1px_0_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.5)] translate-y-[1px]"
                              : "bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 text-white font-bold shadow-[0_3px_0_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] hover:shadow-[0_4px_12px_rgba(167,139,250,0.45),0_3px_0_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] hover:-translate-y-[2px]"
                          }`}
                        >
                          <span className="font-bold text-[12px] tracking-wider uppercase flex items-center gap-1.5 whitespace-nowrap text-center justify-center">
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

          {darSubTab === "DAR_POSITION" && (
            <div className="flex-1 bg-[#132039] border border-[#223354] rounded-2xl shadow-2xl flex flex-col overflow-hidden p-4 w-full z-10 h-full">
              <DarPositionManager />
            </div>
          )}

          {darSubTab === "HQ_MATERIAL" && (
            <div className="flex-1 overflow-hidden relative z-10 w-full h-full min-w-0">
              <HqMaterialManager />
            </div>
          )}

          {darSubTab === "INBOX" && (
            <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden relative z-10 w-full h-full min-w-0">
              <Inbox />
            </div>
          )}
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
        <div className="flex-1 bg-[#132039] border border-[#223354] rounded-xl shadow-2xl flex flex-col overflow-hidden w-full z-10 h-full relative">
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

      {mainTab === "PDF_STAMP" && (
        <div className="flex-1 overflow-hidden relative z-10 w-full h-full min-w-0">
          <OfficePdfStamper />
        </div>
      )}

      {mainTab === "CLAIM_TA" && (
        <div className={`flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col relative z-20 w-full h-full min-w-0 ${taShowSidebars ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <ClaimTaManager showSidebars={taShowSidebars} onToggleSidebars={setTaShowSidebars} />
        </div>
      )}

      {mainTab === "OFFICE_ORDERS" && (
        <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col p-6 max-w-5xl mx-auto w-full z-10 h-full min-h-[400px] overflow-y-auto">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-xl font-bold text-gray-800 uppercase flex items-center gap-2">
              <span className="w-2.5 h-6 bg-indigo-600 rounded-full inline-block"></span>
              {t("nav_circulars") || "Office Orders"} / कार्यालय आदेश
            </h2>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
              Official circulars, notifications, and orders regarding DAR procedure and apprentice cells
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="border border-slate-100 rounded-xl bg-white shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 font-extrabold text-slate-800 rounded-t-xl text-center uppercase tracking-wide text-sm">
                ⚠️ {t("nav_dar_circulars") || "D&AR Orders"}
              </div>
              <div className="px-1 py-1">
                <DARCirculars />
              </div>
            </div>
            
            <div className="border border-slate-100 rounded-xl bg-white shadow-sm overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 px-4 py-3 font-extrabold text-slate-800 rounded-t-xl text-center uppercase tracking-wide text-sm">
                🎓 {t("nav_act_circulars") || "Act Apprentice Orders"}
              </div>
              <div className="px-1 py-1">
                <ActCirculars />
              </div>
            </div>
          </div>
        </div>
      )}

      </div>

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
