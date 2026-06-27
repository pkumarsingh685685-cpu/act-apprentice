import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { 
  Layers, 
  HelpCircle, 
  RotateCcw, 
  Settings, 
  Plus, 
  X, 
  ArrowLeft,
  Calendar,
  Sparkles,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "../store/useStore";

export interface DecisionPopupNode {
  question: string;
  advice?: string;
  regulatoryReference?: string;
  timelineNotice?: string;
  options: {
    text: string;
    target: string | null;
    infoText?: string;
    draftTemplate?: string;
  }[];
}

const DEFAULT_DAR_TREE: Record<string, DecisionPopupNode> = {
  start: {
    question: "Was SF-1 (Suspension Order) issued to the employee?",
    regulatoryReference: "Rule 4 of RS (D&A) Rules, 1968",
    options: [
      {
        text: "Yes, SF-1 was issued",
        target: "sf1_yes",
        infoText: "Suspension rules and periodic validation limits now apply."
      },
      {
        text: "No, Suspension was not issued",
        target: "sf1_no",
        infoText: "Evaluate standard charge-sheet procedures."
      }
    ]
  },
  sf1_yes: {
    question: "Whether the suspension period was more than 90 days or less than 90 days?",
    regulatoryReference: "Rule 5(5) of RS (D&A) Rules, 1968",
    options: [
      {
        text: "More than 90 Days",
        target: "sf1_more_90",
        infoText: "Statutory mandatory review parameters must be verified."
      },
      {
        text: "Less than 90 Days (or equal)",
        target: "sf1_less_90",
        infoText: "Review and charge-sheet warning timelines apply."
      }
    ]
  },
  sf1_more_90: {
    question: "Was the formal Suspension Review Board convened and order served before the 90-day expiry?",
    regulatoryReference: "Railway Board E(D&A) 2004/RG-6-8",
    timelineNotice: "90 Days Limit",
    options: [
      {
        text: "Yes, formal review committee convened with orders served",
        target: "sf1_reviewed",
        infoText: "Valid suspension. Evaluate review committee decisions."
      },
      {
        text: "No, formal review not held before 90-day expiration",
        target: "sf1_not_reviewed",
        infoText: "ALERT: Automatic suspension lapse rules will apply."
      }
    ]
  },
  sf1_reviewed: {
    question: "What is the formal decision of the Suspension Review Board?",
    options: [
      {
        text: "Extend Suspension (Up to further 180 days)",
        target: "sf1_extend",
        infoText: "Issue formal extension order specifying exact period."
      },
      {
        text: "Revoke Suspension and Reinstate",
        target: "sf1_revoke",
        infoText: "Issue revocation orders and return the employee to duty."
      }
    ]
  },
  sf1_not_reviewed: {
    question: "CRITICAL PROCEDURAL COMPLIANCE WARNING",
    advice: "WARNING: Under Rule 5(5) of RS (D&A) Rules, any suspension exceeding 90 days without a formal extension order being evaluated by the Suspension Review Committee and served to the employee automatically LAPSES. The employee is legally deemed reinstated with full rights. Reinstate immediately to prevent catastrophic legal/court audit failure.",
    regulatoryReference: "Rule 5(5) / Ajay Kumar Choudhary Mandate",
    options: [
      {
        text: "Acknowledge and proceed back to start",
        target: "start"
      }
    ]
  },
  sf1_extend: {
    question: "Guidelines for Extension of Suspension",
    advice: "1. The extension order can only be issued for up to 180 days at a single instance.\n2. Ensure the order is served before the expiry of the previous period.\n3. Formally review and adjust the Subsistence Allowance (can be increased or decreased by up to 50% under Rule 53 based on cooperation).",
    regulatoryReference: "Rule 5(5) & Rule 53 of RS (D&A) Rules",
    options: [
      {
        text: "Proceed to check charge-sheet status",
        target: "sf1_no"
      }
    ]
  },
  sf1_revoke: {
    question: "Suspension Revocation & Reinstatement Guidelines",
    advice: "Draft a formal Revocation Order under Form SF-4. Reinstate the employee to active service immediately. Record the period of absence in service history. The entitlement to full pay or a proportion of salary for the suspension period must be finalized after the completion of proceedings under Rule 54.",
    options: [
      {
        text: "Proceed to check charge-sheet status",
        target: "sf1_no"
      }
    ]
  },
  sf1_no: {
    question: "Is there an issue under Minor Chargesheet (SF-11) or Major Chargesheet (SF-5)?",
    regulatoryReference: "Rule 9 and Rule 11 of RS (D) Rules, 1968",
    options: [
      {
        text: "Major Chargesheet (SF-5) issued",
        target: "sf5_issued",
        infoText: "Major penalty inquiry rules and defense timelines apply."
      },
      {
        text: "Minor Chargesheet (SF-11) issued",
        target: "sf11_issued",
        infoText: "Minor penalty simplified procedures apply."
      }
    ]
  },
  sf5_issued: {
    question: "Was the employee given 10 days to submit their defense statement?",
    regulatoryReference: "Rule 9(7) of RS Rules",
    timelineNotice: "10 Days limit",
    options: [
      {
        text: "Yes, defense submitted within 10 days or extension given",
        target: "sf5_defense_submitted",
        infoText: "Check next step of personal hearing / inquiry board."
      },
      {
        text: "No defense statement received",
        target: "sf5_no_defense",
        infoText: "Inquiry officer can be appointed ex-parte."
      }
    ]
  },
  sf5_defense_submitted: {
    question: "Does the Disciplinary Authority accept the defense statement explanation?",
    options: [
      {
        text: "Yes, defense explanation accepted",
        target: "sf5_dropped",
        infoText: "The case is closed / charges dropped."
      },
      {
        text: "No, defense explanation not accepted",
        target: "sf5_appoint_io",
        infoText: "Mandatory appointment of Inquiry Officer (IO) and Presenting Officer (PO)."
      }
    ]
  },
  sf5_dropped: {
    question: "Case Dropped & Finalized",
    advice: "Issue a formal charge-sheet withdrawal / dropping order memo. No penalties will be written into employee record book.",
    options: [
      {
        text: "Return to Start",
        target: "start"
      }
    ]
  },
  sf5_appoint_io: {
    question: "Were IO and PO appointed using Form SF-7 and SF-8?",
    regulatoryReference: "Rule 9(2) and 9(3)",
    options: [
      {
        text: "Yes, Form SF-7/SF-8 served properly",
        target: "sf5_inquiry_active",
        infoText: "Inquiry proceedings active. Record milestones."
      },
      {
        text: "No, verbal or informal appointment only",
        target: "sf5_illegal_io",
        infoText: "WARNING: High legal vulnerability risk."
      }
    ]
  },
  sf5_illegal_io: {
    question: "VIOLATION ALERT: INFORMAL IO/PO APPOINTMENT",
    advice: "Any inquiry conducted without a formal written order under Form SF-7 or SF-8 signed by the competent Disciplinary Authority with copy served to delinquent employee is void ab initio. Correct this immediately. Re-issue formal orders and restart the hearing to prevent complete court rejection.",
    options: [
      {
        text: "Acknowledge and proceed",
        target: "sf5_appoint_io"
      }
    ]
  },
  sf5_no_defense: {
    question: "Establish Ex-Parte Inquiry Board",
    advice: "Since no defense statement is submitted, Disciplinary Authority should issue standard SF-7 appointing an Inquiry Officer with directive to conduct hearings. Ensure notices of each hearing date are served at registered residential address with proof of delivery.",
    options: [
      {
        text: "Proceed to Active Inquiry",
        target: "sf5_inquiry_active"
      }
    ]
  },
  sf5_inquiry_active: {
    question: "Is the final Inquiry Report submitted within the statutory limit of 180 days?",
    regulatoryReference: "Railway Board Circular RBE 156/2017",
    timelineNotice: "180 Days Limit",
    options: [
      {
        text: "Yes, report submitted within 180 days",
        target: "sf5_report_served",
        infoText: "Report served checklist now applies."
      },
      {
        text: "No, inquiry delayed beyond 180 days",
        target: "sf5_inquiry_delayed",
        infoText: "Analyze delay reasons and obtain competent extension."
      }
    ]
  },
  sf5_inquiry_delayed: {
    question: "Inquiry Delay Extension Rules",
    advice: "If inquiry is delayed beyond 180 days, the Inquiry Officer must submit a formal written request to Disciplinary Authority seeking a formal extension detailing reasonable causes. Extension must be granted in writing (RBE 156/2017 limits).",
    options: [
      {
        text: "Proceed to Report Served",
        target: "sf5_report_served"
      }
    ]
  },
  sf5_report_served: {
    question: "Was a copy of the Inquiry Report served to the charged employee for 15 days representation?",
    regulatoryReference: "Rule 12 of D&A Rules",
    timelineNotice: "15 Days Limit",
    options: [
      {
        text: "Yes, served and 15 days given",
        target: "sf5_final_order",
        infoText: "Finalize adjudication orders."
      }
    ]
  },
  sf5_final_order: {
    question: "Adjudication Final order instructions",
    advice: "After evaluating the Inquiry Report, representation of the employee, and personal hearing notes, pass a speaking multi-reasoned 'Speaking Order' specifying precisely what penalty is being imposed. Serve the speaking order along with a notice of right to appeal within 45 days.",
    options: [
      {
        text: "Complete case and restart",
        target: "start"
      }
    ]
  },
  sf11_issued: {
    question: "Was the employee given 10 days to submit representation for SF-11?",
    regulatoryReference: "Rule 11 of RS Rules",
    timelineNotice: "10 Days limit",
    options: [
      {
        text: "Yes, 10 days given",
        target: "sf11_decide",
        infoText: "Evaluate defense and pass a minor speaking order."
      }
    ]
  },
  sf11_decide: {
    question: "Decision on Minor Charge SF-11",
    advice: "1. If representation is accepted, drop charges.\n2. If not accepted, issue a Minor Penalty Speaking Order.\n3. Note: If the minor penalty includes withholding of increment which affects pension, or withholding for more than 3 years, a full formal inquiry becomes mandatory under Rule 11(2).",
    options: [
      {
        text: "Complete case and restart",
        target: "start"
      }
    ]
  }
};

export const DarProcedureHub: React.FC = () => {
  const isAdmin = useStore((state) => state.isAdmin);

  // Simple POPUP-Based Customizer & Advisor State
  const [darTree, setDarTree] = useState<Record<string, DecisionPopupNode>>(DEFAULT_DAR_TREE);
  const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false);
  const [isCustomizingMode, setIsCustomizingMode] = useState(false);
  const [currentPopupNodeId, setCurrentPopupNodeId] = useState<string>("start");
  const [popupHistory, setPopupHistory] = useState<string[]>([]);
  
  // Local option editing form state in the popup
  const [newOptText, setNewOptText] = useState("");
  const [newOptTarget, setNewOptTarget] = useState("");
  const [newOptInfo, setNewOptInfo] = useState("");
  const [inlineCreateId, setInlineCreateId] = useState("");
  const [inlineCreateQuestion, setInlineCreateQuestion] = useState("");

  // Real-time listener for DAR Unified Tree from Cloud
  useEffect(() => {
    const treeRef = doc(db, "settings", "dar_unified_tree");
    const unsubscribe = onSnapshot(treeRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && typeof data === "object" && Object.keys(data).length > 0) {
          setDarTree(data as Record<string, DecisionPopupNode>);
        }
      }
    }, (error) => {
      console.error("Error subscribing to dar_unified_tree:", error);
    });
    return () => unsubscribe();
  }, []);

  // Save custom D&AR Tree to Cloud
  const saveDarTreeToCloud = async (newTree: Record<string, DecisionPopupNode>) => {
    try {
      const treeRef = doc(db, "settings", "dar_unified_tree");
      await setDoc(treeRef, newTree);
      toast.success("D&AR Procedure updated successfully!");
    } catch (err: any) {
      console.error("Error saving dar_unified_tree to Cloud:", err);
      toast.error("Failed to sync D&AR updates with Cloud Database.");
    }
  };

  // Create empty step node
  const handleCreateNewStepInline = (newId: string, questionText: string) => {
    const cleanId = newId.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!cleanId) {
      toast.error("Invalid ID format");
      return null;
    }
    if (darTree[cleanId]) {
      toast.error(`Step "${cleanId}" already exists!`);
      return cleanId;
    }
    const updatedTree = {
      ...darTree,
      [cleanId]: {
        question: questionText.trim() || "New Custom Question Node Placeholder",
        options: [
          {
            text: "Return to Start",
            target: "start",
            infoText: "Navigating back to main menu starting node."
          }
        ]
      }
    };
    setDarTree(updatedTree);
    saveDarTreeToCloud(updatedTree);
    toast.success(`Created new step node "${cleanId}"!`);
    return cleanId;
  };

  // Add Option to existing node
  const handleAddOptionToNode = (nodeId: string, text: string, targetId: string, info: string) => {
    if (!text.trim()) {
      toast.error("Option text is required.");
      return;
    }
    const current = darTree[nodeId];
    if (!current) return;

    const updatedOptions = [
      ...current.options,
      {
        text: text.trim(),
        target: targetId ? targetId.trim() : "start",
        infoText: info.trim() || `Moving to ${targetId || "start"}`
      }
    ];

    const updatedTree = {
      ...darTree,
      [nodeId]: {
        ...current,
        options: updatedOptions
      }
    };
    setDarTree(updatedTree);
    saveDarTreeToCloud(updatedTree);
    toast.success("Added new choice to this step.");
  };

  // Delete Option from existing node
  const handleDeleteOptionFromNode = (nodeId: string, indexToRemove: number) => {
    const current = darTree[nodeId];
    if (!current) return;

    const updatedOptions = current.options.filter((_, idx) => idx !== indexToRemove);
    const updatedTree = {
      ...darTree,
      [nodeId]: {
        ...current,
        options: updatedOptions
      }
    };
    setDarTree(updatedTree);
    saveDarTreeToCloud(updatedTree);
    toast.success("Choice removed.");
  };

  // Update Node general fields
  const handleUpdateNodeFields = (nodeId: string, fields: Partial<DecisionPopupNode>) => {
    const current = darTree[nodeId];
    if (!current) return;

    const updatedTree = {
      ...darTree,
      [nodeId]: {
        ...current,
        ...fields
      }
    };
    setDarTree(updatedTree);
    saveDarTreeToCloud(updatedTree);
  };

  // Reset entire D&AR Tree
  const handleResetTreeToDefault = () => {
    if (window.confirm("Are you sure you want to reset the current D&AR advisor to default? All custom additions will be lost.")) {
      setDarTree(DEFAULT_DAR_TREE);
      saveDarTreeToCloud(DEFAULT_DAR_TREE);
      toast.info("Advisor reset to standard rules.");
    }
  };

  return (
    <div className="flex-1 flex flex-col p-5 gap-6 animate-fadeIn">
      {/* Beautiful Launch Panel */}
      <div className="max-w-4xl mx-auto w-full space-y-6 py-6 font-sans">
        <div className="bg-gradient-to-b from-slate-950 to-slate-900 border border-slate-800 p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-600/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-3 relative z-10 text-left">
            <div className="flex items-center gap-2">
              <span className="bg-violet-650/30 text-violet-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded border border-violet-500/20 tracking-wider">
                Railway Board Code Advisor
              </span>
              <span className="bg-emerald-600/20 text-emerald-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded border border-emerald-500/20 tracking-wider">
                Interactive Portal
              </span>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight uppercase">
              D&AR Interactive Procedure Hub
            </h3>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed uppercase tracking-wider font-semibold normal-case">
              An interactive, popup-based decision flow outlining Suspension, Major Penalties, and Minor Penalties. Simplify your administrative workflow, adjust questions, or append options on-the-fly.
            </p>
          </div>
          
          <div className="shrink-0 relative z-10 w-full md:w-auto text-center">
            <button
              type="button"
              onClick={() => {
                setCurrentPopupNodeId("start");
                setPopupHistory([]);
                setIsProcedureModalOpen(true);
              }}
              className="px-8 py-5 bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-550 hover:to-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer flex items-center justify-center gap-2.5 w-full md:w-auto shadow-violet-600/25"
            >
              <Layers className="w-5 h-5 animate-pulse text-indigo-300" />
              Launch Advisor Popup
            </button>
          </div>
        </div>

        {/* Informative Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="p-5 bg-slate-950/80 border border-slate-850 rounded-xl space-y-2">
            <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest font-mono">Workflow Mode</span>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Step-By-Step Flow</h4>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Click choices step-by-step to open fresh popups instantly. Backwards tracking helps review procedural mistakes.
            </p>
          </div>

          <div className="p-5 bg-slate-950/80 border border-slate-850 rounded-xl space-y-2">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest font-mono">Custom Additions</span>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Add your own rules</h4>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Simply activate customizer mode right inside the popup to modify text, delete options, or create entire new step nodes seamlessly.
            </p>
          </div>

          <div className="p-5 bg-slate-950/80 border border-slate-850 rounded-xl space-y-2">
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest font-mono">Safety Presets</span>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Reset and Restore</h4>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Easily reset any erroneous configuration changes back to the standard RS (D&A) Rules baseline instantly.
            </p>
          </div>
        </div>

        {/* Reset to default option panel */}
        {isAdmin && (
          <div className="p-4 bg-slate-950/45 border border-slate-850 rounded-xl flex items-center justify-between text-xs font-bold shrink-0">
            <div className="flex items-center gap-2 text-slate-400 uppercase tracking-wider text-[11px]">
              <Settings className="w-4 h-4 text-violet-500" />
              <span>D&AR Template Maintenance</span>
            </div>
            <button
              onClick={handleResetTreeToDefault}
              className="bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white px-3.5 py-1.5 rounded-lg text-[10px] font-black border border-slate-800 transition-all uppercase tracking-wider cursor-pointer"
            >
              Reset Tree to defaults
            </button>
          </div>
        )}
      </div>

      {/* POPUP ADVISOR MODAL */}
      {isProcedureModalOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            {/* Gradient Belt */}
            <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-700 h-1.5 w-full shrink-0" />
            
            {/* Top Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-850 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className="bg-violet-600/30 text-violet-350 text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider border border-violet-500/20">
                  Active Guide Workflow
                </span>
                {isAdmin && (
                  <button
                    onClick={() => setIsCustomizingMode(!isCustomizingMode)}
                    className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                      isCustomizingMode 
                        ? "bg-amber-600/20 text-amber-300 border border-amber-500/40" 
                        : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    <Settings className="w-3.5 h-3.5 animate-spin" />
                    {isCustomizingMode ? "Disable Customizer" : "🔧 Edit / Customise Steps"}
                  </button>
                )}
              </div>
              
              <button 
                type="button"
                onClick={() => {
                  setIsProcedureModalOpen(false);
                  setIsCustomizingMode(false);
                }}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white p-2 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Interactive Modal Body */}
            {(() => {
              const activeNode = darTree[currentPopupNodeId] || darTree["start"] || { question: "Placeholder Node", options: [] };
              return (
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
                  {/* Diagnostic Path tracker breadcrumbs */}
                  <div className="flex flex-wrap items-center gap-1.5 p-3 bg-slate-950 border border-slate-850 rounded-xl text-[10px] text-slate-300 font-mono">
                    <span className="font-extrabold text-slate-400 uppercase tracking-wider shrink-0 mr-1 animate-pulse">Path Trace:</span>
                    <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800/80 font-bold text-slate-300">Start</span>
                    {popupHistory.map((histId, idx) => {
                      const node = darTree[histId];
                      const label = node ? node.question.substring(0, 15) + "..." : histId;
                      return (
                        <div key={idx} className="flex items-center gap-1 shrink-0">
                          <span className="text-slate-655 font-bold">➔</span>
                          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800/60 font-semibold text-slate-300">
                            {label}
                          </span>
                        </div>
                      );
                    })}
                    <span className="text-slate-600 font-bold">➔</span>
                    <span className="text-amber-400 font-extrabold uppercase animate-pulse">Current</span>
                  </div>

                  {/* Question Details Block */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <span className="bg-violet-650/20 text-violet-300 border border-violet-500/20 rounded-xl w-7 h-7 flex items-center justify-center text-xs font-mono font-black shrink-0 shadow-inner">
                        Q
                      </span>
                      <div className="space-y-1.5 flex-1">
                        <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest block font-mono">
                          Step ID Node: {currentPopupNodeId.toUpperCase()}
                        </span>
                        
                        {isCustomizingMode ? (
                          <div className="space-y-3 p-4 bg-slate-950/65 border border-slate-850 rounded-xl animate-fadeIn font-sans">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">
                                Edit Question Text (English)
                              </label>
                              <input
                                type="text"
                                value={activeNode.question}
                                onChange={(e) => handleUpdateNodeFields(currentPopupNodeId, { question: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded text-xs text-white focus:ring-1 focus:ring-violet-500 focus:outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">
                                  Citation / Reference
                                </label>
                                <input
                                  type="text"
                                  value={activeNode.regulatoryReference || ""}
                                  placeholder="e.g. Rule 4 of RS Rules"
                                  onChange={(e) => handleUpdateNodeFields(currentPopupNodeId, { regulatoryReference: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded text-xs text-slate-300 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">
                                  Timeline Limit Notice
                                </label>
                                <input
                                  type="text"
                                  value={activeNode.timelineNotice || ""}
                                  placeholder="e.g. 90 Days Limit"
                                  onChange={(e) => handleUpdateNodeFields(currentPopupNodeId, { timelineNotice: e.target.value })}
                                  className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded text-xs text-slate-300 focus:ring-1 focus:ring-violet-500 focus:outline-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 tracking-wider">
                                Advisory/Advice Note Content
                              </label>
                              <textarea
                                value={activeNode.advice || ""}
                                placeholder="Write formal guidelines or warning notes..."
                                rows={3}
                                onChange={(e) => handleUpdateNodeFields(currentPopupNodeId, { advice: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-800 px-3 py-2 rounded text-xs text-slate-300 focus:ring-1 focus:ring-violet-500 focus:outline-none whitespace-pre-wrap"
                              />
                            </div>
                          </div>
                        ) : (
                          <h3 className="text-base font-black text-white font-sans tracking-tight leading-snug">
                            {activeNode.question}
                          </h3>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Display statutory warnings & advice */}
                  {!isCustomizingMode && (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        {activeNode.regulatoryReference && (
                          <span className="font-extrabold text-amber-500 text-[10px] uppercase tracking-wide flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-850">
                            <Layers className="w-3.5 h-3.5 shrink-0" />
                            Citation: {activeNode.regulatoryReference}
                          </span>
                        )}
                        {activeNode.timelineNotice && (
                          <span className="font-extrabold text-red-500 text-[10px] uppercase tracking-wide flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-850 animate-pulse">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            Limit: {activeNode.timelineNotice}
                          </span>
                        )}
                      </div>

                      {activeNode.advice && (
                        <div className="p-4 bg-slate-950/60 border border-slate-850 border-l-[3.5px] border-l-emerald-500 rounded-r-xl space-y-2 animate-fadeIn relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/5 rounded-full blur-2xl pointer-events-none" />
                          <div className="flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                              Statutory compliance recommendation
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed font-semibold whitespace-pre-line leading-normal">
                            {activeNode.advice}
                          </p>
                          
                          <button
                            type="button"
                            onClick={() => {
                              const cText = `D&AR ADVISOR NOTE\nNode: ${currentPopupNodeId.toUpperCase()}\nReference: ${activeNode.regulatoryReference || "Rules"}\nAdvice:\n${activeNode.advice}`;
                              navigator.clipboard.writeText(cText);
                              toast.success("Statutory advice text copied on board!");
                            }}
                            className="inline-flex bg-emerald-600/10 hover:bg-emerald-600 text-emerald-300 hover:text-white px-3 py-1 text-[9px] font-black uppercase rounded border border-emerald-500/20 tracking-wider transition-all mt-1.5 cursor-pointer"
                          >
                            Copy Advice text
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {/* Interactive Choices Grid */}
                  <div className="space-y-3.5 pt-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block font-mono">
                      Select the appropriate response below to progress:
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeNode.options && activeNode.options.map((opt, oIdx) => (
                        <div 
                          key={oIdx} 
                          className="relative group/opt"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (isCustomizingMode) return; // Disallow progression in customization
                              if (opt.target) {
                                setPopupHistory(prev => [...prev, currentPopupNodeId]);
                                setCurrentPopupNodeId(opt.target);
                                if (opt.infoText) {
                                  toast.info(opt.infoText);
                                }
                              } else {
                                toast.success("Case finalized! Return to root starting node.");
                                setCurrentPopupNodeId("start");
                                setPopupHistory([]);
                              }
                            }}
                            className={`w-full p-4 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-violet-500/50 rounded-xl text-left text-xs font-bold text-slate-200 hover:text-white transition-all flex items-start gap-3 shadow-md ${
                              isCustomizingMode ? "cursor-default animate-none" : "cursor-pointer hover:shadow-violet-600/5 hover:-translate-y-[1px]"
                            }`}
                          >
                            <div className="w-5 h-5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[9px] flex items-center justify-center font-bold shrink-0 mt-0.5">
                              {String.fromCharCode(65 + oIdx)}
                            </div>
                            <div className="space-y-0.5 pr-6">
                              <span className="text-slate-100 group-hover/opt:text-violet-300 transition-colors block uppercase font-extrabold leading-tight">
                                {opt.text}
                              </span>
                              {opt.infoText && (
                                <span className="block text-[10px] text-slate-400 font-medium normal-case">
                                  {opt.infoText}
                                </span>
                              )}
                              {isCustomizingMode && (
                                <span className="inline-block text-[9px] text-violet-400 font-mono mt-1">
                                  Target Node Link: {opt.target || "FINISH"}
                                </span>
                              )}
                            </div>
                          </button>

                          {isCustomizingMode && (
                            <button
                              type="button"
                              onClick={() => handleDeleteOptionFromNode(currentPopupNodeId, oIdx)}
                              className="absolute top-3 right-3 text-slate-500 hover:text-red-500 p-1.5 bg-slate-900/60 rounded border border-slate-850 cursor-pointer"
                              title="Remove this option"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Option Creator Panel */}
                  {isCustomizingMode && (
                    <div className="p-4 bg-slate-950/60 border border-dashed border-violet-500/30 rounded-xl space-y-4 animate-fadeIn">
                      <h4 className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                        <Plus className="w-4 h-4" />
                        Append Custom Option Choice / Branch Path
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 font-sans">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">
                            Choice Option Button Text (Rule description)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Yes, approved by DRM"
                            value={newOptText}
                            onChange={(e) => setNewOptText(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 px-3 py-1.5 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">
                            Target Next Step Node
                          </label>
                          <select
                            value={newOptTarget}
                            onChange={(e) => setNewOptTarget(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded text-xs select-none focus:outline-none"
                          >
                            <option value="">(End Workflow / Return to Root)</option>
                            <option value="CREATE_NEW_INLINE">🆕 + CREATE NEW CUSTOM QUESTION STEP...</option>
                            {Object.keys(darTree).map((nodeId) => (
                              <option key={nodeId} value={nodeId}>
                                Node: {nodeId.toUpperCase()} ({(darTree[nodeId]?.question || "").substring(0, 30)}...)
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Extra block if they chose to create a new key inline */}
                      {newOptTarget === "CREATE_NEW_INLINE" && (
                        <div className="p-3.5 bg-slate-900/60 border border-slate-850 rounded-lg space-y-3 animate-fadeIn">
                          <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest font-mono">Setup details for new step placeholder</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">
                                New Node Unique ID (lowercase_with_underscores)
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. sf5_reception"
                                value={inlineCreateId}
                                onChange={(e) => setInlineCreateId(e.target.value.replace(/[^a-zA-Z0-9_\-]/g, ""))}
                                className="w-full bg-slate-950 border border-slate-850 px-2.5 py-1 text-xs text-amber-300 font-mono focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-slate-500 uppercase mb-1">
                                What is the Question/Header?
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Has the defense brief been verified?"
                                value={inlineCreateQuestion}
                                onChange={(e) => setInlineCreateQuestion(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-850 px-2.5 py-1 text-xs text-white focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">
                          Optional advice tooltip info text
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Triggers legal inquiry board review sequence."
                          value={newOptInfo}
                          onChange={(e) => setNewOptInfo(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 px-3 py-1.5 rounded text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        />
                      </div>

                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => {
                            let finalTarget = newOptTarget;
                            if (newOptTarget === "CREATE_NEW_INLINE") {
                              if (!inlineCreateId.trim() || !inlineCreateQuestion.trim()) {
                                  toast.error("Please fill both ID and Question for the new step placeholder.");
                                return;
                              }
                              const created = handleCreateNewStepInline(inlineCreateId, inlineCreateQuestion);
                              if (!created) return;
                              finalTarget = created;
                            }

                            handleAddOptionToNode(
                              currentPopupNodeId,
                              newOptText,
                              finalTarget,
                              newOptInfo
                            );
                            
                            // Reset option builder
                            setNewOptText("");
                            setNewOptTarget("");
                            setNewOptInfo("");
                            setInlineCreateId("");
                            setInlineCreateQuestion("");
                          }}
                          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-black text-[10px] uppercase tracking-widest rounded-lg shadow-md transition-all cursor-pointer"
                        >
                          Add of Custom Option Choice
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Footer Controls */}
            <div className="p-4 bg-slate-950 border-t border-slate-850 flex items-center justify-between shrink-0 font-sans">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPopupNodeId("start");
                    setPopupHistory([]);
                    toast.info("Advisor path reset to root.");
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restart
                </button>
                {popupHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const last = popupHistory[popupHistory.length - 1];
                      setPopupHistory(prev => prev.slice(0, -1));
                      setCurrentPopupNodeId(last);
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-slate-350 hover:text-white border border-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsProcedureModalOpen(false);
                  setIsCustomizingMode(false);
                }}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Exit advisor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
