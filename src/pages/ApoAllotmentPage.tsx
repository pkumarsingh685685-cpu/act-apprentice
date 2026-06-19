import { useState } from "react";
import { useStore } from "../store/useStore";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Sparkles, User, Mail, Phone, ChevronRight, Hash, Layers, HelpCircle, X } from "lucide-react";
import { SEO } from "../components/SEO";

export default function ApoAllotmentPage({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const apoWorkAllotments = useStore((state) => state.apoWorkAllotments || []);
  const config = useStore((state) => state.config);
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en";

  const [selectedApoId, setSelectedApoId] = useState<string | null>(null);

  // Fallback translations in case keys aren't in json yet
  const labels = {
    en: {
      title: "Personnel Branch - Officer Work Allotment",
      subtitle: "Interactive organization & work distribution diagram of Assistant Personnel Officers",
      headOfficer: "Senior Divisional Personnel Officer (Sr. DPO)",
      headOfficerSub: "Divisional Head of Personnel Branch",
      apoTitle: "Assistant Personnel Officers (APOs)",
      allottedDepts: "Allotted Departments & Sections",
      clickPrompt: "Click on any officer card above to reveal full details & contacts below",
      contactDetails: "Office Contacts",
      noApoConfigured: "No Assistant Divisional Personnel Officer assignments are currently configured in general settings.",
      deptHierarchy: "Department Supervision Hierarchy",
    },
    hi: {
      title: "कार्मिक शाखा - अधिकारी कार्य आवंटन",
      subtitle: "सहायक कार्मिक अधिकारियों का इंटरैक्टिव संगठन एवं कार्य वितरण आरेख",
      headOfficer: "वरिष्ठ मंडल कार्मिक अधिकारी (Sr. DPO)",
      headOfficerSub: "कार्मिक शाखा के मंडलीय प्रमुख",
      apoTitle: "सहायक कार्मिक अधिकारी (APO)",
      allottedDepts: "आवंटित विभाग और अनुभाग",
      clickPrompt: "पूरी जानकारी और संपर्कों को देखने के लिए किसी भी अधिकारी कार्ड पर क्लिक करें",
      contactDetails: "कार्यालय संपर्क",
      noApoConfigured: "सामान्य सेटिंग्स में वर्तमान में कोई सहायक कार्मिक अधिकारी असाइनमेंट कॉन्फ़िगर नहीं किया गया है।",
      deptHierarchy: "विभाग पर्यवेक्षण अनुक्रम",
    },
  };

  const currentLabels = labels[currentLang as "en" | "hi"] || labels.en;

  const selectedApo = apoWorkAllotments.find((a) => a.id === selectedApoId);

  // Static/dynamic Divisional Head info
  const headOfficerInfo = {
    name: currentLang.startsWith("hi")
      ? (config.srDpoNameHi || "श्री संजीव कुमार")
      : (config.srDpoNameEn || "Sri Sanjeev Kumar"),
    designation: currentLang.startsWith("hi")
      ? (config.srDpoDesignationHi || "वरिष्ठ मंडल कार्मिक अधिकारी / कटिहार (Sr. DPO / KIR)")
      : (config.srDpoDesignationEn || "Sr. DPO / KIR"),
  };

  return (
    <div className={`${isEmbedded ? "min-h-full py-6" : "min-h-screen py-12"} bg-[#132039] text-white selection:bg-violet-600/30 selection:text-white px-4 sm:px-6 lg:px-8 relative overflow-hidden`}>
      {!isEmbedded && <SEO title={`${currentLabels.title} | Personnel Branch Kir`} />}

      {/* Decorative Glow Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[30rem] h-[30rem] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Title Header Section */}
      {!isEmbedded && (
        <div className="max-w-7xl mx-auto text-center mb-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full mb-4 shadow"
          >
            <Sparkles className="text-violet-400 w-4 h-4 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-violet-200">
              {currentLang === "hi" ? "अधिकारी अनुभाग" : "Officer Segments"}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl md:text-5xl font-black tracking-tight"
            style={{
              background: "linear-gradient(135deg, #FFFFFF 0%, #D8B4FE 50%, #818CF8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {currentLabels.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-4 text-base md:text-lg text-slate-400 max-w-2xl mx-auto font-medium"
          >
            {currentLabels.subtitle}
          </motion.p>
        </div>
      )}

      {/* Interactive Diagram Flow Chart */}
      <div className="max-w-7xl mx-auto relative z-10 mb-16">
        <div className="flex flex-col items-center">
          {/* Level 1: Sr. DPO */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {/* 3D Glassmorphism Card */}
            <div className="p-0.5 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-700 shadow-[0_0_30px_rgba(99,102,241,0.25)]">
              <div className="bg-slate-900/95 backdrop-blur-xl rounded-[14px] p-6 text-center w-80 md:w-96 border border-white/10 relative overflow-hidden group">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all duration-500" />
                <Shield className="mx-auto w-10 h-10 text-indigo-400 mb-3 filter drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase bg-indigo-950/50 border border-indigo-900/40 px-3 py-1 rounded-full mb-2.5 inline-block">
                  {currentLabels.headOfficerSub}
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight">{headOfficerInfo.name}</h3>
                <p className="text-sm font-semibold text-slate-400 mt-1">{currentLabels.headOfficer}</p>
              </div>
            </div>

            {/* Downward connecting line */}
            {apoWorkAllotments.length > 0 && (
              <div className="h-12 w-0.5 bg-gradient-to-b from-indigo-500 to-indigo-500/30 mx-auto relative">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
              </div>
            )}
          </motion.div>

          {/* Level 2: APO Horizontal Grid */}
          {apoWorkAllotments.length === 0 ? (
            <div className="text-center py-12 bg-white/5 border border-dashed border-white/10 rounded-2xl p-8 max-w-lg mt-8">
              <HelpCircle className="mx-auto text-slate-500 mb-3" size={32} />
              <p className="text-slate-400 font-medium text-sm">{currentLabels.noApoConfigured}</p>
            </div>
          ) : (
            <div className="w-full">
              {/* Connector horizontal line representing the bus logic */}
              <div className="hidden md:block h-0.5 bg-indigo-500/30 w-3/4 mx-auto relative mb-8">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500/60" />
              </div>

              {/* Grid of APOs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-center">
                {apoWorkAllotments.map((apo, idx) => {
                  const isSelected = selectedApoId === apo.id;
                  return (
                    <motion.div
                      key={apo.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                      onClick={() => setSelectedApoId(apo.id)}
                      className="cursor-pointer group"
                    >
                      {/* Vertical dynamic connection line for desktop */}
                      <div className="hidden md:block h-6 w-0.5 bg-indigo-500/30 mx-auto -mt-6 group-hover:bg-violet-400 transition-colors" />

                      {/* 3D Box Styling requested by user */}
                      <div
                        className={`p-[1px] rounded-2xl transition-all duration-300 transform ${
                          isSelected
                            ? "bg-gradient-to-br from-violet-400 via-indigo-400 to-purple-500 scale-[1.03] shadow-[0_0_25px_rgba(167,139,250,0.45)]"
                            : "bg-gradient-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 hover:-translate-y-1 hover:shadow-[0_8px_20px_-5px_rgba(167,139,250,0.15)]"
                        }`}
                      >
                        <div className="h-full bg-slate-900/90 backdrop-blur-xl rounded-[15px] p-5 border border-white/5 flex flex-col justify-between relative overflow-hidden">
                          {/* Inner soft glow */}
                          {isSelected && (
                            <div className="absolute -inset-10 bg-gradient-to-r from-violet-600/10 to-indigo-600/15 rounded-full blur-xl pointer-events-none" />
                          )}

                          {/* Detail Header */}
                          <div className="relative z-10">
                            <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-3 mb-4">
                              <span
                                className={`px-2.5 py-0.5 text-[10px] font-black tracking-widest rounded uppercase ${
                                  isSelected
                                    ? "bg-violet-600 text-white shadow"
                                    : "bg-white/10 text-violet-300"
                                }`}
                              >
                                {apo.designation}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                #{apo.order}
                              </span>
                            </div>

                            <h4 className="text-lg font-extrabold text-white group-hover:text-violet-300 transition-colors flex items-center gap-1.5 leading-snug">
                              <User size={15} className="text-violet-400 shrink-0" />
                              {apo.name}
                            </h4>

                            <div className="mt-4 space-y-1.5 select-none">
                              <span className="text-[11px] font-black uppercase text-violet-300 block tracking-widest animate-pulse">
                                {currentLabels.allottedDepts}
                              </span>
                              <div className="flex flex-col gap-1.5 mt-1.5">
                                {apo.departments.slice(0, 4).map((dept, di) => (
                                  <div
                                    key={di}
                                    className="px-3 py-2 text-xs md:text-[13px] font-black bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-200 border-l-4 border-l-amber-500 border-y border-r border-white/10 rounded-r-lg shadow-sm flex items-center gap-1.5"
                                  >
                                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping shrink-0" />
                                    <span>{dept}</span>
                                  </div>
                                ))}
                                {apo.departments.length > 4 && (
                                  <span className="text-[11px] font-black text-violet-300 bg-violet-950/80 border border-violet-800/40 px-2.5 py-1 rounded-md inline-block w-max shadow">
                                    + {apo.departments.length - 4} more sections... Click to see all
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick details toggle trigger alignment */}
                          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-violet-300 font-bold tracking-wider relative z-10">
                            <span className="group-hover:translate-x-1 transition-transform">
                              {isSelected ? "ACTIVE DETAILS" : "VIEW ALLOTMENTS"}
                            </span>
                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
          </div>
        </div>

      {/* Details Container */}
      <div className="max-w-4xl mx-auto mt-6 relative z-10">
        <AnimatePresence mode="wait">
          {selectedApo ? (
            <motion.div
              key={selectedApo.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="p-[1px] bg-gradient-to-tr from-violet-500/30 via-indigo-500/20 to-purple-500/30 rounded-2xl shadow-xl"
            >
              <div className="bg-slate-900 border border-white/5 rounded-[15px] p-6 sm:p-8 space-y-6 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-48 h-48 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

                {/* Card Title Header with active status color */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-600/20">
                      <Layers className="text-white" size={22} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-violet-400 bg-violet-950/60 border border-violet-900/60 px-2.5 py-0.5 rounded uppercase">
                        {selectedApo.designation}
                      </span>
                      <h3 className="text-2xl font-black text-white tracking-tight mt-1">
                        {selectedApo.name}
                      </h3>
                    </div>
                  </div>

                  {/* Close Details Button */}
                  <button
                    onClick={() => setSelectedApoId(null)}
                    className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Subsections list and division metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Handled Departments */}
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center gap-2">
                      <Hash size={16} className="text-violet-400" />
                      <h4 className="text-sm font-bold uppercase text-slate-300 tracking-wider">
                        {currentLabels.deptHierarchy}
                      </h4>
                    </div>

                     <div className="grid grid-cols-1 gap-3">
                      {selectedApo.departments.map((dept, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-4 p-4 md:p-5 bg-gradient-to-r from-slate-950 to-slate-900/40 hover:from-slate-900 hover:to-slate-800/60 rounded-xl border border-white/10 transition-all hover:scale-[1.01] shadow-lg hover:shadow-violet-500/5 group"
                        >
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 font-black text-sm rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                            {index + 1}
                          </div>
                          <div className="border-l-4 border-amber-500 pl-3.5 py-0.5 flex-1">
                            <span className="text-base md:text-lg font-black text-amber-200 tracking-wide group-hover:text-white transition-colors block">
                              {dept}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: contact cards and metadata */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-violet-400" />
                      <h4 className="text-sm font-bold uppercase text-slate-300 tracking-wider">
                        {currentLabels.contactDetails}
                      </h4>
                    </div>

                    <div className="bg-slate-950 rounded-xl p-4 border border-white/5 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Official Email
                        </span>
                        {selectedApo.contactEmail ? (
                          <a
                            href={`mailto:${selectedApo.contactEmail}`}
                            className="text-xs font-semibold text-violet-400 hover:underline flex items-center gap-1.5"
                          >
                            <Mail size={13} />
                            {selectedApo.contactEmail}
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium">N/A</span>
                        )}
                      </div>

                      <div className="border-t border-white/5 pt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Phone / Railway Ext.
                        </span>
                        {selectedApo.contactPhone ? (
                          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                            <Phone size={13} />
                            {selectedApo.contactPhone}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium">N/A</span>
                        )}
                      </div>

                      <div className="border-t border-white/5 pt-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Corporate Jurisdiction
                        </span>
                        <span className="text-xs font-semibold text-slate-400 block pb-1">
                          Personnel Branch, Katihar (KIR)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6 text-sm text-slate-500 font-bold tracking-wide"
            >
              * {currentLabels.clickPrompt} *
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
