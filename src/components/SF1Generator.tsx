import React, { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Printer, FileText, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';

interface SF1Data {
  fileNo: string;
  railway: string;
  placeOfIssue: string;
  date: string;
  salutation: string;
  employeeName: string;
  designation: string;
  workingUnder: string;
  empNo: string;
  signatureName: string;
  authorityDesignation: string;
  effectOption: 'immediate' | 'date';
  effectFromDate: string;
  strikeOutRightColumn: boolean;
  additionalCopies: string[];
}

const initialData: SF1Data = {
  fileNo: '',
  railway: 'Admn. NFR/KIR',
  placeOfIssue: 'DRM (P)/KIR',
  date: new Date().toISOString().split('T')[0],
  salutation: '',
  employeeName: '',
  designation: '',
  workingUnder: '',
  empNo: '',
  signatureName: '',
  authorityDesignation: '',
  effectOption: 'immediate',
  effectFromDate: '',
  strikeOutRightColumn: false,
  additionalCopies: ['Ch. O.S/BILL for necessary action.'],
};

export function SF1Generator() {
  const [formData, setFormData] = useState<SF1Data>(initialData);
  const componentRef = useRef<HTMLDivElement>(null);
  const addIssuedSF = useStore((state) => state.addIssuedSF);

  useEffect(() => {
    // No longer needed
  }, []);

  const generatePDF = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `SF-1_Suspension_Order_${formData.employeeName || 'Draft'}`,
    onAfterPrint: () => {
      if (formData.employeeName) {
        addIssuedSF({
          sfType: 'SF-1',
          employeeName: formData.employeeName,
          designation: formData.designation,
          issuedDate: new Date().toISOString().split('T')[0],
          isFinalised: false,
        });
      }
    },
    print: async (printIframe: HTMLIFrameElement) => {
      const document = printIframe.contentDocument;
      if (document) {
         printIframe.contentWindow?.print();
      }
    },
  });

  const handleGenerateClick = (e: React.FormEvent) => {
    e.preventDefault();
    generatePDF();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const formattedDate = formData.date ? new Date(formData.date).toLocaleDateString('en-GB') : '';

  return (
    <div className="flex flex-col h-full bg-gray-50 flex-1 overflow-hidden">
      {/* Header bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-wrap justify-between items-center gap-4 shrink-0 shadow-sm z-10">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            SF-1 Suspension Order Generator
          </h1>
          <p className="text-sm text-gray-500">Standard Form for placing Railway Employee under suspension</p>
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
            form="sf1-form"
            className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" /> Generate PDF / Print
          </button>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Editor Form (Left Side) */}
        <div className="w-full lg:w-[400px] bg-white border-r border-gray-200 overflow-y-auto p-5 shadow-[inset_-4px_0_10px_-10px_rgba(0,0,0,0.1)] shrink-0">
          <h2 className="font-bold text-gray-700 mb-5 border-b pb-2 uppercase tracking-wide text-xs">Fill Form Details</h2>
          
          <form id="sf1-form" onSubmit={handleGenerateClick} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-semibold text-gray-600 mb-1">File No. <span className="text-red-500">*</span></label>
                 <input required type="text" name="fileNo" value={formData.fileNo} onChange={handleChange} className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white" placeholder="e.g. NFR/P-KIR/A.K.P/2026" />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-gray-600 mb-1">Date <span className="text-red-500">*</span></label>
                 <input required type="date" name="date" value={formData.date} onChange={handleChange} className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white" />
               </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Employee Name <span className="text-red-500">*</span></label>
              <div className="flex">
                <select 
                  required 
                  name="salutation" 
                  value={formData.salutation} 
                  onChange={handleChange as any} 
                  className="text-sm border-gray-300 rounded-l px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border-y border-l bg-gray-50 focus:bg-white w-24 font-medium text-gray-700"
                >
                  <option value="">--Select--</option>
                  <option value="Shri">Shri</option>
                  <option value="Smt.">Smt.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Miss">Miss</option>
                  <option value="Dr.">Dr.</option>
                </select>
                <input required type="text" name="employeeName" value={formData.employeeName} onChange={handleChange} className="w-full text-sm border-gray-300 rounded-r px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white flex-1" placeholder="e.g. Rahul Kumar" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Designation <span className="text-red-500">*</span></label>
              <input required type="text" name="designation" value={formData.designation} onChange={handleChange} className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white" placeholder="e.g. Technician Gr.III" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Working Under <span className="text-red-500">*</span></label>
              <input required type="text" name="workingUnder" value={formData.workingUnder} onChange={handleChange} className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white" placeholder="e.g. Sr. DPO/KIR" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Employee Number (EMP No.)</label>
              <input type="text" name="empNo" value={formData.empNo} onChange={handleChange} className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white" placeholder="e.g. 123456789" />
            </div>

            <hr className="my-4 border-gray-100" />
            
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-semibold text-gray-600 mb-1">Signature Name <span className="text-red-500">*</span></label>
                 <input required type="text" name="signatureName" value={formData.signatureName} onChange={handleChange} className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white" placeholder="e.g. A.P.Srivastav" />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-gray-600 mb-1">Authority Designation <span className="text-red-500">*</span></label>
                 <input required type="text" name="authorityDesignation" value={formData.authorityDesignation} onChange={handleChange} className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white" placeholder="e.g. Sr.DPO/KIR" />
               </div>
            </div>

            <hr className="my-4 border-gray-100" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
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
               <div className="space-y-4">
                 {formData.effectOption !== 'immediate' && (
                   <div>
                     <label className="block text-xs font-semibold text-gray-600 mb-1">
                       With Effect From Date {formData.effectOption === 'date' && <span className="text-red-500">*</span>}
                     </label>
                     <input type="date" name="effectFromDate" value={formData.effectFromDate} onChange={handleChange} required={formData.effectOption === 'date'} className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white" />
                   </div>
                 )}
                 <div className="flex items-center h-[34px] bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100">
                   <label className="flex items-center gap-2 text-xs font-bold text-indigo-700 cursor-pointer">
                     <input type="checkbox" name="strikeOutRightColumn" checked={formData.strikeOutRightColumn} onChange={handleChange} className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                     Strike Out Right Column Text
                   </label>
                 </div>
               </div>
            </div>

            <hr className="my-4 border-gray-100" />
            
             <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-gray-600">Copy To Items</label>
              <button type="button" onClick={addCopy} className="text-xs font-semibold text-indigo-600 flex items-center gap-1 hover:text-indigo-800">
                <Plus className="w-3 h-3" /> Add More
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-500 italic">
                Item 1 will automatically be generated with: Employee Name, Designation + Orders regarding subsistence allowance...
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
        <div className="hidden lg:flex flex-1 flex-col items-center bg-[#525659] overflow-auto pt-8 pb-16 px-4 font-[Times_New_Roman,Times,serif]">
          <div className="bg-white shrink-0 w-[210mm] min-h-[297mm] shadow-2xl p-[25.4mm] relative text-black leading-snug">
            
            {/* The Document Area to Print */}
            <div ref={componentRef} className="w-full h-full text-[12pt]">
              
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
                      padding: 25.4mm;
                      box-sizing: border-box;
                    }
                  }
                `}
              </style>

              {/* Document Header */}
              <div className="text-center mb-8 font-[Times_New_Roman,Times,serif]">
                <h2 className="font-bold text-[13pt] underline underline-offset-2 decoration-1 tracking-wide">
                  STANDARD FORM NO. 1
                </h2>
              </div>

              {/* Reference Details */}
              <div className="flex justify-end mb-6 w-full font-[Times_New_Roman,Times,serif] leading-[1.4]">
                <div className="text-left w-[250px]">
                  <div>No.{formData.fileNo ? formData.fileNo : ''}</div>
                  <div>Railway: {formData.railway ? formData.railway : ''}</div>
                  <div>Place of issue: {formData.placeOfIssue ? formData.placeOfIssue : ''}</div>
                  <div>Dated: {formattedDate ? formattedDate : ''}</div>
                </div>
              </div>

              {/* Order Title */}
              <div className="text-center font-bold text-[13pt] mb-6 font-[Times_New_Roman,Times,serif]">
                ORDER
              </div>

              {/* Columns Section */}
              <div className="flex justify-between items-start mb-6 font-[Times_New_Roman,Times,serif] leading-[1.3] text-[12pt]">
                {/* Left Column */}
                <div className="w-[48%]">
                  <p>Whereas disciplinary proceeding against</p>
                  <div className="font-bold whitespace-pre-wrap mt-1">
                    {(formData.salutation || '__________') + ' ' + (formData.employeeName || '') + ',\n'}
                    {(formData.designation || '') + (formData.designation ? ',\n' : '\n')}
                    {formData.workingUnder ? 'Working under ' + formData.workingUnder + '\n' : ''}
                    {formData.empNo ? '(EMP No. ' + formData.empNo + ')\n' : ''}
                  </div>
                  <p className="mt-1">(Name and designation of the Railway<br/>servant) is contemplated/Pending</p>
                </div>
                
                {/* Right Column */}
                <div className={`w-[45%] ${formData.strikeOutRightColumn ? 'line-through opacity-70' : ''}`}>
                  <p>Whereas a case against {(formData.salutation || '__________')}</p>
                  <br />
                  <p className="text-justify leading-tight">
                    (Name and designation of the Railway<br/>servant) in respect of whom a criminal<br/>offence is under investigation / inquiry /<br/>trail.
                  </p>
                </div>
              </div>

              {/* Body Content */}
              <div className="space-y-6 font-[Times_New_Roman,Times,serif] leading-[1.4] text-[12pt] text-justify mt-8">
                <p>
                  Now, therefore, the undersigned (the authority competent to place the Railway Servant under suspension in terms of the Schedules II and III appended to RS (D&A) Rules, 1968/ an authority mentioned in proviso to [Rule 4 of the RS (D&A) Rules, 1968], in exercise of the powers conferred by Rule 4/proviso to Rule 4 of RS (D&A) Rules, 1968, hereby places the said <span className="font-bold">{(formData.salutation || '__________')} {formData.employeeName ? formData.employeeName : ''}{formData.employeeName ? ',' : ''} {formData.designation ? formData.designation : ''}{formData.designation ? ',' : ''} {formData.workingUnder ? 'Working under ' + formData.workingUnder + ',' : ''} {formData.empNo ? '(EMP No. ' + formData.empNo + ')' : ''}</span> under suspension{' '}
                  {formData.effectOption === 'immediate' && <span>with immediate effect<strike className="opacity-70">/with effect from</strike></span>}
                  {formData.effectOption === 'date' && <span><strike className="opacity-70">with immediate effect/</strike>with effect from <span className="font-bold">{formData.effectFromDate ? new Date(formData.effectFromDate).toLocaleDateString('en-GB') : '[DATE]'}</span></span>}
                </p>

                <p>
                  It is further ordered that during the period this order shall remain in force, the said <span className="font-bold">{(formData.salutation || '__________')} {formData.employeeName ? formData.employeeName : ''}{formData.employeeName ? ',' : ''} {formData.designation ? formData.designation : ''}{formData.designation ? ',' : ''} {formData.empNo ? '(EMP No. ' + formData.empNo + ')' : ''}</span> shall not leave the headquarters without obtaining the previous permission of the competent authority.
                </p>
              </div>

              {/* Signatory */}
              <div className="mt-16 flex justify-end font-[Times_New_Roman,Times,serif]">
                <div className="text-left w-[320px]">
                  <div className="flex items-center gap-1">
                    Signature<span className="tracking-[2px]">.........................................................</span>
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

              {/* Copy To section */}
              <div className="mt-12 space-y-2 font-[Times_New_Roman,Times,serif] text-[12pt] leading-[1.3]">
                <div className="mb-2">Copy to:</div>
                <div className="flex gap-4 ml-4">
                  <span>1.</span>
                  <div className="flex-1">
                    <div className="font-bold text-justify">
                      {(formData.salutation || '__________')} {formData.employeeName ? formData.employeeName : ''}{formData.employeeName ? ',' : ''} {formData.designation ? formData.designation : ''}{formData.empNo ? ' (EMP No. ' + formData.empNo + '),' : ','}
                    </div>
                    <div className="text-justify mt-1">
                      (Name and designation of the suspended Railway servant) Orders regarding subsistence allowance admissible to him during the period of &nbsp;suspension will issue separately.
                    </div>
                  </div>
                </div>
                
                {formData.additionalCopies.map((copy, index) => (
                  <div key={index} className="flex gap-4 ml-4 mt-2">
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
