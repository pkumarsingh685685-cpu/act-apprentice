import React, { useState, useRef, useEffect } from "react";
import { useStore } from "../store/useStore";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { uploadToStorage } from "../utils/upload";
import {
  LogOut,
  Plus,
  Trash2,
  Settings,
  List,
  FileText,
  Image as ImageIcon,
  Upload,
  PanelTop,
  LayoutDashboard,
  FileSignature,
  Edit,
  Database,
  Compass,
  Palette,
  Globe,
  FileSpreadsheet
} from "lucide-react";
import { Header } from "../components/Header";
import {
  DocumentCategory,
  DocumentItem,
  SiteConfig,
  HeaderConfig,
} from "../types";
import { toast } from "sonner";
import enTranslations from '../locales/en.json';
import hiTranslations from '../locales/hi.json';
import { ContactSubmissionsManager } from "../components/ContactSubmissionsManager";
import { CandidateSetupManager } from "../components/CandidateSetupManager";
import { CandidateQueriesManager } from "../components/CandidateQueriesManager";
import { SF1Generator } from "../components/SF1Generator";
import { DynamicRegistersManager } from "../components/DynamicRegistersManager";
import { GoogleSheetManager } from "../components/GoogleSheetManager";
import { ApoAllotmentManager } from "../components/ApoAllotmentManager";
import { NfrOrgNodesManager } from "../components/NfrOrgNodesManager";

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language?.split('-')[0] || 'en';
  const isAdmin = useStore((state) => state.isAdmin);
  const lastLoginTime = useStore((state) => state.lastLoginTime);
  const logout = useStore((state) => state.logout);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("System Settings");

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin");
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const categoriesList = [
    { id: "System Settings", name: "System Settings", nameHi: "सिस्टम सेटिंग्स", icon: Settings, color: "from-amber-500 to-amber-600" },
    { id: "UI Graphics & Media", name: "UI Graphics & Media", nameHi: "ग्राफिक्स व मीडिया", icon: Palette, color: "from-pink-500 to-rose-600" },
    { id: "Documents & Notices", name: "Documents & Notices", nameHi: "दस्तावेज व नोटिस", icon: FileText, color: "from-emerald-600 to-teal-600" },
    { id: "Departmental Portals", name: "Departmental Portals", nameHi: "विभागीय पोर्टल", icon: Globe, color: "from-cyan-600 to-blue-600" },
    { id: "Candidate Records & DB", name: "Candidate Records", nameHi: "उम्मीदवार डेटाबेस", icon: Database, color: "from-violet-600 to-purple-600" },
    { id: "Spatial Info & Maps", name: "Spatial Map Info", nameHi: "मानचित्र व प्रभाग", icon: Compass, color: "from-red-600 to-orange-600" },
  ];

  const tabs = [
    { 
      id: "settings", 
      name: "Global Settings", 
      nameHi: "ग्लोबल सेटिंग्स",
      icon: Settings, 
      category: "System Settings",
      categoryHi: "सिस्टम सेटिंग्स",
      desc: "Update helpline numbers, official contact email, and critical marquee alert text.",
      descHi: "हेल्पलाइन नंबर, आधिकारिक संपर्क ईमेल और महत्वपूर्ण स्क्रॉल संदेशों को बदलें।"
    },
    { 
      id: "translations", 
      name: "Website Texts Override", 
      nameHi: "वेबसाइट अनुवाद",
      icon: FileText, 
      category: "System Settings",
      categoryHi: "सिस्टम सेटिंग्स",
      desc: "Customize all English and Hindi texts or labels displayed across the public portal.",
      descHi: "सार्वजनिक पोर्टल पर दिखने वाले सभी अंग्रेजी और हिंदी शीर्षकों व शब्दों को बदलें।"
    },
    { 
      id: "header", 
      name: "Header Management", 
      nameHi: "शीर्षक और बैनर",
      icon: PanelTop, 
      category: "UI Graphics & Media",
      categoryHi: "ग्राफिक्स और मीडिया",
      desc: "Update banner titles, organization labels, and main board headings of the website.",
      descHi: "वेबसाइट के शीर्षकों, बैनर शीर्षकों और आधिकारिक विभागों के नाम को बदलें।"
    },
    { 
      id: "audio", 
      name: "Audio Upload", 
      nameHi: "ऑडियो अपलोड",
      icon: PanelTop, 
      category: "UI Graphics & Media",
      categoryHi: "ग्राफिक्स और मीडिया",
      desc: "Upload background audio files or guidelines for active announcements.",
      descHi: "घोषणाओं और दिशा-निर्देशों के लिए पृष्ठभूमि मुख्य ऑडियो फाइल अपलोड करें।"
    },
    { 
      id: "logo", 
      name: "Logo Management", 
      nameHi: "लोगो नियंत्रण",
      icon: ImageIcon, 
      category: "UI Graphics & Media",
      categoryHi: "ग्राफिक्स और मीडिया",
      desc: "Change or toggle ministry logo crests, railway symbols, and website bookmarks.",
      descHi: "मंत्रालय के लोगो, रेलवे प्रतीकों और वेबसाइट बुकमार्क के चिन्हों को बदलें।"
    },
    { 
      id: "slider", 
      name: "Banner & Slider", 
      nameHi: "स्लाइडर चित्र",
      icon: ImageIcon, 
      category: "UI Graphics & Media",
      categoryHi: "ग्राफिक्स और मीडिया",
      desc: "Add, reorder, and activate the high-resolution moving banners on the homepage.",
      descHi: "मुख्य पृष्ठ पर घूमने वाले चित्रों को जोड़ें, उनका क्रम बदलें या हटाएँ।"
    },
    { 
      id: "noticeImage", 
      name: "Homepage Featured Banner", 
      nameHi: "मुख्य सूचना बैनर",
      icon: ImageIcon, 
      category: "UI Graphics & Media",
      categoryHi: "ग्राफिक्स और मीडिया",
      desc: "Configure the featured notice board banner and its accompanying description.",
      descHi: "मुख्य गृह पृष्ठ पर प्रदर्शित विशिष्ट जानकारी बैनर और उसका विवरण बदलें।"
    },
    { 
      id: "video", 
      name: "Video Management", 
      nameHi: "वीडियो प्रबंधक",
      icon: ImageIcon, 
      category: "UI Graphics & Media",
      categoryHi: "ग्राफिक्स और मीडिया",
      desc: "Embed or upload help videos, digital instructions, and user guidance loops.",
      descHi: "उपयोगकर्ता मार्गदर्शन और निर्देश देने वाले वीडियो को वेबसाइट पर जोड़ें।"
    },
    { 
      id: "warning", 
      name: "Warning Settings", 
      nameHi: "आपातकालीन चेतावनी",
      icon: Settings, 
      category: "Documents & Notices",
      categoryHi: "दस्तावेज और नोटिस",
      desc: "Activate or disable the high-visibility warning container on the homepage.",
      descHi: "मुख्य पृष्ठ पर दिखने वाले लाल आपातकालीन नोटिस बॉक्स को ऑन अथवा ऑफ करें।"
    },
    { 
      id: "notices", 
      name: "Notices / Circulars", 
      nameHi: "नोटिस और परिपत्र",
      icon: FileText, 
      category: "Documents & Notices",
      categoryHi: "दस्तावेज और नोटिस",
      desc: "Upload official PDF circulars, notifications, and core categorizations.",
      descHi: "कार्यालय के आधिकारिक परिपत्र, आदेशों और दस्तावेजों की पीडीएफ अपलोड करें।"
    },
    { 
      id: "notifications", 
      name: "Notifications Ticker", 
      nameHi: "त्वरित सूचना सूची",
      icon: FileText, 
      category: "Documents & Notices",
      categoryHi: "दस्तावेज और नोटिस",
      desc: "Manage instant scrolling news briefs and immediate ticker alerts.",
      descHi: "स्क्रॉल होने वाली तत्काल सूचनाओं और उनसे संबन्धित लिंक्स को जोड़ें।"
    },
    { 
      id: "results", 
      name: "Candidate Results", 
      nameHi: "परीक्षा परिणाम हब",
      icon: List, 
      category: "Documents & Notices",
      categoryHi: "दस्तावेज और नोटिस",
      desc: "Publish apprentice and promotional division test results.",
      descHi: "शिक्षुता एवं विभिन्न चयनों के परिणामों और मेरिट सूचियों को अपलोड करें।"
    },
    { 
      id: "meritPanels", 
      name: "Merit Panels & Orders", 
      nameHi: "योग्यता अधिसूचना",
      icon: List, 
      category: "Documents & Notices",
      categoryHi: "दस्तावेज और नोटिस",
      desc: "Configure core merit panels and selection notifications for direct appointment approvals.",
      descHi: "मुख्य योग्यता सूची, चयन अधिसूचना और स्वीकृतियां अपलोड करें।"
    },
    { 
      id: "darCirculars", 
      name: "DAR Circulars Registry", 
      nameHi: "डीएआर नियम परिपत्र",
      icon: FileText, 
      category: "Documents & Notices",
      categoryHi: "दस्तावेज और नोटिस",
      desc: "Upload Discipline & Appeal Rules documents, handbooks, and amendments.",
      descHi: "अनुशासन एवं अपील नियमों से संबन्धित परिपत्रों व नियमावली को बदलें।"
    },
    { 
      id: "actCirculars", 
      name: "Act Apprentice Circulars", 
      nameHi: "एक्ट अपरेंटिस सर्कुलर",
      icon: FileText, 
      category: "Documents & Notices",
      categoryHi: "दस्तावेज और नोटिस",
      desc: "Manage recruitment rules, training guidelines, and statutory notifications.",
      descHi: "अधिनियम प्रशिक्षुओं से संबन्धित नियमों व परिपत्रों को प्रबंधित करें।"
    },
    { 
      id: "sfDescriptions", 
      name: "Manage SF Details", 
      nameHi: "मानक प्रपत्र विवरण",
      icon: FileSignature, 
      category: "Documents & Notices",
      categoryHi: "दस्तावेज और नोटिस",
      desc: "Modify descriptions and rules for SF-4, SF-5, and SF-11 standard forms.",
      descHi: "मानक प्रपत्रों (एसएफ-4, एसएफ-5, एसएफ-11) के कानूनी विवरणों को बदलें।"
    },
    { 
      id: "links", 
      name: "Railways Main Links", 
      nameHi: "रेलवे आधिकारिक कड़ियां",
      icon: Settings, 
      category: "Departmental Portals",
      categoryHi: "विभागीय पोर्टल",
      desc: "Update key internet links pointing to external Indian Railways systems.",
      descHi: "भारतीय रेलवे की अन्य आधिकारिक वेबसाइटों की मुख्य लिंक्स प्रबंधित करें।"
    },
    { 
      id: "externalLinks", 
      name: "External Links Hub", 
      nameHi: "बाहरी सार्वजनिक कड़ियां",
      icon: Settings, 
      category: "Departmental Portals",
      categoryHi: "विभागीय पोर्टल",
      desc: "Add, update, or remove informational links directing to external pages.",
      descHi: "बाहरी संदर्भों और उपयोगी सेवाओं से जुड़ी लिंक्स को जोड़ें या अद्यतन करें।"
    },
    { 
      id: "internalLinks", 
      name: "Internal Quick Links", 
      nameHi: "कार्यालय आंतरिक लिंक",
      icon: Settings, 
      category: "Departmental Portals",
      categoryHi: "विभागीय पोर्टल",
      desc: "Structure instant shortcuts and sub-pages for office operations.",
      descHi: "कार्यालयीन आंतरिक संचालन से जुड़ी कड़ियाँ और शॉर्टकट बदलें।"
    },
    { 
      id: "candidateSetup", 
      name: "Candidate Setup Console", 
      nameHi: "उम्मीदवार पंजीकरण",
      icon: FileText, 
      category: "Candidate Records & DB",
      categoryHi: "डेटाबेस प्रबंधन",
      desc: "Pre-load candidate registration lists, roll numbers, and validation criteria.",
      descHi: "उम्मीदवारों के रोल नंबर, नाम और पहचान मापदंडों को पहले से डेटाबेस में दर्ज करें।"
    },
    { 
      id: "submissions", 
      name: "Form Submissions Inbox", 
      nameHi: "शिकायत व प्रश्न इनबॉक्स",
      icon: List, 
      category: "Candidate Records & DB",
      categoryHi: "डेटाबेस प्रबंधन",
      desc: "Process, reply, or resolve help queries submitted by portal candidates.",
      descHi: "पोर्टल पर उम्मीदवारों द्वारा भेजे गए पत्रों, पूछताछ व आवेदनों का समाधान करें।"
    },
    { 
      id: "queries", 
      name: "Candidate Help Tickets", 
      nameHi: "पूछताछ प्रबंधक",
      icon: List, 
      category: "Candidate Records & DB",
      categoryHi: "डेटाबेस प्रबंधन",
      desc: "Review candidate help tickets and system query logs directly.",
      descHi: "उम्मीदवारों के प्रश्न पत्रों और समस्या टिकटों का प्रत्यक्ष विवरण देखें।"
    },
    { 
      id: "dynamicRegisters", 
      name: "Dynamic registers", 
      nameHi: "डायनेमिक रजिस्टर",
      icon: Database, 
      category: "Candidate Records & DB",
      categoryHi: "डेटाबेस प्रबंधन",
      desc: "Create state registers, edit entry columns, and organize field structures.",
      descHi: "विभागों के रजिस्टर कॉलम और डेटा प्रविष्टियों को गतिशील रूप से सेट करें।"
    },
    { 
      id: "dataSources", 
      name: "Google Sheets Sources", 
      nameHi: "शीट डेटा स्रोत",
      icon: LayoutDashboard, 
      category: "Departmental Portals",
      categoryHi: "विभागीय पोर्टल",
      desc: "Connect and synchronize public or confidential spreadsheet database URLs.",
      descHi: "डेटा स्ट्रीम के लिए गूगल स्प्रेडशीट के डेटा स्रोतों को बदलें या जोड़ें।"
    },
    { 
      id: "apoAllotment", 
      name: "Manage allotments Hub", 
      nameHi: "APO आवंटित प्रबंधन",
      icon: Database, 
      category: "Candidate Records & DB",
      categoryHi: "डेटाबेस प्रबंधन",
      desc: "Deploy list tables and details regarding APO vacancy slots and postings.",
      descHi: "एपीओ विभाग में सीटों के संवितरण, स्थानों और ऑलॉटमेंट सूची को बदलें।"
    },
    { 
      id: "nfrOrgNodes", 
      name: "NFR Divisions & Workshops Map", 
      nameHi: "पूसीर मानचित्र पिन",
      icon: Compass, 
      category: "Spatial Info & Maps",
      categoryHi: "मानचित्र",
      desc: "Customize coordinators, DRMs, state tags, and golden HQs on the map.",
      descHi: "इंटरैक्टिव मानचित्र के पिनों, प्रशासनिक डिवीजनों और मुख्यालयों को बदलें।"
    }
  ];

  const filteredTabs = tabs.filter((tab) => {
    const matchesSearch =
      tab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tab.nameHi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tab.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tab.descHi.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "ALL" || tab.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#0b0f19] min-h-screen text-slate-100 font-sans">
      
      {/* Mobile Header Bar (Only visible on mobile screens) */}
      <div className="md:hidden bg-slate-900 border-b border-slate-850 p-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-md">
            CMS
          </div>
          <span className="font-bold text-sm tracking-wide uppercase text-slate-100">NFR Admin Panel</span>
        </div>
        <div className="flex items-center gap-2">
          {activeTab !== "dashboard" && (
            <button
              onClick={() => setActiveTab("dashboard")}
              className="px-2.5 py-1.5 bg-indigo-900/60 hover:bg-indigo-900 text-indigo-300 rounded-lg text-xs font-bold border border-indigo-700/50 active:translate-y-0.5"
            >
              🏠 Dashboard
            </button>
          )}
          <button
            onClick={() => setIsSidebarMobileOpen(!isSidebarMobileOpen)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 text-xs"
          >
            ☰ Menu
          </button>
        </div>
      </div>

      {/* 3D Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 transform md:relative md:translate-x-0 ${
        isSidebarMobileOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out w-72 md:w-auto ${
        isSidebarCollapsed 
          ? "md:w-20" 
          : "md:w-72"
      } bg-slate-950 border-r border-slate-900 shrink-0 flex flex-col z-40 shadow-[4px_0_24px_rgba(0,0,0,0.6)]`}>
        
        {/* Sidebar Header Title Area */}
        <div className="p-4 bg-slate-900/60 border-b border-slate-900 flex flex-col gap-2 md:hidden">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSidebarMobileOpen(false)}
              className="text-slate-400 hover:text-white font-extrabold text-sm cursor-pointer ml-auto"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Sidebar Info Banner (Disabled when collapsed) */}
        {!isSidebarCollapsed && lastLoginTime && (
          <div className="px-5 py-3 bg-slate-900/30 text-[10px] text-slate-500 border-b border-slate-900">
            <div className="font-mono scale-[0.95] origin-left">
              Last online: {new Date(lastLoginTime).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* 3D Sidebar Tab Option Navigators */}
        <nav className="p-3.5 space-y-3 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-900/40">
          <div className={`text-[10px] font-black tracking-widest text-slate-500 mb-2 px-1 uppercase ${isSidebarCollapsed && "md:hidden"}`}>
            📂 CONFIGURATION CHANNELS
          </div>

          {categoriesList.map((category) => {
            const isSelected = selectedCategory === category.id;
            const CategoryIcon = category.icon;
            
            return (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setActiveTab("dashboard");
                  setIsSidebarMobileOpen(false);
                }}
                className={`w-full group flex items-center justify-between p-2.5 rounded-2xl cursor-pointer relative transition-all duration-150 text-left ${
                  isSelected
                    ? `bg-gradient-to-r ${category.color} text-white shadow-[0_4px_0_0_#020617,0_6px_12px_rgba(0,0,0,0.35)] translate-y-[2px] border-b border-white/10`
                    : "bg-slate-900/40 border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-[#f8fafc] hover:bg-slate-900 shadow-[0_4px_0_0_#020617] active:translate-y-[2px] active:shadow-[0_2px_0_0_#020617]"
                }`}
                title={category.name}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? "bg-white/15 text-white" : "bg-slate-950 text-slate-400 group-hover:text-amber-400"
                  } transition-colors border border-slate-800/50`}>
                    <CategoryIcon size={15} />
                  </div>
                  
                  <div className={`min-w-0 ${isSidebarCollapsed ? "md:hidden" : ""}`}>
                    <span className="block text-[11px] font-black uppercase tracking-wider truncate leading-tight">
                      {currentLang === 'hi' ? category.nameHi : category.name}
                    </span>
                  </div>
                </div>

                {isSelected && !isSidebarCollapsed && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981] mr-1 shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse Toggle Switch at the bottom (Desktop only) */}
        <div className="hidden md:flex p-3 bg-slate-950 border-t border-slate-900">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-full text-center py-2 bg-slate-900 text-xs font-bold text-slate-400 hover:text-white rounded-xl border border-slate-850 hover:bg-slate-850/60 transition-colors active:translate-y-0.5"
          >
            {isSidebarCollapsed ? "»" : "« Collapse Sidebar"}
          </button>
        </div>
      </div>

      {/* Main Content Workspace Container */}
      <div className="flex-1 p-4 md:p-8 overflow-x-hidden flex flex-col gap-6">
        
        {/* Top Floating Dashboard Navigator Header */}
        {activeTab !== "dashboard" ? (
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl backdrop-blur-md relative z-30">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setActiveTab("dashboard")}
                className="px-4 py-2.5 bg-gradient-to-b from-indigo-600 to-indigo-700 hover:brightness-110 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_0_0_#312e81,0_8px_15px_rgba(99,102,241,0.25)] active:translate-y-[2px] active:shadow-none cursor-pointer flex items-center gap-1.5"
                title="Back to central dashboard options"
              >
                <span>⬅️</span> {t('back_to_dashboard') || (currentLang === 'hi' ? "डैशबोर्ड मेनू" : "Dashboard Menu")}
              </button>
              
              <button
                onClick={() => navigate("/")}
                className="px-4 py-2.5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:translate-y-[1px] cursor-pointer flex items-center gap-1.5"
                title="Go to main homepage website"
              >
                <span>🏠</span> {t('home_screen') || (currentLang === 'hi' ? "मुख्य वेबसाइट" : "Home Screen")}
              </button>
              
              <span className="text-slate-700 font-bold hidden sm:inline px-1">|</span>
              
              <div className="hidden lg:block bg-slate-950/50 border border-slate-850 px-3 py-1.5 rounded-xl">
                <span className="text-[9px] font-black text-indigo-400 block uppercase tracking-widest leading-none">Category: {tabs.find((t) => t.id === activeTab)?.category}</span>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mt-1 leading-none">
                  {tabs.find((t) => t.id === activeTab)?.name}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end flex-wrap">
              {/* Single Toggle Language Button */}
              <button
                type="button"
                onClick={() => {
                  const nextLang = currentLang === 'en' ? 'hi' : 'en';
                  i18n.changeLanguage(nextLang);
                  localStorage.setItem('i18nextLng', nextLang);
                }}
                className="px-4 py-2 bg-gradient-to-b from-indigo-600 to-indigo-700 hover:brightness-110 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_0_0_#312e81,0_8px_15px_rgba(99,102,241,0.25)] active:translate-y-[2px] active:shadow-none cursor-pointer flex items-center gap-1.5 select-none"
                title={currentLang === 'en' ? 'Translate to Hindi / हिंदी में अनुवाद करें' : 'Switch Layout back to English'}
              >
                <span>🌍</span> {currentLang === 'en' ? 'हिंदी (Hindi)' : 'English (अंग्रेजी)'}
              </button>

              <button
                onClick={handleLogout}
                className="px-4 py-2.5 bg-gradient-to-b from-red-600 to-red-700 hover:brightness-110 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_0_0_#7f1d1d,0_8px_15px_rgba(239,68,68,0.2)] active:translate-y-[2px] active:shadow-none cursor-pointer flex items-center gap-1.5 select-none"
                title="Securely log out of server"
              >
                <LogOut size={13} /> {t('logout') || "Log Out / लॉगआउट"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/80 border border-slate-880 p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl backdrop-blur-md relative z-30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-[0_3px_0_0_#991b1b]">
                CMS
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-wider uppercase text-slate-100 block">NFR Control Console</span>
                <span className="text-[10px] text-slate-500 font-bold block">
                  {currentLang === 'hi' ? "उत्तर पूर्व सीमांत रेलवे" : "North Frontier Railway"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end flex-wrap">
              {/* Single Toggle Language Button */}
              <button
                type="button"
                onClick={() => {
                  const nextLang = currentLang === 'en' ? 'hi' : 'en';
                  i18n.changeLanguage(nextLang);
                  localStorage.setItem('i18nextLng', nextLang);
                }}
                className="px-4 py-2 bg-gradient-to-b from-indigo-600 to-indigo-700 hover:brightness-110 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_0_0_#312e81,0_8px_15px_rgba(99,102,241,0.25)] active:translate-y-[2px] active:shadow-none cursor-pointer flex items-center gap-1.5 select-none"
                title={currentLang === 'en' ? 'Translate to Hindi / हिंदी में अनुवाद करें' : 'Switch Layout back to English'}
              >
                <span>🌍</span> {currentLang === 'en' ? 'हिंदी (Hindi)' : 'English (अंग्रेजी)'}
              </button>

              <button
                onClick={() => navigate("/")}
                className="px-4 py-2.5 bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:translate-y-[1px] cursor-pointer flex items-center gap-1.5"
                title="Go to main homepage website"
              >
                <span>🏠</span> {t('home_screen') || (currentLang === 'hi' ? "मुख्य वेबसाइट" : "Home Screen")}
              </button>
              
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 bg-gradient-to-b from-red-600 to-red-700 hover:brightness-110 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_4px_0_0_#7f1d1d,0_8px_15px_rgba(239,68,68,0.2)] active:translate-y-[2px] active:shadow-none cursor-pointer flex items-center gap-1.5 select-none"
                title="Securely log out of server"
              >
                <LogOut size={13} /> {t('logout') || (currentLang === 'hi' ? "लॉगआउट" : "Log Out")}
              </button>
            </div>
          </div>
        )}

        {/* Inner Content Card Area */}
        <div className={`flex-1 ${
          activeTab === "dashboard" 
            ? "bg-transparent border-0 shadow-none p-0" 
            : "bg-white text-slate-900 rounded-2.5xl shadow-xl border border-slate-200 p-6 md:p-8"
        }`}>
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fade-in py-2">
              <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.06)]">
                {/* Visual Accent */}
                <div className="absolute -right-24 -top-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-24 -bottom-24 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 space-y-4">
                  <span className="bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-3.5 py-1 text-[11px] font-black uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(99,102,241,0.25)]">
                    {currentLang === 'hi' ? '★ मुख्य डेटा सेंटर' : '★ SYSTEM CONTROL HUB'}
                  </span>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
                    <div>
                      <h2 className="text-2xl sm:text-3.5xl font-extrabold text-white tracking-tight flex items-center gap-2">
                        {currentLang === 'hi' ? 'एडमिन कंट्रोल पैनल में आपका स्वागत है' : 'Welcome to Admin Control Deck'}
                      </h2>
                      <p className="text-slate-400 text-sm max-w-2xl mt-1 font-medium">
                        {currentLang === 'hi' 
                          ? 'आधिकारिक सूचनाओं, रेल डेटा शीट, द्विभाषी अनुवादों, इंटरैक्टिव मानचित्रों और उम्मीदवार डेटाबेस को वास्तविक समय में एक्सेस, अपडेट और प्रबंधित करें।'
                          : 'Access, update, and manage official notifications, railway data sheets, bilingual translations, interactive coordinate maps, and apprentice databases in real-time.'}
                      </p>
                    </div>
                    {lastLoginTime && (
                      <div className="bg-slate-950/80 border border-slate-850 p-3 rounded-2xl shadow-inner text-right self-start lg:self-auto shrink-0 min-w-[200px]">
                        <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">LAST ACTIVE STATE</span>
                        <span className="block text-xs font-mono text-emerald-400 font-extrabold mt-1 tracking-wider">
                          {new Date(lastLoginTime).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Filter Controls & Live Search Bar */}
              <div className="flex gap-4 justify-between items-center bg-slate-900/60 border border-slate-850 p-4 rounded-2.5xl backdrop-blur-md relative z-20">
                {/* Search input with 3D inset depth */}
                <div className="relative w-full">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
                  <input
                    type="text"
                    placeholder="Search management modules (e.g., Notices, Logo)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950/81 text-white placeholder-slate-500 pl-10 pr-4 py-3 rounded-xl border border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] focus:shadow-[0_0_15px_rgba(99,102,241,0.2),inset_0_2px_4px_rgba(0,0,0,0.8)]"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-black cursor-pointer"
                    >
                      CLEAR
                    </button>
                  )}
                </div>
              </div>

              {/* Central 3D Bento Grid and Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
                {filteredTabs.map((tab) => {
                  return (
                    <div
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="group relative cursor-pointer active:translate-y-[4px] active:shadow-[0_2px_0_0_#020617] transition-all bg-gradient-to-b from-slate-900 to-[#111827] border border-slate-850 hover:border-indigo-500/50 rounded-2.5xl p-6 shadow-[0_6px_0_0_#090d16] hover:shadow-[0_8px_0_0_#020617] overflow-hidden"
                    >
                      {/* Ambient Gradient Corner Glow on Hover */}
                      <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-gradient-to-tr from-transparent via-indigo-505/5 to-transparent rounded-full group-hover:scale-150 transition-all duration-500 pointer-events-none" />
                      
                      {/* Interactive grid background lines (very subtle) */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-30" />

                      <div className="space-y-4 relative z-10 flex flex-col h-full justify-between">
                        <div className="space-y-3.5">
                          {/* Card Category & Badge and active indicator */}
                          <div className="flex items-center justify-between">
                            <span className="bg-slate-950/80 border border-slate-800 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400 rounded-md">
                              {currentLang === 'hi' ? tab.categoryHi : tab.category}
                            </span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          </div>

                          {/* Card Icon & Layout */}
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-950 border border-slate-800 text-indigo-400 group-hover:bg-slate-900 group-hover:text-amber-400 transition-colors shadow-inner shrink-0">
                              <tab.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            </div>
                            <div>
                              <h3 className="font-extrabold text-[#f1f5f9] tracking-wide text-base group-hover:text-amber-300 transition-colors">
                                {currentLang === 'hi' ? tab.nameHi : tab.name}
                              </h3>
                            </div>
                          </div>
                        </div>

                        {/* Custom descriptions */}
                        <div className="pt-2 border-t border-slate-800/60 mt-2 space-y-1.5 flex-1">
                          <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                            {currentLang === 'hi' ? tab.descHi : tab.desc}
                          </p>
                        </div>

                        {/* 3D hover push trigger button indicator */}
                        <div className="pt-4 flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-indigo-400 group-hover:text-amber-300 transition-colors mt-auto">
                          <span>{currentLang === 'hi' ? "संपादन करें" : "OPEN PANEL"}</span>
                          <span className="translate-x-0 group-hover:translate-x-1.5 transition-transform">→</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredTabs.length === 0 && (
                  <div className="col-span-full border border-dashed border-slate-800 rounded-3xl p-16 text-center text-slate-400 space-y-3 bg-slate-950/40">
                    <p className="text-lg font-bold text-slate-300">No matching tools found.</p>
                    <p className="text-xs text-slate-500">Check spelling or select another filter option.</p>
                    <button 
                      onClick={() => { setSearchQuery(""); setSelectedCategory("ALL"); }}
                      className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-bold text-white hover:bg-slate-850 mt-4 active:translate-y-0.5 transition-all cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === "settings" && <SettingsForm />}
          {activeTab === "translations" && <TranslationManager />}
          {activeTab === "header" && <HeaderManager />}
          {activeTab === "audio" && <AudioManager />}
          {activeTab === "logo" && <LogoManager />}
          {activeTab === "slider" && <SliderManager />}
          {activeTab === "noticeImage" && <NoticeImageManager />}
          {activeTab === "warning" && <WarningManager />}
          {activeTab === "video" && <VideoManager />}
          {[
            "notices",
            "notifications",
            "meritPanels",
            "results",
            "darCirculars",
            "actCirculars",
          ].includes(activeTab) && (
            <DocumentManager
              type={activeTab as DocumentCategory}
              title={tabs.find((t) => t.id === activeTab)?.name || ""}
            />
          )}
          {activeTab === "links" && <LinksManager />}
          {activeTab === "externalLinks" && <ExternalLinksManager />}
          {activeTab === "internalLinks" && <InternalLinksManager />}
          {activeTab === "sfDescriptions" && <SFDescriptionsManager />}
          {activeTab === "candidateSetup" && <CandidateSetupManager />}
          {activeTab === "queries" && <CandidateQueriesManager />}
          {activeTab === "submissions" && <ContactSubmissionsManager />}
          {activeTab === "dynamicRegisters" && <DynamicRegistersManager />}
          {activeTab === "dataSources" && <GoogleSheetManager />}
          {activeTab === "apoAllotment" && <ApoAllotmentManager />}
          {activeTab === "nfrOrgNodes" && <NfrOrgNodesManager />}
        </div>
      </div>
    </div>
  );
}

// Warning Manager
function WarningManager() {
  const warningConfig = useStore((state) => state.warningConfig);
  const updateWarningConfig = useStore((state) => state.updateWarningConfig);

  const handleSave = () => {
    toast.success("Warning config saved successfully!");
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-2">
        <h3 className="text-lg font-semibold">Warning Management</h3>
        <p className="text-sm text-gray-500">
          Set up the warning box that appears on the homepage to alert users regarding important notices.
        </p>
      </div>

      <div className="border rounded p-4 bg-white shadow-sm space-y-4">
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={warningConfig?.enabled || false}
            onChange={(e) => updateWarningConfig({ enabled: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
          />
          <span className="font-semibold text-gray-700">Enable Warning Box</span>
        </label>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Warning Text
          </label>
          <textarea
            value={warningConfig?.text || ""}
            onChange={(e) => updateWarningConfig({ text: e.target.value })}
            rows={4}
            className="w-full p-2 border rounded text-gray-700 focus:ring-2 focus:ring-blue-500"
            placeholder="Warning message to display..."
          />
        </div>

        <button
          onClick={handleSave}
          className="bg-[#1c3f60] text-white px-4 py-2 rounded font-medium hover:bg-blue-900 transition shadow"
        >
          Save Warning
        </button>
      </div>
    </div>
  );
}

// Video Manager
function VideoManager() {
  const videoConfig = useStore((state) => state.videoConfig);
  const updateVideoConfig = useStore((state) => state.updateVideoConfig);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file.");
      return;
    }

    const toastId = toast.loading("Uploading video to Cloudinary...");
    try {
      const url = await uploadToStorage(file, "videos");
      updateVideoConfig({ url });
      toast.success("Video uploaded successfully!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Video upload failed", { id: toastId });
    }
  };

  const handleSave = () => {
    toast.success("Video config saved successfully!");
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-2">
        <h3 className="text-lg font-semibold">Video Management</h3>
        <p className="text-sm text-gray-500">
          Upload an information video to be displayed directly on the homepage.
        </p>
      </div>

      <div className="border rounded p-4 bg-white shadow-sm space-y-4">
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={videoConfig?.enabled || false}
            onChange={(e) => updateVideoConfig({ enabled: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
          />
          <span className="font-semibold text-gray-700">Enable Video Player</span>
        </label>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Video URL (Cloudinary or Direct Link)
          </label>
          <input
            type="url"
            value={videoConfig?.url || ""}
            onChange={(e) => updateVideoConfig({ url: e.target.value })}
            className="w-full p-2 border rounded font-medium text-gray-700 mb-3"
            placeholder="https://..."
          />

          <label className="cursor-pointer bg-emerald-600 text-white px-4 py-2 rounded font-medium hover:bg-emerald-700 transition shadow inline-flex items-center gap-2">
            <Upload size={18} /> Upload Video
            <input
              type="file"
              accept="video/mp4, video/webm, video/ogg"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {videoConfig.url && (
          <div className="mt-4 border rounded p-2 bg-gray-50">
            <h4 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Video Preview Preview</h4>
            <video
              src={videoConfig.url}
              controls
              className="w-full max-h-64 object-contain rounded bg-black"
            />
          </div>
        )}

        <button
          onClick={handleSave}
          className="bg-[#1c3f60] text-white px-4 py-2 rounded font-medium hover:bg-blue-900 transition shadow"
        >
          Save Video Configuration
        </button>
      </div>
    </div>
  );
}

function TranslationManager() {
  const translations = useStore((state) => state.translations);
  const updateTranslationsBatch = useStore((state) => state.updateTranslationsBatch);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  
  // Combine defaults with overrides
  const defaults = lang === 'en' ? enTranslations : hiTranslations;
  const overrides = translations?.[lang] || {};
  
  const [localBatch, setLocalBatch] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  const handleChange = (key: string, value: string) => {
    setLocalBatch(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const promise = new Promise((resolve) => {
      updateTranslationsBatch(lang, localBatch);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: "Saved Successfully",
      error: "Save Failed",
    });
  };
  
  const keys = Object.keys(enTranslations).filter(k => 
    k.toLowerCase().includes(search.toLowerCase()) || 
    (defaults as any)[k]?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 gap-4">
        <div>
          <h3 className="text-lg font-semibold">Website Texts (Translations)</h3>
          <p className="text-sm text-gray-500">Edit any text visible on the website.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <input 
            type="text"
            placeholder="Search texts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 border rounded text-sm flex-1 md:w-48"
          />
          <select 
            value={lang} 
            onChange={(e) => {
              setLang(e.target.value as any);
              setLocalBatch({});
            }}
            className="p-2 border rounded font-medium text-sm"
          >
            <option value="en">English (Default)</option>
            <option value="hi">Hindi</option>
          </select>
          <button
            onClick={handleSave}
            className="bg-[#1c3f60] hover:bg-blue-900 text-white px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap"
          >
            Save Texts
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1 pr-2">
        {keys.map((key) => {
          const displayValue = localBatch[key] !== undefined ? localBatch[key] : (overrides[key] !== undefined ? overrides[key] : (defaults as any)[key]);
          return (
            <div key={key} className="bg-gray-50 p-3 rounded border">
              <label className="block text-xs font-semibold text-gray-500 mb-1 truncate" title={key}>{key}</label>
              <textarea 
                value={displayValue}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-full p-2 border rounded text-sm min-h-[60px]"
              />
            </div>
          );
        })}
        {keys.length === 0 && (
          <p className="text-gray-500 py-4 col-span-2 text-center">No texts found for your search.</p>
        )}
      </div>
    </div>
  );
}

// Logo Manager Helper
function LogoManager() {
  const logos = useStore((state) => state.logos);
  const updateLogo = useStore((state) => state.updateLogo);

  const handles = [
    { key: "railwayLogo", label: "Railway Logo" },
    { key: "govLogo", label: "Government Logo" },
    { key: "ministryLogo", label: "Ministry Logo" },
    { key: "nationalEmblem", label: "National Emblem" },
    { key: "favicon", label: "Website Favicon" },
  ];

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const promise = new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            let { width, height } = img;
            const max = 400; // Compress
            if (width > max || height > max) {
              const ratio = Math.min(max / width, max / height);
              width = width * ratio;
              height = height * ratio;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              canvas.toBlob(async (blob) => {
                if (!blob) return reject(new Error("Failed to create blob"));
                try {
                  const url = await uploadToStorage(new File([blob], file.name, { type: 'image/webp' }), 'logos');
                  updateLogo(key as any, { image: url });
                  resolve(true);
                } catch (err) {
                  reject(err);
                }
              }, "image/webp", 0.9);
            } else {
              reject();
            }
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    toast.promise(promise, {
      loading: "Uploading...",
      success: "Logo Uploaded Successfully",
      error: (err: any) => err.message || "Upload Failed",
    });
  };

  const handleRemove = (key: string) => {
    const promise = new Promise((resolve) => {
      updateLogo(key as any, { image: "" });
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Deleting...",
      success: "Deleted Successfully",
      error: "Delete Failed",
    });
  };

  const handleToggle = (key: string, enabled: boolean) => {
    const promise = new Promise((resolve, reject) => {
      try {
        updateLogo(key as any, { enabled });
        setTimeout(resolve, 200);
      } catch (err) {
        reject(err);
      }
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: "Updated Successfully",
      error: "Update Failed",
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-2">
        <h3 className="text-lg font-semibold">Logo Management</h3>
        <p className="text-sm text-gray-500">
          Only ONE active logo per category. Upload to replace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {handles.map((item) => {
          const logoData = logos[item.key as keyof typeof logos] || { image: "", enabled: false };
          return (
            <div
              key={item.key}
              className="p-4 border rounded-lg bg-gray-50 flex flex-col items-center"
            >
              <div className="w-full flex justify-between items-center mb-4">
                <h4 className="font-semibold text-sm">{item.label}</h4>
                <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1 rounded shadow-sm border">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${logoData.enabled ? "text-green-600" : "text-red-500"}`}
                  >
                    {logoData.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <input
                    type="checkbox"
                    checked={logoData.enabled}
                    onChange={(e) => handleToggle(item.key, e.target.checked)}
                    className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                </label>
              </div>
              <div className="w-full flex-1 flex flex-col items-center justify-center mb-4 min-h-[120px] bg-white border border-dashed border-gray-300 rounded p-4 relative">
                {logoData.image ? (
                  <img
                    src={logoData.image}
                    alt={item.label}
                    className="max-h-[100px] object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-400">No image set</span>
                )}
                {!logoData.enabled && (
                  <div className="absolute inset-0 bg-gray-100/60 rounded flex items-center justify-center">
                    <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow">
                      Disabled
                    </span>
                  </div>
                )}
              </div>
              <div className="w-full flex gap-2">
                <label className="flex-1 cursor-pointer bg-[#1c3f60] text-white py-2 px-3 rounded-md text-sm font-medium text-center hover:bg-blue-900 transition flex items-center justify-center gap-2">
                  <Upload size={16} /> {logoData.image ? "Replace" : "Upload"}
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, item.key)}
                  />
                </label>
                {logoData.image && (
                  <button
                    onClick={() => handleRemove(item.key)}
                    className="bg-red-100 text-red-600 px-3 py-2 rounded-md hover:bg-red-200 transition"
                    title="Delete Logo"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Homepage Image Management
function NoticeImageManager() {
  const noticeImage = useStore((state) => state.noticeImage);
  const updateNoticeImage = useStore((state) => state.updateNoticeImage);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const promise = new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            let { width, height } = img;
            const max = 1200; // Compress
            if (width > max || height > max) {
              const ratio = Math.min(max / width, max / height);
              width = width * ratio;
              height = height * ratio;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              canvas.toBlob(async (blob) => {
                if (!blob) return reject(new Error("Failed to create blob"));
                try {
                  const url = await uploadToStorage(new File([blob], file.name, { type: 'image/webp' }), 'notices');
                  updateNoticeImage({ image: url });
                  resolve(true);
                } catch (err) {
                  reject(err);
                }
              }, "image/webp", 0.9);
            } else {
              reject();
            }
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      e.target.value = "";
    });

    toast.promise(promise, {
      loading: "Uploading...",
      success: "Image Uploaded Successfully",
      error: "Upload Failed",
    });
  };

  const handleDelete = () => {
    const promise = new Promise((resolve) => {
      updateNoticeImage({ image: "" });
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Deleting...",
      success: "Deleted Successfully",
      error: "Delete Failed",
    });
  };

  const handleUpdate = (data: Partial<typeof noticeImage>) => {
    updateNoticeImage(data);
  };

  const handleToggle = (enabled: boolean) => {
    const promise = new Promise((resolve) => {
      updateNoticeImage({ enabled });
      setTimeout(resolve, 200);
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: "Updated Successfully",
      error: "Update Failed",
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Homepage Image Management</h3>
          <p className="text-sm text-gray-500">
            Image displayed directly below the Notice Board.
          </p>
        </div>
      </div>

      <div className="border border-gray-200 rounded p-4 flex flex-col md:flex-row gap-4 bg-white shadow-sm overflow-hidden relative">
        {!noticeImage?.enabled && (
          <div className="absolute top-2 left-2 bg-gray-800 text-white text-[10px] uppercase font-bold px-2 py-1 rounded z-10">
            Disabled
          </div>
        )}
        <div className="w-full md:w-64 h-48 md:h-auto bg-gray-100 flex-shrink-0 flex items-center justify-center rounded overflow-hidden relative">
          {noticeImage?.image ? (
            <img
              src={noticeImage.image}
              className={`w-full h-full object-cover ${!noticeImage?.enabled ? "opacity-50 grayscale" : ""}`}
              alt={noticeImage.title}
            />
          ) : (
            <span className="text-xs text-gray-400">No Image Uploaded</span>
          )}

          <label className="absolute bottom-2 right-2 cursor-pointer bg-[#1c3f60] text-white p-2 rounded-full hover:bg-blue-900 transition shadow">
            <Upload size={16} />
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Image Title
              </label>
              <input
                type="text"
                value={noticeImage?.title || ""}
                onChange={(e) => handleUpdate({ title: e.target.value })}
                onBlur={() => handleToggle(noticeImage?.enabled || false)}
                className="w-full p-2 text-sm border rounded font-semibold focus:ring-1 focus:ring-[#1c3f60]"
                placeholder="Image Title"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Image Description
              </label>
              <textarea
                value={noticeImage?.description || ""}
                onChange={(e) => handleUpdate({ description: e.target.value })}
                onBlur={() => handleToggle(noticeImage?.enabled || false)}
                rows={3}
                className="w-full p-2 text-sm border rounded text-gray-600 focus:ring-1 focus:ring-[#1c3f60]"
                placeholder="Short description..."
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded border">
              <span className="text-xs font-bold text-gray-700">Display:</span>
              <input
                type="checkbox"
                checked={noticeImage?.enabled || false}
                onChange={(e) => handleToggle(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-xs font-medium text-gray-600">
                {noticeImage?.enabled ? "On" : "Off"}
              </span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={!noticeImage?.image}
                className="p-1 px-3 border rounded text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 flex items-center gap-1"
              >
                <Trash2 size={14} /> Delete Image
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Banner Slider Manager
function SliderManager() {
  const sliderImages = useStore((state) => state.sliderImages);
  const addSliderImage = useStore((state) => state.addSliderImage);
  const updateSliderImage = useStore((state) => state.updateSliderImage);
  const deleteSliderImage = useStore((state) => state.deleteSliderImage);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (sliderImages.length >= 10) {
      toast.error("Maximum 10 images allowed. Please delete an image first.");
      return;
    }

    const promise = new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            let { width, height } = img;
            const max = 1200; // Compress
            if (width > max || height > max) {
              const ratio = Math.min(max / width, max / height);
              width = width * ratio;
              height = height * ratio;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              canvas.toBlob(async (blob) => {
                if (!blob) return reject(new Error("Failed to create blob"));
                try {
                  const url = await uploadToStorage(new File([blob], file.name, { type: 'image/webp' }), 'sliders');
                  addSliderImage({
                    title: "New Slider Banner",
                    description: "",
                    image: url,
                    enabled: true,
                    order: sliderImages.length + 1,
                  });
                  resolve(true);
                } catch (err) {
                  reject(err);
                }
              }, "image/webp", 0.9);
            } else {
              reject();
            }
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      // reset input
      e.target.value = "";
    });

    toast.promise(promise, {
      loading: "Uploading...",
      success: "Image Uploaded Successfully",
      error: "Upload Failed",
    });
  };

  const handleMove = (id: string, dir: -1 | 1) => {
    const list = [...sliderImages].sort((a, b) => a.order - b.order);
    const idx = list.findIndex((i) => i.id === id);
    if ((dir === -1 && idx > 0) || (dir === 1 && idx < list.length - 1)) {
      const temp = list[idx].order;
      list[idx].order = list[idx + dir].order;
      list[idx + dir].order = temp;
      // save
      const promise = new Promise((resolve) => {
        updateSliderImage(list[idx].id, { order: list[idx].order });
        updateSliderImage(list[idx + dir].id, { order: list[idx + dir].order });
        setTimeout(resolve, 200);
      });
      toast.promise(promise, {
        loading: "Saving...",
        success: "Updated Successfully",
        error: "Update Failed",
      });
    }
  };

  const handleDelete = (id: string) => {
    const promise = new Promise((resolve) => {
      deleteSliderImage(id);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Deleting...",
      success: "Deleted Successfully",
      error: "Delete Failed",
    });
  };

  const handleUpdate = (
    id: string,
    data: Partial<(typeof sliderImages)[0]>,
  ) => {
    // For text inputs like title and description, we don't want to show toasts on every keystroke.
    // But for checkbox (enabled) we want to. Let's just update silently here, and add a separate save button for text, or just update silently.
    updateSliderImage(id, data);
  };

  const handleToggle = (id: string, enabled: boolean) => {
    const promise = new Promise((resolve) => {
      updateSliderImage(id, { enabled });
      setTimeout(resolve, 200);
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: "Updated Successfully",
      error: "Update Failed",
    });
  };

  const sortedImages = [...sliderImages].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="border-b pb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Banner & Slider Management</h3>
          <p className="text-sm text-gray-500">
            {sliderImages.length}/10 images uploaded.
          </p>
        </div>
        <label
          className={`cursor-pointer bg-[#1c3f60] text-white py-2 px-4 rounded-md text-sm font-medium text-center hover:bg-blue-900 transition flex items-center justify-center gap-2 ${sliderImages.length >= 10 ? "opacity-50 pointer-events-none" : ""}`}
        >
          <Plus size={16} /> Add Image
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={sliderImages.length >= 10}
          />
        </label>
      </div>

      {sliderImages.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded border border-dashed">
          No slider images found. Upload an image to preview the homepage
          slider.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedImages.map((img, index) => (
            <div
              key={img.id}
              className="border border-gray-200 rounded p-4 flex flex-col md:flex-row gap-4 bg-white shadow-sm overflow-hidden relative"
            >
              {!img.enabled && (
                <div className="absolute top-2 left-2 bg-gray-800 text-white text-[10px] uppercase font-bold px-2 py-1 rounded z-10">
                  Disabled
                </div>
              )}
              <div className="w-full md:w-64 h-32 md:h-auto bg-gray-100 flex-shrink-0 flex items-center justify-center rounded overflow-hidden">
                <img
                  src={img.image}
                  className={`w-full h-full object-cover ${!img.enabled ? "opacity-50 grayscale" : ""}`}
                  alt={img.title}
                />
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <input
                    type="text"
                    value={img.title}
                    onChange={(e) =>
                      handleUpdate(img.id, { title: e.target.value })
                    }
                    onBlur={() => handleToggle(img.id, img.enabled)}
                    className="w-full p-2 text-sm border rounded font-semibold focus:ring-1 focus:ring-[#1c3f60]"
                    placeholder="Banner Title"
                  />
                  <textarea
                    value={img.description}
                    onChange={(e) =>
                      handleUpdate(img.id, { description: e.target.value })
                    }
                    onBlur={() => handleToggle(img.id, img.enabled)}
                    rows={2}
                    className="w-full p-2 text-sm border rounded text-gray-600 focus:ring-1 focus:ring-[#1c3f60]"
                    placeholder="Banner short description..."
                  />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                  <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded border">
                    <span className="text-xs font-bold text-gray-700">
                      Display:
                    </span>
                    <input
                      type="checkbox"
                      checked={img.enabled}
                      onChange={(e) => handleToggle(img.id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-gray-600">
                      {img.enabled ? "On" : "Off"}
                    </span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMove(img.id, -1)}
                      disabled={index === 0}
                      className="p-1 px-2 border rounded text-xs bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                    >
                      Up
                    </button>
                    <button
                      onClick={() => handleMove(img.id, 1)}
                      disabled={index === sortedImages.length - 1}
                      className="p-1 px-2 border rounded text-xs bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                    >
                      Down
                    </button>
                    <button
                      onClick={() => handleDelete(img.id)}
                      className="p-1 px-2 border rounded text-xs text-red-600 hover:bg-red-50 ml-4 flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Settings Form Helper
function SettingsForm() {
  const storeConfig = useStore((state) => state.config);
  const updateConfig = useStore((state) => state.updateConfig);
  const [localConfig, setLocalConfig] = useState<SiteConfig>(storeConfig);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setLocalConfig({ ...localConfig, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    const promise = new Promise((resolve) => {
      Object.entries(localConfig).forEach(([k, v]) => {
        updateConfig(k as keyof SiteConfig, v as string);
      });
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: "Saved Successfully",
      error: "Save Failed",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-semibold">Global Settings</h3>
        <button
          onClick={handleSave}
          className="bg-[#1c3f60] hover:bg-blue-900 text-white px-4 py-2 rounded-md text-sm font-medium transition"
        >
          Save Settings
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Helpline Number
          </label>
          <input
            name="helpline"
            value={localConfig.helpline}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Header Email</label>
          <input
            name="email"
            value={localConfig.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Marquee Text</label>
          <input
            name="marqueeText"
            value={localConfig.marqueeText}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* IMPORTANT MESSAGE ADMIN CONTROLS */}
        <div className="md:col-span-2 border-t pt-4 mt-2">
          <h4 className="text-md font-bold text-red-600 mb-3 flex items-center gap-2">
            📢 IMPORTANT MESSAGE PANEL (महत्वपूर्ण संदेश नियंत्रण)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold mb-1 text-slate-700">Status (स्थिति)</label>
              <select
                name="importantMessageEnabled"
                value={localConfig.importantMessageEnabled || "true"}
                onChange={(e) => setLocalConfig({ ...localConfig, importantMessageEnabled: e.target.value })}
                className="w-full p-2 border rounded font-medium bg-white"
              >
                <option value="true">✅ Enabled (सक्रिय)</option>
                <option value="false">❌ Disabled (निष्क्रिय)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1 text-slate-700">Message Content (संदेश की जानकारी)</label>
              <textarea
                name="importantMessageText"
                value={localConfig.importantMessageText || ""}
                onChange={(e) => setLocalConfig({ ...localConfig, importantMessageText: e.target.value })}
                rows={3}
                placeholder="Type the message that candidates must read as extremely important..."
                className="w-full p-2 border rounded font-semibold text-sm focus:border-red-500 bg-white"
              />
            </div>
          </div>
        </div>
        
        {/* Cloudinary Settings */}
        <div className="md:col-span-2 mt-4 pt-4 border-t">
          <h4 className="text-md font-semibold mb-3">Cloudinary Setup (For Image/PDF Uploads)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cloud Name</label>
              <input
                name="cloudinaryName"
                value={localConfig.cloudinaryName || ''}
                onChange={handleChange}
                placeholder="e.g. dxyz123"
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Upload Preset</label>
              <input
                name="cloudinaryPreset"
                value={localConfig.cloudinaryPreset || ''}
                onChange={handleChange}
                placeholder="e.g. my_preset"
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            These settings locally override environment variables.
          </p>
        </div>
        
        {/* Standard Form Passcode Setup */}
        <div className="md:col-span-2 mt-4 pt-4 border-t">
          <h4 className="text-md font-semibold mb-3">Standard Form Generator Access</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Generator Passcode</label>
              <input
                name="sfPasscode"
                type="text"
                value={localConfig.sfPasscode || ''}
                onChange={handleChange}
                placeholder="Default: 124612"
                className="w-full p-2 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">Users will need this code to access the Standard Form generator.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Session Duration (Minutes)</label>
              <input
                name="sfSessionDuration"
                type="number"
                value={localConfig.sfSessionDuration || '30'}
                onChange={handleChange}
                placeholder="Default: 30"
                min="1"
                className="w-full p-2 border rounded"
              />
              <p className="text-xs text-gray-500 mt-1">Number of minutes a user stays authenticated once logged in.</p>
            </div>
          </div>
        </div>



        <div>
          <label className="block text-sm font-medium mb-1">
            Contact Mobile
          </label>
          <input
            name="contactMobile"
            value={localConfig.contactMobile}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Contact Email
          </label>
          <input
            name="contactEmail"
            value={localConfig.contactEmail}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">
            Contact Address
          </label>
          <textarea
            name="contactAddress"
            value={localConfig.contactAddress}
            onChange={handleChange}
            className="w-full p-2 border rounded h-24"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">
            Developer Credit Text
          </label>
          <input
            name="developerCreditText"
            value={localConfig.developerCreditText || ""}
            onChange={handleChange}
            placeholder="e.g. Prshant Kumar singh , Sr.Clerk/Katihar Div."
            className="w-full p-2 border rounded font-mono"
          />
        </div>
      </div>
    </div>
  );
}

// Document Manager Helper
function DocumentManager({
  type,
  title,
}: {
  type: DocumentCategory;
  title: string;
}) {
  const items = useStore((state) => state[type]);
  const addDocument = useStore((state) => state.addDocument);
  const deleteDocument = useStore((state) => state.deleteDocument);

  const [isAdding, setIsAdding] = useState(false);
  const [newDoc, setNewDoc] = useState<Omit<DocumentItem, "id">>({
    title: "",
    date: new Date().toISOString().split("T")[0],
    viewLink: "",
    downloadLink: "",
    isNew: false,
    order: items.length + 1,
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const promise = new Promise((resolve) => {
      addDocument(type, newDoc);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: "Document Added Successfully",
      error: "Save Failed",
    });
    setIsAdding(false);
    setNewDoc({
      title: "",
      date: new Date().toISOString().split("T")[0],
      viewLink: "",
      downloadLink: "",
      isNew: false,
      order: items.length + 2,
    });
  };

  const handleDelete = (id: string) => {
    const promise = new Promise((resolve) => {
      deleteDocument(type, id);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Deleting...",
      success: "Deleted Successfully",
      error: "Delete Failed",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-semibold">{title} Management</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-1 hover:bg-blue-700"
        >
          {isAdding ? (
            "Cancel"
          ) : (
            <>
              <Plus size={16} /> Add New
            </>
          )}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="bg-gray-50 p-4 rounded-md border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              required
              value={newDoc.title}
              onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
              className="w-full p-2 border rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              required
              value={newDoc.date}
              onChange={(e) => setNewDoc({ ...newDoc, date: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Order Index (Lower = First)
            </label>
            <input
              type="number"
              required
              value={newDoc.order}
              onChange={(e) =>
                setNewDoc({ ...newDoc, order: parseInt(e.target.value) })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Upload Document (PDF/Image) to Cloudinary
            </label>
            <input
              type="file"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const toastId = toast.loading("Uploading attached document to Cloudinary...");
                try {
                  const url = await uploadToStorage(file, "documents");
                  setNewDoc({ ...newDoc, viewLink: url, downloadLink: url });
                  toast.success("Document uploaded successfully", { id: toastId });
                } catch (err: any) {
                  toast.error(err.message || "Document upload failed", { id: toastId });
                }
              }}
              className="w-full p-2 border rounded bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              File View Link (Auto-filled on upload)
            </label>
            <input
              value={newDoc.viewLink}
              onChange={(e) =>
                setNewDoc({ ...newDoc, viewLink: e.target.value })
              }
              className="w-full p-2 border rounded"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              File Download Link (Auto-filled on upload)
            </label>
            <input
              value={newDoc.downloadLink}
              onChange={(e) =>
                setNewDoc({ ...newDoc, downloadLink: e.target.value })
              }
              className="w-full p-2 border rounded"
              placeholder="https://..."
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="isNew"
              checked={newDoc.isNew}
              onChange={(e) =>
                setNewDoc({ ...newDoc, isNew: e.target.checked })
              }
              className="w-4 h-4 text-blue-600 rounded"
            />
            <label htmlFor="isNew" className="text-sm font-medium">
              Show "NEW" Badge
            </label>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 w-full sm:w-auto"
            >
              Save Item
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Title</th>
              <th className="p-3">Date</th>
              <th className="p-3">Badge</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[...items]
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3">{item.order}</td>
                  <td className="p-3 font-medium">{item.title}</td>
                  <td className="p-3">{item.date}</td>
                  <td className="p-3">
                    {item.isNew ? (
                      <span className="text-red-500 font-bold">NEW</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Header Manager Helper
function HeaderManager() {
  const storeHeaderConfig = useStore((state) => state.headerConfig);
  const updateHeaderConfig = useStore((state) => state.updateHeaderConfig);

  const [localConfig, setLocalConfig] =
    useState<HeaderConfig>(storeHeaderConfig);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setLocalConfig(storeHeaderConfig);
  }, [storeHeaderConfig]);

  const handleReset = () => {
    setLocalConfig(storeHeaderConfig);
    setShowPreview(false);
  };

  const handleSave = () => {
    const promise = new Promise((resolve) => {
      updateHeaderConfig(localConfig);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: "Saved Successfully",
      error: "Save Failed",
    });
  };

  const fields = [
    {
      key: "mainTitle",
      label: "Main Website Title",
      textKey: "mainTitleText",
      enabledKey: "mainTitleEnabled",
    },
    {
      key: "railwayHindi",
      label: "Hindi Railway Name",
      textKey: "railwayHindiText",
      enabledKey: "railwayHindiEnabled",
    },
    {
      key: "railwayEnglish",
      label: "English Railway Name",
      textKey: "railwayEnglishText",
      enabledKey: "railwayEnglishEnabled",
    },
    {
      key: "divisionHindi",
      label: "Hindi Division Name",
      textKey: "divisionHindiText",
      enabledKey: "divisionHindiEnabled",
    },
    {
      key: "divisionEnglish",
      label: "English Division Name",
      textKey: "divisionEnglishText",
      enabledKey: "divisionEnglishEnabled",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Header Management</h3>
          <p className="text-sm text-gray-500">
            Manage the main titles and subtitles of the portal header.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={handleReset}
            className="flex-1 md:flex-none px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md text-sm font-medium transition"
          >
            Reset
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex-1 md:flex-none px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm font-medium transition"
          >
            {showPreview ? "Edit Mode" : "Preview"}
          </button>
          <button
            onClick={handleSave}
            className="flex-1 md:flex-none px-4 py-2 bg-[#e31837] text-white hover:bg-red-700 rounded-md text-sm font-medium transition"
          >
            Save Updates
          </button>
        </div>
      </div>

      {showPreview ? (
        <div className="border border-gray-300 rounded-lg overflow-hidden relative shadow-inner">
          <div className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] px-2 py-1 font-bold z-10 rounded-br shadow tracking-wider uppercase">
            Preview Mode
          </div>
          <div className="bg-gray-100 p-4 sm:p-8 pt-12">
            <div className="shadow-lg rounded-xl overflow-hidden pointer-events-none border border-gray-200 bg-white">
              <Header previewConfig={localConfig} />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((f) => (
            <div
              key={f.key}
              className="bg-gray-50 border rounded-lg p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <label className="text-sm font-bold text-[#1c3f60]">
                  {f.label}
                </label>
                <label className="flex items-center gap-2 cursor-pointer bg-white px-2 py-1 rounded shadow-sm border">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${localConfig[f.enabledKey as keyof HeaderConfig] ? "text-green-600" : "text-red-500"}`}
                  >
                    {localConfig[f.enabledKey as keyof HeaderConfig]
                      ? "Enabled"
                      : "Disabled"}
                  </span>
                  <input
                    type="checkbox"
                    checked={
                      localConfig[f.enabledKey as keyof HeaderConfig] as boolean
                    }
                    onChange={(e) =>
                      setLocalConfig({
                        ...localConfig,
                        [f.enabledKey]: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                </label>
              </div>
              <input
                type="text"
                value={localConfig[f.textKey as keyof HeaderConfig] as string}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    [f.textKey]: e.target.value,
                  })
                }
                disabled={!localConfig[f.enabledKey as keyof HeaderConfig]}
                className={`w-full p-2 border rounded-md transition-colors font-medium text-gray-800 ${!localConfig[f.enabledKey as keyof HeaderConfig] ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-white border-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"}`}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Links Manager Helper
function LinksManager() {
  const items = useStore((state) => state.links);
  const addLink = useStore((state) => state.addLink);
  const deleteLink = useStore((state) => state.deleteLink);

  const [isAdding, setIsAdding] = useState(false);
  const [newLink, setNewLink] = useState({
    name: "",
    url: "",
    order: items.length + 1,
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const promise = new Promise((resolve) => {
      addLink(newLink);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: "Link Added Successfully",
      error: "Save Failed",
    });
    setIsAdding(false);
    setNewLink({ name: "", url: "", order: items.length + 2 });
  };

  const handleDelete = (id: string) => {
    const promise = new Promise((resolve) => {
      deleteLink(id);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Deleting...",
      success: "Deleted Successfully",
      error: "Delete Failed",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-semibold">
          Railways Website Link Management
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-1 hover:bg-blue-700"
        >
          {isAdding ? (
            "Cancel"
          ) : (
            <>
              <Plus size={16} /> Add Link
            </>
          )}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="bg-gray-50 p-4 rounded-md border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              required
              value={newLink.name}
              onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              URL (https://...)
            </label>
            <input
              required
              type="url"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Order</label>
            <input
              required
              type="number"
              value={newLink.order}
              onChange={(e) =>
                setNewLink({ ...newLink, order: parseInt(e.target.value) })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Save Link
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Name</th>
              <th className="p-3">URL</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[...items]
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3">{item.order}</td>
                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3 text-blue-600">{item.url}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExternalLinksManager() {
  const items = useStore((state) => state.externalLinks);
  const addLink = useStore((state) => state.addExternalLink);
  const deleteLink = useStore((state) => state.deleteExternalLink);

  const [isAdding, setIsAdding] = useState(false);
  const [newLink, setNewLink] = useState({
    name: "",
    url: "",
    order: items.length + 1,
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const promise = new Promise((resolve) => {
      addLink(newLink);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: "Link Added Successfully",
      error: "Save Failed",
    });
    setIsAdding(false);
    setNewLink({ name: "", url: "", order: items.length + 2 });
  };

  const handleDelete = (id: string) => {
    const promise = new Promise((resolve) => {
      deleteLink(id);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Deleting...",
      success: "Deleted Successfully",
      error: "Delete Failed",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-semibold">External Links Management</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-1 hover:bg-blue-700"
        >
          {isAdding ? (
            "Cancel"
          ) : (
            <>
              <Plus size={16} /> Add Link
            </>
          )}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="bg-gray-50 p-4 rounded-md border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              required
              value={newLink.name}
              onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <input
              required
              type="text"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Order</label>
            <input
              required
              type="number"
              value={newLink.order}
              onChange={(e) =>
                setNewLink({ ...newLink, order: parseInt(e.target.value) })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Save Link
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Name</th>
              <th className="p-3">URL</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[...items]
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3">{item.order}</td>
                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3 text-blue-600">{item.url}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InternalLinksManager() {
  const items = useStore((state) => state.internalLinks);
  const addLink = useStore((state) => state.addInternalLink);
  const deleteLink = useStore((state) => state.deleteInternalLink);

  const [isAdding, setIsAdding] = useState(false);
  const [newLink, setNewLink] = useState({
    name: "",
    url: "",
    order: items.length + 1,
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const promise = new Promise((resolve) => {
      addLink(newLink);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: "Link Added Successfully",
      error: "Save Failed",
    });
    setIsAdding(false);
    setNewLink({ name: "", url: "", order: items.length + 2 });
  };

  const handleDelete = (id: string) => {
    const promise = new Promise((resolve) => {
      deleteLink(id);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Deleting...",
      success: "Deleted Successfully",
      error: "Delete Failed",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-lg font-semibold">Internal Links Management</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm flex items-center gap-1 hover:bg-blue-700"
        >
          {isAdding ? (
            "Cancel"
          ) : (
            <>
              <Plus size={16} /> Add Link
            </>
          )}
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="bg-gray-50 p-4 rounded-md border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              required
              value={newLink.name}
              onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <input
              required
              type="text"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Order</label>
            <input
              required
              type="number"
              value={newLink.order}
              onChange={(e) =>
                setNewLink({ ...newLink, order: parseInt(e.target.value) })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Save Link
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Name</th>
              <th className="p-3">URL</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {[...items]
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3">{item.order}</td>
                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3 text-blue-600">{item.url}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface WordEditableBlockProps {
  fieldKey: string;
  value: string;
  label: string;
  onSave: (fieldKey: string, newValue: string) => void;
}

function WordEditableBlock({ fieldKey, value, label, onSave }: WordEditableBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(fieldKey, tempValue);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-sky-50 border-2 border-sky-400 rounded-lg p-3 my-2 shadow-[0_4px_12px_rgba(14,165,233,0.15)] transition-all text-left">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded uppercase tracking-wider">
            Editing Segment
          </span>
          <span className="text-[9px] text-gray-500 font-mono">Key: {fieldKey}</span>
        </div>
        <textarea
          className="w-full text-sm p-3 outline-none border border-sky-300 rounded focus:ring-2 focus:ring-sky-500 font-serif leading-relaxed h-32 text-black bg-white"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-2">
          <button
            onClick={() => setIsEditing(false)}
            className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1 bg-sky-600 text-white text-xs font-bold rounded hover:bg-sky-700 transition-colors shadow-sm flex items-center gap-1"
          >
            ✓ Save Text
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="relative text-[11.5pt] text-justify leading-relaxed cursor-pointer p-2 rounded hover:bg-yellow-50 hover:ring-2 hover:ring-amber-300/85 hover:shadow-sm transition-all group select-none duration-150 border border-dashed border-zinc-200 hover:border-transparent font-serif text-black min-h-[2.5rem] flex items-center"
      title="Click directly to edit this section in Microsoft Word mode..."
    >
      <div className="w-full whitespace-pre-wrap">{value || <span className="text-gray-400 italic font-sans text-xs">[Click to enter paragraph content]</span>}</div>
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm">
        Edit Segment
      </div>
    </div>
  );
}

function SFDescriptionsManager() {
  const sfDescriptions = useStore((state) => state.sfDescriptions);
  const updateSFDescription = useStore((state) => state.updateSFDescription);
  const config = useStore((state) => state.config);
  const updateConfig = useStore((state) => state.updateConfig);
  const sfFixedTexts = useStore((state) => state.sfFixedTexts) || {};
  const updateSFFixedText = useStore((state) => state.updateSFFixedText);

  const [activeSubTab, setActiveSubTab] = useState<"desc" | "fixed">("desc");
  const [selectedSFType, setSelectedSFType] = useState("SF-1");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleEdit = (id: string, currentValue: string) => {
    setEditingId(id);
    setEditValue(currentValue);
  };

  const handleSave = (id: string) => {
    const promise = new Promise((resolve) => {
      updateSFDescription(id, editValue);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: "Updated Details Successfully",
      error: "Update Failed",
    });
    setEditingId(null);
  };

  const handleSaveDirect = (key: string, newValue: string) => {
    if (!updateSFFixedText) return;
    const promise = new Promise((resolve) => {
      updateSFFixedText(selectedSFType, key, newValue);
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Saving update to template...",
      success: `Saved segment "${fixedTextLabels[selectedSFType]?.[key] || key}"`,
      error: "Error saving segment",
    });
  };

  const showPdfPreview = config.showSfPdfPreview !== "false";

  const togglePdfPreview = () => {
    const newValue = showPdfPreview ? "false" : "true";
    updateConfig("showSfPdfPreview", newValue);
    toast.success(`SF PDF Side Preview turned ${newValue === "true" ? "ON" : "OFF"}`);
  };

  // Helper labels for fixed text keys to make them clear to the admin
  const fixedTextLabels: Record<string, Record<string, string>> = {
    "SF-1": {
      whereContemplatedPending: "Contemplated/Pending Case Opening Clause",
      servantContemplatedPending: "Contemplated/Pending Servant Subheading",
      whereCriminalCase: "Criminal Investigation/Trial Case Opening Clause",
      servantCriminalCase: "Criminal Case Servant Subheading",
      placeUnderSuspensionText: "Suspension Authority & Rule 4 Power Clause",
      placeUnderSuspensionSuff: "Places Under Suspension Statement",
      furtherOrderedHeader: "Period in Force Suffix Header",
      cannotLeaveHq: "HQ Leave Restriction Clause",
      copyToDefault: "Subsistence Allowance defaults"
    },
    "SF-4": {
      whereasPlace: "Original Suspension Clause Opening",
      underSuspension: "Under Suspension label",
      wasMadeDeemed: "Was Made or Deemed text",
      revokesSaidOrder: "Authority Power Revocation Clause"
    },
    "SF-5": {
      proposesInquiry: "Rule 9 Inquiry Proposal Paragraph",
      directedSubmit: "Defense Statement Direction Suffix"
    },
    "SF-11": {
      proposesAction: "Rule 11 Minor Action Proposal Paragraph",
      givenOpportunity: "Opportunity Representation Submission details"
    }
  };

  const getSfWordCount = () => {
    const currentSfTexts = sfFixedTexts[selectedSFType] || {};
    let totalWords = 0;
    Object.values(currentSfTexts).forEach((text) => {
      totalWords += String(text).split(/\s+/).filter(Boolean).length;
    });
    return totalWords;
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Standard Form (SF) Management</h3>
          <p className="text-sm text-gray-500">Configure layout preferences, SF Descriptions, and pre-defined form template texts.</p>
        </div>
        <div className="flex items-center bg-white border border-gray-200 rounded-lg p-3 shadow-sm gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Side PDF Preview</span>
            <span className="text-xs text-gray-500">Enable/disable preview pane on right side</span>
          </div>
          <button
            onClick={togglePdfPreview}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              showPdfPreview ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                showPdfPreview ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab("desc")}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeSubTab === "desc"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Manage SF Use Cases & Info Tabs
        </button>
        <button
          onClick={() => setActiveSubTab("fixed")}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
            activeSubTab === "fixed"
              ? "border-blue-600 text-blue-600 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          }`}
        >
          Edit Templates Fixed / Predefined Texts
        </button>
      </div>

      {activeSubTab === "desc" ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg p-3">
            <strong>Info:</strong> These descriptions appear alongside the standard forms selection menu tabs as guide texts to assist administrative staff.
          </div>
          <div className="grid grid-cols-[100px_1fr_100px] gap-4 font-bold text-gray-600 bg-gray-100 p-3 rounded-t border-b uppercase text-sm">
            <div>Form ID</div>
            <div>Description / Use Case</div>
            <div className="text-right">Action</div>
          </div>

          {Object.entries(sfDescriptions).map(([id, desc]) => (
            <div key={id} className="grid grid-cols-[100px_1fr_100px] gap-4 items-center bg-white border border-gray-200 p-3 rounded shadow-sm hover:border-blue-300 transition-colors">
              <div className="font-bold text-gray-800">{id}</div>
              
              {editingId === id ? (
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 px-3 py-2 text-sm text-gray-800 h-24 whitespace-pre-wrap"
                  autoFocus
                />
              ) : (
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{desc}</div>
              )}
              
              <div className="flex justify-end gap-2">
                {editingId === id ? (
                  <>
                    <button
                      onClick={() => handleSave(id)}
                      className="p-1 px-3 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded text-xs hover:bg-emerald-100 font-bold"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 px-2 border rounded text-xs text-gray-600 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleEdit(id, desc)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit info"
                  >
                    <Edit size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-900 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between shadow-sm">
            <div className="space-y-1">
              <p className="text-sm font-bold flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                Microsoft Word Document Preview Editor
              </p>
              <p className="text-xs text-blue-700 font-medium">
                The panel on the right simulates the printed PDF page in A4 dimension in Times New Roman. <strong>Click directly on any paragraph in the word document to edit it instantly!</strong>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 bg-white border rounded-lg p-2 shadow-sm">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Choose Standard Form:</label>
              <select
                value={selectedSFType}
                onChange={(e) => {
                  setSelectedSFType(e.target.value);
                }}
                className="border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-xs py-1 px-2.5 bg-slate-50 font-semibold"
              >
                <option value="SF-1">SF-1 (Suspension Order)</option>
                <option value="SF-4">SF-4 (Revocation of Suspension)</option>
                <option value="SF-5">SF-5 (Major Penalty Memorandum)</option>
                <option value="SF-11">SF-11 (Minor Penalty Memorandum)</option>
              </select>
            </div>
          </div>

          {/* Interactive Dual Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Hand: Segment Key list for backup/quick overview */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b pb-2 mb-3">
                  Document Text Segments ({Object.keys(sfFixedTexts[selectedSFType] || {}).length})
                </h4>
                <div className="space-y-3 max-h-[750px] overflow-y-auto pr-1">
                  {Object.entries(sfFixedTexts[selectedSFType] || {}).map(([key, value]) => {
                    const label = fixedTextLabels[selectedSFType]?.[key] || key;
                    return (
                      <div key={key} className="p-3 bg-zinc-50 border border-zinc-200 hover:border-blue-300 rounded-lg group transition-all text-left">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-mono font-bold text-blue-600 truncate max-w-[150px]" title={key}>{key}</span>
                          <span className="text-[10px] text-gray-500 bg-gray-250 px-1.5 py-0.5 rounded font-sans truncate">{label}</span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-3 italic mb-2">"{value}"</p>
                        <div className="flex justify-between items-center text-[10px] text-zinc-400 font-sans">
                          <span>Word Count: {String(value).split(/\s+/).filter(Boolean).length}</span>
                          <span className="text-blue-500 font-bold group-hover:underline">Click in Page to Edit →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tips footer */}
              <div className="bg-yellow-50/50 border border-yellow-200 p-4 rounded-xl text-left">
                <h5 className="text-xs font-bold text-yellow-800 mb-1">💡 Pro-Tip for Administrators:</h5>
                <p className="text-xs text-yellow-700 leading-relaxed">
                  These texts support dynamic formatting on generation. Keep essential railway rule citations intact (e.g. <em>RS (D&A) Rules, 1968</em>) to keep legal validity uncompromised.
                </p>
              </div>
            </div>

            {/* Right Hand: The Word Processor desk simulation */}
            <div className="lg:col-span-8 flex flex-col items-center bg-zinc-100 border border-zinc-300 rounded-xl p-4 lg:p-6 shadow-inner">
              
              {/* MS Word simulated Top Ribbon */}
              <div className="bg-white border border-zinc-200 w-full mb-4 py-2 px-3 rounded-lg shadow-sm text-xs flex flex-wrap justify-between items-center text-zinc-600 font-sans gap-2 select-none">
                <div className="flex items-center gap-2 font-semibold">
                  <FileText className="text-blue-600" size={16} />
                  <span className="border-r pr-2 border-zinc-300">Form_Template_{selectedSFType}.docx</span>
                  <span className="text-[10px] bg-sky-50 text-sky-700 px-1 py-0.5 rounded border border-sky-200 font-mono">PAGE VIEW (A4 SIZE)</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                  <span className="hidden sm:inline">Lines Format: <strong className="text-zinc-700">Times New Roman (Pt 12)</strong></span>
                  <span className="hidden sm:inline">|</span>
                  <span>Words: <strong className="text-zinc-700">{getSfWordCount()}</strong></span>
                  <span>|</span>
                  <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Saved to Cloud</span>
                </div>
              </div>

              {/* Simulated ruler for MS Word feel */}
              <div className="w-full max-w-[210mm] hidden lg:block bg-white border-b border-zinc-300 h-5 relative text-[9px] text-zinc-400 select-none font-sans mb-1">
                <div className="absolute left-[18mm] right-[18mm] border-x border-dashed border-red-200 h-full flex justify-between items-center text-zinc-500">
                  <span>|◄ 1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                  <span>6</span>
                  <span>7</span>
                  <span>8</span>
                  <span>9</span>
                  <span>10</span>
                  <span>11</span>
                  <span>12</span>
                  <span>13</span>
                  <span>14</span>
                  <span>15</span>
                  <span>16 ►|</span>
                </div>
              </div>

              {/* Simulated Paper sheet */}
              <div className="w-full max-w-[210mm] min-h-[297mm] bg-white border border-zinc-300 shadow-2xl p-[14mm] sm:p-[18mm] relative text-black font-serif break-words text-justify flex flex-col justify-between hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] transition-shadow duration-300">
                
                {/* Print area / standard content */}
                <div>
                  {selectedSFType === "SF-1" && (
                    <div className="w-full mx-auto py-2">
                      {/* Logo and Government of India Header */}
                      <div className="text-center font-serif mb-6 leading-tight">
                        <div className="text-[14pt] font-extrabold uppercase tracking-widest text-zinc-800">STANDARD FORM NO. 1</div>
                        <div className="text-[9pt] italic mt-1 text-zinc-500 font-sans">
                          [See Rule 4 of the Railway Servants (Discipline and Appeal) Rules, 1968]
                        </div>
                        <div className="text-[12pt] font-extrabold uppercase border-b-2 border-black inline-block mt-4 pb-0.5 tracking-wide px-4">
                          ORDER OF SUSPENSION
                        </div>
                      </div>

                      {/* Number and Location row */}
                      <div className="flex justify-between text-[11pt] mb-8 font-serif leading-relaxed text-zinc-700">
                        <div>
                          <strong>No.</strong> <span className="text-zinc-400 underline">SF-1/SUSP-PRO/2026/04</span>
                        </div>
                        <div className="text-right">
                          <p><strong>Place of Issue:</strong> <span className="text-zinc-400 underline">N.F. Railway Headquarter</span></p>
                          <p className="mt-1"><strong>Dated:</strong> <span className="text-zinc-400 underline">08/06/2026</span></p>
                        </div>
                      </div>

                      {/* Twin Column legal reason segments */}
                      <div className="grid grid-cols-1 md:grid-cols-[48%_4%_48%] gap-1 text-[11px] sm:text-[11pt] font-serif leading-[1.3] mb-6">
                        {/* Column 1 - Pending Discipline */}
                        <div className="border border-zinc-200 rounded p-2 bg-zinc-50/25">
                          <WordEditableBlock
                            fieldKey="whereContemplatedPending"
                            value={sfFixedTexts["SF-1"]?.whereContemplatedPending || ""}
                            label={fixedTextLabels["SF-1"]?.whereContemplatedPending || "whereContemplatedPending"}
                            onSave={handleSaveDirect}
                          />
                          
                          <div className="my-3 px-3 py-2 bg-zinc-100/80 border border-dashed border-zinc-300 text-center text-[10px] text-zinc-500 rounded font-sans italic">
                            [Name, Salutation, Designation & Emp No will go here dynamically]
                          </div>

                          <WordEditableBlock
                            fieldKey="servantContemplatedPending"
                            value={sfFixedTexts["SF-1"]?.servantContemplatedPending || ""}
                            label={fixedTextLabels["SF-1"]?.servantContemplatedPending || "servantContemplatedPending"}
                            onSave={handleSaveDirect}
                          />
                        </div>

                        {/* Mid Or Line */}
                        <div className="flex md:flex-col items-center justify-center relative my-2 md:my-0">
                          <div className="w-full md:w-[1px] h-[1px] md:h-full bg-zinc-300"></div>
                          <span className="absolute bg-white px-2 py-0.5 text-[9px] md:text-[10px] font-bold font-sans text-zinc-400 border rounded-full">OR</span>
                        </div>

                        {/* Column 2 - Criminal Case */}
                        <div className="border border-zinc-200 rounded p-2 bg-zinc-50/25">
                          <WordEditableBlock
                            fieldKey="whereCriminalCase"
                            value={sfFixedTexts["SF-1"]?.whereCriminalCase || ""}
                            label={fixedTextLabels["SF-1"]?.whereCriminalCase || "whereCriminalCase"}
                            onSave={handleSaveDirect}
                          />
                          
                          <div className="my-3 px-3 py-2 bg-zinc-100/80 border border-dashed border-zinc-300 text-center text-[10px] text-zinc-500 rounded font-sans italic">
                            [Name, Salutation, Designation & Emp No will go here dynamically]
                          </div>

                          <WordEditableBlock
                            fieldKey="servantCriminalCase"
                            value={sfFixedTexts["SF-1"]?.servantCriminalCase || ""}
                            label={fixedTextLabels["SF-1"]?.servantCriminalCase || "servantCriminalCase"}
                            onSave={handleSaveDirect}
                          />
                        </div>
                      </div>

                      {/* Main suspension command directive */}
                      <div className="space-y-4 text-[11pt] font-serif leading-[1.5] text-justify mt-8">
                        <div className="border border-zinc-100 rounded p-2">
                          <WordEditableBlock
                            fieldKey="placeUnderSuspensionText"
                            value={sfFixedTexts["SF-1"]?.placeUnderSuspensionText || ""}
                            label={fixedTextLabels["SF-1"]?.placeUnderSuspensionText || "placeUnderSuspensionText"}
                            onSave={handleSaveDirect}
                          />
                          
                          <div className="inline-block my-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-xs text-amber-700 rounded font-sans font-bold">
                            Shri. Ashok Kumar, Sr. Section Engineer, N.F. Railway
                          </div>

                          <WordEditableBlock
                            fieldKey="placeUnderSuspensionSuff"
                            value={sfFixedTexts["SF-1"]?.placeUnderSuspensionSuff || ""}
                            label={fixedTextLabels["SF-1"]?.placeUnderSuspensionSuff || "placeUnderSuspensionSuff"}
                            onSave={handleSaveDirect}
                          />
                          <span className="font-serif ml-1">with immediate effect / with effect from 08/06/2026.</span>
                        </div>
                      </div>

                      {/* Residence Headquarters clause */}
                      <div className="space-y-4 text-[11pt] font-serif leading-[1.5] text-justify mt-6 border border-zinc-100 rounded p-2">
                        <WordEditableBlock
                          fieldKey="furtherOrderedHeader"
                          value={sfFixedTexts["SF-1"]?.furtherOrderedHeader || ""}
                          label={fixedTextLabels["SF-1"]?.furtherOrderedHeader || "furtherOrderedHeader"}
                          onSave={handleSaveDirect}
                        />
                        
                        <div className="inline-block my-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 text-xs text-amber-700 rounded font-sans font-bold">
                          Shri. Ashok Kumar
                        </div>

                        <WordEditableBlock
                          fieldKey="cannotLeaveHq"
                          value={sfFixedTexts["SF-1"]?.cannotLeaveHq || ""}
                          label={fixedTextLabels["SF-1"]?.cannotLeaveHq || "cannotLeaveHq"}
                          onSave={handleSaveDirect}
                        />
                      </div>

                      {/* Subsistence Allowance copy footer */}
                      <div className="mt-8 pt-6 border-t border-dashed border-zinc-200">
                        <div className="text-[10pt] font-serif leading-relaxed text-zinc-600 bg-zinc-50 border border-dashed rounded p-3 text-left">
                          <div className="font-bold text-[8.5px] font-sans text-zinc-400 uppercase tracking-widest mb-1.5">[SUBSISTENCE ALLOWANCE DEFAULT TEXT COPIED INTO COPY-TO]</div>
                          <WordEditableBlock
                            fieldKey="copyToDefault"
                            value={sfFixedTexts["SF-1"]?.copyToDefault || ""}
                            label={fixedTextLabels["SF-1"]?.copyToDefault || "copyToDefault"}
                            onSave={handleSaveDirect}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedSFType === "SF-4" && (
                    <div className="w-full mx-auto py-2">
                      {/* Title Header */}
                      <div className="text-center font-serif mb-6 leading-tight">
                        <div className="text-[14pt] font-extrabold uppercase tracking-widest text-zinc-800">STANDARD FORM NO. 4</div>
                        <div className="text-[9pt] italic mt-1 text-zinc-500 font-sans">
                          [See Rule 5(5)(c) of the Railway Servants (Discipline and Appeal) Rules, 1968]
                        </div>
                        <div className="text-[12pt] font-extrabold uppercase border-b-2 border-black inline-block mt-4 pb-0.5 tracking-wide px-4">
                          ORDER OF REVOCATION OF SUSPENSION
                        </div>
                      </div>

                      {/* Number and Date block */}
                      <div className="flex justify-between text-[11pt] mb-8 font-serif">
                        <div>
                          <strong>No.</strong> <span className="text-zinc-400 underline">SF-4/REV-PRO/2026/11</span>
                        </div>
                        <div className="text-right">
                          <p><strong>Place of Issue:</strong> <span className="text-zinc-400 underline">Maligaon, Guwahati</span></p>
                          <p className="mt-1"><strong>Dated:</strong> <span className="text-zinc-400 underline">08/06/2026</span></p>
                        </div>
                      </div>

                      {/* Paragraph 1 - Original placement under suspension */}
                      <div className="text-[11pt] font-serif leading-[1.65] space-y-4 border border-zinc-100 rounded p-2 text-justify">
                        <WordEditableBlock
                          fieldKey="whereasPlace"
                          value={sfFixedTexts["SF-4"]?.whereasPlace || ""}
                          label={fixedTextLabels["SF-4"]?.whereasPlace || "whereasPlace"}
                          onSave={handleSaveDirect}
                        />
                        
                        <div className="inline-block my-1 px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-xs text-amber-700 font-sans font-bold rounded">
                          Shri. Rajesh Kumar, Assistant Comptroller (Admn)
                        </div>

                        <WordEditableBlock
                          fieldKey="underSuspension"
                          value={sfFixedTexts["SF-4"]?.underSuspension || ""}
                          label={fixedTextLabels["SF-4"]?.underSuspension || "underSuspension"}
                          onSave={handleSaveDirect}
                        />

                        <WordEditableBlock
                          fieldKey="wasMadeDeemed"
                          value={sfFixedTexts["SF-4"]?.wasMadeDeemed || ""}
                          label={fixedTextLabels["SF-4"]?.wasMadeDeemed || "wasMadeDeemed"}
                          onSave={handleSaveDirect}
                        />
                        
                        <span className="font-serif underline"> 01/05/2026</span>.
                      </div>

                      {/* Paragraph 2 - Action of revocation */}
                      <div className="text-[11pt] font-serif leading-[1.65] mt-8 border border-zinc-100 rounded p-2 text-justify">
                        <WordEditableBlock
                          fieldKey="revokesSaidOrder"
                          value={sfFixedTexts["SF-4"]?.revokesSaidOrder || ""}
                          label={fixedTextLabels["SF-4"]?.revokesSaidOrder || "revokesSaidOrder"}
                          onSave={handleSaveDirect}
                        />
                        <span className="font-serif ml-1 text-black">with immediate effect / with effect from <span className="underline">08/06/2026</span>.</span>
                      </div>
                    </div>
                  )}

                  {selectedSFType === "SF-5" && (
                    <div className="w-full mx-auto py-2">
                      {/* Title Header */}
                      <div className="text-center font-serif mb-6 leading-tight">
                        <div className="text-[14pt] font-extrabold uppercase tracking-widest text-zinc-800">STANDARD FORM NO. 5</div>
                        <div className="text-[9pt] italic mt-1 text-zinc-500 font-sans">
                          [See Rule 9 of the Railway Servants (Discipline and Appeal) Rules, 1968]
                        </div>
                        <div className="text-[12pt] font-extrabold uppercase border-b-2 border-black inline-block mt-4 pb-0.5 tracking-wide px-4">
                          MEMORANDUM OF MAJOR PENALTY INQUIRY
                        </div>
                      </div>

                      {/* Number and Date block */}
                      <div className="flex justify-between text-[11pt] mb-8 font-serif">
                        <div>
                          <strong>No.</strong> <span className="text-zinc-400 underline">SF-5/MJ-CHARGE/2026/02</span>
                        </div>
                        <div className="text-right">
                          <p className="mt-1"><strong>Dated:</strong> <span className="text-zinc-400 underline">08/06/2026</span></p>
                        </div>
                      </div>

                      {/* Body List of points */}
                      <div className="text-[11pt] font-serif leading-[1.65] space-y-6 text-justify">
                        {/* Point 1 */}
                        <div className="flex border border-zinc-100 rounded p-2">
                          <div className="w-8 shrink-0 font-bold font-sans">1.</div>
                          <div className="flex-1">
                            <WordEditableBlock
                              fieldKey="proposesInquiry"
                              value={sfFixedTexts["SF-5"]?.proposesInquiry || ""}
                              label={fixedTextLabels["SF-5"]?.proposesInquiry || "proposesInquiry"}
                              onSave={handleSaveDirect}
                            />
                          </div>
                        </div>

                        {/* List elements standard non-editable for PDF realism */}
                        <div className="flex text-zinc-400/80 p-2 italic select-none">
                          <div className="w-8 shrink-0 font-sans">2.</div>
                          <div className="flex-1">
                            The substance of the imputations of misconduct or misbehaviour in respect of which the inquiry is proposed is set out in the enclosed statement of articles of charge (Annexure I).
                          </div>
                        </div>

                        <div className="flex text-zinc-400/80 p-2 italic select-none">
                          <div className="w-8 shrink-0 font-sans">3.</div>
                          <div className="flex-1 font-serif">
                            A statement of the imputations of misconduct or misbehaviour in support of each article of charge is enclosed (Annexure II) along with lists of documents (Annexure III) and witnesses (Annexure IV).
                          </div>
                        </div>

                        {/* Point 4 */}
                        <div className="flex border border-zinc-100 rounded p-2">
                          <div className="w-8 shrink-0 font-bold font-sans">4.</div>
                          <div className="flex-1">
                            <WordEditableBlock
                              fieldKey="directedSubmit"
                              value={sfFixedTexts["SF-5"]?.directedSubmit || ""}
                              label={fixedTextLabels["SF-5"]?.directedSubmit || "directedSubmit"}
                              onSave={handleSaveDirect}
                            />
                            
                            {/* Nested Word list details */}
                            <div className="mt-3 pl-4 space-y-1 text-xs font-sans text-gray-500">
                              <p>• <strong>(a)</strong> To state whether he wishes to be heard in person; and</p>
                              <p className="mt-1">• <strong>(b)</strong> To furnish names & addresses of support witnesses within 10 days duration limits.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedSFType === "SF-11" && (
                    <div className="w-full mx-auto py-2">
                      {/* Title Header */}
                      <div className="text-center font-serif mb-6 leading-tight">
                        <div className="text-[14pt] font-extrabold uppercase tracking-widest text-zinc-800">STANDARD FORM NO. 11</div>
                        <div className="text-[9pt] italic mt-1 text-zinc-500 font-sans">
                          [See Rule 11 of the Railway Servants (Discipline and Appeal) Rules, 1968]
                        </div>
                        <div className="text-[12pt] font-extrabold uppercase border-b-2 border-black inline-block mt-4 pb-0.5 tracking-wide px-4">
                          MEMORANDUM OF MINOR PENALTY CHARGESSHEET
                        </div>
                      </div>

                      {/* Number and Date block */}
                      <div className="flex justify-between text-[11pt] mb-8 font-serif">
                        <div>
                          <strong>No.</strong> <span className="text-zinc-400 underline">SF-11/MN-CHARGE/2026/09</span>
                        </div>
                        <div className="text-right">
                          <p className="mt-1"><strong>Dated:</strong> <span className="text-zinc-400 underline">08/06/2026</span></p>
                        </div>
                      </div>

                      {/* Body List of points */}
                      <div className="text-[11pt] font-serif leading-[1.65] space-y-6 text-justify">
                        {/* Point 1 */}
                        <div className="flex border border-zinc-100 rounded p-2">
                          <div className="w-8 shrink-0 font-bold font-sans">1.</div>
                          <div className="flex-1">
                            <WordEditableBlock
                              fieldKey="proposesAction"
                              value={sfFixedTexts["SF-11"]?.proposesAction || ""}
                              label={fixedTextLabels["SF-11"]?.proposesAction || "proposesAction"}
                              onSave={handleSaveDirect}
                            />
                          </div>
                        </div>

                        {/* Point 2 */}
                        <div className="flex border border-zinc-100 rounded p-2">
                          <div className="w-8 shrink-0 font-bold font-sans">2.</div>
                          <div className="flex-1">
                            <WordEditableBlock
                              fieldKey="givenOpportunity"
                              value={sfFixedTexts["SF-11"]?.givenOpportunity || ""}
                              label={fixedTextLabels["SF-11"]?.givenOpportunity || "givenOpportunity"}
                              onSave={handleSaveDirect}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer and Signatures block in document */}
                <div className="flex justify-between items-end mt-12 pt-6 border-t border-zinc-200/60 font-serif text-[11pt] select-none text-left">
                  <div className="text-[9.5pt] text-zinc-400 leading-tight">
                    <p className="font-bold font-sans text-[8px] uppercase tracking-wider text-zinc-400 mb-1">Standard Document Footer Details</p>
                    Enclosures:<br />
                    - Annexure I, II & III where applicable.<br />
                    - General Acknowledgment Slip.
                  </div>
                  <div className="text-right w-[45%] border-t border-dashed border-zinc-300 pt-3">
                    <p className="font-bold text-zinc-700">Signature: __________________</p>
                    <p className="text-xs text-zinc-500 mt-1">Designation: <strong>(Disciplinary/Competent Authority)</strong></p>
                    <p className="text-[9px] text-zinc-400 mt-0.5">NORTH EAST FRONTIER RAILWAY</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// Audio Manager Helper
function AudioManager() {
  const audioAnnouncement = useStore((state) => state.audioAnnouncement);
  const updateAudioAnnouncement = useStore(
    (state) => state.updateAudioAnnouncement,
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const promise = new Promise(async (resolve, reject) => {
      try {
        const url = await uploadToStorage(file, 'audio');
        updateAudioAnnouncement({ audio: url });
        resolve(true);
      } catch (err) {
        reject(err);
      }
      e.target.value = "";
    });

    toast.promise(promise, {
      loading: "Uploading...",
      success: "Audio Uploaded Successfully",
      error: (err: any) => err.message || "Upload Failed",
    });
  };

  const handleDelete = () => {
    const promise = new Promise((resolve) => {
      updateAudioAnnouncement({ audio: "" });
      setTimeout(resolve, 300);
    });
    toast.promise(promise, {
      loading: "Deleting...",
      success: "Deleted Successfully",
      error: "Delete Failed",
    });
  };

  const handleToggle = (enabled: boolean) => {
    const promise = new Promise((resolve) => {
      updateAudioAnnouncement({ enabled });
      setTimeout(resolve, 200);
    });
    toast.promise(promise, {
      loading: "Saving...",
      success: "Updated Successfully",
      error: "Update Failed",
    });
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Header Audio Management</h3>
          <p className="text-sm text-gray-500">
            Audio displayed in the header region.
          </p>
        </div>
      </div>

      <div className="border border-gray-200 rounded p-4 flex flex-col gap-4 bg-white shadow-sm overflow-hidden relative">
        {!audioAnnouncement?.enabled && (
          <div className="absolute top-2 right-2 bg-gray-800 text-white text-[10px] uppercase font-bold px-2 py-1 rounded z-10">
            Disabled
          </div>
        )}
        <div className="w-full bg-gray-100 flex-shrink-0 flex items-center justify-center p-6 rounded overflow-hidden relative">
          {audioAnnouncement?.audio ? (
            <audio
              controls
              src={audioAnnouncement.audio}
              className={`w-full max-w-sm ${!audioAnnouncement?.enabled ? "opacity-50 grayscale" : ""}`}
            />
          ) : (
            <span className="text-xs text-gray-400">No Audio Uploaded</span>
          )}
        </div>

        <div className="flex flex-col justify-between">
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-4 items-center">
              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-1.5 rounded border">
                <span className="text-xs font-bold text-gray-700">
                  Display:
                </span>
                <input
                  type="checkbox"
                  checked={audioAnnouncement?.enabled || false}
                  onChange={(e) => handleToggle(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-gray-600">
                  {audioAnnouncement?.enabled ? "On" : "Off"}
                </span>
              </label>

              <label className="cursor-pointer bg-[#1c3f60] text-white px-3 py-1.5 rounded text-xs hover:bg-blue-900 transition shadow">
                Replace Audio
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={!audioAnnouncement?.audio}
                className="p-1 px-3 border rounded text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 flex items-center gap-1"
              >
                <Trash2 size={14} /> Delete Audio
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
