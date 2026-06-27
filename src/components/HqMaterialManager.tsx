import React, { useState, useEffect, useRef } from "react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  FileText, 
  CheckCircle, 
  FileSpreadsheet, 
  Upload, 
  Printer, 
  Trash2, 
  Save, 
  AlertCircle, 
  Layers, 
  HelpCircle, 
  ClipboardCheck, 
  Download,
  FolderOpen,
  Sparkles,
  User,
  Briefcase,
  Phone,
  Calendar,
  Layers2,
  Check,
  FileCheck,
  RotateCcw,
  RefreshCw,
  Settings,
  Plus,
  X,
  ArrowLeft
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useStore } from "../store/useStore";
import { motion, AnimatePresence } from "motion/react";
import { DarProcedureHub } from "./DarProcedureHub";

export interface ProcedureOption {
  id: string;
  text: string;
  nextStepId: string | null;
  infoText: string;
}

export interface ProcedureStep {
  id: string;
  question: string;
  options: ProcedureOption[];
}

const DEFAULT_PROCEDURE_STEPS: ProcedureStep[] = [
  {
    id: "s1",
    question: "Was SF-1 Issued?",
    options: [
      {
        id: "s1_o1",
        text: "Yes",
        nextStepId: "s2",
        infoText: "SF-1 (Suspension Order) has been issued. Proceed to validate the suspension period and record necessary details."
      },
      {
        id: "s1_o2",
        text: "No",
        nextStepId: null,
        infoText: "Since SF-1 is not issued, please proceed to standard chargesheet verification (SF-5/SF-11)."
      }
    ]
  },
  {
    id: "s2",
    question: "Period of SF-1",
    options: [
      {
        id: "s2_o1",
        text: "90 Days",
        nextStepId: null,
        infoText: "Suspension period is within the standard 90 days. Ensure completion of review or regular finalization within this timeline."
      },
      {
        id: "s2_o2",
        text: "Exceeding 90 Days",
        nextStepId: "s3_exceeding_90",
        infoText: "For suspension periods exceeding 90 days, a review board assessment is mandatory to justify further continuous extension."
      }
    ]
  },
  {
    id: "s3_exceeding_90",
    question: "Has the suspension/SF-1 been reviewed?",
    options: [
      {
        id: "s3_o1",
        text: "Reviewed (Yes)",
        nextStepId: null,
        infoText: "Review successfully registered. Maintain the formal record of review board and proceed with subsequent inquiry proceedings."
      },
      {
        id: "s3_o2",
        text: "Not Reviewed (No)",
        nextStepId: null,
        infoText: "CRITICAL COMPLIANCE REMINDER: Under Rule 53 of RS (D&A) Rules 1968, a suspension exceeding 90 days without a formal review is illegal. Initiate a formal review board order immediately."
      }
    ]
  }
];

interface DesignationPreset {
  name: string;
  group: string;
  payBand: string;
  gradePay: string;
  nextLowerPost: string;
  nextLowerPayBandAndGradePay: string;
}

const RAILWAY_DESIGNATION_PRESETS: DesignationPreset[] = [
  {
    name: "Senior Section Engineer (SSE)",
    group: "Group 'C'",
    payBand: "9300 - 34800",
    gradePay: "4600",
    nextLowerPost: "Junior Engineer (JE)",
    nextLowerPayBandAndGradePay: "9300 - 34800, GP: 4200"
  },
  {
    name: "Junior Engineer (JE)",
    group: "Group 'C'",
    payBand: "9300 - 34800",
    gradePay: "4200",
    nextLowerPost: "Senior Technician",
    nextLowerPayBandAndGradePay: "9300 - 34800, GP: 4200"
  },
  {
    name: "Loco Pilot (Mail/Express)",
    group: "Group 'C'",
    payBand: "9300 - 34800",
    gradePay: "4200",
    nextLowerPost: "Loco Pilot (Passenger)",
    nextLowerPayBandAndGradePay: "9300 - 34800, GP: 4200"
  },
  {
    name: "Loco Pilot (Passenger)",
    group: "Group 'C'",
    payBand: "9300 - 34800",
    gradePay: "4200",
    nextLowerPost: "Loco Pilot (Goods)",
    nextLowerPayBandAndGradePay: "9300 - 34800, GP: 4200"
  },
  {
    name: "Loco Pilot (Goods)",
    group: "Group 'C'",
    payBand: "9300 - 34800",
    gradePay: "4200",
    nextLowerPost: "Assistant Loco Pilot (ALP)",
    nextLowerPayBandAndGradePay: "5200 - 20200, GP: 1900"
  },
  {
    name: "Assistant Loco Pilot (ALP)",
    group: "Group 'C'",
    payBand: "5200 - 20200",
    gradePay: "1900",
    nextLowerPost: "Helper / Shunter",
    nextLowerPayBandAndGradePay: "5200 - 20200, GP: 1800"
  },
  {
    name: "Station Master (SM)",
    group: "Group 'C'",
    payBand: "9300 - 34800",
    gradePay: "4200",
    nextLowerPost: "Pointsman / Assistant Station Master",
    nextLowerPayBandAndGradePay: "5200 - 20200, GP: 1900"
  },
  {
    name: "Chief Office Superintendent (COS)",
    group: "Group 'C'",
    payBand: "9300 - 34800",
    gradePay: "4600",
    nextLowerPost: "Office Superintendent (OS)",
    nextLowerPayBandAndGradePay: "9300 - 34800, GP: 4200"
  },
  {
    name: "Office Superintendent (OS)",
    group: "Group 'C'",
    payBand: "9300 - 34800",
    gradePay: "4200",
    nextLowerPost: "Senior Clerk",
    nextLowerPayBandAndGradePay: "5200 - 20200, GP: 2800"
  },
  {
    name: "Senior Clerk",
    group: "Group 'C'",
    payBand: "5200 - 20200",
    gradePay: "2800",
    nextLowerPost: "Junior Clerk / Typist",
    nextLowerPayBandAndGradePay: "5200 - 20200, GP: 1900"
  },
  {
    name: "Junior Clerk",
    group: "Group 'C'",
    payBand: "5200 - 20200",
    gradePay: "1900",
    nextLowerPost: "Clerk-Trainee / Helper",
    nextLowerPayBandAndGradePay: "5200 - 20200, GP: 1800"
  },
  {
    name: "Senior Technician",
    group: "Group 'C'",
    payBand: "9300 - 34800",
    gradePay: "4200",
    nextLowerPost: "Technician Grade I",
    nextLowerPayBandAndGradePay: "5200 - 20200, GP: 2800"
  },
  {
    name: "Technician Grade I",
    group: "Group 'C'",
    payBand: "5200 - 20200",
    gradePay: "2800",
    nextLowerPost: "Technician Grade II",
    nextLowerPayBandAndGradePay: "5200 - 20200, GP: 2400"
  },
  {
    name: "Technician Grade II",
    group: "Group 'C'",
    payBand: "5200 - 20200",
    gradePay: "2400",
    nextLowerPost: "Technician Grade III",
    nextLowerPayBandAndGradePay: "5200 - 20200, GP: 1900"
  },
  {
    name: "Technician Grade III",
    group: "Group 'C'",
    payBand: "5200 - 20200",
    gradePay: "1900",
    nextLowerPost: "Helper / Assistant",
    nextLowerPayBandAndGradePay: "5200 - 20200, GP: 1800"
  },
  {
    name: "Helper / Assistant (S&T / Mechanical / Electrical)",
    group: "Group 'D'",
    payBand: "5200 - 20200",
    gradePay: "1800",
    nextLowerPost: "None / Trainee",
    nextLowerPayBandAndGradePay: "5200 - 20000, GP: 1800"
  },
  {
    name: "Track Maintainer Grade I",
    group: "Group 'C'",
    payBand: "5200 - 20200",
    gradePay: "2800",
    nextLowerPost: "Track Maintainer Grade II",
    nextLowerPayBandAndGradePay: "5200 - 20200, GP: 2400"
  },
  {
    name: "Track Maintainer Grade II",
    group: "Group 'C'",
    payBand: "5200 - 20200",
    gradePay: "2400",
    nextLowerPost: "Track Maintainer Grade III",
    nextLowerPayBandAndGradePay: "5200 - 20200, GP: 1900"
  },
  {
    name: "Track Maintainer Grade III",
    group: "Group 'C'",
    payBand: "5200 - 20200",
    gradePay: "1900",
    nextLowerPost: "Track Maintainer Grade IV",
    nextLowerPayBandAndGradePay: "5200 - 20200, GP: 1800"
  },
  {
    name: "Track Maintainer Grade IV",
    group: "Group 'D'",
    payBand: "5200 - 20200",
    gradePay: "1800",
    nextLowerPost: "None / Trainee",
    nextLowerPayBandAndGradePay: "5200 - 20200, GP: 1800"
  },
  {
    name: "Pointsman A",
    group: "Group 'C'",
    payBand: "5200 - 20200",
    gradePay: "1900",
    nextLowerPost: "Pointsman B",
    nextLowerPayBandAndGradePay: "5200 - 20200, GP: 1800"
  },
  {
    name: "Pointsman B",
    group: "Group 'D'",
    payBand: "5200 - 20200",
    gradePay: "1800",
    nextLowerPost: "None / Trainee",
    nextLowerPayBandAndGradePay: "5200 - 20200, GP: 1800"
  },
  {
    name: "Deputy Chief Ticket Inspector (Dy CTI)",
    group: "Group 'C'",
    payBand: "9300 - 34800",
    gradePay: "4600",
    nextLowerPost: "Ticket Examiner (TTE)",
    nextLowerPayBandAndGradePay: "9300 - 34800, GP: 4200"
  },
  {
    name: "Senior Ticket Examiner (Sr TE)",
    group: "Group 'C'",
    payBand: "5200 - 20200",
    gradePay: "2800",
    nextLowerPost: "Ticket Collector (TC)",
    nextLowerPayBandAndGradePay: "5200 - 20200, GP: 2000"
  },
  {
    name: "Ticket Collector / Examiner (TE)",
    group: "Group 'C'",
    payBand: "5200 - 20200",
    gradePay: "2000",
    nextLowerPost: "Helper / Commercial Porter",
    nextLowerPayBandAndGradePay: "5200 - 20200, GP: 1800"
  },
  {
    name: "Assistant Personnel Officer (APO)",
    group: "Group 'B'",
    payBand: "9300 - 34800",
    gradePay: "4800",
    nextLowerPost: "Chief Office Superintendent (COS)",
    nextLowerPayBandAndGradePay: "9300 - 34800, GP: 4600"
  },
  {
    name: "Divisional Personnel Officer (DPO)",
    group: "Group 'A'",
    payBand: "15600 - 39100",
    gradePay: "6600",
    nextLowerPost: "Assistant Personnel Officer (APO)",
    nextLowerPayBandAndGradePay: "9300 - 34800, GP: 4800"
  },
  {
    name: "Senior Divisional Personnel Officer (Sr. DPO)",
    group: "Group 'A'",
    payBand: "15600 - 39100",
    gradePay: "7600",
    nextLowerPost: "Divisional Personnel Officer (DPO)",
    nextLowerPayBandAndGradePay: "15600 - 39100, GP: 6600"
  },
  {
    name: "Senior Divisional Mechanical Engineer (Sr. DME)",
    group: "Group 'A'",
    payBand: "15600 - 39100",
    gradePay: "7600",
    nextLowerPost: "Divisional Mechanical Engineer (DME)",
    nextLowerPayBandAndGradePay: "15600 - 39100, GP: 6600"
  }
];

const COMMON_GRADE_PAYS = [
  { gp: "1800", level: "Level 1" },
  { gp: "1900", level: "Level 2" },
  { gp: "2000", level: "Level 3" },
  { gp: "2400", level: "Level 4" },
  { gp: "2800", level: "Level 5" },
  { gp: "4200", level: "Level 6" },
  { gp: "4600", level: "Level 7" },
  { gp: "4800", level: "Level 8" },
  { gp: "5400", level: "Level 9/10" },
  { gp: "6600", level: "Level 11" },
  { gp: "7600", level: "Level 12" },
  { gp: "8700", level: "Level 13" },
];

const APPOINTING_AUTHORITY_PRESETS = [
  {
    department: "General Administration / सामान्य प्रशासन",
    officers: [
      "General Manager (GM)",
      "Additional General Manager (AGM)",
      "Deputy General Manager (DGM)",
      "Divisional Railway Manager (DRM)",
      "Additional Divisional Railway Manager (ADRM)"
    ]
  },
  {
    department: "Personnel Department / कार्मिक विभाग",
    officers: [
      "Principal Chief Personnel Officer (PCPO)",
      "Chief Personnel Officer (CPO)",
      "Deputy Chief Personnel Officer (Dy.CPO)",
      "Senior Divisional Personnel Officer (Sr.DPO)",
      "Divisional Personnel Officer (DPO)",
      "Assistant Personnel Officer (APO)"
    ]
  },
  {
    department: "Mechanical Engineering / यांत्रिक विभाग",
    officers: [
      "Principal Chief Mechanical Engineer (PCME)",
      "Chief Works Manager (CWM)",
      "Senior Divisional Mechanical Engineer (Sr.DME)",
      "Divisional Mechanical Engineer (DME)",
      "Assistant Mechanical Engineer (AME)"
    ]
  },
  {
    department: "Civil Engineering / सिविल इंजीनियरिंग",
    officers: [
      "Principal Chief Engineer (PCE)",
      "Senior Divisional Engineer / Co-ordination (Sr.DEN/Co)",
      "Senior Divisional Engineer (Sr.DEN)",
      "Divisional Engineer (DEN)",
      "Assistant Divisional Engineer / Assistant Engineer (ADEN/AEN)"
    ]
  },
  {
    department: "Electrical Engineering / विद्युत विभाग",
    officers: [
      "Principal Chief Electrical Engineer (PCEE)",
      "Senior Divisional Electrical Engineer (Sr.DEE)",
      "Divisional Electrical Engineer (DEE)",
      "Assistant Electrical Engineer (AEE)"
    ]
  },
  {
    department: "Operating / परिचालन विभाग",
    officers: [
      "Principal Chief Operations Manager (PCOM)",
      "Chief Freight Transportation Manager (CFTM)",
      "Chief Passenger Transportation Manager (CPTM)",
      "Senior Divisional Operations Manager (Sr.DOM)",
      "Divisional Operations Manager (DOM)",
      "Assistant Operations Manager (AOM)"
    ]
  },
  {
    department: "Commercial / वाणिज्य विभाग",
    officers: [
      "Principal Chief Commercial Manager (PCCM)",
      "Senior Divisional Commercial Manager (Sr.DCM)",
      "Divisional Commercial Manager (DCM)",
      "Assistant Commercial Manager (ACM)"
    ]
  },
  {
    department: "Signal & Telecommunications (S&T) / संकेत एवं दूरसंचार",
    officers: [
      "Principal Chief Signal & Telecommunication Engineer (PCSTE)",
      "Senior Divisional Signal & Telecommunication Engineer (Sr.DSTE)",
      "Divisional Signal & Telecommunication Engineer (DSTE)",
      "Assistant Signal & Telecommunication Engineer (ASTE)"
    ]
  },
  {
    department: "Safety / सुरक्षा (संरक्षा) विभाग",
    officers: [
      "Principal Chief Safety Officer (PCSO)",
      "Senior Divisional Safety Officer (Sr.DSO)"
    ]
  },
  {
    department: "Stores / Materials Management / सामग्री प्रबंधन",
    officers: [
      "Principal Chief Materials Manager (PCMM)",
      "Deputy Chief Materials Manager (Dy.CMM)",
      "Senior Divisional Materials Manager (Sr.DMM)",
      "Assistant Materials Manager (AMM)"
    ]
  },
  {
    department: "Accounts / लेखा विभाग",
    officers: [
      "Principal Financial Adviser (PFA)",
      "Deputy Financial Adviser & Chief Accounts Officer (Dy.FA&CAO)",
      "Divisional Finance Manager (DFM)",
      "Assistant Divisional Finance Manager (ADFM)"
    ]
  },
  {
    department: "Medical / चिकित्सा विभाग",
    officers: [
      "Principal Chief Medical Director (PCMD)",
      "Chief Medical Superintendent (CMS)",
      "Senior Divisional Medical Officer (Sr.DMO)",
      "Assistant Divisional Medical Officer (ADMO)"
    ]
  },
  {
    department: "RPF Security / रेलवे सुरक्षा बल",
    officers: [
      "Principal Chief Security Commissioner (PCSC)",
      "Senior Divisional Security Commissioner (Sr.DSC)",
      "Assistant Security Commissioner (ASC)"
    ]
  }
];

interface DecisionPopupNode {
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

const DAR_UNIFIED_TREE: Record<string, DecisionPopupNode> = {
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
    regulatoryReference: "Rule 54 of RS (D&A) Rules / Form SF-4",
    options: [
      {
        text: "Proceed to check charge-sheet status",
        target: "sf1_no"
      }
    ]
  },
  sf1_less_90: {
    question: "Is there a formal charge-sheet (SF-5 or SF-11) issued within the suspension period?",
    options: [
      {
        text: "Yes, charge-sheet is issued",
        target: "sf1_no",
        infoText: "Trace standard procedural guidelines for the respective charge-sheet."
      },
      {
        text: "No charge-sheet issued yet",
        target: "sf1_cs_no",
        infoText: "Prompt actions are required to avoid illegal suspension retention."
      }
    ]
  },
  sf1_cs_no: {
    question: "Statutory Limitation on Suspension without Charge-sheet",
    advice: "IMPORTANT: A suspension should not normally exceed 90 days. If a charge-sheet has not been served yet, prepare and serve the charge-sheet ASAP. Review committee must still evaluate the extension of suspension before day 90 even if a charge-sheet is not ready.",
    regulatoryReference: "Board Directive E(D&A) 2015",
    options: [
      {
        text: "Acknowledge and go to Charge-sheet evaluation",
        target: "sf1_no"
      }
    ]
  },
  sf1_no: {
    question: "Which form or charge-sheet was issued to the employee?",
    options: [
      {
        text: "SF-11 (Minor Penalty Charge-sheet)",
        target: "sf11_start",
        infoText: "Opens 10-day summary procedure tracker."
      },
      {
        text: "SF-5 (Major Penalty Charge-sheet)",
        target: "sf5_start",
        infoText: "Opens standard 4-Annexure inquiry procedure tracker."
      }
    ]
  },
  sf11_start: {
    question: "Did the Charged Official (CO) submit their explanation within the statutory 10-day period?",
    regulatoryReference: "Rule 11 of RS (D&A) Rules, 1968",
    timelineNotice: "10 Days Limit",
    options: [
      {
        text: "Yes, explanation submitted within 10 days",
        target: "sf11_explanation_submitted",
        infoText: "Proceed to evaluate defense justification."
      },
      {
        text: "No explanation submitted / Period expired",
        target: "sf11_no_explanation",
        infoText: "Evaluate and process ex-parte finalized orders."
      }
    ]
  },
  sf11_explanation_submitted: {
    question: "Does the Disciplinary Authority (DA) accept the written explanation?",
    options: [
      {
        text: "Yes, accept explanation and close / exonerated fully",
        target: "sf11_exonerate",
        infoText: "Draw and serve formal dropping orders."
      },
      {
        text: "No, decides to impose an authorized minor penalty",
        target: "sf11_impose_penalty",
        infoText: "Verify minor penalties list."
      },
      {
        text: "No, decides to hold a formal Inquiry under Rule 11(2)",
        target: "sf11_hold_inquiry",
        infoText: "Required when complexity persists."
      }
    ]
  },
  sf11_no_explanation: {
    question: "The 10-day response window has expired. What is the DA's action?",
    options: [
      {
        text: "Send a final 3-day reminder warning notice",
        target: "sf11_reminder",
        infoText: "Insulates administration against natural justice violations."
      },
      {
        text: "Proceed to evaluate and finalize based on other available records",
        target: "sf11_impose_penalty",
        infoText: "DA has power to finalize ex-parte if time expires."
      }
    ]
  },
  sf11_reminder: {
    question: "Serving Final 3-Day Warning Notice",
    advice: "Draft and serve a final 3-day reminder notice. State explicitly: 'If no representation is received within 3 days, it will be presumed that you have no defense to offer and speaking orders will be formulated based on prosecution records alone.' Keep physical delivery proof / signature.",
    options: [
      {
        text: "Reminder Expired -> Proceed to evaluation and penalty",
        target: "sf11_impose_penalty"
      }
    ]
  },
  sf11_exonerate: {
    question: "Exoneration and Closing Orders (SF-11)",
    advice: "Formulate a formal Memorandum dropping the SF-11 charges. Forward copies to the employee, Personnel section, and file in Service history. All seniority, increment benefits, and APAR grading remain completely unaffected.",
    options: [
      {
        text: "Finish and Return to Start",
        target: "start"
      }
    ]
  },
  sf11_impose_penalty: {
    question: "Select the minor penalty to be imposed:",
    regulatoryReference: "Rule 6 of RS (D&A) Rules",
    options: [
      {
        text: "Censure (Formal Reprimand)",
        target: "sf11_censure",
        infoText: "Lightest formal warning recorded in confidential books."
      },
      {
        text: "Withholding of Promotion for a specified period",
        target: "sf11_promotion",
        infoText: "Blocks selection/suitability list for the period."
      },
      {
        text: "Recovery of financial loss from salary",
        target: "sf11_recovery",
        infoText: "Deductions cannot exceed 1/3rd of basic salary."
      },
      {
        text: "Withholding of Increment (Non-cumulative)",
        target: "sf11_increment",
        infoText: "Stops next increment for duration without lifetime loss."
      }
    ]
  },
  sf11_censure: {
    question: "Steps to finalize Censure",
    advice: "Censure is a formal record in APAR. It affects promotion selections for 1 year. Draft a complete Speaking Order discussing the charges, representation, and DA's decision. Issue with standard docket.",
    options: [
      {
        text: "Finish and Return to Start",
        target: "start"
      }
    ]
  },
  sf11_promotion: {
    question: "Withholding of Promotion Guidelines",
    advice: "Specify the exact withholding period in months/years. Note in the confidential service register. Make sure no overlapping penalty exists.",
    options: [
      {
        text: "Finish and Return to Start",
        target: "start"
      }
    ]
  },
  sf11_recovery: {
    question: "Pecuniary Recovery of loss from salary",
    advice: "Establish the exact pecuniary loss in writing. The Speaking Order must prove how the employee's direct negligence led to this financial loss. Monthly recovery installments must never exceed 1/3rd of their basic salary.",
    options: [
      {
        text: "Finish and Return to Start",
        target: "start"
      }
    ]
  },
  sf11_increment: {
    question: "Withholding of Increments (Non-cumulative)",
    advice: "The order must clarify: (1) Number of increments, (2) Withholding duration (e.g., 2 years), (3) Explicitly confirm that it is non-cumulative (no permanent lifetime reduction of Basic salary scale).",
    options: [
      {
        text: "Finish and Return to Start",
        target: "start"
      }
    ]
  },
  sf11_hold_inquiry: {
    question: "Compulsory formal Inquiry under Rule 11(2)",
    advice: "An inquiry is statutorily mandatory under Rule 11(2) if the proposed minor penalty: (1) involves withholding increments with cumulative effect (which acts as Major Penalty), or (2) affects pension benefits, or (3) withholding of increments for more than 3 years. Formally order the appointment of IO/PO. Proceeding to major penalty track.",
    options: [
      {
        text: "Transfer to Major Charge-sheet (SF-5) track",
        target: "sf5_start"
      }
    ]
  },
  sf5_start: {
    question: "Is the SF-5 Major Penalty Charge-sheet prepared correctly with all 4 Annexures and served physically with signature proof?",
    regulatoryReference: "Rule 9 of RS (D&A) Rules, 1968",
    options: [
      {
        text: "Yes, fully compliant in 4 Annexures",
        target: "sf5_defense_period",
        infoText: "Good! Ensure signature of competent Disciplinary Authority."
      },
      {
        text: "No, there are draft typos / vague charges / missing lists",
        target: "sf5_defective_advice",
        infoText: "Defective charge-sheets are quashed easily by courts/tribunals."
      }
    ]
  },
  sf5_defective_advice: {
    question: "Correction Advice for Vague/Defective Charge-sheet",
    advice: "Under Indian Railways laws, a vague or generalized charge-sheet without descriptive dates, locations, or details is void. Correct immediately. Ensure Annexure-I (Article of charges), Annexure-II (Statement of Imputations), Annexure-III (Relied-upon documents), and Annexure-IV (Witness list) are fully prepared and signed. Ensure the Disciplinary Authority holds appropriate grade power relative to CO.",
    regulatoryReference: "Board Circular E(D&A) 2015/RG-6",
    options: [
      {
        text: "Correction applied -> Return to SF-5",
        target: "sf5_start"
      }
    ]
  },
  sf5_defense_period: {
    question: "Did the Charged Official (CO) submit their written statement of defense within the statutory 10-day period?",
    timelineNotice: "10 Days limit",
    options: [
      {
        text: "Yes, written defense submitted",
        target: "sf5_defense_admits",
        infoText: "Evaluate admissions or denials."
      },
      {
        text: "No response submitted / Window expired",
        target: "sf5_no_defense",
        infoText: "Choose whether to extend or hold inquiry directly."
      }
    ]
  },
  sf5_defense_admits: {
    question: "Does the Charged Official admit all major charges unconditionally in their response?",
    options: [
      {
        text: "Yes, Admits all charges unconditionally",
        target: "sf5_direct_penalty_speaking_order",
        infoText: "Direct Speaking Order can be formulated without inquiry."
      },
      {
        text: "No, Denies / contests the charges",
        target: "sf5_appoint_io_po",
        infoText: "Inquiry must be instituted."
      }
    ]
  },
  sf5_direct_penalty_speaking_order: {
    question: "Direct Speaking Order guidelines on admission",
    advice: "Since charges are fully admitted in writing, no inquiry is required. The DA must review the admission, check if any personal hearing was requested, and draft a detailed 'Speaking Order' imposing eligible major/minor penalty.",
    options: [
      {
        text: "Finish and Return to Start",
        target: "start"
      }
    ]
  },
  sf5_no_defense: {
    question: "The 10-day period expired without response. Choose course:",
    options: [
      {
        text: "Grant formal final extension (7 to 10 days)",
        target: "sf5_grant_extension",
        infoText: "Protects case from court challenges on natural justice."
      },
      {
        text: "Proceed to appoint IO and PO immediately",
        target: "sf5_appoint_io_po",
        infoText: "The administration defaults CO and begins inquiry."
      }
    ]
  },
  sf5_grant_extension: {
    question: "Serving final extension warning",
    advice: "Grant up to 7 or 10 days and serve physically through speed post with signature proof. If they still default, proceed to appoint IO and PO immediately.",
    options: [
      {
        text: "Extension Period Expired -> Go to Inquiry Appoint",
        target: "sf5_appoint_io_po"
      }
    ]
  },
  sf5_appoint_io_po: {
    question: "Have you formally issued appointment orders for Inquiry Officer (SF-7) and Presenting Officer (SF-8)?",
    regulatoryReference: "Form SF-7 and SF-8",
    options: [
      {
        text: "Yes, SF-7 and SF-8 are issued",
        target: "sf5_inquiry_active",
        infoText: "Inquiry proceedings can formally start."
      },
      {
        text: "No, not issued or pending",
        target: "sf5_appointment_needed",
        infoText: "Inquiry cannot proceed without appointment records."
      }
    ]
  },
  sf5_appointment_needed: {
    question: "Issuing formal appointments",
    advice: "Appoint the IO via SF-7. Ensure the IO is senior or equal in grade to the CO. Appoint the PO via SF-8. Forward copies of the order alongside prosecution items to both officers and the CO.",
    options: [
      {
        text: "Orders Issued -> Start Inquiry",
        target: "sf5_inquiry_active"
      }
    ]
  },
  sf5_inquiry_active: {
    question: "Assess the progress of the Inquiry proceedings:",
    options: [
      {
        text: "Regular hearings are held under timeline",
        target: "sf5_hearings",
        infoText: "Inquiry is active. Daily order sheets are records."
      },
      {
        text: "CO is non-cooperating / absent continuously",
        target: "sf5_exparte",
        infoText: "The IO must take caution to proceed ex-parte safely."
      }
    ]
  },
  sf5_hearings: {
    question: "Has the Inquiry Officer submitted the final Inquiry Report?",
    options: [
      {
        text: "Yes, report submitted to DA",
        target: "sf5_report_submitted",
        infoText: "Verify the core findings."
      },
      {
        text: "No, hearings are ongoing",
        target: "sf5_pending_hearings",
        infoText: "Track the 180-day guidelines limit."
      }
    ]
  },
  sf5_pending_hearings: {
    question: "Review Ongoing Hearings",
    advice: "The Inquiry Officer must finalize the proceedings within 180 days from appointment. If delayed, a written extension with valid reasons must be obtained from the DA in writing.",
    options: [
      {
        text: "Back to tracking",
        target: "sf5_inquiry_active"
      }
    ]
  },
  sf5_exparte: {
    question: "Correct Ex-Parte Inquiry Process",
    advice: "The IO must send 3 clear written reminders. If CO still non-cooperates, IO must record in the daily order-sheets to proceed ex-parte. The PO must present prosecution documents. The report will be compiled by IO solely based on available evidence.",
    options: [
      {
        text: "Report Drafted & Submitted",
        target: "sf5_report_submitted"
      }
    ]
  },
  sf5_report_submitted: {
    question: "What is the finding of the final Inquiry report?",
    options: [
      {
        text: "Charges Proved (Fully or Partially)",
        target: "sf5_report_proved",
        infoText: "Rule mandates serving report to CO prior to deciding penalty."
      },
      {
        text: "Charges NOT Proved / Exoneration suggested",
        target: "sf5_report_not_proved",
        infoText: "DA must evaluate if they agree with exoneration."
      }
    ]
  },
  sf5_report_proved: {
    question: "Has the Inquiry Report been served to CO for their final 15-day representation?",
    regulatoryReference: "Rule 10 of RS (D&A) Rules",
    timelineNotice: "15 Days Limit",
    options: [
      {
        text: "Yes, served copy with 15-day representation window",
        target: "sf5_served_15_days",
        infoText: "Proceed to pass speaking order after receiving representation."
      },
      {
        text: "No, passed penalty speaking order directly",
        target: "sf5_rule_violation_alert",
        infoText: "Grave compliance error."
      }
    ]
  },
  sf5_rule_violation_alert: {
    question: "FATAL COMPLIANCE ERROR: Non-service of Inquiry Report",
    advice: "STOP! Passing a penalty order without formally serving the IO's report to the Charged Official is a fatal error under Rule 10. Any penalty will be set aside instantly by courts/CAT. Serve the report IMMEDIATELY and grant exactly 15 days.",
    options: [
      {
        text: "Report served now -> Proceed to Speaking Order",
        target: "sf5_served_15_days"
      }
    ]
  },
  sf5_served_15_days: {
    question: "Final Step: Speaking and Penalty Order Formulation",
    advice: "Review the defense representation. Write a comprehensive 'Speaking Order' discussing each charge article, discussions, defense arguments, DA's counter-arguments, and conclusions. Impose an authorized major/minor penalty. Issue with formal docket.",
    regulatoryReference: "Rule 10 Speaking Order requirements",
    options: [
      {
        text: "Finish and Return to Start",
        target: "start"
      }
    ]
  },
  sf5_report_not_proved: {
    question: "Does the Disciplinary Authority agree with the Exoneration finding?",
    options: [
      {
        text: "Yes, DA agrees with 'Not Proved'",
        target: "sf5_drop_charges",
        infoText: "Case is dropped."
      },
      {
        text: "No, DA disagrees",
        target: "sf5_da_disagree",
        infoText: "A disagreement memo must be drafted and served."
      }
    ]
  },
  sf5_da_disagree: {
    question: "Serving Disagreement Memo",
    advice: "The DA must compile a detailed 'Disagreement Memo' pointing to exactly which prosecution evidence proves guilt. Serve both the IO report and Disagreement Memo to the CO, granting 15 days to respond. Evaluate response before final speaking order.",
    options: [
      {
        text: "Memo Served -> Proceed to Speaking Order",
        target: "sf5_served_15_days"
      }
    ]
  },
  sf5_drop_charges: {
    question: "Dropping of Major Charges",
    advice: "Formally close the case file. Process reinstatement or return employee to full status. Restore seniority, seniority incentives, and APAR marks.",
    options: [
      {
        text: "Finish",
        target: "start"
      }
    ]
  }
};

const POPUP_DECISION_TREES: Record<"sf5" | "sf11" | "sf1", Record<string, DecisionPopupNode>> = {
  sf5: {
    start: {
      question: "Is the SF-5 Major Penalty Charge-sheet prepared correctly with all 4 Annexures?",
      regulatoryReference: "Rule 9 of RS (D&A) Rules, 1968",
      timelineNotice: "Preparation phase",
      options: [
        {
          text: "Yes, fully compliant",
          target: "defense_period",
          infoText: "Great! Ensure signature of competent Disciplinary Authority is affixed."
        },
        {
          text: "No, there are spelling/drafting mistakes",
          target: "defective_advice",
          infoText: "Defective chargesheets will lead to cancellation of proceedings in courts."
        }
      ]
    },
    defective_advice: {
      question: "Rectification Advice for SF-5",
      advice: "CRITICAL: Under Indian Railways Rules, a vague charge-sheet is legally void. Ensure Annexure I (Articles of Charge), Annexure II (Imputation of misconduct), Annexure III (List of Documents), and Annexure IV (List of Witnesses) are complete, specific, and detailed with times/dates of occurrence. Check that the Disciplinary Authority is of appropriate rank relative to the Charged Official (CO).",
      regulatoryReference: "Board Circular E(D&A) 2015/RG-6",
      options: [
        {
          text: "Go Back / Corrections Applied",
          target: "start"
        }
      ]
    },
    defense_period: {
      question: "Did the Charged Official (CO) submit their written statement of defense within 10 days?",
      regulatoryReference: "Rule 9(9)(a)(i) of RS (D&A) Rules",
      timelineNotice: "10 Days limit",
      options: [
        {
          text: "Yes, submitted within timeline",
          target: "defense_admits",
          infoText: "Proceed to evaluate whether charges are admitted or denied."
        },
        {
          text: "No, failed to submit/Expired",
          target: "no_defense_options",
          infoText: "You must choose whether to extend or go ahead with ex-parte."
        }
      ]
    },
    defense_admits: {
      question: "Does the Charged Official admit all charges unconditionally in their response?",
      regulatoryReference: "Rule 9(9)(a)(ii) of RS (D&A) Rules",
      options: [
        {
          text: "Yes, Admits Charges",
          target: "direct_penalty_speaking_order",
          infoText: "A direct speaking order can be passed without holding a lengthy inquiry."
        },
        {
          text: "No, Denies Charges",
          target: "appoint_io_po",
          infoText: "An inquiry must be instituted to find the absolute truth."
        }
      ]
    },
    direct_penalty_speaking_order: {
      question: "Steps for direct penalty finalization",
      advice: "Since charges are admitted, Disciplinary Authority of appropriate rank must record findings on each charge article, check if any personal hearing request is pending, and directly formulate a reasoned Speaking Order imposing an eligible penalty based on the Schedule of Powers.",
      regulatoryReference: "Rule 9(10) of RS (D&A) Rules",
      options: [
        {
          text: "Reset / Finish Flow",
          target: "start"
        }
      ]
    },
    no_defense_options: {
      question: "The 10-day window has passed. What is the administration action?",
      regulatoryReference: "Rule 9 guidelines",
      options: [
        {
          text: "Grant formal final extension",
          target: "grant_extension",
          infoText: "Provides defense shield to administration against non-compliance blames."
        },
        {
          text: "Proceed to hold inquiry immediately",
          target: "appoint_io_po",
          infoText: "The administration can start appointing IO and PO directly due to default."
        }
      ]
    },
    grant_extension: {
      question: "Extension Rules Compliance",
      advice: "Grant a final written extension of up to 7 or 10 days. Serve the notice through a registered speed post or physical dak with signature proof. If they still default, proceed directly to the inquiry.",
      options: [
        {
          text: "Extension Expired -> Go to Inquiry",
          target: "appoint_io_po"
        }
      ]
    },
    appoint_io_po: {
      question: "Have you formally appointed the Inquiry Officer (IO) and Presenting Officer (PO)?",
      regulatoryReference: "Rule 9(2) and SF-7/SF-8 forms",
      options: [
        {
          text: "Yes, issued Form SF-7 (IO) & SF-8 (PO)",
          target: "inquiry_proceedings",
          infoText: "The inquiry can formally commence hearings."
        },
        {
          text: "No, not appointed yet",
          target: "io_po_advise",
          infoText: "Appointment orders must be issued prior to any inquiry proceedings."
        }
      ]
    },
    io_po_advise: {
      question: "Appointment of IO (SF-7) & PO (SF-8)",
      advice: "Draft Form SF-7 to appoint the Inquiry Officer (who must be senior or equivalent to CO) and Form SF-8 to appoint the Presenting Officer. Forward these copies alongside documents to both officers and the Charged Official.",
      options: [
        {
          text: "Orders Issued -> Proceed",
          target: "inquiry_proceedings"
        }
      ]
    },
    inquiry_proceedings: {
      question: "Assess the status of the inquiry proceedings:",
      regulatoryReference: "Railway Board directive E(D&A) 2018/RG-6",
      timelineNotice: "Max 180 Days",
      options: [
        {
          text: "Regular Hearings on-track",
          target: "inquiry_report",
          infoText: "Hearings are held. Daily order sheets are being signed."
        },
        {
          text: "CO is non-cooperating / absent continuously",
          target: "exparte",
          infoText: "The inquiry officer faces default timeline pressures."
        }
      ]
    },
    exparte: {
      question: "How to conduct an Ex-Parte Inquiry correctly?",
      advice: "The Inquiry Officer must send 3 clear registered reminders/summons. If CO still non-cooperates, IO must record a formal resolution in the daily order-sheets to proceed ex-parte. The PO must present prosecution documents & oral witness statements. IO will compose the report solely from written evidence.",
      regulatoryReference: "Rule 9(23) of RS (D&A) Rules",
      options: [
        {
          text: "Draft Report -> Go to Findings",
          target: "inquiry_report"
        }
      ]
    },
    inquiry_report: {
      question: "The Inquiry Officer has submitted the report. What is the finding?",
      regulatoryReference: "Rule 9(25) report details",
      options: [
        {
          text: "Charges Proved (Fully or Partially)",
          target: "report_served_co",
          infoText: "Rule mandates serving report to CO prior to deciding penalty."
        },
        {
          text: "Charges Not Proved / No misconduct found",
          target: "exonerated_da_agreement",
          infoText: "Requires Disciplinary Authority to evaluate reasons."
        }
      ]
    },
    report_served_co: {
      question: "Has the Inquiry Report been served to CO for final 15-day representation?",
      regulatoryReference: "Rule 10 of RS (D&A) Rules",
      timelineNotice: "15 Days mandatory limit",
      options: [
        {
          text: "Yes, served with 15-day response window",
          target: "final_speaking_order",
          infoText: "Proceed to pass final speaking order after receiving representation."
        },
        {
          text: "No, or passed order directly",
          target: "rule_violation_warn",
          infoText: "Passing penalty without giving representation window is illegal!"
        }
      ]
    },
    rule_violation_warn: {
      question: "CRITICAL PROCEDURAL DANGER: Service of Report",
      advice: "STOP! Passing a penalty speaking order without formally serving the IO's report to the Charged Official (CO) is a fatal error. Any resultant penalty will be quashed by CAT/courts instantly. Serve the report IMMEDIATELY and grant exactly 15 days.",
      options: [
        {
          text: "Report Served -> Proceed to Speak Order",
          target: "final_speaking_order"
        }
      ]
    },
    exonerated_da_agreement: {
      question: "Does the Disciplinary Authority agree with the Exoneration finding?",
      regulatoryReference: "Rule 10(2)",
      options: [
        {
          text: "Yes, DA agrees with 'Not Proved'",
          target: "final_drop",
          infoText: "Case is dropped."
        },
        {
          text: "No, DA disagrees (DA believes CO is guilty)",
          target: "disagreement_memo",
          infoText: "DA must draft a disagreement memo pointing specifically to proof."
        }
      ]
    },
    disagreement_memo: {
      question: "Disagreement note procedure",
      advice: "The DA must draft a detailed Disagreement Memo. Point out exactly which prosecution witness or document proves the guilt neglected by IO. Serve this disagreement memo AND the IO's report to the CO, letting them make a 15-day representation. Then evaluate the defense response before passing order.",
      regulatoryReference: "Rule 10(2)(b) rules",
      options: [
        {
          text: "Memo served to CO -> Proceed to Speaking Order",
          target: "final_speaking_order"
        }
      ]
    },
    final_drop: {
      question: "Case Dropped - Exoneration Successful",
      advice: "Formal dropping order issued. Inform the personnel section to remove suspension details, restore seniority benefits, release withheld salaries, and update the Service Register correctly. The APAR file should declare 'Exonerated fully'.",
      options: [
        {
          text: "Finish and Return to Start",
          target: "start"
        }
      ]
    },
    final_speaking_order: {
      question: "Final Step: Speaking and Penalty Order Formulations",
      advice: "Review the defense representation carefully. Write a comprehensive 'Speaking Order' discussing each charge article, discussions, defense arguments, DA's counter-arguments, and specific conclusions. Impose an authorized major/minor penalty complying with your power level. Issue with formal docket.",
      regulatoryReference: "Rule 10 Speak Order requirement",
      options: [
        {
          text: "Finish and Return to Start",
          target: "start"
        }
      ]
    }
  },
  sf11: {
    start: {
      question: "Is there any need to hold a formal inquiry under Rule 11(2) for Minor Penalty (SF-11)?",
      regulatoryReference: "Rule 11 of RS (D&A) Rules",
      timelineNotice: "Preliminary Phase",
      options: [
        {
          text: "No, proceed with standard summary procedure",
          target: "issue_charge",
          infoText: "Standard SF-11 is fastest and requires only 10 days defense time."
        },
        {
          text: "Yes, requires inquiry (e.g. cumulative effect or pension implications)",
          target: "convert_major",
          infoText: "If minor penalty affects pension, holding inquiry is statutory."
        }
      ]
    },
    convert_major: {
      question: "Inquiry under Minor Penalty (Rule 11(2))",
      advice: "Under Rule 11(2), a formal major-penalty-style inquiry is MANDATORY if the proposed minor penalty: (1) involves withholding increments with cumulative effect, or (2) withholding increments which will adversely affect the pension, or (3) withholding of promotion for a substantial period. Use SF-11(b) to order/appoint IO and PO.",
      regulatoryReference: "Rule 11(2) RS Rules",
      options: [
        {
          text: "Convert & Appoint IO -> Go to SF-5",
          target: "start"
        }
      ]
    },
    issue_charge: {
      question: "Has the Charged Official submitted their explanation within the 10-day window?",
      timelineNotice: "10 Days statutory response",
      options: [
        {
          text: "Yes, explanation received",
          target: "da_evaluation",
          infoText: "Proceed to evaluate defense arguments."
        },
        {
          text: "No response received within 10 days",
          target: "no_defense",
          infoText: "Administration must choose reminder or ex-parte finalisation."
        }
      ]
    },
    no_defense: {
      question: "How to finalize the case when no reply is submitted?",
      options: [
        {
          text: "Send a final 3-day reminder",
          target: "reminder_advice",
          infoText: "Avoids complaints of rule violation in courts."
        },
        {
          text: "Proceed to pass order on available records",
          target: "da_evaluation",
          infoText: "DA has power to finalize ex-parte if time expires."
        }
      ]
    },
    reminder_advice: {
      question: "Final Warning Guidelines",
      advice: "Send a final 3-day reminder stating explicitly: 'If no representation is received within 3 days, it will be presumed you have nothing to say and speaking orders will be passed ex-parte based on prosecution records alone.' Keep delivery acknowledgement.",
      options: [
        {
          text: "Reminder Expired -> Proceed to Evaluation",
          target: "da_evaluation"
        }
      ]
    },
    da_evaluation: {
      question: "Is the Disciplinary Authority satisfied with the employee's justification?",
      options: [
        {
          text: "Yes, explanation is satisfactory",
          target: "drop_charges",
          infoText: "The case can be closed immediately."
        },
        {
          text: "No, charges are verified from records",
          target: "select_penalty",
          infoText: "Proceed to choose an appropriate minor penalty."
        }
      ]
    },
    drop_charges: {
      question: "Case Dropped - Minor Charges Cancelled",
      advice: "Formulate a formal memorandum dropping the SF-11 charges. Forward copies to the Charged Official, Personnel Officer, and store in the employee's confidential file. This leaves no negative impact on increments or promotion.",
      options: [
        {
          text: "Return to Start",
          target: "start"
        }
      ]
    },
    select_penalty: {
      question: "Select Minor Penalty based on Intensity:",
      options: [
        {
          text: "Censure (Formal Reprimand)",
          target: "penalty_censure",
          infoText: "The lightest formal penalty under Rule 6."
        },
        {
          text: "Withholding of Promotion",
          target: "penalty_promotion",
          infoText: "Withheld for a specific period of months/years."
        },
        {
          text: "Recovery of financial loss",
          target: "penalty_loss",
          infoText: "Recovers exact loss from salary in installments."
        },
        {
          text: "Withholding of Increment (Non-cumulative)",
          target: "penalty_increment",
          infoText: "Stops increment for 1 to 3 years without impact on future value."
        }
      ]
    },
    penalty_censure: {
      question: "Censure - Finalization steps",
      advice: "Censure is recorded in APAR and affects immediate promotional selections for up to 1 year. Write a brief speaking order summarizing the charges, defense, and the DA's findings. Issue the penalty in standard docket.",
      options: [
        {
          text: "Finish Flow",
          target: "start"
        }
      ]
    },
    penalty_promotion: {
      question: "Withholding of Promotion - Finalization",
      advice: "Specify the exact duration of withholding promotion. Record the penalty in the Service Book. Make sure the penalty period matches other ongoing actions to prevent overlapping errors.",
      options: [
        {
          text: "Finish Flow",
          target: "start"
        }
      ]
    },
    penalty_loss: {
      question: "Recovery of Financial Loss - Guidelines",
      advice: "Calculate the exact amount of pecuniary loss. Specify the monthly installment limit (never exceed 1/3rd of basic salary). Speaking order must document how the negligence directly led to the financial loss.",
      options: [
        {
          text: "Finish Flow",
          target: "start"
        }
      ]
    },
    penalty_increment: {
      question: "Withholding of Increments - Rules",
      advice: "Must state: (1) Number of increments withheld, (2) Withholding duration (e.g. 2 years), (3) Confirm whether cumulative (Major) or non-cumulative. Specify if it will affect next future increments.",
      options: [
        {
          text: "Finish Flow",
          target: "start"
        }
      ]
    }
  },
  sf1: {
    start: {
      question: "What is the primary reason for considering Suspension of the employee?",
      regulatoryReference: "Rule 4 of RS (D&A) Rules, 1968",
      options: [
        {
          text: "Disciplinary inquiry contemplated or active",
          target: "pending_inquiry",
          infoText: "Standard suspension requires active review and justification."
        },
        {
          text: "Criminal charges / Custody",
          target: "detention",
          infoText: "Involves statutory deemed suspension under Rule 4(2)."
        }
      ]
    },
    pending_inquiry: {
      question: "Has the formal Suspension order (Form SF-1) been issued?",
      options: [
        {
          text: "Yes, SF-1 issued with signatures",
          target: "time_monitoring",
          infoText: "Success. Monitor ninety day review deadlines closely."
        },
        {
          text: "No, not issued yet",
          target: "issue_advice",
          infoText: "Suspension cannot begin without a written, signed SF-1 order."
        }
      ]
    },
    issue_advice: {
      question: "Drafting Suspension Order (SF-1)",
      advice: "The Disciplinary Authority must draft a formal written order in Form SF-1. It must specify the reasons (charges of grave misconduct or threat to witness). The draft must be served personally to the employee. Secure receipt signature immediately.",
      options: [
        {
          text: "SF-1 Issued -> Start Monitoring",
          target: "time_monitoring"
        }
      ]
    },
    detention: {
      question: "Has the employee been detained in police/judicial custody exceeding 48 hours?",
      options: [
        {
          text: "Yes, exceeded 48 hours",
          target: "deemed_suspension",
          infoText: "Deemed suspension rules apply automatically under Rule 4(2)."
        },
        {
          text: "No, released under 48 hours",
          target: "pending_inquiry",
          infoText: "Not automatic. DA must evaluate whether suspension is required on merits."
        }
      ]
    },
    deemed_suspension: {
      question: "Mandatory Deemed Suspension (SF-2)",
      advice: "CRITICAL: Under Rule 4(2), the employee is DEEMED suspended from the moment of detention. The DA has no discretion. Draft and issue Form SF-2 immediately, dating the suspension starting from the exact date of arrest/custody.",
      regulatoryReference: "Form SF-2 / Rule 4(2) RS rules",
      options: [
        {
          text: "SF-2 Issued -> Go to Monitoring",
          target: "time_monitoring"
        }
      ]
    },
    time_monitoring: {
      question: "Are you approaching the critical 90-day review limit of suspension?",
      timelineNotice: "90 Days absolute review constraint",
      options: [
        {
          text: "Yes, nearing 90 days",
          target: "review_board",
          infoText: "Holding a Review Board before ninety days is a high legal mandate!"
        },
        {
          text: "No, currently early phase",
          target: "subsistence",
          infoText: "Ensure monthly subsistence allowance is structured correctly."
        }
      ]
    },
    review_board: {
      question: "Has the Suspension Review Board been convened before 90 days expired?",
      regulatoryReference: "Board rule E(D&A) 2004/RG-6-8",
      options: [
        {
          text: "Yes, review recorded",
          target: "extension_status",
          infoText: "Evaluate the extension or revocation order of the board."
        },
        {
          text: "No, review not held",
          target: "illegal_unconstitutional",
          infoText: "Grave compliance error."
        }
      ]
    },
    illegal_unconstitutional: {
      question: "CRITICAL COMPLIANCE THREAT: Automatic Lapse of Suspension",
      advice: "WARNING: Under the Ajay Kumar Choudhary (Supreme Court) mandate & Board directives, any suspension exceeding 90 days WITHOUT a review board evaluation + extension speaking order automatically LAPSES. The employee is legally reinstated. Restore them immediately to service to prevent court cost orders.",
      options: [
        {
          text: "Reinstate employee -> Go to revocation",
          target: "reinstate"
        }
      ]
    },
    extension_status: {
      question: "What is the formal decision of the Review Board?",
      options: [
        {
          text: "Extend Suspension",
          target: "extend_period",
          infoText: "Board recommends further extension with recorded reasons."
        },
        {
          text: "Revoke Suspension",
          target: "reinstate",
          infoText: "Employee can return to duty."
        }
      ]
    },
    extend_period: {
      question: "Extension guidelines and limitations",
      advice: "Ensure: (1) Extension cannot exceed 180 days at a single instance. (2) Issue a formal extension speaking order prior to day 90. (3) Formally review subsistence allowance (increase/decrease under Rule 53) in the same order.",
      options: [
        {
          text: "Go to Subsistence Allowance Check",
          target: "subsistence"
        }
      ]
    },
    reinstate: {
      question: "Revocation of Suspension (SF-4)",
      advice: "Issue Form SF-4 (Order of Revocation of Suspension) immediate. In the final speaking order, DA must decide how the suspension period will be treated (e.g. treated as duty, or as special leave) depending on whether the CO is eventually found guilty or clean.",
      options: [
        {
          text: "Finish and Return",
          target: "start"
        }
      ]
    },
    subsistence: {
      question: "Subsistence Allowance Review: Is the CO receiving correct subsistence (50% pay + DA)?",
      regulatoryReference: "Rule 53 of Fundamental Rules / Rule 2043 IREC",
      options: [
        {
          text: "Yes, 50% paid correctly",
          target: "subsistence_review",
          infoText: "Monitor performance and delays after 3 months."
        },
        {
          text: "No, calculation errors or delay",
          target: "subsistence_rectify",
          infoText: "Withholding subsistence is a fatal constitutional breach."
        }
      ]
    },
    subsistence_rectify: {
      question: "Subsistence payment mandatory instructions",
      advice: "Failure to pay subsistence allowance violates Article 21 (Right to Livelihood). Courts will stay the active inquiry proceedings until pay is clear. Release the allowances immediately. Ensure employee submits non-employment certificate monthly.",
      options: [
        {
          text: "Rectified -> Proceed",
          target: "subsistence_review"
        }
      ]
    },
    subsistence_review: {
      question: "Is the query delay after 3 months attributable to the employee?",
      options: [
        {
          text: "Yes, delay is due to employee's non-cooperation",
          target: "subsistence_co",
          infoText: "The administration can reduce the allowance."
        },
        {
          text: "No, delay is due to administrative slow-pace",
          target: "subsistence_admin",
          infoText: "The administration can increase the allowance."
        }
      ]
    },
    subsistence_co: {
      question: "Reduction in Subsistence Allowance",
      advice: "The subsistence allowance can be REDUCED by up to 50% of the initial amount (bringing it to 25% of basic salary) if the delay is due to the non-cooperation or actions of the Charged Official. Issue a reasoned order detailing the delay reasons.",
      options: [
        {
          text: "Finish Flow",
          target: "start"
        }
      ]
    },
    subsistence_admin: {
      question: "Increase in Subsistence Allowance",
      advice: "The subsistence allowance can be INCREASED by up to 50% of the initial amount (bringing it to 75% of basic salary) if the delay in inquiry finalization is attributable entirely to the administration or Inquiry Officer. Issue a formal order.",
      options: [
        {
          text: "Finish Flow",
          target: "start"
        }
      ]
    }
  }
};

// Standard preset for DAR File Requirements (Part 1 - 3D material requirements list)
interface RequirementItem {
  id: string;
  title: string;
  category: "preliminary" | "charge-sheet" | "inquiry" | "finalization";
  description: string;
  isMandatory: boolean;
  docReference: string;
  tips: string;
}

const DAR_REQUIREMENTS: RequirementItem[] = [
  {
    id: "req1",
    title: "Preliminary Inquiry Report",
    category: "preliminary",
    description: "Inquiry report conducted prior to the formal charge-sheet, detailing statements of joint-witnesses, site inspections, and initial facts.",
    isMandatory: false,
    docReference: "Railway Board Order E(D&A) 2012/RG-6-1",
    tips: "Ensure joint-witness signatures are clear on every page. Helpful to establish the prima facie case."
  },
  {
    id: "req2",
    title: "Competent Authority's Approval",
    category: "preliminary",
    description: "Written note-sheet approval from the competent Disciplinary Authority to formally initiate the disciplinary proceedings.",
    isMandatory: true,
    docReference: "Rule 9 of RS (D&A) Rules 1968",
    tips: "Confirm that the administrator giving approval possesses the delegated powers for the concerned employee grade."
  },
  {
    id: "req3",
    title: "Major (SF-5) or Minor (SF-11) Charge Sheet",
    category: "charge-sheet",
    description: "The formal charge memorandum itself, accompanied by exhaustive Annexures I, II, III, and IV.",
    isMandatory: true,
    docReference: "Rule 9(9) & Rule 11 of RS (D&A) Rules",
    tips: "Annexure I: Articles of Charges, Annexure II: Imputations, Annexure III: List of Documents, Annexure IV: List of Witnesses."
  },
  {
    id: "req4",
    title: "Proof of Delivery / Acknowledgement",
    category: "charge-sheet",
    description: "Clear acknowledgement signed with date by the Charged Employee (CO), or registered post receipt with delivery confirmation.",
    isMandatory: true,
    docReference: "Rule 9(12) of RS (D&A) Rules 1968",
    tips: "If the employee refuses to accept, prepare a refusal memo signed by at least two witnesses present."
  },
  {
    id: "req5",
    title: "Written Statement of Defense (Reply)",
    category: "charge-sheet",
    description: "The formal answer/representation submitted by the Charged Officer against the allegations in the charge sheet within 10-15 days.",
    isMandatory: true,
    docReference: "Rule 11(1)(b) / Rule 9(13)",
    tips: "If no reply is received within limits, record a formal reminder and note-sheet entry to process the case ex-parte or appoint IO."
  },
  {
    id: "req6",
    title: "Order Appointing Inquiry Officer (SF-7)",
    category: "inquiry",
    description: "Form SF-7 signed by the Disciplinary Authority appointing the IO to conduct a regular inquiry on the denied charges.",
    isMandatory: false,
    docReference: "Rule 9(14) of RS (D&A) Rules 1968",
    tips: "Mandatory only if charges are denied or defense brief is unsatisfactory, and a major penalty is contemplated."
  },
  {
    id: "req7",
    title: "Order Appointing Presenting Officer (SF-8)",
    category: "inquiry",
    description: "Form SF-8 appointing the representative to present the case in support of the disciplinary articles on behalf of the DA.",
    isMandatory: false,
    docReference: "Rule 9(15) of RS (D&A) Rules 1968",
    tips: "Ideally appointed in complex technical cases or vigilance investigations to assist the Inquiry Officer."
  },
  {
    id: "req8",
    title: "Daily Order Sheets of Inquiry",
    category: "inquiry",
    description: "Progressive sheets detailing every single hearing session date, attendees, and occurrences signed in original by IO, PO, and CO.",
    isMandatory: false,
    docReference: "Railway DAR Handbooks",
    tips: "Verify that daily sheets show dates sequentially without gaps, and contains acknowledgements if CO was absent."
  },
  {
    id: "req9",
    title: "Inquiry Officer's Findings & Report",
    category: "inquiry",
    description: "The complete, detailed, analytical report of the Inquiry Officer holding each article of charge as Proved, Part-Proved, or Not Proved.",
    isMandatory: false,
    docReference: "Rule 9(25) of RS (D&A) Rules 1968",
    tips: "The IO must remain unbiased and evaluate evidence rationally. The report must not suggest any specific penalty."
  },
  {
    id: "req10",
    title: "Inquiry Report Served to CO & Reply",
    category: "finalization",
    description: "The DA must send the IO's report to the CO for their final representation within 15 days before any penalty is evaluated.",
    isMandatory: false,
    docReference: "Rule 10 of RS (D&A) Rules 1968",
    tips: "This is a key statutory requirement. Non-serving of IO report vitiates the complete DAR process (Supreme Court Union of India vs Mohd. Ramzan Khan)."
  },
  {
    id: "req11",
    title: "Final Order / Penalty Notice (NIP)",
    category: "finalization",
    description: "Form of Notice of Imposition of Penalty (NIP) signed by DA containing reasoned, structured, and speaking orders.",
    isMandatory: true,
    docReference: "Rule 12 & Rule 14 of RS (D&A) Rules",
    tips: "Make sure the DA records a 'Speaking Order' demonstrating that they independently assessed all pleadings before enforcing penalty."
  },
  {
    id: "req12",
    title: "NIP Receipt Service Confirmation",
    category: "finalization",
    description: "The final service note proving the employee has legally received the penalty notice, which activates their appeal limits.",
    isMandatory: true,
    docReference: "Rule 18 to 22 (Appeals Section)",
    tips: "The CO has 45 days from the date of serving this NIP to register a formal appeal to the nominated Appellate Authority."
  }
];

export interface Part1Field {
  id: string;
  label: string;
  value: string;
  isSubField?: boolean;
}

export interface Part2Field {
  id: string;
  label: string;
  choice: "Yes" | "No" | "N/A" | "MAJOR" | "MINOR" | "Superannuation" | "";
  value: string;
  isSubField?: boolean;
}

export interface DarIndexField {
  id: number;
  label: string;
  value: string;
}

export const DEFAULT_DAR_INDEX_FIELDS: DarIndexField[] = [
  { id: 1, label: "Name of the Charged Official(CO)", value: "" },
  { id: 2, label: "Post last held by CO(Designation)", value: "" },
  { id: 3, label: "Pay Band & GP", value: "" },
  { id: 4, label: "Basic pay last drawn by him (including GP)", value: "" },
  { id: 5, label: "Date of birth", value: "" },
  { id: 6, label: "Date of Appointment", value: "" },
  { id: 7, label: "Date of Superannuation", value: "" },
  { id: 8, label: "Bio -data of C.O (Checklist)", value: "" },
  { id: 9, label: "Date of 1 Pre- check Memorandum by Vigilanace", value: "NA" },
  { id: 10, label: "Copy of all RUD is placed at", value: "" },
  { id: 11, label: "Preliminary Investigation Report was submitted by Vigilance on", value: "NA" },
  { id: 12, label: "Draft charge sheet was prepared by Vigilance on", value: "NA" },
  { id: 13, label: "Charged Memorandum was issed on", value: "" },
  { id: 14, label: "Acknowledgement of charge Memorandum on", value: "" },
  { id: 15, label: "Defence statement was submitted by C.O", value: "" },
  { id: 16, label: "Presenting officer was nominated on", value: "" },
  { id: 17, label: "Inquiry Officer was nominated on", value: "" },
  { id: 18, label: "Consent of Defence Helper was taken on", value: "" },
  { id: 19, label: "Nomination of Defence Helper was submitted on", value: "" },
  { id: 20, label: "Presenting officer's brief was submitted to I.O on", value: "" },
  { id: 21, label: "Presenting officer's brief was submitted to C.O on", value: "" },
  { id: 22, label: "Disagreement Memo of C.O on Presenting Officer's brief was submitted on", value: "" },
  { id: 23, label: "Inquiry proceeding are placed from", value: "" },
  { id: 24, label: "Inquiry Officer had submitted his report on", value: "" },
  { id: 25, label: "C.O had acknowledged the I.O report on", value: "" },
  { id: 26, label: "Final Representation of C.O on Inquiry Officer's report was submitted on", value: "" },
  { id: 27, label: "P.W.C of D.A. is placed at", value: "" },
  { id: 28, label: "Proposed N.I.P of Disciplinary Authority is placed at", value: "" },
  { id: 29, label: "PPO copy is placed at", value: "NA" },
  { id: 30, label: "APAR placed at", value: "" },
  { id: 31, label: "Service Book placed at", value: "" }
];

export interface HqCase {
  id?: string;
  caseName: string;
  part1: Part1Field[];
  part2: Part2Field[];
  darIndexFields?: DarIndexField[];
  signatureName: string;
  signatureDesignation: string;
  signaturePhone: string;
  signatureDate: string;
  checkedConfirmation: boolean;
  createdAt?: any;
  updatedAt?: any;
  // Fallbacks for older client components looking for legacy schema
  employeeName?: string;
  designation?: string;
  department?: string;
  pfNpsNo?: string;
  sfNo?: string;
  sfDate?: string;
  daName?: string;
  ioName?: string;
  poName?: string;
  finalNipNo?: string;
  nipDate?: string;
}

const DEFAULT_PART1: Part1Field[] = [
  { id: "p1_1", label: "1 Name of the Charged Official (CO) :" , value: "" },
  { id: "p1_2", label: "2 Post last held by CO :" , value: "" },
  { id: "p1_2_a", label: "(a) Group A, B, C or D" , value: "", isSubField: true },
  { id: "p1_2_b", label: "(b) Designation :" , value: "", isSubField: true },
  { id: "p1_2_c", label: "(c) Pay Band :" , value: "", isSubField: true },
  { id: "p1_2_d", label: "(d) Grade Pay (GP) :" , value: "", isSubField: true },
  { id: "p1_2_e", label: "(e) Basic Pay last drawn by him (Including GP) :" , value: "", isSubField: true },
  { id: "p1_2_f", label: "(f) Date from which pay shown against (e) drawn :" , value: "", isSubField: true },
  { id: "p1_2_g", label: "(g) Date of next increment :" , value: "", isSubField: true },
  { id: "p1_3_a", label: "3 (a) Name of the next lower post :" , value: "" },
  { id: "p1_3_b", label: "(b) Pay Band and Grade Pay :" , value: "", isSubField: true },
  { id: "p1_4", label: "4 Date of Birth :" , value: "" },
  { id: "p1_5", label: "5 Date of Appointment" , value: "" },
  { id: "p1_6", label: "6 Due date of retirement or actual date of retirement, if already retired :" , value: "" },
  { id: "p1_7_a", label: "7 (a) Date of Superannuation :" , value: "" },
  { id: "p1_7_b", label: "(b) Mode of retirement (Tick the correct option) :" , value: "", isSubField: true },
  { id: "p1_7_c", label: "(c) Amount of monthly pension due to the CO :" , value: "", isSubField: true },
  { id: "p1_7_d", label: "(d) Amount of monthly pension being paid to the CO :" , value: "", isSubField: true },
  { id: "p1_8", label: "8 Whether the CO was under suspension at the time of retirement (Tick the correct option) :" , value: "" },
  { id: "p1_9", label: "9 Appointing Authority w.r.t. the post last held by the CO :" , value: "" }
];

const getChoicesForField = (fieldId: string): string[] | null => {
  if (fieldId === "p2_1") return ["MAJOR", "MINOR"];

  if ([
    "p2_19_b",
    "p2_19_c",
    "p2_22_c",
    "p2_26_b",
    "p2_26_c"
  ].includes(fieldId)) {
    return ["N/A"];
  }

  if (["p2_2", "p2_3", "p2_4_b", "p2_6", "p2_9_a", "p2_10_a", "p2_11_a", "p2_12_a"].includes(fieldId)) {
    return ["Yes", "No"];
  }

  if ([
    "p2_4_a", 
    "p2_8", 
    "p2_13_a",
    "p2_14",
    "p2_15_a",
    "p2_15_b",
    "p2_16_a",
    "p2_16_b",
    "p2_17_a",
    "p2_17_c",
    "p2_19_a",
    "p2_20_a",
    "p2_21",
    "p2_22_a",
    "p2_26_a",
    "p2_28_a",
    "p2_29_a"
  ].includes(fieldId)) {
    return ["Yes", "No", "N/A"];
  }

  return null;
};

const shouldShowTextInputForField = (fieldId: string, choice?: string): boolean => {
  const choices = getChoicesForField(fieldId);
  if (!choices) return true;

  if (fieldId === "p2_1") return true;

  // Fields that only show typing option if Yes is selected
  if (["p2_4_a", "p2_8", "p2_13_a", "p2_14", "p2_15_a", "p2_17_a", "p2_28_a"].includes(fieldId)) {
    return choice === "Yes";
  }

  // Fields that show typing option if N/A is NOT selected
  if (["p2_19_b", "p2_19_c", "p2_22_c", "p2_26_b", "p2_26_c"].includes(fieldId)) {
    return choice !== "N/A";
  }

  // All other fields with choices do not require extra text input (the choice itself is standard)
  if ([
    "p2_2", "p2_3", "p2_4_b", "p2_6", "p2_9_a", "p2_10_a", "p2_11_a", "p2_12_a", "p2_15_b",
    "p2_16_a", "p2_16_b", "p2_17_c", "p2_19_a",
    "p2_20_a", "p2_21", "p2_22_a", "p2_26_a", "p2_29_a"
  ].includes(fieldId)) {
    return false;
  }

  return true;
};

const parseIoNames = (val: string): string[] => {
  if (!val) return [];
  let lines: string[] = [];
  if (val.includes("\n")) {
    lines = val.split("\n");
  } else if (/^\d+[\.\)\s]+/.test(val)) {
    lines = val.split(/(?=\d+[\.\)\s])/);
  } else {
    lines = [val];
  }

  const parsed: string[] = [];
  lines.forEach(line => {
    const cleaned = line.replace(/^\d+[\.\)\s\-]+/, "").trim();
    if (cleaned) {
      parsed.push(cleaned);
    }
  });

  return parsed;
};

const combineIoNamesList = (list: string[]): string => {
  const parts = list.map(p => p.trim()).filter(p => p.length > 0);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return parts.map((p, i) => `${i + 1}. ${p}`).join("\n");
};

const getPrintValueForField = (field: Part2Field): string => {
  let val = field.value ? field.value.trim() : "";
  if (!val && field.choice) {
    val = field.choice;
  }
  if (!val) {
    return "........................";
  }
  if (val === "N/A" || val === "NA") {
    return "NA";
  }
  return val;
};

const cleanLabelForPrint = (label: string): string => {
  let cleaned = label.replace(/^\d+\s*/, '');
  // Remove variations of "Tick the correct option"
  cleaned = cleaned.replace(/\s*\(?Tick the correct option\)?/gi, '');
  cleaned = cleaned.replace(/\s*\(?Tick the correct options\)?/gi, '');
  // Normalize colon at the end
  cleaned = cleaned.replace(/\s+:/g, ' :');
  return cleaned.trim();
};

const DEFAULT_PART2: Part2Field[] = [
  { id: "p2_1", label: "1 Nature of Chargesheet given (Tick the correct option) :", choice: "", value: "" },
  { id: "p2_2", label: "2 Whether DAR case files is furnished in original (Tick the correct option) :", choice: "", value: "" },
  { id: "p2_3", label: "3 Whether the chargesheet was issued by the competent authority (Tick the correct option) :", choice: "", value: "" },
  { id: "p2_4_a", label: "4 (a)** Chargesheet alongwith all the annexures :", choice: "", value: "" },
  { id: "p2_4_b", label: "(b) Whether any corrigendum to the chargesheet has been issued :", choice: "", value: "", isSubField: true },
  { id: "p2_4_c", label: "(c )** If yes, corrigendum to the chargesheet :", choice: "", value: "", isSubField: true },
  { id: "p2_5", label: "5** Records of delivery of the chargesheet to the CO :", choice: "", value: "" },
  { id: "p2_6", label: "6 Whether CO has submitted reply to the Chargesheet (Tick the correct option) :", choice: "", value: "" },
  { id: "p2_7", label: "7** If yes, CO's reply :", choice: "", value: "" },
  { id: "p2_8", label: "8** Nomination of Defence Helper, if any and consent letter of the defence helper :", choice: "", value: "" },
  { id: "p2_9_a", label: "9 (a) Whether the CO was suspended in connection with the misconduct (Tick the correct option) :", choice: "", value: "" },
  { id: "p2_9_b", label: "(b)** If yes, order of suspension and revocation of suspension, if any :", choice: "", value: "", isSubField: true },
  { id: "p2_10_a", label: "10 (a) Whether this is a vigilance case (Tick the correct option) :", choice: "", value: "" },
  { id: "p2_10_b", label: "(b)** If yes, vigilance investigation report (together with deposition recorded, if any) :", choice: "", value: "", isSubField: true },
  { id: "p2_11_a", label: "11 (a) Whether this is a CBI case (Tick the correct option) :", choice: "", value: "" },
  { id: "p2_11_b", label: "(b)** If yes, CBI investigation report (together with deposition recorded, if any) :", choice: "", value: "", isSubField: true },
  { id: "p2_12_a", label: "12 (a) Whether action initiated on basis of CVC's advice (Tick the correct option) :", choice: "", value: "" },
  { id: "p2_12_b", label: "(b)** If yes, CVC's 1st stage and 2nd stage advice :", choice: "", value: "", isSubField: true },
  { id: "p2_13_a", label: "13 (a)** All orders of the DA appointing the inquiry officer(s) :", choice: "", value: "" },
  { id: "p2_13_b", label: "(b) Name and designation of all the inquiry officers appointed in the case :", choice: "", value: "", isSubField: true },
  { id: "p2_14", label: "14** All orders of the DA appointing the presenting officer(s) :", choice: "", value: "" },
  { id: "p2_15_a", label: "15 (a)** All the notices of the IO to the CO and Prosecution Witness (es) intimating them the holding of the inquiry :", choice: "", value: "" },
  { id: "p2_15_b", label: "(b) Whether the notices were delivered /deemed delivered to the CO/DH for all the days (Tick the correct option) :", choice: "", value: "", isSubField: true },
  { id: "p2_16_a", label: "16 (a) Whether ex-parte proceeding has been held on any day (Tick the correct option) :", choice: "", value: "" },
  { id: "p2_16_b", label: "(b) If yes,whether the proper procedure as laid down in Board's letter No. E(D&A)90 RG 6-38 dated 18.04.1990 has been followed (Tick the correct option) :", choice: "", value: "", isSubField: true },
  { id: "p2_17_a", label: "17 (a) Whether any representation has been received from the CO for additional documents and /or defence witnesses (Tick the correct option) :", choice: "", value: "" },
  { id: "p2_17_b", label: "(b)** If yes, the representation of the CO and letter/noting vide which they disposed of :", choice: "", value: "", isSubField: true },
  { id: "p2_17_c", label: "(c) Whether additional/defence documents as demanded by the CO were allowed by the IO (Tick the correct option) :", choice: "", value: "", isSubField: true },
  { id: "p2_17_d", label: "(d)** If yes, description of Defence/additional documents allowed. (Details of the same in respect of each document may be given with proper folio number and folder, if necessary, in a separate sheet) :", choice: "", value: "", isSubField: true },
  { id: "p2_18", label: "18** Correspondence of the IO with the DA, if any :", choice: "", value: "" },
  { id: "p2_19_a", label: "19 (a) Whether all the prosecution witness (es) listed in Annexure-IV of the chargesheet have been examined by the IO (Tick the correct option) :", choice: "", value: "" },
  { id: "p2_19_b", label: "(b) ** If no, the reasons therefor may be indicated :", choice: "", value: "", isSubField: true },
  { id: "p2_19_c", label: "(c) ** Deposition/oral statements recorded from all the Prosecution witness (es), if any (Details may be given w.r.t. each witness with proper folio number and folder, if necessary, in a separate sheet) :", choice: "", value: "", isSubField: true },
  { id: "p2_20_a", label: "20 (a) Whether all the Defence witness (es) have been examined by the IO (Tick the correct option) :", choice: "", value: "" },
  { id: "p2_20_b", label: "(b)** Deposition/oral statements recorded from all the Defence witness (es), if any (Details may be given w.r.t each witness (es) with proper folio number and folder, if necessary, in a separate sheet) :", choice: "", value: "", isSubField: true },
  { id: "p2_21", label: "21** Statement of defence submitted by the CO during the inquiry proceedings under rule 9 (19) of RS (D&A) Rules :", choice: "", value: "" },
  { id: "p2_22_a", label: "22 (a) Whether general examination of the CO is done (Tick the correct option) :", choice: "", value: "" },
  { id: "p2_22_b", label: "(b) ** If yes, folio at which general examination of CO is placed :", choice: "", value: "", isSubField: true },
  { id: "p2_22_c", label: "(c) If no, the reasons therefore may be indicated :", choice: "", value: "", isSubField: true },
  { id: "p2_23", label: "23 Description of all the Relied Upon Documents (RUD) mentioned in the Annexure-III of the chargesheet. (Details of the same in respect of each document may be given with proper folio number and folder, if necessary, in a separate sheet) :", choice: "", value: "" },
  { id: "p2_24_a", label: "24 (a)** Written brief, if any, submitted by the presenting officer :", choice: "", value: "" },
  { id: "p2_24_b", label: "(b)** Records of supply of PO's brief to the CO :", choice: "", value: "", isSubField: true },
  { id: "p2_25", label: "25 Written brief, if any, submitted by the CO under rule 9 (22) of RS (D&A) Rules :", choice: "", value: "" },
  { id: "p2_26_a", label: "26 (a) Whether CO has submitted any representation regarding biasness of the IO (Tick the correct option) :", choice: "", value: "" },
  { id: "p2_26_b", label: "(b) ** If yes, representation of the CO regarding biasness of the IO :", choice: "", value: "", isSubField: true },
  { id: "p2_26_c", label: "(c) ** Competent Authority's letter/order vide which the CO's representation regarding biasness of the IO has been disposed of :", choice: "", value: "", isSubField: true },
  { id: "p2_27_a", label: "27 (a)** Inquiry Report :", choice: "", value: "" },
  { id: "p2_27_b", label: "(b)** Records of supply of the inquiry report to the CO :", choice: "", value: "", isSubField: true },
  { id: "p2_28_a", label: "28 (a) Is there any disagreement of the DA with the inquiry report (Tick the correct option) :", choice: "", value: "" },
  { id: "p2_28_b", label: "(b)** If yes, reasons of disagreement of the DA with the findings of the IO :", choice: "", value: "", isSubField: true },
  { id: "p2_28_c", label: "(c)** Records of communication of the reasons for disagreement to the CO along with the inquiry report :", choice: "", value: "", isSubField: true },
  { id: "p2_29_a", label: "29 (a) Whether the CO has submitted representation against the inquiry report/disagreement memorandum (Tick the correct option) :", choice: "", value: "" },
  { id: "p2_29_b", label: "(b)** If yes, the CO's representation against the inquiry report/disagreement memorandum :", choice: "", value: "", isSubField: true },
  { id: "p2_30", label: "30 Self-contained note and Parawise comments of the DA & AA, on the CO's representation against the inquiry report/penalty imposed/disagreement memorandum :", choice: "", value: "" }
];

export default function HqMaterialManager() {
  const [activeSubTab, setActiveSubTab] = useState<"dar_procedure" | "checklist_index" | "dar_index_form">("dar_index_form");
  const [darIndexFields, setDarIndexFields] = useState<DarIndexField[]>(DEFAULT_DAR_INDEX_FIELDS);
  const [newIoName, setNewIoName] = useState("");
  const [newIoDesignation, setNewIoDesignation] = useState("");
  const [filterCategory, setFilterCategory] = useState<"all" | "preliminary" | "charge-sheet" | "inquiry" | "finalization">("all");
  
  // Permanent Firestore subscription
  const [casesList, setCasesList] = useState<HqCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [caseNameInput, setCaseNameInput] = useState<string>("");

  // Master State Fields (Verbatim PDF checklists)
  const [part1, setPart1] = useState<Part1Field[]>(DEFAULT_PART1);
  const [part2, setPart2] = useState<Part2Field[]>([]);

  // Synchronize 4c, 7, 9b, 10b, 11b, and 12b with their parent options
  useEffect(() => {
    let changed = false;
    const updated = part2.map(f => {
      if (f.id === "p2_4_c") {
        const p4b = part2.find(x => x.id === "p2_4_b");
        if (p4b?.choice !== "Yes" && f.value !== "NA") {
          changed = true;
          return { ...f, value: "NA" };
        }
      }
      if (f.id === "p2_7") {
        const p6 = part2.find(x => x.id === "p2_6");
        if (p6?.choice !== "Yes" && f.value !== "NA") {
          changed = true;
          return { ...f, value: "NA" };
        }
      }
      if (f.id === "p2_9_b") {
        const p9a = part2.find(x => x.id === "p2_9_a");
        if (p9a?.choice !== "Yes" && f.value !== "NA") {
          changed = true;
          return { ...f, value: "NA" };
        }
      }
      if (f.id === "p2_10_b") {
        const p10a = part2.find(x => x.id === "p2_10_a");
        if (p10a?.choice !== "Yes" && f.value !== "NA") {
          changed = true;
          return { ...f, value: "NA" };
        }
      }
      if (f.id === "p2_11_b") {
        const p11a = part2.find(x => x.id === "p2_11_a");
        if (p11a?.choice !== "Yes" && f.value !== "NA") {
          changed = true;
          return { ...f, value: "NA" };
        }
      }
      if (f.id === "p2_12_b") {
        const p12a = part2.find(x => x.id === "p2_12_a");
        if (p12a?.choice !== "Yes" && f.value !== "NA") {
          changed = true;
          return { ...f, value: "NA" };
        }
      }
      return f;
    });
    if (changed) {
      setPart2(updated);
    }
  }, [part2]);

  // Bottom Signature Panel
  const [signatureName, setSignatureName] = useState("");
  const [signatureDesignation, setSignatureDesignation] = useState("");
  const [signaturePhone, setSignaturePhone] = useState("");
  const [signatureDate, setSignatureDate] = useState("");
  const [checkedConfirmation, setCheckedConfirmation] = useState(false);

  // DAR Procedure State
  const isAdmin = useStore((state) => state.isAdmin);
  const part2Template = useStore((state) => state.part2Template) || [];

  // Sync checklist part2 with global dynamic checklist rows template
  useEffect(() => {
    if (!selectedCaseId && part2Template && part2Template.length > 0) {
      setPart2(prev => {
        return part2Template.map(tmpl => {
          const matched = prev.find(p => p.id === tmpl.id);
          return {
            ...tmpl,
            choice: matched ? matched.choice : tmpl.choice || "",
            value: matched ? matched.value : tmpl.value || "",
          };
        });
      });
    }
  }, [part2Template, selectedCaseId]);
  const [procedureSteps, setProcedureSteps] = useState<ProcedureStep[]>(DEFAULT_PROCEDURE_STEPS);
  const [isLoadingProcedure, setIsLoadingProcedure] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [activePopupType, setActivePopupType] = useState<"sf5" | "sf11" | "sf1" | "custom" | null>(null);
  const [currentPopupNodeId, setCurrentPopupNodeId] = useState<string>("start");
  const [popupHistory, setPopupHistory] = useState<string[]>([]);

  // Simple POPUP-Based Customizer & Advisor State
  const [darTree, setDarTree] = useState<Record<string, DecisionPopupNode>>(DAR_UNIFIED_TREE);
  const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false);
  const [isCustomizingMode, setIsCustomizingMode] = useState(false);
  const [showNodeEditorId, setShowNodeEditorId] = useState<string | null>(null);
  
  // Local option editing form state in the popup
  const [newOptText, setNewOptText] = useState("");
  const [newOptTarget, setNewOptTarget] = useState("");
  const [newOptInfo, setNewOptInfo] = useState("");
  const [inlineCreateId, setInlineCreateId] = useState("");
  const [inlineCreateQuestion, setInlineCreateQuestion] = useState("");

  const printAreaRef = useRef<HTMLDivElement>(null);

  const todayDate = new Date();
  const maxDobYear = todayDate.getFullYear() - 20;
  const maxDobStr = `${maxDobYear}-${String(todayDate.getMonth() + 1).padStart(2, "0")}-${String(todayDate.getDate()).padStart(2, "0")}`;

  const parseDateToYmd = (val: string) => {
    if (!val) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const date = new Date(val);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
    return "";
  };

  // Firestore DB subscription for cases list
  useEffect(() => {
    const q = collection(db, "dar_hq_cases");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: HqCase[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as HqCase);
      });
      setCasesList(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "dar_hq_cases");
    });
    return () => unsubscribe();
  }, []);

  // Real-time listener for DAR Procedure Config from Cloud
  useEffect(() => {
    const procedureRef = doc(db, "settings", "dar_procedure_config");
    const unsubscribe = onSnapshot(procedureRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && Array.isArray(data.steps)) {
          setProcedureSteps(data.steps);
        }
      }
      setIsLoadingProcedure(false);
    }, (error) => {
      console.error("Error subscribing to dar_procedure_config:", error);
      setIsLoadingProcedure(false);
    });
    return () => unsubscribe();
  }, []);

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
    toast.success("Step fields updated and saved.");
  };

  // Reset entire D&AR Tree
  const handleResetTreeToDefault = () => {
    if (window.confirm("Are you sure you want to reset the current D&AR advisor to default? All custom additions will be lost.")) {
      setDarTree(DAR_UNIFIED_TREE);
      saveDarTreeToCloud(DAR_UNIFIED_TREE);
      toast.info("Advisor reset to standard rules.");
    }
  };

  // Save DAR Procedure config to Cloud (Fixing the channel)
  const handleSaveProcedureToCloud = async () => {
    try {
      const procedureRef = doc(db, "settings", "dar_procedure_config");
      await setDoc(procedureRef, { steps: procedureSteps });
      toast.success("DAR Procedure configuration successfully fixed and saved to cloud!");
      setIsEditMode(false);
    } catch (err: any) {
      console.error("Error saving procedure config to Firestore:", err);
      toast.error("Cloud Save failed: " + err.message);
    }
  };

  const handleResetProcedureToDefault = () => {
    if (window.confirm("Are you sure you want to reset the current procedure flow to the default SF-1 template? All custom branches will be overwritten.")) {
      setProcedureSteps(DEFAULT_PROCEDURE_STEPS);
      setSelectedOptions({});
      toast.info("Local structure reset! Click 'Fix & Save' to write this to Cloud.");
    }
  };

  const handleAddStep = () => {
    const newStepId = `s_${Date.now()}`;
    const newStep: ProcedureStep = {
      id: newStepId,
      question: "New Process Question...?",
      options: [
        {
          id: `${newStepId}_o1`,
          text: "Yes",
          nextStepId: null,
          infoText: "Enter the statutory compliance tip to display when matching this selection."
        },
        {
          id: `${newStepId}_o2`,
          text: "No",
          nextStepId: null,
          infoText: "Enter alternative legal/procedural guidance or end statement."
        }
      ]
    };
    setProcedureSteps([...procedureSteps, newStep]);
    setEditingStepId(newStepId);
    toast.success("New Step created! Set parent option triggers to link this step.");
  };

  const handleDeleteStep = (id: string) => {
    if (window.confirm("Delete this step? This will remove the step and automatically reset parent options pointing here.")) {
      setProcedureSteps(procedureSteps.filter(s => s.id !== id));
      // Re-route parent options pointing here to null/terminal
      setProcedureSteps(prev => prev.map(step => ({
        ...step,
        options: step.options.map(o => o.nextStepId === id ? { ...o, nextStepId: null } : o)
      })));
      toast.info("Step deleted. Option linkages updated.");
    }
  };

  const handleUpdateStepQuestion = (stepId: string, question: string) => {
    setProcedureSteps(prev => prev.map(s => s.id === stepId ? { ...s, question } : s));
  };

  const handleAddOptionToStep = (stepId: string) => {
    const optId = `o_${Date.now()}`;
    const newOpt = {
      id: optId,
      text: "New Option",
      nextStepId: null,
      infoText: "Enter statutory info advice details here."
    };
    setProcedureSteps(prev => prev.map(s => s.id === stepId ? { ...s, options: [...s.options, newOpt] } : s));
  };

  const handleUpdateOptionText = (stepId: string, optionId: string, text: string) => {
    setProcedureSteps(prev => prev.map(s => s.id === stepId ? {
      ...s,
      options: s.options.map(o => o.id === optionId ? { ...o, text } : o)
    } : s));
  };

  const handleUpdateOptionInfo = (stepId: string, optionId: string, infoText: string) => {
    setProcedureSteps(prev => prev.map(s => s.id === stepId ? {
      ...s,
      options: s.options.map(o => o.id === optionId ? { ...o, infoText } : o)
    } : s));
  };

  const handleUpdateOptionNextStep = (stepId: string, optionId: string, nextStepId: string | null) => {
    setProcedureSteps(prev => prev.map(s => s.id === stepId ? {
      ...s,
      options: s.options.map(o => o.id === optionId ? { ...o, nextStepId: nextStepId || null } : o)
    } : s));
  };

  const handleDeleteOption = (stepId: string, optionId: string) => {
    setProcedureSteps(prev => prev.map(s => s.id === stepId ? {
      ...s,
      options: s.options.filter(o => o.id !== optionId)
    } : s));
  };

  // Set first name or metadata variables when Part-I elements change
  const findPart1Value = (id: string, list = part1) => {
    return list.find(f => f.id === id)?.value || "";
  };

  const handleLoadCase = (caseId: string) => {
    if (!caseId) {
      handleResetForm();
      return;
    }
    const target = casesList.find((c) => c.id === caseId);
    if (!target) return;

    setSelectedCaseId(target.id || "");
    setCaseNameInput(target.caseName || "");

    // Load Part I with legacy mappings
    if (target.part1 && target.part1.length > 0) {
      setPart1(target.part1);
    } else {
      const newPart1 = DEFAULT_PART1.map(field => {
        if (field.id === "p1_1") return { ...field, value: target.employeeName || "" };
        if (field.id === "p1_2_b") return { ...field, value: target.designation || "" };
        if (field.id === "p1_2") return { ...field, value: target.designation || "" };
        if (field.id === "p1_2_e") return { ...field, value: target.pfNpsNo || "" };
        return field;
      });
      setPart1(newPart1);
    }

    // Load Part II with legacy mappings
    if (target.part2 && target.part2.length > 0) {
      setPart2(target.part2);
    } else if (target.checklistItems && target.checklistItems.length > 0) {
      const activeTemplate = part2Template.length ? part2Template : DEFAULT_PART2;
      const newPart2 = activeTemplate.map(field => {
        const matchingLegacy = target.checklistItems.find(item => 
          item.label.toLowerCase().replace(/[^a-z]/g, "").includes(field.label.toLowerCase().replace(/[^a-z]/g, "")) ||
          field.label.toLowerCase().replace(/[^a-z]/g, "").includes(item.label.toLowerCase().replace(/[^a-z]/g, ""))
        );
        if (matchingLegacy) {
          return { ...field, choice: matchingLegacy.value, value: matchingLegacy.remarks };
        }
        return field;
      });
      setPart2(newPart2);
    } else {
      setPart2(part2Template.length ? part2Template.map(f => ({ ...f, choice: "", value: "" })) : DEFAULT_PART2);
    }

    setSignatureName(target.signatureName || "");
    setSignatureDesignation(target.signatureDesignation || "");
    setSignaturePhone(target.signaturePhone || "");
    setSignatureDate(target.signatureDate || "");
    setCheckedConfirmation(target.checkedConfirmation || false);

    // Load or dynamically map DAR Case Index fields
    if (target.darIndexFields && target.darIndexFields.length > 0) {
      setDarIndexFields(target.darIndexFields);
    } else {
      const p1 = target.part1 || [];
      const getVal = (id: string) => p1.find(x => x.id === id)?.value || "";
      const isSM = getVal("p1_1").includes("Santosh Kumar") || target.caseName?.includes("Santosh") || false; 
      
      const mapped = DEFAULT_DAR_INDEX_FIELDS.map(f => {
        if (f.id === 1) return { ...f, value: getVal("p1_1") || target.employeeName || (isSM ? "Shri Santosh Kumar" : "") };
        if (f.id === 2) return { ...f, value: getVal("p1_2_b") || getVal("p1_2") || target.designation || (isSM ? "Station Master" : "") };
        if (f.id === 3) {
          const pb = getVal("p1_2_c") || (isSM ? "5200-20200/-" : "");
          const gp = getVal("p1_2_d") || (isSM ? "4200/-" : "");
          const combined = pb && gp ? `${pb} & ${gp}` : (pb || gp);
          return { ...f, value: combined };
        }
        if (f.id === 4) return { ...f, value: getVal("p1_2_e") || (isSM ? "53600/-" : "") };
        if (f.id === 5) return { ...f, value: getVal("p1_4") || (isSM ? "13.02.1984" : "") };
        if (f.id === 6) return { ...f, value: getVal("p1_5") || (isSM ? "02.07.2012" : "") };
        if (f.id === 7) return { ...f, value: getVal("p1_7_a") || (isSM ? "29.02.2044" : "") };
        if (f.id === 8 && isSM) return { ...f, value: "SN-387 to 389" };
        if (f.id === 10 && isSM) return { ...f, value: "SN-137 to 138" };
        if (f.id === 13 && isSM) return { ...f, value: "29.10.2024 (SN-137 to 143)" };
        if (f.id === 14 && isSM) return { ...f, value: "30.10.2024 (SN-146)" };
        if (f.id === 15 && isSM) return { ...f, value: "SN-152 to 153" };
        if (f.id === 16 && isSM) return { ...f, value: "26.05.2025(SN-150/A)" };
        if (f.id === 17 && isSM) return { ...f, value: "09.05.2025(SN-150)" };
        if (f.id === 18 && isSM) return { ...f, value: "25.05.2025(SN-154)" };
        if (f.id === 19 && isSM) return { ...f, value: "25.05.2025(SN-155)" };
        if (f.id === 20 && isSM) return { ...f, value: "SN-231" };
        if (f.id === 21 && isSM) return { ...f, value: "14.08.2025(SN-235)" };
        if (f.id === 22 && isSM) return { ...f, value: "SN-242 to 251" };
        if (f.id === 23 && isSM) return { ...f, value: "SN -157 to 256" };
        if (f.id === 24 && isSM) return { ...f, value: "SN -256 to 252" };
        if (f.id === 25 && isSM) return { ...f, value: "11.11.2025 (SN-260)" };
        if (f.id === 26 && isSM) return { ...f, value: "SN-263 to 271" };
        if (f.id === 27 && isSM) return { ...f, value: "SN -370" };
        if (f.id === 28 && isSM) return { ...f, value: "SN-273" };
        if (f.id === 30 && isSM) return { ...f, value: "SN-349 to 366" };
        if (f.id === 31 && isSM) return { ...f, value: "SN-374 to 386" };
        return f;
      });
      setDarIndexFields(mapped);
    }

    toast.success(`Case Docket "${target.caseName}" loaded successfully!`);
  };

  const handleResetForm = () => {
    setSelectedCaseId("");
    setCaseNameInput("");
    setPart1(DEFAULT_PART1.map(f => ({ ...f, value: "" })));
    setPart2((part2Template.length ? part2Template : DEFAULT_PART2).map(f => ({ ...f, choice: "", value: "" })));
    setDarIndexFields(DEFAULT_DAR_INDEX_FIELDS);
    setSignatureName("");
    setSignatureDesignation("");
    setSignaturePhone("");
    setSignatureDate("");
    setCheckedConfirmation(false);
  };

  // Seeding the exact PDF Demo Case Suit for verification
  const loadDemoCase = () => {
    setCaseNameInput("Demo Case (Shri Anshu Kumar Amresh)");
    
    const demoPart1 = DEFAULT_PART1.map(field => {
      if (field.id === "p1_1") return { ...field, value: "Shri Anshu Kumar Amresh" };
      if (field.id === "p1_2") return { ...field, value: "Station Superintendent" };
      if (field.id === "p1_2_a") return { ...field, value: "Group 'C'" };
      if (field.id === "p1_2_b") return { ...field, value: "SS(L-7)" };
      if (field.id === "p1_2_c") return { ...field, value: "9300-34800/-" };
      if (field.id === "p1_2_d") return { ...field, value: "4600/-" };
      if (field.id === "p1_2_e") return { ...field, value: "64,100" };
      if (field.id === "p1_2_f") return { ...field, value: "1/7/2025" };
      if (field.id === "p1_2_g") return { ...field, value: "1/7/2026" };
      if (field.id === "p1_3_a") return { ...field, value: "Station Master" };
      if (field.id === "p1_3_b") return { ...field, value: "Pay Band 5200-20200 and Grade Pay :4200" };
      if (field.id === "p1_4") return { ...field, value: "30.12.1980" };
      if (field.id === "p1_5") return { ...field, value: "21.09.2005" };
      if (field.id === "p1_6") return { ...field, value: "NA" };
      if (field.id === "p1_7_a") return { ...field, value: "31.12.2040" };
      if (field.id === "p1_7_b") return { ...field, value: "Superannuation" };
      if (field.id === "p1_7_c") return { ...field, value: "NA" };
      if (field.id === "p1_7_d") return { ...field, value: "NA" };
      if (field.id === "p1_8") return { ...field, value: "NO" };
      if (field.id === "p1_9") return { ...field, value: "Sr.DOM/KIR" };
      return field;
    });
    setPart1(demoPart1);

    const demoPart2 = (part2Template.length ? part2Template : DEFAULT_PART2).map(field => {
      if (field.id === "p2_1") return { ...field, choice: "MAJOR" as any, value: "MAJOR" };
      if (field.id === "p2_2") return { ...field, choice: "Yes" as any, value: "Yes" };
      if (field.id === "p2_3") return { ...field, choice: "Yes" as any, value: "Yes" };
      if (field.id === "p2_4_a") return { ...field, choice: "Yes" as any, value: "Yes(SN-1 to 8)" };
      if (field.id === "p2_4_b") return { ...field, choice: "No" as any, value: "No" };
      if (field.id === "p2_4_c") return { ...field, choice: "N/A" as any, value: "NA" };
      if (field.id === "p2_5") return { ...field, choice: "" as any, value: "SN-9" };
      if (field.id === "p2_6") return { ...field, choice: "Yes" as any, value: "Yes" };
      if (field.id === "p2_7") return { ...field, choice: "" as any, value: "SN-11 to 14" };
      if (field.id === "p2_8") return { ...field, choice: "Yes" as any, value: "Yes(SN-10)" };
      if (field.id === "p2_9_a") return { ...field, choice: "Yes" as any, value: "Yes" };
      if (field.id === "p2_9_b") return { ...field, choice: "" as any, value: "SN-A/1 to A/4" };
      if (field.id === "p2_10_a") return { ...field, choice: "No" as any, value: "No" };
      if (field.id === "p2_10_b") return { ...field, choice: "N/A" as any, value: "NA" };
      if (field.id === "p2_11_a") return { ...field, choice: "No" as any, value: "No" };
      if (field.id === "p2_11_b") return { ...field, choice: "N/A" as any, value: "NA" };
      if (field.id === "p2_12_a") return { ...field, choice: "No" as any, value: "No" };
      if (field.id === "p2_12_b") return { ...field, choice: "N/A" as any, value: "NA" };
      if (field.id === "p2_13_a") return { ...field, choice: "" as any, value: "SF-7(SN-172/C)" };
      if (field.id === "p2_13_b") return { ...field, choice: "" as any, value: "Shri Mohit Joshi, AM/NJP/NFR" };
      if (field.id === "p2_14") return { ...field, choice: "" as any, value: "SF-8 at SN-172/E" };
      if (field.id === "p2_15_a") return { ...field, choice: "Yes" as any, value: "Acknowledgemtn of Preliminary Hearing notice as wel as Regular Hearing Notice(i.e SN 165 dated 17/07/2025 and SN -264 dated 04/08/2025 not availble in the file" };
      if (field.id === "p2_15_b") return { ...field, choice: "Yes" as any, value: "Yes" };
      if (field.id === "p2_16_a") return { ...field, choice: "No" as any, value: "No" };
      if (field.id === "p2_16_b") return { ...field, choice: "N/A" as any, value: "NA" };
      if (field.id === "p2_17_a") return { ...field, choice: "Yes" as any, value: "Yes(SN-11 to 14)" };
      if (field.id === "p2_17_b") return { ...field, choice: "" as any, value: "Disposed vide SN-163/B" };
      if (field.id === "p2_17_c") return { ...field, choice: "Yes" as any, value: "Yes" };
      if (field.id === "p2_17_d") return { ...field, choice: "" as any, value: "SN-241, 258" };
      if (field.id === "p2_18") return { ...field, choice: "" as any, value: "Yes SN-258" };
      if (field.id === "p2_19_a") return { ...field, choice: "N/A" as any, value: "NA" };
      if (field.id === "p2_19_b") return { ...field, choice: "N/A" as any, value: "NA" };
      if (field.id === "p2_19_c") return { ...field, choice: "N/A" as any, value: "NA" };
      if (field.id === "p2_20_a") return { ...field, choice: "Yes" as any, value: "Yes" };
      if (field.id === "p2_20_b") return { ...field, choice: "" as any, value: "SN-244 to 251& 259 to 262" };
      if (field.id === "p2_21") return { ...field, choice: "No" as any, value: "No" };
      if (field.id === "p2_22_a") return { ...field, choice: "Yes" as any, value: "Yes (SN 265 to 267)" };
      if (field.id === "p2_22_b") return { ...field, choice: "" as any, value: "SN-265 to 267" };
      if (field.id === "p2_22_c") return { ...field, choice: "N/A" as any, value: "NA" };
      if (field.id === "p2_23") return { ...field, choice: "" as any, value: "SN-1 to 3" };
      if (field.id === "p2_24_a") return { ...field, choice: "" as any, value: "SN-270 to 271" };
      if (field.id === "p2_24_b") return { ...field, choice: "" as any, value: "SN -272" };
      if (field.id === "p2_25") return { ...field, choice: "" as any, value: "SN -273 to 297" };
      if (field.id === "p2_26_a") return { ...field, choice: "No" as any, value: "No" };
      if (field.id === "p2_26_b") return { ...field, choice: "N/A" as any, value: "NA" };
      if (field.id === "p2_26_c") return { ...field, choice: "N/A" as any, value: "NA" };
      if (field.id === "p2_27_a") return { ...field, choice: "" as any, value: "SN-298 to 307" };
      if (field.id === "p2_27_b") return { ...field, choice: "" as any, value: "SN-314" };
      if (field.id === "p2_28_a") return { ...field, choice: "Yes" as any, value: "Yes (SN-310 to 311)" };
      if (field.id === "p2_28_b") return { ...field, choice: "" as any, value: "The Disciplinary Authority disagrees with the Inquiry Officer's conclusion that the charges are partially proved." };
      if (field.id === "p2_28_c") return { ...field, choice: "" as any, value: "SN-314" };
      if (field.id === "p2_29_a") return { ...field, choice: "Yes" as any, value: "Yes" };
      if (field.id === "p2_29_b") return { ...field, choice: "" as any, value: "SN -315 to 336" };
      if (field.id === "p2_30") return { ...field, choice: "" as any, value: "Self Contained note placed at PP-19 to 20,The DA’s PWC is placed at SN-456 & AA’s PWC is given at SN-458" };
      return field;
    });
    setPart2(demoPart2);

    setSignatureName("Mohit Joshi");
    setSignatureDesignation("AM/NJP/NFR");
    setSignaturePhone("94347-XXXXX");
    setSignatureDate("2026-06-12");
    setCheckedConfirmation(true);
    
    toast.success("Loaded exact PDF reference case into the form!");
  };

  // Save to Firebase
  const handleSaveToDb = async () => {
    const coName = findPart1Value("p1_1");
    const docketName = caseNameInput.trim() || `${coName || "Unnamed CO"} - Submission-${Math.floor(100+Math.random()*900)}`;
    
    const payload: HqCase = {
      caseName: docketName,
      part1,
      part2,
      darIndexFields,
      signatureName,
      signatureDesignation,
      signaturePhone,
      signatureDate,
      checkedConfirmation,
      // Fallbacks to maintain backward compatibility with any earlier database list items:
      employeeName: findPart1Value("p1_1"),
      designation: findPart1Value("p1_2_b") || findPart1Value("p1_2"),
      department: "Substituted",
      pfNpsNo: findPart1Value("p1_2_e"),
      sfNo: findPart1Value("p1_2_b"),
      sfDate: findPart1Value("p1_2_f"),
      daName: findPart1Value("p1_9"),
      ioName: "In Checklist",
      poName: "In Checklist",
      finalNipNo: "In Checklist",
      nipDate: "In Checklist",
      updatedAt: serverTimestamp()
    };

    try {
      if (selectedCaseId) {
        const ref = doc(db, "dar_hq_cases", selectedCaseId);
        await setDoc(ref, payload, { merge: true });
        toast.success(`Docket "${docketName}" updated in cloud!`);
      } else {
        payload.createdAt = serverTimestamp();
        const ref = collection(db, "dar_hq_cases");
        const docRef = await addDoc(ref, payload);
        setSelectedCaseId(docRef.id);
        setCaseNameInput(docketName);
        toast.success(`Successfully saved "${docketName}" permanently to Cloud Firestore!`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "dar_hq_cases");
      toast.error("Failed to save Case Checklist to database.");
    }
  };

  const handleDeleteCase = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this case docket permanently?")) return;
    try {
      await deleteDoc(doc(db, "dar_hq_cases", id));
      if (selectedCaseId === id) {
        handleResetForm();
      }
      toast.success("Case checklist dissolved successfully.");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "dar_hq_cases");
      toast.error("Failed to delete from database.");
    }
  };

  // Robust parsing: scans all rows and columns to find fixed label statements and map adjacent cell values
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (!rows || rows.length === 0) {
          toast.error("The spreadsheet is empty or format is unsupported.");
          return;
        }

        let updatedPart1 = [...part1];
        let updatedPart2 = [...part2];
        let importCount = 0;

        let sigName = signatureName;
        let sigDesg = signatureDesignation;
        let sigPhone = signaturePhone;
        let sigDate = signatureDate;

        rows.forEach((row) => {
          if (!row || row.length < 2) return;
          for (let i = 0; i < row.length; i++) {
            const cellVal = row[i];
            if (!cellVal) continue;
            const cellStr = String(cellVal).trim();
            if (cellStr.length < 2) continue;

            // Find adjacent value in the row
            let valStr = "";
            for (let j = i + 1; j < row.length; j++) {
              if (row[j] !== undefined && row[j] !== null && String(row[j]).trim() !== "") {
                valStr = String(row[j]).trim();
                break;
              }
            }

            if (!valStr) continue;

            const normalizedLeft = cellStr.toLowerCase().replace(/[^a-z0-9]/g, "");

            // Look for signature variables
            if (normalizedLeft.includes("nameinblockletters")) {
              sigName = valStr;
              continue;
            } else if (normalizedLeft.includes("designation") && normalizedLeft.includes("block")) {
              sigDesg = valStr;
              continue;
            } else if (normalizedLeft.includes("telephoneno")) {
              sigPhone = valStr;
              continue;
            } else if (normalizedLeft.includes("date")) {
              sigDate = valStr;
              continue;
            }

            // 1. Part I matching
            let isMatched = false;
            updatedPart1 = updatedPart1.map(field => {
              const fieldNorm = field.label.toLowerCase().replace(/[^a-z0-9]/g, "");
              const isMatch = (fieldNorm.includes(normalizedLeft) || normalizedLeft.includes(fieldNorm) ||
                (field.id === "p1_1" && (normalizedLeft.includes("nameofthechargedofficial") || normalizedLeft.includes("chargedoffical") || normalizedLeft.includes("coname"))) ||
                (field.id === "p1_2" && (normalizedLeft.includes("postlastheldbyco") || normalizedLeft.includes("postlastheld"))) ||
                (field.id === "p1_2_a" && (normalizedLeft.includes("groupa") || normalizedLeft.includes("groupb") || normalizedLeft.includes("groupc") || normalizedLeft.includes("groupd"))) ||
                (field.id === "p1_2_d" && (normalizedLeft.includes("gradepay") || normalizedLeft.includes("gp"))) ||
                (field.id === "p1_2_e" && (normalizedLeft.includes("basicpaylastdrawn") || normalizedLeft.includes("basicpay"))) ||
                (field.id === "p1_2_g" && (normalizedLeft.includes("nextincrement"))) ||
                (field.id === "p1_4" && (normalizedLeft.includes("dateofbirth") || normalizedLeft.includes("dob"))) ||
                (field.id === "p1_5" && (normalizedLeft.includes("appointment") || normalizedLeft.includes("dateofappointment"))) ||
                (field.id === "p1_7_a" && (normalizedLeft.includes("superannuation") || normalizedLeft.includes("dateofsuperannuation"))) ||
                (field.id === "p1_8" && (normalizedLeft.includes("suspension") && normalizedLeft.includes("retirement")))
              );

              if (isMatch) {
                isMatched = true;
                return { ...field, value: valStr };
              }
              return field;
            });

            // 2. Part II matching
            updatedPart2 = updatedPart2.map(field => {
              const fieldNorm = field.label.toLowerCase().replace(/[^a-z0-9]/g, "");
              const isMatch = (fieldNorm.includes(normalizedLeft) || normalizedLeft.includes(fieldNorm) ||
                (field.id === "p2_1" && normalizedLeft.includes("natureofchargesheet")) ||
                (field.id === "p2_2" && normalizedLeft.includes("furnishedinoriginal")) ||
                (field.id === "p2_3" && normalizedLeft.includes("issuedbycompetent")) ||
                (field.id === "p2_4_a" && (normalizedLeft.includes("chargesheetalongwith") || normalizedLeft.includes("chargesheetalongwithall"))) ||
                (field.id === "p2_4_b" && normalizedLeft.includes("corrigendum")) ||
                (field.id === "p2_5" && normalizedLeft.includes("recordsofdelivery")) ||
                (field.id === "p2_6" && normalizedLeft.includes("submittedreply")) ||
                (field.id === "p2_7" && normalizedLeft.includes("co'sreply")) ||
                (field.id === "p2_8" && normalizedLeft.includes("defencehelper")) ||
                (field.id === "p2_9_a" && normalizedLeft.includes("suspended")) ||
                (field.id === "p2_10_a" && normalizedLeft.includes("vigilancecase")) ||
                (field.id === "p2_11_a" && normalizedLeft.includes("cbicase")) ||
                (field.id === "p2_13_a" && normalizedLeft.includes("appointinginquiry")) ||
                (field.id === "p2_14" && normalizedLeft.includes("appointingpresenting")) ||
                (field.id === "p2_15_a" && normalizedLeft.includes("noticesoftheio")) ||
                (field.id === "p2_16_a" && normalizedLeft.includes("exparte")) ||
                (field.id === "p2_17_a" && normalizedLeft.includes("representation")) ||
                (field.id === "p2_18" && normalizedLeft.includes("correspondence")) ||
                (field.id === "p2_19_a" && normalizedLeft.includes("prosecutionwitness")) ||
                (field.id === "p2_20_a" && normalizedLeft.includes("defencewitness")) ||
                (field.id === "p2_22_a" && normalizedLeft.includes("generalexamination")) ||
                (field.id === "p2_23" && normalizedLeft.includes("reliedupon")) ||
                (field.id === "p2_24_a" && normalizedLeft.includes("writtenbrief")) ||
                (field.id === "p2_25" && normalizedLeft.includes("writtenbriefbytheco")) ||
                (field.id === "p2_27_a" && normalizedLeft.includes("inquiryreport"))
              );

              if (isMatch) {
                isMatched = true;
                const upperVal = valStr.toUpperCase();
                let choice: any = "";
                if (upperVal.startsWith("YES") || upperVal === "Y") {
                  choice = "Yes";
                } else if (upperVal.startsWith("NO") || upperVal === "N") {
                  choice = "No";
                } else if (upperVal.includes("N/A") || upperVal.includes("NA") || upperVal.includes("NONE")) {
                  choice = "N/A";
                } else if (upperVal.includes("MAJOR")) {
                  choice = "MAJOR";
                } else if (upperVal.includes("MINOR")) {
                  choice = "MINOR";
                } else if (upperVal.includes("SUPERANNUATION")) {
                  choice = "Superannuation";
                }
                return { ...field, choice, value: valStr };
              }
              return field;
            });

            if (isMatched) {
              importCount++;
            }
          }
        });

        setPart1(updatedPart1);
        setPart2(updatedPart2);
        setSignatureName(sigName);
        setSignatureDesignation(sigDesg);
        setSignaturePhone(sigPhone);
        setSignatureDate(sigDate);
        setCheckedConfirmation(true);

        // Fetch employee Name to set default docket name
        const coName = updatedPart1.find(f => f.id === "p1_1")?.value || "";
        if (coName) {
          setCaseNameInput(`${coName} DAR Case Ledger`);
        }

        toast.success(`Success! Fully matched and imported ${importCount} parameters from spreadsheet.`);
      } catch (err) {
        console.error(err);
        toast.error("Spreadsheet format parsing failed. Verify elements are in row format.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  // Generate Sample template mapping standard parameters
  const downloadSampleExcel = () => {
    const wsData = [
      ["CHECK LIST FOR HANDING OVER THE D&AR CASES TO HQ/MLG IN RESPECT OF NON-GAZETTED"],
      ["PART-I:: SERVICE AND RELATED PARTICULARS"],
      ["Parameter / Fixed Question", "Response Text / Value Fill"],
      ...part1.map(f => [f.label, f.value || ""]),
      [],
      ["PART-II DETAILS OF THE CASE RECORDS"],
      ["Parameter / Fixed Question Question", "Response Status or Folio"],
      ...part2.map(f => [f.label, f.value || (f.choice ? f.choice : "")]),
      [],
      ["CONFIRMATION SIGNATURE DETAILS"],
      ["Name in Block letters of the officer signing this Statement:", signatureName || ""],
      ["Designation of the officer:", signatureDesignation || ""],
      ["Telephone No:", signaturePhone || ""],
      ["Date:", signatureDate || ""]
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Checklist Template");
    XLSX.writeFile(wb, "KIR_DAR_HQ_Checklist_Template.xlsx");
    toast.success("Checklist Spreadsheet Template downloaded!");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleUpdatePart1Val = (id: string, value: string) => {
    setPart1(part1.map(f => f.id === id ? { ...f, value } : f));
  };

  const handleSelectDesignationPreset = (presetName: string) => {
    if (!presetName || presetName === "custom") return;
    const preset = RAILWAY_DESIGNATION_PRESETS.find(p => p.name === presetName);
    if (preset) {
      setPart1(prev => {
        return prev.map(f => {
          if (f.id === "p1_2_b") return { ...f, value: preset.name };
          if (f.id === "p1_2_a") return { ...f, value: preset.group };
          if (f.id === "p1_2_c") return { ...f, value: preset.payBand };
          if (f.id === "p1_2_d") return { ...f, value: preset.gradePay };
          if (f.id === "p1_3_a") return { ...f, value: preset.nextLowerPost };
          if (f.id === "p1_3_b") return { ...f, value: preset.nextLowerPayBandAndGradePay };
          return f;
        });
      });
      toast.success(`Preset applied for ${preset.name}! Auto-filled Group, Pay Band, Grade Pay, and next lower post details.`);
    }
  };

  const handleUpdatePart2Choice = (id: string, choice: any) => {
    setPart2(prev => {
      let updated = prev.map(f => {
        if (f.id === id) {
          let newChoice = choice;
          let newValue = f.value;

          // Custom toggle behavior for N/A-only choice fields (p2_19_b, p2_19_c, p2_22_c, p2_26_b, p2_26_c)
          if (["p2_19_b", "p2_19_c", "p2_22_c", "p2_26_b", "p2_26_c"].includes(id)) {
            if (f.choice === "N/A" && choice === "N/A") {
              newChoice = "";
              newValue = "";
            } else {
              newChoice = "N/A";
              newValue = "N/A";
            }
            return { ...f, choice: newChoice, value: newValue };
          }

          // Conditional text fields (e.g., input only shown on "Yes")
          const conditionalYesFields = ["p2_4_a", "p2_8", "p2_13_a", "p2_14", "p2_15_a", "p2_17_a", "p2_28_a"];
          if (conditionalYesFields.includes(id)) {
            if (choice !== "Yes") {
              newValue = choice; // Set to "No" or "N/A"
            } else {
              // Clear if switching back to "Yes" from "No"/"N/A" so user can type the page details
              if (f.value === "No" || f.value === "N/A" || !f.value) {
                newValue = "";
              }
            }
          } else {
            const hasInput = shouldShowTextInputForField(id, choice);
            if (!hasInput) {
              newValue = choice;
            }
          }
          return { ...f, choice: newChoice, value: newValue };
        }
        return f;
      });

      // Synchronize 4b ("p2_4_b") selection changes with 4c ("p2_4_c")
      if (id === "p2_4_b") {
        updated = updated.map(f => {
          if (f.id === "p2_4_c") {
            if (choice === "No") {
              return { ...f, choice: "N/A", value: "NA" };
            } else if (choice === "Yes") {
              return { ...f, choice: "Yes", value: (f.value === "NA" || f.value === "N/A") ? "" : f.value };
            }
          }
          return f;
        });
      }

      // Synchronize 6 ("p2_6") selection changes with 7 ("p2_7")
      if (id === "p2_6") {
        updated = updated.map(f => {
          if (f.id === "p2_7") {
            if (choice === "No") {
              return { ...f, choice: "N/A", value: "NA" };
            } else if (choice === "Yes") {
              return { ...f, choice: "Yes", value: (f.value === "NA" || f.value === "N/A") ? "" : f.value };
            }
          }
          return f;
        });
      }

      // Synchronize 9a ("p2_9_a") selection changes with 9b ("p2_9_b")
      if (id === "p2_9_a") {
        updated = updated.map(f => {
          if (f.id === "p2_9_b") {
            if (choice === "No") {
              return { ...f, choice: "N/A", value: "NA" };
            } else if (choice === "Yes") {
              return { ...f, choice: "Yes", value: (f.value === "NA" || f.value === "N/A") ? "" : f.value };
            }
          }
          return f;
        });
      }

      // Synchronize 10a ("p2_10_a") selection changes with 10b ("p2_10_b")
      if (id === "p2_10_a") {
        updated = updated.map(f => {
          if (f.id === "p2_10_b") {
            if (choice === "No") {
              return { ...f, choice: "N/A", value: "NA" };
            } else if (choice === "Yes") {
              return { ...f, choice: "Yes", value: (f.value === "NA" || f.value === "N/A") ? "" : f.value };
            }
          }
          return f;
        });
      }

      // Synchronize 11a ("p2_11_a") selection changes with 11b ("p2_11_b")
      if (id === "p2_11_a") {
        updated = updated.map(f => {
          if (f.id === "p2_11_b") {
            if (choice === "No") {
              return { ...f, choice: "N/A", value: "NA" };
            } else if (choice === "Yes") {
              return { ...f, choice: "Yes", value: (f.value === "NA" || f.value === "N/A") ? "" : f.value };
            }
          }
          return f;
        });
      }

      // Synchronize 12a ("p2_12_a") selection changes with 12b ("p2_12_b")
      if (id === "p2_12_a") {
        updated = updated.map(f => {
          if (f.id === "p2_12_b") {
            if (choice === "No") {
              return { ...f, choice: "N/A", value: "NA" };
            } else if (choice === "Yes") {
              return { ...f, choice: "Yes", value: (f.value === "NA" || f.value === "N/A") ? "" : f.value };
            }
          }
          return f;
        });
      }

      // Synchronize 17a ("p2_17_a") selection changes with 17b ("p2_17_b")
      if (id === "p2_17_a") {
        updated = updated.map(f => {
          if (f.id === "p2_17_b") {
            if (choice === "No" || choice === "N/A") {
              return { ...f, choice: "N/A", value: "NA" };
            } else if (choice === "Yes") {
              return { ...f, choice: "", value: (f.value === "NA" || f.value === "N/A") ? "" : f.value };
            }
          }
          return f;
        });
      }

      // Synchronize 17c ("p2_17_c") selection changes with 17d ("p2_17_d")
      if (id === "p2_17_c") {
        updated = updated.map(f => {
          if (f.id === "p2_17_d") {
            if (choice === "No" || choice === "N/A") {
              return { ...f, choice: "N/A", value: "NA" };
            } else if (choice === "Yes") {
              return { ...f, choice: "", value: (f.value === "NA" || f.value === "N/A") ? "" : f.value };
            }
          }
          return f;
        });
      }

      // Synchronize 19a ("p2_19_a") selection changes with 19b ("p2_19_b")
      if (id === "p2_19_a") {
        updated = updated.map(f => {
          if (f.id === "p2_19_b") {
            if (choice === "Yes" || choice === "N/A") {
              return { ...f, choice: "N/A", value: "NA" };
            } else if (choice === "No") {
              return { ...f, choice: "", value: (f.value === "NA" || f.value === "N/A") ? "" : f.value };
            }
          }
          return f;
        });
      }

      // Synchronize 22a ("p2_22_a") selection changes with 22b ("p2_22_b") and 22c ("p2_22_c")
      if (id === "p2_22_a") {
        updated = updated.map(f => {
          if (f.id === "p2_22_b") {
            if (choice === "N/A" || choice === "No") {
              return { ...f, choice: "N/A", value: "NA" };
            } else if (choice === "Yes") {
              return { ...f, choice: "", value: (f.value === "NA" || f.value === "N/A") ? "" : f.value };
            }
          }
          if (f.id === "p2_22_c") {
            if (choice === "N/A" || choice === "Yes") {
              return { ...f, choice: "N/A", value: "NA" };
            } else if (choice === "No") {
              return { ...f, choice: "", value: (f.value === "NA" || f.value === "N/A") ? "" : f.value };
            }
          }
          return f;
        });
      }

      // Synchronize 26a ("p2_26_a") selection changes with 26b ("p2_26_b") and 26c ("p2_26_c")
      if (id === "p2_26_a") {
        updated = updated.map(f => {
          if (f.id === "p2_26_b") {
            if (choice === "No" || choice === "N/A") {
              return { ...f, choice: "N/A", value: "NA" };
            } else if (choice === "Yes") {
              return { ...f, choice: "", value: (f.value === "NA" || f.value === "N/A") ? "" : f.value };
            }
          }
          if (f.id === "p2_26_c") {
            if (choice === "No" || choice === "N/A") {
              return { ...f, choice: "N/A", value: "NA" };
            } else if (choice === "Yes") {
              return { ...f, choice: "", value: (f.value === "NA" || f.value === "N/A") ? "" : f.value };
            }
          }
          return f;
        });
      }

      // Synchronize 28a ("p2_28_a") selection changes with 28b ("p2_28_b") and 28c ("p2_28_c")
      if (id === "p2_28_a") {
        updated = updated.map(f => {
          if (f.id === "p2_28_b") {
            if (choice === "No" || choice === "N/A") {
              return { ...f, choice: "N/A", value: "NA" };
            } else if (choice === "Yes") {
              return { ...f, choice: "", value: (f.value === "NA" || f.value === "N/A") ? "" : f.value };
            }
          }
          if (f.id === "p2_28_c") {
            if (choice === "No" || choice === "N/A") {
              return { ...f, choice: "N/A", value: "NA" };
            } else if (choice === "Yes") {
              return { ...f, choice: "", value: (f.value === "NA" || f.value === "N/A") ? "" : f.value };
            }
          }
          return f;
        });
      }

      // Synchronize 29a ("p2_29_a") selection changes with 29b ("p2_29_b")
      if (id === "p2_29_a") {
        updated = updated.map(f => {
          if (f.id === "p2_29_b") {
            if (choice === "No" || choice === "N/A") {
              return { ...f, choice: "N/A", value: "NA" };
            } else if (choice === "Yes") {
              return { ...f, choice: "", value: (f.value === "NA" || f.value === "N/A") ? "" : f.value };
            }
          }
          return f;
        });
      }

      return updated;
    });
  };

  const handleUpdatePart2Val = (id: string, value: string) => {
    setPart2(part2.map(f => f.id === id ? { ...f, value } : f));
  };

  const selectedGroup = part1.find(f => f.id === "p1_2_a")?.value || "";
  const filteredDesignationPresets = RAILWAY_DESIGNATION_PRESETS.filter(p => {
    if (selectedGroup === "Group 'C'") {
      return p.group === "Group 'C'";
    }
    if (selectedGroup === "Group 'D'") {
      return p.group === "Group 'D'";
    }
    return p.group === "Group 'C'" || p.group === "Group 'D'";
  });

  const filteredRequirements = filterCategory === "all" 
    ? DAR_REQUIREMENTS 
    : DAR_REQUIREMENTS.filter(r => r.category === filterCategory);

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-5 h-full overflow-hidden bg-slate-950 font-sans p-1">
      {/* Saved Cases Side Panel (Hidden on print) */}
      <div className="w-full md:w-64 bg-slate-900 border border-slate-800 p-4 rounded-xl shrink-0 flex flex-col gap-3 print:hidden max-h-[250px] md:max-h-full overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <FolderOpen className="text-amber-500 w-5 h-5" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              HQ Saved Cases
            </h3>
          </div>
          <button 
            onClick={loadDemoCase}
            className="text-[9px] font-black bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 px-1.5 py-0.5 rounded transition-all uppercase tracking-tight"
            title="Load the exact physical PDF sample to check formatting or click print."
          >
            Load Demo Check
          </button>
        </div>

        {/* Saved Items list */}
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto min-h-[100px] scrollbar-thin">
          <button
            onClick={handleResetForm}
            className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg text-xs font-bold transition-all border ${
              !selectedCaseId 
                ? "bg-violet-600/20 border-violet-500 text-violet-200" 
                : "bg-slate-950 border-slate-850 text-slate-400 hover:text-white"
            }`}
          >
            <span>+ Create New Case</span>
          </button>

          {casesList.map((item) => (
            <div
              key={item.id}
              onClick={() => handleLoadCase(item.id || "")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                selectedCaseId === item.id
                  ? "bg-amber-600/20 border-amber-500 text-amber-200"
                  : "bg-slate-950 border-slate-850 text-slate-400 hover:text-white"
              }`}
            >
              <span className="truncate flex-1 pr-1">{item.caseName}</span>
              <button
                onClick={(e) => handleDeleteCase(item.id || "", e)}
                className="p-1 text-slate-500 hover:text-red-500 hover:bg-slate-900 rounded transition-colors"
                title="Delete Case Permanent"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {casesList.length === 0 && (
            <div className="text-center py-6 text-slate-600 text-[10px] uppercase font-bold">
              No saved cases in Cloud.
            </div>
          )}
        </div>

        {/* Case Saving Action Group */}
        <div className="border-t border-slate-800 pt-3 mt-auto flex flex-col gap-2.5 shrink-0">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
              Active Case Title
            </label>
            <input
              type="text"
              value={caseNameInput}
              onChange={(e) => setCaseNameInput(e.target.value)}
              placeholder="e.g. Shri Anshu K. Case Docket"
              className="w-full bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded text-xs font-medium text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-550"
            />
          </div>
          <button
            onClick={handleSaveToDb}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-2 rounded text-xs transition-colors shadow-[0_2px_0_0_#92400e] active:translate-y-[1px] active:shadow-none uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Save to Cloud
          </button>
        </div>
      </div>

      {/* Main Panel Content Area */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-y-auto flex flex-col relative print:bg-white print:border-none print:text-black">
        {/* Tab Selection */}
        <div className="bg-slate-950/70 p-3 border-b border-slate-850 flex flex-col md:flex-row md:items-center justify-between shrink-0 print:hidden gap-3">
          <div className="flex gap-2 overflow-x-auto whitespace-nowrap scrollbar-none py-1">
            <button
              onClick={() => setActiveSubTab("dar_index_form")}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === "dar_index_form"
                  ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/50"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-transparent"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              DAR Case Index Form (केस इंडेक्स)
            </button>
            <button
              onClick={() => setActiveSubTab("checklist_index")}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === "checklist_index"
                  ? "bg-amber-600/30 text-amber-300 border border-amber-500/50"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-transparent"
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              Active Checklist Form
            </button>
            <button
              onClick={() => setActiveSubTab("dar_procedure")}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSubTab === "dar_procedure"
                  ? "bg-violet-600/30 text-violet-300 border border-violet-500/50"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-transparent"
              }`}
            >
              <Layers2 className="w-4 h-4" />
              DAR Procedure
            </button>
          </div>

          <div className="text-right text-[10px] text-slate-500 font-extrabold tracking-widest uppercase">
            KIR D&AR SUBMISSION
          </div>
        </div>

        {/* RENDER TAB 1: DAR PROCEDURE (WIZARD & CHANNEL BUILDER) */}
        {activeSubTab === "dar_procedure" && (
          <DarProcedureHub />
        )}

        {/* RENDER TAB 1: DAR PROCEDURE (WIZARD & CHANNEL BUILDER) - MOVED TO MODULAR HUB */}
        {false && activeSubTab === "dar_procedure" && (
          <div className="flex-1 flex flex-col overflow-y-auto p-4 gap-6 animate-fadeIn">
            {/* INLINE WIZARD */}
            {true ? (
              <div className="flex-1 flex flex-col gap-6">
                {/* D&AR Interactive Procedure Hub - Dynamic Inline Wizard */}
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-violet-600/35 text-violet-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded border border-violet-500/30">
                        OFFICE USE ONLY
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white flex items-center gap-2 mt-1.5 font-sans tracking-tight uppercase">
                      <Layers className="text-violet-500 w-5 h-5 animate-pulse" />
                      D&AR Step-by-Step Decision Advisor
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                      An interactive compliance flowchart guiding you through Railway Board statutory procedures step-by-step.
                    </p>
                  </div>
                  <div className="flex gap-2 relative z-10 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPopupNodeId("start");
                        setPopupHistory([]);
                        toast.info("Process restarted from scratch");
                      }}
                      className="bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-black transition-all hover:bg-slate-800 uppercase tracking-wider flex items-center gap-1.5 justify-center cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restart Procedure
                    </button>
                  </div>
                </div>

                {/* Interactive Dynamic Wizard Container */}
                <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col lg:flex-row gap-5 min-h-0">
                  {/* Active Question & Decisions */}
                  <div className="flex-1 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between overflow-hidden relative min-h-[380px]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="space-y-5 relative z-10">
                      {/* Diagnostic Path Tracker */}
                      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-slate-950 border border-slate-850/80 rounded-xl">
                        <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400 font-mono">
                          <span className="font-extrabold text-slate-500 uppercase tracking-wider shrink-0 mr-1">Path trace:</span>
                          <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-semibold text-slate-400">Start</span>
                          {popupHistory.map((histId, idx) => {
                            const node = DAR_UNIFIED_TREE[histId];
                            const label = node ? node.question.substring(0, 18) + "..." : histId;
                            return (
                              <div key={idx} className="flex items-center gap-1 shrink-0">
                                <span className="text-slate-600 font-bold">→</span>
                                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800/60 font-semibold text-slate-300 animate-fadeIn">
                                  {label}
                                </span>
                              </div>
                            );
                          })}
                          <span className="text-slate-600 font-bold">→</span>
                          <span className="text-amber-400 font-extrabold uppercase animate-pulse">Current Question</span>
                        </div>

                        {popupHistory.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const last = popupHistory[popupHistory.length - 1];
                              setPopupHistory(prev => prev.slice(0, -1));
                              setCurrentPopupNodeId(last);
                            }}
                            className="text-[10px] font-black bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-350 hover:text-white px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0"
                            title="Go back one decision step"
                          >
                            <ArrowLeft className="w-3 h-3" />
                            Back
                          </button>
                        )}
                      </div>

                      {/* Header Citations and Limits */}
                      {(() => {
                        const activeNode = DAR_UNIFIED_TREE[currentPopupNodeId] || DAR_UNIFIED_TREE["start"];
                        return (
                          <div className="flex flex-wrap items-center gap-2">
                            {activeNode.regulatoryReference && (
                              <span className="font-extrabold text-amber-500 text-[10px] uppercase tracking-wide flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-850/80">
                                <Layers className="w-3.5 h-3.5 shrink-0" />
                                Citation: {activeNode.regulatoryReference}
                              </span>
                            )}
                            {activeNode.timelineNotice && (
                              <span className="font-extrabold text-red-500 text-[10px] uppercase tracking-wide flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-850/80 animate-pulse">
                                <Calendar className="w-3.5 h-3.5 shrink-0" />
                                Timeline: {activeNode.timelineNotice}
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {/* Active Question Box */}
                      {(() => {
                        const activeNode = DAR_UNIFIED_TREE[currentPopupNodeId] || DAR_UNIFIED_TREE["start"];
                        return (
                          <div className="space-y-4">
                            <div className="flex items-start gap-3.5">
                              <span className="bg-violet-600/20 text-violet-300 border border-violet-500/30 rounded-xl w-7 h-7 flex items-center justify-center text-xs font-mono font-black shrink-0 shadow-inner">
                                Q
                              </span>
                              <div className="space-y-1 mt-0.5">
                                <h4 className="text-sm font-bold text-white font-sans tracking-tight leading-snug">
                                  {activeNode.question}
                                </h4>
                              </div>
                            </div>

                            {/* Options Buttons */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                              {activeNode.options.map((opt, oIdx) => (
                                <button
                                  type="button"
                                  key={oIdx}
                                  onClick={() => {
                                    if (opt.target) {
                                      setPopupHistory(prev => [...prev, currentPopupNodeId]);
                                      setCurrentPopupNodeId(opt.target);
                                      if (opt.infoText) {
                                        toast.info(opt.infoText);
                                      }
                                    } else {
                                      toast.success("Case finalized! Return to starting question.");
                                      setCurrentPopupNodeId("start");
                                      setPopupHistory([]);
                                    }
                                  }}
                                  className="p-4 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-violet-500/50 rounded-xl text-left text-xs font-bold text-slate-200 hover:text-white transition-all duration-200 flex items-start gap-3 group/opt cursor-pointer shadow-md hover:shadow-violet-600/5 hover:-translate-y-[1px]"
                                >
                                  <div className="w-5 h-5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[10px] flex items-center justify-center font-bold group-hover/opt:bg-violet-600 group-hover/opt:border-violet-500 group-hover/opt:text-white shrink-0 mt-0.5 transition-all">
                                    {String.fromCharCode(65 + oIdx)}
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="group-hover/opt:text-violet-300 transition-colors block leading-tight">
                                      {opt.text}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Bottom Status Panel */}
                    <div className="mt-6 border-t border-slate-850 pt-3.5 text-center flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">
                      <span>D&AR Dynamic Compliance Advisor</span>
                      <span className="text-violet-400 px-2 py-0.5 bg-slate-950 rounded-lg border border-slate-850">
                        Node: {currentPopupNodeId}
                      </span>
                    </div>
                  </div>

                  {/* Right Hand Static Information / Custom Advice Memo Panel */}
                  <div className="w-full lg:w-80 bg-slate-950 border border-slate-855 p-5 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden min-h-[300px]">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider border-b border-slate-850 pb-2.5 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-emerald-500 animate-pulse" />
                        Compliance Advice Note
                      </h4>

                      {(() => {
                        const activeNode = DAR_UNIFIED_TREE[currentPopupNodeId] || DAR_UNIFIED_TREE["start"];
                        if (activeNode.advice) {
                          return (
                            <div className="space-y-3 flex-1 flex flex-col justify-between">
                              <p className="text-xs text-slate-350 leading-relaxed font-semibold p-3.5 bg-slate-900/60 border-l-[3px] border-emerald-500 rounded-r-xl whitespace-pre-line">
                                {activeNode.advice}
                              </p>
                              
                              <button
                                type="button"
                                onClick={() => {
                                  const textToCopy = `Indian Railways D&AR Advisory Draft\nNode: ${currentPopupNodeId.toUpperCase()}\nReference: ${activeNode.regulatoryReference || "Rule Book"}\nInstructions: ${activeNode.advice}`;
                                  navigator.clipboard.writeText(textToCopy);
                                  toast.success("Advisory note text copied to clipboard!");
                                }}
                                className="w-full bg-emerald-600/10 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/20 px-3.5 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap tracking-wider transition-all cursor-pointer flex items-center gap-1.5 justify-center shadow-sm"
                              >
                                Copy Advice Note
                              </button>
                            </div>
                          );
                        } else {
                          return (
                            <div className="text-slate-500 text-[11px] leading-relaxed uppercase py-8 text-center space-y-2 border border-dashed border-slate-850 rounded-xl px-4 font-mono font-bold">
                              <span>No advisory alert active for this question node.</span>
                              <span className="block text-[9px] text-slate-600 font-medium normal-case">
                                Choose one of the branching options to resolve advice memos, regulatory notes, and statutory instructions.
                              </span>
                            </div>
                          );
                        }
                      })()}
                    </div>

                    {/* Simple Help Info Graphic block at bottom */}
                    <div className="border-t border-slate-850 pt-4 mt-6 text-[10px] text-slate-500 leading-normal uppercase font-mono">
                      <span className="font-extrabold text-emerald-400 block mb-1">How it works:</span>
                      Select a response to progress through branches instantly. Press <strong className="text-slate-350">Back</strong> or <strong className="text-slate-350">Restart</strong> any time.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Edit Mode Flow Builder Content */
              <div className="flex-1 flex flex-col gap-6 p-4">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-lg">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <Settings className="text-amber-500 w-5 h-5 animate-spin" />
                      DAR Procedure Channel Builder
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">
                      Define interactive steps, link choices to branching child nodes, and write tips
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleResetProcedureToDefault}
                      className="bg-slate-900 border border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-slate-800 cursor-pointer"
                    >
                      Reset to Defaults
                    </button>
                    <button
                      onClick={() => setIsEditMode(false)}
                      className="bg-slate-900 border border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProcedureToCloud}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-xs font-black transition-all shadow-[0_2.5px_0_0_#4338ca] active:translate-y-[1.5px] active:shadow-none uppercase tracking-widest flex items-center gap-1 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Fix & Save
                    </button>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">
                  {/* List of Steps */}
                  <div className="flex-1 flex flex-col gap-4 min-h-0">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800 shrink-0">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wide">
                        Configured Steps ({procedureSteps.length})
                      </h4>
                      <button
                        onClick={handleAddStep}
                        className="text-xs bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 border border-violet-500/30 px-3 py-1.5 rounded-lg font-black transition-all uppercase tracking-wide cursor-pointer flex items-center gap-1.5 active:translate-y-[1px]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add New Step
                      </button>
                    </div>

                    <div className="space-y-4 overflow-y-auto pr-1 flex-1">
                      {procedureSteps.map((step) => {
                        const isEditing = editingStepId === step.id;

                        return (
                          <div
                            key={step.id}
                            className={`bg-slate-900 border rounded-xl p-4 transition-all relative ${
                              isEditing ? "border-violet-500 ring-1 ring-violet-500/20 bg-slate-900/90" : "border-slate-800 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2.5 mb-3.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-500 font-mono font-bold uppercase">
                                  ID: {step.id}
                                </span>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={step.id}
                                    onChange={(e) => {
                                      const oldId = step.id;
                                      const newId = e.target.value.replace(/[^a-zA-Z0-9_\-]/g, "");
                                      if (!newId) return;
                                      setProcedureSteps(prev => prev.map(s => {
                                        if (s.id === oldId) return { ...s, id: newId };
                                        return s;
                                      }));
                                      // Update links pointing to old ID
                                      setProcedureSteps(prev => prev.map(s => ({
                                        ...s,
                                        options: s.options.map(o => o.nextStepId === oldId ? { ...o, nextStepId: newId } : o)
                                      })));
                                      setEditingStepId(newId);
                                    }}
                                    className="bg-slate-950 border border-slate-850 rounded px-2 py-0.5 text-xs font-mono font-bold text-violet-400 focus:outline-none"
                                    title="Edit internal Step ID (automatically updates matching path links)"
                                  />
                                ) : null}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setEditingStepId(isEditing ? null : step.id)}
                                  className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                    isEditing ? "bg-violet-600 text-white" : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                                  }`}
                                >
                                  {isEditing ? "Done" : "Configure Options"}
                                </button>
                                <button
                                  onClick={() => handleDeleteStep(step.id)}
                                  className="p-1.5 bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900 hover:text-white rounded transition-colors cursor-pointer"
                                  title="Delete this step permanently"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1 tracking-wider">
                                  Question / Header Label
                                </label>
                                <input
                                  type="text"
                                  value={step.question}
                                  onChange={(e) => handleUpdateStepQuestion(step.id, e.target.value)}
                                  placeholder="e.g. Was SF 1 Issued?"
                                  className="w-full bg-slate-950 border border-slate-850 px-3 py-2 rounded text-xs text-white focus:ring-1 focus:ring-violet-500 focus:outline-none"
                                />
                              </div>

                              {isEditing && (
                                <div className="border-t border-slate-800/60 pt-3 mt-3.5 space-y-3.5 animate-fadeIn">
                                  <div className="flex items-center justify-between">
                                    <strong className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                      Options & Branches (Answers)
                                    </strong>
                                    <button
                                      onClick={() => handleAddOptionToStep(step.id)}
                                      className="text-[10px] bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded font-black transition-colors pointer-events-auto"
                                    >
                                      + Add Option
                                    </button>
                                  </div>

                                  <div className="space-y-3 font-semibold text-xs">
                                    {step.options.map((opt) => (
                                      <div
                                        key={opt.id}
                                        className="bg-slate-950 border border-slate-850 p-3 rounded-lg relative space-y-2.5"
                                      >
                                        <button
                                          onClick={() => handleDeleteOption(step.id, opt.id)}
                                          className="absolute top-2 right-2 text-slate-500 hover:text-red-500 p-1 cursor-pointer"
                                          title="Remove option"
                                        >
                                          <Trash2 className="w-3" />
                                        </button>

                                        <div className="grid grid-cols-2 gap-2.5">
                                          <div>
                                            <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1 leading-none">
                                              Option Button Text
                                            </label>
                                            <input
                                              type="text"
                                              value={opt.text}
                                              onChange={(e) => handleUpdateOptionText(step.id, opt.id, e.target.value)}
                                              placeholder="e.g. Yes"
                                              className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded text-xs text-white uppercase font-bold"
                                            />
                                          </div>

                                          <div>
                                            <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1 leading-none">
                                              Target Branch (Next Question)
                                            </label>
                                            <select
                                              value={opt.nextStepId || ""}
                                              onChange={(e) => handleUpdateOptionNextStep(step.id, opt.id, e.target.value)}
                                              className="w-full bg-slate-900 border border-slate-800 px-2 py-1.5 rounded text-xs select-none"
                                            >
                                              <option value="">-- Terminal End --</option>
                                              {procedureSteps.filter(s => s.id !== step.id).map((s) => (
                                                <option key={s.id} value={s.id}>
                                                  ({s.id}) {s.question.slice(0, 35)}...
                                                </option>
                                              ))}
                                            </select>
                                          </div>
                                        </div>

                                        <div>
                                          <label className="block text-[8px] font-bold text-slate-500 uppercase mb-1 leading-none">
                                            Statutory Tip / Action advice
                                          </label>
                                          <textarea
                                            value={opt.infoText}
                                            onChange={(e) => handleUpdateOptionInfo(step.id, opt.id, e.target.value)}
                                            placeholder="Write full legal advice, references, timing limits etc."
                                            rows={2}
                                            className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded text-xs text-slate-300 resize-none font-semibold"
                                          />
                                        </div>
                                      </div>
                                    ))}

                                    {step.options.length === 0 && (
                                      <div className="text-center py-4 text-[10px] text-slate-650 bg-slate-950 rounded border border-dashed border-slate-850 uppercase font-bold">
                                        No options configured. Add options to build dynamic branches!
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Visual map guide panel on right */}
                  <div className="w-full lg:w-72 bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col gap-3.5 shrink-0 max-h-[500px]">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider border-b border-slate-850 pb-1.5 flex items-center gap-1">
                      <HelpCircle className="w-4 h-4 text-emerald-500" />
                      Branching Guide
                    </h4>
                    <div className="text-[11px] text-slate-400 space-y-2.5 leading-relaxed overflow-y-auto w-full">
                      <p>
                        1. **Sequential Chain**: To connect Step A to Step B, link Step A's option target to **Step B**.
                      </p>
                      <p>
                        2. **Advisory Notes**: Write clear legal guidelines in the Option Advice box. It will format dynamically as a highlighted warning indicator in real-time.
                      </p>
                      <p>
                        3. **Fix and Lock**: Click **Fix & Save** to persist custom structures in your Firestore database. Once saved, it will synchronise cleanly under Office Use only.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {false && (
              <div className="flex-1 flex flex-col gap-6 p-4">
                {/* Hub Header */}
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="bg-violet-600/35 text-violet-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded border border-violet-500/30">
                        OFFICE USE ONLY
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2 mt-1.5">
                      <Layers className="text-violet-500 w-5 h-5 animate-pulse" />
                      D&AR Interactive Procedure Hub
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                      Select a statutory procedural category below to open a specialized guide workflow.
                    </p>
                  </div>
                  <div className="flex gap-2 relative z-10 shrink-0">
                    {isAdmin && (
                      <button
                        onClick={() => setIsEditMode(true)}
                        className="bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-550 hover:to-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-[0_2.5px_0_0_#4c1d95] active:translate-y-[1.5px] active:shadow-none uppercase tracking-wider flex items-center gap-1.5 justify-center cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Edit Flow Builder
                      </button>
                    )}
                  </div>
                </div>

                {/* Dashboard Category grid of Popups */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto w-full flex-1">
                  {/* SF-5 Card */}
                  <div 
                    onClick={() => {
                      setActivePopupType("sf5");
                      setCurrentPopupNodeId("start");
                      setPopupHistory([]);
                    }}
                    className="bg-slate-900 border border-slate-800 hover:border-violet-500 rounded-2xl p-5 cursor-pointer shadow-lg hover:shadow-violet-600/5 transition-all group relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full blur-2xl group-hover:bg-violet-600/10 transition-colors" />
                    <div>
                      <div className="flex items-center justify-between mb-3.5">
                        <span className="text-[10px] bg-violet-900/30 text-violet-300 border border-violet-800/40 px-2.5 py-1 rounded-md font-mono font-bold uppercase tracking-wider">
                          FORM SF-5
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold">
                          1
                        </div>
                      </div>
                      <h4 className="text-sm font-black text-white group-hover:text-violet-300 transition-colors uppercase">
                        Major Penalty Procedure Advisor
                      </h4>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        Navigate step-by-step through the formal inquiry flowchart, statutory 10-day, 15-day, and 180-day review cycles, defense considerations, and ex-parte defaults.
                      </p>
                    </div>
                    <div className="border-t border-slate-850 pt-3.5 mt-5 flex justify-between items-center text-[10px] uppercase font-bold text-violet-400">
                      <span>Launch interactive popup</span>
                      <span className="text-xs">→</span>
                    </div>
                  </div>

                  {/* SF-11 Card */}
                  <div 
                    onClick={() => {
                      setActivePopupType("sf11");
                      setCurrentPopupNodeId("start");
                      setPopupHistory([]);
                    }}
                    className="bg-slate-900 border border-slate-800 hover:border-emerald-500 rounded-2xl p-5 cursor-pointer shadow-lg hover:shadow-emerald-600/5 transition-all group relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/5 rounded-full blur-2xl group-hover:bg-emerald-600/10 transition-colors" />
                    <div>
                      <div className="flex items-center justify-between mb-3.5">
                        <span className="text-[10px] bg-emerald-900/30 text-emerald-300 border border-emerald-800/40 px-2.5 py-1 rounded-md font-mono font-bold uppercase tracking-wider">
                          FORM SF-11
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                          2
                        </div>
                      </div>
                      <h4 className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors uppercase">
                        Minor Penalty Procedure Advisor
                      </h4>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        Examine requirements for censure, withholding of promotion, or recovery of pecuniary loss, and verify when formal inquiry under Rule 11(2) is mandatory.
                      </p>
                    </div>
                    <div className="border-t border-slate-850 pt-3.5 mt-5 flex justify-between items-center text-[10px] uppercase font-bold text-emerald-400">
                      <span>Launch interactive popup</span>
                      <span className="text-xs">→</span>
                    </div>
                  </div>

                  {/* SF-1 Card */}
                  <div 
                    onClick={() => {
                      setActivePopupType("sf1");
                      setCurrentPopupNodeId("start");
                      setPopupHistory([]);
                    }}
                    className="bg-slate-900 border border-slate-800 hover:border-amber-500 rounded-2xl p-5 cursor-pointer shadow-lg hover:shadow-amber-600/5 transition-all group relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-600/5 rounded-full blur-2xl group-hover:bg-amber-600/10 transition-colors" />
                    <div>
                      <div className="flex items-center justify-between mb-3.5">
                        <span className="text-[10px] bg-amber-900/30 text-amber-300 border border-amber-800/40 px-2.5 py-1 rounded-md font-mono font-bold uppercase tracking-wider">
                          FORM SF-1 / SF-2
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold">
                          3
                        </div>
                      </div>
                      <h4 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors uppercase">
                        Suspension & Subsistence Monitor
                      </h4>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        Check Rule 4 parameters, prevent automatic suspension lapse past 90 days, administer Review Board extensions, and track subsistence adjustments after 3 months.
                      </p>
                    </div>
                    <div className="border-t border-slate-850 pt-3.5 mt-5 flex justify-between items-center text-[10px] uppercase font-bold text-amber-400">
                      <span>Launch interactive popup</span>
                      <span className="text-xs">→</span>
                    </div>
                  </div>

                  {/* Custom Stepper Card */}
                  <div 
                    onClick={() => {
                      setActivePopupType("custom");
                      setSelectedOptions({});
                    }}
                    className="bg-slate-900 border border-slate-800 hover:border-violet-500 rounded-2xl p-5 cursor-pointer shadow-lg hover:shadow-violet-600/5 transition-all group relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 rounded-full blur-2xl group-hover:bg-violet-600/10 transition-colors" />
                    <div>
                      <div className="flex items-center justify-between mb-3.5">
                        <span className="text-[10px] bg-slate-950 text-slate-300 border border-slate-800 px-2.5 py-1 rounded-md font-mono font-bold uppercase tracking-wider">
                          LIVE RUNNER
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold">
                          4
                        </div>
                      </div>
                      <h4 className="text-sm font-black text-white group-hover:text-violet-300 transition-colors uppercase">
                        Custom Workflow Walker
                      </h4>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                        Test and dry-run your custom designed step-by-step logic nodes and advice memos configured within the dynamic Flow Builder, opening as an immersive screen popup.
                      </p>
                    </div>
                    <div className="border-t border-slate-850 pt-3.5 mt-5 flex justify-between items-center text-[10px] uppercase font-bold text-violet-400">
                      <span>Launch custom popup</span>
                      <span className="text-xs">→</span>
                    </div>
                  </div>
                </div>

                {/* ANIMATED POPUP OVERLAYS */}
                <AnimatePresence>
                  {activePopupType && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        transition={{ duration: 0.2 }}
                        className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-750 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col gap-4 max-h-[90vh]"
                      >
                        {/* Immersive glowing category border line at top */}
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                          activePopupType === "sf5" ? "from-violet-600 to-indigo-650" :
                          activePopupType === "sf11" ? "from-emerald-600 to-teal-650" :
                          activePopupType === "sf1" ? "from-amber-600 to-orange-550" :
                          "from-violet-500 to-pink-500"
                        }`} />

                        {/* Top close or back bar */}
                        <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded ${
                              activePopupType === "sf5" ? "bg-violet-900/30 text-violet-300 border border-violet-800/40" :
                              activePopupType === "sf11" ? "bg-emerald-900/30 text-emerald-300 border border-emerald-800/40" :
                              activePopupType === "sf1" ? "bg-amber-900/30 text-amber-300 border border-amber-800/40" :
                              "bg-slate-950 text-slate-300 border border-slate-850"
                            }`}>
                              {activePopupType === "sf5" ? "Major SF-5 Advisor" :
                               activePopupType === "sf11" ? "Minor SF-11 Advisor" :
                               activePopupType === "sf1" ? "Suspension Advisor" :
                               "Custom Step Walkthrough"}
                            </span>
                            {activePopupType !== "custom" && (
                              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">
                                Parent Option: {currentPopupNodeId}
                              </span>
                            )}
                          </div>
                          
                          <button
                            onClick={() => setActivePopupType(null)}
                            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Close Popup"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* RENDER POPUP FORM: CUSTOM STEPS SYSTEM */}
                        {activePopupType === "custom" ? (
                          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
                            {(() => {
                              const visibleSteps: ProcedureStep[] = [];
                              if (procedureSteps.length > 0) {
                                let currentStep: ProcedureStep | undefined = procedureSteps[0];
                                while (currentStep) {
                                  visibleSteps.push(currentStep);
                                  const chosenOptionId = selectedOptions[currentStep.id];
                                  if (chosenOptionId) {
                                    const selectedOption = currentStep.options.find(o => o.id === chosenOptionId);
                                    if (selectedOption && selectedOption.nextStepId) {
                                      const next = procedureSteps.find(s => s.id === selectedOption.nextStepId);
                                      if (next && !visibleSteps.some(v => v.id === next.id)) {
                                        currentStep = next;
                                      } else {
                                        currentStep = undefined;
                                      }
                                    } else {
                                      currentStep = undefined;
                                    }
                                  } else {
                                    currentStep = undefined;
                                  }
                                }
                              }

                              const currentActiveStep = visibleSteps[visibleSteps.length - 1];

                              return (
                                <div className="space-y-4">
                                  {/* Render Steps in path tracker */}
                                  <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-950/70 border border-slate-850 rounded-xl text-[10px] text-slate-400">
                                    <span className="font-bold uppercase text-slate-500">Completed Steps:</span>
                                    {visibleSteps.slice(0, -1).map((s, idx) => (
                                      <div key={s.id} className="flex items-center gap-1">
                                        <span className="bg-slate-900 border border-slate-800 text-slate-350 px-1.5 py-0.5 rounded font-medium">
                                          {(idx + 1)}. {s.question.slice(0, 15)}...
                                        </span>
                                        <span className="text-slate-650">→</span>
                                      </div>
                                    ))}
                                    {currentActiveStep ? (
                                      <span className="text-amber-400 font-extrabold uppercase">
                                        {(visibleSteps.length)}. CURRENT STEP
                                      </span>
                                    ) : (
                                      <span className="text-emerald-400 font-black">✔ DECISION COMPLETE</span>
                                    )}
                                  </div>

                                  {currentActiveStep ? (
                                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
                                      <div className="flex items-center gap-2">
                                        <span className="w-5 h-5 bg-violet-600/30 text-violet-400 border border-violet-500/30 rounded-lg flex items-center justify-center text-xs font-black">
                                          Q
                                        </span>
                                        <h4 className="text-sm font-black text-white uppercase tracking-wide">
                                          {currentActiveStep.question}
                                        </h4>
                                      </div>

                                      {/* Sub-options (Buttons) inside this active option step */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                                        {currentActiveStep.options.map((opt) => {
                                          const isChoice = selectedOptions[currentActiveStep.id] === opt.id;
                                          return (
                                            <button
                                              key={opt.id}
                                              onClick={() => {
                                                const newSels: Record<string, string> = { ...selectedOptions };
                                                newSels[currentActiveStep.id] = opt.id;
                                                setSelectedOptions(newSels);
                                              }}
                                              className={`p-3 rounded-xl text-left text-xs font-bold transition-all border flex items-start gap-2.5 cursor-pointer ${
                                                isChoice
                                                  ? "bg-violet-600/25 border-violet-500 text-violet-200"
                                                  : "bg-slate-950 border-slate-850 hover:border-slate-750 text-slate-300 hover:text-white"
                                              }`}
                                            >
                                              <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                                                isChoice ? "bg-violet-600 border-transparent" : "border-slate-700"
                                              }`}>
                                                {isChoice && <Check className="w-2.5 h-2.5 text-white" />}
                                              </span>
                                              <div className="space-y-0.5">
                                                <span>{opt.text}</span>
                                                {opt.infoText && (
                                                  <span className="block text-[10px] text-slate-500 font-medium normal-case leading-snug">
                                                    {opt.infoText.slice(0, 75)}...
                                                  </span>
                                                )}
                                              </div>
                                            </button>
                                          );
                                        })}
                                      </div>

                                      {/* selected option advice text */}
                                      {selectedOptions[currentActiveStep.id] && (() => {
                                        const opt = currentActiveStep.options.find(o => o.id === selectedOptions[currentActiveStep.id]);
                                        if (opt && opt.infoText) {
                                          return (
                                            <div className="bg-slate-950/85 p-4 rounded-xl border border-slate-850 mt-4 flex items-start gap-3">
                                              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-bounce" />
                                              <div className="space-y-1">
                                                <strong className="text-amber-400 font-black uppercase text-[9px] tracking-wider block">
                                                  Compliance Directive Advice:
                                                </strong>
                                                <p className="text-slate-300 text-xs leading-relaxed font-semibold">
                                                  {opt.infoText}
                                                </p>
                                              </div>
                                            </div>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 bg-slate-950/40 border border-slate-800 rounded-2xl">
                                      <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2.5 animate-pulse" />
                                      <h4 className="text-sm font-black text-white uppercase tracking-widest">
                                        End of Custom Decision Walk
                                      </h4>
                                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto uppercase">
                                        All logical branching steps in this Custom path completed successfully with compliant values!
                                      </p>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between border-t border-slate-850 pt-4">
                                    <button
                                      onClick={() => {
                                        setSelectedOptions({});
                                        toast.info("Custom Walker timeline reset!");
                                      }}
                                      className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      Reset Path
                                    </button>
                                    <button
                                      onClick={() => setActivePopupType(null)}
                                      className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-650 text-white rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer"
                                    >
                                      Close Custom Walker
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          /* RENDER POPUP FORM: STATIC RICH RAILWAY BOARD LAWS (SF-5/SF-11/SF-1) */
                          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
                            {(() => {
                              const tree = POPUP_DECISION_TREES[activePopupType as "sf5" | "sf11" | "sf1"];
                              if (!tree) return null;
                              
                              const activeNode = tree[currentPopupNodeId] || tree["start"];
                              const totalNodesInHistory = popupHistory.length;

                              return (
                                <div className="space-y-4">
                                  {/* Progress path tracker with back button */}
                                  <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-850 rounded-xl">
                                    <div className="flex items-center gap-1.5 flex-wrap overflow-hidden text-[10px] text-slate-400">
                                      <span className="font-black text-slate-500 uppercase tracking-tight shrink-0">Path Trace:</span>
                                      <span className="bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800">Start</span>
                                      {popupHistory.map((histId, idx) => (
                                        <div key={histId} className="flex items-center gap-1 shrink-0">
                                          <span>→</span>
                                          <span className="bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800 truncate max-w-[80px]">
                                            {histId}
                                          </span>
                                        </div>
                                      ))}
                                      <span>→</span>
                                      <span className="text-amber-400 font-extrabold uppercase animate-pulse">
                                        Current Node
                                      </span>
                                    </div>

                                    {totalNodesInHistory > 0 && (
                                      <button
                                        onClick={() => {
                                          if (popupHistory.length > 0) {
                                            const prev = popupHistory[popupHistory.length - 1];
                                            setPopupHistory(popupHistory.slice(0, popupHistory.length - 1));
                                            setCurrentPopupNodeId(prev);
                                          }
                                        }}
                                        className="text-[10px] font-black bg-slate-900 border border-slate-800 text-slate-350 hover:text-white px-2.5 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer shrink-0 ml-2"
                                        title="Navigate to previous step option"
                                      >
                                        <ArrowLeft className="w-3 h-3" />
                                        Back
                                      </button>
                                    )}
                                  </div>

                                  {/* Active advisory header citations inside the popup */}
                                  <div className="flex flex-wrap items-center gap-3.5 shrink-0 text-[10px]">
                                    {activeNode.regulatoryReference && (
                                      <span className="font-extrabold text-amber-500 flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-850">
                                        <Layers className="w-3.5 h-3.5 shrink-0" />
                                        Citation: {activeNode.regulatoryReference}
                                      </span>
                                    )}
                                    {activeNode.timelineNotice && (
                                      <span className="font-extrabold text-red-400 flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-850">
                                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                                        Duration Limit: {activeNode.timelineNotice}
                                      </span>
                                    )}
                                  </div>

                                  {/* Question / Directive content */}
                                  <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-5 space-y-4">
                                    {activeNode.advice ? (
                                      /* Advice layout - Glowing warning container */
                                      <div className="space-y-3.5">
                                        <div className="flex items-start gap-3">
                                          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                                          <div className="space-y-1">
                                            <h4 className="text-sm font-black text-amber-400 uppercase tracking-wide">
                                              {activeNode.question}
                                            </h4>
                                            
                                          </div>
                                        </div>
                                        
                                        <p className="text-slate-200 text-xs font-semibold leading-relaxed p-4 bg-slate-950/80 border-l-2 border-amber-500 rounded-r-lg">
                                          {activeNode.advice}
                                        </p>

                                        {/* Auto copy speaking draft for convenience */}
                                        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-850 flex items-center justify-between gap-3 text-[11px] text-slate-400">
                                          <div className="truncate">
                                            <span className="font-bold uppercase text-slate-500 text-[10px] block mb-0.5">Quick Copy File Order Note:</span>
                                            <span className="italic font-mono text-[10px]">D&AR Order Draft Ref: Rules of Railway Board context</span>
                                          </div>
                                          <button
                                            onClick={() => {
                                              const textToCopy = `Indian Railways D&AR Advisory Draft\nCategory: ${activePopupType?.toUpperCase()}\nReference: ${activeNode.regulatoryReference || "Rule Book"}\nInstructions: ${activeNode.advice}`;
                                              navigator.clipboard.writeText(textToCopy);
                                              toast.success("Draft text successfully copied to clipboard!");
                                            }}
                                            className="bg-violet-600/25 hover:bg-violet-600 text-violet-350 hover:text-white border border-violet-500/20 px-3 py-1.5 rounded text-[10px] font-black uppercase whitespace-nowrap tracking-wide transition-all cursor-pointer"
                                          >
                                            Copy Draft
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      /* Regular Question interactive layout inside the popup */
                                      <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                          <span className="bg-violet-600/30 text-violet-400 border border-violet-500/30 rounded-lg w-5 h-5 flex items-center justify-center text-[10px] font-mono font-black shrink-0 mt-0.5">
                                            Q
                                          </span>
                                          <div className="space-y-1">
                                            <h4 className="text-sm font-black text-white tracking-wide uppercase leading-tight">
                                              {activeNode.question}
                                            </h4>
                                            
                                          </div>
                                        </div>

                                        {/* Sub-options inside option logic */}
                                        <div className="grid grid-cols-1 gap-3 pt-2">
                                          {activeNode.options.map((opt, oIdx) => (
                                            <button
                                              key={oIdx}
                                              onClick={() => {
                                                if (opt.target) {
                                                  setPopupHistory(prev => [...prev, currentPopupNodeId]);
                                                  setCurrentPopupNodeId(opt.target);
                                                  if (opt.infoText) {
                                                    toast.info(opt.infoText);
                                                  }
                                                } else {
                                                  toast.success("Branch Completed! Reached end of dynamic node advisor.");
                                                  setCurrentPopupNodeId("start");
                                                  setPopupHistory([]);
                                                  setActivePopupType(null);
                                                }
                                              }}
                                              className="p-3.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-700 rounded-xl text-left text-xs font-bold text-slate-200 hover:text-white transition-all flex items-start gap-3 group/opt cursor-pointer"
                                            >
                                              <div className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-slate-500 font-mono text-[9px] flex items-center justify-center font-bold group-hover/opt:bg-indigo-650 group-hover/opt:border-indigo-500 group-hover/opt:text-white shrink-0 mt-0.5 transition-all">
                                                {String.fromCharCode(65 + oIdx)}
                                              </div>
                                              <div>
                                                <span className="group-hover/opt:text-amber-300 transition-colors block">
                                                  {opt.text}
                                                </span>
                                                {opt.infoText && (
                                                  <span className="block text-[10px] text-slate-500 font-medium normal-case leading-snug mt-0.5">
                                                    {opt.infoText}
                                                  </span>
                                                )}
                                              </div>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between border-t border-slate-850 pt-4">
                                    <button
                                      onClick={() => {
                                        setCurrentPopupNodeId("start");
                                        setPopupHistory([]);
                                        toast.info("Advisor path reset to start node!");
                                      }}
                                      className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      Reset Advisor
                                    </button>
                                    <button
                                      onClick={() => setActivePopupType(null)}
                                      className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                                    >
                                      Close Advisor
                                    </button>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* RENDER TAB 3: DAR CASE INDEX FORM - EXACT PDF REPLICATION */}
        {activeSubTab === "dar_index_form" && (
          <div className="flex-1 flex flex-col overflow-y-auto form-fill-container">
            {/* Command Bar */}
            <div className="bg-slate-950 p-4 border-b border-slate-850 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-400 w-5 h-5 animate-pulse" />
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider leading-none">
                    DAR Case Index Manager (केस इंडेक्स)
                  </h4>
                  <p className="text-[10px] text-slate-300 mt-1 uppercase font-semibold">
                    Fill or synchronize the 31-point index sheet for standard dockets.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    // Populate from Checklist
                    const p1 = part1 || [];
                    const getVal = (id: string) => p1.find(x => x.id === id)?.value || "";
                    
                    const p2 = part2 || [];
                    const getP2Val = (id: string) => p2.find(x => x.id === id)?.value || "";
                    const getP2Choice = (id: string) => p2.find(x => x.id === id)?.choice || "";
                    
                    const mapped = darIndexFields.map(f => {
                      if (f.id === 1) return { ...f, value: getVal("p1_1") || f.value };
                      if (f.id === 2) return { ...f, value: getVal("p1_2_b") || getVal("p1_2") || f.value };
                      if (f.id === 3) {
                        const pb = getVal("p1_2_c");
                        const gp = getVal("p1_2_d");
                        const combined = pb && gp ? `${pb} & ${gp}` : (pb || gp);
                        return { ...f, value: combined || f.value };
                      }
                      if (f.id === 4) return { ...f, value: getVal("p1_2_e") || f.value };
                      if (f.id === 5) return { ...f, value: getVal("p1_4") || f.value };
                      if (f.id === 6) return { ...f, value: getVal("p1_5") || f.value };
                      if (f.id === 7) return { ...f, value: getVal("p1_7_a") || f.value };
                      if (f.id === 8) return { ...f, value: getVal("p1_1") ? "Completed on Checklist Part-I" : f.value };
                      if (f.id === 9) return { ...f, value: getP2Val("p2_10_b") || f.value };
                      if (f.id === 10) return { ...f, value: getP2Val("p2_23") || f.value };
                      if (f.id === 11) return { ...f, value: getP2Val("p2_10_b") || f.value };
                      if (f.id === 12) {
                        return { ...f, value: getP2Choice("p2_10_a") === "Yes" ? (getP2Val("p2_10_b") || "Prepared from Vigilance report") : f.value };
                      }
                      if (f.id === 13) return { ...f, value: getP2Val("p2_4_a") || f.value };
                      if (f.id === 14) return { ...f, value: getP2Val("p2_5") || f.value };
                      if (f.id === 15) return { ...f, value: getP2Val("p2_7") || f.value };
                      if (f.id === 16) return { ...f, value: getP2Val("p2_14") || f.value };
                      if (f.id === 17) return { ...f, value: getP2Val("p2_13_a") || getP2Val("p2_13_b") || f.value };
                      if (f.id === 18) return { ...f, value: getP2Val("p2_8") || f.value };
                      if (f.id === 19) return { ...f, value: getP2Val("p2_8") || f.value };
                      if (f.id === 20) return { ...f, value: getP2Val("p2_24_a") || f.value };
                      if (f.id === 21) return { ...f, value: getP2Val("p2_24_b") || f.value };
                      if (f.id === 22) return { ...f, value: getP2Val("p2_25") || f.value };
                      if (f.id === 23) return { ...f, value: getP2Val("p2_15_a") || getP2Val("p2_18") || f.value };
                      if (f.id === 24) return { ...f, value: getP2Val("p2_27_a") || f.value };
                      if (f.id === 25) return { ...f, value: getP2Val("p2_27_b") || f.value };
                      if (f.id === 26) return { ...f, value: getP2Val("p2_29_b") || f.value };
                      if (f.id === 27) return { ...f, value: getP2Val("p2_30") || f.value };
                      if (f.id === 28) {
                        return { ...f, value: getP2Val("p2_30") ? ("Proposed penalty details: " + getP2Val("p2_30")) : f.value };
                      }
                      if (f.id === 29) {
                        return { ...f, value: (getVal("p1_7_c") || getVal("p1_7_d") ? "Retirement/Pension details available" : f.value) };
                      }
                      return f;
                    });
                    
                    setDarIndexFields(mapped);
                    
                    const coName = getVal("p1_1");
                    const coDesg = getVal("p1_2_b") || getVal("p1_2");
                    if (coName && !caseNameInput) {
                      setCaseNameInput(`${coName}${coDesg ? ` (${coDesg})` : ""}`);
                    }
                    
                    toast.success("Synchronized Checklist Data (Part-I & Part-II) to 31-point DAR Index successfully!");
                  }}
                  className="bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 font-extrabold text-xs px-3 py-2 rounded border border-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                  title="Pull biographical fields from current checklist data"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
                  Sync from Checklist
                </button>

                <button
                  onClick={() => {
                    const sample = [
                      { id: 1, label: "Name of the Charged Official(CO)", value: "Shri Santosh Kumar" },
                      { id: 2, label: "Post last held by CO(Designation)", value: "Station Master" },
                      { id: 3, label: "Pay Band & GP", value: "5200-20200/- & 4200/-" },
                      { id: 4, label: "Basic pay last drawn by him (including GP)", value: "53600/-" },
                      { id: 5, label: "Date of birth", value: "13.02.1984" },
                      { id: 6, label: "Date of Appointment", value: "02.07.2012" },
                      { id: 7, label: "Date of Superannuation", value: "29.02.2044" },
                      { id: 8, label: "Bio -data of C.O (Checklist)", value: "SN-387 to 389" },
                      { id: 9, label: "Date of 1 Pre- check Memorandum by Vigilanace", value: "NA" },
                      { id: 10, label: "Copy of all RUD is placed at", value: "SN-137 to 138" },
                      { id: 11, label: "Preliminary Investigation Report was submitted by Vigilance on", value: "NA" },
                      { id: 12, label: "Draft charge sheet was prepared by Vigilance on", value: "NA" },
                      { id: 13, label: "Charged Memorandum was issed on", value: "29.10.2024 (SN-137 to 143)" },
                      { id: 14, label: "Acknowledgement of charge Memorandum on", value: "30.10.2024 (SN-146)" },
                      { id: 15, label: "Defence statement was submitted by C.O", value: "SN-152 to 153" },
                      { id: 16, label: "Presenting officer was nominated on", value: "26.05.2025(SN-150/A)" },
                      { id: 17, label: "Inquiry Officer was nominated on", value: "09.05.2025(SN-150)" },
                      { id: 18, label: "Consent of Defence Helper was taken on", value: "25.05.2025(SN-154)" },
                      { id: 19, label: "Nomination of Defence Helper was submitted on", value: "25.05.2025(SN-155)" },
                      { id: 20, label: "Presenting officer's brief was submitted to I.O on", value: "SN-231" },
                      { id: 21, label: "Presenting officer's brief was submitted to C.O on", value: "14.08.2025(SN-235)" },
                      { id: 22, label: "Disagreement Memo of C.O on Presenting Officer's brief was submitted on", value: "SN-242 to 251" },
                      { id: 23, label: "Inquiry proceeding are placed from", value: "SN -157 to 256" },
                      { id: 24, label: "Inquiry Officer had submitted his report on", value: "SN -256 to 252" },
                      { id: 25, label: "C.O had acknowledged the I.O report on", value: "11.11.2025 (SN-260)" },
                      { id: 26, label: "Final Representation of C.O on Inquiry Officer's report was submitted on", value: "SN-263 to 271" },
                      { id: 27, label: "P.W.C of D.A. is placed at", value: "SN -370" },
                      { id: 28, label: "Proposed N.I.P of Disciplinary Authority is placed at", value: "SN-273" },
                      { id: 29, label: "PPO copy is placed at", value: "NA" },
                      { id: 30, label: "APAR placed at", value: "SN-349 to 366" },
                      { id: 31, label: "Service Book placed at", value: "SN-374 to 386" }
                    ];
                    setDarIndexFields(sample);
                    setCaseNameInput("Shri Santosh Kumar (Station Master)");
                    toast.success("Loaded sample DAR index sheet (Shri Santosh Kumar)!");
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-indigo-300 font-extrabold text-xs px-3 py-2 rounded border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  Load Sample
                </button>

                <button
                  onClick={() => {
                    setDarIndexFields(DEFAULT_DAR_INDEX_FIELDS);
                    toast.info("Cleared all Index field values.");
                  }}
                  className="bg-slate-900 hover:bg-rose-955/40 text-slate-400 hover:text-rose-400 font-extrabold text-xs px-2.5 py-2 rounded border border-slate-800 hover:border-rose-900/50 transition-all cursor-pointer"
                >
                  Clear Form
                </button>

                <button
                  onClick={handlePrint}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded shadow-[0_2px_0_0_#4338ca] active:translate-y-[1px] active:shadow-none uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Index Page
                </button>
              </div>
            </div>

            {/* Editing grid / table structure */}
            <div className="p-4 space-y-4 print:hidden">
              <div className="bg-slate-950/95 border border-slate-750 p-4 rounded-xl space-y-4 shadow-xl">
                <div className="border-b border-slate-850 pb-2 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                      INDEX OF D&AR CASE WORKSHEET (डीएआर केस सामग्री का सूचकांक)
                    </h3>
                    <p className="text-[10px] text-slate-400 uppercase mt-0.5 font-bold tracking-wider">
                      Edit values for each document/stage in the D&AR docket below:
                    </p>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded border border-slate-700 bg-slate-900 text-slate-300 font-extrabold">
                    HIGH QUALITY MATERIAL
                  </span>
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-200">
                    <thead className="bg-slate-900 text-[10px] uppercase font-black tracking-wider text-slate-400 border-b border-slate-850">
                      <tr>
                        <th className="p-3 w-12 text-center border-r border-slate-850">S.No</th>
                        <th className="p-3 w-1/2 border-r border-slate-850">Particulars of Documents (दस्तावेज विवरण)</th>
                        <th className="p-3">Reference / Remark Page Numbers (संदर्भ / टिप्पणी)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 bg-slate-950/50">
                      {darIndexFields.map((f, i) => (
                        <tr key={f.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="p-3 font-mono font-bold text-center text-slate-500 border-r border-slate-850 bg-slate-900/20">{f.id}</td>
                          <td className="p-3 text-slate-200 font-semibold leading-relaxed border-r border-slate-850 text-xs">
                            {f.label}
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={f.value}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDarIndexFields(prev => prev.map(item => item.id === f.id ? { ...item, value: val } : item));
                              }}
                              placeholder={i < 7 ? "Enter particular detail..." : "e.g., SN-137 to 138 or NA"}
                              className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none px-3 py-1.5 rounded-lg text-xs font-bold text-slate-100 placeholder-slate-700 transition-all font-mono"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-850">
                  <p className="text-[10px] text-amber-500/80 font-bold uppercase tracking-wider">
                    * The printed output matches standard format & fits perfectly onto 1 Page!
                  </p>
                  <button
                    onClick={handleSaveToDb}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-black px-5 py-2.5 rounded-lg transition-all shadow-[0_2px_0_0_#92400e] active:translate-y-[1px] active:shadow-none uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Docket with Index
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RENDER TAB 2: ACTIVE CHECKLIST - EXACT PDF REPLICATION */}
        {activeSubTab === "checklist_index" && (
          <div className="flex-1 flex flex-col overflow-y-auto form-fill-container">
            {/* Scoped style to enlarge on-screen input sizes for comfortable form-filling */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media screen {
                .form-fill-container input[type="text"], 
                .form-fill-container select {
                  font-size: 14px !important;
                  padding-top: 8px !important;
                  padding-bottom: 8px !important;
                  font-weight: 700 !important;
                  color: #f8fafc !important; /* text-slate-50 */
                }
                .form-fill-container label {
                  font-size: 13px !important;
                  line-height: 1.5 !important;
                }
                .form-fill-container input[type="text"]::placeholder {
                  color: #64748b !important; /* text-slate-500 */
                }
              }
            ` }} />
            {/* Command Bar */}
            <div className="bg-slate-950 p-4 border-b border-slate-850 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-400 w-5 h-5 animate-pulse" />
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider leading-none">
                    Excel Handover Synchronizer
                  </h4>
                  <p className="text-[10px] text-slate-300 mt-1 uppercase font-semibold">
                    Upload spreadsheet to auto-populate left-side Details. Values fill dynamically on the right.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={downloadSampleExcel}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-100 font-extrabold text-xs px-3 py-2 rounded border border-slate-700 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  Get Template
                </button>

                <label className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3 py-2 rounded shadow-[0_2px_0_0_#047857] active:translate-y-[1px] active:shadow-none uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  Upload Excel
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={handleExcelImport}
                  />
                </label>

                <button
                  onClick={handlePrint}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-3.5 py-2 rounded shadow-[0_2px_0_0_#4338ca] active:translate-y-[1px] active:shadow-none uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Checklist
                </button>
              </div>
            </div>

            {/* Interactive Screen Editing Form */}
            <div className="p-4 space-y-6 print:hidden">
              <div className="bg-slate-950/95 border border-slate-750 p-5 rounded-2xl space-y-5 shadow-xl">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase bg-amber-955 px-2.5 py-1 rounded border border-amber-550/30">
                    PART-I
                  </span>
                  <h3 className="text-sm font-black text-white uppercase mt-2.5">
                    Service and Related Particulars (Charged Official)
                  </h3>
                  <p className="text-[10px] text-slate-300 uppercase font-semibold tracking-wider mt-1">
                    Provide biographical details, grade pay levels, post statuses and retirement metrics
                  </p>
                </div>

                <div className="divide-y divide-slate-800 space-y-3">
                  {part1.map((field) => (
                    <div 
                      key={field.id}
                      className={`flex flex-col md:flex-row md:items-center justify-between py-3.5 gap-2.5 text-xs ${
                        field.isSubField ? "pl-6 md:pl-8 border-l-2 border-amber-500/50 bg-slate-900/40 rounded-r-xl" : ""
                      }`}
                    >
                      <div className="md:w-1/2">
                        <label className="font-extrabold text-slate-100 block tracking-wide">
                          {field.label}
                        </label>
                      </div>

                      <div className="flex-1 max-w-lg flex flex-col gap-2 w-full">
                        {field.id === "p1_2_a" ? (
                           <div className="flex gap-1.5">
                            {["Group 'C'", "Group 'D'"].map((grp) => (
                              <button
                                key={grp}
                                type="button"
                                onClick={() => handleUpdatePart1Val(field.id, grp)}
                                className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-wider border transition-colors cursor-pointer ${
                                  field.value === grp
                                    ? "bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-600/20"
                                    : "bg-slate-900 border-slate-700 text-slate-200 hover:text-white"
                                }`}
                              >
                                {grp}
                              </button>
                            ))}
                          </div>
                        ) : field.id === "p1_2" ? (
                          <div className="flex flex-col gap-1.5 w-full">
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleSelectDesignationPreset(e.target.value);
                                  handleUpdatePart1Val("p1_2", e.target.value);
                                }
                              }}
                              value={filteredDesignationPresets.some(p => p.name === field.value) ? field.value : ""}
                              className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-amber-300 font-black focus:outline-none focus:border-amber-500 text-xs cursor-pointer shadow-inner"
                            >
                              <option value="" className="bg-slate-950 text-slate-400 font-bold">-- Choose Post Last Held Preset (Auto-fills metrics) --</option>
                              {filteredDesignationPresets.map((p) => (
                                <option key={p.name} value={p.name} className="bg-slate-950 text-white font-medium">
                                  {p.name}
                                </option>
                              ))}
                              <option value="custom" className="bg-slate-950 text-amber-400 font-bold">Custom / Other (Type below)</option>
                            </select>
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => handleUpdatePart1Val(field.id, e.target.value)}
                              placeholder="Or write post last held manually here..."
                              className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-slate-100 font-bold placeholder:text-slate-500 focus:outline-none focus:border-amber-500 text-xs shadow-inner"
                            />
                            <span className="text-[10px] text-amber-300/90 font-medium italic block leading-relaxed">
                              Tip: Selecting a post auto-populates Group, Pay Band, Grade Pay, and next lower post details!
                            </span>
                          </div>
                        ) : field.id === "p1_2_b" ? (
                          <div className="flex flex-col gap-1.5 w-full">
                            <select
                              onChange={(e) => {
                                handleSelectDesignationPreset(e.target.value);
                              }}
                              value={filteredDesignationPresets.some(p => p.name === field.value) ? field.value : ""}
                              className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-amber-300 font-black focus:outline-none focus:border-amber-500 text-xs cursor-pointer shadow-inner"
                            >
                              <option value="" className="bg-slate-950 text-slate-400 font-bold">-- Choose Railway Designation Preset (Auto-fills metrics) --</option>
                              {filteredDesignationPresets.map((p) => (
                                <option key={p.name} value={p.name} className="bg-slate-950 text-white font-medium">
                                  {p.name}
                                </option>
                              ))}
                              <option value="custom" className="bg-slate-950 text-amber-400 font-bold">Custom / Other (Type details below)</option>
                            </select>
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => handleUpdatePart1Val(field.id, e.target.value)}
                              placeholder="Or write designation manually here..."
                              className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-slate-100 font-bold placeholder:text-slate-500 focus:outline-none focus:border-amber-500 text-xs shadow-inner"
                            />
                            <span className="text-[10px] text-amber-300/90 font-medium italic block leading-relaxed">
                              Tip: Selecting a designation auto-populates Group, Pay Band, Grade Pay, and next lower post details!
                            </span>
                          </div>
                        ) : field.id === "p1_2_d" ? (
                          <div className="flex flex-col gap-1.5 w-full">
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleUpdatePart1Val(field.id, e.target.value);
                                }
                              }}
                              value={COMMON_GRADE_PAYS.some(gp => gp.gp === field.value) ? field.value : ""}
                              className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-amber-300 font-black focus:outline-none focus:border-amber-500 text-xs cursor-pointer shadow-inner"
                            >
                              <option value="" className="bg-slate-950 text-slate-400 font-bold">-- Select Grade Pay Option --</option>
                              {COMMON_GRADE_PAYS.map((gp) => (
                                <option key={gp.gp} value={gp.gp} className="bg-slate-950 text-white font-medium">
                                  GP {gp.gp} ({gp.level})
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => handleUpdatePart1Val(field.id, e.target.value)}
                              placeholder="Or write Grade Pay manually..."
                              className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-slate-100 font-bold placeholder:text-slate-500 focus:outline-none focus:border-amber-500 text-xs shadow-inner"
                            />
                          </div>
                        ) : field.id === "p1_3_a" ? (
                          <div className="flex flex-col gap-1.5 w-full">
                            <select
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val) {
                                  if (val === "custom") {
                                    handleUpdatePart1Val("p1_3_a", "");
                                  } else {
                                    handleUpdatePart1Val("p1_3_a", val);
                                    const matched = RAILWAY_DESIGNATION_PRESETS.find(p => p.name === val);
                                    if (matched) {
                                      handleUpdatePart1Val("p1_3_b", `${matched.payBand}, GP: ${matched.gradePay}`);
                                      toast.info(`Auto-filled 3b with ${matched.name}'s Pay Band & GP.`);
                                    }
                                  }
                                }
                              }}
                              value={filteredDesignationPresets.some(p => p.name === field.value) ? field.value : (field.value === "" ? "" : "custom")}
                              className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-amber-300 font-black focus:outline-none focus:border-amber-500 text-xs cursor-pointer shadow-inner"
                            >
                              <option value="" className="bg-slate-950 text-slate-400 font-bold">-- Choose Next Lower Post Preset --</option>
                              {filteredDesignationPresets.map((p) => (
                                <option key={p.name} value={p.name} className="bg-slate-950 text-white font-medium">
                                  {p.name}
                                </option>
                              ))}
                              <option value="custom" className="bg-slate-950 text-amber-400 font-bold">Custom / Other (Type below)</option>
                            </select>
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => handleUpdatePart1Val(field.id, e.target.value)}
                              placeholder="Or write next lower post manually here..."
                              className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-slate-100 font-bold placeholder:text-slate-500 focus:outline-none focus:border-amber-500 text-xs shadow-inner"
                            />
                            <span className="text-[10px] text-amber-300/90 font-medium italic block leading-relaxed">
                              Tip: You can manually edit or type the next lower post name at any time in the box above!
                            </span>
                          </div>
                        ) : field.id === "p1_3_b" ? (
                          <div className="flex flex-col gap-1.5 w-full">
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleUpdatePart1Val(field.id, `GP: ${e.target.value}`);
                                }
                              }}
                              value=""
                              className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-amber-300 font-black focus:outline-none focus:border-amber-500 text-xs cursor-pointer shadow-inner"
                            >
                              <option value="" className="bg-slate-950 text-slate-400 font-bold">-- Quick fill Grade Pay level option --</option>
                              {COMMON_GRADE_PAYS.map((gp) => (
                                <option key={gp.gp} value={gp.gp} className="bg-slate-950 text-white font-medium">
                                  GP {gp.gp} ({gp.level})
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => handleUpdatePart1Val(field.id, e.target.value)}
                              placeholder="Or write Pay Band & Grade Pay manually..."
                              className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-slate-100 font-bold placeholder:text-slate-500 focus:outline-none focus:border-amber-500 text-xs shadow-inner"
                            />
                          </div>
                        ) : (field.id === "p1_4" || field.id === "p1_5" || field.id === "p1_6" || field.id === "p1_7_a" || field.id === "p1_2_f" || field.id === "p1_2_g" || field.label.toLowerCase().includes("date")) ? (
                          <div className="flex flex-col gap-1.5 w-full">
                            <div className="flex items-center gap-2">
                              <input
                                type="date"
                                value={parseDateToYmd(field.value)}
                                max={field.id === "p1_4" ? maxDobStr : undefined}
                                onChange={(e) => handleUpdatePart1Val(field.id, e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-white font-black focus:outline-none focus:border-amber-500 text-xs cursor-pointer shadow-inner"
                              />
                              {field.id === "p1_4" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUpdatePart1Val(field.id, maxDobStr);
                                    toast.info("Date of Birth initialized to exactly 20 Years Ago!");
                                  }}
                                  className="px-3 py-2 bg-amber-600/30 hover:bg-amber-600 border border-amber-500/50 text-[10px] font-bold text-amber-200 rounded whitespace-nowrap transition-all cursor-pointer"
                                  title="Auto-set DOB to 20 years ago today"
                                >
                                  Set 20 Years Back
                                </button>
                              )}
                            </div>
                            {field.id === "p1_4" ? (
                              <span className="text-[10px] text-amber-300 font-semibold leading-relaxed">
                                Calendar is restricted to 20 years back (max: {maxDobStr}).
                              </span>
                            ) : null}
                          </div>
                        ) : field.id === "p1_7_b" ? (
                          <div className="flex gap-1.5">
                            {["Superannuation", "Voluntary", "Compulsory", "NA"].map((mode) => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => handleUpdatePart1Val(field.id, mode)}
                                className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-wider border transition-colors cursor-pointer ${
                                  field.value === mode
                                    ? "bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-600/20"
                                    : "bg-slate-900 border-slate-700 text-slate-200 hover:text-white"
                                }`}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                        ) : field.id === "p1_8" ? (
                          <div className="flex gap-1.5">
                            {["YES", "NO"].map((sus) => (
                              <button
                                key={sus}
                                type="button"
                                onClick={() => handleUpdatePart1Val(field.id, sus)}
                                className={`px-5 py-1.5 rounded text-[10px] font-black tracking-wider border transition-colors cursor-pointer ${
                                  field.value === sus
                                    ? "bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-600/20"
                                    : "bg-slate-900 border-slate-700 text-slate-200 hover:text-white"
                                }`}
                              >
                                {sus}
                              </button>
                            ))}
                          </div>
                        ) : field.id === "p1_9" ? (
                          <div className="flex flex-col gap-1.5 w-full">
                            <select
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val) {
                                  if (val === "custom") {
                                    handleUpdatePart1Val("p1_9", "");
                                  } else {
                                    handleUpdatePart1Val("p1_9", val);
                                  }
                                }
                              }}
                              value={APPOINTING_AUTHORITY_PRESETS.some(group => group.officers.includes(field.value)) ? field.value : (field.value === "" ? "" : "custom")}
                              className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-amber-300 font-black focus:outline-none focus:border-amber-500 text-xs cursor-pointer shadow-inner"
                            >
                              <option value="" className="bg-slate-950 text-slate-400 font-bold">-- Choose Appointing Authority Preset (All Departments) --</option>
                              {APPOINTING_AUTHORITY_PRESETS.map((group) => (
                                <optgroup key={group.department} label={group.department} className="bg-slate-900 text-slate-200 font-bold">
                                  {group.officers.map((off) => (
                                    <option key={off} value={off} className="bg-slate-950 text-amber-300 font-bold">
                                      {off}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                              <option value="custom" className="bg-slate-950 text-amber-400 font-bold">Custom / Other (Type below)</option>
                            </select>
                            <input
                              type="text"
                              value={field.value}
                              onChange={(e) => handleUpdatePart1Val(field.id, e.target.value)}
                              placeholder="Or write appointing authority manually here..."
                              className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-slate-100 font-bold placeholder:text-slate-500 focus:outline-none focus:border-amber-500 text-xs shadow-inner"
                            />
                            <span className="text-[10px] text-amber-300/90 font-medium italic block leading-relaxed">
                              Tip: You can choose an officer from any department above or type manually at any time!
                            </span>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={field.value}
                            onChange={(e) => handleUpdatePart1Val(field.id, e.target.value)}
                            placeholder="..."
                            className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-slate-100 font-bold placeholder:text-slate-500 focus:outline-none focus:border-amber-500 text-xs shadow-inner"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Part II section render */}
              <div className="bg-slate-950/95 border border-slate-750 p-5 rounded-2xl space-y-5 shadow-xl">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-[10px] font-black tracking-widest text-violet-400 uppercase bg-violet-950 px-2.5 py-1 rounded border border-violet-550/30">
                    PART-II
                  </span>
                  <h3 className="text-sm font-black text-white uppercase mt-2.5">
                    Details of the Case Records & Folios
                  </h3>
                  <p className="text-[10px] text-slate-300 uppercase font-semibold tracking-wider mt-1">
                    Tick standard options on the left choices, and register folio page counts (e.g. SN-9) on the right
                  </p>
                </div>

                <div className="divide-y divide-slate-800 space-y-3">
                  {part2.map((field) => (
                    <div 
                      key={field.id}
                      className={`flex flex-col lg:flex-row lg:items-center justify-between py-3.5 text-xs ${
                        field.isSubField ? "pl-6 lg:pl-10 border-l-2 border-violet-500/50 bg-slate-900/40 rounded-r-xl" : ""
                      }`}
                    >
                      <div className="lg:w-1/2">
                        <label className="font-extrabold text-slate-100 block tracking-wide">
                          {field.label}
                        </label>
                      </div>

                      <div className="flex-1 max-w-xl flex flex-wrap items-center gap-2 mt-1 lg:mt-0">
                        {/* Selector Choices */}
                        {(() => {
                          const choices = getChoicesForField(field.id);
                          if (!choices) return null;
                          return (
                            <div className="flex gap-1.5 shrink-0">
                              {choices.map((ch) => (
                                <button
                                  key={ch}
                                  type="button"
                                  onClick={() => handleUpdatePart2Choice(field.id, ch as any)}
                                  className={`px-3 py-1.5 rounded text-[9px] font-black uppercase tracking-wider transition-colors border ${
                                    field.choice === ch
                                      ? (ch === "MAJOR"
                                          ? "bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-600/25"
                                          : ch === "MINOR"
                                            ? "bg-indigo-650 border-indigo-500 text-white shadow-md shadow-indigo-600/25"
                                            : ch === "Yes"
                                              ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/25"
                                              : ch === "No"
                                                ? "bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-600/25"
                                                : ch === "N/A" || ch === "NA"
                                                  ? "bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-600/25"
                                                  : "bg-slate-750 border-slate-700 text-slate-200")
                                      : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
                                  }`}
                                >
                                  {ch}
                                </button>
                              ))}
                            </div>
                          );
                        })()}

                        {/* Text explanation or Page Ref */}
                        {(() => {
                          if (!shouldShowTextInputForField(field.id, field.choice)) return null;

                          const isField4cDenied = field.id === "p2_4_c" && part2.find(f => f.id === "p2_4_b")?.choice !== "Yes";
                          const isField7Denied = field.id === "p2_7" && part2.find(f => f.id === "p2_6")?.choice !== "Yes";
                          const isField9bDenied = field.id === "p2_9_b" && part2.find(f => f.id === "p2_9_a")?.choice !== "Yes";
                          const isField10bDenied = field.id === "p2_10_b" && part2.find(f => f.id === "p2_10_a")?.choice !== "Yes";
                          const isField11bDenied = field.id === "p2_11_b" && part2.find(f => f.id === "p2_11_a")?.choice !== "Yes";
                          const isField12bDenied = field.id === "p2_12_b" && part2.find(f => f.id === "p2_12_a")?.choice !== "Yes";
                          const isField17bDenied = field.id === "p2_17_b" && part2.find(f => f.id === "p2_17_a")?.choice !== "Yes";
                          const isField17dDenied = field.id === "p2_17_d" && part2.find(f => f.id === "p2_17_c")?.choice !== "Yes";
                          const isField19bDenied = field.id === "p2_19_b" && part2.find(f => f.id === "p2_19_a")?.choice !== "No";
                          const isField22bDenied = field.id === "p2_22_b" && part2.find(f => f.id === "p2_22_a")?.choice !== "Yes";
                          const isField22cDenied = field.id === "p2_22_c" && part2.find(f => f.id === "p2_22_a")?.choice !== "No";
                          const isField26bDenied = field.id === "p2_26_b" && part2.find(f => f.id === "p2_26_a")?.choice !== "Yes";
                          const isField26cDenied = field.id === "p2_26_c" && part2.find(f => f.id === "p2_26_a")?.choice !== "Yes";
                          const isField28bDenied = field.id === "p2_28_b" && part2.find(f => f.id === "p2_28_a")?.choice !== "Yes";
                          const isField28cDenied = field.id === "p2_28_c" && part2.find(f => f.id === "p2_28_a")?.choice !== "Yes";
                          const isField29bDenied = field.id === "p2_29_b" && part2.find(f => f.id === "p2_29_a")?.choice !== "Yes";

                          if (isField4cDenied) {
                            return (
                              <div className="flex-1 min-w-[250px] bg-slate-900/60 border border-slate-800/65 px-3 py-1.5 rounded text-amber-300 font-bold text-xs italic flex items-center gap-1.5">
                                <span>🔒 Auto: NA (Select 'Yes' in 4(b) to override)</span>
                              </div>
                            );
                          }

                          if (isField7Denied) {
                            return (
                              <div className="flex-1 min-w-[250px] bg-slate-900/60 border border-slate-800/65 px-3 py-1.5 rounded text-amber-300 font-bold text-xs italic flex items-center gap-1.5">
                                <span>🔒 Auto: NA (Select 'Yes' in 6 to override)</span>
                              </div>
                            );
                          }

                          if (isField9bDenied) {
                            return (
                              <div className="flex-1 min-w-[250px] bg-slate-900/60 border border-slate-800/65 px-3 py-1.5 rounded text-amber-300 font-bold text-xs italic flex items-center gap-1.5">
                                <span>🔒 Auto: NA (Select 'Yes' in 9(a) to override)</span>
                              </div>
                            );
                          }

                          if (isField10bDenied) {
                            return (
                              <div className="flex-1 min-w-[250px] bg-slate-900/60 border border-slate-800/65 px-3 py-1.5 rounded text-amber-300 font-bold text-xs italic flex items-center gap-1.5">
                                <span>🔒 Auto: NA (Select 'Yes' in 10(a) to override)</span>
                              </div>
                            );
                          }

                          if (isField11bDenied) {
                            return (
                              <div className="flex-1 min-w-[250px] bg-slate-900/60 border border-slate-800/65 px-3 py-1.5 rounded text-amber-300 font-bold text-xs italic flex items-center gap-1.5">
                                <span>🔒 Auto: NA (Select 'Yes' in 11(a) to override)</span>
                              </div>
                            );
                          }

                          if (isField12bDenied) {
                            return (
                              <div className="flex-1 min-w-[250px] bg-slate-900/60 border border-slate-800/65 px-3 py-1.5 rounded text-amber-300 font-bold text-xs italic flex items-center gap-1.5">
                                <span>🔒 Auto: NA (Select 'Yes' in 12(a) to override)</span>
                              </div>
                            );
                          }

                          if (isField17bDenied) {
                            return (
                              <div className="flex-1 min-w-[250px] bg-slate-900/60 border border-slate-800/65 px-3 py-1.5 rounded text-amber-300 font-bold text-xs italic flex items-center gap-1.5">
                                <span>🔒 Auto: NA (Select 'Yes' in 17(a) to override)</span>
                              </div>
                            );
                          }

                          if (isField17dDenied) {
                            return (
                              <div className="flex-1 min-w-[250px] bg-slate-900/60 border border-slate-800/65 px-3 py-1.5 rounded text-amber-300 font-bold text-xs italic flex items-center gap-1.5">
                                <span>🔒 Auto: NA (Select 'Yes' in 17(c) to override)</span>
                              </div>
                            );
                          }

                          if (isField19bDenied) {
                            return (
                              <div className="flex-1 min-w-[250px] bg-slate-900/60 border border-slate-800/65 px-3 py-1.5 rounded text-amber-300 font-bold text-xs italic flex items-center gap-1.5">
                                <span>🔒 Auto: NA (Select 'No' in 19(a) to override)</span>
                              </div>
                            );
                          }

                          if (isField22bDenied) {
                            return (
                              <div className="flex-1 min-w-[250px] bg-slate-900/60 border border-slate-800/65 px-3 py-1.5 rounded text-amber-300 font-bold text-xs italic flex items-center gap-1.5">
                                <span>🔒 Auto: NA (Select 'Yes' in 22(a) to override)</span>
                              </div>
                            );
                          }

                          if (isField22cDenied) {
                            return (
                              <div className="flex-1 min-w-[250px] bg-slate-900/60 border border-slate-800/65 px-3 py-1.5 rounded text-amber-300 font-bold text-xs italic flex items-center gap-1.5">
                                <span>🔒 Auto: NA (Select 'No' in 22(a) to override)</span>
                              </div>
                            );
                          }

                          if (isField26bDenied) {
                            return (
                              <div className="flex-1 min-w-[250px] bg-slate-900/60 border border-slate-800/65 px-3 py-1.5 rounded text-amber-300 font-bold text-xs italic flex items-center gap-1.5">
                                <span>🔒 Auto: NA (Select 'Yes' in 26(a) to override)</span>
                              </div>
                            );
                          }

                          if (isField26cDenied) {
                            return (
                              <div className="flex-1 min-w-[250px] bg-slate-900/60 border border-slate-800/65 px-3 py-1.5 rounded text-amber-300 font-bold text-xs italic flex items-center gap-1.5">
                                <span>🔒 Auto: NA (Select 'Yes' in 26(a) to override)</span>
                              </div>
                            );
                          }

                          if (isField28bDenied) {
                            return (
                              <div className="flex-1 min-w-[250px] bg-slate-900/60 border border-slate-800/65 px-3 py-1.5 rounded text-amber-300 font-bold text-xs italic flex items-center gap-1.5">
                                <span>🔒 Auto: NA (Select 'Yes' in 28(a) to override)</span>
                              </div>
                            );
                          }

                          if (isField28cDenied) {
                            return (
                              <div className="flex-1 min-w-[250px] bg-slate-900/60 border border-slate-800/65 px-3 py-1.5 rounded text-amber-300 font-bold text-xs italic flex items-center gap-1.5">
                                <span>🔒 Auto: NA (Select 'Yes' in 28(a) to override)</span>
                              </div>
                            );
                          }

                          if (isField29bDenied) {
                            return (
                              <div className="flex-1 min-w-[250px] bg-slate-900/60 border border-slate-800/65 px-3 py-1.5 rounded text-amber-300 font-bold text-xs italic flex items-center gap-1.5">
                                <span>🔒 Auto: NA (Select 'Yes' in 29(a) to override)</span>
                              </div>
                            );
                          }

                          return (
                            <div className="flex-1 min-w-[250px] flex flex-col gap-2">
                              {field.id === "p2_13_b" ? (
                                (() => {
                                  const isNa = field.value === "NA" || field.value === "N/A";
                                  const ios = isNa ? [] : parseIoNames(field.value);
                                  return (
                                    <div className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl flex flex-col gap-3 shadow-inner">
                                      <div className="text-[10px] text-amber-300 font-extrabold uppercase tracking-widest flex justify-between items-center bg-slate-950/80 px-2 py-1 rounded">
                                        <span>👥 INQUIRY OFFICERS LIST ({isNa ? "N/A" : ios.length})</span>
                                        <div className="flex items-center gap-2">
                                          {isNa ? (
                                            <button
                                              type="button"
                                              onClick={() => handleUpdatePart2Val(field.id, "")}
                                              className="bg-violet-600 hover:bg-violet-500 text-white font-black text-[9px] px-2 py-0.5 rounded transition-colors uppercase cursor-pointer"
                                            >
                                              ✏️ Enter Names
                                            </button>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => handleUpdatePart2Val(field.id, "NA")}
                                              className="bg-amber-600 hover:bg-amber-500 text-white font-black text-[9px] px-2 py-0.5 rounded transition-colors uppercase cursor-pointer"
                                            >
                                              🚫 Set to N/A
                                            </button>
                                          )}
                                          <span className="text-slate-400 font-semibold">[DYNAMIC ORDERING]</span>
                                        </div>
                                      </div>

                                      {isNa ? (
                                        <div className="bg-amber-950/30 border border-amber-900/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2.5 text-center">
                                          <span className="text-2xl">🔒</span>
                                          <div className="text-amber-200 font-bold text-xs">
                                            This Inquiry Officer field is marked as Not Applicable (N/A).
                                          </div>
                                          <div className="text-amber-400/80 text-[10px] font-medium max-w-sm">
                                            "NA" will be printed in the docket. To input custom Inquiry Officer names, click 'Enter Names' above.
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          {/* Current list of IOs */}
                                          {ios.length === 0 ? (
                                            <div className="text-[10px] text-slate-500 italic p-2 text-center bg-slate-950/30 rounded border border-slate-800/40">
                                              No Inquiry Officers added yet. Add below.
                                            </div>
                                          ) : (
                                            <div className="flex flex-col gap-2">
                                              {ios.map((ioName, idx) => (
                                                <div key={idx} className="flex items-center gap-2 bg-slate-950 p-1.5 rounded border border-slate-800/60 shadow-sm">
                                                  <span className="text-[10px] bg-slate-900 px-2.5 py-1.5 rounded text-amber-300 font-black w-7 text-center border border-slate-800 shrink-0">
                                                    {idx + 1}
                                                  </span>
                                                  <input
                                                    type="text"
                                                    value={ioName}
                                                    onChange={(e) => {
                                                      const newIos = [...ios];
                                                      newIos[idx] = e.target.value;
                                                      handleUpdatePart2Val(field.id, combineIoNamesList(newIos));
                                                    }}
                                                    placeholder="Inquiry Officer name & designation"
                                                    className="flex-1 bg-slate-900 border border-slate-750 px-2.5 py-1 rounded text-white font-bold text-[11px] placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                                                  />
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const newIos = ios.filter((_, i) => i !== idx);
                                                      handleUpdatePart2Val(field.id, combineIoNamesList(newIos));
                                                    }}
                                                    className="p-1 px-2.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded transition-colors text-[10px] font-extrabold uppercase tracking-wider"
                                                    title="Remove this officer"
                                                  >
                                                    Remove
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                          {/* Form to Add Inquiry Officer */}
                                          <div className="bg-slate-950/80 border border-slate-800 p-2.5 rounded-xl flex flex-col gap-2 shadow-inner">
                                            <span className="text-[10px] text-amber-300 font-extrabold tracking-wider uppercase">
                                              ➕ Add Inquiry Officer (IO):
                                            </span>
                                            <div className="flex flex-wrap gap-2">
                                              <input
                                                type="text"
                                                value={newIoName}
                                                onChange={(e) => setNewIoName(e.target.value)}
                                                placeholder="IO Name (e.g. Shri Amit)"
                                                className="bg-slate-900 border border-slate-750 px-2.5 py-1.5 rounded text-slate-100 font-bold text-[10px] placeholder:text-slate-500 focus:outline-none focus:border-violet-500 flex-1 min-w-[110px]"
                                              />
                                              <input
                                                type="text"
                                                value={newIoDesignation}
                                                onChange={(e) => setNewIoDesignation(e.target.value)}
                                                placeholder="Designation (e.g. AM/NJP)"
                                                className="bg-slate-900 border border-slate-750 px-2.5 py-1.5 rounded text-slate-100 font-bold text-[10px] placeholder:text-slate-500 focus:outline-none focus:border-violet-500 flex-1 min-w-[90px]"
                                              />
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (!newIoName.trim()) return;
                                                  const formatted = `${newIoName.trim()}${newIoDesignation.trim() ? `, ${newIoDesignation.trim()}` : ""}`;
                                                  const newIos = [...ios, formatted];
                                                  handleUpdatePart2Val("p2_13_b", combineIoNamesList(newIos));
                                                  setNewIoName("");
                                                  setNewIoDesignation("");
                                                }}
                                                className="bg-violet-650 hover:bg-violet-600 active:bg-violet-700 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded transition-colors uppercase shrink-0 cursor-pointer shadow-md"
                                              >
                                                Add IO
                                              </button>
                                            </div>
                                          </div>
                                        </>
                                      )}

                                      {field.value && (
                                        <div className="text-[9px] text-slate-400 p-2 bg-slate-950/70 rounded border border-slate-800/50 leading-relaxed">
                                          <span className="font-extrabold text-amber-500 uppercase tracking-widest text-[8px]">Current Print Output:</span>
                                          <div className="text-slate-200 mt-0.5 whitespace-pre-line font-black font-serif text-[10px]">{field.value}</div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()
                              ) : (
                                <input
                                  type="text"
                                  value={field.value}
                                  onChange={(e) => handleUpdatePart2Val(field.id, e.target.value)}
                                  placeholder="Ref / Page No (e.g. SN-11 to 14, NA)"
                                  className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded text-slate-100 font-bold placeholder:text-slate-500 focus:outline-none focus:border-violet-500 text-xs shadow-inner"
                                />
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Check Confirmation & Bottom Signatures Panel */}
              <div className="bg-slate-950/95 border border-slate-750 p-5 rounded-2xl space-y-5 shadow-xl">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                    <FileCheck className="text-emerald-400 w-4 h-4 animate-pulse" /> Final Verification Signature Block
                  </h3>
                </div>

                <div 
                  onClick={() => setCheckedConfirmation(!checkedConfirmation)}
                  className={`border p-4 rounded-xl flex items-start gap-3 cursor-pointer transition-colors ${
                    checkedConfirmation 
                      ? "bg-emerald-600/10 border-emerald-500/50 text-emerald-200" 
                      : "bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-600"
                  }`}
                >
                  <div className={`mt-0.5 border-2 rounded p-0.5 flex items-center justify-center transition-colors ${
                    checkedConfirmation ? "bg-emerald-600 border-emerald-500" : "border-slate-500 w-4.5 h-4.5"
                  }`}>
                    {checkedConfirmation && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <p className="text-xs font-bold leading-relaxed">
                    I have checked the information given in the check list and ensured that the disciplinary case files in original is being sent and have ensured that folio numbers mentioned in the checklist is complete in all respects.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-2">
                  <div>
                    <label className="block text-[10px] font-black text-slate-200 uppercase mb-1.5 tracking-wider">Name of Signing Officer</label>
                    <input
                      type="text"
                      value={signatureName}
                      onChange={(e) => setSignatureName(e.target.value)}
                      placeholder="e.g. Mohit Joshi"
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded text-white font-bold placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-200 uppercase mb-1.5 tracking-wider">Designation</label>
                    <input
                      type="text"
                      value={signatureDesignation}
                      onChange={(e) => setSignatureDesignation(e.target.value)}
                      placeholder="e.g. AM/NJP/NFR"
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded text-white font-bold placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-200 uppercase mb-1.5 tracking-wider">Telephone No</label>
                    <input
                      type="text"
                      value={signaturePhone}
                      onChange={(e) => setSignaturePhone(e.target.value)}
                      placeholder="e.g. 94347xxxxx"
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded text-white font-bold placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-200 uppercase mb-1.5 tracking-wider">Date</label>
                    <input
                      type="date"
                      value={signatureDate}
                      onChange={(e) => setSignatureDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded text-white font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 shadow-inner"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* PRINT MASTER PRESENTATION DOCKET (Strict Physical replication) */}
            <div id="print-area" ref={printAreaRef} style={{ fontFamily: "'Cambria', Georgia, serif" }} className="hidden print:block w-full text-black bg-white p-6 space-y-6 select-all leading-normal text-xs">
              <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                  body, #print-area, #print-area *, .print-page, td, th, p, span, div, h1, h2, h3, h4, h5 {
                    font-family: 'Cambria', Georgia, serif !important;
                    font-serif: 'Cambria', Georgia, serif !important;
                  }
                  body {
                    background-color: white !important;
                    color: black !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  @page {
                    size: A4;
                    margin: 10mm 6mm 20mm 25mm !important;
                  }
                  #print-area {
                    padding: 0 !important;
                    margin: 0 !important;
                    background: white !important;
                    display: block !important;
                  }
                  .print-page {
                    page-break-after: always !important;
                    page-break-inside: avoid !important;
                    break-after: page !important;
                    box-sizing: border-box !important;
                    display: block !important;
                    width: 100% !important;
                  }
                  .print-page:last-child {
                    page-break-after: avoid !important;
                    break-after: auto !important;
                  }
                  table {
                    width: 100% !important;
                    border-collapse: collapse !important;
                    margin-bottom: 6px !important;
                  }
                  th {
                    font-size: 11.5pt !important;
                    padding: 3px 5px !important;
                    font-weight: 800 !important;
                  }
                  td {
                    font-size: 11pt !important;
                    padding: 2.5px 5px !important;
                    line-height: 1.15 !important;
                  }
                  h2, h3, h4, h5 {
                    page-break-inside: avoid !important;
                  }
                }
              ` }} />

              {activeSubTab === "dar_index_form" ? (
                /* PAGE 1: DAR Case Index (Single Page A4 replication) */
                <div className="print-page space-y-4" style={{ pageBreakAfter: "avoid", breakAfter: "auto" }}>
                  {/* Narrow print stylesheet specifically for the Index to fit exactly on 1 page */}
                  <style dangerouslySetInnerHTML={{ __html: `
                    @media print {
                      @page {
                        size: A4 portrait !important;
                        margin: 10mm 15mm 10mm 15mm !important;
                      }
                      body, #print-area {
                        background: white !important;
                        color: black !important;
                        margin: 0 !important;
                        padding: 0 !important;
                      }
                      .print-table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        margin-top: 5mm !important;
                        margin-bottom: 0 !important;
                      }
                      .print-table th, .print-table td {
                        border: 1px solid black !important;
                        padding: 1.2mm 2.5mm !important;
                        font-size: 9pt !important;
                        line-height: 1.15 !important;
                      }
                      .print-header h2 {
                        font-size: 14pt !important;
                        font-weight: bold !important;
                      }
                      .print-header h3 {
                        font-size: 11pt !important;
                        font-weight: bold !important;
                      }
                      .print-header h4 {
                        font-size: 12pt !important;
                        font-weight: bold !important;
                      }
                    }
                  ` }} />
                  
                  <div className="text-center border-b-[2px] border-black pb-1 print-header">
                    <h2 className="text-sm font-bold uppercase tracking-wide">NORTHEAST FRONTIER RAILWAY</h2>
                    <h3 className="text-xs font-bold uppercase mt-0.5">Katihar Division (Personnel Branch)</h3>
                    <h4 className="text-xs font-extrabold uppercase mt-1 bg-gray-150 py-1 border border-black text-center tracking-wider">
                      INDEX OF DAR CASE
                    </h4>
                  </div>

                  <table className="print-table w-full border-collapse border border-black">
                    <thead>
                      <tr className="bg-gray-100 border-b border-black text-center font-bold">
                        <th className="p-1 border border-black w-10 text-center font-extrabold text-[9.5pt]" style={{ border: '1px solid black' }}>S.No</th>
                        <th className="p-1 border border-black text-left font-extrabold text-[9.5pt]" style={{ border: '1px solid black' }}>Particulars of Items / Case Record Details (विवरण)</th>
                        <th className="p-1 border border-black text-center w-2/5 font-extrabold text-[9.5pt]" style={{ border: '1px solid black' }}>Reference Marks / Folios registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {darIndexFields.map((f) => (
                        <tr key={f.id} className="border-b border-black">
                          <td className="p-1 border border-black text-center font-bold font-mono text-[8.5pt]" style={{ border: '1px solid black' }}>{f.id}</td>
                          <td className="p-1 border border-black font-semibold text-gray-800 text-[8.5pt]" style={{ border: '1px solid black' }}>{f.label}</td>
                          <td className="p-1 border border-black font-bold text-center uppercase text-[8.5pt]" style={{ border: '1px solid black', backgroundColor: 'transparent' }}>
                            {f.value || "..................................................."}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <>
                  {/* PAGE 1: Header, Title and PART-I Table */}
                  <div className="print-page space-y-4">
                    <div className="text-center border-b-[2.5px] border-black pb-2">
                      <h2 className="text-lg font-bold uppercase tracking-wide">NORTHEAST FRONTIER RAILWAY</h2>
                      <h3 className="text-sm font-bold uppercase mt-0.5">Katihar Division (Personnel Branch)</h3>
                      <h4 className="text-[13px] font-extrabold uppercase mt-2.5 bg-gray-100 py-1 border border-black text-center">
                        CHECK LIST FOR HANDING OVER THE D&AR CASES TO HQ/MLG IN RESPECT OF NON-GAZETTED
                      </h4>
                    </div>

                    <div className="space-y-2">
                      <h5 className="font-extrabold text-xs uppercase tracking-wider bg-gray-200 px-2 py-0.5 border border-black">
                        PART-I:: SERVICE AND RELATED PARTICULARS
                      </h5>
                      <table className="w-full border-collapse text-[11px] border border-black">
                        <thead>
                          <tr className="bg-gray-150 border-b border-black text-center font-bold">
                            <th className="p-1.5 border-r border-black w-10 text-center">S.No</th>
                            <th className="p-1.5 border-r border-black text-left">Property Details / Requested Parameters</th>
                            <th className="p-1 text-left w-1/2">Service Record Field Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {part1.map((field, idx) => (
                            <tr key={field.id} className="border-b border-black">
                              <td className="p-1.5 border-r border-black text-center font-bold font-mono">{idx + 1}</td>
                              <td className={`p-1.5 border-r border-black font-semibold ${field.isSubField ? "pl-5 italic text-slate-800" : ""}`}>
                                {cleanLabelForPrint(field.label)}
                              </td>
                              <td className="p-1.5 font-bold uppercase text-slate-900">{field.value || "........................................................"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* PAGE 2: PART-II (Items 1 to 18) */}
                  <div className="print-page space-y-4">
                    <div className="space-y-2">
                      <h5 className="font-extrabold text-xs uppercase tracking-wider bg-gray-200 px-2 py-0.5 border border-black">
                        PART-II DETAILS OF THE CASE RECORDS (ITEMS 1 - 18)
                      </h5>
                      <p className="text-[10px] italic text-gray-700 leading-tight">
                        (All the records are required to be arranged and cross referenced, as indexed below and page number/folios of file/folders to be indicated against each item)
                      </p>

                      <table className="w-full border-collapse text-[10.5px] border border-black">
                        <thead>
                          <tr className="bg-gray-150 border-b border-black text-center font-bold">
                            <th className="p-1 text-center border-r border-black w-10">Item</th>
                            <th className="p-1 border-r border-black text-left">Details of Records in Submission Dossier</th>
                            <th className="p-1 text-center w-40">Status & Folios registered</th>
                          </tr>
                        </thead>
                        <tbody>
                          {part2.filter(f => {
                            const match = f.id.match(/^p2_(\d+)/);
                            if (match) {
                              const num = parseInt(match[1], 10);
                              return num <= 18;
                            }
                            return true;
                          }).map((field) => {
                            const actualIndex = part2.findIndex(f => f.id === field.id);
                            return (
                              <tr key={field.id} className="border-b border-black">
                                <td className="p-1 border-r border-black text-center font-bold font-mono">{actualIndex + 1}</td>
                                <td className={`p-1 border-r border-black font-medium leading-relaxed ${field.isSubField ? "pl-5" : "font-semibold"}`}>
                                  {cleanLabelForPrint(field.label)}
                                </td>
                                <td className={`p-1 font-bold uppercase text-xs tracking-wider bg-gray-50/20 whitespace-pre-line ${
                                  field.id === "p2_13_b" ? "text-left pl-3" : "text-center"
                                }`}>
                                  {getPrintValueForField(field)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* PAGE 3: PART-II (Items 19 to 30) & Signature Block */}
                  <div className="print-page space-y-4">
                    <div className="space-y-2">
                      <h5 className="font-extrabold text-xs uppercase tracking-wider bg-gray-200 px-2 py-0.5 border border-black">
                        PART-II DETAILS OF THE CASE RECORDS (ITEMS 19 - 30) - CONTINUED
                      </h5>

                      <table className="w-full border-collapse text-[10.5px] border border-black">
                        <thead>
                          <tr className="bg-gray-150 border-b border-black text-center font-bold">
                            <th className="p-1 text-center border-r border-black w-10">Item</th>
                            <th className="p-1 border-r border-black text-left">Details of Records in Submission Dossier</th>
                            <th className="p-1 text-center w-40">Status & Folios registered</th>
                          </tr>
                        </thead>
                        <tbody>
                          {part2.filter(f => {
                            const match = f.id.match(/^p2_(\d+)/);
                            if (match) {
                              const num = parseInt(match[1], 10);
                              return num > 18;
                            }
                            return false;
                          }).map((field) => {
                            const actualIndex = part2.findIndex(f => f.id === field.id);
                            return (
                              <tr key={field.id} className="border-b border-black">
                                <td className="p-1 border-r border-black text-center font-bold font-mono">{actualIndex + 1}</td>
                                <td className={`p-1 border-r border-black font-medium leading-relaxed ${field.isSubField ? "pl-5" : "font-semibold"}`}>
                                  {cleanLabelForPrint(field.label)}
                                </td>
                                <td className={`p-1 font-bold uppercase text-xs tracking-wider bg-gray-50/20 whitespace-pre-line ${
                                  field.id === "p2_13_b" ? "text-left pl-3" : "text-center"
                                }`}>
                                  {getPrintValueForField(field)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Signature block and verification statement */}
                    <div className="space-y-3 pt-2">
                      <div className="bg-gray-100 p-2 border border-black space-y-0.5">
                        <div className="flex items-start gap-2 text-[9px] font-bold text-gray-800">
                          <span className="font-mono">**</span>
                          <p>Folio number and folder number should be indicated.</p>
                        </div>
                        <p className="font-extrabold text-[10px] leading-tight uppercase">
                          I have checked the information given in the check list and ensured that the disciplinary case files in original is being sent and have ensured that folio numbers mentioned in the checklist is complete in all respects.
                        </p>
                      </div>

                      <div className="pt-4 grid grid-cols-2 gap-4 text-[10px]">
                        <div className="space-y-6">
                          <div className="space-y-1">
                            <p>Checked and Verified By: ................................................</p>
                            <p>Date: {signatureDate || "........................"}</p>
                          </div>
                          <div>
                            <p className="font-black border-t border-black pt-1 px-1 w-[200px]">Signature</p>
                          </div>
                        </div>

                        <div className="space-y-3 flex flex-col items-end text-right">
                          <div className="space-y-0.5">
                            <p className="font-bold">Name in Block letters: <span className="font-extrabold underline">{signatureName || "...................................."}</span></p>
                            <p>Designation: <span className="underline font-bold">{signatureDesignation || "...................................."}</span></p>
                            <p>Telephone No: <span className="underline font-mono font-semibold">{signaturePhone || "...................................."}</span></p>
                          </div>
                          <div>
                            <p className="font-black border-t border-black pt-1 w-[250px] text-[8px] leading-tight text-center">* To be signed by a Group 'A' or 'B' Officer of the Personnel Department of the Division.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
