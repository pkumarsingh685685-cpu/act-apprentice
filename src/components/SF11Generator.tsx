import React, { useState, useRef } from "react";
import { triggerPrint } from "../utils/printHelper";
import { Printer, RotateCcw, Plus, Trash2 } from "lucide-react";
import { useStore } from "../store/useStore";
import { PrintCustomizer, PrintSettings, RenderPrintOverlayWatermark, RenderPrintOverlaySeal, RenderPrintOverlaySignature } from './PrintCustomizer';

interface SF11Data {
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
  misconductStatementPart1: string;
  misconductStatementPart2: string;
  enableEditMisconductPart2: boolean;
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

const initialData: SF11Data = {
  fileNo: "",
  railway: "Admn. NFR/KIR",
  placeOfIssue: "DRM(P)/KIR",
  date: getLocalDateString(),
  salutation: "",
  employeeName: "",
  designation: "",
  workingUnder: "",
  empNo: "",
  signatureName: "",
  authorityDesignation: "",
  misconductStatementPart1: "",
  misconductStatementPart2:
    "By such conduct, she has caused serious administrative embarrassment and undermined the credibility of the system. Her behaviour is wholly unbecoming of a Railway servant and constitutes a grave violation of Rule 3(1)(ii) and 3(1)(iii) of the Railway Services (Conduct) Rules, 1966.",
  enableEditMisconductPart2: false,
  additionalCopies: ["Ch.OS/EQ-for necessary action please."],
};

export function SF11Generator({ onBack }: { onBack?: () => void } = {}) {
  const [formData, setFormData] = useState<SF11Data>(initialData);
  const componentRef = useRef<HTMLDivElement>(null);
  const addIssuedSF = useStore((state) => state.addIssuedSF);
  const config = useStore((state) => state.config);
  const sfFixedTexts = useStore((state) => state.sfFixedTexts) || {};
  const sf11Texts = sfFixedTexts["SF-11"] || {};

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

  const proposesAction = sf11Texts.proposesAction || "The undersigned proposes to take action against the said Railway servant under Rule 11 of the Railway Servants (Discipline and Appeal) Rules, 1968. The substance of the imputations of misconduct or misbehaviour in respect of which action is proposed to be taken is set out in the enclosed statement of misconduct or misbehaviour.";
  const givenOpportunity = sf11Texts.givenOpportunity || "The said Railway servant is hereby given an opportunity to make such representation as he may wish to make against the proposal. If he fails to submit his representation within ten days, it will be presumed that he has no representation to make.";

  const handleGenerateClick = (e: React.FormEvent) => {
    e.preventDefault();
    triggerPrint({
      contentRef: componentRef,
      documentTitle: `SF-11_Charge_Sheet_${formData.employeeName || "Draft"}`,
      onAfterPrint: () => {
        if (formData.employeeName) {
          addIssuedSF({
            sfType: 'SF-11',
            employeeName: formData.employeeName,
            designation: formData.designation,
            issuedDate: formData.date || new Date().toISOString().split('T')[0],
            isFinalised: false,
            trackStatus: 'untracked',
            memorandumNo: formData.fileNo || "",
            nameOfDa: formData.signatureName || "Shri Atul Kumar",
            designationOfDa: formData.authorityDesignation || "Sr.DPO",
            charges: formData.misconductStatementPart1 || "",
          });
        }
      },
    });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const target = e.target;
    // Cast to HTMLInputElement to access .checked
    const value = target.type === 'checkbox' ? (target as HTMLInputElement).checked : target.value;
    const name = target.name;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Are you sure you want to reset the form? All data will be lost.",
      )
    ) {
      setFormData(initialData);
    }
  };

  const addCopy = () => {
    setFormData((prev) => ({
      ...prev,
      additionalCopies: [...prev.additionalCopies, ""],
    }));
  };

  const updateCopy = (index: number, value: string) => {
    setFormData((prev) => {
      const newCopies = [...prev.additionalCopies];
      newCopies[index] = value;
      return { ...prev, additionalCopies: newCopies };
    });
  };

  const removeCopy = (index: number) => {
    setFormData((prev) => {
      const newCopies = [...prev.additionalCopies];
      newCopies.splice(index, 1);
      return { ...prev, additionalCopies: newCopies };
    });
  };

  const formattedDate = formData.date
    ? formatPrintDate(formData.date)
    : "";

  const empIdString = `${formData.salutation || '__________'} ${formData.employeeName}${formData.employeeName ? "," : ""} ${formData.designation}, working under ${formData.workingUnder}`;
  const empIdStringHTML = `<strong>${empIdString}</strong>`;

  const processedProposesAction = proposesAction === "The undersigned proposes to take action against the said Railway servant under Rule 11 of the Railway Servants (Discipline and Appeal) Rules, 1968. The substance of the imputations of misconduct or misbehaviour in respect of which action is proposed to be taken is set out in the enclosed statement of misconduct or misbehaviour."
    ? `${empIdStringHTML} is hereby informed that the undersigned proposed to take action against him/her under Rule 11 of the Railway Servants (Discipline and Appeal) Rules, 1968. A statement of the imputations of misconduct or misbehavior, on which action is proposed to be taken as mentioned above, is enclosed.`
    : proposesAction.replace(/the said Railway servant/gi, empIdStringHTML).replace(/the said railway servant/gi, empIdStringHTML);

  const processedGivenOpportunity = givenOpportunity === "The said Railway servant is hereby given an opportunity to make such representation as he may wish to make against the proposal. If he fails to submit his representation within ten days, it will be presumed that he has no representation to make."
    ? `${empIdStringHTML} is hereby given an opportunity to make such representation as he/she may wish to make against the proposal. The representation, if any, should be submitted to the undersigned so as to reach within ten days of receipt of this Memorandum.`
    : givenOpportunity.replace(/the said Railway servant/gi, empIdStringHTML).replace(/the said railway servant/gi, empIdStringHTML);

  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-gray-50 overflow-hidden relative">
      <div className="absolute top-4 right-5 z-20 flex gap-3 font-sans">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors shadow-sm cursor-pointer"
          >
            ← Back
          </button>
        )}

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors shadow-sm"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </button>

        <div className="h-6 w-px bg-gray-300 mx-1"></div>

        <button
          type="submit"
          form="sf11-form"
          className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" /> Generate PDF / Print
        </button>
      </div>

      {/* Editor Form (Left Side) */}
      <div className={`w-full ${showPreview ? 'lg:w-[720px] bg-white border-r border-gray-200 shadow-[inset_-4px_0_10px_-10px_rgba(0,0,0,0.1)]' : 'lg:max-w-4xl lg:mx-auto bg-white p-6 my-6 rounded-lg border border-gray-200 shadow-md'} overflow-y-auto p-5 shrink-0`}>
        
        <PrintCustomizer settings={printSettings} onChange={setPrintSettings} />

        <h2 className="font-bold text-gray-700 mb-5 border-b pb-2 uppercase tracking-wide text-xs">
          Fill Form Details
        </h2>

        <form
          id="sf11-form"
          onSubmit={handleGenerateClick}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                File No. <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                name="fileNo"
                value={formData.fileNo}
                onChange={handleChange}
                className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white"
                placeholder="e.g. NFR/P-KIR/J.K/02"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Employee Name <span className="text-red-500">*</span>
            </label>
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
              <input
                required
                type="text"
                name="employeeName"
                value={formData.employeeName}
                onChange={handleChange}
                className="w-full text-sm border-gray-300 rounded-r px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white flex-1"
                placeholder="e.g. Jitendra Kumar"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Designation <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              name="designation"
              list="sf11-emp-designations"
              value={formData.designation}
              onChange={handleChange}
              className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white"
              placeholder="e.g. Sr.Clerk(E)"
            />
            <datalist id="sf11-emp-designations">
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
            </datalist>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Working Under <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              name="workingUnder"
              value={formData.workingUnder}
              onChange={handleChange}
              className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white"
              placeholder="e.g. DRM (P)/KIR"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Employee Number (EMP No.)
            </label>
            <input
              type="text"
              name="empNo"
              value={formData.empNo}
              onChange={handleChange}
              className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white"
              placeholder="e.g. 123456789"
            />
          </div>

          <hr className="my-4 border-gray-100" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Signature Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                name="signatureName"
                value={formData.signatureName}
                onChange={handleChange}
                className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white"
                placeholder="e.g. A.P. SRIVASTAV"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Authority Designation <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                name="authorityDesignation"
                list="sf11-da-designations"
                value={formData.authorityDesignation}
                onChange={handleChange}
                className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white"
                placeholder="e.g. Sr. DPO/KIR"
              />
              <datalist id="sf11-da-designations">
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

          <hr className="my-4 border-gray-100" />

          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-gray-600">
              Copy To Items
            </label>
            <button
              type="button"
              onClick={addCopy}
              className="text-xs font-semibold text-indigo-600 flex items-center gap-1 hover:text-indigo-800"
            >
              <Plus className="w-3 h-3" /> Add More
            </button>
          </div>

          <div className="space-y-3">
            {formData.additionalCopies.map((copy, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="w-6 h-6 flex items-center justify-center bg-gray-100 text-gray-600 rounded text-xs font-semibold mt-1">
                  {idx + 2}.
                </div>
                <textarea
                  rows={2}
                  value={copy}
                  onChange={(e) => updateCopy(idx, e.target.value)}
                  className="flex-1 text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-white resize-y"
                  placeholder="Enter copy details..."
                />
                <button
                  type="button"
                  onClick={() => removeCopy(idx)}
                  className="p-1.5 mt-0.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <hr className="my-4 border-gray-100" />

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Misconduct Statement (Part 1)
            </label>
            <textarea
              name="misconductStatementPart1"
              value={formData.misconductStatementPart1}
              onChange={handleChange}
              rows={6}
              className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-white resize-y"
              placeholder="Enter misconduct statement part 1..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-600">
                Misconduct Statement (Part 2)
              </label>
              <label className="flex items-center gap-1.5 text-xs text-indigo-600 font-semibold cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  name="enableEditMisconductPart2"
                  checked={formData.enableEditMisconductPart2}
                  onChange={handleChange}
                  className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-3 h-3 cursor-pointer"
                />
                Edit
              </label>
            </div>
            <textarea
              name="misconductStatementPart2"
              value={formData.misconductStatementPart2}
              onChange={handleChange}
              rows={4}
              disabled={!formData.enableEditMisconductPart2}
              className={`w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border resize-y ${!formData.enableEditMisconductPart2 ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
              placeholder="Enter misconduct statement part 2..."
            />
          </div>
          
          <div className="h-4"></div>
        </form>
      </div>

      {/* Live Preview (Right Side) */}
      <div className={`${showPreview ? 'flex-1' : 'hidden'} bg-gray-200 overflow-auto p-4 lg:p-8 flex flex-col items-center`}>
        <div
          ref={componentRef}
          className="w-full shrink-0 flex flex-col items-center gap-8 text-[12pt] font-[Times_New_Roman,Times,serif] text-black leading-snug min-w-[210mm] relative"
        >
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
                }
                .page-break {
                  page-break-before: always;
                }
                .print-page {
                  box-shadow: none !important;
                  margin: 0 !important;
                  padding: 20mm !important;
                  box-sizing: border-box !important;
                }
              }
            `}
          </style>

          {/* PAGE 1 */}
          <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl relative box-border p-[25mm] print-page print:p-0">
            {/* Header Title */}
              <div className="text-center font-bold underline mb-4">
                STANDARD FORM NO. 11
              </div>

              <div className="text-center font-bold mb-4">
                STANDARD FORM OF CHARGE SHEET
              </div>

              <div className="text-center font-bold mb-8 whitespace-nowrap">
                [RULE 11 OF THE RAILWAY SERVANTS (DISCIPLINE AND APPEAL) RULES, 1968]
              </div>

              {/* Reference Details */}
              <div className="flex justify-end mb-8 w-full leading-[1.4]">
                <div className="text-left w-[250px]">
                  <div>No. {formData.fileNo}</div>
                  <div>Name of the Rly: {formData.railway}</div>
                  <div>Place of issue: {formData.placeOfIssue}</div>
                  <div>Date: {formattedDate}</div>
                </div>
              </div>

              <div className="text-center font-bold mb-6">MEMORANDUM</div>

              {/* Numbered Points */}
              <div className="space-y-4 text-justify pl-8 relative">
                <div className="absolute left-4 top-0">1.</div>
                <div dangerouslySetInnerHTML={{ __html: processedProposesAction }} />
              </div>

              <div className="space-y-4 text-justify pl-8 relative mt-2">
                <div className="absolute left-4 top-0">2.</div>
                <div dangerouslySetInnerHTML={{ __html: processedGivenOpportunity }} />
              </div>

              <div className="space-y-4 text-justify pl-8 relative mt-2">
                <div className="absolute left-4 top-0">3.</div>
                <div>
                  <span className="font-bold">
                    {formData.salutation || '__________'} {formData.employeeName}
                    {formData.employeeName ? "," : ""} {formData.designation}
                  </span>
                  , working under {formData.workingUnder} fails to submit
                  his/her representation within the period specified in para 2,
                  it will be presumed that he/she has no representation to make
                  and orders will be liable to be passed against{" "}
                  <span className="font-bold">
                    {formData.salutation || '__________'} {formData.employeeName}
                    {formData.employeeName ? "," : ""} {formData.designation}
                  </span>
                  , working under {formData.workingUnder}, ex-parte.
                </div>
              </div>

              <div className="space-y-4 text-justify pl-8 relative mt-2">
                <div className="absolute left-4 top-0">4.</div>
                <div>
                  The receipt of this Memorandum should be acknowledged{" "}
                  <span className="font-bold">
                    {formData.salutation || '__________'} {formData.employeeName}
                    {formData.employeeName ? "," : ""} {formData.designation}
                  </span>
                  , working under {formData.workingUnder}
                </div>
              </div>

              {/* Signatory 1 */}
              <div className="mt-12 flex justify-end">
                <div className="w-[350px] text-center relative">
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

                  <div className="flex items-end mb-1">
                    <span className="w-20 text-left">Signature</span>
                    <span className="flex-1 border-b border-black border-dotted"></span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-20 text-left">Name:</span>
                    <span className="flex-1 font-bold text-center">
                      ({formData.signatureName || ""})
                    </span>
                  </div>
                  <div className="flex items-start mt-1">
                    <span className="w-20 text-left"></span>
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <span className="font-bold max-w-[200px] break-words">
                        {formData.authorityDesignation}
                      </span>
                      <span className="font-bold text-sm mt-0.5">
                        (Designation of the Disciplinary Authority)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* To Section */}
              <div className="mt-8">
                <div className="mb-4">To,</div>
                <div className="pl-6 relative">
                  <span className="absolute left-2">1.</span>
                  <span className="font-bold">
                    {formData.salutation || '__________'} {formData.employeeName}
                    {formData.employeeName ? ", " : ""}
                    {formData.designation}{formData.empNo ? `, (EMP No. ${formData.empNo})` : ""}
                  </span>
                  <br />
                  Working under {formData.workingUnder}
                  <br />
                  N.F.Railway
                </div>
                {formData.additionalCopies.map((copy, index) => (
                  <div key={index} className="pl-6 relative mt-1">
                    <span className="absolute left-2">{index + 2}.</span>
                    <span>{copy}</span>
                  </div>
                ))}
              </div>

              {/* Signatory 2 */}
              <div className="mt-12 flex justify-end pb-8">
                <div className="w-[350px] text-center relative">
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

                  <div className="flex items-end mb-1">
                    <span className="w-20 text-left">Signature</span>
                    <span className="flex-1 border-b border-black border-dotted"></span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-20 text-left">Name:</span>
                    <span className="flex-1 font-bold text-center">
                      ({formData.signatureName || ""})
                    </span>
                  </div>
                  <div className="flex items-start mt-1">
                    <span className="w-20 text-left"></span>
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <span className="font-bold max-w-[200px] break-words">
                        {formData.authorityDesignation}
                      </span>
                      <span className="font-bold text-sm mt-0.5">
                        (Designation of the Disciplinary Authority)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Page 1 */}
              <div className="absolute bottom-6 left-0 right-0 text-center font-bold text-sm">
                Page-1 of 2
              </div>
            </div>

          {/* PAGE 2 */}
          <div className="bg-white w-[210mm] min-h-[297mm] shadow-2xl relative box-border p-[25mm] print-page page-break print:p-0">
            <div className="text-center font-bold underline uppercase mb-8 leading-relaxed px-4">
                STATEMENT OF IMPUTATIONS OF MISCONDUCT OR MISBEHAVIOUR AGAINST{" "}
                {formData.salutation || '__________'} {formData.employeeName}
                {formData.employeeName ? ", " : ""}
                {formData.designation} WORKING UNDER {formData.workingUnder}
              </div>

              <div className="text-justify mb-6 whitespace-pre-wrap">
                {formData.misconductStatementPart1}
              </div>

              <div className="text-justify mb-16 whitespace-pre-wrap">
                {formData.misconductStatementPart2}
              </div>

              {/* Signatory 3 */}
              <div className="mt-16 flex justify-end">
                <div className="w-[350px] text-center relative">
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

                  <div className="flex items-end mb-1">
                    <span className="w-20 text-left">Signature</span>
                    <span className="flex-1 border-b border-black border-dotted"></span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-20 text-left">Name:</span>
                    <span className="flex-1 font-bold text-center">
                      ({formData.signatureName || ""})
                    </span>
                  </div>
                  <div className="flex items-start mt-1">
                    <span className="w-20 text-left"></span>
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <span className="font-bold max-w-[200px] break-words">
                        {formData.authorityDesignation}
                      </span>
                      <span className="font-bold text-sm mt-0.5">
                        (Designation of the Disciplinary Authority)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Page 2 */}
              <div className="absolute bottom-6 left-0 right-0 text-center font-bold text-sm">
                Page 2 of 2
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
