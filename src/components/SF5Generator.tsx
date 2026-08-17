import React, { useState, useRef } from "react";
import { triggerPrint } from "../utils/printHelper";
import { Printer, RotateCcw, Plus, Trash2 } from "lucide-react";
import { useStore } from "../store/useStore";
import { PrintCustomizer, PrintSettings, RenderPrintOverlayWatermark, RenderPrintOverlaySeal, RenderPrintOverlaySignature } from './PrintCustomizer';

interface SF5Data {
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
  annexureIArticles: string[];
  annexureIFooter: string;
  annexureII: string;
  annexureIII: string[];
  annexureIV: string[];
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

const initialData: SF5Data = {
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
  annexureIArticles: [""],
  annexureIFooter: "",
  annexureII: "",
  annexureIII: [""],
  annexureIV: [""],
  additionalCopies: [""]
};

function getFormattedRulesString(rules: string[]): string {
  if (rules.length === 0) return "";
  if (rules.length === 1) return rules[0];
  if (rules.length === 2) return `${rules[0]} and ${rules[1]}`;
  const allButLast = rules.slice(0, -1).join(", ");
  return `${allButLast} and ${rules[rules.length - 1]}`;
}

function generateFooterText(
  salutation: string,
  employeeName: string,
  designation: string,
  workingUnder: string,
  rules: string[]
): string {
  const empName = employeeName ? `${salutation || '__________'} ${employeeName}` : "________________________";
  const desig = designation ? designation : "____________________";
  const workingPart = workingUnder ? `, working under ${workingUnder}` : "";
  const rulesStr = rules.length > 0 ? getFormattedRulesString(rules) : "____________________";
  
  return `By the aforesaid acts of omission and commission, ${empName}, ${desig}${workingPart}, has shown lack of devotion to duty and acted in a manner which is unbecoming of a Railway Servant and thereby violated ${rulesStr} of Railway Services (Conduct) Rules,1966`;
}

export function SF5Generator({ onBack }: { onBack?: () => void } = {}) {
  const [formData, setFormData] = useState<SF5Data>(initialData);
  const [isFooterEditable, setIsFooterEditable] = useState<boolean>(false);
  const [selectedRules, setSelectedRules] = useState<string[]>([
    "Rule No.3(1) (ii)",
    "Rule No.3(1) (iii)"
  ]);
  const [customRuleInput, setCustomRuleInput] = useState<string>("");

  const config = useStore((state) => state.config);
  const sfFixedTexts = useStore((state) => state.sfFixedTexts) || {};
  const sf5Texts = sfFixedTexts["SF-5"] || {};

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

  const proposesInquiry = sf5Texts.proposesInquiry || "The undersigned proposes to hold an inquiry against the said Railway servant under Rule 9 of the Railway Servants (Discipline and Appeal) Rules, 1968. The substance of the imputations of misconduct or misbehaviour in respect of which the inquiry is proposed to be held is set out in the enclosed statement of articles of charge (Annexure I). A statement of the imputations of misconduct or misbehaviour in support of each article of charge is enclosed (Annexure II). A list of documents by which and a list of witnesses by whom the articles of charge are proposed to be sustained are also enclosed (Annexures III and IV).";
  const directedSubmit = sf5Texts.directedSubmit || "The said Railway servant is hereby directed to submit to the undersigned a written statement of his defense within ten days of the receipt of this memorandum.";

  React.useEffect(() => {
    if (!isFooterEditable) {
      const generatedText = generateFooterText(
        formData.salutation,
        formData.employeeName,
        formData.designation,
        formData.workingUnder,
        selectedRules
      );
      setFormData((prev) => {
        if (prev.annexureIFooter !== generatedText) {
          return { ...prev, annexureIFooter: generatedText };
        }
        return prev;
      });
    }
  }, [
    isFooterEditable,
    formData.salutation,
    formData.employeeName,
    formData.designation,
    formData.workingUnder,
    selectedRules
  ]);

  const componentRef = useRef<HTMLDivElement>(null);
  const addIssuedSF = useStore((state) => state.addIssuedSF);

  const handleGenerateClick = (e: React.FormEvent) => {
    e.preventDefault();
    triggerPrint({
      contentRef: componentRef,
      documentTitle: `SF-5_Charge_Memorandum_${formData.employeeName || "Draft"}`,
      onAfterPrint: () => {
        if (formData.employeeName) {
          addIssuedSF({
            sfType: 'SF-5',
            employeeName: formData.employeeName,
            designation: formData.designation,
            issuedDate: formData.date || new Date().toISOString().split('T')[0],
            isFinalised: false,
            trackStatus: 'untracked',
            memorandumNo: formData.fileNo || "",
            nameOfDa: formData.signatureName || "Shri Atul Kumar",
            designationOfDa: formData.authorityDesignation || "Sr.DPO",
            charges: (formData.annexureIArticles || []).filter(Boolean).join("\n"),
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
    const value = target.value;
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

  const addListString = (key: keyof Pick<SF5Data, 'annexureIArticles'|'annexureIII'|'annexureIV'|'additionalCopies'>) => {
    setFormData((prev) => ({
      ...prev,
      [key]: [...prev[key], ""],
    }));
  };

  const updateListString = (key: keyof Pick<SF5Data, 'annexureIArticles'|'annexureIII'|'annexureIV'|'additionalCopies'>, index: number, value: string) => {
    setFormData((prev) => {
      const newList = [...prev[key]];
      newList[index] = value;
      return { ...prev, [key]: newList };
    });
  };

  const removeListString = (key: keyof Pick<SF5Data, 'annexureIArticles'|'annexureIII'|'annexureIV'|'additionalCopies'>, index: number) => {
    setFormData((prev) => {
      const newList = [...prev[key]];
      newList.splice(index, 1);
      return { ...prev, [key]: newList };
    });
  };

  const formattedDate = formData.date
    ? formatPrintDate(formData.date)
    : "";

  const empString = `${formData.salutation || '__________'} ${formData.employeeName}${formData.designation ? `, ${formData.designation}` : ""}, under ${formData.workingUnder}`;

  const empStringHTML = `<strong>${empString}</strong>`;
  
  const processedProposesInquiry = proposesInquiry
    .replace(/the said Railway servant/gi, empStringHTML)
    .replace(/the said railway servant/gi, empStringHTML);

  const processedDirectedSubmit = directedSubmit === "The said Railway servant is hereby directed to submit to the undersigned a written statement of his defense within ten days of the receipt of this memorandum."
    ? `<strong>${empString}</strong> is hereby directed to submit to the undersigned a written statement of his defence which should reach, the undersigned within ten days of receipt of this Memorandum, if he does not require to inspect any documents for the preparation of his defence, and within ten days after completion of inspection of documents if he desires to inspect documents, and also:-`
    : directedSubmit.replace(/the said Railway servant/gi, empStringHTML).replace(/the said railway servant/gi, empStringHTML);

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
          form="sf5-form"
          className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" /> Print / PDF
        </button>
      </div>

      {/* Editor Form */}
      <div className={`w-full ${showPreview ? 'lg:w-[720px] bg-white border-r border-gray-200 shadow-[inset_-4px_0_10px_-10px_rgba(0,0,0,0.1)]' : 'lg:max-w-4xl lg:mx-auto bg-white p-6 my-6 rounded-lg border border-gray-200 shadow-md'} overflow-y-auto p-5 shrink-0 pb-20`}>
        
        <PrintCustomizer settings={printSettings} onChange={setPrintSettings} />

        <h2 className="font-bold text-gray-700 mb-5 border-b pb-2 uppercase tracking-wide text-xs">
          Fill Form Details
        </h2>

        <form id="sf5-form" onSubmit={handleGenerateClick} className="space-y-4">
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
                placeholder="e.g. NFR/P-KIR/..."
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
                Railway/Administration (Locked)
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
                Office/Place of Issue (Locked)
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
                className="flex-1 text-sm border-gray-300 rounded-r px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white"
                placeholder="Name"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Designation <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                name="designation"
                list="sf5-emp-designations"
                value={formData.designation}
                onChange={handleChange}
                className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white"
              />
              <datalist id="sf5-emp-designations">
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
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Emp No.
              </label>
              <input
                type="text"
                name="empNo"
                value={formData.empNo}
                onChange={handleChange}
                className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white"
              />
            </div>
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
              placeholder="e.g. SSE/P/KIR"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Authority Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                name="signatureName"
                value={formData.signatureName}
                onChange={handleChange}
                className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white"
                placeholder="Name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Auth. Designation <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                name="authorityDesignation"
                list="sf5-da-designations"
                value={formData.authorityDesignation}
                onChange={handleChange}
                className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white"
                placeholder="Designation"
              />
              <datalist id="sf5-da-designations">
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

          <div>
            <label className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-2 mt-4">
              <span>Annexure I (Articles of Charge)</span>
              <button
                type="button"
                onClick={() => addListString('annexureIArticles')}
                className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded"
              >
                <Plus className="w-3 h-3" /> Add Article
              </button>
            </label>
            <div className="space-y-4">
              {formData.annexureIArticles.map((article, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex flex-col flex-1 gap-1">
                    <span className="text-xs font-semibold text-gray-400">ARTICLE OF CHARGE - {index + 1}</span>
                    <textarea
                      value={article}
                      onChange={(e) => updateListString('annexureIArticles', index, e.target.value)}
                      rows={10}
                      className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white"
                      placeholder={`Content for Article ${index + 1}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeListString('annexureIArticles', index)}
                    className="p-1.5 mt-5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded border border-transparent hover:border-red-200 h-fit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <label className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-1">
                <span>Annexure I & II (Footer / Conclusion)</span>
                <label className="flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isFooterEditable}
                    onChange={(e) => setIsFooterEditable(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-normal">Edit Manually</span>
                </label>
              </label>
              <textarea
                name="annexureIFooter"
                value={formData.annexureIFooter}
                onChange={handleChange}
                disabled={!isFooterEditable}
                rows={8}
                className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed text-justify leading-relaxed"
                placeholder="Concluding paragraph for Annexure I and II"
              />
              
              {!isFooterEditable && (
                <div className="mt-3 p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-lg">
                  <span className="block text-xs font-bold text-indigo-950 mb-2 uppercase tracking-wide">
                    Select Conduct Rules:
                  </span>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {[
                      "Rule No.3(1) (i)",
                      "Rule No.3(1) (ii)",
                      "Rule No.3(1) (iii)"
                    ].map((rule) => {
                      const isChecked = selectedRules.includes(rule);
                      return (
                        <label
                          key={rule}
                          className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md border border-gray-200 text-xs text-gray-800 cursor-pointer hover:bg-gray-50 shadow-sm transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedRules(selectedRules.filter((r) => r !== rule));
                              } else {
                                setSelectedRules([...selectedRules, rule]);
                              }
                            }}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span className="font-medium">{rule}</span>
                        </label>
                      );
                    })}
                  </div>

                  {/* Add rule form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customRuleInput}
                      onChange={(e) => setCustomRuleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (customRuleInput.trim() && !selectedRules.includes(customRuleInput.trim())) {
                            setSelectedRules([...selectedRules, customRuleInput.trim()]);
                            setCustomRuleInput("");
                          }
                        }
                      }}
                      placeholder="e.g. Rule No.3(2)"
                      className="flex-1 bg-white border border-gray-300 rounded-md px-3 py-1.5 text-xs focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customRuleInput.trim() && !selectedRules.includes(customRuleInput.trim())) {
                          setSelectedRules([...selectedRules, customRuleInput.trim()]);
                          setCustomRuleInput("");
                        }
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shadow-sm"
                    >
                      Add Rule
                    </button>
                  </div>

                  {/* Custom List */}
                  {selectedRules.filter(
                    (r) => !["Rule No.3(1) (i)", "Rule No.3(1) (ii)", "Rule No.3(1) (iii)"].includes(r)
                  ).length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-indigo-100">
                      <span className="block text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5">
                        Custom Added Rules:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedRules
                          .filter((r) => !["Rule No.3(1) (i)", "Rule No.3(1) (ii)", "Rule No.3(1) (iii)"].includes(r))
                          .map((rule) => (
                            <span
                              key={rule}
                              className="inline-flex items-center gap-1.5 bg-indigo-100/60 border border-indigo-200 px-2 py-0.5 rounded text-xs text-indigo-900 font-medium"
                            >
                              <span>{rule}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedRules(selectedRules.filter((r) => r !== rule))}
                                className="text-red-500 hover:text-red-700 font-extrabold focus:outline-none"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1 mt-4">
              Annexure II (Statement of Imputations)
            </label>
            <textarea
              name="annexureII"
              value={formData.annexureII}
              onChange={handleChange}
              rows={24}
              className="w-full text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white"
            />
          </div>

          <div>
            <label className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-2 mt-4">
              <span>Annexure III (List of Documents)</span>
              <button
                type="button"
                onClick={() => addListString('annexureIII')}
                className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded"
              >
                <Plus className="w-3 h-3" /> Add Document
              </button>
            </label>
            <div className="space-y-2">
              {formData.annexureIII.map((doc, index) => {
                let rudNo = "";
                let desc = doc;
                const match = doc.match(/^\[(.*?)\]\s*(.*)$/);
                if (match) {
                  rudNo = match[1];
                  desc = match[2];
                }

                return (
                  <div key={index} className="flex gap-2">
                    <span className="text-sm font-semibold text-gray-400 w-6 flex items-center justify-center shrink-0">{index + 1}.</span>
                    <input
                      type="text"
                      value={rudNo}
                      onChange={(e) => {
                        const newRud = e.target.value;
                        const newDoc = newRud ? `[${newRud}] ${desc}` : desc;
                        updateListString('annexureIII', index, newDoc);
                      }}
                      className="w-24 text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white"
                      placeholder="RUD No."
                    />
                    <input
                      type="text"
                      value={desc}
                      onChange={(e) => {
                        const newDesc = e.target.value;
                        const newDoc = rudNo ? `[${rudNo}] ${newDesc}` : newDesc;
                        updateListString('annexureIII', index, newDoc);
                      }}
                      className="flex-1 text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white"
                      placeholder="Document description"
                    />
                    <button
                      type="button"
                      onClick={() => removeListString('annexureIII', index)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded border border-transparent hover:border-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-2 mt-4">
              <span>Annexure IV (List of Witnesses)</span>
              <button
                type="button"
                onClick={() => addListString('annexureIV')}
                className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded"
              >
                <Plus className="w-3 h-3" /> Add Witness
              </button>
            </label>
            <div className="space-y-2">
              {formData.annexureIV.map((wit, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={wit}
                    onChange={(e) => updateListString('annexureIV', index, e.target.value)}
                    className="flex-1 text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white"
                    placeholder="Witness name / description"
                  />
                  <button
                    type="button"
                    onClick={() => removeListString('annexureIV', index)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded border border-transparent hover:border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center justify-between text-xs font-semibold text-gray-600 mb-2 mt-4">
              <span>Copies To</span>
              <button
                type="button"
                onClick={() => addListString('additionalCopies')}
                className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded"
              >
                <Plus className="w-3 h-3" /> Add Copy
              </button>
            </label>
            <div className="space-y-2">
              {formData.additionalCopies.map((copy, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={copy}
                    onChange={(e) => updateListString('additionalCopies', index, e.target.value)}
                    className="flex-1 text-sm border-gray-300 rounded px-2.5 py-1.5 focus:ring-indigo-500 focus:border-indigo-500 border bg-gray-50 focus:bg-white"
                    placeholder="Designation / Office"
                  />
                  <button
                    type="button"
                    onClick={() => removeListString('additionalCopies', index)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded border border-transparent hover:border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Preview Container */}
      <div className={`${showPreview ? 'flex-1' : 'hidden'} bg-gray-200 overflow-y-auto flex flex-col items-center py-8 px-4 overflow-x-hidden`}>
        <div 
          ref={componentRef}
          className="pdf-preview-wrapper text-black font-['Cambria',_'Times_New_Roman',_serif] text-[13pt] flex flex-col gap-8 print:gap-0 relative"
        >
          <RenderPrintOverlayWatermark watermark={printSettings.watermark} />
          <style>{`
            @media screen {
              .pdf-preview-wrapper {
                transform: scale(0.95);
                transform-origin: top center;
                margin-bottom: -5%;
              }
              @media (max-width: 1700px) {
                .pdf-preview-wrapper {
                  transform: scale(0.85);
                  margin-bottom: -15%;
                }
              }
              @media (max-width: 1500px) {
                .pdf-preview-wrapper {
                  transform: scale(0.75);
                  margin-bottom: -25%;
                }
              }
              @media (max-width: 1300px) {
                .pdf-preview-wrapper {
                  transform: scale(0.60);
                  margin-bottom: -40%;
                }
              }
              .print-page {
                box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
              }
            }
            @media print { 
              @page {
                size: A4;
                margin: 0.75in !important;
              }
              .page-break { page-break-after: always; display: block; break-after: page; } 
              .print-page { 
                min-height: 270mm; 
                padding: 0 !important;
                margin: 0 auto !important;
                width: 100% !important;
                max-width: 100% !important;
                box-sizing: border-box !important;
                box-shadow: none !important;
              }
              body { -webkit-print-color-adjust: exact; }
            }
          `}</style>
          
          {/* Page 1: Memorandum (Part 1) */}
          <div className="w-[210mm] min-h-[297mm] p-[25mm] bg-white print-page page-break relative" style={{ boxSizing: "border-box" }}>
            <div className="text-right font-bold mt-4 mb-2 underline">STANDARD FORM NO. 5</div>
            <div className="text-center font-bold mb-4 uppercase">
              STANDARD FORM OF CHARGE SHEET
            </div>
            <div className="text-center font-bold mb-6">
              [RULE 9 OF THE RAILWAY SERVANTS (DISCIPLINE AND APPEAL) RULES, 1968]
            </div>

            <div className="text-right font-bold mb-4">
              Office of the
              <br />
              {formData.placeOfIssue}
            </div>

            <div className="flex justify-between font-bold mb-4">
              <span>No. {formData.fileNo}</span>
              <span>Date: {formattedDate}</span>
            </div>

            <div className="text-center font-bold text-lg uppercase mb-6 tracking-wide">
              MEMORANDUM
            </div>

            <div className="flex text-justify leading-relaxed mb-6">
              <span className="w-8 shrink-0">1.</span>
              <div className="flex-1" dangerouslySetInnerHTML={{ __html: processedProposesInquiry }} />
            </div>

            <div className="flex text-justify leading-relaxed mb-6">
              <span className="w-8 shrink-0">2.</span>
              <div className="flex-1">
                <strong>{empString}</strong>, is hereby informed that if he so desires, he can inspect and take extract from the documents mentioned in the enclosed list of documents (Annexure III) at any time during office hour within ten days of receipt of this Memorandum.
              </div>
            </div>

            <div className="flex text-justify leading-relaxed mb-6">
              <span className="w-8 shrink-0">3.</span>
              <div className="flex-1">
                <strong>{empString}</strong> is further informed that he may, if so desires, take the assistance of any other Railway servant/a representative of a Railway Trade Union (who satisfies the requirements of rule 9 (13) of the Railway Servants (Discipline and Appeal) Rules, 1968 and Note I and or /Note 2 there under as the case may be) for inspecting the documents and assisting him in presenting his case before the Inquiring Authority in the event of an oral inquiry being held. For this purpose, he should nominate one or more persons in order of preference. Before nominating the assisting railway servant (s) or Railway Trade Union Representative (s), <strong>{empString}</strong> should obtain an undertaking from the nominee (s) that he (they) is (are) willing to assist him during the disciplinary proceedings. The undertaking should also contain the particulars of other cases (s) if any, in which the nominee (s) had already undertaken to assist and the undertaking should be furnished to the undersigned along with the nomination.
              </div>
            </div>

            <div className="flex text-justify leading-relaxed mb-6">
              <span className="w-8 shrink-0">4.</span>
              <div className="flex-1">
                <div dangerouslySetInnerHTML={{ __html: processedDirectedSubmit }} />
                {directedSubmit === "The said Railway servant is hereby directed to submit to the undersigned a written statement of his defense within ten days of the receipt of this memorandum." && (
                  <>
                    <div className="flex mt-2">
                      <span className="w-8 shrink-0 text-right pr-2">a)</span>
                      <span className="flex-1">to state whether he wishes to be heard in person, and </span>
                    </div>
                    <div className="flex mt-1">
                      <span className="w-8 shrink-0 text-right pr-2">b)</span>
                      <span className="flex-1">to furnish the names and addresses of the witnesses, if any, whom he wishes to call in support of her defence.</span>
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>

          {/* Page 2: Memorandum (Part 2) & Signature and Copies */}
          <div className="w-[210mm] min-h-[297mm] p-[25mm] bg-white print-page page-break relative" style={{ boxSizing: "border-box" }}>
            <div className="flex text-justify leading-relaxed mb-6">
              <span className="w-8 shrink-0">5.</span>
              <div className="flex-1">
                <strong>{empString}</strong>, is informed that an inquiry will be held only in respect of those articles of charge as are not admitted. He should, therefore, specifically admit or deny each article of charge.
              </div>
            </div>

            <div className="flex text-justify leading-relaxed mb-6">
              <span className="w-8 shrink-0">6.</span>
              <div className="flex-1">
                <strong>{empString}</strong>, is further informed that if he does not submit his written statement of defence within the period specified in para 4 or does not appear in person before the inquiring authority or otherwise fails or refuses to comply with the provisions of Rule 9 of the Railway Servants (Discipline and Appeal) Rules, 1968 or the orders/directions issued in pursuance of the said rule, the inquiring authority may hold the inquiry ex- parte.
              </div>
            </div>

            <div className="flex text-justify leading-relaxed mb-6">
              <span className="w-8 shrink-0">7.</span>
              <div className="flex-1">
                The attention of <strong>{empString}</strong>, is invited to Rule 20 of the Railway Services (Conduct) Rules, 1966 under which no railway servant shall bring or attempt to bring any political or other influence to bear upon any superior authority to further his interests in respect matters pertaining to his service under the Government. If any representation is received on his behalf from another person in respect of any matter dealt within these proceedings, it will be presumed that <strong>{empString}</strong> is aware of such a representation and that it has been made at his instance and action will be taken against him for violation of Rule 20 of the Railway Services (Conduct) Rules, 1966.
              </div>
            </div>
            
            <div className="flex text-justify leading-relaxed mb-12">
              <span className="w-8 shrink-0">8.</span>
              <div className="flex-1">
                The receipt of this Memorandum may be acknowledged.
              </div>
            </div>
            <div className="mt-8 mb-4 flex justify-end font-['Times_New_Roman',_serif]">
              <div className="text-left w-[380px] relative">
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
                  <span className="font-bold">Signature</span><span className="tracking-[2px] font-bold">................................</span>
                </div>
                <div className="flex items-start gap-1 mt-1 mb-1">
                  <span className="w-16 font-bold">Name –</span> 
                  <div className="text-center flex-1 font-bold">
                    {formData.signatureName ? `(${formData.signatureName})` : ''}
                  </div>
                </div>
                <div className="flex items-start gap-1">
                   <span className="w-16"></span>
                   <div className="text-center flex-1 font-bold break-words">
                     {formData.authorityDesignation ? formData.authorityDesignation : ''}
                   </div>
                </div>
                <div className="flex items-start gap-1">
                   <span className="w-16"></span>
                   <div className="text-center flex-1 font-bold text-[13pt] whitespace-nowrap">
                     (Designation of the Disciplinary Authority)
                   </div>
                </div>
              </div>
            </div>
            
            <div>
              <div className="mb-0">Encls: ANNEXURE-I, II, III, IV and RUD's</div>
              <div className="mb-0">To,</div>
              <div className="pl-6 mb-8 relative text-left whitespace-pre-wrap leading-relaxed">
                <span className="font-bold">{formData.salutation || '__________'} {formData.employeeName}{formData.designation && `, ${formData.designation}`}</span>,<br/>
                {formData.empNo && <span>(EMP No: {formData.empNo})</span>}{formData.empNo && <br/>}
                Under {formData.workingUnder}, {formData.railway}
              </div>

              <div className="font-bold mb-1 mt-8">Copy to:</div>
              <div className="leading-tight pl-6">
                  {formData.additionalCopies.map((copy, idx) => (
                     <div key={idx} className="flex">
                        <span className="w-8 shrink-0">{idx + 1}.</span>
                        <span className="flex-1 font-bold">{copy}</span>
                     </div>
                  ))}
              </div>
            </div>

            <div className="mt-8 mb-4 flex justify-end font-['Times_New_Roman',_serif]">
              <div className="text-left w-[380px] relative">
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
                  <span className="font-bold">Signature</span><span className="tracking-[2px] font-bold">................................</span>
                </div>
                <div className="flex items-start gap-1 mt-1 mb-1">
                  <span className="w-16 font-bold">Name –</span> 
                  <div className="text-center flex-1 font-bold">
                    {formData.signatureName ? `(${formData.signatureName})` : ''}
                  </div>
                </div>
                <div className="flex items-start gap-1">
                   <span className="w-16"></span>
                   <div className="text-center flex-1 font-bold break-words">
                     {formData.authorityDesignation ? formData.authorityDesignation : ''}
                   </div>
                </div>
                <div className="flex items-start gap-1">
                   <span className="w-16"></span>
                   <div className="text-center flex-1 font-bold text-[13pt] whitespace-nowrap">
                     (Designation of the Disciplinary Authority)
                   </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 text-center font-bold text-sm">Page 2 of 6</div>
          </div>

          {/* Page 3: Annexure I */}
          <div className="w-[210mm] min-h-[297mm] p-[25mm] bg-white print-page page-break relative" style={{ boxSizing: "border-box" }}>
            <div className="text-right font-bold mt-4 mb-8 underline tracking-wide">
              ANNEXURE-I
            </div>
            <div className="text-justify font-bold uppercase mb-8 leading-relaxed underline">
              STATEMENT OF ARTICLE(s) OF CHARGE OF MISCONDUCT FRAMED AGAINST {empString.toUpperCase()}
            </div>
            
            <div className="text-justify leading-relaxed whitespace-pre-wrap whitespace-pre-line mb-6">
              {formData.annexureIArticles.map((article, index) => (
                <div key={index} className="mb-4">
                  <div className="font-bold mb-2">ARTICLE OF CHARGE – {index + 1}</div>
                  <div>{article}</div>
                </div>
              ))}
            </div>

            <div className="text-justify leading-relaxed whitespace-pre-wrap whitespace-pre-line">
              {formData.annexureIFooter}
            </div>

            <div className="mt-8 mb-4 flex justify-end font-['Times_New_Roman',_serif]">
              <div className="text-left w-[380px]">
                <div className="flex items-center gap-1">
                  <span className="font-bold">Signature</span><span className="tracking-[2px] font-bold">................................</span>
                </div>
                <div className="flex items-start gap-1 mt-1 mb-1">
                  <span className="w-16 font-bold">Name –</span> 
                  <div className="text-center flex-1 font-bold">
                    {formData.signatureName ? `(${formData.signatureName})` : ''}
                  </div>
                </div>
                <div className="flex items-start gap-1">
                   <span className="w-16"></span>
                   <div className="text-center flex-1 font-bold break-words">
                     {formData.authorityDesignation ? formData.authorityDesignation : ''}
                   </div>
                </div>
                <div className="flex items-start gap-1">
                   <span className="w-16"></span>
                   <div className="text-center flex-1 font-bold text-[13pt] whitespace-nowrap">
                     (Designation of the Disciplinary Authority)
                   </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 text-center font-bold text-sm">Page 3 of 6</div>
          </div>

          {/* Page 4: Annexure II */}
          <div className="w-[210mm] min-h-[297mm] p-[25mm] bg-white print-page page-break relative" style={{ boxSizing: "border-box" }}>
            <div className="text-right font-bold mt-4 mb-8 underline tracking-wide">
              ANNEXURE-II
            </div>
            <div className="text-justify font-bold uppercase mb-8 leading-relaxed underline">
              STATEMENT OF IMPUTATION OF MIS-CONDUCT OR MIS-BEHAVIOUR IN SUPPORT OF ARTICLE(s) OF CHARGE FRAMED AGAINST {empString.toUpperCase()}
            </div>
            
            <div className="text-justify leading-relaxed whitespace-pre-wrap whitespace-pre-line mb-6">
              {formData.annexureII}
            </div>

            <div className="text-justify leading-relaxed whitespace-pre-wrap whitespace-pre-line">
              {formData.annexureIFooter}
            </div>

            <div className="mt-8 mb-4 flex justify-end font-['Times_New_Roman',_serif]">
              <div className="text-left w-[380px] relative">
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
                  <span className="font-bold">Signature</span><span className="tracking-[2px] font-bold">................................</span>
                </div>
                <div className="flex items-start gap-1 mt-1 mb-1">
                  <span className="w-16 font-bold">Name –</span> 
                  <div className="text-center flex-1 font-bold">
                    {formData.signatureName ? `(${formData.signatureName})` : ''}
                  </div>
                </div>
                <div className="flex items-start gap-1">
                   <span className="w-16"></span>
                   <div className="text-center flex-1 font-bold break-words">
                     {formData.authorityDesignation ? formData.authorityDesignation : ''}
                   </div>
                </div>
                <div className="flex items-start gap-1">
                   <span className="w-16"></span>
                   <div className="text-center flex-1 font-bold text-[13pt] whitespace-nowrap">
                     (Designation of the Disciplinary Authority)
                   </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 text-center font-bold text-sm">Page 4 of 6</div>
          </div>

          {/* Page 5: Annexure III */}
          <div className="w-[210mm] min-h-[297mm] p-[25mm] bg-white print-page page-break relative" style={{ boxSizing: "border-box" }}>
            <div className="text-right font-bold mt-4 mb-8 underline tracking-wide">
              ANNEXURE-III
            </div>
            <div className="text-justify font-bold uppercase mb-8 leading-relaxed underline">
              LIST OF DOCUMENTS BY WHICH ARTICLE OF CHARGE FRAMED AGAINST {empString.toUpperCase()} ARE PROPOSED TO BE SUSTAINED
            </div>
            
            <div className="mt-8">
              <table className="w-full border-collapse border border-black text-left font-['Cambria',_'Times_New_Roman',_serif] text-[13pt]">
                <thead>
                  <tr>
                    <th className="border border-black px-3 py-1 w-12 text-center font-bold leading-tight">SN.</th>
                    <th className="border border-black px-3 py-1 w-28 text-center font-bold leading-tight">RUD No.</th>
                    <th className="border border-black px-3 py-1 text-center font-bold leading-tight">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.annexureIII.map((doc, idx) => {
                    let rudNo = "";
                    let desc = doc;
                    const match = doc.match(/^\[(.*?)\]\s*(.*)$/);
                    if (match) {
                      rudNo = `[${match[1]}]`;
                      desc = match[2];
                    }
                    return (
                      <tr key={idx}>
                        <td className="border border-black px-3 py-1 text-center font-normal">{idx + 1}</td>
                        <td className="border border-black px-3 py-1 font-bold text-center">{rudNo}</td>
                        <td className="border border-black px-3 py-1 font-normal">{desc}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-8 mb-4 flex justify-end font-['Times_New_Roman',_serif]">
              <div className="text-left w-[380px] relative">
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
                  <span className="font-bold">Signature</span><span className="tracking-[2px] font-bold">................................</span>
                </div>
                <div className="flex items-start gap-1 mt-1 mb-1">
                  <span className="w-16 font-bold">Name –</span> 
                  <div className="text-center flex-1 font-bold">
                    {formData.signatureName ? `(${formData.signatureName})` : ''}
                  </div>
                </div>
                <div className="flex items-start gap-1">
                   <span className="w-16"></span>
                   <div className="text-center flex-1 font-bold break-words">
                     {formData.authorityDesignation ? formData.authorityDesignation : ''}
                   </div>
                </div>
                <div className="flex items-start gap-1">
                   <span className="w-16"></span>
                   <div className="text-center flex-1 font-bold text-[13pt] whitespace-nowrap">
                     (Designation of the Disciplinary Authority)
                   </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 text-center font-bold text-sm">Page 5 of 6</div>
          </div>

          {/* Page 6: Annexure IV */}
          <div className="w-[210mm] min-h-[297mm] p-[25mm] bg-white print-page page-break relative" style={{ boxSizing: "border-box" }}>
            <div className="text-right font-bold mt-4 mb-8 underline tracking-wide">
              ANNEXURE-IV
            </div>
            <div className="text-justify font-bold uppercase mb-8 leading-relaxed underline">
              LIST OF WITNESSES, BY WHICH THE ARTICLE OF CHARGE FRAMED AGAINST {empString.toUpperCase()} ARE PROPOSED TO BE SUSTAINED
            </div>
            
            <div className="text-left leading-relaxed space-y-1 pl-16 mt-16 font-bold">
              {formData.annexureIV.map((wit, idx) => (
                <div key={idx} className="flex">
                   <span className="w-8 shrink-0">{idx + 1}.</span>
                   <span className="flex-1">{wit}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 mb-4 flex justify-end font-['Times_New_Roman',_serif]">
              <div className="text-left w-[380px] relative">
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
                  <span className="font-bold">Signature</span><span className="tracking-[2px] font-bold">................................</span>
                </div>
                <div className="flex items-start gap-1 mt-1 mb-1">
                  <span className="w-16 font-bold">Name –</span> 
                  <div className="text-center flex-1 font-bold">
                    {formData.signatureName ? `(${formData.signatureName})` : ''}
                  </div>
                </div>
                <div className="flex items-start gap-1">
                   <span className="w-16"></span>
                   <div className="text-center flex-1 font-bold break-words">
                     {formData.authorityDesignation ? formData.authorityDesignation : ''}
                   </div>
                </div>
                <div className="flex items-start gap-1">
                   <span className="w-16"></span>
                   <div className="text-center flex-1 font-bold text-[13pt] whitespace-nowrap">
                     (Designation of the Disciplinary Authority)
                   </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-6 left-0 right-0 text-center font-bold text-sm">Page 6 of 6</div>
          </div>

        </div>
      </div>
    </div>
  );
}
