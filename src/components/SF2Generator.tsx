import React, { useState, useRef } from 'react';
import { triggerPrint } from '../utils/printHelper';
import { Printer, FileText, RotateCcw, Plus, Trash2, Info } from 'lucide-react';
import { useStore } from '../store/useStore';
import { PrintCustomizer, PrintSettings, RenderPrintOverlayWatermark, RenderPrintOverlaySeal, RenderPrintOverlaySignature } from './PrintCustomizer';

interface SF2Data {
  fileNo: string;
  railway: string;
  placeOfIssue: string;
  date: string;
  salutation: string;
  employeeName: string;
  designation: string;
  workingUnder: string;
  empNo: string;
  detentionDate: string;
  signatureName: string;
  authorityDesignation: string;
  additionalCopies: string[];
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

const initialData: SF2Data = {
  fileNo: '',
  railway: 'Admn. NFR/KIR',
  placeOfIssue: 'DRM(P)/KIR',
  date: getLocalDateString(),
  salutation: 'Shri',
  employeeName: '',
  designation: '',
  workingUnder: '',
  empNo: '',
  detentionDate: '',
  signatureName: '',
  authorityDesignation: '',
  additionalCopies: ['Ch. O.S/BILL for necessary action.'],
};

export function SF2Generator({ onBack }: { onBack?: () => void } = {}) {
  const [formData, setFormData] = useState<SF2Data>(initialData);
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
      documentTitle: `SF-2_Deemed_Suspension_${formData.employeeName || 'Draft'}`,
      onAfterPrint: () => {
        if (formData.employeeName) {
          addIssuedSF({
            sfType: 'SF-2',
            employeeName: formData.employeeName,
            designation: formData.designation,
            issuedDate: new Date().toISOString().split('T')[0],
            isFinalised: false,
            memorandumNo: formData.fileNo || "",
            salutation: formData.salutation,
            placeOfIssue: formData.placeOfIssue,
            railway: formData.railway,
            workingUnder: formData.workingUnder,
            signatureName: formData.signatureName,
            authorityDesignation: formData.authorityDesignation,
            additionalCopies: formData.additionalCopies || [],
          });
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

  const addCopy = () => {
    setFormData(prev => ({ ...prev, additionalCopies: [...prev.additionalCopies, ''] }));
  };

  const removeCopy = (index: number) => {
    setFormData(prev => ({ 
      ...prev, 
      additionalCopies: prev.additionalCopies.filter((_, i) => i !== index)
    }));
  };

  const updateCopy = (index: number, value: string) => {
    const copies = [...formData.additionalCopies];
    copies[index] = value;
    setFormData(prev => ({ ...prev, additionalCopies: copies }));
  };

  const renderField = (value: string) => {
    if (!value) {
      return (
        <span className="border-b border-black inline-block min-w-[120px] text-center px-1.5 font-serif text-[12pt]">
          &nbsp;
        </span>
      );
    }
    return (
      <span className="font-extrabold text-gray-900 border-b border-black px-1.5 font-serif text-[12pt] underline decoration-solid decoration-1 underline-offset-4 tracking-normal">
        {value}
      </span>
    );
  };

  const formattedDate = formData.date 
    ? formatPrintDate(formData.date) 
    : '';

  const employeeFullName = formData.employeeName 
    ? `${formData.salutation ? formData.salutation + ' ' : ''}${formData.employeeName}`
    : '';

  const fullEmpDetails = formData.employeeName
    ? `${formData.salutation ? formData.salutation + ' ' : ''}${formData.employeeName}, ${formData.designation || '_________'}${formData.workingUnder ? `, Working under ${formData.workingUnder}` : ''}${formData.empNo ? ` (EMP No. ${formData.empNo})` : ''}`
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
              <FileText className="w-6 h-6 text-indigo-400 font-sans" />
              Standard Form No. 2 (SF-2) Generator
            </h1>
            <p className="text-xs text-slate-400">Order of Deemed Suspension — Rule 5(2) of the RS (D&A) Rules, 1968</p>
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
            form="sf2-form"
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all cursor-pointer shadow-md shadow-indigo-600/20 active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" /> Generate PDF / Print
          </button>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Editor Form (Left Side) */}
        <div className={`w-full ${showPreview ? 'lg:w-[720px] bg-slate-950 border-r border-slate-800 shadow-[inset_-4px_0_10px_-10px_rgba(0,0,0,0.1)]' : 'lg:max-w-4xl lg:mx-auto bg-slate-950 p-6 my-6 rounded-lg border border-slate-800 shadow-md'} overflow-y-auto p-5 shrink-0 flex flex-col gap-5 text-slate-200`}>
          
          <PrintCustomizer settings={printSettings} onChange={setPrintSettings} />

          <div className="flex items-start gap-2.5 bg-indigo-950/40 p-3 rounded-lg border border-indigo-900/50 text-[11px] text-indigo-300 leading-normal">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              Fill out the details on the left, and watch the Standard Form No. 2 update in real-time on the right. Empty fields are automatically rendered as dotted lines, letting you print as a blank template!
            </div>
          </div>

          <h2 className="font-extrabold text-slate-400 border-b border-slate-800/80 pb-2 uppercase tracking-wider text-[10px]">Form Parameters</h2>
          
          <form id="sf2-form" onSubmit={handleGenerateClick} className="space-y-4">
            <div className="space-y-1">
               <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">File No./Order No. <span className="text-rose-500">*</span></label>
               <input required type="text" name="fileNo" value={formData.fileNo} onChange={handleChange} className="w-full text-sm bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" placeholder="e.g. KIR/P-DAR/SF-2/2026/04" />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Railway Name (Locked)</label>
                 <input disabled type="text" name="railway" value={formData.railway} className="w-full text-sm bg-slate-900/30 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 cursor-not-allowed opacity-75" />
               </div>
               <div className="space-y-1">
                 <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Place of Issue (Locked)</label>
                 <input disabled type="text" name="placeOfIssue" value={formData.placeOfIssue} className="w-full text-sm bg-slate-900/30 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 cursor-not-allowed opacity-75" />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date of Issue <span className="text-rose-500">*</span></label>
                 <input required type="date" name="date" value={formData.date} onChange={handleChange} className="w-full text-sm bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
               </div>
               <div className="space-y-1">
                 <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date of Detention <span className="text-rose-500">*</span></label>
                 <input required type="date" name="detentionDate" value={formData.detentionDate} onChange={handleChange} className="w-full text-sm bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
               </div>
            </div>

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
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Designation <span className="text-rose-500">*</span></label>
                <input required type="text" name="designation" list="sf2-emp-designations" value={formData.designation} onChange={handleChange} className="w-full text-sm bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none" placeholder="e.g. SSE (P-Way)" />
                <datalist id="sf2-emp-designations">
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
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Working Under <span className="text-rose-500">*</span></label>
                <input required type="text" name="workingUnder" value={formData.workingUnder} onChange={handleChange} className="w-full text-sm bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none" placeholder="e.g. Sr. DEN/KIR" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Employee Number (EMP No.)</label>
              <input type="text" name="empNo" value={formData.empNo} onChange={handleChange} className="w-full text-sm bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none" placeholder="e.g. 5071420953" />
            </div>

            <hr className="border-slate-800/80 my-4" />
            
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Signatory Name <span className="text-rose-500">*</span></label>
                 <input required type="text" name="signatureName" value={formData.signatureName} onChange={handleChange} className="w-full text-sm bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none" placeholder="e.g. Amit Kumar Biswas" />
               </div>
               <div className="space-y-1">
                 <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Authority Designation <span className="text-rose-500">*</span></label>
                 <input required type="text" name="authorityDesignation" list="sf2-da-designations" value={formData.authorityDesignation} onChange={handleChange} className="w-full text-sm bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none" placeholder="e.g. DRM (P) / Katihar" />
                 <datalist id="sf2-da-designations">
                   <option value="Sr.DPO/KIR" />
                   <option value="Sr.DPO/NJP" />
                   <option value="Sr. DPO" />
                   <option value="DPO" />
                   <option value="APO" />
                   <option value="Sr.DEN/Co-ord" />
                   <option value="Sr.DEN" />
                   <option value="DEN" />
                   <option value="ADEN" />
                   <option value="Sr.DOM" />
                   <option value="DOM" />
                   <option value="AOM" />
                   <option value="Sr.DME" />
                   <option value="DME" />
                   <option value="ADME" />
                   <option value="Sr.DSTE" />
                   <option value="DSTE" />
                   <option value="ADSTE" />
                   <option value="Sr.DEE" />
                   <option value="DEE" />
                   <option value="ADEE" />
                   <option value="Sr.DCM" />
                   <option value="DCM" />
                   <option value="ACM" />
                   <option value="ADRM/KIR" />
                   <option value="ADRM" />
                   <option value="DRM" />
                 </datalist>
               </div>
            </div>

            <hr className="border-slate-800/80 my-4" />
            
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Additional Copy To</label>
              <button type="button" onClick={addCopy} className="text-[11px] font-bold text-indigo-400 flex items-center gap-1 hover:text-indigo-300 transition-colors cursor-pointer">
                <Plus className="w-3.4 h-3.4" /> Add More
              </button>
            </div>

            <div className="space-y-3">
              {formData.additionalCopies.map((copy, idx) => (
                <div key={idx} className="flex gap-2 items-start bg-slate-900/20 p-2 rounded-lg border border-slate-800/60">
                   <div className="w-5 h-5 flex items-center justify-center bg-slate-850/80 text-slate-400 rounded-md text-[10px] font-black shrink-0 mt-1">
                     {idx + 2}
                   </div>
                   <textarea 
                     value={copy} 
                     onChange={(e) => updateCopy(idx, e.target.value)} 
                     rows={1} 
                     className="flex-1 text-xs bg-slate-900/60 border border-slate-800 rounded-md px-2.5 py-1.5 text-white placeholder-slate-600 focus:outline-none resize-y" 
                     placeholder="Enter department or official copy info..." 
                   />
                   <button type="button" onClick={() => removeCopy(idx)} className="p-1 mt-0.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/20 transition-all cursor-pointer">
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              ))}
            </div>
            
            <div className="h-6"></div>
          </form>
        </div>

        {/* Live Preview (Right Side) */}
        <div className={`${showPreview ? 'hidden lg:flex' : 'hidden'} flex-1 flex-col items-center bg-[#525659] overflow-auto pt-8 pb-16 px-4 font-[Times_New_Roman,Times,serif]`}>
          <div className="bg-white shrink-0 w-[210mm] min-h-[297mm] shadow-2xl p-[18mm] relative text-black leading-snug">
            
            {/* The Document Area to Print */}
            <div ref={componentRef} className="w-full h-full text-[12pt] relative">
              <RenderPrintOverlayWatermark watermark={printSettings.watermark} />
              
              <style type="text/css" media="print">
                {`
                  @page {
                    size: A4;
                    margin: 0;
                  }
                  @media print {
                    body {
                      -webkit-print-color-adjust: exact;
                      print-color-adjust: exact;
                      padding: 18mm;
                      box-sizing: border-box;
                    }
                  }
                `}
              </style>

              {/* Document Header */}
              <div className="text-center mb-4 font-[Times_New_Roman,Times,serif]">
                <h2 className="font-bold text-[13pt] underline underline-offset-2 decoration-1 tracking-wide">
                  STANDARD FORM NO. 2
                </h2>
                <div className="text-[11pt] text-black mt-1 leading-normal max-w-2xl mx-auto italic font-normal">
                  (Standard Form for Deeming Railway servant under Suspension - Rule 5(2) of the RS (D&A) Rules, 1968)
                </div>
              </div>

              {/* Reference Details */}
              <div className="flex justify-end mb-3 w-full font-[Times_New_Roman,Times,serif] leading-[1.3]">
                <div className="text-left w-[250px]">
                  <div>No. {formData.fileNo ? formData.fileNo : '_________________'}</div>
                  <div>Railway: {formData.railway ? formData.railway : ''}</div>
                  <div>Place of issue: {formData.placeOfIssue ? formData.placeOfIssue : ''}</div>
                  <div>Dated: {formattedDate ? formattedDate : '_________________'}</div>
                </div>
              </div>

              {/* Order Title */}
              <div className="text-center font-bold text-[13pt] mb-3 font-[Times_New_Roman,Times,serif]">
                ORDER
              </div>

              {/* Body Content */}
              <div className="space-y-3 font-[Times_New_Roman,Times,serif] leading-[1.4] text-[12pt] text-justify">
                <p>
                  Whereas case against <span className="font-bold">{(formData.salutation || 'Shri')} {formData.employeeName ? formData.employeeName : ''}{formData.employeeName ? ',' : ''} {formData.designation ? formData.designation : ''}{formData.designation ? ',' : ''} {formData.workingUnder ? 'Working under ' + formData.workingUnder : ''}{formData.empNo ? ' (EMP No. ' + formData.empNo + ')' : ''}</span> in respect of a criminal offence is under investigation.
                </p>

                <p>
                  And whereas the said <span className="font-bold">{(formData.salutation || 'Shri')} {formData.employeeName ? formData.employeeName : ''}</span> was detained in custody on <span className="font-bold">{formData.detentionDate ? formatPrintDate(formData.detentionDate) : '_________________'}</span> for a period exceeding forty-eight hours.
                </p>

                <p>
                  Now, therefore the said <span className="font-bold">{(formData.salutation || 'Shri')} {formData.employeeName ? formData.employeeName : ''}</span> is deemed to have been suspended with effect from the date of detention i.e the <span className="font-bold">{formData.detentionDate ? formatPrintDate(formData.detentionDate) : '_________________'}</span> in terms of Rule 5 (2) of (D&A) Rules, 1968 and shall remain under suspension until further orders.
                </p>
              </div>

              {/* Signatory */}
              <div className="mt-6 flex justify-end font-[Times_New_Roman,Times,serif]">
                <div className="text-left w-[320px] relative">
                  <div className="absolute -top-10 left-12 pointer-events-none select-none z-10">
                    <RenderPrintOverlaySignature 
                      signature={printSettings.signature} 
                      sigCursiveText={printSettings.sigCursiveText} 
                      sigImageData={printSettings.sigImageData} 
                      defaultName={formData.signatureName} 
                      scale={printSettings.sigScale}
                      xOffset={printSettings.sigXOffset}
                      yOffset={printSettings.sigYOffset}
                    />
                  </div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none select-none z-10">
                    <RenderPrintOverlaySeal seal={printSettings.seal} customSealText={printSettings.customSealText} sealImageData={printSettings.sealImageData} />
                  </div>

                  <div className="flex items-center gap-1">
                    Signature<span className="tracking-[2px]">................................</span>
                  </div>
                  <div className="flex items-start gap-1 mt-1">
                    <span className="w-16">Name –</span> 
                    <div className="text-center flex-1">
                      {formData.signatureName ? `(${formData.signatureName})` : ''}
                    </div>
                  </div>
                  <div className="flex items-start gap-1 mt-1">
                     <span className="w-16"></span>
                     <div className="text-center flex-1">
                       {formData.authorityDesignation ? formData.authorityDesignation : ''}
                     </div>
                  </div>
                  <div className="mt-1 flex items-start gap-1">
                     <span className="w-16"></span>
                     <div className="text-center flex-1 text-[11pt] whitespace-nowrap">
                       (Designation of the suspending authority)
                     </div>
                  </div>
                </div>
              </div>

              {/* Copy To section with the exact visual styling */}
              <div className="mt-5 space-y-2 font-[Times_New_Roman,Times,serif] text-[12pt] leading-[1.3]">
                <div className="mb-2">Copy to:</div>
                <div className="flex gap-4 ml-4">
                  <span>1.</span>
                  <div className="flex-1">
                    <div className="font-bold text-justify">
                      {(formData.salutation || 'Shri')} {formData.employeeName ? formData.employeeName : ''}{formData.employeeName ? ',' : ''} {formData.designation ? formData.designation : ''}{formData.empNo ? ' (EMP No. ' + formData.empNo + '),' : ','}
                    </div>
                    <div className="text-justify mt-1 text-[11pt]">
                      (Name and designation of the deemed suspended Railway servant) Orders regarding subsistence allowance admissible to him during the period of suspension will issue separately.
                    </div>
                  </div>
                </div>
                
                {formData.additionalCopies.map((copy, index) => (
                  <div key={index} className="flex gap-4 ml-4 mt-1.5">
                    <span>{index + 2}.</span>
                    <div className="flex-1 text-justify text-[11pt]">
                      {copy}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
