import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { SF1Generator } from '../components/SF1Generator';
import { SF2Generator } from '../components/SF2Generator';
import { SF3Generator } from '../components/SF3Generator';
import { SF4Generator } from '../components/SF4Generator';
import { SF11Generator } from '../components/SF11Generator';
import { SF5Generator } from '../components/SF5Generator';
import { SF14IIGenerator } from '../components/SF14IIGenerator';
import { FileText, Info, X, Clock, ExternalLink, Inbox as InboxIcon, Link as LinkIcon, Briefcase, FileSpreadsheet, Layers2, ShieldCheck, Stamp, Coins, Download } from 'lucide-react';
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
import { DocumentPanel } from '../components/DocumentPanel';
import { DocumentItem } from '../types';
import RailwaySignalSelectionIndicator from '../components/RailwaySignalSelectionIndicator';
// Standard Form categories
const SF_BREADCRUMBS: Record<string, string> = {
  "SF-1": "Standard Form No.1 - Order of Suspension",
  "SF-2": "Standard Form No.2 - Deemed Suspension",
  "SF-3": "Standard Form No.3 - Certificate of Halting",
  "SF-4": "Standard Form No.4 - Revocation Order",
  "SF-5": "Standard Form No.5 - Major Penalty Charge Sheet",
  "SF-11": "Standard Form No.11 - Minor Penalty Charge Sheet",
  "hq_materials": "HQ SOP Guides & Procedural Materials",
  "claim_ta": "Personnel Claim TA / Journey Bill Manager",
  "dar_positions": "Integrated Active DAR Position List",
  "stamp": "Office Stamp & PDF Stamp Signatures Mode"
};

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
  const initialTab = !tabParam ? "" : ((tabParam === "TYPE_OF_STANDARD_FORM" || tabParam === "DAR_POSITION") ? "DAR_SECTION" : tabParam);

  const [mainTab, setMainTab] = useState<"DAR_SECTION" | "PDF_STAMP" | "INBOX" | "OFFICE_LINKS" | "WORK_ALLOTMENT" | "OFFICE_ORDERS" | "CLAIM_TA" | "">(
    initialTab === "HQ_MATERIAL" || initialTab === "INBOX" ? "DAR_SECTION" : initialTab
  );
  const [darSubTab, setDarSubTab] = useState<"TYPES_OF_SF" | "DAR_POSITION" | "HQ_MATERIAL" | "INBOX">(
    initialTab === "HQ_MATERIAL" 
      ? "HQ_MATERIAL" 
      : initialTab === "INBOX" 
        ? "INBOX" 
        : "TYPES_OF_SF"
  );

  const [taShowSidebars, setTaShowSidebars] = useState<boolean>(true);

  const selectDarSubTab = (sub: "TYPES_OF_SF" | "DAR_POSITION" | "HQ_MATERIAL" | "INBOX") => {
    setDarSubTab(sub);
    const qParams = new URLSearchParams(location.search);
    qParams.set('tab', 'DAR_SECTION');
    qParams.set('sub', sub);
    navigate({ search: qParams.toString() }, { replace: true });
  };

  const selectMainTab = (tab: "DAR_SECTION" | "PDF_STAMP" | "INBOX" | "OFFICE_LINKS" | "WORK_ALLOTMENT" | "OFFICE_ORDERS" | "CLAIM_TA" | "") => {
    setActiveTab(""); // Reset active form tab so prompt is shown
    if (tab === "INBOX") {
      setMainTab("DAR_SECTION");
      selectDarSubTab("INBOX");
      return;
    }
    setMainTab(tab);
    if (tab === "CLAIM_TA") {
      setTaShowSidebars(true);
    }
    const qParams = new URLSearchParams(location.search);
    if (tab) {
      qParams.set('tab', tab);
    } else {
      qParams.delete('tab');
    }
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
        } else {
          setDarSubTab("TYPES_OF_SF");
        }
      } else {
        setMainTab(tabParam);
      }
    } else {
      setMainTab("");
      setDarSubTab("TYPES_OF_SF");
      setActiveTab("");
    }
  }, [location.search]);

  const [activeTab, setActiveTab] = useState<string>("");
  const [infoModalSf, setInfoModalSf] = useState<string | null>(null);
  
  // Active/full-screen states for different modules
  const [stampActive, setStampActive] = useState<boolean>(false);
  const [allotmentActive, setAllotmentActive] = useState<boolean>(false);
  const [activeLink, setActiveLink] = useState<{ id: string; name: string; url: string } | null>(null);
  const [activeCircular, setActiveCircular] = useState<DocumentItem | null>(null);
  
  const sfDescriptions = useStore((state) => state.sfDescriptions);
  const issuedSFs = useStore((state) => state.issuedSFs) || [];
  const internalLinks = useStore((state) => state.internalLinks) || [];
  const darCirculars = useStore((state) => state.darCirculars) || [];
  const actCirculars = useStore((state) => state.actCirculars) || [];
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
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#070B14] min-h-[500px]">
          <RailwaySignalSelectionIndicator />
          <div className="mt-4 text-center">
            <h3 className="text-sm font-black tracking-widest text-[#5DE7FF] uppercase">
              Railway Standard Form (SF) Console
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Select any Standard Form tab above to begin drafting disciplinary documentation
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
            <h2 className="text-2xl font-bold text-gray-800">Office Dashboard</h2>
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

  interface TabItem {
    id: string;
    label: string;
    sub: string;
    icon: any;
    badge?: number;
  }

  const listTabs: TabItem[] = [
    { id: "DAR_SECTION", label: "DAR Section", sub: "Disciplinary", icon: ShieldCheck },
    { id: "PDF_STAMP", label: "PDF Stamp Studio", sub: "Authority Seal Maker", icon: Stamp },
    { id: "OFFICE_LINKS", label: "Office Links", sub: "Portals", icon: LinkIcon },
    { id: "WORK_ALLOTMENT", label: t("nav_apo_allotment") || "Work Allotment", sub: "Personnel", icon: Briefcase },
    { id: "OFFICE_ORDERS", label: t("nav_circulars") || "Circulars", sub: "Office Orders", icon: FileText },
    { id: "CLAIM_TA", label: "Claim TA", sub: "Traveling Allowance", icon: Coins }
  ];

  const isSidebarHidden =
    (mainTab === "DAR_SECTION" && darSubTab === "TYPES_OF_SF" && activeTab !== "") ||
    (mainTab === "PDF_STAMP" && stampActive) ||
    (mainTab === "WORK_ALLOTMENT" && allotmentActive) ||
    (mainTab === "CLAIM_TA" && !taShowSidebars) ||
    (mainTab === "OFFICE_LINKS" && activeLink !== null) ||
    (mainTab === "OFFICE_ORDERS" && activeCircular !== null);

  return (
    <div className="w-full max-w-full mx-auto flex-1 flex flex-col lg:flex-row bg-gray-100 min-h-screen lg:h-[calc(100vh-4rem)] p-2 lg:p-4 gap-4 overflow-y-auto lg:overflow-hidden font-sans">
      {/* Premium left navigation vertical sidebar (Up to Down) layout */}
      <div className={`w-full lg:w-80 flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.08)] shrink-0 p-4 gap-4 backdrop-blur-md relative overflow-hidden z-30 ${
        isSidebarHidden ? "hidden" : "flex"
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
              <h2 className="text-xs font-black text-white tracking-wider leading-none">
                Office Dashboard
              </h2>
              <span className="text-[9px] text-slate-400 font-extrabold tracking-widest mt-1 block">
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
              <span className="text-[10px] text-slate-400 font-black tracking-wider truncate">Security Session</span>
            </div>
            <span className="text-[11px] text-red-400 tracking-wider font-mono font-bold">
              {formatFractionalTime(msLeft)}
            </span>
          </div>
        )}

        {/* Console Navigation Action Buttons (Moved to the Top as requested with high visibility Back button) */}
        <div className="flex flex-col gap-2 shrink-0 z-10 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Glowing laser underline */}
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
          
          <div className="flex gap-2 w-full">
            <button
              onClick={() => {
                if (activeTab) {
                  setActiveTab("");
                } else if (mainTab !== "") {
                  selectMainTab("");
                } else {
                  navigate("/");
                }
              }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-black px-3 py-2 rounded-xl border-2 border-yellow-500 shadow-[0_3.5px_0_0_#a16207,0_4px_12px_rgba(234,179,8,0.3)] transition-all cursor-pointer hover:scale-[1.02] active:translate-y-[2px] active:shadow-none"
              title="Go Back"
            >
              ← Back
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold px-3 py-2 rounded-xl border border-slate-705 transition-all shadow-[0_3px_0_0_#020617] cursor-pointer hover:scale-[1.02] active:translate-y-[2px] active:shadow-none"
            >
              🏠 Home
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-black py-2 rounded-xl transition-all shadow-[0_3px_0_0_#9f1239,0_4px_12px_rgba(239,68,68,0.2)] cursor-pointer hover:scale-[1.01] active:translate-y-[2px] active:shadow-none tracking-wider uppercase"
          >
            Log out
          </button>
        </div>

        {/* Divider above categories */}
        <div className="border-t border-slate-850/80 my-0.5 shrink-0" />

        {/* Up-to-Down Vertical List Navigation Options (High Fidelity 4D Dynamic Tactile Buttons, Reduced Spacing and Heights) */}
        <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto scrollbar-none pb-1 lg:pb-0 whitespace-nowrap lg:whitespace-normal flex-1 z-10">
          {listTabs.map((tab) => {
            const isTabActive = mainTab === tab.id || (tab.id === "INBOX" && mainTab === "DAR_SECTION" && darSubTab === "INBOX");
            
            // Dynamic custom 4D themes for each dashboard button to make them visually magnificent
            let activeStyle = "";
            let inactiveStyle = "";
            let neonDotColor = "";
            
            switch (tab.id) {
              case "DAR_SECTION":
                activeStyle = "bg-gradient-to-r from-indigo-650 via-blue-600 to-blue-700 text-white border border-blue-500 shadow-[0_4px_12px_rgba(59,130,246,0.3),0_2.5px_0_0_#1e3a8a,inset_0_1.5px_2px_rgba(255,255,255,0.35)]";
                inactiveStyle = "bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-blue-500/50 text-slate-350 hover:text-white shadow-[0_2.5px_0_0_#020617,inset_0_1px_1px_rgba(255,255,255,0.03)] hover:shadow-[0_4px_10px_rgba(59,130,246,0.12),0_2.5px_0_0_#1e3a8a,inset_0_1px_1.5px_rgba(255,255,255,0.05)]";
                neonDotColor = "bg-blue-400";
                break;
              case "PDF_STAMP":
                activeStyle = "bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 text-white border border-teal-500 shadow-[0_4px_12px_rgba(20,184,166,0.3),0_2.5px_0_0_#064e3b,inset_0_1.5px_2px_rgba(255,255,255,0.35)]";
                inactiveStyle = "bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-emerald-500/50 text-slate-350 hover:text-white shadow-[0_2.5px_0_0_#020617,inset_0_1px_1px_rgba(255,255,255,0.03)] hover:shadow-[0_4px_10px_rgba(20,184,166,0.12),0_2.5px_0_0_#064e3b,inset_0_1px_1.5px_rgba(255,255,255,0.05)]";
                neonDotColor = "bg-emerald-400";
                break;
              case "OFFICE_LINKS":
                activeStyle = "bg-gradient-to-r from-cyan-600 via-sky-600 to-sky-700 text-white border border-sky-500 shadow-[0_4px_12px_rgba(6,182,212,0.3),0_2.5px_0_0_#083344,inset_0_1.5px_2px_rgba(255,255,255,0.35)]";
                inactiveStyle = "bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-cyan-500/50 text-slate-350 hover:text-white shadow-[0_2.5px_0_0_#020617,inset_0_1px_1px_rgba(255,255,255,0.03)] hover:shadow-[0_4px_10px_rgba(6,182,212,0.12),0_2.5px_0_0_#083344,inset_0_1px_1.5px_rgba(255,255,255,0.05)]";
                neonDotColor = "bg-cyan-400";
                break;
              case "WORK_ALLOTMENT":
                activeStyle = "bg-gradient-to-r from-amber-500 via-orange-500 to-orange-655 text-white border border-orange-400 shadow-[0_4px_12px_rgba(245,158,11,0.3),0_2.5px_0_0_#78350f,inset_0_1.5px_2px_rgba(255,255,255,0.35)]";
                inactiveStyle = "bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/50 text-slate-350 hover:text-white shadow-[0_2.5px_0_0_#020617,inset_0_1px_1px_rgba(255,255,255,0.03)] hover:shadow-[0_4px_10px_rgba(245,158,11,0.12),0_2.5px_0_0_#78350f,inset_0_1px_1.5px_rgba(255,255,255,0.05)]";
                neonDotColor = "bg-amber-400";
                break;
              case "OFFICE_ORDERS":
                activeStyle = "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-fuchsia-700 text-white border border-fuchsia-500 shadow-[0_4px_12px_rgba(217,70,239,0.3),0_2.5px_0_0_#581c87,inset_0_1.5px_2px_rgba(255,255,255,0.35)]";
                inactiveStyle = "bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-fuchsia-500/50 text-slate-350 hover:text-white shadow-[0_2.5px_0_0_#020617,inset_0_1px_1px_rgba(255,255,255,0.03)] hover:shadow-[0_4px_10px_rgba(217,70,239,0.12),0_2.5px_0_0_#581c87,inset_0_1px_1.5px_rgba(255,255,255,0.05)]";
                neonDotColor = "bg-fuchsia-400";
                break;
              default: // CLAIM_TA
                activeStyle = "bg-gradient-to-r from-violet-600 via-purple-600 to-purple-700 text-white border border-purple-500 shadow-[0_4px_12px_rgba(168,85,247,0.3),0_2.5px_0_0_#3b0764,inset_0_1.5px_2px_rgba(255,255,255,0.35)]";
                inactiveStyle = "bg-slate-950/60 hover:bg-slate-900 border border-slate-800/80 hover:border-purple-500/50 text-slate-350 hover:text-white shadow-[0_2.5px_0_0_#020617,inset_0_1px_1px_rgba(255,255,255,0.03)] hover:shadow-[0_4px_10px_rgba(168,85,247,0.12),0_2.5px_0_0_#3b0764,inset_0_1px_1.5px_rgba(255,255,255,0.05)]";
                neonDotColor = "bg-purple-400";
                break;
            }

            return (
              <button
                key={tab.id}
                onClick={() => selectMainTab(tab.id as any)}
                className={`relative px-3 py-1.5 rounded-xl flex items-center gap-2.5 select-none group cursor-pointer shrink-0 lg:w-full text-left transition-all duration-150 hover:scale-[1.01] hover:-translate-y-[0.5px] active:translate-y-[1.5px] active:scale-[0.99] ${
                  isTabActive ? activeStyle : inactiveStyle
                }`}
              >
                {/* 4D ambient particle glow marker */}
                {isTabActive && (
                  <span className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 ${neonDotColor} rounded-full animate-pulse shadow-[0_0_6px_currentColor]`} />
                )}
                
                {/* Beautiful tactile icon container */}
                <div className={`p-1.5 rounded-lg transition-all duration-200 ${
                  isTabActive 
                    ? "bg-white/15 text-white scale-105 shadow-inner" 
                    : "bg-slate-950/80 text-slate-400 group-hover:text-white group-hover:bg-slate-850"
                }`}>
                  <tab.icon className="w-4 h-4 shrink-0" />
                </div>

                <div className="text-left font-sans leading-tight">
                  <span className={`block text-[7px] font-black tracking-widest uppercase leading-none mb-0.5 ${
                    isTabActive ? 'text-white/80' : 'text-slate-500 group-hover:text-slate-400'
                  }`}>
                    {tab.sub}
                  </span>
                  <span className={`block text-[11px] font-extrabold tracking-wide ${
                    isTabActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                  }`}>
                    {tab.label}
                  </span>
                </div>
                
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-auto bg-rose-600 text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full border border-rose-500 animate-pulse shadow-md">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Canvas Area (Right Side of Sidebar on Desktop) */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto lg:overflow-hidden relative z-10 gap-4">

      {mainTab === "" && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#070B14] border border-slate-800 rounded-2xl min-h-[500px]">
          <RailwaySignalSelectionIndicator />
        </div>
      )}

      {mainTab === "DAR_SECTION" && (
        <div className="flex-1 flex flex-col gap-4 overflow-hidden relative">
          {/* Sub Navigation Console under DAR SECTION */}
          {activeTab === "" && (
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
          )}

          {darSubTab === "TYPES_OF_SF" && (
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto lg:overflow-hidden relative">
              {/* Premium Purple Gradient 3D Navigation Bar - 2-3 Row Spacious Grid View */}
              {activeTab === "" && (
                <div className="w-full bg-gradient-to-r from-[#4C1D95] via-[#7C3AED] to-[#4C1D95] border border-white/15 shadow-2xl shrink-0 rounded-2xl p-4 z-25">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3.5 w-full">
                    {SF_TABS.map((sf) => {
                      const label = sf.replace('-', ' '); // "SF-1" -> "SF 1"
                      const isActive = activeTab === sf;
                      const pendingCount = getPendingHighlights(sf);
                      const hasPending = pendingCount > 0;
                      
                      return (
                        <div
                          key={sf}
                          onClick={() => setActiveTab(sf)}
                          className={`relative flex items-center justify-center h-16 md:h-20 px-4 rounded-xl cursor-pointer select-none transition-all duration-300 group ${
                            isActive
                              ? "bg-white/20 border-2 border-white/60 text-white font-black shadow-[0_0_24px_rgba(196,181,253,0.95),0_3px_0_rgba(0,0,0,0.3),inset_0_1.5px_2px_rgba(255,255,255,0.7)] translate-y-[2px]"
                              : "bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/40 text-white font-extrabold shadow-[0_5px_0_rgba(0,0,0,0.4),inset_0_1.5px_0_rgba(255,255,255,0.3)] hover:shadow-[0_8px_20px_rgba(167,139,250,0.7),0_5px_0_rgba(0,0,0,0.4),inset_0_1.5px_0_rgba(255,255,255,0.4)] hover:-translate-y-[3px] active:translate-y-[2px] active:shadow-[0_2px_0_rgba(0,0,0,0.4)]"
                          }`}
                        >
                          <span className="font-black text-sm sm:text-base md:text-[18px] tracking-wider uppercase flex items-center gap-2 whitespace-nowrap text-center justify-center">
                            {label}
                            {hasPending && (
                              <span className={sf === "SF-4" ? "inline-flex items-center justify-center w-6 h-6 bg-red-650 rounded-full text-[12px] text-white font-extrabold animate-pulse ring-2 ring-white shadow-[0_0_10px_rgba(239,68,68,0.95)]" : "inline-flex items-center justify-center w-5 h-5 bg-red-500 rounded-full text-[11px] text-white font-black animate-pulse"}>
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
                            className={`ml-2.5 p-1 rounded-full text-white transition-all duration-200 focus:outline-none z-30 ${
                              isActive 
                                ? "hover:bg-white/25" 
                                : "opacity-60 group-hover:opacity-100 hover:bg-white/20"
                            }`}
                            title={`Info about ${sf}`}
                          >
                            <Info size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
        <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col p-6 max-w-5xl mx-auto w-full z-10 h-full min-h-[400px] overflow-y-auto">
          {activeLink ? (
            <div className="flex-1 flex flex-col gap-6 animate-fadeIn py-2">
              {/* Top Navigation Row */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <button
                  onClick={() => setActiveLink(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  ← Back
                </button>
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-widest font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Secure Workspace Link Connected
                </span>
              </div>

              {/* Secure Desk UI container */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center text-slate-100 shadow-2xl relative overflow-hidden my-auto max-w-2xl mx-auto w-full">
                {/* Visual decoration lines */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-emerald-500"></div>
                <div className="absolute -right-20 -bottom-20 w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl"></div>
                <div className="absolute -left-20 -top-20 w-48 h-48 rounded-full bg-indigo-500/5 blur-3xl"></div>

                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <ExternalLink className="w-8 h-8 animate-pulse" />
                </div>

                <h3 className="text-xl font-black uppercase text-white tracking-wide max-w-sm">
                  {activeLink.name}
                </h3>
                <span className="text-[10px] bg-slate-800/80 border border-slate-700/50 px-2.5 py-0.5 rounded font-mono text-slate-400 uppercase tracking-widest mt-2">
                  Confidential Desk Portal (कार्यालय पोर्टल)
                </span>

                <div className="mt-6 p-4 rounded-xl bg-slate-900/50 border border-slate-850 w-full text-left space-y-2">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                    <span className="w-1 h-3 bg-emerald-500 rounded"></span>
                    Access Guidelines & Instructions:
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    This encrypted office connector links to Katihar Division's official registry page. Ensure you are authorized with local active directory credentials before launching.
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800 font-medium">
                    हिन्दी निर्देश: यह लिंक आपको कटिहार मंडल के आधिकारिक पोर्टल पर रीडायरेक्ट करेगा। जारी रखने के लिए नीचे दिए गए बटन पर क्लिक करें।
                  </p>
                </div>

                {/* Grand Launch CTA Button */}
                <div className="mt-8 w-full">
                  <a
                    href={activeLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide rounded-xl shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)] transition-all cursor-pointer transform active:scale-[0.98]"
                  >
                    Launch External Portal Workspace (सुरक्षित रूप से लिंक खोलें)
                    <ExternalLink className="w-4 h-4 text-emerald-200" />
                  </a>
                  <span className="text-[9px] text-slate-500 font-mono mt-2.5 block tracking-wide select-none">
                    SECURE IP TRANSIT · gateway: {activeLink.url.split('/')[2] || 'nfr.indianrailways.gov.in'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <>
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
                  <div
                    key={link.id}
                    onClick={() => setActiveLink(link)}
                    className="flex items-start gap-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-emerald-400 hover:bg-emerald-50/20 transition-all duration-300 group cursor-pointer"
                  >
                    <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
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
                  </div>
                ))}
                {(!internalLinks || internalLinks.length === 0) && (
                  <div className="text-center p-12 text-gray-400 font-medium col-span-full">
                    No internal links configured yet.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {mainTab === "WORK_ALLOTMENT" && (
        <div className="flex-1 bg-[#132039] border border-[#223354] rounded-xl shadow-2xl flex flex-col overflow-hidden w-full z-10 h-full relative">
          {/* Subheader - Compact */}
          <div className="bg-slate-900 border-b border-slate-850 px-4 py-2 border-none shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 py-0.5">
                <span className="w-1.5 h-3.5 bg-violet-600 rounded-full inline-block"></span>
                {t("nav_apo_allotment")}
              </h2>
            </div>
            {config?.apoWorkAllotmentPdfUrl && (
              <a
                href={config.apoWorkAllotmentPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[10px] font-black uppercase rounded-lg shadow-md transition-all active:scale-95 border border-emerald-500/25 cursor-pointer shrink-0"
              >
                <Download size={11} className="stroke-[3px] animate-pulse" />
                <span>Download PDF / पीडीएफ डाउनलोड करें</span>
              </a>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <ApoAllotmentPage isEmbedded={true} onActiveStateChange={setAllotmentActive} />
          </div>
        </div>
      )}

      {mainTab === "PDF_STAMP" && (
        <div className="flex-1 overflow-hidden relative z-10 w-full h-full min-w-0">
          <OfficePdfStamper onActiveStateChange={setStampActive} />
        </div>
      )}

      {mainTab === "CLAIM_TA" && (
        <div className={`flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col relative z-20 w-full h-full min-w-0 ${taShowSidebars ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          <ClaimTaManager 
            showSidebars={taShowSidebars} 
            onToggleSidebars={setTaShowSidebars} 
            onBackToDashboard={() => selectMainTab("")}
          />
        </div>
      )}

      {mainTab === "OFFICE_ORDERS" && (
        <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col p-6 max-w-5xl mx-auto w-full z-10 h-full min-h-[400px] overflow-y-auto">
          {activeCircular ? (
            <div className="flex-1 flex flex-col gap-6 animate-fadeIn py-2">
              {/* Top Navigation Row */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <button
                  onClick={() => setActiveCircular(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  ← Back
                </button>
                <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-widest font-mono">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                  Official Document Securely Routed
                </span>
              </div>

              {/* Secure Document Viewer Desk container */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center text-center text-slate-100 shadow-2xl relative overflow-hidden my-auto max-w-2xl mx-auto w-full">
                {/* Visual decoration lines */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500"></div>
                <div className="absolute -right-20 -bottom-20 w-48 h-48 rounded-full bg-indigo-500/5 blur-3xl"></div>
                <div className="absolute -left-20 -top-20 w-48 h-48 rounded-full bg-violet-500/5 blur-3xl"></div>

                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                  <FileText className="w-8 h-8 animate-pulse" />
                </div>

                <h3 className="text-lg font-black uppercase text-white tracking-wide max-w-md leading-relaxed">
                  {activeCircular.title}
                </h3>
                
                <div className="flex items-center gap-2 mt-2.5">
                  <span className="text-[10px] bg-indigo-900/40 border border-indigo-700/50 px-2 rounded font-semibold text-indigo-300">
                    Circular Order
                  </span>
                  <span className="text-[10px] bg-slate-850 px-2 py-0.5 rounded font-mono text-slate-400">
                    Published: {activeCircular.date}
                  </span>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-slate-900/50 border border-slate-850 w-full text-left space-y-2">
                  <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                    <span className="w-1 h-3 bg-indigo-500 rounded"></span>
                    Clerical Guidelines & Purpose:
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    This document provides standard procedural guidelines regarding apprentice allotment and disciplinary models. Verify files and stamp correctly on matching records.
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800 font-medium">
                    हिन्दी निर्देश: यह आधिकारिक रेलवे बोर्ड परिपत्र / कार्यालय आदेश है। संबंधित फ़ाइल को खोलने या सहेजने के लिए नीचे दिए गए बटन का उपयोग करें।
                  </p>
                </div>

                {/* Document Launch CTAs */}
                <div className="mt-8 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href={activeCircular.viewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-xs tracking-wider rounded-xl transition-all cursor-pointer shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
                  >
                    Open PDF Document (दस्तावेज़ देखें)
                    <ExternalLink className="w-3.5 h-3.5 text-indigo-200" />
                  </a>
                  <a
                    href={activeCircular.downloadLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs tracking-wider rounded-xl transition-all cursor-pointer border border-slate-700"
                  >
                    Download PDF File (डाउनलोड करें)
                    <Download className="w-3.5 h-3.5 text-slate-300" />
                  </a>
                </div>
                <span className="text-[9px] text-slate-500 font-mono mt-3.5 block tracking-wide select-none">
                  SECURE DOCUMENT ROUTING ENGINE · REF: {activeCircular.id || 'NFR-KIR-2026'}
                </span>
              </div>
            </div>
          ) : (
            <>
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
                <div className="shadow-sm overflow-hidden rounded-xl">
                  <DocumentPanel 
                    title={`⚠️ ${t("nav_dar_circulars") || "D&AR Orders (डीआर परिपत्र)"}`} 
                    items={[...(darCirculars || [])].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).map((item,index)=>({...item,isNew:index<4}))} 
                    theme="blue"
                    onClickItem={setActiveCircular}
                  />
                </div>
                
                <div className="shadow-sm overflow-hidden rounded-xl">
                  <DocumentPanel 
                    title={`🎓 ${t("nav_act_circulars") || "Act Apprentice Orders (अधिनियम अपरेंटिस परिपत्र)"}`} 
                    items={[...(actCirculars || [])].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).map((item,index)=>({...item,isNew:index<4}))} 
                    theme="indigo"
                    onClickItem={setActiveCircular}
                  />
                </div>
              </div>
            </>
          )}
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
