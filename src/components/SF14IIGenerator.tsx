import React, { useState, useRef } from "react";
import { triggerPrint } from "../utils/printHelper";
import { Printer, RotateCcw, Plus, Trash2 } from "lucide-react";
import { useStore } from "../store/useStore";
import { PrintCustomizer, PrintSettings, RenderPrintOverlayWatermark, RenderPrintOverlaySeal, RenderPrintOverlaySignature } from './PrintCustomizer';

interface SF14IIData {
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

const initialData: SF14IIData = {
  fileNo: "",
  railway: "Admn. NFR/KIR",
  placeOfIssue: "DRM(P)/KIR",
  date: getLocalDateString(),
  salutation: "Late/Shri",
  employeeName: "",
  designation: "Ex-",
  workingUnder: "",
  empNo: "",
  signatureName: "",
  authorityDesignation: "",
  misconductStatementPart1: "",
  misconductStatementPart2:
    "By such conduct, the pensioner exhibited serious negligence/grave misconduct, violating Rule 9 of the Railway Services (Pension) Rules, 1993, or standard Conduct rules applicable during their active service.",
  enableEditMisconductPart2: false,
  additionalCopies: ["Ch. O.S/Pension Section for necessary action.", "Accounts Officer/KIR for record."],
};

export function SF14IIGenerator({ onBack }: { onBack?: () => void } = {}) {
  const [formData, setFormData] = useState<SF14IIData>(initialData);
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
      documentTitle: `SF-14-II_Pensioner_Charge_Sheet_${formData.employeeName || "Draft"}`,
      onAfterPrint: () => {
        if (formData.employeeName) {
          addIssuedSF({
            sfType: "SF-14(II)",
            employeeName: formData.employeeName,
            designation: formData.designation,
            issuedDate: formData.date || new Date().toISOString().split("T")[0],
            isFinalised: false,
            trackStatus: "untracked",
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
    >
  ) => {
    const target = e.target;
    const value = target.type === "checkbox" ? (target as HTMLInputElement).checked : target.value;
    const name = target.name;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Are you sure you want to reset the form? All data will be lost."
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

  const empIdString = `${formData.salutation || "__________"} ${formData.employeeName}${formData.employeeName ? "," : ""} ${formData.designation}, ex-employee working under ${formData.workingUnder}`;
  const empIdStringHTML = `<strong>${empIdString}</strong>`;

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
          form="sf14ii-form"
          className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" /> Generate PDF / Print
        </button>
      </div>

      {/* Editor Form (Left Side) */}
      <div className={`w-full ${showPreview ? "lg:w-[720px] bg-white border-r border-gray-200 shadow-[inset_-4px_0_10px_-10px_rgba(0,0,0,0.1)]" : "lg:max-w-4xl lg:mx-auto bg-white p-6 my-6 rounded-lg border border-gray-200 shadow-md"} overflow-y-auto p-5 shrink-0`}>
        
        <PrintCustomizer settings={printSettings} onChange={setPrintSettings} />

        <h2 className="font-bold text-gray-700 mb-5 border-b pb-2 uppercase tracking-wide text-xs">
          SF-14(II) Form Details (Pensioner Charge-Sheet)
        </h2>

        <form
          id="sf14ii-form"
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
                placeholder="e.g. NFR/P-KIR/Pensioner/14"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Railway Authority (Locked)
              </label>
              <input
                disabled
                type="text"
                name="railway"
                value={formData.railway}
                className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 border bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Place of Issue (Locked)
              </label>
              <input
                disabled
                type="text"
                name="placeOfIssue"
                value={formData.placeOfIssue}
                className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 border bg-gray-100 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200/50 space-y-3">
            <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wide">
              Ex-Employee / Pensioner Details
            </h3>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                  Salutation
                </label>
                <select
                  name="salutation"
                  value={formData.salutation}
                  onChange={handleChange}
                  className="w-full text-xs border-gray-300 rounded px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500 border bg-white"
                >
                  <option value="Late/Shri">Late/Shri</option>
                  <option value="Shri">Shri</option>
                  <option value="Smt.">Smt.</option>
                  <option value="Late">Late</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                  Pensioner Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  name="employeeName"
                  value={formData.employeeName}
                  onChange={handleChange}
                  className="w-full text-xs border-gray-300 rounded px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500 border bg-white"
                  placeholder="e.g. Ramesh Prasad"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                  Last Designation <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  name="designation"
                  list="sf14-emp-designations"
                  value={formData.designation}
                  onChange={handleChange}
                  className="w-full text-xs border-gray-300 rounded px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500 border bg-white"
                  placeholder="e.g. Ex-Ch.OS"
                />
                <datalist id="sf14-emp-designations">
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
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                  Last Working Under <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  name="workingUnder"
                  value={formData.workingUnder}
                  onChange={handleChange}
                  className="w-full text-xs border-gray-300 rounded px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500 border bg-white"
                  placeholder="e.g. DRM(P)/KIR"
                />
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-200/50 space-y-3">
            <h3 className="text-xs font-bold text-indigo-800 uppercase tracking-wide">
              Disciplinary Authority (DA) details
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                  Signature Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  name="signatureName"
                  value={formData.signatureName}
                  onChange={handleChange}
                  className="w-full text-xs border-gray-300 rounded px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500 border bg-white"
                  placeholder="e.g. Shri Atul Kumar"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-0.5">
                  DA Designation <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  name="authorityDesignation"
                  list="sf14-da-designations"
                  value={formData.authorityDesignation}
                  onChange={handleChange}
                  className="w-full text-xs border-gray-300 rounded px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500 border bg-white"
                  placeholder="e.g. Sr. DPO"
                />
                <datalist id="sf14-da-designations">
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Imputation & Statement of Misconduct (Part 1 - Articles)
            </label>
            <textarea
              name="misconductStatementPart1"
              rows={4}
              value={formData.misconductStatementPart1}
              onChange={handleChange}
              className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white resize-y min-h-[80px]"
              placeholder="State the articles and misconduct details here..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-gray-600">
                Secondary Misconduct Statement (Part 2 - Dynamic Rule Violations)
              </label>
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 font-bold">
                <input
                  type="checkbox"
                  id="enableEditMisconductPart2"
                  name="enableEditMisconductPart2"
                  checked={formData.enableEditMisconductPart2}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      enableEditMisconductPart2: e.target.checked,
                    }))
                  }
                  className="rounded text-indigo-600"
                />
                <label htmlFor="enableEditMisconductPart2" className="cursor-pointer select-none">
                  Customise
                </label>
              </div>
            </div>
            <textarea
              disabled={!formData.enableEditMisconductPart2}
              name="misconductStatementPart2"
              rows={3}
              value={formData.misconductStatementPart2}
              onChange={handleChange}
              className={`w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border resize-y ${
                formData.enableEditMisconductPart2 ? "bg-white text-gray-800" : "bg-gray-100 text-gray-500 cursor-not-allowed"
              }`}
            />
          </div>

          {/* Copies Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">
                Additional Copies To:
              </span>
              <button
                type="button"
                onClick={addCopy}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Copy Row
              </button>
            </div>
            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
              {formData.additionalCopies.map((copy, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="text-xs font-mono strings-gray-400 select-none">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={copy}
                    onChange={(e) => updateCopy(idx, e.target.value)}
                    className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 bg-gray-50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => removeCopy(idx)}
                    className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Printable Preview / Sidepane */}
      {showPreview && (
        <div className="flex-1 h-full bg-slate-100 p-8 overflow-y-auto flex items-start justify-center print:bg-white print:p-0">
          <div
            ref={componentRef}
            className="bg-white w-[210mm] min-h-[297mm] shadow-2xl relative box-border p-[25mm] print:shadow-none print_page flex flex-col justify-between"
          >
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
                  }
                  .print_page {
                    padding: 0 !important;
                    margin: 0 auto !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    box-sizing: border-box !important;
                    box-shadow: none !important;
                  }
                }
              `}
            </style>
            {/* Page 1 */}
            <div>
              <div className="text-center font-bold tracking-tight text-base leading-snug">
                <div className="uppercase font-extrabold text-black tracking-widest text-sm mb-1">
                  {formData.railway || "NORTH FRONTIER RAILWAY"}
                </div>
                <div className="text-xs">
                  {formData.placeOfIssue || "DRM (P)/KIR"}
                </div>
                <hr className="border-black my-4" />
                <div className="text-sm font-semibold tracking-wide">
                  MEMORANDUM OF ARTICLES OF CHARGES (SF-14(II))
                </div>
                <div className="text-xs italic mt-0.5 text-gray-600 font-normal">
                  Standard form of charge-sheet for Pensioners under Rule 9 of Railway Services (Pension) Rules, 1993
                </div>
              </div>

              <div className="flex justify-between text-xs mt-6 font-semibold font-mono">
                <div>No: {formData.fileNo || "____________________"}</div>
                <div>Date: {formattedDate || "_________________"}</div>
              </div>

              <div className="mt-8 text-justify text-sm leading-relaxed whitespace-pre-wrap">
                In exercise of powers conferred on the competent authority by Rule 9 of the Railway Services (Pension) Rules, 1993, the competent authority hereby proposes to institute proceedings against <span dangerouslySetInnerHTML={{ __html: empIdStringHTML }} />.
              </div>

              <div className="mt-4 text-justify text-sm leading-relaxed whitespace-pre-wrap">
                The proceedings are proposed to be held in respect of the articles of charge set out in the enclosed statement. A list of documents by which and a list of witnesses by whom the charges are proposed to be sustained are also annexed.
              </div>

              <div className="mt-8">
                <span className="font-bold underline text-xs uppercase tracking-wider block mb-2">
                  STATEMENT OF MISCONDUCT ARTICLES:
                </span>
                <div className="text-justify border border-slate-300 bg-slate-50/20 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
                  {formData.misconductStatementPart1 || "Please write misconduct details in the fields to populate this preview segment automatically."}
                </div>
              </div>

              <div className="mt-6 text-justify text-sm leading-relaxed whitespace-pre-wrap italic text-gray-700">
                {formData.misconductStatementPart2}
              </div>

              {/* Signatures */}
              <div className="mt-12 flex justify-end">
                <div className="w-[300px] text-center text-xs relative">
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
                      ({formData.signatureName || "____________________"})
                    </span>
                  </div>
                  <div className="flex items-start mt-1">
                    <span className="w-20 text-left">Designation:</span>
                    <span className="flex-1 font-bold text-center">
                      {formData.authorityDesignation || "____________________"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Copy list */}
              <div className="mt-8 text-xs border-t border-dotted border-black pt-4">
                <span className="font-bold block uppercase mb-1.5 tracking-wider font-mono">
                  Copy with enclosure forwarded for information/necessary action:
                </span>
                <ul className="list-none space-y-1 pl-1">
                  {formData.additionalCopies.map((copy, index) => {
                    if (!copy.trim()) return null;
                    return (
                      <li key={index} className="leading-snug">
                        {index + 1}. {copy}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
