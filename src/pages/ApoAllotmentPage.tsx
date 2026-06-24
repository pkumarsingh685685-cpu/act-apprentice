import React, { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  Sparkles, 
  User, 
  Mail, 
  Phone, 
  ChevronRight, 
  Hash, 
  Layers, 
  HelpCircle, 
  X, 
  ChevronLeft, 
  GitFork, 
  Users, 
  PhoneCall, 
  ArrowRight,
  Briefcase,
  Scale,
  Calculator,
  FileText,
  Activity,
  Contact,
  MessageSquare,
  Gavel,
  BookOpen,
  Edit3,
  Settings,
  PlusSquare,
  TrendingUp,
  UserCheck,
  UserPlus,
  Compass,
  FileSpreadsheet,
  Award,
  Lightbulb,
  Wrench,
  Zap,
  Ticket,
  FolderOpen,
  Search,
  CheckCircle,
  Heart,
  GraduationCap,
  Radio,
  FileCheck,
  Download
} from "lucide-react";
import { SEO } from "../components/SEO";
import { ApoWorkAllotment } from "../types";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "sonner";

const getDepartmentCardTheme = (deptName: string, index: number) => {
  const norm = (deptName || "").toUpperCase();
  
  // 11 predefined themes matching the infographic
  const themes = [
    {
      num: "01",
      titleEn: "E/ENGINEERING CADRE AND BILL OF KATIHAR DIVISION",
      titleHi: "(इंजीनियरिंग कैडर और बिल)",
      desc: "All work related to Engineering Cadre & Bill processing.",
      icon: Users,
      borderColor: "border-blue-500",
      textColor: "text-blue-400 font-sans",
      accentBg: "bg-blue-500/10",
      badgeColor: "bg-blue-600",
      bulletColor: "bg-blue-400",
      iconBg: "bg-blue-600/95",
      shadowGlow: "shadow-blue-500/10 hover:shadow-blue-500/20"
    },
    {
      num: "02",
      titleEn: "E/MEDICAL CADRE AND BILL OF KATIHAR DIVISION",
      titleHi: "(मेडिकल कैडर और बिल)",
      desc: "All work related to Medical Cadre & Bill processing.",
      icon: Activity,
      borderColor: "border-emerald-500",
      textColor: "text-emerald-400 font-sans",
      accentBg: "bg-emerald-500/10",
      badgeColor: "bg-emerald-600",
      bulletColor: "bg-emerald-400",
      iconBg: "bg-emerald-600/95",
      shadowGlow: "shadow-emerald-500/10 hover:shadow-emerald-500/20"
    },
    {
      num: "03",
      titleEn: "COURT CELL",
      titleHi: "(कोर्ट सेल)",
      desc: "All court cases, legal matters and related correspondence.",
      icon: Scale,
      borderColor: "border-purple-500",
      textColor: "text-purple-400 font-sans",
      accentBg: "bg-purple-500/10",
      badgeColor: "bg-purple-600",
      bulletColor: "bg-purple-400",
      iconBg: "bg-purple-600/95",
      shadowGlow: "shadow-purple-500/10 hover:shadow-purple-500/20"
    },
    {
      num: "04",
      titleEn: "COORDINATION WITH SECURITY",
      titleHi: "(सुरक्षा समन्वय)",
      desc: "Coordination & liaison with Security Departments.",
      icon: Shield,
      borderColor: "border-orange-500",
      textColor: "text-orange-400 font-sans",
      accentBg: "bg-orange-500/10",
      badgeColor: "bg-orange-600",
      bulletColor: "bg-orange-400",
      iconBg: "bg-orange-600/95",
      shadowGlow: "shadow-orange-500/10 hover:shadow-orange-500/20"
    },
    {
      num: "05",
      titleEn: "ACCOUNTS AND SOTES DEPTT. OF KIR DIVISION",
      titleHi: "(लेखा एवं स्टोर विभाग)",
      desc: "All accounts related work & SOIEs department tasks.",
      icon: Calculator,
      borderColor: "border-cyan-500",
      textColor: "text-cyan-400 font-sans",
      accentBg: "bg-cyan-500/10",
      badgeColor: "bg-cyan-600",
      bulletColor: "bg-cyan-400",
      iconBg: "bg-cyan-600/95",
      shadowGlow: "shadow-cyan-500/10 hover:shadow-cyan-500/20"
    },
    {
      num: "06",
      titleEn: "GENERATION OF UMID CARD",
      titleHi: "(यूएमआईडी कार्ड जनरेशन)",
      desc: "Generation, verification and coordination of UMID Cards.",
      icon: Contact,
      borderColor: "border-pink-500",
      textColor: "text-pink-400 font-sans",
      accentBg: "bg-pink-500/10",
      badgeColor: "bg-pink-600",
      bulletColor: "bg-pink-400",
      iconBg: "bg-pink-600/95",
      shadowGlow: "shadow-pink-500/10 hover:shadow-pink-500/20"
    },
    {
      num: "07",
      titleEn: "E/COMPLAINT",
      titleHi: "(शिकायत निवारण)",
      desc: "Handling employee complaints and ensuring timely redressal.",
      icon: FileText,
      borderColor: "border-indigo-500",
      textColor: "text-indigo-400 font-sans",
      accentBg: "bg-indigo-500/10",
      badgeColor: "bg-indigo-600",
      bulletColor: "bg-indigo-400",
      iconBg: "bg-indigo-600/95",
      shadowGlow: "shadow-indigo-500/10 hover:shadow-indigo-500/20"
    },
    {
      num: "08",
      titleEn: "NIRAKARAN CELL (CPGRAMS) VIP REFERENCE ETC.",
      titleHi: "(निराकरण सेल - CPGRAMS)",
      desc: "CPGRAMS, VIP references and grievance redressal related work.",
      icon: MessageSquare,
      borderColor: "border-rose-500",
      textColor: "text-rose-400 font-sans",
      accentBg: "bg-rose-500/10",
      badgeColor: "bg-rose-600",
      bulletColor: "bg-rose-400",
      iconBg: "bg-rose-600/95",
      shadowGlow: "shadow-rose-500/10 hover:shadow-rose-500/20"
    },
    {
      num: "09",
      titleEn: "E/DAR CELL OF KIR DIV.",
      titleHi: "(डीएआर सेल)",
      desc: "DAR cases processing and related correspondence.",
      icon: Gavel,
      borderColor: "border-teal-500",
      textColor: "text-teal-400 font-sans",
      accentBg: "bg-teal-500/10",
      badgeColor: "bg-teal-600",
      bulletColor: "bg-teal-400",
      iconBg: "bg-teal-600/95",
      shadowGlow: "shadow-teal-500/10 hover:shadow-teal-500/20"
    },
    {
      num: "10",
      titleEn: "RTI CELL OF PERSONNEL DEPARTMENT OF KIR",
      titleHi: "(आरटीआई सेल)",
      desc: "RTI applications handling and information disclosure work.",
      icon: BookOpen,
      borderColor: "border-amber-500",
      textColor: "text-amber-400 font-sans",
      accentBg: "bg-amber-500/10",
      badgeColor: "bg-amber-600",
      bulletColor: "bg-amber-400",
      iconBg: "bg-amber-600/95",
      shadowGlow: "shadow-amber-500/10 hover:shadow-amber-500/20"
    },
    {
      num: "11",
      titleEn: "ANY OTHER WORK ALLOTTED BY SR.DPO/SR.OFFICERS",
      titleHi: "(अन्य आवंटित कार्य)",
      desc: "Any other work assigned by Sr.DPO/Sr. Officers from time to time.",
      icon: Briefcase,
      borderColor: "border-sky-500",
      textColor: "text-sky-400 font-sans",
      accentBg: "bg-sky-500/10",
      badgeColor: "bg-sky-600",
      bulletColor: "bg-sky-400",
      iconBg: "bg-sky-600/95",
      shadowGlow: "shadow-sky-500/10 hover:shadow-sky-500/20"
    }
  ];

  // Map to the theme using keywords from the department name
  if (norm.includes("ENGINEERING")) return themes[0];
  if (norm.includes("MEDICAL")) return themes[1];
  if (norm.includes("COURT") || norm.includes("LEGAL")) return themes[2];
  if (norm.includes("SECURITY")) return themes[3];
  if (norm.includes("ACCOUNTS") || norm.includes("SOTE")) return themes[4];
  if (norm.includes("UMID")) return themes[5];
  if (norm.includes("COMPLAINT")) return themes[6];
  if (norm.includes("NIRAKARAN") || norm.includes("CPGRAMS")) return themes[7];
  if (norm.includes("DAR")) return themes[8];
  if (norm.includes("RTI")) return themes[9];
  if (norm.includes("ANY OTHER") || norm.includes("ALLOTTED")) return themes[10];

  // Fallback pattern if none found
  const fallbackIndex = index % themes.length;
  const t = themes[fallbackIndex];
  return {
    ...t,
    num: String(index + 1).padStart(2, "0"),
    titleEn: deptName,
    titleHi: ""
  };
};

const getSectionIcon = (name: string) => {
  const n = (name || "").toUpperCase();
  if (n.includes("ENGINEERING")) return Settings;
  if (n.includes("MEDICAL")) return PlusSquare;
  if (n.includes("COURT") || n.includes("LEGAL")) return Scale;
  if (n.includes("SECURITY")) return Shield;
  if (n.includes("ACCOUNTS") || n.includes("SOTE") || n.includes("STORES")) return Calculator;
  if (n.includes("UMID")) return Contact;
  if (n.includes("COMPLAINT")) return FileText;
  if (n.includes("NIRAKARAN") || n.includes("CPGRAMS") || n.includes("VIP")) return MessageSquare;
  if (n.includes("DAR CELL") || n.includes("DAR CELL OF KIR")) return Gavel;
  if (n.includes("RTI")) return BookOpen;
  
  if (n.includes("TRAFFIC") || n.includes("TRAFIC")) return Compass;
  if (n.includes("S&T") || n.includes("SIGNAL")) return Radio;
  if (n.includes("RECRUITMENT")) return UserPlus;
  if (n.includes("PERSONNEL")) return FolderOpen;
  if (n.includes("PASS")) return Ticket;
  if (n.includes("AUDIT")) return Search;
  if (n.includes("DHC") || n.includes("INSPECTION")) return FileSpreadsheet;
  if (n.includes("PBR")) return CheckCircle;
  if (n.includes("TRAINING") || n.includes("AWARD")) return Award;
  if (n.includes("UNION")) return Users;
  if (n.includes("R&D") || n.includes("RESEARCH")) return Lightbulb;
  
  if (n.includes("MECHANICAL")) return Wrench;
  if (n.includes("ELECTRICAL")) return Zap;
  if (n.includes("FS SECTION") || n.includes("PENSION")) return FolderOpen;
  if (n.includes("GAZETTED")) return UserCheck;
  if (n.includes("SCOUT") || n.includes("GUIDE")) return Compass;
  if (n.includes("PARLIAMENT")) return FileCheck;
  if (n.includes("FAMILY I CARD") || n.includes("RELHS")) return Contact;
  if (n.includes("APPRENTICE")) return GraduationCap;
  if (n.includes("LABOUR") || n.includes("LAWS")) return Briefcase;
  if (n.includes("WELFARE") || n.includes("NFRWWO")) return Heart;
  
  return Briefcase;
};

const FALLBACK_APOS: ApoWorkAllotment[] = [
  {
    id: "fallback-apo1",
    name: "SHRI PRAVEEN KUMAR KARN",
    designation: "APO/I/KIR",
    order: 1,
    departments: [
      "E/Engineering Cadre and Bill of Katihar Division",
      "E/Medical Cadre and Bill of Katihar Division",
      "Court Cell",
      "Coordination with Security",
      "Accounts and sotes Deptt. Of KIR Division",
      "Generation of Umid Card",
      "E/Complaint",
      "Nirakaran Cell (CPGRAMS) VIP Reference Etc.",
      "E/DAR Cell of KIR Div.",
      "RTI CELL of Personnel Department of KIR.",
      "Any Other Work allotted by Sr.DPO/Sr.Officers"
    ]
  },
  {
    id: "fallback-apo2",
    name: "Shri Lalit Kumar",
    designation: "APO 11",
    order: 2,
    departments: [
      "E/Trafic Cadre and Bill of KIR Div",
      "E/S&T Cadre and Bill of KIR Div",
      "E/Recruitment Section RRB CGA Medically de-categorized",
      "E/Personnel Cadre and Bill of KIR Div & P/Branch Store",
      "E/Pass",
      "Audit",
      "DHC TA & Inspection Note",
      "PBR Vetting",
      "Training of Staff & Awards",
      "E/Union Cell of KIR Div",
      "R&D Section",
      "Any Other Work Alloted by Sr.Officers"
    ]
  },
  {
    id: "fallback-apo3",
    name: "Shri Santosh Kumar Dutta",
    designation: "APO-II",
    order: 3,
    departments: [
      "E/Mechanical Cadre and Bill of KIR Div",
      "E/Electrical(Gen & TRD) Cadre and Bill of KIR Div.",
      "E/FS Section of Entire KIR Div & Pension Adalat",
      "E/Gazetted Section of KIR Div.",
      "Scout and Guide Policy Section",
      "Parliamentary Affairs",
      "Issuing of family I Card in connection with Passes Issuing of RELHS Card",
      "Act apprentice Cell",
      "Labour Laws",
      "All works and activities related to Welfare Section NFRWWO",
      "Any Other work alloted by Sr.Officer"
    ]
  }
];

export default function ApoAllotmentPage({ isEmbedded = false, onActiveStateChange }: { isEmbedded?: boolean, onActiveStateChange?: (isActive: boolean) => void }) {
  const apoWorkAllotments = useStore((state) => state.apoWorkAllotments || []);
  const config = useStore((state) => state.config);
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const navigate = useNavigate();

  const [selectedApoId, setSelectedApoId] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedDetailedEmployee, setSelectedDetailedEmployee] = useState<any | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const isAdmin = useStore((state) => state.isAdmin);

  // Load custom department edits from Firestore settings
  const [customDepts, setCustomDepts] = useState<Record<string, { titleEn?: string; titleHi?: string; desc?: string }>>({});

  const getDeptKey = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, "_");
  };

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "settings"), (snap) => {
      const customizations: Record<string, any> = {};
      snap.forEach((doc) => {
        if (doc.id.startsWith("apo_dept_")) {
          const deptKey = doc.id.replace("apo_dept_", "");
          customizations[deptKey] = doc.data();
        }
      });
      setCustomDepts(customizations);
    }, (err) => {
      console.error("Error loading department customizations:", err);
    });
    return () => unsub();
  }, []);

  const getCustomDepartmentCardTheme = (deptName: string, index: number) => {
    const baseTheme = getDepartmentCardTheme(deptName, index);
    const key = getDeptKey(deptName);
    const custom = customDepts[key];
    if (custom) {
      return {
        ...baseTheme,
        titleEn: custom.titleEn || baseTheme.titleEn,
        titleHi: custom.titleHi || baseTheme.titleHi,
        desc: custom.desc || baseTheme.desc,
      };
    }
    return baseTheme;
  };

  useEffect(() => {
    onActiveStateChange?.(selectedApoId !== null);
  }, [selectedApoId, onActiveStateChange]);

  // Fetch allotted section employees in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "apo_allotted_employees"), (snap) => {
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setEmployees(list);
    }, (err) => {
      console.error("Error loading allotted employees:", err);
    });
    return () => unsub();
  }, []);

  // Fallback translations
  const labels = {
    en: {
      title: "Personnel Branch - Officer Work Allotment",
      subtitle: "Consolidated organization & work distribution of Katihar Personnel Officers",
      headOfficer: "Senior Divisional Personnel Officer (Sr. DPO)",
      headOfficerSub: "Divisional Head of Personnel Branch",
      apoTitle: "Assistant Personnel Officers (APOs)",
      allottedDepts: "Allotted Departments & Sections",
      clickPrompt: "💡 Select any APO Officer card above to visualize section hierarchies, handled duties & staff profiles.",
      contactDetails: "Branch Contacts",
      noApoConfigured: "No Assistant Divisional Personnel Officer assignments are currently configured in general settings.",
      deptHierarchy: "Department Supervision Hierarchy",
      backToConsolidated: "← Back",
      staffWindowHeader: "Department Staff Structure Map",
      noStaffConfigured: "No personnel have been registered for this section yet in general settings.",
      superby: "Supervised & Monitored By",
      backBtn: "Back"
    },
    hi: {
      title: "कार्मिक शाखा - अधिकारी कार्य आवंटन आरेख",
      subtitle: "कटिहार सहायक कार्मिक अधिकारियों का संकलित संगठन एवं विस्तृत कार्य वितरण",
      headOfficer: "वरिष्ठ मंडल कार्मिक अधिकारी (Sr. DPO)",
      headOfficerSub: "कार्मिक शाखा के मंडलीय प्रमुख",
      apoTitle: "सहायक कार्मिक अधिकारी (APO)",
      allottedDepts: "आवंटित विभाग और अनुभाग",
      clickPrompt: "💡 अनुभाग पदानुक्रम, संभाले गए कर्तव्यों और स्टाफ प्रोफाइल को देखने के लिए किसी भी एपीओ अधिकारी कार्ड को चुनें।",
      contactDetails: "कार्यालय संपर्क",
      noApoConfigured: "सामान्य सेटिंग्स में वर्तमान में कोई सहायक कार्मिक अधिकारी असाइनमेंट कॉन्फ़िगर नहीं किया गया है।",
      deptHierarchy: "विभाग पर्यवेक्षण अनुक्रम",
      backToConsolidated: "← वापस",
      staffWindowHeader: "विभाग कर्मचारी पदानुक्रम आरेख",
      noStaffConfigured: "इस अनुभाग के लिए सामान्य सेटिंग्स में अभी तक कोई कर्मचारी पंजीकृत नहीं किया गया है।",
      superby: "पर्यवेक्षित एवं संचालित",
      backBtn: "वापस"
    },
  };

  const currentLabels = labels[currentLang as "en" | "hi"] || labels.en;

  const apoList = apoWorkAllotments.length > 0 
    ? [...apoWorkAllotments].sort((a, b) => a.order - b.order)
    : FALLBACK_APOS;

  const selectedApo = apoList.find((a) => a.id === selectedApoId);

  // Static/dynamic Divisional Head info
  const headOfficerInfo = {
    name: currentLang.startsWith("hi")
      ? (config.srDpoNameHi || "श्री अंजनी प्रसाद श्रीवास्तव")
      : (config.srDpoNameEn || "SHRI ANJANI PRASAD SRIVASTAV"),
    designation: currentLang.startsWith("hi")
      ? (config.srDpoDesignationHi || "वरिष्ठ मंडल कार्मिक अधिकारी (SR.DPO)")
      : (config.srDpoDesignationEn || "SENIOR DIVISIONAL PERSONNEL OFFICER (SR.DPO)"),
  };

  const srDpoWork1 = currentLang.startsWith("hi")
    ? (config.srDpoWork1Hi || "कटिहार मंडल के कार्मिक प्रशासन, स्थापना मामलों और नीतिगत निर्णयों का समग्र पर्यवेक्षण")
    : (config.srDpoWork1En || "Overall Supervision, Personnel Administration & Establishment matters of Katihar Division");

  const srDpoWork2 = currentLang.startsWith("hi")
    ? (config.srDpoWork2Hi || "अंतिम अपीलीय प्राधिकारी, बजट आवंटन और अंतर-विभागीय समन्वय")
    : (config.srDpoWork2En || "Final Appellate Authority, Budget Allocation & Inter-Departmental Coordination");

  const srDpoNote = currentLang.startsWith("hi")
    ? (config.srDpoNoteHi || "सभी फाइल संचलन और सहायक अधिकारियों के कार्य आवंटन वरिष्ठ मंडल कार्मिक अधिकारी के प्रत्यक्ष मार्गदर्शन और प्रशासनिक नियंत्रण में संचालित होते हैं।")
    : (config.srDpoNoteEn || "All files and dynamic allotments are routed under Sr. DPO's direct guidance and administrative control.");

  // Helper to build hierarchy structure tree
  const getDeptEmployeesTree = () => {
    if (!selectedApoId || !selectedDepartment) return [];
    
    // All employees for this APO and department
    const deptEmployees = employees.filter(
      emp => emp.apoId === selectedApoId && emp.department === selectedDepartment
    );

    // Sort by order/serial initially
    const sorted = [...deptEmployees].sort((a, b) => (a.order || 0) - (b.order || 0));

    if (sorted.length === 0) return [];

    // Check if there is manual parent-child organization
    const hasManualHierarchy = sorted.some(emp => emp.parentEmployeeId && emp.parentEmployeeId.trim() !== "");

    if (!hasManualHierarchy && sorted.length > 1) {
      // Auto-hierarchy: Treat first employee as supervisor, others as direct children
      const supervisor = { ...sorted[0] };
      const children = sorted.slice(1).map(child => ({ ...child, children: [] }));
      return [{
        ...supervisor,
        children
      }];
    }

    // Separate into roots (either no parent, or parent isn't in same group)
    const roots = sorted.filter(emp => !emp.parentEmployeeId || !sorted.some(p => p.id === emp.parentEmployeeId));
    
    // Recursive builder to construct children structure
    const buildTree = (node: any): any => {
      const children = sorted.filter(emp => emp.parentEmployeeId === node.id);
      return {
        ...node,
        children: children.map(child => buildTree(child))
      };
    };

    return roots.map(root => buildTree(root));
  };

  const treeNodes = getDeptEmployeesTree();

  // Recursive Tree Component representing Organization Structure
  interface OrgTreeItemProps {
    item: any;
    level?: number;
    key?: string;
  }

  const OrgTreeItem = ({ item, level = 0 }: OrgTreeItemProps) => {
    const isSupervisor = level === 0;

    // Extract employee initials for a professional directory avatar look
    const initials = item.employeeName
      ? item.employeeName.split(" ").filter(Boolean).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
      : "ST";

    return (
      <div className="flex flex-col items-start w-full relative">
        {/* Horizontal connector arm from main trunk to the card */}
        {level > 0 && (
          <>
            <div 
              className="absolute left-[-24px] w-[24px] h-[1.5px] bg-[#6366f1]/50 pointer-events-none"
              style={{ top: "34px" }} 
            />
            {/* Glowing corner dot exactly on the intersection */}
            <div 
              className="absolute left-[-27px] w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.85)] z-10 animate-pulse pointer-events-none"
              style={{ top: "31px" }}
            />
          </>
        )}

        {/* Node Card Box */}
        <div 
          className={`flex flex-col sm:flex-row items-start sm:items-center gap-3.5 w-full p-4 rounded-xl border transition-all duration-300 relative overflow-hidden shadow-md group ${
            isSupervisor
              ? "bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-amber-500/50 hover:border-amber-400 shadow-[0_4px_25px_rgba(245,158,11,0.18)]"
              : "bg-[#071124] border-slate-800/80 hover:border-indigo-500/40 hover:bg-[#0c172e] hover:shadow-[0_4px_15px_rgba(99,102,241,0.06)]"
          }`}
        >
          {/* Accent vertical high-contrast indicator bar */}
          <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${
            isSupervisor 
              ? "bg-gradient-to-b from-amber-400 via-orange-500 to-red-500" 
              : level === 1 
                ? "bg-gradient-to-b from-indigo-500 to-blue-500" 
                : "bg-emerald-500/85"
          }`} />

          {/* Initials Avatar Box */}
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border uppercase tracking-wider relative overflow-hidden ${
            isSupervisor 
              ? "bg-amber-950/50 text-amber-300 border-amber-500/30 shadow-inner" 
              : "bg-slate-900/80 text-indigo-300 border-slate-800"
          }`}>
            {isSupervisor && <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 to-transparent pointer-events-none" />}
            {initials}
          </div>

          {/* Core Employee Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {isSupervisor ? (
                <span className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/20 text-amber-400 text-[8.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md animate-pulse">
                  👑 SECTION SUPERVISOR (प्रभारी)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-slate-800/80 border border-slate-700/50 text-slate-300 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                   सहयोगी स्टाफ (LEVEL {level + 1})
                </span>
              )}
              
              <span className={`text-[8px] font-mono font-bold tracking-widest px-1.5 py-0.5 rounded ml-auto ${
                isSupervisor ? "bg-amber-400/10 text-amber-400" : "bg-indigo-500/10 text-indigo-300"
              }`}>
                {isSupervisor ? "SUPERVISOR (प्रभारी)" : `SUBORDINATE (सहयोगी)`}
              </span>
            </div>

            <div className="mt-1 flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/5 pb-2">
              <div className="space-y-0.5 text-left">
                <span className="font-extrabold text-base leading-tight text-white block group-hover:text-amber-400 transition-colors">
                  {item.employeeName}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <Sparkles size={11} className={isSupervisor ? "text-amber-400 animate-spin-slow" : "text-indigo-400"} />
                  {item.designation}
                </span>
              </div>

              {/* Mobile Phone / Contact Button */}
              {item.contactPhone && (
                <a 
                  href={`tel:${item.contactPhone}`}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-bold text-white bg-emerald-600/20 hover:bg-emerald-600 hover:text-white border border-emerald-500/20 hover:border-emerald-500 rounded-lg transition-all shadow-sm shrink-0 w-full md:w-auto"
                >
                  <Phone size={11} className="text-emerald-400 group-hover:text-white" />
                  <span>Call {item.contactPhone}</span>
                </a>
              )}
            </div>

            {/* Employee Allotted Specific Work */}
            <div className="mt-2 text-left">
              <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider block mb-1">
                ALLOTTED DUTIES & CHARGES (आवंटित कार्य वितरण):
              </span>
              <p className="text-xs text-slate-300 font-medium leading-relaxed bg-[#030a1c]/65 border border-slate-900 p-2.5 rounded-lg whitespace-pre-line group-hover:border-slate-800 transition-all">
                {item.work || item.workAllotment || "General administration assistance & other assigned works as per superior's direction."}
              </p>
            </div>
          </div>
        </div>

        {/* Render children recursively with custom graphical tree padding/trunk lines */}
        {item.children && item.children.length > 0 && (
          <div className="w-full mt-3 space-y-3 relative pl-[24px]">
            {/* Trunk line from this parent down through all children */}
            <div 
              className="absolute left-[0px] top-[-12px] bottom-[34px] w-[1.5px] bg-gradient-to-b from-indigo-500/80 via-indigo-500/40 to-indigo-500/20 pointer-events-none"
            />
            {item.children.map((child: any) => (
              <OrgTreeItem key={child.id} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${isEmbedded ? "min-h-full py-4 text-left" : "min-h-screen py-6 text-left"} bg-[#030a1c] text-slate-100 selection:bg-indigo-500/30 selection:text-white px-3 sm:px-4 lg:px-6 relative overflow-hidden font-sans`}>
      {!isEmbedded && <SEO title={`${currentLabels.title} | Personnel Branch Kir`} />}

      {/* CSS Styles for Rotating Glowing Borders, Shimmers and Ambient animations */}
      <style>{`
        @keyframes rotate-glowing-border {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes shadow-pulse-red-green {
          0%, 100% {
            box-shadow: 0 0 25px rgba(239, 68, 68, 0.45), 0 0 10px rgba(16, 185, 129, 0.2);
          }
          50% {
            box-shadow: 0 0 25px rgba(16, 185, 129, 0.45), 0 0 10px rgba(239, 68, 68, 0.2);
          }
        }
        @keyframes hotel-neon-glow {
          0%, 100% {
            text-shadow: 0 0 4px #fff, 0 0 11px #fff, 0 0 19px #ff4444, 0 0 40px #ff4444, 0 0 80px #ff4444;
            color: #ffffff;
          }
          50% {
            text-shadow: 0 0 4px #fff, 0 0 10px #10b981, 0 0 18px #10b981, 0 0 35px #10b981, 0 0 70px #10b981;
            color: #e2fbf1;
          }
        }
        .srdpo-red-green-border-wrapper {
          position: relative;
          overflow: hidden;
          padding: 2.5px;
          border-radius: 20px;
        }
        .srdpo-red-green-border-wrapper::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(from 0deg, #ef4444 0%, #10b981 25%, #ef4444 50%, #10b981 75%, #ef4444 100%);
          animation: rotate-glowing-border 3.5s linear infinite;
          z-index: 0;
        }
        .srdpo-box-glowing {
          animation: shadow-pulse-red-green 4s ease-in-out infinite;
        }
        .hotel-marquee-text {
          font-family: 'Space Grotesk', 'Inter', sans-serif;
          font-weight: 900;
          letter-spacing: 0.1em;
          animation: hotel-neon-glow 2.5s ease-in-out infinite;
          text-align: center;
        }
        .glowing-border-wrapper {
          position: relative;
          overflow: hidden;
          padding: 2px;
          border-radius: 14px;
        }
        .glowing-border-wrapper::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(from 0deg, #fd2d2d 0%, #3b82f6 25%, #00ff66 50%, #f59e0b 75%, #fd2d2d 100%);
          animation: rotate-glowing-border 4.5s linear infinite;
          z-index: 0;
        }
        .apo-glowing-border-wrapper {
          position: relative;
          overflow: hidden;
          padding: 2.5px;
          border-radius: 16px;
        }
        .apo-glowing-border-wrapper::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: conic-gradient(from 0deg, #a855f7 0%, #3b82f6 30%, #10b981 60%, #e11d48 85%, #a855f7 100%);
          animation: rotate-glowing-border 5s linear infinite;
          z-index: 0;
        }
        /* Custom scrollbar styling for compact lists */
        .custom-compact-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-compact-scroll::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .custom-compact-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 4px;
        }
        .custom-compact-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>

      {/* Cybernetic background space grid and glows */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1630_1px,transparent_1px),linear-gradient(to_bottom,#0c1630_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Standalone Back trigger */}
      {!isEmbedded && (
        <div className="max-w-7xl mx-auto mb-4 relative z-10 flex justify-start">
          <button
            onClick={() => {
              if (selectedApoId) {
                setSelectedDepartment(null);
                setSelectedApoId(null);
              } else {
                navigate(-1);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-black uppercase text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            ← {selectedApoId ? "Back to Dashboard" : "Back"}
          </button>
        </div>
      )}

      <div className="max-w-[1360px] mx-auto relative z-10">
        <AnimatePresence mode="wait">
          {!selectedApoId ? (
            /* CONSOLIDATED DASHBOARD PANEL (ALL 3 APOs SHOWN SIDE-BY-SIDE SAME AS THE VISUAL REFERENCE) */
            <motion.div
              key="consolidated-dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-3 -mt-6"
            >
              {/* Vertical hanging line from ceiling to Sr. DPO box */}
              <div className="hidden lg:flex justify-center -mb-2">
                <div className="w-0.5 h-10 bg-gradient-to-b from-indigo-500/10 via-amber-500/40 to-amber-500 shadow-[0_0_12px_#f59e0b]" />
              </div>

              {/* High-end Official 3D Box for Sr. DPO with corner spotlight light-source beams */}
              <div className="max-w-2xl mx-auto w-full relative z-20 px-2 sm:px-4">
                <div 
                  className="relative bg-gradient-to-b from-[#0e172e] via-[#050b18] to-[#02050f] rounded-2xl py-3 px-6 md:py-4 md:px-8 text-center border border-amber-500/30 shadow-[0_25px_60px_-12px_rgba(0,0,0,0.9),_inset_0_2px_4px_rgba(255,255,255,0.1),_0_0_0_1px_rgba(245,158,11,0.15)] overflow-hidden transition-all duration-500 hover:scale-[1.02] group hover:border-amber-400/50 flex flex-col justify-center"
                  style={{ transformStyle: 'preserve-3d', perspective: '1200px' }}
                >
                  {/* VOLUMETRIC SPOTLIGHT BEAMS (Inspired by User-uploaded image) */}
                  
                  {/* Top-Left Corner Spotlight & Fan Rays */}
                  <div className="absolute top-0 left-0 w-32 h-32 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle at top left, rgba(245,158,11,0.4) 0%, transparent 70%)' }} />
                  <div className="absolute top-0 left-0 pointer-events-none z-10 overflow-hidden w-48 h-48 origin-top-left">
                    {/* Overlapping spotlight beams */}
                    <div className="absolute top-0 left-0 w-[15px] h-[250px] bg-gradient-to-b from-amber-400/40 via-amber-500/10 to-transparent blur-[3px] origin-top-left rotate-[18deg]" />
                    <div className="absolute top-0 left-0 w-[25px] h-[220px] bg-gradient-to-b from-amber-300/45 via-amber-500/12 to-transparent blur-[4px] origin-top-left rotate-[33deg]" />
                    <div className="absolute top-0 left-0 w-[12px] h-[260px] bg-gradient-to-b from-amber-400/35 via-amber-500/8 to-transparent blur-[2px] origin-top-left rotate-[48deg]" />
                  </div>
                  {/* Glowing hardware bulb */}
                  <div className="absolute top-1 left-1 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_12px_6px_rgba(251,191,36,0.95),_0_0_24px_12px_rgba(245,158,11,0.6)] z-20 animate-pulse" />

                  {/* Top-Right Corner Spotlight & Fan Rays */}
                  <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(245,158,11,0.4) 0%, transparent 70%)' }} />
                  <div className="absolute top-0 right-0 pointer-events-none z-10 overflow-hidden w-48 h-48 origin-top-right">
                    {/* Overlapping spotlight beams */}
                    <div className="absolute top-0 right-0 w-[15px] h-[250px] bg-gradient-to-b from-amber-400/40 via-amber-500/10 to-transparent blur-[3px] origin-top-right -rotate-[18deg]" />
                    <div className="absolute top-0 right-0 w-[25px] h-[220px] bg-gradient-to-b from-amber-300/45 via-amber-500/12 to-transparent blur-[4px] origin-top-right -rotate-[33deg]" />
                    <div className="absolute top-0 right-0 w-[12px] h-[260px] bg-gradient-to-b from-amber-400/35 via-amber-500/8 to-transparent blur-[2px] origin-top-right -rotate-[48deg]" />
                  </div>
                  {/* Glowing hardware bulb */}
                  <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_12px_6px_rgba(251,191,36,0.95),_0_0_24px_12px_rgba(245,158,11,0.6)] z-20 animate-pulse" />

                  {/* Bottom-Left Corner Spotlight & Fan Rays */}
                  <div className="absolute bottom-0 left-0 w-32 h-32 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle at bottom left, rgba(245,158,11,0.3) 0%, transparent 70%)' }} />
                  <div className="absolute bottom-0 left-0 pointer-events-none z-10 overflow-hidden w-48 h-48 origin-bottom-left">
                    {/* Overlapping spotlight beams pointing up-right */}
                    <div className="absolute bottom-0 left-0 w-[15px] h-[250px] bg-gradient-to-t from-amber-400/35 via-amber-500/8 to-transparent blur-[3px] origin-bottom-left rotate-[18deg]" />
                    <div className="absolute bottom-0 left-0 w-[22px] h-[220px] bg-gradient-to-t from-amber-300/40 via-amber-500/10 to-transparent blur-[4px] origin-bottom-left rotate-[33deg]" />
                    <div className="absolute bottom-0 left-0 w-[12px] h-[260px] bg-gradient-to-t from-amber-400/30 via-amber-500/6 to-transparent blur-[2px] origin-bottom-left rotate-[48deg]" />
                  </div>
                  {/* Glowing hardware bulb */}
                  <div className="absolute bottom-1 left-1 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_12px_6px_rgba(251,191,36,0.95),_0_0_24px_12px_rgba(245,158,11,0.6)] z-20 animate-pulse" />

                  {/* Bottom-Right Corner Spotlight & Fan Rays */}
                  <div className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(circle at bottom right, rgba(245,158,11,0.3) 0%, transparent 70%)' }} />
                  <div className="absolute bottom-0 right-0 pointer-events-none z-10 overflow-hidden w-48 h-48 origin-bottom-right">
                    {/* Overlapping spotlight beams pointing up-left */}
                    <div className="absolute bottom-0 right-0 w-[15px] h-[250px] bg-gradient-to-t from-amber-400/35 via-amber-500/8 to-transparent blur-[3px] origin-bottom-right -rotate-[18deg]" />
                    <div className="absolute bottom-0 right-0 w-[22px] h-[220px] bg-gradient-to-t from-amber-300/40 via-amber-500/10 to-transparent blur-[4px] origin-bottom-right -rotate-[33deg]" />
                    <div className="absolute bottom-0 right-0 w-[12px] h-[260px] bg-gradient-to-t from-amber-400/30 via-amber-500/6 to-transparent blur-[2px] origin-bottom-right -rotate-[48deg]" />
                  </div>
                  {/* Glowing hardware bulb */}
                  <div className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_12px_6px_rgba(251,191,36,0.95),_0_0_24px_12px_rgba(245,158,11,0.6)] z-20 animate-pulse" />

                  {/* Floating Magic Golden Dust/Particles in the beams */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                    <div className="absolute top-[25%] left-[20%] w-[2px] h-[2px] bg-amber-200 rounded-full animate-ping [animation-duration:3s]" />
                    <div className="absolute top-[40%] left-[15%] w-[1.5px] h-[1.5px] bg-amber-300 rounded-full animate-pulse [animation-duration:2.5s]" />
                    <div className="absolute top-[15%] left-[35%] w-[2px] h-[2px] bg-amber-100 rounded-full animate-pulse [animation-duration:4s]" />
                    <div className="absolute top-[60%] left-[25%] w-[1px] h-[1px] bg-amber-300 rounded-full opacity-60" />
                    
                    <div className="absolute top-[30%] right-[20%] w-[2px] h-[2px] bg-amber-200 rounded-full animate-ping [animation-duration:2.5s]" />
                    <div className="absolute top-[50%] right-[15%] w-[1.5px] h-[1.5px] bg-amber-300 rounded-full animate-pulse [animation-duration:3.5s]" />
                    <div className="absolute top-[20%] right-[40%] w-[2px] h-[2px] bg-amber-100 rounded-full animate-pulse [animation-duration:2s]" />
                    <div className="absolute top-[70%] right-[30%] w-[1px] h-[1px] bg-amber-300 rounded-full opacity-60" />

                    <div className="absolute bottom-[25%] left-[45%] w-[2px] h-[2px] bg-amber-200 rounded-full animate-pulse [animation-duration:3s]" />
                    <div className="absolute bottom-[35%] right-[45%] w-[1.5px] h-[1.5px] bg-amber-300 rounded-full animate-ping [animation-duration:4s]" />
                  </div>

                  {/* 3D Inner Plate Bezel */}
                  <div className="absolute inset-[4px] bg-[#040916]/95 rounded-xl pointer-events-none z-0 border border-amber-950/40" />

                  {/* Inner Contents */}
                  <div className="relative z-10 py-1.5 px-3 space-y-1.5 flex flex-col justify-center">
                    <div className="inline-flex items-center justify-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-950/40 border border-amber-500/30 text-[8px] font-black uppercase text-amber-300 tracking-wider mb-0.5 shadow-md font-mono">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping shrink-0" />
                      <span>DIVISIONAL PERSONNEL BRANCH HEAD</span>
                    </div>

                    {/* Highly Professional 3D Golden text styling */}
                    <h3 className="text-base md:text-lg font-black tracking-widest uppercase select-none bg-gradient-to-b from-amber-100 via-yellow-300 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]">
                      {headOfficerInfo.name}
                    </h3>

                    <p className="text-[9.5px] md:text-[10.5px] font-black text-emerald-400 tracking-wider uppercase px-3 py-1 inline-block bg-emerald-950/60 border border-emerald-500/25 rounded-md shadow-md font-mono self-center">
                      {headOfficerInfo.designation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Official Allotment PDF Download Section */}
              {config?.apoWorkAllotmentPdfUrl && (
                <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 mt-2">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative rounded-2xl overflow-hidden p-0.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-emerald-600 shadow-[0_0_25px_rgba(99,102,241,0.25)]"
                  >
                    <div className="bg-[#050b18]/95 backdrop-blur-md rounded-[14px] p-4 sm:px-6 sm:py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5 text-left">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                          <Download size={18} className="text-emerald-400 animate-pulse" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black tracking-widest uppercase text-emerald-400 font-mono block leading-none mb-1">
                            OFFICIAL GAZETTED ALLOTMENT DOCUMENT
                          </span>
                          <h4 className="text-xs sm:text-sm font-black text-slate-100 uppercase tracking-wide">
                            {currentLang.startsWith("hi") 
                              ? "आधिकारिक कार्य आवंटन आदेश (पीडीएफ डाउनलोड करें)" 
                              : "Official Officer Work Allotment Order (Download PDF)"}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5 max-w-xl">
                            {currentLang.startsWith("hi")
                              ? "वरिष्ठ मंडल कार्मिक अधिकारी द्वारा हस्ताक्षरित एवं जारी किए गए मूल कार्य आवंटन का आधिकारिक आदेश पत्र।"
                              : "Official signed establishment order detailing section duties, supervision matrices & routine link officers."}
                          </p>
                        </div>
                      </div>

                      <a 
                        href={config.apoWorkAllotmentPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black tracking-widest uppercase rounded-xl transition-all duration-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] active:scale-95 cursor-pointer border border-emerald-400/25 shrink-0"
                      >
                        <Download size={14} className="stroke-[3px]" />
                        <span>{currentLang.startsWith("hi") ? "पीडीएफ डाउनलोड करें" : "Download PDF Document"}</span>
                      </a>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* FLOW CONNECTION PIPELINE - Desktop graphical organogram tree line */}
              <div className="hidden lg:block relative h-16 w-full z-10 -mt-2">
                {/* Vertical split leading down */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-10 bg-gradient-to-b from-red-500 via-indigo-500 to-indigo-600" />
                
                {/* Connection center glow circle */}
                <span className="absolute top-8 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8] animate-ping" />
                <span className="absolute top-8 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-indigo-500" />
                
                {/* Left & Right connecting horizontal lines */}
                {/* Calculated center points for 3 columns on a grid is: 16.66% for leftmost, 50% for core center, 83.33% for rightmost */}
                <div className="absolute top-8 left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500" />
                
                {/* Lateral vertical drop lines down to meet column cards */}
                <div className="absolute top-8 left-[16.66%] w-0.5 h-8 bg-purple-500" />
                <span className="absolute top-15 left-[16.66%] -translate-x-1/2 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#c084fc]" />

                <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-blue-500" />
                <span className="absolute top-15 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_#60a5fa]" />

                <div className="absolute top-8 right-[16.66%] w-0.5 h-8 bg-emerald-500" />
                <span className="absolute top-15 right-[16.66%] translate-x-1/2 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#34d399]" />
              </div>

              {/* Grid representation of all 3 Personnel Officers with their dynamic allotments */}
              {(() => {
                const apoList = apoWorkAllotments.length > 0 
                  ? [...apoWorkAllotments].sort((a, b) => a.order - b.order)
                  : FALLBACK_APOS;

                const getCleanApoBadge = (designation: string, idx: number) => {
                  const text = designation.toUpperCase();
                  if (text.includes("/I/") || text.endsWith("/I") || text.endsWith(" 1") || text === "APO I" || idx === 0) return "APO 1";
                  if (text.includes("/II/") || text.endsWith("/II") || text.includes("11") || text.endsWith(" 2") || text === "APO II" || idx === 1) return "APO 2";
                  return "APO 3";
                };

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                    {apoList.map((apo, idx) => {
                      const theme = idx === 0 
                        ? {
                            colorKey: "violet",
                            glowClass: "shadow-[0_0_20px_rgba(168,85,247,0.15)] border-purple-500/50 hover:border-purple-400",
                            avatarBg: "bg-purple-600",
                            badgeText: "text-purple-300 bg-purple-950/70 border border-purple-800/40",
                            itemPill: "bg-purple-600 text-white font-mono",
                            iconColor: "text-purple-400",
                            hoverRowBg: "hover:bg-purple-950/20 hover:border-purple-800/30",
                            btnGradient: "from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 shadow-purple-500/10",
                          }
                        : idx === 1 
                        ? {
                            colorKey: "blue",
                            glowClass: "shadow-[0_0_20px_rgba(59,130,246,0.15)] border-blue-500/50 hover:border-blue-400",
                            avatarBg: "bg-blue-600",
                            badgeText: "text-blue-300 bg-blue-950/70 border border-blue-800/40",
                            itemPill: "bg-blue-600 text-white font-mono",
                            iconColor: "text-blue-400",
                            hoverRowBg: "hover:bg-blue-950/20 hover:border-blue-800/30",
                            btnGradient: "from-blue-600 to-cyan-700 hover:from-blue-500 hover:to-cyan-600 shadow-blue-500/10",
                          }
                        : {
                            colorKey: "emerald",
                            glowClass: "shadow-[0_0_20px_rgba(16,185,129,0.15)] border-emerald-500/50 hover:border-emerald-400",
                            avatarBg: "bg-emerald-600",
                            badgeText: "text-emerald-300 bg-emerald-950/70 border border-emerald-800/40",
                            itemPill: "bg-emerald-600 text-white font-mono",
                            iconColor: "text-emerald-400",
                            hoverRowBg: "hover:bg-emerald-950/20 hover:border-emerald-800/30",
                            btnGradient: "from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-emerald-500/10",
                          };

                      return (
                        <motion.div
                          key={apo.id}
                          whileHover={{ y: -2 }}
                          onClick={() => {
                            setSelectedApoId(apo.id);
                            setSelectedDepartment(null);
                          }}
                          className={`bg-[#060f24]/95 backdrop-blur-md rounded-xl border p-3 flex flex-col justify-between h-full transition-all duration-300 cursor-pointer ${theme.glowClass}`}
                        >
                          <div>
                            {/* Profile Information Slot (Designation placed on the right corner) */}
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedApoId(apo.id);
                                setSelectedDepartment(null);
                              }}
                              className="flex items-center justify-between gap-2 mb-2 p-1.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-indigo-500/30 transition-all cursor-pointer group"
                              title="Click to view full detailed dashboard"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-8 h-8 rounded-full ${theme.avatarBg} flex items-center justify-center text-white font-black text-xs shadow-inner shrink-0 group-hover:scale-105 transition-transform`}>
                                  <User size={14} className="stroke-[2.5]" />
                                </div>
                                <div className="min-w-0 text-left">
                                  <h4 className="text-[11px] font-black text-white group-hover:text-indigo-300 transition-colors tracking-wide uppercase line-clamp-1">
                                    {apo.name}
                                  </h4>
                                  <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest block leading-none mt-0.5">
                                    Click to open dashboard →
                                  </span>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 text-[8.5px] font-black tracking-wider rounded uppercase shrink-0 ${theme.badgeText}`}>
                                {getCleanApoBadge(apo.designation, idx)}
                              </span>
                            </div>

                            {/* Section list subtitle with allotted count */}
                            <div className="flex items-center justify-between mb-1.5 pb-0.5 border-b border-white/5">
                              <span className="text-[9.5px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                                <Briefcase size={10} className={theme.iconColor} />
                                {currentLabels.allottedDepts}
                              </span>
                              <span className="px-1.5 py-0.5 bg-white/5 text-[8.5px] font-extrabold rounded-full border border-white/5 text-slate-300 font-mono">
                                {apo.departments.length}
                              </span>
                            </div>

                            {/* Departments Vertical Stacked list (Ultra compact list gap reduction to fit all 11-12 sections) */}
                            <div className="space-y-1 mb-2.5 text-left">
                              {apo.departments.map((dept, di) => {
                                const cardTheme = getCustomDepartmentCardTheme(dept, di);
                                const displayName = cardTheme.titleEn || dept;
                                const SectionIcon = getSectionIcon(dept);

                                return (
                                  <div
                                    key={di}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedApoId(apo.id);
                                      setSelectedDepartment(dept);
                                    }}
                                    className={`p-1.5 px-2 rounded-lg bg-[#0d1c38]/45 border border-slate-900/60 hover:border-indigo-500/35 flex items-start gap-2 transition-all cursor-pointer group/row ${theme.hoverRowBg}`}
                                  >
                                    {/* Small Index Pill */}
                                    <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[8px] font-black shrink-0 ${theme.itemPill}`}>
                                      {String(di + 1).padStart(2, "0")}
                                    </span>

                                    {/* Action Icon wrapper */}
                                    <div className="mt-0.5 flex items-center justify-center rounded text-slate-300 shrink-0">
                                      <SectionIcon size={11} className={`${theme.iconColor} group-hover/row:scale-110 transition-transform`} />
                                    </div>

                                    {/* Text Title details (Compact with single line clamp) */}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[9.5px] font-bold text-slate-100 group-hover/row:text-indigo-300 transition-all leading-none line-clamp-1 truncate">
                                        {displayName}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Button to open particular APO's full work allotment list (Highly compact) */}
                          <div className="space-y-1.5 mt-1">
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedApoId(apo.id);
                                  setSelectedDepartment(null);
                              }}
                              className={`w-full py-1.5 px-2.5 rounded-lg bg-gradient-to-r text-white text-[8.5px] font-black tracking-widest uppercase flex items-center justify-between transition-all duration-300 active:scale-95 shadow cursor-pointer ${theme.btnGradient}`}
                            >
                              <span>VIEW FULL ALLOTMENT / संपूर्ण कार्य आवंटन</span>
                              <ChevronRight size={11} className="stroke-[3.5px] animate-pulse" />
                            </button>
                            <div className="w-full py-1 px-2 bg-indigo-950/20 border border-indigo-500/5 rounded-lg text-center text-[7.5px] font-bold text-indigo-400/80 tracking-wide">
                              💡 Click any section above to view hierarchy map
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                );
              })()}



              {/* COMMITMENT FOOTER PROMPT WITH DESIGN THEME FROM REFERENCE */}
              <div className="bg-[#051128] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto w-full shadow-[0_0_20px_rgba(30,58,138,0.15)] mt-4">
                {/* Left side: commitment bullseye */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-amber-500 flex items-center justify-center relative bg-amber-950/45 shrink-0">
                    <span className="absolute animate-ping w-8 h-8 rounded-full border border-amber-400/40 pointer-events-none" />
                    <Lightbulb size={18} className="text-amber-400 fill-amber-500/10" />
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider block">
                      OUR MANDATE & FOCUS
                    </span>
                    <span className="text-[9.5px] font-bold text-slate-300 block leading-normal max-w-md">
                      {currentLabels.clickPrompt}
                    </span>
                  </div>
                </div>

                {/* Split line on desktop */}
                <div className="hidden md:block h-8 w-[1px] bg-slate-800" />

                {/* Right side: visual indicators (badges) to match visual layout */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[8.5px] font-black uppercase rounded-lg border border-purple-500/25 bg-purple-950/30 text-purple-300 shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                    <span>EFFICIENT OPERATIONS</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[8.5px] font-black uppercase rounded-lg border border-blue-500/25 bg-blue-950/30 text-blue-300 shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span>TRANSPARENT PROCESS</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[8.5px] font-black uppercase rounded-lg border border-emerald-500/25 bg-emerald-950/30 text-emerald-300 shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>STRONG COORDINATION</span>
                  </span>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ISOLATED VIEW (REST OF THE APOS DETAILS HIDE, GIVING FOCUS ONLY TO THE SELECTED APO VIEW) */
            <motion.div
              key="isolated-apo-screen"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.4 }}
              className="space-y-4 bg-[#020813]/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-4 md:p-6 pt-16 md:pt-4 shadow-2xl text-slate-200 my-4 relative overflow-hidden"
            >
              {/* Guardeer Prime inspired glowing blue/cyan spotlights */}
              <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-br from-cyan-500/15 via-blue-600/5 to-transparent rounded-full blur-[90px] pointer-events-none z-0" />
              <div className="absolute bottom-0 left-1/4 w-[350px] h-[350px] bg-gradient-to-tr from-indigo-500/10 via-purple-600/5 to-transparent rounded-full blur-[100px] pointer-events-none z-0" />

              {/* Absolute Back Button at Top-Left Corner of Dashboard */}
              <button
                onClick={() => {
                  if (selectedDepartment) {
                    setSelectedDepartment(null);
                  }
                  setSelectedApoId(null);
                }}
                className="absolute top-4 left-4 md:top-6 md:left-6 inline-flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-black uppercase text-slate-300 hover:text-white bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all duration-300 active:scale-95 shadow-xl backdrop-blur-md z-40 cursor-pointer"
              >
                <span className="text-amber-400 font-extrabold font-mono text-xs">←</span>
                <span>BACK TO LIST / सूची पर वापस</span>
              </button>

              {/* BEAUTIFUL COMPACT GLOWING CARD FOR APO WORK ALLOTMENT - PLACED AT THE VERY TOP */}
              {(() => {
                const apoList = apoWorkAllotments.length > 0 
                  ? apoWorkAllotments 
                  : FALLBACK_APOS;
                const activeApo = apoList.find(a => a.id === selectedApoId) || apoList[0];

                return (
                  <div className="max-w-xl mx-auto w-full relative z-20 mt-1 md:mt-2">
                    <div className="relative z-10 bg-slate-950/50 rounded-[13px] p-2.5 text-center border border-slate-800/60 space-y-1 shadow-inner backdrop-blur-sm">
                      
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-950/30 border border-violet-800/20 text-[8px] font-extrabold uppercase text-violet-300 tracking-wider">
                        <span className="w-1 h-1 bg-violet-400 rounded-full animate-ping shrink-0" />
                        <span>OFFICER WORK ALLOTMENT PANEL</span>
                      </div>

                      <h3 className="text-lg md:text-xl font-black text-white tracking-tight leading-none uppercase">
                        {activeApo.name}
                      </h3>

                      <p className="text-[9px] md:text-[10px] font-black text-amber-400 tracking-wider uppercase px-2 py-0.5 mt-0 inline-block bg-amber-950/60 border border-amber-500/25 rounded-md">
                        {activeApo.designation} – KIR DIVISION
                      </p>

                      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 pt-1.5 text-[9.5px] text-slate-300 font-semibold border-t border-slate-800/60">
                        {activeApo.contactEmail && (
                          <a href={`mailto:${activeApo.contactEmail}`} className="inline-flex items-center gap-1 text-slate-300 hover:text-white hover:underline">
                            <Mail size={11} className="text-amber-400 shrink-0" />
                            <span>{activeApo.contactEmail}</span>
                          </a>
                        )}
                        {activeApo.contactPhone && (
                          <span className="inline-flex items-center gap-1 text-slate-300">
                            <Phone size={11} className="text-amber-400 shrink-0" />
                            <span>M: {activeApo.contactPhone}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-slate-300">
                          <Briefcase size={11} className="text-amber-400 shrink-0" />
                          <span>Weight: {activeApo.order}</span>
                        </span>
                      </div>

                      <div className="text-[7.5px] text-slate-500 uppercase tracking-widest font-mono font-bold leading-none mt-1">
                        Personnel Department • Katihar Division • NFR
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 11 ALLOTTED WORK CARDS LAYOUT GRIDS DESIGN */}
              {(() => {
                const apoList = apoWorkAllotments.length > 0 
                  ? apoWorkAllotments 
                  : FALLBACK_APOS;
                const activeApo = apoList.find(a => a.id === selectedApoId) || apoList[0];

                return (
                  <>
                    <div className="space-y-2 max-w-7xl mx-auto w-full -mt-2">
                      {/* ROW 1: First 6 cards (01 to 06) */}
                      <div className="space-y-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 px-0.5">
                          {activeApo.departments.slice(0, 6).map((dept, index) => {
                            const theme = getCustomDepartmentCardTheme(dept, index);
                            const staffCountForThisDept = employees.filter(
                              emp => emp.apoId === selectedApoId && emp.department === dept
                            ).length;
                            const isActive = selectedDepartment === dept;
                            const SectionIcon = getSectionIcon(dept);

                            return (
                              <motion.div
                                key={index}
                                whileHover={{ y: -2, scale: 1.01 }}
                                onClick={() => setSelectedDepartment(dept)}
                                className={`cursor-pointer transition-all duration-300 relative group flex flex-col justify-between rounded-lg border p-2.5 pt-4 text-center ${
                                  isActive
                                    ? "bg-[#0b1528] text-white border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/30"
                                    : "bg-[#071124]/90 text-slate-200 border-slate-800/80 hover:border-violet-500/50 hover:bg-[#0c1830] shadow-sm"
                                }`}
                                style={{ minHeight: "110px" }}
                              >
                                {/* Number Badge */}
                                <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[8.5px] font-black tracking-wider shadow-sm uppercase z-20 ${
                                  isActive ? "bg-amber-500 text-slate-950" : `${theme.badgeColor} text-white`
                                }`}>
                                  {theme.num}
                                </div>

                                {/* Floating Icon */}
                                <div className="absolute top-1.5 right-1.5 z-20">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border border-[#071329] shadow-sm text-white transition-transform group-hover:scale-110 ${
                                    isActive ? "bg-amber-500" : theme.iconBg
                                  }`}>
                                    <SectionIcon size={11} className="shrink-0" />
                                  </div>
                                </div>

                                {/* Body Content */}
                                <div className="flex-1 flex flex-col justify-between pt-1">
                                  <div className="space-y-1 flex-1 flex flex-col justify-start px-2">
                                    <h5 className={`text-[11.5px] font-black uppercase tracking-wide leading-tight min-h-[30px] flex items-center justify-center ${
                                      isActive ? "text-amber-300" : "text-white group-hover:text-indigo-300 transition-colors"
                                    }`}>
                                      {theme.titleEn}
                                    </h5>
                                    <div className={`w-6 h-[1px] mx-auto ${isActive ? "bg-amber-500/25" : "bg-white/5"}`} />
                                    <p className={`text-[9px] leading-tight font-medium line-clamp-2 ${
                                      isActive ? "text-slate-200" : "text-slate-400"
                                    }`}>
                                      {theme.desc}
                                    </p>
                                  </div>

                                  <div className={`mt-2 pt-1.5 border-t flex items-center justify-between text-[7.5px] font-black tracking-widest uppercase ${
                                    isActive ? "border-amber-500/10" : "border-white/5"
                                  }`}>
                                    <span className={isActive ? "text-amber-400" : "text-slate-400 group-hover:text-amber-400 transition-colors"}>
                                      STAFF: {staffCountForThisDept}
                                    </span>
                                    <span className={isActive ? "text-amber-400 font-extrabold" : "text-slate-500 group-hover:text-slate-300 transition-colors"}>
                                      {isActive ? "ACTIVE VIEW" : "STRUCTURE →"}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>

                      {/* ROW 2: Next cards (07 to end of that APO's departments) */}
                      {activeApo.departments.length > 6 && (
                        <div className="space-y-1">
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 px-0.5 max-w-7xl mx-auto">
                            {activeApo.departments.slice(6).map((dept, index) => {
                              const realIndex = index + 6;
                              const theme = getCustomDepartmentCardTheme(dept, realIndex);
                              const staffCountForThisDept = employees.filter(
                                emp => emp.apoId === selectedApoId && emp.department === dept
                              ).length;
                              const isActive = selectedDepartment === dept;
                              const SectionIcon = getSectionIcon(dept);

                              return (
                                <motion.div
                                  key={realIndex}
                                  whileHover={{ y: -2, scale: 1.01 }}
                                  onClick={() => setSelectedDepartment(dept)}
                                  className={`cursor-pointer transition-all duration-300 relative group flex flex-col justify-between rounded-lg border p-2.5 pt-4 text-center ${
                                    isActive
                                      ? "bg-[#0b1528] text-white border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/30"
                                      : "bg-[#071124]/90 text-slate-200 border-slate-800/80 hover:border-violet-500/50 hover:bg-[#0c1830] shadow-sm"
                                  }`}
                                  style={{ minHeight: "110px" }}
                                >
                                  {/* Number Badge */}
                                  <div className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[8.5px] font-black tracking-wider shadow-sm uppercase z-20 ${
                                    isActive ? "bg-amber-500 text-slate-950" : `${theme.badgeColor} text-white`
                                  }`}>
                                    {theme.num}
                                  </div>

                                  {/* Floating Icon */}
                                  <div className="absolute top-1.5 right-1.5 z-20">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border border-[#071329] shadow-sm text-white transition-transform group-hover:scale-110 ${
                                      isActive ? "bg-amber-500" : theme.iconBg
                                    }`}>
                                      <SectionIcon size={11} className="shrink-0" />
                                    </div>
                                  </div>

                                  {/* Body Content */}
                                  <div className="flex-1 flex flex-col justify-between pt-1">
                                    <div className="space-y-1 flex-1 flex flex-col justify-start px-2">
                                      <h5 className={`text-[11.5px] font-black uppercase tracking-wide leading-tight min-h-[30px] flex items-center justify-center ${
                                        isActive ? "text-amber-300" : "text-white group-hover:text-indigo-300 transition-colors"
                                      }`}>
                                        {theme.titleEn}
                                      </h5>
                                      <div className={`w-6 h-[1px] mx-auto ${isActive ? "bg-amber-500/25" : "bg-white/5"}`} />
                                      <p className={`text-[9px] leading-tight font-medium line-clamp-2 ${
                                        isActive ? "text-slate-200" : "text-slate-400"
                                      }`}>
                                        {theme.desc}
                                      </p>
                                    </div>

                                    <div className={`mt-2 pt-1.5 border-t flex items-center justify-between text-[7.5px] font-black tracking-widest uppercase ${
                                      isActive ? "border-amber-500/10" : "border-white/5"
                                    }`}>
                                      <span className={isActive ? "text-amber-400" : "text-slate-400 group-hover:text-amber-400 transition-colors"}>
                                        STAFF: {staffCountForThisDept}
                                      </span>
                                      <span className={isActive ? "text-amber-400 font-extrabold" : "text-slate-500 group-hover:text-slate-300 transition-colors"}>
                                        {isActive ? "ACTIVE VIEW" : "STRUCTURE →"}
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* BEAUTIFUL COMMITMENT BOTTOM BAR */}
              <div className="bg-[#051128] border border-slate-800 rounded-xl p-3 flex flex-col lg:flex-row items-center justify-between gap-3 max-w-7xl mx-auto w-full shadow-md mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-teal-500 flex items-center justify-center relative bg-teal-950/40">
                    <span className="absolute animate-ping w-6 h-6 rounded-full border border-teal-300/40 pointer-events-none" />
                    <Sparkles size={14} className="text-teal-400 animate-pulse" />
                  </div>
                  <div className="text-left font-sans">
                    <span className="text-[10px] font-black uppercase text-slate-200 tracking-wider block">
                      COMMITMENT TO COMPLIANCE & EXCELLENCE
                    </span>
                    <span className="text-[8.5px] font-bold text-teal-400 block leading-none mt-0.5">
                      Efficient • Transparent • Timely • Accountable Office Administration Solutions
                    </span>
                  </div>
                </div>

                <div className="hidden lg:block h-6 w-[1px] bg-slate-800" />

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-950/40 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
                    <Users size={14} />
                  </div>
                  <div className="text-left font-sans">
                    <span className="text-[9.5px] font-black uppercase text-indigo-300 block tracking-wider leading-tight">
                      DIVIDED DUTIES ENFORCE STRUCTURAL STABILITY
                    </span>
                    <span className="text-[8px] text-slate-400 block leading-none mt-0.5">
                      Personnel Department • Katihar Division (NFR)
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HIERARCHY MAP POPUP MODAL (Z-55 OVERLAY) */}
        <AnimatePresence>
          {selectedDepartment && (
            <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-55">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="bg-[#050f24] border border-slate-800/80 rounded-2xl shadow-2xl p-5 w-full max-w-7xl relative flex flex-col max-h-[96vh] md:max-h-[92vh] overflow-hidden"
              >
                {/* Header info */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 shrink-0">
                  <div className="min-w-0 text-left">
                    <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest block font-mono">
                      {currentLabels.staffWindowHeader} (कर्मचारी संगठन आरेख)
                    </span>
                    <h4 className="text-lg md:text-xl font-black text-slate-100 truncate uppercase mt-1 tracking-wide flex items-center gap-2">
                      <Users size={18} className="text-amber-400" />
                      {selectedDepartment}
                    </h4>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDepartment(null);
                    }}
                    className="p-1.5 px-3 hover:bg-slate-900 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-800 flex items-center gap-2 text-xs font-bold"
                    title="Close details window"
                  >
                    <X size={15} className="font-bold text-red-500" />
                    <span>Close</span>
                  </button>
                </div>

                {/* Diagram visual section (Designed to fit perfectly with 0 scrolling) */}
                <div className="flex-1 overflow-y-auto flex flex-col items-center py-4 px-2 text-center custom-compact-scroll min-h-0">
                  {treeNodes.length === 0 ? (
                    <div className="text-center py-12 bg-[#071124] rounded-2xl border border-dashed border-slate-800 w-full max-w-md mx-auto my-auto">
                      <Users className="mx-auto text-slate-500 mb-2" size={36} />
                      <p className="text-slate-400 font-bold text-sm">{currentLabels.noStaffConfigured}</p>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col items-center space-y-4 my-auto">
                      {treeNodes.map((rootNode: any, rIdx: number) => {
                        const supervisorInitials = rootNode.employeeName
                          ? rootNode.employeeName.split(" ").filter(Boolean).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                          : "SUP";

                        const children = rootNode.children || [];

                        return (
                          <div key={rootNode.id || rIdx} className="w-full flex flex-col items-center">
                            {/* Supervisor Node Card */}
                            <motion.div
                              whileHover={{ scale: 1.01, y: -2 }}
                              onClick={() => setSelectedDetailedEmployee(rootNode)}
                              className="cursor-pointer relative z-10 w-full max-w-lg bg-gradient-to-b from-[#091630] to-[#050f24] border-2 border-amber-500/80 rounded-2xl p-4 shadow-xl text-center transition-all hover:border-amber-400 hover:shadow-amber-500/10 group"
                            >
                              {/* Subtle internal effects */}
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-8 bg-amber-500/10 blur-xl rounded-full pointer-events-none" />
                              <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-b from-amber-500 to-orange-500 rounded-l-2xl" />
                              
                              <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2.5">
                                <span className="inline-flex items-center gap-1.5 bg-amber-950/60 border border-amber-800/40 text-amber-300 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md">
                                  👑 SECTION SUPERVISOR (प्रभारी)
                                </span>
                                <span className="text-[10px] font-extrabold text-amber-400 group-hover:text-amber-300 flex items-center gap-1">
                                  🔍 CLICK FOR DETAILS
                                </span>
                              </div>

                              <div className="flex items-center gap-3.5 text-left">
                                <div className="w-10 h-10 rounded-xl bg-[#0d1c38] border border-amber-500/30 flex items-center justify-center font-black text-sm text-amber-300 shrink-0 uppercase tracking-wide">
                                  {supervisorInitials}
                                </div>
                                <div className="min-w-0">
                                  <h5 className="font-extrabold text-base text-slate-100 truncate uppercase tracking-wide leading-tight group-hover:text-amber-300 transition-colors">
                                    {rootNode.employeeName}
                                  </h5>
                                  <p className="text-xs font-bold text-slate-400 uppercase truncate mt-0.5 leading-tight">
                                    {rootNode.designation}
                                  </p>
                                  {rootNode.contactPhone && (
                                    <p className="text-[13px] font-bold text-emerald-400 font-mono mt-1 leading-none flex items-center gap-1">
                                      <Phone size={11} className="shrink-0 text-emerald-400 animate-pulse" />
                                      <span>{rootNode.contactPhone}</span>
                                    </p>
                                  )}
                                </div>
                              </div>

                              {rootNode.work && (
                                <div className="mt-3 text-left bg-slate-950/60 border border-slate-900 p-2.5 rounded-lg text-[12.5px] text-slate-300 leading-normal max-h-24 overflow-y-auto custom-compact-scroll">
                                  <span className="font-black text-amber-400 uppercase tracking-wider text-[9.5px] block mb-1">ALLOTTED CHARGES & DUTIES:</span>
                                  {rootNode.work}
                                </div>
                              )}
                            </motion.div>

                            {/* Connecting Line Diagram */}
                            {children.length > 0 && (
                              <div className="w-full flex flex-col items-center">
                                {/* Trunk drop down */}
                                <div className="w-0.5 h-4 bg-gradient-to-b from-amber-500/80 to-indigo-500/60" />
                                
                                {/* Responsive multi-column Grid System for up to 10+ employees */}
                                <div className="relative w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 px-2 mt-2">
                                  {children.map((child: any, cIdx: number) => {
                                    const childInitials = child.employeeName
                                      ? child.employeeName.split(" ").filter(Boolean).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                                      : "SUB";

                                    return (
                                      <motion.div
                                        key={child.id || cIdx}
                                        whileHover={{ y: -4, scale: 1.02 }}
                                        onClick={() => setSelectedDetailedEmployee(child)}
                                        className="cursor-pointer text-left bg-gradient-to-b from-[#091630] to-[#040c1d] border border-slate-800/90 hover:border-indigo-500 rounded-xl p-3.5 shadow-lg transition-all relative overflow-hidden flex flex-col justify-between group min-h-[160px] hover:shadow-indigo-500/10"
                                      >
                                        {/* Left Indigo Accent Line */}
                                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-indigo-500 rounded-l" />
                                        
                                        <div>
                                          <div className="flex items-center justify-between gap-1 border-b border-slate-800/80 pb-1.5 mb-2">
                                            <span className="bg-indigo-950/60 text-indigo-300 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border border-indigo-800/30">
                                              SUBORDINATE (कर्मचारी)
                                            </span>
                                            <span className="text-[8px] font-extrabold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1 shrink-0">
                                              DETAILS 🔍
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-3 text-left">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-950/50 border border-indigo-800/40 flex items-center justify-center font-black text-xs text-indigo-300 shrink-0 uppercase">
                                              {childInitials}
                                            </div>
                                            <div className="min-w-0">
                                              <h6 className="font-extrabold text-sm text-slate-100 truncate uppercase leading-tight group-hover:text-indigo-300 transition-colors">
                                                {child.employeeName}
                                              </h6>
                                              <p className="text-[11px] font-bold text-slate-400 truncate mt-0.5 leading-tight uppercase">
                                                {child.designation}
                                              </p>
                                              {child.contactPhone && (
                                                <p className="text-[12.5px] font-bold text-emerald-400 font-mono mt-1 leading-none flex items-center gap-1">
                                                  <Phone size={10} className="shrink-0 text-emerald-400" />
                                                  <span>{child.contactPhone}</span>
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {child.work && (
                                          <div className="mt-2.5 text-left bg-slate-950/60 border border-slate-900/80 p-2 rounded-lg text-[12px] text-slate-300 leading-normal line-clamp-3">
                                            <span className="font-bold text-indigo-400 uppercase tracking-wider text-[9px] block mb-0.5">WORK ALLOTMENT:</span>
                                            {child.work}
                                          </div>
                                        )}
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer attribution */}
                {(() => {
                  const apoList = apoWorkAllotments.length > 0 ? apoWorkAllotments : FALLBACK_APOS;
                  const activeApo = apoList.find(a => a.id === selectedApoId) || apoList[0];

                  return (
                    <div className="bg-[#060f24] p-2 rounded-xl border border-white/5 text-center max-w-md mx-auto w-full shrink-0">
                      <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 block">
                        {currentLabels.superby} (पर्यवेक्षण व मार्गदर्शन)
                      </span>
                      <span className="text-xs font-bold text-amber-400 mt-0.5 block uppercase tracking-wide leading-none">
                        {activeApo?.designation} ({activeApo?.name})
                      </span>
                    </div>
                  );
                })()}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* SECONDARY DETAILED EMPLOYEE PROFILE POPUP MODAL (Z-56 OVERLAY) */}
        <AnimatePresence>
          {selectedDetailedEmployee && (
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4 z-56">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
                className="bg-[#030a1c] border border-amber-500/30 rounded-3xl shadow-2xl p-6 md:p-8 w-full max-w-2xl relative flex flex-col max-h-[90vh] overflow-hidden text-left"
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedDetailedEmployee(null)}
                  className="absolute top-4 right-4 p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-all border border-slate-800 cursor-pointer"
                  title="Close employee details"
                >
                  <X size={18} />
                </button>

                {/* Employee Profile Layout */}
                <div className="flex-1 overflow-y-auto custom-compact-scroll pr-1 space-y-6">
                  <div className="space-y-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/30 text-[10px] font-black uppercase tracking-widest text-indigo-300">
                      👤 EMPLOYEE DETAILED PROFILE
                    </span>
                    
                    <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase leading-tight mt-1">
                      {selectedDetailedEmployee.employeeName}
                    </h3>
                    
                    <div className="inline-block">
                      <span className="text-xs md:text-sm font-black text-amber-400 tracking-wider uppercase bg-amber-950/60 border border-amber-500/25 rounded-lg px-3 py-1 block">
                        {selectedDetailedEmployee.designation}
                      </span>
                    </div>
                  </div>

                  {/* Contact details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/40 border border-slate-900 rounded-2xl p-4">
                    {selectedDetailedEmployee.contactPhone ? (
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase block tracking-wider">Mobile Number:</span>
                        <a 
                          href={`tel:${selectedDetailedEmployee.contactPhone}`} 
                          className="text-lg font-black font-mono text-emerald-400 hover:underline flex items-center gap-1.5"
                        >
                          <Phone size={16} className="text-emerald-400" />
                          <span>{selectedDetailedEmployee.contactPhone}</span>
                        </a>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase block tracking-wider">Mobile Number:</span>
                        <span className="text-sm font-bold text-slate-400 italic">Not Configured</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase block tracking-wider">Section / Department:</span>
                      <span className="text-sm font-extrabold text-indigo-300 uppercase block leading-none pt-1">
                        {selectedDepartment}
                      </span>
                    </div>
                  </div>

                  {/* Allotted Duties and Work Details Box */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                      ALLOTTED DUTIES & CHARGES (आवंटित कार्य वितरण) :
                    </span>
                    <div className="bg-slate-950/80 border border-slate-900 rounded-2xl p-5 md:p-6 text-slate-200 leading-relaxed text-sm md:text-base whitespace-pre-line font-medium min-h-[160px] shadow-inner">
                      {selectedDetailedEmployee.work || selectedDetailedEmployee.workAllotment || "General administration assistance & other assigned works as per superior's direction."}
                    </div>
                  </div>

                  {/* Action Call & Messaging Row */}
                  {selectedDetailedEmployee.contactPhone && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <a
                        href={`tel:${selectedDetailedEmployee.contactPhone}`}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm tracking-wider uppercase transition-all shadow-md active:scale-95 text-center"
                      >
                        <Phone size={16} />
                        <span>Direct Call (कॉल करें)</span>
                      </a>
                      <a
                        href={`https://wa.me/91${selectedDetailedEmployee.contactPhone.replace(/\s+/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-sm tracking-wider uppercase transition-all shadow-md active:scale-95 text-center"
                      >
                        <MessageSquare size={16} />
                        <span>Send WhatsApp Message</span>
                      </a>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-900 pt-4 mt-4 flex justify-end shrink-0">
                  <button
                    onClick={() => setSelectedDetailedEmployee(null)}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl transition-all border border-slate-800 text-xs font-black uppercase tracking-wider cursor-pointer"
                  >
                    Close Details
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
