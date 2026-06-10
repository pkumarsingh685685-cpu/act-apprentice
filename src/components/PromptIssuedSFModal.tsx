import React, { useState, useEffect } from "react";
import { useStore } from "../store/useStore";
import { db } from "../firebase";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { 
  FileCheck, 
  X, 
  HelpCircle, 
  Clock, 
  CheckCircle2, 
  AlertOctagon, 
  Hourglass, 
  CornerUpLeft,
  Calendar,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";

export function PromptIssuedSFModal() {
  const issuedSFs = useStore((state) => state.issuedSFs) || [];
  const updateIssuedSF = useStore((state) => state.updateIssuedSF);
  
  // Track when the current Office Use Only page session was opened/mounted
  const [modalMountedAt] = useState<number>(() => Date.now());
  
  const [activePrompt, setActivePrompt] = useState<any>(null);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showIssuedSubForm, setShowIssuedSubForm] = useState(false);
  
  // Custom interactive details to be filled when confirming dispatch
  const [caseNature, setCaseNature] = useState<"Vig" | "Non-Vig">("Non-Vig");
  const [customIssuedDate, setCustomIssuedDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Monitor the issuedSFs to find unhandled or expired print tracked records
  useEffect(() => {
    // Check every 5 seconds for any updates or expiration
    const checkRecord = () => {
      const now = Date.now();
      const match = issuedSFs.find((sf) => {
        // Target SF-1, SF-2, SF-5, SF-11, SF-14 and SF-14(II)
        if (sf.sfType !== "SF-1" && sf.sfType !== "SF-2" && sf.sfType !== "SF-5" && sf.sfType !== "SF-11" && sf.sfType !== "SF-14" && sf.sfType !== "SF-14(II)") return false;
        
        // Match conditions:
        // 1. untracked or undefined status AND was printed before this current session mounted
        // 2. paused and pause duration has completed
        const isUntracked = !sf.trackStatus || sf.trackStatus === "untracked";
        const wasPrintedBeforeThisSession = sf.printedAt ? (sf.printedAt < modalMountedAt) : true;
        const isPauseExpired = sf.trackStatus === "paused" && sf.pausedUntil && now >= sf.pausedUntil;
        
        return (isUntracked && wasPrintedBeforeThisSession) || isPauseExpired;
      });
      
      setActivePrompt(match || null);
    };

    checkRecord();
    const interval = setInterval(checkRecord, 5000);
    return () => clearInterval(interval);
  }, [issuedSFs, modalMountedAt]);

  // Set default values when active prompt is updated
  useEffect(() => {
    if (activePrompt) {
      setCustomIssuedDate(activePrompt.issuedDate || new Date().toISOString().split("T")[0]);
      setCaseNature("Non-Vig");
      setShowDurationPicker(false);
      setShowIssuedSubForm(false);
    }
  }, [activePrompt]);

  if (!activePrompt) return null;

  const handleIssuedConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const loadingMessage = (activePrompt.sfType === "SF-1" || activePrompt.sfType === "SF-2")
      ? "Generating SF-4 auto draft..."
      : "Adding record to Personnel Branch DAR database...";
    const toastId = toast.loading(loadingMessage);

    try {
      // 1. Fetch current DAR position records to calculate the next sequential Serial Number (sn)
      const querySnapshot = await getDocs(collection(db, "dar_positions"));
      let maxSn = 0;
      querySnapshot.forEach((doc) => {
        const val = doc.data().sn;
        if (typeof val === "number" && val > maxSn) {
          maxSn = val;
        }
      });
      const nextSn = maxSn + 1;

      // 2. Draft the new DAR row record based on generated SF details with state-specific updates
      const newRecord = {
        sn: nextSn,
        name: activePrompt.employeeName || "Unknown Employee",
        designation: activePrompt.designation || "OS",
        memorandumNo: activePrompt.memorandumNo || "",
        natureOfCharge: activePrompt.sfType || "SF-5",
        issuedDate: customIssuedDate || new Date().toISOString().split("T")[0],
        nameOfDa: activePrompt.nameOfDa || "Atul Kumar",
        designationOfDa: activePrompt.designationOfDa || "Sr.DPO",
        natureOfCase: caseNature, 
        presentStatus: "Pending", // Default initial status
        charges: activePrompt.charges || "",
        dateOfDaNip: "",
        penalty: "",
        createdAt: serverTimestamp(),
      };

      // 3. Write record into Firestore (Only if NOT SF-1 and NOT SF-2)
      if (activePrompt.sfType !== "SF-1" && activePrompt.sfType !== "SF-2") {
        await addDoc(collection(db, "dar_positions"), newRecord);
      }

      // 4. Mark printed status as 'issued' in the local and global state
      updateIssuedSF(activePrompt.id, {
        trackStatus: "issued",
        pausedUntil: null,
      });

      // If this is SF-1 or SF-2, auto-generate a pending SF-4 draft
      if (activePrompt.sfType === "SF-1" || activePrompt.sfType === "SF-2") {
        const pendingSF4Record = {
          employeeName: activePrompt.employeeName || "",
          designation: activePrompt.designation || "",
          fileNo: activePrompt.memorandumNo || "",
          status: "pending",
          createdAt: Date.now(),
          suspensionOrderDate: customIssuedDate || activePrompt.issuedDate || new Date().toISOString().split("T")[0],
          signatureName: activePrompt.signatureName || "",
          authorityDesignation: activePrompt.authorityDesignation || "",
          salutation: activePrompt.salutation || "Shri",
          workingUnder: activePrompt.workingUnder || "",
          railway: activePrompt.railway || "Admn. NFR/KIR",
          placeOfIssue: activePrompt.placeOfIssue || "DRM(P)/KIR",
          additionalCopies: activePrompt.additionalCopies || [],
          sourceSfType: activePrompt.sfType,
        };
        await addDoc(collection(db, "pending_sf4_drafts"), pendingSF4Record);
      }

      const successMessage = (activePrompt.sfType === "SF-1" || activePrompt.sfType === "SF-2")
        ? "SF-4 draft generated successfully! (Excluded from Personnel Branch DAR Position)"
        : "Successfully registered employee in Personnel Branch DAR position!";

      toast.success(successMessage, { id: toastId });
      setActivePrompt(null);
    } catch (err) {
      console.error("Error writing to DAR database:", err);
      toast.error("Failed to add record to DAR positions collection.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotIssued = () => {
    // Mark as not issued and close the popup
    updateIssuedSF(activePrompt.id, {
      trackStatus: "not_issued",
      pausedUntil: null,
    });
    toast.info("Status marked as Draft/Not Issued.");
    setActivePrompt(null);
  };

  const handlePause = (hours: number) => {
    const durationMs = hours * 60 * 65 * 1000; // adding minor safe padding
    const pausedUntil = Date.now() + durationMs;

    updateIssuedSF(activePrompt.id, {
      trackStatus: "paused",
      pausedUntil: pausedUntil,
    });

    toast.info(`Reminder deferred for ${hours >= 24 ? `${hours / 24} Day(s)` : `${hours} Hour(s)`}.`);
    setShowDurationPicker(false);
    setActivePrompt(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      {/* Container with premium 3D borders, heavy shadow, and gloss gradient */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_4px_20px_rgba(99,102,241,0.15),inset_0_2px_4px_rgba(255,255,255,0.1)] hover:shadow-[0_30px_70px_-12px_rgba(0,0,0,0.9),0_6px_25px_rgba(99,102,241,0.25),inset_0_2px_4px_rgba(255,255,255,0.15)] transition-all duration-300 transform scale-100 flex flex-col gap-6 select-none overflow-hidden text-white">
        {/* Decorative dynamic ambient mesh light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-md" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />

        {/* Modal Header */}
        <div className="flex items-center gap-4 border-b border-slate-800/80 pb-4">
          <div className="p-3 bg-indigo-950/80 border border-indigo-500/40 rounded-2xl shadow-[0_4px_12px_rgba(99,102,241,0.3)] animate-pulse">
            <FileCheck className="w-8 h-8 text-indigo-400" />
          </div>
          <div className="flex-1">
            <span className="block text-[10px] font-black uppercase tracking-widest text-cyan-400">
              Audit dispatched verification
            </span>
            <h3 className="text-xl font-bold tracking-tight text-white uppercase sm:text-2xl leading-none mt-1">
              Confirm Form Dispatch
            </h3>
          </div>
        </div>

        {/* Content body showing details of printed employee */}
        {!showDurationPicker && !showIssuedSubForm ? (
          <>
            <div className="bg-slate-950/65 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-inner relative">
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-indigo-650/40 text-indigo-300 text-[10px] font-black border border-indigo-500/35 rounded uppercase tracking-wider">
                {activePrompt.sfType} Format
              </div>
              
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Printed Personnel Details:
              </h4>

              <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-sm">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Employee Name / नाम</span>
                  <span className="font-extrabold text-white text-base truncate block">{activePrompt.employeeName}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Designation / पद</span>
                  <span className="font-bold text-slate-200 block">{activePrompt.designation}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Memorandum No / ज्ञापन संख्या</span>
                  <span className="font-mono text-cyan-300 font-bold break-all block">{activePrompt.memorandumNo || "N/A"}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500">Issue Date / दिनांक</span>
                  <span className="font-bold text-slate-200 block">{activePrompt.issuedDate}</span>
                </div>
              </div>

              {activePrompt.charges && (
                <div className="pt-2.5 border-t border-slate-900 leading-normal">
                  <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Articles of Charges / आरोप</span>
                  <p className="text-xs text-slate-200 line-clamp-2 bg-slate-950 p-2 rounded border border-slate-900 font-serif italic">
                    {activePrompt.charges}
                  </p>
                </div>
              )}
            </div>

            <div className="text-center text-xs text-slate-400 mb-2 leading-relaxed px-1">
              {(activePrompt.sfType === "SF-1" || activePrompt.sfType === "SF-2") ? (
                <span>
                  Would you like to mark this printed <strong>{activePrompt.sfType}</strong> as Issued? Doing so will automatically generate a <strong className="text-amber-400 font-black">Pending SF-4 Auto Draft</strong> for this employee, and will <strong className="text-rose-400 font-black">NOT</strong> save a record in the Personnel Branch DAR Position.
                </span>
              ) : (
                <span>
                  Would you like to register this printed <strong>{activePrompt.sfType}</strong> form into the official <strong className="text-amber-400 font-black">DAR Position database of the Personnel Branch</strong>?
                </span>
              )}
            </div>

            {/* 3D Option Buttons Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Option 1: Issued (Trigger Sub-Form for Details) */}
              <button
                onClick={() => setShowIssuedSubForm(true)}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 border border-emerald-500 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-[0_4px_0_0_#065f46,0_10px_20px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_0_0_#065f46,0_12px_22px_rgba(16,185,129,0.35)] active:translate-y-[4px] active:shadow-none hover:-translate-y-[1px] transition-all cursor-pointer flex items-center justify-center gap-2 tracking-wide uppercase disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                <span>1. Issued (हो चुका है)</span>
              </button>

              {/* Option 2: Not Issued (Dismiss) */}
              <button
                onClick={handleNotIssued}
                disabled={isSubmitting}
                className="flex-1 bg-slate-800 hover:bg-slate-755 border border-slate-700 text-slate-200 font-extrabold text-sm py-3 px-4 rounded-xl shadow-[0_4px_0_0_#1e293b,0_10px_15px_rgba(0,0,0,0.3)] active:translate-y-[4px] active:shadow-none hover:-translate-y-[1px] transition-all cursor-pointer flex items-center justify-center gap-2 tracking-wide uppercase disabled:opacity-50"
              >
                <AlertOctagon size={16} />
                <span>2. Not Issued (नहीं हुआ)</span>
              </button>

              {/* Option 3: Pause / Please Wait */}
              <button
                onClick={() => setShowDurationPicker(true)}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-b from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 border border-amber-500 text-white font-extrabold text-sm py-3 px-4 rounded-xl shadow-[0_4px_0_0_#78350f,0_10px_20px_rgba(245,158,11,0.25)] hover:shadow-[0_4px_0_0_#78350f,0_12px_22px_rgba(245,158,11,0.35)] active:translate-y-[4px] active:shadow-none hover:-translate-y-[1px] transition-all cursor-pointer flex items-center justify-center gap-2 tracking-wide uppercase"
              >
                <Hourglass size={16} className="animate-spin-slow" />
                <span>3. Please Wait</span>
              </button>
            </div>
          </>
        ) : showIssuedSubForm ? (
          /* Sub-form for Option 1: Choose Case Nature & Issued Date */
          <div className="space-y-5 animate-scale-up">
            <div className="bg-slate-950/65 border border-slate-800/80 p-4 rounded-2xl space-y-4">
              <div className="text-center pb-2 border-b border-slate-850">
                <h4 className="font-extrabold text-sm text-emerald-400 uppercase tracking-wide">
                  Step 1: Enter Dispatch Details / प्रेषण का विवरण
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Confirm the case category & dispatch date for <strong className="text-white">{activePrompt.employeeName}</strong>.
                </p>
              </div>

              {/* CASE NATURE: VIG / NON-VIG */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-widest font-black text-slate-400">
                  Case Category / मामले की श्रेणी <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Non-Vigilance Button */}
                  <button
                    type="button"
                    onClick={() => setCaseNature("Non-Vig")}
                    className={`py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border cursor-pointer transition-all active:scale-95 ${
                      caseNature === "Non-Vig"
                        ? "bg-slate-850 text-emerald-400 border-emerald-500/70 shadow-[0_0_12px_rgba(16,185,129,0.15)] font-black"
                        : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <ShieldCheck size={14} className={caseNature === "Non-Vig" ? "text-emerald-400" : "text-slate-550"} />
                    <span>Non-Vig (गैर-सतर्कता)</span>
                  </button>

                  {/* Vigilance Button */}
                  <button
                    type="button"
                    onClick={() => setCaseNature("Vig")}
                    className={`py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 border cursor-pointer transition-all active:scale-95 ${
                      caseNature === "Vig"
                        ? "bg-slate-850 text-red-400 border-red-500/70 shadow-[0_0_12px_rgba(239,68,68,0.15)] font-black"
                        : "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <ShieldAlert size={14} className={caseNature === "Vig" ? "text-red-400" : "text-slate-550"} />
                    <span>Vig (सतर्कता मामला)</span>
                  </button>
                </div>
              </div>

              {/* ISSUED DATE: CAN PICK ANY DATE */}
              <div className="space-y-2">
                <label className="block text-[11px] uppercase tracking-widest font-black text-slate-400">
                  Issued Date / जारी दिनांक <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <Calendar size={15} />
                  </span>
                  <input
                    type="date"
                    value={customIssuedDate}
                    onChange={(e) => setCustomIssuedDate(e.target.value)}
                    className="w-full bg-slate-950 text-white pl-10 pr-4 py-3 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-semibold transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-550 leading-normal">
                  Shows today/form creation date by default. You can adjust this to a future or previous date at any time.
                </p>
              </div>
            </div>

            {/* Subform operations */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              {/* Back to main screen */}
              <button
                type="button"
                onClick={() => setShowIssuedSubForm(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-[0_4px_0_0_#1e293b] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase"
              >
                <CornerUpLeft size={16} />
                <span>Go Back / पीछे जाएं</span>
              </button>

              {/* Submit to DB */}
              <button
                type="button"
                onClick={handleIssuedConfirm}
                disabled={isSubmitting || !customIssuedDate}
                className="flex-1 bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 border border-emerald-500 text-white font-extrabold text-sm py-3.5 px-4 rounded-xl shadow-[0_4px_0_0_#065f46,0_10px_20px_rgba(16,185,129,0.25)] active:translate-y-[4px] active:shadow-none hover:-translate-y-[1px] transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase disabled:opacity-50"
              >
                <CheckCircle2 size={16} />
                <span>Confirm & Register</span>
              </button>
            </div>
          </div>
        ) : (
          /* Duration choice sub-screen */
          <div className="space-y-4 animate-scale-up">
            <div className="bg-slate-950/65 border border-slate-850 p-4 rounded-2xl text-center space-y-2">
              <Clock className="w-10 h-10 text-amber-400 mx-auto animate-pulse" />
              <h4 className="font-extrabold text-base text-slate-200 uppercase tracking-wide">
                Set Reminder Deferral Period
              </h4>
              <p className="text-xs text-slate-400 leading-normal max-w-sm mx-auto">
                Select how long to hide this confirmation popup alert for <strong className="text-white">{activePrompt.employeeName}</strong>. Once completed, it will automatically reappear to prompt you again.
              </p>
            </div>

            {/* 3D Duration Selection Grid */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handlePause(1)}
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-black text-sm py-3.5 px-4 rounded-xl shadow-[0_4px_0_0_#0f172a] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase"
              >
                <span>1 Hour (1 घंटा)</span>
              </button>

              <button
                onClick={() => handlePause(4)}
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-black text-sm py-3.5 px-4 rounded-xl shadow-[0_4px_0_0_#0f172a] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase"
              >
                <span>4 Hours (4 घंटे)</span>
              </button>

              <button
                onClick={() => handlePause(24)}
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-black text-sm py-3.5 px-4 rounded-xl shadow-[0_4px_0_0_#0f172a] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase"
              >
                <span>1 Day (1 दिन)</span>
              </button>

              <button
                onClick={() => handlePause(48)}
                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-white font-black text-sm py-3.5 px-4 rounded-xl shadow-[0_4px_0_0_#0f172a] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase"
              >
                <span>2 Days (2 दिन)</span>
              </button>
            </div>

            {/* Back to details button */}
            <button
              onClick={() => {
                setShowDurationPicker(false);
                setShowIssuedSubForm(false);
              }}
              className="mt-2 w-full bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-bold py-2.5 rounded-lg border border-slate-800 flex items-center justify-center gap-1 cursor-pointer"
            >
              <CornerUpLeft size={12} />
              <span>Go Back / पीछे जाएं</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
