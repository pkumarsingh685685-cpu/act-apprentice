import React, { useState, useRef, useEffect } from 'react';
import { triggerPrint } from '../utils/printHelper';
import { Printer, FileText, RotateCcw, Info } from 'lucide-react';
import { useStore } from '../store/useStore';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { PrintCustomizer, PrintSettings, RenderPrintOverlayWatermark, RenderPrintOverlaySeal, RenderPrintOverlaySignature } from './PrintCustomizer';

interface SF3Data {
  fileNo: string;
  railway: string;
  date: string;
  salutation: string;
  employeeName: string;
  designation: string;
  empNo: string;
  suspensionOrderNo: string;
  suspensionOrderDate: string;
  postHeld: string;
  employeeAddress: string;
}

const getLocalDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatPrintDate = (dateString: string) => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${day} ${months[monthIdx]} ${year}`;
};

const initialData: SF3Data = {
  fileNo: '',
  railway: 'Admn. NFR/KIR',
  date: getLocalDateString(),
  salutation: 'Shri',
  employeeName: '',
  designation: '',
  empNo: '',
  suspensionOrderNo: '',
  suspensionOrderDate: getLocalDateString(),
  postHeld: '',
  employeeAddress: '',
};

export function SF3Generator({ onBack }: { onBack?: () => void } = {}) {
  const [formData, setFormData] = useState<SF3Data>(initialData);
  const componentRef = useRef<HTMLDivElement>(null);
  const addIssuedSF = useStore((state) => state.addIssuedSF);
  const config = useStore((state) => state.config);
  const showPreview = config.showSfPdfPreview !== "false";

  // Print settings state
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
    sigYOffset: 0
  });

  const handleGenerateClick = (e: React.FormEvent) => {
    e.preventDefault();
    triggerPrint({
      contentRef: componentRef,
      documentTitle: `SF-3_Non-Employment_Certificate_${formData.employeeName || 'Draft'}`,
      onAfterPrint: () => {
        if (formData.employeeName) {
          addIssuedSF({
            sfType: 'SF-3',
            employeeName: formData.employeeName,
            designation: formData.designation,
            issuedDate: new Date().toISOString().split('T')[0],
            isFinalised: true,
            memorandumNo: formData.suspensionOrderNo || formData.fileNo || "",
            salutation: formData.salutation,
            placeOfIssue: formData.railway,
            railway: formData.railway,
            workingUnder: "",
            signatureName: formData.employeeName,
            authorityDesignation: "Railway Servant",
            additionalCopies: [],
          });

          addDoc(collection(db, "audit_logs"), {
            type: "SF_GENERATED",
            action: `Generated Standard Form SF-3 Certificate of Non-Employment for ${formData.salutation} ${formData.employeeName}`,
            details: {
              sfType: "SF-3",
              employeeName: formData.employeeName,
              designation: formData.designation,
              suspensionOrderNo: formData.suspensionOrderNo,
              updatedAt: new Date().toISOString()
            },
            user: "Admin / Personnel Officer",
            timestamp: new Date().toISOString(),
            agent: "DRM Katihar Portal Audit Trail"
          }).catch(console.error);
        }
      },
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(initialData);
  };

  const renderField = (value: string) => {
    if (!value) {
      return (
        <span className="border-b border-black inline-block min-w-[200px] text-center px-1.5 font-serif text-[12pt]">
          &nbsp;
        </span>
      );
    }
    return (
      <span className="font-bold text-gray-950 border-b border-black px-1.5 font-serif text-[12pt] underline decoration-solid decoration-1 underline-offset-4 tracking-normal">
        {value}
      </span>
    );
  };

  const employeeFullName = formData.employeeName 
    ? `${formData.salutation ? formData.salutation + ' ' : ''}${formData.employeeName}`
    : '';

  return (
    <div className="flex flex-col h-full bg-slate-900/10 flex-1 overflow-hidden">
      {/* Top action bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap justify-between items-center gap-4 shrink-0 shadow-lg z-10 font-sans">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-bold transition-all cursor-pointer mr-2 shadow-sm"
            >
              ← Back
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-400" />
              Standard Form No. 3 (SF-3) Generator
            </h1>
            <p className="text-xs text-slate-400">Certificate of Non-Employment to be furnished by Suspended Official — Rule 2043(2) R-II</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={resetForm}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 rounded-lg transition-all cursor-pointer border border-slate-700"
          >
            <RotateCcw className="w-4 h-4" /> Reset Form
          </button>
          
          <div className="h-6 w-px bg-slate-800 mx-1"></div>
          
          <button 
            type="submit"
            form="sf3-form"
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all cursor-pointer shadow-md shadow-indigo-600/20 active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" /> Generate PDF / Print
          </button>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Editor Form (Left Side) */}
        <div className={`w-full ${showPreview ? 'lg:w-[720px] bg-slate-950 border-r border-[#1e2d4d] shadow-[inset_-4px_0_10px_-10px_rgba(0,0,0,0.1)]' : 'lg:max-w-4xl lg:mx-auto bg-slate-950 p-6 my-6 rounded-lg border border-slate-800 shadow-md'} overflow-y-auto p-5 shrink-0 flex flex-col gap-5 text-slate-200`}>
          
          <PrintCustomizer settings={printSettings} onChange={setPrintSettings} />

          <div className="flex items-start gap-2.5 bg-indigo-950/40 p-3 rounded-lg border border-indigo-900/50 text-[11px] text-indigo-300 leading-normal">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              Fill out the details on the left, and watch the Standard Form No. 3 update in real-time on the right. Empty fields are automatically rendered as blank spaces for offline convenience.
            </div>
          </div>

          <h2 className="font-extrabold text-slate-400 border-b border-slate-800/80 pb-2 uppercase tracking-wider text-[10px]">Form Parameters</h2>
          
          <form id="sf3-form" onSubmit={handleGenerateClick} className="space-y-4">
            
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Employee Name <span className="text-rose-500">*</span></label>
              <div className="flex gap-2">
                <select 
                  required 
                  name="salutation" 
                  value={formData.salutation} 
                  onChange={handleChange as any} 
                  className="bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-24"
                >
                  <option value="">Select...</option>
                  <option value="Shri">Shri</option>
                  <option value="Smt.">Smt.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Miss">Miss</option>
                  <option value="Dr.">Dr.</option>
                </select>
                <input required type="text" name="employeeName" value={formData.employeeName} onChange={handleChange} className="flex-1 text-sm bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Rahul Sharma" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Designation / Post Held <span className="text-rose-500">*</span></label>
                <input required type="text" name="designation" list="sf3-emp-designations" value={formData.designation} onChange={handleChange} className="w-full text-sm bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none" placeholder="e.g. SSE (P-Way)" />
                <datalist id="sf3-emp-designations">
                  <option value="SSE (P-Way)" />
                  <option value="SSE (Works)" />
                  <option value="SSE (Signal)" />
                  <option value="SSE (Tele)" />
                  <option value="SSE (C&W)" />
                  <option value="SSE (Loco)" />
                  <option value="JE (P-Way)" />
                  <option value="JE (Works)" />
                  <option value="JE (Signal)" />
                  <option value="JE (Tele)" />
                  <option value="JE (C&W)" />
                  <option value="JE (Loco)" />
                  <option value="Technician Gr.I" />
                  <option value="Technician Gr.II" />
                  <option value="Technician Gr.III" />
                  <option value="Sr. Technician" />
                  <option value="Track Maintainer Gr.I" />
                  <option value="Track Maintainer Gr.II" />
                  <option value="Track Maintainer Gr.III" />
                  <option value="Track Maintainer Gr.IV" />
                  <option value="Pointsman-A" />
                  <option value="Pointsman-B" />
                  <option value="Station Master" />
                  <option value="Goods Train Manager" />
                  <option value="Office Superintendent (OS)" />
                  <option value="Senior Clerk" />
                  <option value="Junior Clerk" />
                  <option value="Ch.OS" />
                  <option value="General Assistant" />
                </datalist>
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Employee No (EMP No.)</label>
                <input type="text" name="empNo" value={formData.empNo} onChange={handleChange} className="w-full text-sm bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none" placeholder="e.g. 5071420953" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Suspension Order No. <span className="text-rose-500">*</span></label>
                <input required type="text" name="suspensionOrderNo" value={formData.suspensionOrderNo} onChange={handleChange} className="w-full text-sm bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none" placeholder="e.g. KIR/P-DAR/SF-1/2026" />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Suspension Order Date <span className="text-rose-500">*</span></label>
                <input required type="date" name="suspensionOrderDate" value={formData.suspensionOrderDate} onChange={handleChange} className="w-full text-sm bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Railway/Division Name</label>
              <input type="text" name="railway" value={formData.railway} onChange={handleChange} className="w-full text-sm bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none" />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Residential Address of Suspended Official <span className="text-rose-500">*</span></label>
              <textarea required rows={3} name="employeeAddress" value={formData.employeeAddress} onChange={handleChange} className="w-full text-sm bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none resize-y" placeholder="Enter complete residential address..." />
            </div>
            
            <div className="h-6"></div>
          </form>
        </div>

        {/* Live Preview (Right Side) */}
        <div className={`${showPreview ? 'hidden lg:flex' : 'hidden'} flex-1 flex-col items-center bg-[#525659] overflow-auto pt-8 pb-16 px-4 font-[Times_New_Roman,Times,serif]`}>
          <div className="bg-white shrink-0 w-[210mm] min-h-[297mm] shadow-2xl p-[18mm] relative text-black leading-normal">
            
            {/* The Document Area to Print */}
            <div ref={componentRef} className="w-full h-full text-[12pt] relative">
              <RenderPrintOverlayWatermark watermark={printSettings.watermark} />
              
              <style type="text/css" media="print">
                {`
                  @page {
                    size: A4;
                    margin: 0.75in !important;
                  }
                  @media print {
                    body {
                      -webkit-print-color-adjust: exact;
                      print-color-adjust: exact;
                      padding: 2mm 0;
                      box-sizing: border-box;
                    }
                  }
                `}
              </style>

              {/* Document Header */}
              <div className="text-center mb-10 font-[Times_New_Roman,Times,serif]">
                <h2 className="font-bold text-[14pt] uppercase tracking-wide">
                  Standard Form No.3
                </h2>
                <div className="text-[11.5pt] text-black mt-2 leading-relaxed max-w-xl mx-auto italic font-medium">
                  (Standard form of certificate to be furnished by suspended employee under rule 2043(2) R-II)
                </div>
              </div>

              {/* Body Content */}
              <div className="space-y-6 font-[Times_New_Roman,Times,serif] leading-[1.8] text-[12.5pt] text-justify">
                <p className="indent-12">
                  I, {renderField(employeeFullName)} (Name of the Railway Servant) having been placed under suspension by order No. {renderField(formData.suspensionOrderNo || formData.fileNo)} dated {renderField(formData.suspensionOrderDate ? formatPrintDate(formData.suspensionOrderDate) : '')} while holding the post of {renderField(formData.designation || formData.postHeld)} do hereby certify that I have not been employed in any business, profession, or vocation for profit/remuneration/salary.
                </p>
              </div>

              {/* Signatory details */}
              <div className="mt-8 flex justify-end font-[Times_New_Roman,Times,serif]">
                <div className="text-left w-[340px] space-y-1 relative leading-relaxed text-[11.5pt]">
                  <div className="absolute -top-[52px] left-12 pointer-events-none select-none z-10">
                    <RenderPrintOverlaySignature 
                      signature={printSettings.signature} 
                      sigCursiveText={printSettings.sigCursiveText} 
                      sigImageData={printSettings.sigImageData} 
                      defaultName={formData.employeeName} 
                      scale={printSettings.sigScale}
                      xOffset={printSettings.sigXOffset}
                      yOffset={printSettings.sigYOffset}
                    />
                  </div>
                  <div className="absolute right-0 top-1/3 -translate-y-1/2 pointer-events-none select-none z-10">
                    <RenderPrintOverlaySeal seal={printSettings.seal} customSealText={printSettings.customSealText} sealImageData={printSettings.sealImageData} />
                  </div>

                  <div className="flex items-center gap-1 font-medium">
                    Signature ..............................................................
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="w-48 text-[11pt]">Name of the Railway Servant:</span> 
                    <div className="font-bold border-b border-black flex-1 text-center pb-0.5 text-[11.5pt]">
                      {formData.employeeName ? formData.employeeName : '________________________________'}
                    </div>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="w-16 text-[11pt]">Address:</span> 
                    <div className="border-b border-black flex-1 text-left whitespace-pre-wrap leading-tight pb-0.5 min-h-[30px] text-[11pt]">
                      {formData.employeeAddress ? formData.employeeAddress : '________________________________'}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
