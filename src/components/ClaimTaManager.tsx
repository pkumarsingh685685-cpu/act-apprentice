import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { triggerPrint } from '../utils/printHelper';
import { db } from '../firebase';
import { collection, addDoc, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';
import { toast } from 'sonner';
import { Printer, FileText, RotateCcw, Plus, Trash2, ShieldCheck, CheckSquare, Coins, Info, Calendar, Edit3, Eye, Clock } from 'lucide-react';
import { PrintCustomizer, PrintSettings, RenderPrintOverlayWatermark, RenderPrintOverlaySeal, RenderPrintOverlaySignature } from './PrintCustomizer';

interface JourneyLeg {
  id: string;
  stationFrom: string;
  stationTo: string;
  mode: 'Train' | 'Road' | 'Air';
  trainNoOrVehNo: string;
  depDate: string;
  depTime: string; // e.g. 14:30
  arrDate: string;
  arrTime: string; // e.g. 18:45
  purpose: string;
  stoppedDurationHrs: number; // Stoppage hours
  // NEW RULES ACCORDING TO SYSTEM LAWS
  isBreakdownDuty?: boolean;
  isFreeMessingTraining?: boolean;
  isTerritorialArmy?: boolean;
  roadDistanceKm?: number;
  roadType?: 'car_taxi' | 'auto_scooter';
  beyond8Km?: boolean; // defaults to true
  haltSpentAt?: string;
  haltManualText?: string;
}

interface TACase {
  id?: string;
  employeeName: string;
  designation: string;
  empNo: string;
  payLevel: string; // Level 1 to 18
  dailyRate: number; // Calculated based on Level
  journeyLegs: JourneyLeg[];
  hasDeclared: boolean;
  totalAmount: number;
  totalAbsenceHrs: number;
  createdAt: string;
}

const PAY_LEVELS = [
  { level: "Level 1", rate: 500 },
  { level: "Level 2", rate: 500 },
  { level: "Level 3", rate: 500 },
  { level: "Level 4", rate: 500 },
  { level: "Level 5", rate: 500 },
  { level: "Level 6", rate: 800 },
  { level: "Level 7", rate: 800 },
  { level: "Level 8", rate: 800 },
  { level: "Level 9", rate: 900 },
  { level: "Level 10", rate: 900 },
  { level: "Level 11", rate: 900 },
  { level: "Level 12", rate: 1000 }, // updated to match Rs 1000/- for Level 12 & 13
  { level: "Level 13", rate: 1000 },
  { level: "Level 14", rate: 1200 },
  { level: "Level 15", rate: 1200 },
  { level: "Level 16", rate: 1200 },
  { level: "Level 17", rate: 1200 },
  { level: "Level 18", rate: 1200 },
];

export function ClaimTaManager() {
  const storeConfig = useStore((state) => state.config);
  const [employeeName, setEmployeeName] = useState("");
  const [designation, setDesignation] = useState("");
  const [empNo, setEmpNo] = useState("");
  const [payLevel, setPayLevel] = useState("Level 6");
  const [hasDeclared, setHasDeclared] = useState(false);
  
  // Initialize with departure and return leg structures
  const [journeyLegs, setJourneyLegs] = useState<JourneyLeg[]>([
    {
      id: "leg-1",
      stationFrom: "",
      stationTo: "",
      mode: "Train",
      trainNoOrVehNo: "",
      depDate: new Date().toISOString().split('T')[0],
      depTime: "08:00",
      arrDate: new Date().toISOString().split('T')[0],
      arrTime: "14:00",
      purpose: "Official Duty",
      stoppedDurationHrs: 0,
      isBreakdownDuty: false,
      isFreeMessingTraining: false,
      isTerritorialArmy: false,
      roadDistanceKm: 0,
      roadType: 'car_taxi',
      beyond8Km: true
    },
    {
      id: "leg-2",
      stationFrom: "",
      stationTo: "",
      mode: "Train",
      trainNoOrVehNo: "",
      depDate: new Date().toISOString().split('T')[0],
      depTime: "18:00",
      arrDate: new Date().toISOString().split('T')[0],
      arrTime: "23:00",
      purpose: "Return to Headquarters",
      stoppedDurationHrs: 0,
      isBreakdownDuty: false,
      isFreeMessingTraining: false,
      isTerritorialArmy: false,
      roadDistanceKm: 0,
      roadType: 'car_taxi',
      beyond8Km: true
    }
  ]);

  const [savedClaims, setSavedClaims] = useState<TACase[]>([]);
  const componentRef = useRef<HTMLDivElement>(null);

  // Print settings
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

  const [viewMode, setViewMode] = useState<"editor" | "preview">("editor");

  // Pull saved claims from Firestore
  useEffect(() => {
    const q = query(collection(db, "ta_claims"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const claims = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TACase[];
      setSavedClaims(claims);
    }, (err) => {
      console.error("Error loading TA claims:", err);
    });
    return () => unsub();
  }, []);

  const getDailyRate = (level: string) => {
    if (level.includes("Level ")) {
      const lvlNum = parseInt(level.replace("Level ", ""), 10);
      if (!isNaN(lvlNum)) {
        if (lvlNum >= 1 && lvlNum <= 5) {
          return parseInt(storeConfig.ta_rate_l1_l5 || "500", 10);
        }
        if (lvlNum >= 6 && lvlNum <= 8) {
          return parseInt(storeConfig.ta_rate_l6_l8 || "800", 10);
        }
        if (lvlNum >= 9 && lvlNum <= 11) {
          return parseInt(storeConfig.ta_rate_l9_l11 || "900", 10);
        }
        if (lvlNum >= 12 && lvlNum <= 13) {
          return parseInt(storeConfig.ta_rate_l12_l13 || "1000", 10);
        }
        if (lvlNum >= 14 && lvlNum <= 18) {
          return parseInt(storeConfig.ta_rate_l14_l18 || "1200", 10);
        }
      }
    }
    return PAY_LEVELS.find(pl => pl.level === level)?.rate || 800;
  };

  const getLegHours = (leg: JourneyLeg) => {
    if (!leg.depDate || !leg.depTime || !leg.arrDate || !leg.arrTime) return 0;
    const start = new Date(`${leg.depDate}T${leg.depTime}`);
    const end = new Date(`${leg.arrDate}T${leg.arrTime}`);
    const diffMs = end.getTime() - start.getTime();
    if (isNaN(diffMs) || diffMs < 0) return 0;
    return diffMs / (1000 * 60 * 60);
  };

  // Upgraded compliant formula engine for Daily Allowance (DA) & Road Mileage Allowance calculation
  const calculateLegAllowanceDetails = (leg: JourneyLeg, hours: number, dailyRate: number) => {
    if (hours === 0 && !leg.isBreakdownDuty) {
      return { daAmount: 0, mileageAmount: 0, totalLegAmount: 0, percentage: 0 };
    }

    let pct = 0;
    if (leg.isFreeMessingTraining) {
      pct = 0.20; // flat 20% Daily Allowance if undergoing training with free messing
    } else if (leg.isBreakdownDuty) {
      pct = 1.00; // flat 100% Daily Allowance for breakdown duties
    } else {
      // General Absence hours criteria (Absence is split into blocks of 12 hours at 100% each, plus the remainder based on: < 6h: 30%, >= 6h: 70%)
      const full12s = Math.floor(hours / 12);
      const remainder = hours % 12;
      let remainderPct = 0;
      if (remainder > 0) {
        if (remainder < 6) {
          remainderPct = 0.30;
        } else {
          remainderPct = 0.70;
        }
      }
      pct = full12s + remainderPct;
    }

    // Check Headquarters Radius exclusion (No TA if within 8 KM of HQ, unless performing breakdown duties)
    const isEligible = (leg.beyond8Km !== false) || leg.isBreakdownDuty;
    let daAmount = isEligible ? (dailyRate * pct) : 0;

    // Double TA rate for Territorial Army embodiment or active training
    if (leg.isTerritorialArmy) {
      daAmount = daAmount * 2.0;
    }

    // Road mileage allowance calculations
    let mileageAmt = 0;
    if (leg.mode === 'Road' && leg.roadDistanceKm && leg.roadDistanceKm > 0) {
      const kmRate = leg.roadType === 'auto_scooter' ? 12 : 24;
      mileageAmt = leg.roadDistanceKm * kmRate;
    }

    return {
      daAmount: Math.round(daAmount),
      mileageAmount: Math.round(mileageAmt),
      totalLegAmount: Math.round(daAmount + mileageAmt),
      percentage: pct
    };
  };

  const totalDailyRate = getDailyRate(payLevel);

  // Calculate total duration and exact cumulative allowance across all compiled legs
  const processedLegs = journeyLegs.map((leg, index) => {
    const travelHrs = getLegHours(leg);
    
    let haltHrs = 0;
    const nextLeg = journeyLegs[index + 1];
    if (nextLeg && leg.arrDate && leg.arrTime && nextLeg.depDate && nextLeg.depTime) {
      const start = new Date(`${leg.arrDate}T${leg.arrTime}`);
      const end = new Date(`${nextLeg.depDate}T${nextLeg.depTime}`);
      const diffMs = end.getTime() - start.getTime();
      if (!isNaN(diffMs) && diffMs > 0) {
        haltHrs = diffMs / (1000 * 60 * 60);
      }
    }

    const totalHrs = travelHrs + haltHrs;
    const details = calculateLegAllowanceDetails(leg, totalHrs, totalDailyRate);
    const detailsWithoutHalt = calculateLegAllowanceDetails(leg, travelHrs, totalDailyRate);
    const haltDaContributed = Math.max(0, details.daAmount - detailsWithoutHalt.daAmount);
    return {
      ...leg,
      travelHours: travelHrs,
      haltHours: haltHrs,
      hours: totalHrs, // counted for TA!
      daAmount: details.daAmount,
      haltDaContributed: haltDaContributed,
      mileageAmount: details.mileageAmount,
      amount: details.totalLegAmount,
      percentage: details.percentage
    };
  });

  const totalAbsenceHrs = processedLegs.reduce((sum, current) => sum + current.hours, 0);
  const totalAmount = processedLegs.reduce((sum, current) => sum + current.amount, 0);

  const addLeg = () => {
    const lastLeg = journeyLegs[journeyLegs.length - 1];
    const newLeg: JourneyLeg = {
      id: `leg-${Date.now()}`,
      stationFrom: lastLeg?.stationTo || "",
      stationTo: "",
      mode: "Train",
      trainNoOrVehNo: "",
      depDate: lastLeg?.arrDate || new Date().toISOString().split('T')[0],
      depTime: "08:00",
      arrDate: lastLeg?.arrDate || new Date().toISOString().split('T')[0],
      arrTime: "12:00",
      purpose: "Official Duty",
      stoppedDurationHrs: 0,
      isBreakdownDuty: false,
      isFreeMessingTraining: false,
      isTerritorialArmy: false,
      roadDistanceKm: 0,
      roadType: 'car_taxi',
      beyond8Km: true
    };
    setJourneyLegs([...journeyLegs, newLeg]);
  };

  const removeLeg = (id: string) => {
    if (journeyLegs.length <= 1) {
      toast.warning("At least one journey log is required.");
      return;
    }
    setJourneyLegs(journeyLegs.filter(leg => leg.id !== id));
  };

  const updateLegField = (id: string, field: keyof JourneyLeg, value: any) => {
    setJourneyLegs(journeyLegs.map(leg => {
      if (leg.id === id) {
        return { ...leg, [field]: value };
      }
      return leg;
    }));
  };

  const handleSaveClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName || !designation || !empNo) {
      toast.error("Please fill out name, designation and employee number!");
      return;
    }
    if (!hasDeclared) {
      toast.error("Please read and tick the declaration box to claim!");
      return;
    }

    try {
      const docData: TACase = {
        employeeName,
        designation,
        empNo,
        payLevel,
        dailyRate: totalDailyRate,
        journeyLegs,
        hasDeclared,
        totalAmount,
        totalAbsenceHrs,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "ta_claims"), docData);
      toast.success("Travelling Allowance claim record saved to database successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save claim: " + err.message);
    }
  };

  const handlePrint = () => {
    if (!hasDeclared) {
      toast.error("Please state the declaration by ticking the checkbox first.");
      return;
    }
    triggerPrint({
      contentRef: componentRef,
      documentTitle: `Travelling_Allowance_Claim_${employeeName || 'Draft'}`,
      onAfterPrint: () => {
        addDoc(collection(db, "audit_logs"), {
          type: "TA_CLAIM_PRINTED",
          action: `Printed TA Claim Form for employee ${employeeName} (${designation})`,
          details: {
            employeeName,
            designation,
            totalAmount,
            createdAt: new Date().toISOString()
          },
          user: "Internal Employee / Supervisor",
          timestamp: new Date().toISOString(),
          agent: "Personnel Office"
        }).catch(console.error);
      }
    });
  };

  const loadCase = (claim: TACase) => {
    setEmployeeName(claim.employeeName);
    setDesignation(claim.designation);
    setEmpNo(claim.empNo);
    setPayLevel(claim.payLevel);
    setJourneyLegs(claim.journeyLegs || []);
    setHasDeclared(claim.hasDeclared);
    toast.success(`Loaded details for "${claim.employeeName}" into the active editor!`);
  };

  const resetForm = () => {
    setEmployeeName("");
    setDesignation("");
    setEmpNo("");
    setPayLevel("Level 6");
    setHasDeclared(false);
    setJourneyLegs([
      {
        id: "leg-1",
        stationFrom: "",
        stationTo: "",
        mode: "Train",
        trainNoOrVehNo: "",
        depDate: new Date().toISOString().split('T')[0],
        depTime: "08:00",
        arrDate: new Date().toISOString().split('T')[0],
        arrTime: "14:00",
        purpose: "Official Duty",
        stoppedDurationHrs: 0,
        isBreakdownDuty: false,
        isFreeMessingTraining: false,
        isTerritorialArmy: false,
        roadDistanceKm: 0,
        roadType: 'car_taxi',
        beyond8Km: true
      }
    ]);
  };

  const renderPrintSheetContent = () => {
    return (
      <>
        <RenderPrintOverlayWatermark watermark={printSettings.watermark} />
        
        <div className="text-center font-bold mb-6 space-y-1">
          <h2 className="text-[14pt] tracking-wide uppercase">NORTHEAST FRONTIER RAILWAY</h2>
          <h3 className="text-[12pt] uppercase text-gray-700">KATIHAR DIVISION / PERSONNEL DEPARTMENT</h3>
          <h4 className="border-b border-double border-black pb-2 text-[11pt] tracking-normal border-black">
            JOURNAL AND CLAIM FOR TRAVELLING ALLOWANCE (TA) — Rule CPC-7
          </h4>
        </div>

        <div className="grid grid-cols-2 gap-y-2 text-[10pt] mb-6 border border-black p-4 rounded bg-slate-50/20 text-left">
          <div><strong>Employee Name:</strong> <span className="underline">{employeeName || "____________________"}</span></div>
          <div><strong>Designation:</strong> <span className="underline">{designation || "____________________"}</span></div>
          <div><strong>Employee / PF No:</strong> <span className="underline">{empNo || "____________________"}</span></div>
          <div><strong>7th CPC Pay Level:</strong> <span className="underline">{payLevel}</span></div>
          <div><strong>Daily TA Rate (100%):</strong> <span className="underline">₹ {totalDailyRate}</span></div>
        </div>

        <table className="w-full text-left border-collapse border border-black text-[9pt] mb-6">
          <thead>
            <tr className="bg-gray-150">
              <th className="border border-black p-1.5 text-center">Leg</th>
              <th className="border border-black p-1.5">From Station</th>
              <th className="border border-black p-1.5">To Station</th>
              <th className="border border-black p-1.5">Departure Date & Time</th>
              <th className="border border-black p-1.5">Arrival Date & Time</th>
              <th className="border border-black p-1.5">Mode & Vehicle info</th>
              <th className="border border-black p-1.5 text-center">Hours</th>
              <th className="border border-black p-1.5 text-right font-bold">Calculation Rate</th>
              <th className="border border-black p-1.5 text-right font-bold">Claimed Amt</th>
            </tr>
          </thead>
          <tbody>
            {processedLegs.map((leg, index) => {
              const hours = leg.hours;
              let calculationDetail = "0%";
              
              if (leg.isFreeMessingTraining) {
                calculationDetail = "Training w/ Messing (20%)";
              } else if (leg.isBreakdownDuty) {
                calculationDetail = "Breakdown Duty (100% flat)";
              } else if (leg.beyond8Km === false) {
                calculationDetail = "Within 8 KM radius (0%)";
              } else {
                if (hours > 0) {
                  const full12s = Math.floor(hours / 12);
                  const remainder = hours % 12;
                  let parts: string[] = [];
                  if (full12s > 0) {
                    parts.push(`${full12s} x 12h @ 100%`);
                  }
                  if (remainder > 0) {
                    const ratePct = remainder < 6 ? "30%" : "70%";
                    parts.push(`${remainder.toFixed(1)}h @ ${ratePct}`);
                  }
                  calculationDetail = parts.join(" + ");
                } else {
                  calculationDetail = "0 Hrs absence (0%)";
                }
              }

              if (leg.isTerritorialArmy) {
                calculationDetail += " x 2 (Territorial Army rate)";
              }

              return (
                <tr key={leg.id}>
                  <td className="border border-black p-1.5 text-center">{index + 1}</td>
                  <td className="border border-[#bbb] p-1.5 bg-slate-50/10">
                    <div>{leg.stationFrom || "-"}</div>
                    {leg.beyond8Km === false && <span className="text-[7pt] text-rose-800 font-bold block leading-none mt-0.5">(HQ 8km Radius Excluded)</span>}
                  </td>
                  <td className="border border-[#bbb] p-1.5">{leg.stationTo || "-"}</td>
                  <td className="border border-[#bbb] p-1.5 text-[8.5pt]">
                    <div>{leg.depDate}</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{leg.depTime}</div>
                  </td>
                  <td className="border border-[#bbb] p-1.5 text-[8.5pt]">
                    <div>{leg.arrDate}</div>
                    <div className="font-semibold text-slate-800 mt-0.5">{leg.arrTime}</div>
                  </td>
                  <td className="border border-[#bbb] p-1.5">
                    <div className="font-bold">{leg.mode}</div>
                    {leg.trainNoOrVehNo && <div className="text-[8pt] text-gray-600">{leg.trainNoOrVehNo}</div>}
                    {leg.mode === "Road" && (leg.roadDistanceKm || 0) > 0 && (
                      <div className="text-[7.5pt] font-mono text-gray-600 leading-none">
                        Road: {leg.roadDistanceKm} KM @ Rs {leg.roadType === 'auto_scooter' ? '12' : '24'}/KM
                      </div>
                    )}
                    {leg.haltHours > 0 && (
                      <div className="mt-1 pt-1 border-t border-dashed border-gray-350 text-[7.5pt] text-violet-900 bg-gray-50/50 p-1 rounded font-sans leading-normal">
                        <strong>Halt Waiting:</strong> {leg.haltHours.toFixed(1)}h {leg.haltSpentAt === 'manual' ? (leg.haltManualText || 'custom duty') : `spent at "${leg.stationTo || 'destination'}" station`}
                        <div className="text-[8.5pt] text-emerald-800 font-bold mt-0.5 font-sans">Halt Allowance: ₹{leg.haltDaContributed}</div>
                      </div>
                    )}
                  </td>
                  <td className="border border-[#bbb] p-1.5 text-center leading-tight">
                    <div className="font-bold">{hours.toFixed(1)}</div>
                    {leg.haltHours > 0 && (
                      <div className="text-[7pt] text-gray-500 italic mt-0.5">
                        ({leg.travelHours.toFixed(1)}h tr + {leg.haltHours.toFixed(1)}h ht)
                      </div>
                    )}
                  </td>
                  <td className="border border-[#bbb] p-1.5 text-right whitespace-nowrap leading-tight">
                    <div className="font-bold text-[9.5pt]">₹ {leg.daAmount}</div>
                    <div className="text-[7pt] text-gray-500">{calculationDetail}</div>
                    {leg.mileageAmount > 0 && <div className="text-[7.5pt] text-amber-800 font-mono">+ ₹{leg.mileageAmount} Road Mil.</div>}
                  </td>
                  <td className="border border-black p-1.5 text-right font-bold text-[10pt]">₹{leg.amount.toFixed(2)}</td>
                </tr>
              );
            })}
            <tr className="bg-gray-100 font-bold text-[10pt]">
              <td colSpan={6} className="border border-black p-2 text-right">Aggregate Claim Sum:</td>
              <td className="border border-black p-2 text-center">{totalAbsenceHrs.toFixed(1)} Hrs</td>
              <td className="border border-black p-2 text-right">TOTAL TA CLAIMED:</td>
              <td className="border border-black p-2 text-right text-indigo-700 font-extrabold text-[11.5pt]">₹{totalAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div className="space-y-4 text-[10pt] relative mt-12 bg-gray-55 p-4 border border-gray-300 rounded text-left">
          <h4 className="font-bold underline leading-none uppercase">Declaration by claimant railway servant:</h4>
          <p className="italic text-justify text-gray-800 leading-relaxed text-[9.5pt]">
            "I hereby declare that the particulars furnished above are true and accurate to the best of my knowledge and statement. I have remained absent from headquarters as recorded solely on authorized railway duties, and I have not received boarding/lodging benefits at cost of the Administration for these specific halt periods. No secondary Travelling Allowance has been claimed from any other branch."
          </p>
          <div className="flex items-center gap-2 font-bold text-emerald-800">
            [✔] Declared & Accepted Digitally (True particulars verified)
          </div>
        </div>

        <div className="mt-20 flex justify-between text-[10pt] pt-8">
          <div className="text-center w-52 text-left">
            <div className="border-b border-black mb-1 h-8"></div>
            <p className="font-bold uppercase tracking-wider text-[9px] text-gray-600 text-center">Dealing Clerk (Personnel)</p>
          </div>
          
          <div className="text-center w-52 relative text-left">
            <div className="absolute -top-14 left-1/2 -translate-x-1/2 pointer-events-none select-none z-10">
              <RenderPrintOverlaySignature 
                signature={printSettings.signature} 
                sigCursiveText={printSettings.sigCursiveText} 
                sigImageData={printSettings.sigImageData} 
                defaultName={employeeName} 
                scale={printSettings.sigScale}
                xOffset={printSettings.sigXOffset}
                yOffset={printSettings.sigYOffset}
              />
            </div>
            <div className="absolute -top-20 right-0 pointer-events-none select-none z-10">
              <RenderPrintOverlaySeal seal={printSettings.seal} customSealText={printSettings.customSealText} sealImageData={printSettings.sealImageData} />
            </div>
            <div className="border-b border-black mb-1 h-8"></div>
            <p className="font-bold uppercase tracking-wider text-[9px] text-gray-650 text-center">Signature of Railway Servant</p>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 h-full overflow-hidden text-slate-100 font-sans">
      {/* Printable Sheet Panel (Hidden on web UI, triggered on print) */}
      <div style={{ display: 'none' }}>
        <div ref={componentRef} className="p-[15mm] text-black bg-white font-serif leading-relaxed text-[11pt] w-[210mm] min-h-[297mm]">
          {renderPrintSheetContent()}
        </div>
      </div>

      {/* Editor Panel Left side */}
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
        
        {/* Toggle Mode Switcher */}
        <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-1.5 flex items-center justify-between shadow-md shrink-0">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setViewMode("editor")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === "editor"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25 scale-[1.02]"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> 📝 Entry Form (दावा प्रविष्टि)
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                viewMode === "preview"
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25 scale-[1.02]"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> 👁️ Print Preview (प्रिंट प्रीव्यू)
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-2 pr-2 text-[11px] text-emerald-400 font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-100"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Real-time A4 Format render</span>
          </div>
        </div>

        {/* Real-time Customizer Settings */}
        <PrintCustomizer settings={printSettings} onChange={setPrintSettings} />

        {viewMode === "editor" ? (
          <>
            <div className="bg-[#121c32]/95 border border-[#1e2a47] rounded-2xl p-5 shadow-2xl relative overflow-hidden shrink-0 space-y-4">
          <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-5">
            <Coins className="w-40 h-40 text-violet-400" />
          </div>

          <div className="border-b border-[#223354] pb-3.5">
            <h2 className="text-lg font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-5 bg-violet-600 rounded inline-block animate-pulse"></span>
              Travelling Allowance (TA) Claim Terminal (7th CPC rules)
            </h2>
            <p className="text-xs text-slate-400 leading-normal mt-1">
              Configure personnel parameters, journey logs, intermediate halt durations, and instantly compute exact Travelling Allowance rates with fully compliant enterprise formats.
            </p>
          </div>

          <form onSubmit={handleSaveClaim} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Employee Name</label>
              <input 
                type="text" 
                required
                value={employeeName} 
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="e.g. Anand Kumar" 
                className="w-full text-xs bg-slate-900/85 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-violet-500" 
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Designation</label>
              <input 
                type="text" 
                required
                value={designation} 
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. SSE Civil Engineering" 
                className="w-full text-xs bg-slate-900/85 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-violet-500" 
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Employee PF No.</label>
              <input 
                type="text" 
                required
                value={empNo} 
                onChange={(e) => setEmpNo(e.target.value)}
                placeholder="e.g. 50812953245" 
                className="w-full text-xs bg-slate-900/85 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none" 
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">7th CPC Pay Scale Level</label>
              <select 
                value={payLevel} 
                onChange={(e) => setPayLevel(e.target.value)}
                className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
              >
                {PAY_LEVELS.map(pl => (
                  <option key={pl.level} value={pl.level}>{pl.level} (Max ₹{pl.rate}/day)</option>
                ))}
              </select>
            </div>
          </form>
        </div>

        {/* Journey Log Leg Table */}
        <div className="bg-[#121c32]/95 border border-[#1e2a47] rounded-2xl p-5 shadow-2xl relative overflow-hidden flex-1 flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-[#223354] pb-3 shrink-0">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-3 bg-violet-500 rounded-sm"></span>
                Journey Logs & Stops / यात्रा विवरण
              </h3>
              <p className="text-[10px] text-slate-400">Add segments for your departure and arrival legs to determine duty periods.</p>
            </div>
            <button
              type="button"
              onClick={addLeg}
              className="flex items-center gap-1 bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-[11px] px-3.5 py-1.5 rounded-lg mr-2 transition-all shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add Journey Leg
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {processedLegs.map((leg, index) => {
              const hours = leg.hours;
              return (
                <React.Fragment key={leg.id}>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 relative transition-all duration-205">
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                      <span className="text-[11px] font-bold text-violet-400 px-2 py-0.5 bg-violet-950/50 border border-violet-900/60 rounded">
                        Leg #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLeg(leg.id)}
                        className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-950/45 transition-colors"
                        title="Remove core journey item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Input parameters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Station From</label>
                        <input 
                          type="text" 
                          value={leg.stationFrom} 
                          onChange={(e) => updateLegField(leg.id, 'stationFrom', e.target.value)}
                          placeholder="e.g. KIR (Katihar)" 
                          className="w-full text-xs bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Station To</label>
                        <input 
                          type="text" 
                          value={leg.stationTo} 
                          onChange={(e) => updateLegField(leg.id, 'stationTo', e.target.value)}
                          placeholder="e.g. NJP (New Jalpaiguri)" 
                          className="w-full text-xs bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Transport Mode</label>
                        <select 
                          value={leg.mode} 
                          onChange={(e) => updateLegField(leg.id, 'mode', e.target.value)}
                          className="w-full text-xs bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                        >
                          <option value="Train">Train (ट्रेन)</option>
                          <option value="Road">By Road (सड़क मार्ग)</option>
                          <option value="Air">Air (हवाई जहाज)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Train No / Vehicle Code</label>
                        <input 
                          type="text" 
                          value={leg.trainNoOrVehNo} 
                          placeholder="e.g. 12488 / UP-25" 
                          onChange={(e) => updateLegField(leg.id, 'trainNoOrVehNo', e.target.value)}
                          className="w-full text-xs bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase select-none">
                          Departure Date
                        </label>
                        <input 
                          id={`depDate-${leg.id}`}
                          type="date" 
                          value={leg.depDate} 
                          onChange={(e) => updateLegField(leg.id, 'depDate', e.target.value)}
                          onClick={(e) => {
                            try {
                              (e.target as any).showPicker();
                            } catch (_) {}
                          }}
                          className="w-full text-xs bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-violet-500 [color-scheme:dark] cursor-pointer" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase select-none">
                          Departure Time (Left)
                        </label>
                        <input 
                          id={`depTime-${leg.id}`}
                          type="time" 
                          value={leg.depTime} 
                          onChange={(e) => updateLegField(leg.id, 'depTime', e.target.value)}
                          onClick={(e) => {
                            try {
                              (e.target as any).showPicker();
                            } catch (_) {}
                          }}
                          className="w-full text-xs bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-violet-500 [color-scheme:dark] cursor-pointer" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase select-none">
                          Arrival Date
                        </label>
                        <input 
                          id={`arrDate-${leg.id}`}
                          type="date" 
                          value={leg.arrDate} 
                          onChange={(e) => updateLegField(leg.id, 'arrDate', e.target.value)}
                          onClick={(e) => {
                            try {
                              (e.target as any).showPicker();
                            } catch (_) {}
                          }}
                          className="w-full text-xs bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-violet-500 [color-scheme:dark] cursor-pointer" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase select-none">
                          Arrival Time (Arrived)
                        </label>
                        <input 
                          id={`arrTime-${leg.id}`}
                          type="time" 
                          value={leg.arrTime} 
                          onChange={(e) => updateLegField(leg.id, 'arrTime', e.target.value)}
                          onClick={(e) => {
                            try {
                              (e.target as any).showPicker();
                            } catch (_) {}
                          }}
                          className="w-full text-xs bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-violet-500 [color-scheme:dark] cursor-pointer" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase">Purpose of Halt / Duty</label>
                      <input 
                        type="text" 
                        value={leg.purpose} 
                        placeholder="e.g. Inspecting SSE Track registers" 
                        onChange={(e) => updateLegField(leg.id, 'purpose', e.target.value)}
                        className="w-full text-xs bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-white" 
                      />
                    </div>

                    {/* BY ROAD SPECIFIC SUBSYSTEM PANEL */}
                    {leg.mode === 'Road' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-violet-950/20 border border-violet-900/40 p-3 rounded-lg">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-extrabold text-violet-350 uppercase flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-violet-400" /> Road Travel Distance (in KM)
                          </label>
                          <input
                            type="number"
                            value={leg.roadDistanceKm || 0}
                            onChange={(e) => updateLegField(leg.id, 'roadDistanceKm', parseFloat(e.target.value) || 0)}
                            placeholder="e.g. 12"
                            className="w-full text-xs bg-slate-950 border border-violet-900/40 rounded px-2.5 py-1 text-white focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-extrabold text-violet-355 uppercase">
                            Vehicle Type / Allowance Rate
                          </label>
                          <select
                            value={leg.roadType || 'car_taxi'}
                            onChange={(e) => updateLegField(leg.id, 'roadType', e.target.value)}
                            className="w-full text-xs bg-slate-950 border border-violet-900/40 rounded px-2.5 py-1 text-white"
                          >
                            <option value="car_taxi">Own Car / Taxi (₹ 24 per KM)</option>
                            <option value="auto_scooter">Auto Rickshaw / Scooter / Own Bike (₹ 12 per KM)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* CONTROLLER CHECKBOX MODIFIERS REGULATING CPC LAWS */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850/80">
                      <label className="flex items-center gap-1.5 text-[10px] cursor-pointer select-none text-slate-350 hover:text-white transition-colors">
                        <input
                          type="checkbox"
                          checked={leg.beyond8Km !== false}
                          onChange={(e) => updateLegField(leg.id, 'beyond8Km', e.target.checked)}
                          className="rounded border-slate-800 text-violet-600 focus:ring-violet-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span>Beyond 8 km HQ</span>
                      </label>

                      <label className="flex items-center gap-1.5 text-[10px] cursor-pointer select-none text-slate-350 hover:text-white transition-colors" title="Attending breakdown duties guarantees flat 100% daily allowance without the 8 KM distance clause">
                        <input
                          type="checkbox"
                          checked={!!leg.isBreakdownDuty}
                          onChange={(e) => {
                            const val = e.target.checked;
                            updateLegField(leg.id, 'isBreakdownDuty', val);
                            if (val) {
                              updateLegField(leg.id, 'isFreeMessingTraining', false);
                            }
                          }}
                          className="rounded border-slate-800 text-violet-600 focus:ring-violet-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className="text-emerald-400 font-bold">Breakdown Duty</span>
                      </label>

                      <label className="flex items-center gap-1.5 text-[10px] cursor-pointer select-none text-slate-350 hover:text-white transition-colors" title="Undergoing training at centers with free boarding/messing allows 20% flat daily allowance rate">
                        <input
                          type="checkbox"
                          checked={!!leg.isFreeMessingTraining}
                          onChange={(e) => {
                            const val = e.target.checked;
                            updateLegField(leg.id, 'isFreeMessingTraining', val);
                            if (val) {
                              updateLegField(leg.id, 'isBreakdownDuty', false);
                            }
                          }}
                          className="rounded border-slate-800 text-violet-600 focus:ring-violet-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className="text-violet-400">Free Mess Training</span>
                      </label>

                      <label className="flex items-center gap-1.5 text-[10px] cursor-pointer select-none text-slate-350 hover:text-white transition-colors" title="Personnel of the Territorial Army receive double the rate of standard TA while undergoing training embodiment text">
                        <input
                          type="checkbox"
                          checked={!!leg.isTerritorialArmy}
                          onChange={(e) => updateLegField(leg.id, 'isTerritorialArmy', e.target.checked)}
                          className="rounded border-slate-800 text-violet-600 focus:ring-violet-500 h-3.5 w-3.5 cursor-pointer"
                        />
                        <span className="text-amber-400 font-bold">Territorial Army</span>
                      </label>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                      <div className="text-slate-400 font-mono">
                        Leg Duration: <strong className="text-slate-200">{hours.toFixed(1)} Hrs</strong>
                        {leg.beyond8Km === false && !leg.isBreakdownDuty && (
                          <span className="text-rose-400 ml-2 font-bold">(Ineligible: within 8 KM radius)</span>
                        )}
                        {(() => {
                          let desc = "";
                          if (leg.isFreeMessingTraining) desc = "Training w/ Messing (20%)";
                          else if (leg.isBreakdownDuty) desc = "Breakdown flat 100%";
                          else if (leg.beyond8Km === false) desc = "HQ within 8km (0%)";
                          else if (hours > 0) {
                            const full12s = Math.floor(hours / 12);
                            const remainder = hours % 12;
                            let parts: string[] = [];
                            if (full12s > 0) parts.push(`${full12s}x12h@100%`);
                            if (remainder > 0) parts.push(`${remainder.toFixed(1)}h@${remainder < 6 ? "30%" : "70%"}`);
                            desc = parts.join(" + ");
                          }
                          if (leg.isTerritorialArmy && desc) desc += " x 2 (TA)";
                          return desc ? (
                            <span className="text-[10px] text-violet-400 bg-violet-950/40 px-1.5 py-0.5 rounded border border-violet-900/40 ml-2 inline-block">
                              ({desc})
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <div className="text-slate-400 font-mono flex items-center gap-3">
                        {leg.daAmount > 0 && <span>DA: <strong className="text-slate-200">₹ {leg.daAmount}</strong></span>}
                        {leg.mileageAmount > 0 && <span>Mileage: <strong className="text-slate-200">₹ {leg.mileageAmount}</strong></span>}
                        <span>Subtotal: <strong className="text-emerald-400 font-bold">₹{leg.amount}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* AUTOMATED TRANSIT HALT OPTION PANELS */}
                  {leg.haltHours > 0 && (
                    <div className="bg-[#15233c]/80 border border-dashed border-violet-800/40 rounded-xl p-4 space-y-3 relative">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-violet-400 font-bold text-xs">
                          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse"></span>
                          ⌛ Intermediate Waiting/Halt at "{leg.stationTo || 'Destination'}" — {leg.haltHours.toFixed(1)} Hrs
                          {leg.haltDaContributed > 0 && (
                            <span className="text-emerald-400 font-extrabold ml-1 font-mono">
                              (₹ {leg.haltDaContributed})
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/85 px-2 py-0.5 rounded border border-emerald-900/40 font-mono font-bold">
                          Halt Allowance (विराम भत्ता): ₹{leg.haltDaContributed}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-350 leading-normal">
                        Where was this waiting time of <strong>{leg.haltHours.toFixed(1)} hours</strong> spent between Leg #{index + 1} and Leg #{index + 2}?
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[9.5px] font-bold text-slate-450 uppercase mb-1">Halt Location Option / स्थान चयन</label>
                          <select
                            value={leg.haltSpentAt || 'destination'}
                            onChange={(e) => updateLegField(leg.id, 'haltSpentAt', e.target.value)}
                            className="w-full text-xs bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                          >
                            <option value="destination">Spent at destination station "{leg.stationTo || 'Station'}" (Official Duty / ड्यूटी हेतु)</option>
                            <option value="manual">Other / Write manually... (अन्य कार्य / विवरण मैन्युअल लिखें)</option>
                          </select>
                        </div>

                        {leg.haltSpentAt === 'manual' && (
                          <div className="space-y-1">
                            <label className="block text-[9.5px] font-bold text-slate-450 uppercase mb-1">Custom Stoppage Description / विराम का कारण</label>
                            <input
                              type="text"
                              required
                              value={leg.haltManualText || ''}
                              onChange={(e) => updateLegField(leg.id, 'haltManualText', e.target.value)}
                              placeholder="e.g. Connected train waiting at DRM office / यार्ड निरीक्षण"
                              className="w-full text-xs bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Declaration and Action buttons */}
          <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-3 shrink-0">
            <div className="flex items-start gap-2 text-xs">
              <input 
                id="declaration-chk"
                type="checkbox" 
                checked={hasDeclared}
                onChange={(e) => setHasDeclared(e.target.checked)}
                className="mt-0.5 rounded border-slate-800 text-indigo-600 focus:ring-violet-500 cursor-pointer h-4 w-4"
              />
              <label htmlFor="declaration-chk" className="text-slate-350 select-none cursor-pointer leading-normal text-justify">
                I hereby declare that the particulars given above are true and complete, and that I did not draw any duplicate Travelling Allowance (TA) benefits for this period.
              </label>
            </div>

            <div className="border-t border-slate-800 pt-3 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-left font-mono text-xs text-slate-400">
                Total hours of absence: <span className="text-white font-extrabold">{totalAbsenceHrs.toFixed(1)} Hrs</span>, 
                Aggregate Sum Rate: <span className="text-emerald-400 font-extrabold text-sm ml-1">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-xs font-bold font-sans cursor-pointer transition-all border border-slate-700"
                >
                  <RotateCcw className="w-4 h-4" /> Clear
                </button>
                <button
                  type="button"
                  onClick={handleSaveClaim}
                  className="flex items-center gap-1 bg-violet-600 hover:bg-violet-750 text-white px-4 py-2 rounded-lg text-xs font-extrabold font-sans cursor-pointer transition-all shadow"
                >
                  <CheckSquare className="w-4 h-4" /> Save Record
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-750 text-white px-4 py-2 rounded-lg text-xs font-extrabold font-sans cursor-pointer transition-all shadow"
                >
                  <Printer className="w-4 h-4" /> Print TA Bill
                </button>
              </div>
            </div>
          </div>
        </div>
          </>
        ) : (
          <div className="bg-[#121c32]/55 border border-[#1e2a47] rounded-2xl p-2 md:p-6 shadow-2xl flex flex-col items-center justify-start overflow-auto">
            <div className="text-center mb-4 flex items-center gap-3">
              <span className="text-xs bg-indigo-950/80 border border-indigo-800 text-indigo-400 py-1.5 px-4 rounded-full font-mono font-bold tracking-wider">
                A4 Official Sheet Preview (A4 शीट पूर्वावलोकन)
              </span>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 bg-emerald-650 hover:bg-emerald-700 bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow cursor-pointer uppercase tracking-wider"
              >
                <Printer className="w-4 h-4" /> Print TA Bill (प्रिंट)
              </button>
            </div>
            <div className="w-full overflow-x-auto flex justify-start lg:justify-center p-1 md:p-4">
              <div className="bg-white text-black p-[15mm] font-serif leading-relaxed text-[11pt] w-[210mm] min-h-[297mm] shadow-[0_0_30px_rgba(0,0,0,0.6)] border border-gray-300 rounded shrink-0 my-2 select-text">
                {renderPrintSheetContent()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Panel Right side - Saved Logs history & Guidelines */}
      <div className="w-full lg:w-80 flex flex-col gap-4 overflow-y-auto shrink-0 select-none">
        
        {/* Recent logs */}
        <div className="bg-[#0e1628]/95 border border-[#1e2a47] rounded-2xl p-4 flex flex-col gap-2 shrink-0">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-[#223354] pb-2 flex items-center gap-1.5 shrink-0">
            <Calendar className="w-4 h-4 text-violet-400" />
            Recent TA Claims / जमा रिकॉर्ड
          </h3>

          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
            {savedClaims.map(claim => (
              <div 
                key={claim.id} 
                onClick={() => loadCase(claim)}
                className="bg-slate-900 hover:bg-slate-850/80 p-2.5 rounded-xl border border-slate-800 hover:border-violet-500/50 cursor-pointer transition-all duration-150 text-left space-y-1 group relative"
              >
                <div className="flex justify-between items-start">
                  <div className="font-bold text-xs text-white max-w-[150px] truncate uppercase">
                    {claim.employeeName}
                  </div>
                  <div className="font-black text-emerald-450 font-mono text-[10px] bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-900/30">
                    ₹{claim.totalAmount.toFixed(0)}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 italic truncate leading-none">
                  {claim.designation} ({claim.payLevel})
                </p>
                <div className="text-[8.5px] font-mono text-slate-500 flex justify-between">
                  <span>{claim.empNo}</span>
                  <span className="flex items-center gap-1 font-mono"><Calendar className="w-2.5 h-2.5 text-slate-500" /> {new Date(claim.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {savedClaims.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-xs">
                No database records. Use the editor to draft and save your first TA claim.
              </div>
            )}
          </div>
        </div>

        {/* GUIDELINES REFERENCE CARD */}
        <div className="bg-gradient-to-b from-[#14203a] to-[#0e1628] border border-[#1f2f53] rounded-2xl p-4 text-left space-y-3 shrink-0 shadow-lg">
          <h3 className="text-[11px] font-extrabold text-violet-400 uppercase tracking-widest border-b border-[#223354] pb-1.5 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-violet-400" />
            Official TA Rules Reference / यात्रा भत्ता नियम
          </h3>

          <div className="space-y-3 text-xs">
            {/* Level Rates */}
            <div className="space-y-1">
              <span className="font-bold text-slate-200">1. Daily Allowance (DA) by Level:</span>
              <div className="space-y-0.5 text-[9.5px] font-medium font-mono text-slate-400 bg-slate-950 p-2 rounded border border-slate-850">
                <div className="flex justify-between"><span>Level-14 & above</span> <span>₹ 1200/-</span></div>
                <div className="flex justify-between"><span>Level-12 & 13</span> <span>₹ 1000/-</span></div>
                <div className="flex justify-between"><span>Level-09 to 11</span> <span>₹ 900/-</span></div>
                <div className="flex justify-between"><span>Level-06 to 08</span> <span>₹ 800/-</span></div>
                <div className="flex justify-between"><span>Level-05 & below</span> <span>₹ 500/-</span></div>
              </div>
            </div>

            {/* Absence rules */}
            <div className="space-y-1">
              <span className="font-bold text-slate-200">2. Absence from HQ Multiplier:</span>
              <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-slate-400">
                <li><strong>Under 6 Hrs:</strong> 30% of daily allowance rate.</li>
                <li><strong>6:00 to 12:00 Hrs:</strong> 70% of daily allowance rate.</li>
                <li><strong>Over 12 Hrs:</strong> 100% of daily allowance rate.</li>
                <li>Required: travels beyond <strong>8.00 KM</strong> of HQ.</li>
              </ul>
            </div>

            {/* Mileage Rules */}
            <div className="space-y-1">
              <span className="font-bold text-slate-200">3. Road Mileage Rates:</span>
              <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-slate-400">
                <li><strong>Own Car / Taxi:</strong> ₹24 per KM</li>
                <li><strong>Auto / Scooter:</strong> ₹12 per KM</li>
              </ul>
            </div>

            {/* Notes Section */}
            <div className="space-y-1 pt-1 border-t border-slate-800">
              <span className="font-bold text-slate-200">4. Exception Clauses:</span>
              <ul className="space-y-1 text-[9.5px] text-slate-400 leading-normal">
                <li>
                  <strong className="text-emerald-400">Breakdown duty (Note 1):</strong> 100% flat daily allowance is admissible without standard 8 KM boundary rules.
                </li>
                <li>
                  <strong className="text-violet-450">Free Mess training (Note 2):</strong> Under free boarding & lodging (mess), 20% of standard daily rate is admissible.
                </li>
                <li>
                  <strong className="text-amber-400">Territorial Army (Note 3):</strong> TA is calculated at double (2x) standard scale rates during active embodiments.
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
