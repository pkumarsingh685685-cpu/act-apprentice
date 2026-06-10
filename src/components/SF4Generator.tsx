import React, { useState, useRef } from 'react';
import { triggerPrint } from '../utils/printHelper';
import { Printer, FileText, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';

interface SF4Data {
  fileNo: string;
  railway: string;
  placeOfIssue: string;
  date: string;
  salutation: string;
  employeeName: string;
  designation: string;
  workingUnder: string;
  suspensionOrderDate: string;
  signatureName: string;
  authorityDesignation: string;
  effectOption: 'immediate' | 'date';
  effectFromDate: string;
  suspensionMadeOption: 'made' | 'deemed';
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

const initialData: SF4Data = {
  fileNo: '',
  railway: 'Admn. NFR/KIR',
  placeOfIssue: 'DRM(P)/KIR',
  date: getLocalDateString(),
  salutation: '',
  employeeName: '',
  designation: '',
  workingUnder: 'DRM(P)/KIR',
  suspensionOrderDate: '',
  signatureName: '',
  authorityDesignation: '',
  effectOption: 'immediate',
  effectFromDate: '',
  suspensionMadeOption: 'made',
  additionalCopies: [
    'Ch.O.S.(EQ)/BILL-for information and necessary action.',
    'Ch.OS/P/NJP-for information'
  ],
};

export function SF4Generator({ onBack }: { onBack?: () => void } = {}) {
  const [formData, setFormData] = useState<SF4Data>(initialData);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const componentRef = useRef<HTMLDivElement>(null);
  const addIssuedSF = useStore((state) => state.addIssuedSF);
  const config = useStore((state) => state.config);
  const sfFixedTexts = useStore((state) => state.sfFixedTexts) || {};
  const sf4Texts = sfFixedTexts["SF-4"] || {};

  const pending_sf4_drafts = useStore((state) => state.pending_sf4_drafts) || [];
  const pendingDrafts = pending_sf4_drafts.filter((d: any) => d.status === "pending");

  const showPreview = config.showSfPdfPreview !== "false";

  const whereasPlace = sf4Texts.whereasPlace || "Whereas the order placing";
  const underSuspension = sf4Texts.underSuspension || "under suspension";
  const wasMadeDeemed = sf4Texts.wasMadeDeemed || "was made/was deemed to have been made by the Undersigned on";
  const revokesSaidOrder = sf4Texts.revokesSaidOrder || "Now, therefore, the undersigned (the authority which made or is deemed to have made the order of suspension or any other authority to which that authority is subordinate) in exercise of the powers conferred by Clause (c) of sub-rule (5) of Rule 5 of the RS (D&A) Rule, 1968, hereby revokes the said order of suspension";

  const handleGenerateClick = (e: React.FormEvent) => {
    e.preventDefault();
    triggerPrint({
      contentRef: componentRef,
      documentTitle: `SF-4_Suspension_Revocation_Order_${formData.employeeName || 'Draft'}`,
      onAfterPrint: () => {
        if (formData.employeeName) {
          addIssuedSF({
            sfType: 'SF-4',
            employeeName: formData.employeeName,
            designation: formData.designation,
            issuedDate: new Date().toISOString().split('T')[0],
            isFinalised: false,
          });

          if (selectedDraftId) {
            deleteDoc(doc(db, "pending_sf4_drafts", selectedDraftId))
              .then(() => {
                toast.success("Successfully completed and cleared the pending SF-4 draft!");
                setSelectedDraftId(null);
              })
              .catch((err) => {
                console.error("Error clearing pending draft:", err);
              });
          }
        }
      },
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const resetForm = () => {
    setFormData(initialData);
    setSelectedDraftId(null);
  };

  const selectPendingDraft = (draft: any) => {
    setFormData({
      ...initialData,
      employeeName: draft.employeeName || '',
      designation: draft.designation || '',
      fileNo: draft.fileNo || '',
      salutation: draft.salutation || 'Shri',
      placeOfIssue: 'DRM(P)/KIR',
      railway: 'Admn. NFR/KIR',
      workingUnder: draft.workingUnder || 'DRM(P)/KIR',
      suspensionOrderDate: draft.suspensionOrderDate || '',
      signatureName: draft.signatureName || '',
      authorityDesignation: draft.authorityDesignation || '',
      additionalCopies: draft.additionalCopies && draft.additionalCopies.length > 0 ? draft.additionalCopies : initialData.additionalCopies,
      suspensionMadeOption: draft.sourceSfType === 'SF-2' ? 'deemed' : 'made',
    });
    setSelectedDraftId(draft.id);
    toast.success(`Loaded details for ${draft.employeeName}`);
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

  const formattedDate = formData.date ? formatPrintDate(formData.date) : '';
  const formattedSuspensionDate = formData.suspensionOrderDate ? formatPrintDate(formData.suspensionOrderDate) : '';

  return (
    <div className="flex flex-col h-full bg-gray-50 flex-1 overflow-hidden font-sans">
      {/* Header bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-wrap justify-between items-center gap-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-bold transition-all cursor-pointer mr-2 shadow-sm"
            >
              ← Back
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FileText className="w-6 h-6 text-indigo-600 font-sans" />
              SF-4 Suspension Revocation Order Generator
            </h1>
            <p className="text-sm text-gray-500 font-sans">Standard Form of Order for Revocation of Suspension</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={resetForm}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Reset Form
          </button>
          
          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          
          <button 
            type="submit"
            form="sf4-form"
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" /> Generate PDF / Print
          </button>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="flex flex-1 overflow-hidden bg-gray-100">
        
        {/* Editor Form (Left Side) */}
        <div className={`w-full ${showPreview ? 'lg:w-[420px] bg-white border-r border-gray-200 shadow-[inset_-4px_0_10px_-10px_rgba(0,0,0,0.1)]' : 'lg:max-w-4xl lg:mx-auto bg-white p-6 my-6 rounded-lg border border-gray-200 shadow-md'} overflow-y-auto p-5 shrink-0`}>
          {/* Pending Auto-Generated Drafts from SF-1 */}
          {pendingDrafts.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 mb-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold text-xs uppercase tracking-wide">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse ring-2 ring-red-400" />
                <span>⚠️ {pendingDrafts.length} Pending Revocation Draft(s)</span>
              </div>
              <p className="text-[11px] text-amber-700 mb-3">
                Select an employee who was recently suspended (SF-1) to auto-generate their SF-4 Revocation Order:
              </p>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {pendingDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white hover:bg-amber-100 border border-amber-200 hover:border-amber-400 rounded-lg text-xs font-semibold text-gray-800 transition-all shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => selectPendingDraft(draft)}
                      className="flex-1 text-left focus:outline-none"
                    >
                      <div className="font-bold text-indigo-700">{draft.employeeName}</div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        {draft.designation} {draft.fileNo ? `| Memo: ${draft.fileNo}` : ''}
                      </div>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {deleteConfirmId === draft.id ? (
                        <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded px-2 py-0.5 animate-fade-in">
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await deleteDoc(doc(db, "pending_sf4_drafts", draft.id));
                                toast.success("Draft deleted / हटा दिया गया!");
                                setDeleteConfirmId(null);
                              } catch (err) {
                                console.error(err);
                                toast.error("Failed to delete draft.");
                              }
                            }}
                            className="text-[10px] font-extrabold text-red-600 hover:text-red-800 px-1 hover:bg-red-100 rounded transition-all"
                          >
                            Yes
                          </button>
                          <span className="text-gray-300 text-[9px] select-none">|</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(null);
                            }}
                            className="text-[10px] font-extrabold text-gray-500 hover:text-gray-700 px-1 hover:bg-gray-100 rounded transition-all"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <>
                          <span className="text-[9px] uppercase font-black tracking-wider text-amber-600 bg-amber-100/50 px-1.5 py-0.5 rounded border border-amber-200">
                            Draft
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(draft.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                            title="Delete draft / ड्राफ्ट हटाएं"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h2 className="font-bold text-gray-700 mb-5 border-b pb-2 uppercase tracking-wide text-xs">Fill Form Details</h2>
          
          <form id="sf4-form" onSubmit={handleGenerateClick} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-semibold text-gray-600 mb-1">File No. <span className="text-red-500">*</span></label>
                 <input required type="text" name="fileNo" value={formData.fileNo} onChange={handleChange} className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white" placeholder="e.g. NFR/P-KIR/D.K.R/2026" />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-gray-600 mb-1">Date <span className="text-red-500">*</span></label>
                 <input required type="date" name="date" value={formData.date} onChange={handleChange} className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white" />
               </div>
            </div>

            {/* Removed Railway Name and Place of Issue inputs as they are constant and always the same */}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Employee Name <span className="text-red-500">*</span></label>
              <div className="flex">
                <select 
                  required 
                  name="salutation" 
                  value={formData.salutation} 
                  onChange={handleChange} 
                  className="text-sm border-gray-300 rounded-l px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border-y border-l bg-gray-50 focus:bg-white w-24 font-medium text-gray-700"
                >
                  <option value="">--Select--</option>
                  <option value="Shri">Shri</option>
                  <option value="Smt.">Smt.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Miss">Miss</option>
                  <option value="Dr.">Dr.</option>
                </select>
                <input required type="text" name="employeeName" value={formData.employeeName} onChange={handleChange} className="w-full text-sm border-gray-300 rounded-r px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white flex-1" placeholder="e.g. Dipak Kumar Kundu" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-semibold text-gray-600 mb-1">Designation <span className="text-red-500">*</span></label>
                 <input required type="text" name="designation" value={formData.designation} onChange={handleChange} className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white" placeholder="e.g. CS&WI/P/NJP" />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-gray-600 mb-1">Working Under <span className="text-red-500">*</span></label>
                 <input required type="text" name="workingUnder" value={formData.workingUnder} onChange={handleChange} className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white" placeholder="e.g. DRM(P)/KIR" />
               </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Suspension Order Date <span className="text-red-500">*</span></label>
              <input required type="date" name="suspensionOrderDate" value={formData.suspensionOrderDate} onChange={handleChange} className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white" />
            </div>

            <hr className="my-4 border-gray-100" />
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-semibold text-gray-600 mb-1">Signature Name <span className="text-red-500">*</span></label>
                 <input required type="text" name="signatureName" value={formData.signatureName} onChange={handleChange} className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white" placeholder="e.g. A.P.Srivastav" />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-gray-600 mb-1">Authority Designation <span className="text-red-500">*</span></label>
                 <input required type="text" name="authorityDesignation" value={formData.authorityDesignation} onChange={handleChange} className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white" placeholder="e.g. Sr. DPO/KIR" />
               </div>
            </div>

            <hr className="my-4 border-gray-100" />
            
            <div>
               <label className="block text-xs font-semibold text-gray-600 mb-2">Suspension "Was Made / Deemed" Option</label>
               <div className="flex flex-col gap-2">
                 <label className="flex items-center gap-2 text-sm text-gray-700">
                   <input type="radio" name="suspensionMadeOption" value="made" checked={formData.suspensionMadeOption === 'made'} onChange={handleChange} className="text-indigo-600 focus:ring-indigo-500" />
                   Strike out "was deemed to have been made"
                 </label>
                 <label className="flex items-center gap-2 text-sm text-gray-700">
                   <input type="radio" name="suspensionMadeOption" value="deemed" checked={formData.suspensionMadeOption === 'deemed'} onChange={handleChange} className="text-indigo-600 focus:ring-indigo-500" />
                   Strike out "was made"
                 </label>
               </div>
            </div>

            <hr className="my-4 border-gray-100" />

            <div>
               <label className="block text-xs font-semibold text-gray-600 mb-2">Effect Option</label>
               <div className="flex flex-col gap-2">
                 <label className="flex items-center gap-2 text-sm text-gray-700">
                   <input type="radio" name="effectOption" value="immediate" checked={formData.effectOption === 'immediate'} onChange={handleChange} className="text-indigo-600 focus:ring-indigo-500" />
                   Strike out "with effect from"
                 </label>
                 <label className="flex items-center gap-2 text-sm text-gray-700">
                   <input type="radio" name="effectOption" value="date" checked={formData.effectOption === 'date'} onChange={handleChange} className="text-indigo-600 focus:ring-indigo-500" />
                   Strike out "with immediate effect"
                 </label>
               </div>
            </div>

            {formData.effectOption !== 'immediate' && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  With Effect From Date <span className="text-red-500">*</span>
                </label>
                <input type="date" name="effectFromDate" value={formData.effectFromDate} onChange={handleChange} required={formData.effectOption === 'date'} className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white" />
              </div>
            )}

            <hr className="my-4 border-gray-100" />
            
             <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-600">Copy To Items</label>
              <button type="button" onClick={addCopy} className="text-xs font-semibold text-indigo-600 flex items-center gap-1 hover:text-indigo-800">
                <Plus className="w-3 h-3" /> Add More
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-500 italic">
                Item 1 will automatically be generated with: Employee Name, Designation - for information.
              </div>

              {formData.additionalCopies.map((copy, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                   <div className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-600 rounded text-xs font-semibold mt-1">
                     {idx + 2}
                   </div>
                   <textarea 
                     value={copy} 
                     onChange={(e) => updateCopy(idx, e.target.value)} 
                     rows={1} 
                     className="flex-1 text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-white resize-y" 
                     placeholder="Enter copy details..." 
                   />
                   <button type="button" onClick={() => removeCopy(idx)} className="p-1.5 mt-0.5 text-red-500 hover:bg-red-50 rounded transition-colors">
                     <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              ))}
            </div>
            
            <div className="h-4"></div>
          </form>
        </div>

        {/* Live Preview (Right Side) */}
        <div className={`${showPreview ? 'hidden lg:flex' : 'hidden'} flex-1 flex-col items-center bg-[#525659] overflow-auto pt-8 pb-16 px-4 font-['Times_New_Roman',Times,serif]`}>
          <div className="bg-white shrink-0 w-[210mm] min-h-[297mm] shadow-2xl p-[18mm] relative text-black leading-snug">
            
            {/* The Document Area to Print */}
            <div ref={componentRef} className="w-full h-full text-[12pt] font-['Times_New_Roman',Times,serif]">
              
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
              <div className="text-center mb-4 font-bold text-[13pt] leading-tight flex flex-col items-center">
                <span>STANDARD FORM NO. 4</span>
                <span>Standard Form of Order for Revocation of Suspension</span>
                <span>Order[Rule 5(5) (c) of RS (D&A) Rules, 1968]</span>
              </div>

              {/* Reference Details */}
              <div className="flex justify-end mb-4 w-full leading-[1.3] text-[12pt]">
                <div className="text-left w-[280px]">
                  <div>No. {formData.fileNo || '___________________'}</div>
                  <div>Name of the Railway. {formData.railway || '___________________'}</div>
                  <div>Place of issue : {formData.placeOfIssue || '___________________'}</div>
                  <div>Date &nbsp;{formattedDate || ' &nbsp;. &nbsp;.2026'}</div>
                </div>
              </div>

              {/* Order Title */}
              <div className="text-center font-bold text-[13pt] mb-4">
                ORDER
              </div>

              {/* Body Content */}
              <div className="font-['Times_New_Roman',Times,serif] leading-[1.4] text-[12pt] text-justify space-y-4">
                <p className="indent-10">
                  {whereasPlace} <span className="font-bold">{(formData.salutation || '__________')} {formData.employeeName || '________________________'}</span>, <span className="font-bold">{formData.designation || '____________________'}</span>, Working under <span className="font-bold">{formData.workingUnder || '____________________'}</span> {underSuspension}{' '}
                  {wasMadeDeemed === "was made/was deemed to have been made by the Undersigned on" ? (
                    formData.suspensionMadeOption === 'made' ? (
                      <span>was made<span className="line-through text-gray-500">/was deemed to have been made</span> by the Undersigned on</span>
                    ) : (
                      <span><span className="line-through text-gray-500">was made/</span>was deemed to have been made by the Undersigned on</span>
                    )
                  ) : (
                    <span>{wasMadeDeemed}</span>
                  )} <span className="font-bold">{formattedSuspensionDate || '____________'}</span>
                </p>

                <p className="indent-10">
                  {revokesSaidOrder}{' '}
                  {formData.effectOption === 'immediate' && (
                     <span>
                       with immediate effect<span className="line-through text-gray-500">/with effect from</span>
                     </span>
                  )}
                  {formData.effectOption === 'date' && (
                     <span>
                       <span className="line-through text-gray-500">with immediate effect/</span>with effect from <span className="font-bold">{formData.effectFromDate ? formatPrintDate(formData.effectFromDate) : '____________'}</span>
                     </span>
                  )}
                </p>
              </div>

              {/* Signatory */}
              <div className="mt-8 flex justify-end font-['Times_New_Roman',Times,serif] leading-[1.1]">
                <div className="text-left w-[300px] flex flex-col gap-0.5">
                  <div className="flex items-center">
                    <span className="font-bold w-16 inline-block">Signature</span><span className="tracking-[2px] font-bold">.........................................</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-16 font-bold">Name –</span> 
                    <div className="text-center flex-1 font-bold">
                      {formData.signatureName ? `(${formData.signatureName})` : ''}
                    </div>
                  </div>
                  <div className="flex items-start">
                     <span className="w-16"></span>
                     <div className="text-center flex-1 font-bold break-words">
                       {formData.authorityDesignation ? formData.authorityDesignation : ''}
                     </div>
                  </div>
                  <div className="flex items-start">
                     <span className="w-16"></span>
                     <div className="text-center flex-1 font-bold text-[11pt] leading-tight whitespace-nowrap">
                       (Designation of the Revocation authority)
                     </div>
                  </div>
                </div>
              </div>

              {/* Copy To section */}
              <div className="mt-6 space-y-1 font-['Times_New_Roman',Times,serif] text-[12pt] leading-[1.1]">
                <div className="mb-1 font-bold">Copy to:</div>
                <div className="flex gap-4 ml-4">
                  <span>1.</span>
                  <div className="flex-1">
                    <span className="font-bold">
                      {(formData.salutation || '__________')} {formData.employeeName || '________________________'}, {formData.designation || '____________________'}
                    </span>
                    <span> – for information.</span>
                  </div>
                </div>
                
                {formData.additionalCopies.map((copy, index) => (
                  <div key={index} className="flex gap-4 ml-4">
                    <span>{index + 2}.</span>
                    <div className="flex-1 text-justify">
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
