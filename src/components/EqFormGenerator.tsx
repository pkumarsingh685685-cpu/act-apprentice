import React, { useState, useRef, useEffect } from "react";
import { triggerPrint } from "../utils/printHelper";
import { Printer, RotateCcw, Plus, Trash2, Save, FileText, Download, Check, History } from "lucide-react";
import { useStore } from "../store/useStore";
import { useAutoSaveDraft } from "../hooks/useAutoSaveDraft";
import { DraftIndicator } from "./DraftIndicator";
import { PrintCustomizer, PrintSettings, RenderPrintOverlayWatermark, RenderPrintOverlaySeal, RenderPrintOverlaySignature } from "./PrintCustomizer";
import { db } from "../firebase";
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, setDoc, limit } from "firebase/firestore";
import { toast } from "sonner";

interface EqFormData {
  diaryNo: string;
  diaryYear: string;
  pnrNo: string;
  trainNo: string;
  dateOfJourney: string;
  fromTo: string;
  boardingAt: string;
  classCode: string;
  noOfBerths: string;
  headPassengerName: string;
  headPassengerAddress: string;
  passengerPhone: string;
  purposeOfJourney: string;
  applicantName: string;
  applicantDesignation: string;
  rlyOfficerName: string;
  rlyOfficerDesignation: string;
  rlyOfficerMobile: string;
}

const initialData: EqFormData = {
  diaryNo: "",
  diaryYear: "2026",
  pnrNo: "6834067744",
  trainNo: "15621",
  dateOfJourney: "2026-07-02",
  fromTo: "KIR - STP",
  boardingAt: "KIR",
  classCode: "SL",
  noOfBerths: "01",
  headPassengerName: "MOHD AYYAJ KHAN",
  headPassengerAddress: "Near to DS College, Katihar",
  passengerPhone: "9696723301",
  purposeOfJourney: "Urgent Work",
  applicantName: "",
  applicantDesignation: "",
  rlyOfficerName: "",
  rlyOfficerDesignation: "",
  rlyOfficerMobile: "",
};

export function EqFormGenerator({ onBack }: { onBack?: () => void } = {}) {
  const [formData, setFormData] = useState<EqFormData>(initialData);
  const [savedApplications, setSavedApplications] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  const componentRef = useRef<HTMLDivElement>(null);
  const config = useStore((state) => state.config);
  const logos = useStore((state) => state.logos) as any;
  const railwayLogoUrl = logos?.railwayLogo?.image || "/logo.png";
  const showPreview = config.showSfPdfPreview !== "false";

  // Auto-save draft integration
  const { status, triggerManualSave, clearDraft } = useAutoSaveDraft<EqFormData>(
    "EQ_FORM",
    formData,
    setFormData,
    initialData
  );

  // Print customizer settings state
  const [printSettings, setPrintSettings] = useState<PrintSettings>({
    watermark: "none",
    seal: "none",
    customSealText: "",
    sealImageData: null,
    signature: "none",
    sigCursiveText: "",
    sigImageData: null,
    sigScale: 100,
    sigXOffset: 0,
    sigYOffset: 0,
  });

  // Fetch saved applications from Firestore
  const fetchSavedApplications = async () => {
    setLoadingHistory(true);
    try {
      const q = query(collection(db, "eq_applications"), orderBy("createdAt", "desc"), limit(50));
      const querySnapshot = await getDocs(q);
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setSavedApplications(list);
    } catch (err) {
      console.error("Error fetching EQ list:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchSavedApplications();
  }, []);

  // Save/Update current application in Firestore
  const handleSaveToCloud = async () => {
    try {
      const payload = {
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (activeHistoryId) {
        // Update existing
        await setDoc(doc(db, "eq_applications", activeHistoryId), payload);
        toast.success("Emergency Quota application updated successfully!");
      } else {
        // Create new
        const docRef = await addDoc(collection(db, "eq_applications"), payload);
        setActiveHistoryId(docRef.id);
        toast.success("Emergency Quota application saved to Cloud!");
      }
      fetchSavedApplications();
    } catch (error) {
      console.error("Failed to save to Firestore:", error);
      toast.error("Error saving to Cloud database. Check your database access rules.");
    }
  };

  // Load a saved application
  const handleLoadSaved = (app: any) => {
    const { id, createdAt, updatedAt, ...rest } = app;
    setFormData(rest as EqFormData);
    setActiveHistoryId(id);
    toast.success("Saved application loaded into editor!");
  };

  // Delete a saved application
  const handleDeleteSaved = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this saved application?")) return;
    try {
      await deleteDoc(doc(db, "eq_applications", id));
      if (activeHistoryId === id) {
        setActiveHistoryId(null);
      }
      toast.success("Application deleted from database.");
      fetchSavedApplications();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Error deleting from Cloud.");
    }
  };

  // Format date for display in preview (DD.MM.YYYY)
  const formatJourneyDate = (dateString: string) => {
    if (!dateString) return "____________";
    // Check if format is already DD.MM.YYYY
    if (dateString.includes(".")) return dateString;
    const parts = dateString.split("-");
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }
    return dateString;
  };

  const handlePrint = () => {
    triggerPrint({
      contentRef: componentRef,
      documentTitle: `EQ_Application_PNR_${formData.pnrNo || "Form"}`,
    });
  };

  const resetForm = () => {
    if (window.confirm("Reset all fields to template values?")) {
      setFormData(initialData);
      setActiveHistoryId(null);
      clearDraft();
      toast.info("Form reset to template.");
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full min-h-0 bg-slate-50 font-sans">
      
      {/* Editor Panel (Left side) */}
      <div className={`w-full ${showPreview ? "lg:w-[680px] bg-white border-r border-gray-200 shadow-md" : "lg:max-w-4xl lg:mx-auto bg-white p-6 my-6 rounded-xl border border-gray-200 shadow-lg"} overflow-y-auto p-5 shrink-0 flex flex-col`}>
        
        {/* Top Header Controls */}
        <div className="flex flex-col gap-2 pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Emergency Quota (EQ) Application</span>
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">
                Create, edit, and print official A4 Emergency Quota application requests.
              </p>
            </div>
            
            <button
              onClick={resetForm}
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Reset form"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <DraftIndicator
            status={status}
            onManualSave={triggerManualSave}
            onClear={clearDraft}
            sfName="Emergency Quota (EQ)"
          />
        </div>

        {/* Print Settings Drawer (Watermark, Seal, etc) */}
        <PrintCustomizer settings={printSettings} onChange={setPrintSettings} />

        <div className="space-y-4">
          
          {/* Section: Diary & General */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1">
              <span>📌 Diary Details</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Diary Number</label>
                <input
                  type="text"
                  value={formData.diaryNo}
                  onChange={(e) => setFormData({ ...formData, diaryNo: e.target.value })}
                  placeholder="e.g. 147"
                  className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Diary Year</label>
                <input
                  type="text"
                  value={formData.diaryYear}
                  onChange={(e) => setFormData({ ...formData, diaryYear: e.target.value })}
                  placeholder="e.g. 2026"
                  className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Passenger & Ticket Particulars */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2.5 flex items-center gap-1">
              <span>🎟️ Ticket & Passenger Particulars</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">PNR No (Item 12) *</label>
                <input
                  type="text"
                  value={formData.pnrNo}
                  onChange={(e) => setFormData({ ...formData, pnrNo: e.target.value })}
                  maxLength={10}
                  className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Train No (Item 13) *</label>
                <input
                  type="text"
                  value={formData.trainNo}
                  onChange={(e) => setFormData({ ...formData, trainNo: e.target.value })}
                  className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Date of Journey (Item 14) *</label>
                <input
                  type="date"
                  value={formData.dateOfJourney}
                  onChange={(e) => setFormData({ ...formData, dateOfJourney: e.target.value })}
                  className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">From / To Stations (Item 15) *</label>
                <input
                  type="text"
                  value={formData.fromTo}
                  onChange={(e) => setFormData({ ...formData, fromTo: e.target.value })}
                  placeholder="e.g. KIR - STP"
                  className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Boarding Station (Item 16) *</label>
                <input
                  type="text"
                  value={formData.boardingAt}
                  onChange={(e) => setFormData({ ...formData, boardingAt: e.target.value })}
                  className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Class of Travel (Item 17) *</label>
                <input
                  type="text"
                  value={formData.classCode}
                  onChange={(e) => setFormData({ ...formData, classCode: e.target.value })}
                  placeholder="e.g. SL, 3A, 2A"
                  className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">No. of Berths (Item 18) *</label>
                <input
                  type="text"
                  value={formData.noOfBerths}
                  onChange={(e) => setFormData({ ...formData, noOfBerths: e.target.value })}
                  className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Head Passenger Phone (Item 21) *</label>
                <input
                  type="text"
                  value={formData.passengerPhone}
                  onChange={(e) => setFormData({ ...formData, passengerPhone: e.target.value })}
                  className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Name of Head Passenger (Item 19) *</label>
                <input
                  type="text"
                  value={formData.headPassengerName}
                  onChange={(e) => setFormData({ ...formData, headPassengerName: e.target.value })}
                  className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Address of Head Passenger (Item 20) *</label>
                <input
                  type="text"
                  value={formData.headPassengerAddress}
                  onChange={(e) => setFormData({ ...formData, headPassengerAddress: e.target.value })}
                  className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Purpose of Journey (Item 22) *</label>
                <input
                  type="text"
                  value={formData.purposeOfJourney}
                  onChange={(e) => setFormData({ ...formData, purposeOfJourney: e.target.value })}
                  className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

            </div>
          </div>

          {/* Direct Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleSaveToCloud}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all active:translate-y-0.5 text-xs uppercase tracking-wider"
              id="saveEqToCloudBtn"
            >
              <Save className="w-4 h-4" />
              <span>Save Application / डेटा सुरक्षित करें</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md cursor-pointer transition-all active:translate-y-0.5 text-xs uppercase tracking-wider"
              id="printEqBtn"
            >
              <Printer className="w-4 h-4" />
              <span>Print Application (A4 PDF)</span>
            </button>
          </div>

        </div>

        {/* Database History Section */}
        <div className="mt-8 border-t border-slate-150 pt-5">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <History className="w-4 h-4 text-slate-500" />
            <span>Saved Applications History ({savedApplications.length})</span>
          </h3>

          {loadingHistory ? (
            <div className="text-center py-4 text-xs font-medium text-slate-400">
              Loading stored history...
            </div>
          ) : savedApplications.length === 0 ? (
            <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400">
              No previous EQ Applications stored in Firestore.
            </div>
          ) : (
            <div className="max-h-[180px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-150 shadow-inner bg-slate-50">
              {savedApplications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => handleLoadSaved(app)}
                  className={`flex items-center justify-between p-3 cursor-pointer text-xs transition-colors hover:bg-indigo-50/40 ${activeHistoryId === app.id ? 'bg-indigo-50/80 border-l-4 border-l-indigo-600 font-bold' : ''}`}
                >
                  <div className="flex-1 grid grid-cols-3 gap-2 items-center">
                    <div className="font-extrabold text-indigo-950">
                      PNR: {app.pnrNo || "N/A"}
                    </div>
                    <div className="text-slate-600 font-semibold text-[11px]">
                      Train: {app.trainNo} ({app.fromTo})
                    </div>
                    <div className="text-slate-500 text-[10px] text-right">
                      Date: {formatJourneyDate(app.dateOfJourney)}
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSaved(app.id, e)}
                    className="ml-4 p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Live A4 Print Preview (Right side) */}
      {showPreview && (
        <div className="flex-1 h-full bg-slate-100 p-8 overflow-y-auto flex items-start justify-center print:bg-white print:p-0">
          <div
            ref={componentRef}
            className="bg-white w-[210mm] min-h-[297mm] shadow-2xl relative box-border p-[20mm] print:shadow-none print_page flex flex-col justify-between font-serif text-black leading-normal"
            id="eq-print-section"
            style={{ minHeight: "297mm" }}
          >
            <RenderPrintOverlayWatermark watermark={printSettings.watermark} />
            
            {/* Custom Styles Injection */}
            <style type="text/css" media="print">
              {`
                @page {
                  size: A4 portrait;
                  margin: 0.75in !important;
                }
                @media print {
                  body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                    background-color: white !important;
                  }
                  .print_page {
                    padding: 0 !important;
                    margin: 0 !important;
                    box-shadow: none !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    box-sizing: border-box !important;
                  }
                }
              `}
            </style>

            {/* Document Body */}
            <div className="space-y-6">
              
              {/* Header block with Logo */}
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                {railwayLogoUrl ? (
                  <img
                    src={railwayLogoUrl}
                    alt="Railway Logo"
                    className="w-14 h-14 object-contain mix-blend-multiply"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full border border-double border-black flex items-center justify-center text-[8px] font-bold">
                    RLY LOGO
                  </div>
                )}
                
                <div className="space-y-1">
                  <h1 className="text-[17px] font-extrabold uppercase tracking-wide border-b-2 border-black border-double inline-block pb-0.5">
                    NORTHEAST FRONTIER RAILWAY
                  </h1>
                  <br />
                  <h2 className="text-[14px] font-extrabold tracking-wide border-b-2 border-black border-double inline-block pt-1 pb-0.5">
                    (Application for Emergency Quota)
                  </h2>
                </div>
              </div>

              {/* Diary Row */}
              <div className="flex justify-between items-center text-sm font-bold pt-2">
                <div>
                  Diary No. <span className="border-b border-black px-4 inline-block font-bold">{formData.diaryNo || "        "}</span> /{formData.diaryYear || "2026"}
                </div>
                <div></div>
              </div>

              {/* Particulars Title */}
              <div className="text-sm font-extrabold underline uppercase tracking-wide">
                Particulars of Passenger:-
              </div>

              {/* The Particulars Table */}
              <table className="w-full border-collapse border border-black text-xs font-serif leading-loose">
                <tbody>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2.5 font-bold text-center w-12">12.</td>
                    <td className="border-r border-black p-2.5 font-bold w-52">PNR No:</td>
                    <td className="p-2.5 font-extrabold tracking-wider text-sm select-all">{formData.pnrNo || ""}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2.5 font-bold text-center">13.</td>
                    <td className="border-r border-black p-2.5 font-bold">Train No:</td>
                    <td className="p-2.5 font-extrabold">{formData.trainNo || ""}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2.5 font-bold text-center">14.</td>
                    <td className="border-r border-black p-2.5 font-bold">Date of Journey:</td>
                    <td className="p-2.5 font-extrabold">{formatJourneyDate(formData.dateOfJourney)}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2.5 font-bold text-center">15.</td>
                    <td className="border-r border-black p-2.5 font-bold">From/To:</td>
                    <td className="p-2.5 font-extrabold">{formData.fromTo || ""}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2.5 font-bold text-center">16.</td>
                    <td className="border-r border-black p-2.5 font-bold">Boarding at:</td>
                    <td className="p-2.5 font-extrabold">{formData.boardingAt || ""}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2.5 font-bold text-center">17.</td>
                    <td className="border-r border-black p-2.5 font-bold">Class:</td>
                    <td className="p-2.5 font-extrabold uppercase">{formData.classCode || ""}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2.5 font-bold text-center">18.</td>
                    <td className="border-r border-black p-2.5 font-bold">No. of berths:</td>
                    <td className="p-2.5 font-extrabold">{formData.noOfBerths || ""}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2.5 font-bold text-center">19.</td>
                    <td className="border-r border-black p-2.5 font-bold">Name of head of the passenger:</td>
                    <td className="p-2.5 font-extrabold uppercase">{formData.headPassengerName || ""}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2.5 font-bold text-center">20.</td>
                    <td className="border-r border-black p-2.5 font-bold">Address of head of the passenger:</td>
                    <td className="p-2.5 font-extrabold text-[11px]">{formData.headPassengerAddress || ""}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2.5 font-bold text-center">21.</td>
                    <td className="border-r border-black p-2.5 font-bold">Phone/Mobile No.of any one of Passenger:</td>
                    <td className="p-2.5 font-extrabold tracking-wider">{formData.passengerPhone || ""}</td>
                  </tr>
                  <tr>
                    <td className="border-r border-black p-2.5 font-bold text-center">22.</td>
                    <td className="border-r border-black p-2.5 font-bold">Purpose of Journey:</td>
                    <td className="p-2.5 font-extrabold">{formData.purposeOfJourney || ""}</td>
                  </tr>
                </tbody>
              </table>

              {/* Declaration Undertaking */}
              <p className="text-xs text-justify font-semibold leading-relaxed pt-3">
                I hereby undertake full responsibility of passenger's credentials and also undertake that I am fully aware of the entitlement regarding allotment of accommodation from emergency quota.
              </p>

            </div>

            {/* Signature Blocks at the bottom of the page */}
            <div className="space-y-12 pt-8">
              
              {/* Applicant Signature Section */}
              <div className="flex justify-end pt-4">
                <div className="text-center w-[250px] font-serif text-xs">
                  <div className="mb-1.5 font-bold tracking-widest text-black">
                    ..................................................
                  </div>
                  <div className="font-bold text-black">(Signature of the applicant)</div>
                  <div className="text-slate-800 font-bold">
                    (With Designation)
                  </div>
                </div>
              </div>

              {/* Recommended by Officer section */}
              <div className="flex justify-between items-end pt-12">
                
                <div className="space-y-1 font-bold text-xs">
                  <div>Recommended by Railway officer:-</div>
                </div>

                <div className="text-center w-[280px] font-serif text-xs">
                  <div className="mb-2 font-bold tracking-widest text-black">
                    _____________________________
                  </div>
                  <div className="font-bold text-black leading-relaxed">(Signature of the Rly.Officer)</div>
                  <div className="text-slate-800 font-bold leading-relaxed text-[10.5px]">
                    (with Name, Designation and Mobile No.)
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
