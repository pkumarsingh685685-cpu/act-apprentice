import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { triggerPrint } from '../utils/printHelper';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';
import { toast } from 'sonner';
import { Printer, FileText, RotateCcw, Plus, Trash2, ShieldCheck, CheckSquare, Coins, Info, Calendar, Edit3, Eye, Clock, ChevronsLeftRight, ChevronsRightLeft } from 'lucide-react';
import { PrintCustomizer, PrintSettings, RenderPrintOverlayWatermark, RenderPrintOverlaySeal, RenderPrintOverlaySignature } from './PrintCustomizer';
import { INDIAN_STATIONS, findStation, getStationDistance, registerStation } from '../utils/stationHelper';

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
  trainName?: string;
  trainRouteVia?: string;
}

interface ContingentItem {
  id: string;
  amount: number;
  remarks: string;
}

interface TACase {
  id?: string;
  employeeName: string;
  designation: string;
  empNo: string;
  payLevel: string; // Level 1 to 18
  dailyRate: number; // Calculated based on Level
  journeyLegs: JourneyLeg[];
  contingentItems?: ContingentItem[];
  hasDeclared: boolean;
  totalAmount: number;
  totalAbsenceHrs: number;
  createdAt: string;
  division?: string;
  department?: string;
  claimMonth?: string;
  claimYear?: string;
  billUnit?: string;
  calculationMode?: 'calendar_day' | 'continuous';
  globalPurpose?: string;
  showSummaryTable?: boolean;
  showClaimantSig?: boolean;
  showCounterSig?: boolean;
  showHeadOfficeSig?: boolean;
  showControllingOfficerSig?: boolean;
}

const MONTHS_LIST = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const YEARS_LIST = [
  "2023", "2024", "2025", "2026", "2027", "2028", "2029", "2030"
];

const INDIAN_RAILWAY_DIVISIONS = [
  "KATIHAR",
  "ALIPURDUAR",
  "LUMDING",
  "RANGIYA",
  "TINSUKIA",
  "HOWRAH",
  "SEALDAH",
  "ASANSOL",
  "MALDA",
  "MUMBAI CST",
  "BHUSAWAL",
  "PUNE",
  "SOLAPUR",
  "NAGPUR (CR)",
  "DELHI",
  "AMBALA",
  "FIROZPUR",
  "LUCKNOW (NR)",
  "MORADABAD",
  "LUCKNOW (NER)",
  "IZATNAGAR",
  "VARANASI",
  "DANAPUR",
  "DHANBAD",
  "MUGHALSARAI / PT. DEEN DAYAL UPADHYAYA",
  "SAMASTIPUR",
  "SONPUR",
  "JHANSI",
  "AGRA",
  "PRAYAGRAJ",
  "JAIPUR",
  "AJMER",
  "BIKANER",
  "JODHPUR",
  "CHENNAI",
  "TIRUCHIRAPPALLI",
  "MADURAI",
  "PALAKKAD",
  "TRIVANDRUM",
  "SALEM",
  "SECUNDERABAD",
  "HYDERABAD",
  "VIJAYAWADA",
  "GUNTAKAL",
  "GUNTUR",
  "NANDED",
  "KHARAGPUR",
  "ADRA",
  "CHAKRADHARPUR",
  "RANCHI",
  "JABALPUR",
  "BHOPAL",
  "KOTA",
  "MUMBAI CENTRAL",
  "VADODARA",
  "AHMEDABAD",
  "RATLAM",
  "RAJKOT",
  "BHAVNAGAR",
  "BILASPUR",
  "RAIPUR",
  "NAGPUR (SECR)",
  "HUBBALLI",
  "BENGALURU",
  "MYSURU",
  "KHURDA ROAD",
  "SAMBALPUR",
  "VISAKHAPATNAM"
];

const INDIAN_RAILWAY_DEPARTMENTS = [
  "PERSONNEL",
  "ACCOUNTS",
  "CIVIL ENGINEERING",
  "COMMERCIAL",
  "ELECTRICAL",
  "MECHANICAL",
  "MEDICAL",
  "OPERATING",
  "SAFETY",
  "SIGNAL & TELECOMMUNICATION",
  "SECURITY (RPF)",
  "STORES"
];

const PAY_LEVELS = [
  { level: "Level 1", rate: 625 },
  { level: "Level 2", rate: 625 },
  { level: "Level 3", rate: 625 },
  { level: "Level 4", rate: 625 },
  { level: "Level 5", rate: 625 },
  { level: "Level 6", rate: 1000 },
  { level: "Level 7", rate: 1000 },
  { level: "Level 8", rate: 1000 },
  { level: "Level 9", rate: 1125 },
  { level: "Level 10", rate: 1125 },
  { level: "Level 11", rate: 1125 },
  { level: "Level 12", rate: 1250 },
  { level: "Level 13", rate: 1250 },
  { level: "Level 14", rate: 1500 },
  { level: "Level 15", rate: 1500 },
  { level: "Level 16", rate: 1500 },
  { level: "Level 17", rate: 1500 },
  { level: "Level 18", rate: 1500 },
];

const RAILWAY_DESIGNATIONS = [
  "Senior Section Engineer (SSE)",
  "Junior Engineer (JE)",
  "Station Master (SM)",
  "Assistant Station Master (ASM)",
  "Pointsman",
  "Loco Pilot (LP)",
  "Assistant Loco Pilot (ALP)",
  "Guard / Train Manager",
  "Ticket Examiner (TE)",
  "Senior Ticket Examiner (Sr. TE)",
  "Chief Ticket Inspector (CTI)",
  "Chief Booking Supervisor (CBS)",
  "Booking Clerk",
  "Chief Parcel Supervisor (CPS)",
  "Office Superintendent (OS)",
  "Senior Clerk",
  "Junior Clerk",
  "Track Maintainer Grade-I",
  "Track Maintainer Grade-II",
  "Track Maintainer Grade-III",
  "Track Maintainer Grade-IV",
  "Keyman",
  "Mate",
  "Gatekeeper",
  "Technician Grade-I",
  "Technician Grade-II",
  "Technician Grade-III",
  "Senior Technician",
  "Helper / Khalasi",
  "Assistant Personnel Officer (APO)",
  "Divisional Personnel Officer (DPO)",
  "Senior Divisional Personnel Officer (Sr. DPO)",
  "Assistant Commercial Manager (ACM)",
  "Divisional Commercial Manager (DCM)",
  "Senior Divisional Commercial Manager (Sr. DCM)",
  "Assistant Divisional Electrical Engineer (ADEE)",
  "Divisional Electrical Engineer (DEE)",
  "Senior Divisional Electrical Engineer (Sr. DEE)",
  "Assistant Divisional Mechanical Engineer (ADME)",
  "Divisional Mechanical Engineer (DME)",
  "Senior Divisional Mechanical Engineer (Sr. DME)",
  "Assistant Divisional Signal & Telecom Engineer (ADSTE)",
  "Divisional Signal & Telecom Engineer (DSTE)",
  "Senior Divisional Signal & Telecom Engineer (Sr. DSTE)",
  "Assistant Divisional Engineer (ADEN)",
  "Divisional Engineer (DEN)",
  "Senior Divisional Engineer (Sr. DEN)",
  "Assistant Security Commissioner (ASC)",
  "Divisional Security Commissioner (DSC)",
  "Senior Divisional Security Commissioner (Sr. DSC)",
  "RPF Inspector",
  "RPF Sub-Inspector",
  "RPF Constable",
  "Pharmacist",
  "Nursing Superintendent",
  "Assistant Divisional Finance Manager (ADFM)",
  "Divisional Finance Manager (DFM)",
  "Senior Divisional Finance Manager (Sr. DFM)",
  "Assistant Divisional Operations Manager (AOM)",
  "Divisional Operations Manager (DOM)",
  "Senior Divisional Operations Manager (Sr. DOM)",
  "Additional Divisional Railway Manager (ADRM)",
  "Divisional Railway Manager (DRM)"
];

export interface ClaimTaManagerProps {
  showSidebars?: boolean;
  onToggleSidebars?: (show: boolean) => void;
}

export function ClaimTaManager({ showSidebars, onToggleSidebars }: ClaimTaManagerProps) {
  const storeConfig = useStore((state) => state.config);
  const [employeeName, setEmployeeName] = useState("");
  const [designation, setDesignation] = useState("");
  const [empNo, setEmpNo] = useState("");
  const [payLevel, setPayLevel] = useState("");
  const [division, setDivision] = useState("");
  const [department, setDepartment] = useState("");
  const [claimMonth, setClaimMonth] = useState("");
  const [claimYear, setClaimYear] = useState("");
  const [billUnit, setBillUnit] = useState("");
  const [calculationMode, setCalculationMode] = useState<'calendar_day' | 'continuous'>('calendar_day');
  const [isLandscape, setIsLandscape] = useState(true);
  const [hasDeclared, setHasDeclared] = useState(false);
  const [globalPurpose, setGlobalPurpose] = useState("Official Duty");
  
  // Initialize with departure and return leg structures (empty and required, no mock values)
  const [journeyLegs, setJourneyLegs] = useState<JourneyLeg[]>([
    {
      id: "leg-1",
      stationFrom: "",
      stationTo: "",
      mode: "Train",
      trainNoOrVehNo: "",
      depDate: "",
      depTime: "",
      arrDate: "",
      arrTime: "",
      purpose: "",
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
  const [contingentItems, setContingentItems] = useState<ContingentItem[]>([]);
  const componentRef = useRef<HTMLDivElement>(null);

  // Signature selection visibility toggles
  const [showClaimantSig, setShowClaimantSig] = useState(true);
  const [showCounterSig, setShowCounterSig] = useState(true);
  const [showHeadOfficeSig, setShowHeadOfficeSig] = useState(true);
  const [showControllingOfficerSig, setShowControllingOfficerSig] = useState(true);
  const [showSummaryTable, setShowSummaryTable] = useState(true);

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
  const [activeAutocomplete, setActiveAutocomplete] = useState<{ legId: string, field: 'stationFrom' | 'stationTo' } | null>(null);
  const [stationSearch, setStationSearch] = useState<string>("");
  const [isSearchingStation, setIsSearchingStation] = useState<Record<string, boolean>>({});
  const [isSearchingTrain, setIsSearchingTrain] = useState<Record<string, boolean>>({});

  // Dynamic / Custom Station Manager State
  const [newStationCode, setNewStationCode] = useState("");
  const [newStationName, setNewStationName] = useState("");
  const [newStationHindi, setNewStationHindi] = useState("");
  const [stationShowImporter, setStationShowImporter] = useState(false);
  const [bulkStationText, setBulkStationText] = useState("");
  const [stationQuerySearch, setStationQuerySearch] = useState("");

  const handleSearchStationOnline = async (legId: string, field: 'stationFrom' | 'stationTo', queryText: string) => {
    if (!queryText.trim()) return;
    const cacheKey = `${legId}-${field}`;
    setIsSearchingStation(prev => ({ ...prev, [cacheKey]: true }));
    try {
      const res = await fetch("/api/railway/search-station", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText })
      });
      const data = await res.json();
      if (data.success && data.station) {
        registerStation(data.station);
        toast.success(`Found station: ${data.station.name} (${data.station.code})`);
        handleSelectStation(legId, field, data.station.code);
      } else {
        toast.error("Station not found. Check spelling or type in manually.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Connection error while calling search API.");
    } finally {
      setIsSearchingStation(prev => ({ ...prev, [cacheKey]: false }));
    }
  };

  const handleManualAddStation = () => {
    const code = newStationCode.trim().toUpperCase();
    const name = newStationName.trim();
    const hindi = newStationHindi.trim();

    if (!code) {
      toast.error("Please enter a valid Station Code (e.g. BSP).");
      return;
    }
    if (!name) {
      toast.error("Please enter a Station Name (e.g. Bilaspur Jn).");
      return;
    }

    const reg = {
      code,
      name,
      hindiName: hindi || name,
      lat: 20,
      lng: 78
    };

    registerStation(reg);
    toast.success(`Successfully registered custom station: ${name} (${code})`);
    
    // Clear fields
    setNewStationCode("");
    setNewStationName("");
    setNewStationHindi("");
  };

  const handleBulkImportStations = () => {
    if (!bulkStationText.trim()) {
      toast.error("Please paste some station data first.");
      return;
    }

    const lines = bulkStationText.split("\n");
    let count = 0;
    
    lines.forEach(line => {
      if (!line.trim()) return;
      const commaParts = line.split(/[,\t;]/);
      if (commaParts.length >= 2) {
        const code = commaParts[0].trim().toUpperCase();
        const name = commaParts[1].trim();
        const hindi = commaParts[2] ? commaParts[2].trim() : name;
        if (code && name && code.length <= 10 && code.length >= 1) {
          registerStation({ code, name, hindiName: hindi, lat: 20, lng: 78 });
          count++;
        }
      } else {
        // Space separated line, e.g. "BSP Bilaspur Jn" or "NDLS New Delhi"
        const match = line.trim().match(/^([A-Za-z0-9]{1,10})\s+(.+)$/);
        if (match) {
          const code = match[1].trim().toUpperCase();
          const rest = match[2].trim();
          let name = rest;
          let hindi = rest;
          const hindiMatch = rest.match(/(.+?)\s*[\(\[]([^\)\]]+)[\)\]]/);
          if (hindiMatch) {
            name = hindiMatch[1].trim();
            hindi = hindiMatch[2].trim();
          }
          registerStation({ code, name, hindiName: hindi, lat: 20, lng: 78 });
          count++;
        }
      }
    });

    if (count > 0) {
      toast.success(`Successfully imported ${count} custom stations!`);
      setBulkStationText("");
      setStationShowImporter(false);
    } else {
      toast.error("Could not parse any stations. Use 'BSP Bilaspur Jn' or 'CODE,Name,HindiName' formats (one per line).");
    }
  };

  const handleLookupTrain = async (legId: string, queryStr: string) => {
    const cleanStr = queryStr.trim();
    if (!cleanStr) return;
    setIsSearchingTrain(prev => ({ ...prev, [legId]: true }));

    // Find the current leg to get existing stations
    const currentLeg = journeyLegs.find(l => l.id === legId);
    const stationFrom = currentLeg?.stationFrom || "";
    const stationTo = currentLeg?.stationTo || "";

    try {
      const res = await fetch("/api/railway/lookup-train", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: cleanStr,
          stationFrom,
          stationTo
        })
      });
      const data = await res.json();
      if (data.success && data.train) {
        updateLegField(legId, 'trainName', data.train.trainName);
        if (data.train.trainNo && cleanStr !== data.train.trainNo) {
          updateLegField(legId, 'trainNoOrVehNo', data.train.trainNo);
        }
        if (data.train.routeVia) {
          updateLegField(legId, 'trainRouteVia', data.train.routeVia);
        }
        if (typeof data.train.routeDistanceKm === 'number' && data.train.routeDistanceKm > 0) {
          updateLegField(legId, 'roadDistanceKm', data.train.routeDistanceKm);
          toast.success(`Track distance updated based on Train Route: ${data.train.routeDistanceKm} KM!`);
        } else {
          toast.success(`Train Verified: ${data.train.trainName}`);
        }
      } else {
        toast.error("Train not found online. You can still input manually.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to connect to train details server.");
    } finally {
      setIsSearchingTrain(prev => ({ ...prev, [legId]: false }));
    }
  };

  const [localShowSidebars, setLocalShowSidebars] = useState<boolean>(false);
  const isSidebarsShown = onToggleSidebars !== undefined ? !!showSidebars : localShowSidebars;
  const toggleSidebars = () => {
    if (onToggleSidebars) {
      onToggleSidebars(!showSidebars);
    } else {
      setLocalShowSidebars(prev => !prev);
    }
  };

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
      try {
        handleFirestoreError(err, OperationType.LIST, "ta_claims");
      } catch (e) {
        console.error("Suppressed or reformatted error:", e);
      }
    });
    return () => unsub();
  }, []);

  const getDailyRate = (level: string) => {
    if (level.includes("Level ")) {
      const lvlNum = parseInt(level.replace("Level ", ""), 10);
      if (!isNaN(lvlNum)) {
        if (lvlNum >= 1 && lvlNum <= 5) {
          return parseInt(storeConfig.ta_rate_l1_l5 || "625", 10);
        }
        if (lvlNum >= 6 && lvlNum <= 8) {
          return parseInt(storeConfig.ta_rate_l6_l8 || "1000", 10);
        }
        if (lvlNum >= 9 && lvlNum <= 11) {
          return parseInt(storeConfig.ta_rate_l9_l11 || "1125", 10);
        }
        if (lvlNum >= 12 && lvlNum <= 13) {
          return parseInt(storeConfig.ta_rate_l12_l13 || "1250", 10);
        }
        if (lvlNum >= 14 && lvlNum <= 18) {
          return parseInt(storeConfig.ta_rate_l14_l18 || "1500", 10);
        }
      }
    }
    return PAY_LEVELS.find(pl => pl.level === level)?.rate || 1000;
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

  // 1. Calculate travel hours and halt hours for each leg raw
  const rawLegs = journeyLegs.map((leg, index) => {
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
    const totalLegHrs = travelHrs + haltHrs;
    return {
      ...leg,
      purpose: globalPurpose || leg.purpose || "Official Duty",
      travelHours: travelHrs,
      haltHours: haltHrs,
      hours: totalLegHrs
    };
  });

  // 2. Compute total continuous absence hours
  const totalAbsenceHrs = rawLegs.reduce((sum, current) => sum + current.hours, 0);

  // 3. Compute continuous daily allowance percentage for the entire journey
  const getContinuousDaPct = (hours: number) => {
    if (hours <= 0) return 0;
    
    // Check if any training flat rules apply across legs
    const isFreeTraining = journeyLegs.some(l => l.isFreeMessingTraining);
    const isBreakdown = journeyLegs.some(l => l.isBreakdownDuty);
    
    if (isFreeTraining) {
      return 0.20; // 20% flat for training with free messing
    }
    if (isBreakdown) {
      return 1.00; // 100% flat for breakdown duty
    }

    // Standard Railway TA formula: 12h periods at 100% + remaining remainder (<6h is 30%, >=6h is 70%)
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
    return full12s + remainderPct;
  };

  // Helper to split continuous tour by calendar day (midnight to midnight)
  const getCalendarDaysBreakdown = () => {
    const list: { date: string; hours: number; pct: number; detail: string; amount: number }[] = [];
    if (rawLegs.length === 0) return list;
    
    const firstLeg = rawLegs[0];
    const lastLeg = rawLegs[rawLegs.length - 1];
    if (!firstLeg?.depDate || !firstLeg?.depTime || !lastLeg?.arrDate || !lastLeg?.arrTime) return list;
    
    try {
      const startDt = new Date(`${firstLeg.depDate}T${firstLeg.depTime}`);
      const endDt = new Date(`${lastLeg.arrDate}T${lastLeg.arrTime}`);
      
      if (isNaN(startDt.getTime()) || isNaN(endDt.getTime()) || endDt < startDt) {
        return list;
      }
      
      const startMs = startDt.getTime();
      const endMs = endDt.getTime();
      
      // Get chronological list of YYYY-MM-DD strings from start to end
      let current = new Date(startDt.getFullYear(), startDt.getMonth(), startDt.getDate());
      const endDay = new Date(endDt.getFullYear(), endDt.getMonth(), endDt.getDate());
      
      const isFreeTraining = journeyLegs.some(l => l.isFreeMessingTraining);
      const isBreakdown = journeyLegs.some(l => l.isBreakdownDuty);
      const isTAEnabled = journeyLegs.some(l => l.isTerritorialArmy);

      let safetyCounter = 0;
      while (current <= endDay && safetyCounter < 100) {
        safetyCounter++;
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const dd = String(current.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        
        // Define day boundaries in local time
        const dayStartMs = new Date(`${dateStr}T00:00:00`).getTime();
        const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000;
        
        const overlapStartMs = Math.max(startMs, dayStartMs);
        const overlapEndMs = Math.min(endMs, dayEndMs);
        
        let hoursInDay = 0;
        if (overlapEndMs > overlapStartMs) {
          hoursInDay = (overlapEndMs - overlapStartMs) / (1000 * 60 * 60);
        }
        
        let pct = 0;
        let detail = "";
        
        if (hoursInDay > 0) {
          if (isFreeTraining) {
            pct = 0.20;
            detail = "Flat 20% Training Rate";
          } else if (isBreakdown) {
            pct = 1.00;
            detail = "Flat 100% Breakdown Rate";
          } else {
            if (hoursInDay < 6) {
              pct = 0.30;
              detail = `<6 Hrs absence (30%)`;
            } else if (hoursInDay <= 12) {
              pct = 0.70;
              detail = `6 to 12 Hrs absence (70%)`;
            } else {
              pct = 1.00;
              detail = `>12 Hrs absence (100%)`;
            }
          }
        } else {
          pct = 0;
          detail = "No tour active";
        }
        
        let dayDaAmount = Math.round(totalDailyRate * pct);
        if (isTAEnabled) {
          dayDaAmount = dayDaAmount * 2;
        }

        list.push({
          date: dateStr,
          hours: hoursInDay,
          pct: pct,
          detail: detail,
          amount: dayDaAmount
        });
        
        current.setDate(current.getDate() + 1);
      }
    } catch (e) {
      console.error("Error computing calendar breakdown:", e);
    }
    return list;
  };

  const calendarDaysBreakdown = getCalendarDaysBreakdown();

  const continuousDaPct = (calculationMode === 'calendar_day' && calendarDaysBreakdown.length > 0)
    ? calendarDaysBreakdown.reduce((sum, current) => sum + current.pct, 0)
    : getContinuousDaPct(totalAbsenceHrs);
  
  // Check if at least one leg went beyond 8 KM or is breakdown duty to make the entire journey eligible
  const isEntireTourEligible = journeyLegs.some(leg => (leg.beyond8Km !== false) || leg.isBreakdownDuty);
  
  // Base continuous DA amount
  let baseContinuousDaAmount = isEntireTourEligible ? (totalDailyRate * continuousDaPct) : 0;
  
  // Check if Territorial Army double rate is active on any leg
  const isTAEnabled = journeyLegs.some(leg => leg.isTerritorialArmy);
  if (isTAEnabled) {
    baseContinuousDaAmount = baseContinuousDaAmount * 2.0;
  }
  
  const totalContinuousDaAmount = Math.round(baseContinuousDaAmount);

  // Helper to split a leg's continuous window by calendar day
  const getLegCalendarBreakdown = (leg: any, index: number) => {
    const list: { date: string; hours: number; dayTotalHours: number; dayPct: number; amount: number }[] = [];
    if (!leg.depDate || !leg.depTime || !leg.arrDate || !leg.arrTime) return list;
    
    try {
      const legStartDt = new Date(`${leg.depDate}T${leg.depTime}`);
      let legEndDt: Date;
      const nextLeg = rawLegs[index + 1];
      if (nextLeg?.depDate && nextLeg?.depTime) {
        legEndDt = new Date(`${nextLeg.depDate}T${nextLeg.depTime}`);
      } else {
        legEndDt = new Date(`${leg.arrDate}T${leg.arrTime}`);
      }
      
      if (isNaN(legStartDt.getTime()) || isNaN(legEndDt.getTime()) || legEndDt < legStartDt) {
        return list;
      }
      
      // Let's loop over all dates in calendarDaysBreakdown that overlap with this leg
      calendarDaysBreakdown.forEach(day => {
        const dayStartMs = new Date(`${day.date}T00:00:00`).getTime();
        const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000;
        
        const overlapStartMs = Math.max(legStartDt.getTime(), dayStartMs);
        const overlapEndMs = Math.min(legEndDt.getTime(), dayEndMs);
        
        if (overlapEndMs > overlapStartMs) {
          const legHoursInDay = (overlapEndMs - overlapStartMs) / (1000 * 60 * 60);
          if (legHoursInDay > 0 && day.hours > 0) {
            // Share of this day's DA amount
            const fraction = legHoursInDay / day.hours;
            let legDayAmt = Math.round(day.amount * fraction);
            list.push({
              date: day.date,
              hours: legHoursInDay,
              dayTotalHours: day.hours,
              dayPct: day.pct,
              amount: legDayAmt
            });
          }
        }
      });
    } catch (e) {
      console.error("Error computing leg calendar breakdown:", e);
    }
    return list;
  };

  // 4. Distribute the total continuous DA amount to each leg based on its contribution to totalAbsenceHrs
  const processedLegs = rawLegs.map((leg, index) => {
    const legCalendarBreakdown = getLegCalendarBreakdown(leg, index);

    const legDaAmount = calculationMode === 'calendar_day'
      ? legCalendarBreakdown.reduce((sum, item) => sum + item.amount, 0)
      : (totalAbsenceHrs > 0 ? Math.round(totalContinuousDaAmount * (leg.hours / totalAbsenceHrs)) : 0);

    let mileageAmt = 0;
    if (leg.mode === 'Road' && leg.roadDistanceKm && leg.roadDistanceKm > 0) {
      const kmRate = leg.roadType === 'auto_scooter' ? 12 : 24;
      mileageAmt = leg.roadDistanceKm * kmRate;
    }

    const haltDaContributed = leg.hours > 0
      ? Math.round(legDaAmount * (leg.haltHours / leg.hours))
      : 0;

    return {
      ...leg,
      daAmount: legDaAmount,
      haltDaContributed: haltDaContributed,
      mileageAmount: Math.round(mileageAmt),
      amount: Math.round(legDaAmount + mileageAmt),
      percentage: calculationMode === 'calendar_day'
        ? legCalendarBreakdown.reduce((sum, item) => sum + (item.dayPct * (item.hours / item.dayTotalHours)), 0)
        : (totalAbsenceHrs > 0 ? (continuousDaPct * (leg.hours / totalAbsenceHrs)) : 0),
      calendarBreakdown: legCalendarBreakdown
    };
  });

  const totalContingentAmount = storeConfig.enableContingentSection !== "false"
    ? contingentItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    : 0;

  const totalAmount = processedLegs.reduce((sum, current) => sum + current.amount, 0) + totalContingentAmount;

  const addLeg = () => {
    const lastLeg = journeyLegs[journeyLegs.length - 1];
    const newLeg: JourneyLeg = {
      id: `leg-${Date.now()}`,
      stationFrom: lastLeg?.stationTo || "",
      stationTo: "",
      mode: "Train",
      trainNoOrVehNo: "",
      depDate: lastLeg?.arrDate || "",
      depTime: "",
      arrDate: lastLeg?.arrDate || "",
      arrTime: "",
      purpose: globalPurpose,
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
    setJourneyLegs(prev => prev.map(leg => {
      if (leg.id === id) {
        const updatedLeg = { ...leg, [field]: value };
        
        // Auto distance recalculation when stationFrom or stationTo changes
        if (field === 'stationFrom' || field === 'stationTo') {
          const fromVal = field === 'stationFrom' ? value : leg.stationFrom;
          const toVal = field === 'stationTo' ? value : leg.stationTo;
          if (fromVal && toVal) {
            const dist = getStationDistance(fromVal, toVal);
            if (dist !== null && dist > 0) {
              updatedLeg.roadDistanceKm = dist;
            }
          }
        }
        return updatedLeg;
      }
      return leg;
    }));
  };

  const handleSelectStation = (legId: string, field: 'stationFrom' | 'stationTo', code: string) => {
    // First update the specific field
    updateLegField(legId, field, code);

    // Compute distance using the newly updated field value
    const leg = journeyLegs.find(l => l.id === legId);
    if (!leg) return;

    const currentFrom = field === 'stationFrom' ? code : leg.stationFrom;
    const currentTo = field === 'stationTo' ? code : leg.stationTo;

    if (currentFrom && currentTo) {
      const calculatedDist = getStationDistance(currentFrom, currentTo);
      if (calculatedDist !== null && calculatedDist > 0) {
        updateLegField(legId, 'roadDistanceKm', calculatedDist);
        toast.success(`Distance auto-calculated: ${calculatedDist} KM (दूरी: ${calculatedDist} कि.मी.)`, {
          duration: 3500,
          id: `dist-calc-${legId}`
        });
      }
    }

    // Close autocomplete
    setActiveAutocomplete(null);
    setStationSearch("");
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
        contingentItems: storeConfig.enableContingentSection !== "false" ? contingentItems : [],
        hasDeclared,
        totalAmount,
        totalAbsenceHrs,
        division,
        department,
        claimMonth,
        claimYear,
        billUnit,
        calculationMode,
        globalPurpose,
        showSummaryTable,
        showClaimantSig,
        showCounterSig,
        showHeadOfficeSig,
        showControllingOfficerSig,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "ta_claims"), docData);
      toast.success("Travelling Allowance claim record saved to database successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save claim: " + err.message);
      try {
        handleFirestoreError(err, OperationType.CREATE, "ta_claims");
      } catch (e) {
        console.error("Suppressed or reformatted save error:", e);
      }
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
    setDivision(claim.division || "KATIHAR");
    setDepartment(claim.department || "PERSONNEL");
    setClaimMonth(claim.claimMonth || MONTHS_LIST[new Date().getMonth()]);
    setClaimYear(claim.claimYear || new Date().getFullYear().toString());
    setBillUnit(claim.billUnit || "");
    setCalculationMode(claim.calculationMode || 'calendar_day');
    setJourneyLegs(claim.journeyLegs || []);
    setContingentItems(claim.contingentItems || []);
    setHasDeclared(claim.hasDeclared);
    setGlobalPurpose(claim.globalPurpose || "Official Duty");
    setShowSummaryTable(claim.showSummaryTable !== undefined ? claim.showSummaryTable : true);
    setShowClaimantSig(claim.showClaimantSig !== undefined ? claim.showClaimantSig : true);
    setShowCounterSig(claim.showCounterSig !== undefined ? claim.showCounterSig : true);
    setShowHeadOfficeSig(claim.showHeadOfficeSig !== undefined ? claim.showHeadOfficeSig : true);
    setShowControllingOfficerSig(claim.showControllingOfficerSig !== undefined ? claim.showControllingOfficerSig : true);
    toast.success(`Loaded details for "${claim.employeeName}" into the active editor!`);
  };

  const resetForm = () => {
    setEmployeeName("");
    setDesignation("");
    setEmpNo("");
    setPayLevel("Level 6");
    setDivision("KATIHAR");
    setDepartment("PERSONNEL");
    setClaimMonth(MONTHS_LIST[new Date().getMonth()]);
    setClaimYear(new Date().getFullYear().toString());
    setBillUnit("");
    setCalculationMode('calendar_day');
    setHasDeclared(false);
    setGlobalPurpose("Official Duty");
    setShowSummaryTable(true);
    setShowClaimantSig(true);
    setShowCounterSig(true);
    setShowHeadOfficeSig(true);
    setShowControllingOfficerSig(true);
    setContingentItems([]);
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
    // 1. Calculate dynamic summary totals grouped by 30%, 70%, 100%
    let count30 = 0;
    let count70 = 0;
    let count100 = 0;
    
    let amt30 = 0;
    let amt70 = 0;
    let amt100 = 0;

    // Check if TA is doubled (Territorial Army)
    const isTAEnabled = journeyLegs.some(l => l.isTerritorialArmy);
    const rateMultiplier = isTAEnabled ? 2 : 1;
    const currentDailyRate = totalDailyRate * rateMultiplier;

    if (calculationMode === 'calendar_day') {
      calendarDaysBreakdown.forEach(day => {
        if (day.hours > 0) {
          if (day.pct === 0.3) {
            count30 += 1;
            amt30 += day.amount;
          } else if (day.pct === 0.7) {
            count70 += 1;
            amt70 += day.amount;
          } else if (day.pct === 1.0) {
            count100 += 1;
            amt100 += day.amount;
          } else if (day.pct > 0) {
            // Training (20%) or custom
            count100 += day.pct;
            amt100 += day.amount;
          }
        }
      });
    } else {
      // Continuous mode
      if (totalAbsenceHrs > 0 && isEntireTourEligible) {
        const full12s = Math.floor(totalAbsenceHrs / 12);
        const remainder = totalAbsenceHrs % 12;
        
        count100 = full12s;
        amt100 = Math.round(full12s * currentDailyRate);

        if (remainder > 0) {
          if (remainder < 6) {
            count30 = 1;
            amt30 = Math.round(0.30 * currentDailyRate);
          } else {
            count70 = 1;
            amt70 = Math.round(0.70 * currentDailyRate);
          }
        }
        
        // Match sum with totalContinuousDaAmount
        const currentSum = amt30 + amt70 + amt100;
        if (currentSum !== totalContinuousDaAmount) {
          const diff = totalContinuousDaAmount - currentSum;
          if (amt100 > 0) amt100 += diff;
          else if (amt70 > 0) amt70 += diff;
          else if (amt30 > 0) amt30 += diff;
        }
      }
    }

    // Mileage / Contingent Amount
    const totalMileage = processedLegs.reduce((sum, current) => sum + (current.mileageAmount || 0), 0);

    // Format local time helper
    const formatLocalTime = (ms: number) => {
      const date = new Date(ms);
      const h = String(date.getHours()).padStart(2, '0');
      const m = String(date.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    };

    // Let's create a list of chronological legs sorted
    const sortedLegsForPrint = [...processedLegs].sort((a, b) => {
      const d1 = new Date(`${a.depDate}T${a.depTime}`).getTime();
      const d2 = new Date(`${b.depDate}T${b.depTime}`).getTime();
      return d1 - d2;
    });

    // Generate chronological journey and stay segments
    const printSegments: any[] = [];
    sortedLegsForPrint.forEach((leg, idx) => {
      const start = new Date(`${leg.depDate}T${leg.depTime}`);
      const end = new Date(`${leg.arrDate}T${leg.arrTime}`);
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        printSegments.push({
          id: `seg-j-${leg.id}`,
          type: 'journey',
          start,
          end,
          leg,
          from: leg.stationFrom,
          to: leg.stationTo,
          trainNo: leg.trainNoOrVehNo || leg.mode,
          mode: leg.mode,
          roadDistanceKm: leg.roadDistanceKm,
          roadType: leg.roadType,
          purpose: leg.purpose,
          beyond8Km: leg.beyond8Km,
          isBreakdownDuty: leg.isBreakdownDuty,
          isFreeMessingTraining: leg.isFreeMessingTraining,
          isTerritorialArmy: leg.isTerritorialArmy,
          mileageAmount: leg.mileageAmount || 0
        });
      }

      // If there is a next leg, add a stay segment between them
      const nextLeg = sortedLegsForPrint[idx + 1];
      if (nextLeg) {
        const nextStart = new Date(`${nextLeg.depDate}T${nextLeg.depTime}`);
        if (!isNaN(end.getTime()) && !isNaN(nextStart.getTime()) && nextStart > end) {
          printSegments.push({
            id: `seg-s-${leg.id}-${nextLeg.id}`,
            type: 'stay',
            start: end,
            end: nextStart,
            station: leg.stationTo || nextLeg.stationFrom || "Halt",
            purpose: nextLeg.purpose || leg.purpose
          });
        }
      }
    });

    // Collect all calendar days spanning from the very start to the very end
    const printDates: string[] = [];
    if (printSegments.length > 0) {
      const firstStart = printSegments[0].start;
      const lastEnd = printSegments[printSegments.length - 1].end;
      
      let curr = new Date(firstStart.getFullYear(), firstStart.getMonth(), firstStart.getDate());
      const finalDay = new Date(lastEnd.getFullYear(), lastEnd.getMonth(), lastEnd.getDate());
      
      let safety = 0;
      while (curr <= finalDay && safety < 100) {
        safety++;
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        printDates.push(`${y}-${m}-${d}`);
        curr.setDate(curr.getDate() + 1);
      }
    }

    // Now, let's assemble each day-wise row
    const dayRows = printDates.map(dateStr => {
      const [year, month, day] = dateStr.split('-');
      const formattedDate = `${day}-${month}-${year}`; // DD-MM-YYYY format
      
      const dayStartMs = new Date(`${dateStr}T00:00:00`).getTime();
      const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000;
      
      // Filter segments overlapping with this day
      const overlappingSegs: any[] = [];
      let totalMileageAmountOnDay = 0;
      
      printSegments.forEach(seg => {
        const overlapStartMs = Math.max(seg.start.getTime(), dayStartMs);
        const overlapEndMs = Math.min(seg.end.getTime(), dayEndMs);
        
        if (overlapEndMs > overlapStartMs) {
          const hoursOnDay = (overlapEndMs - overlapStartMs) / (1000 * 60 * 60);
          
          // Mileage is credited on the departure date of that specific leg
          let mileageVal = 0;
          if (seg.type === 'journey' && seg.start.getTime() >= dayStartMs && seg.start.getTime() < dayEndMs) {
            mileageVal = seg.mileageAmount;
            totalMileageAmountOnDay += mileageVal;
          }
          
          overlappingSegs.push({
            ...seg,
            overlapStartMs,
            overlapEndMs,
            hoursOnDay,
            mileageOnDay: mileageVal
          });
        }
      });
      
      // Calculate daily DA metrics from calendarDaysBreakdown
      const dbRecord = calendarDaysBreakdown.find(d => d.date === dateStr);
      const dayDaAmt = dbRecord ? dbRecord.amount : 0;
      const dayPct = dbRecord ? dbRecord.pct : 0;
      const dayHrs = dbRecord ? dbRecord.hours : 0;
      
      const dayTotalClaimed = dayDaAmt + totalMileageAmountOnDay;
      
      return {
        dateStr,
        formattedDate,
        daySegments: overlappingSegs,
        dayDaAmt,
        dayPct,
        dayHrs,
        totalMileageAmountOnDay,
        dayTotalClaimed,
        purpose: overlappingSegs.map(s => s.purpose).filter((v, i, a) => v && a.indexOf(v) === i).join(', ') || 'Official Duty',
        isBreakdownDuty: overlappingSegs.some(s => s.isBreakdownDuty),
        isFreeMessingTraining: overlappingSegs.some(s => s.isFreeMessingTraining),
        isTerritorialArmy: overlappingSegs.some(s => s.isTerritorialArmy),
        beyond8Km: overlappingSegs.some(s => s.beyond8Km !== false)
      };
    }).filter(row => row.daySegments.length > 0); // Keep only days with active segments

    const tableRows = dayRows; // Keep tableRows structure compatible with code placeholders if any

    // Precalculate rowSpan for "purpose" (Object of journey) column grouped by contiguous identical purpose values
    const purposeRowSpans: { [key: number]: number } = {};
    let currentPurposeIndex = 0;
    while (currentPurposeIndex < tableRows.length) {
      const currentPurpose = tableRows[currentPurposeIndex].purpose || "";
      let count = 1;
      let nextIndex = currentPurposeIndex + 1;
      while (nextIndex < tableRows.length && (tableRows[nextIndex].purpose || "") === currentPurpose) {
        count++;
        nextIndex++;
      }
      purposeRowSpans[currentPurposeIndex] = count;
      currentPurposeIndex = nextIndex;
    }

    const fh = (sizeL: string, sizeP: string) => isLandscape ? sizeL : sizeP;

    return (
      <>
        {/* Dynamic Landscape/Portrait Orientation Injection & Sandbox-safe Print Overrides */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: ${isLandscape ? 'landscape' : 'portrait'};
              margin: 4mm 6mm !important;
            }
            body.printing-mode {
              background-color: white !important;
              color: black !important;
            }
            body.printing-mode #print-container {
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              height: auto !important;
              overflow: visible !important;
              display: block !important;
              box-sizing: border-box !important;
            }
            body.printing-mode #print-container > div {
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              box-sizing: border-box !important;
            }
            /* Fast fix: prevent any background clipping in table headers */
            th, td {
              page-break-inside: avoid !important;
            }
          }
        `}} />
        <RenderPrintOverlayWatermark watermark={printSettings.watermark} />
        
        {/* Authentic 3-Column Railway Header Layout from PNG */}
        <div className={`grid grid-cols-3 items-end w-full border-b border-double border-black pb-1 mb-2 font-serif leading-tight text-black ${fh('text-[9.5pt]', 'text-[7pt]')}`}>
          <div className="text-left font-bold">
            <div className={fh('text-[10.5pt] font-extrabold', 'text-[7.5pt] font-extrabold')}>पूर्वोत्तर सीमांत रेलवे</div>
            <div className={fh('text-[9.5pt] uppercase tracking-tight', 'text-[7pt] uppercase tracking-tight')}>NORTHEAST FRONTIER RAILWAY</div>
            <div className={`${fh('text-[8.5pt]', 'text-[6.5pt]')} text-gray-700 italic font-semibold mt-0.5`}>{division} Div. / {department} Dept.</div>
          </div>
          
          <div className="text-center font-bold self-center space-y-0.5">
            <div className={fh('text-[13pt] font-extrabold uppercase tracking-wide', 'text-[9.5pt] font-extrabold uppercase tracking-widest')}>यात्रा भत्ता जर्नल</div>
            <div className={fh('text-[12pt] font-extrabold uppercase tracking-wide', 'text-[8.7pt] font-extrabold uppercase tracking-wider')}>TRAVELLING ALLOWANCE JOURNAL</div>
            <div className={`${fh('text-[8px]', 'text-[6pt]')} text-gray-600 block leading-none font-medium italic`}>
              JOURNAL & CLAIM FOR TRAVELLING ALLOWANCE (TA) — Rule CPC-7
            </div>
          </div>
          
          <div className={`text-right font-mono font-bold leading-none text-gray-800 space-y-0.5 ${fh('text-[8pt]', 'text-[6pt]')}`}>
            <div>जी. ए. 31 एस आर सी/जी 1677</div>
            <div>G. A. 31 S.R.C. / G. 1677</div>
            <div className="text-gray-550 italic font-sans text-[6.5pt]">NFR-PERS-CLERICAL-TA-V3</div>
          </div>
        </div>

        {/* Compact 3-Column Employee Parameters Grid */}
        <div className={`grid grid-cols-3 gap-x-3 gap-y-1 mb-2 border border-black p-1.5 rounded-sm bg-slate-50/10 text-left leading-tight text-black font-serif ${fh('text-[9.5pt]', 'text-[7.2pt]')}`}>
          <div><strong>Employee Name:</strong> <span className="underline font-sans font-extrabold">{employeeName || "____________________"}</span></div>
          <div><strong>Designation (पद):</strong> <span className="underline font-sans font-bold">{designation || "____________________"}</span></div>
          <div><strong>Employee/PF No:</strong> <span className="underline font-mono font-bold">{empNo || "____________________"}</span></div>
          
          <div><strong>7th CPC Pay Level:</strong> <span className="underline font-mono font-bold">{payLevel}</span></div>
          <div><strong>Daily TA Rate (100%):</strong> <span className="underline font-mono font-bold">₹ {totalDailyRate}</span></div>
          <div><strong>Bill Unit (बी.यू.):</strong> <span className="underline font-mono font-bold">{billUnit || "____________________"}</span></div>
          
          <div className="col-span-2"><strong>Division / Department:</strong> <span className="underline font-sans">{division} / {department}</span></div>
          <div><strong>Claim Month/Year:</strong> <span className="underline font-bold text-slate-900 font-mono">{claimMonth} {claimYear}</span></div>
        </div>

        <table className={`w-full text-left border-collapse border border-black mb-2 font-serif table-fixed ${fh('text-[8.5pt]', 'text-[7.2pt]')}`}>
          <colgroup>
            <col style={{ width: isLandscape ? '8%' : '8.5%' }} />
            <col style={{ width: isLandscape ? '6%' : '6%' }} />
            <col style={{ width: isLandscape ? '6.5%' : '7%' }} />
            <col style={{ width: isLandscape ? '6.5%' : '7%' }} />
            <col style={{ width: isLandscape ? '8.5%' : '9%' }} />
            <col style={{ width: isLandscape ? '8.5%' : '9%' }} />
            <col style={{ width: isLandscape ? '7.5%' : '7%' }} />
            <col style={{ width: isLandscape ? '24%' : '20%' }} />
            <col style={{ width: isLandscape ? '11.5%' : '10%' }} />
            <col style={{ width: isLandscape ? '7.5%' : '9%' }} />
            <col style={{ width: isLandscape ? '5.5%' : '7.5%' }} />
          </colgroup>
          <thead>
            {/* Row 1 Headers (Matching PNG format) */}
            <tr className="bg-gray-150 text-center font-bold">
              <th className={`border border-black p-0.5 py-1 leading-tight ${fh('text-[7.5pt]', 'text-[6.3pt]')}`} rowSpan={2}>
                माह और तारीख
                <br />
                Month & Date
              </th>
              <th className={`border border-black p-0.5 py-1 leading-tight ${fh('text-[7.5pt]', 'text-[6.3pt]')}`} rowSpan={2}>
                गाड़ी का क्रमांक
                <br />
                Train No.
              </th>
              <th className={`border border-black p-0.5 py-1 leading-tight ${fh('text-[7.5pt]', 'text-[6.3pt]')}`} rowSpan={2}>
                प्रस्थान समय
                <br />
                Time left
              </th>
              <th className={`border border-black p-0.5 py-1 leading-tight ${fh('text-[7.5pt]', 'text-[6.3pt]')}`} rowSpan={2}>
                आगमन समय
                <br />
                Time arrived
              </th>
              <th className={`border border-black p-0.5 py-1 leading-tight ${fh('text-[7.5pt]', 'text-[6.3pt]')}`} colSpan={2}>
                स्टेशन / Station
              </th>
              <th className={`border border-black p-0.5 py-1 leading-tight ${fh('text-[7.5pt]', 'text-[6.3pt]')}`} rowSpan={2}>
                कि. मी.
                <br />
                Kms.
              </th>
              <th className={`border border-black p-0.5 py-1 leading-tight ${fh('text-[7.5pt]', 'text-[6.3pt]')}`} rowSpan={2}>
                दिन/रात या घंटे
                <br />
                Day/Night/Hrs
              </th>
              <th className={`border border-black p-0.5 py-1 leading-tight ${fh('text-[7.5pt]', 'text-[6.3pt]')}`} rowSpan={2}>
                यात्रा का उद्देश्य
                <br />
                Object of journey
              </th>
              <th className={`border border-black p-0.5 py-1 leading-tight ${fh('text-[7.5pt]', 'text-[6.3pt]')}`} rowSpan={2}>
                दर / Rate
              </th>
              <th className={`border border-black p-0.5 py-1 text-right font-extrabold leading-tight ${fh('text-[7.5pt]', 'text-[6.3pt]')}`} rowSpan={2}>
                दावा राशि
                <br />
                Claimed Amt
              </th>
            </tr>
            {/* Row 2: Subheaders for Station (From / To) */}
            <tr className={`bg-gray-150 text-center font-bold leading-tight ${fh('text-[7.5pt]', 'text-[6.3pt]')}`}>
              <th className="border border-black p-0.5">से / From</th>
              <th className="border border-black p-0.5">तक / To</th>
            </tr>
            {/* Row 3: Column Numbers 1 to 11 */}
            <tr className={`bg-gray-100 text-center font-mono text-gray-650 ${fh('text-[7.5pt]', 'text-[6.2pt]')}`}>
              <td className="border border-black p-0.5">1</td>
              <td className="border border-black p-0.5">2</td>
              <td className="border border-black p-0.5">3</td>
              <td className="border border-black p-0.5">4</td>
              <td className="border border-black p-0.5">5</td>
              <td className="border border-black p-0.5">6</td>
              <td className="border border-black p-0.5">7</td>
              <td className="border border-black p-0.5">8</td>
              <td className="border border-black p-0.5">9</td>
              <td className="border border-black p-0.5">10</td>
              <td className="border border-black p-0.5 font-bold">11</td>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, i) => {
              let pctDisplay = `${(row.dayPct * 100).toFixed(0)}%`;
              if (row.isFreeMessingTraining) {
                pctDisplay = "Training (20%)";
              } else if (row.isBreakdownDuty) {
                pctDisplay = "Breakdown (100%)";
              } else if (row.beyond8Km === false) {
                pctDisplay = "Within 8km (0%)";
              }

              const dayStartMs = new Date(`${row.dateStr}T00:00:00`).getTime();
              const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000;

              // Filter only journey segments for traveling details
              const journeySegs = row.daySegments.filter((seg: any) => seg.type === 'journey');

              // Dynamic text scaling helpers for cells
              const c75 = fh('text-[9.5pt]', 'text-[7.2pt]');
              const c80 = fh('text-[10.5pt]', 'text-[7.5pt]');
              const c60 = fh('text-[8.0pt]', 'text-[6pt]');
              const c65 = fh('text-[8.5pt]', 'text-[6.3pt]');

              return (
                <tr key={row.dateStr} className={`leading-snug text-center align-middle hover:bg-slate-50/10 ${c80}`}>
                  {/* 1. Month & Date */}
                  <td className={`border border-black p-0.5 py-1 font-mono text-center font-bold bg-slate-50/10 whitespace-nowrap ${c75}`}>
                    {row.formattedDate}
                  </td>
                  
                  {/* 2. Train/Vehicle No */}
                  <td className={`border border-black p-0.5 py-1 text-center font-sans font-bold break-words ${c75}`}>
                    {journeySegs.length === 0 ? (
                      <span className="text-gray-400 font-normal">-</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {journeySegs.map((seg: any, idx: number) => (
                          <div key={idx} className="min-h-[1.2rem] flex items-center justify-center">
                            <div className="leading-none">
                              <span className="text-gray-900 block font-bold">{seg.trainNo}</span>
                              {seg.leg.trainName && (
                                <span className={`text-gray-550 font-normal block leading-none mt-0.5 ${c60}`}>
                                  {seg.leg.trainName}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  
                  {/* 3. Time left (Departure) */}
                  <td className={`border border-black p-0.5 py-1 font-mono text-center font-bold ${c75}`}>
                    {journeySegs.length === 0 ? (
                      <span className="text-gray-400 font-normal">NA</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {journeySegs.map((seg: any, idx: number) => {
                          const deportsToday = seg.leg.depDate === row.dateStr;
                          return (
                            <div key={idx} className="min-h-[1.2rem] flex items-center justify-center">
                              <span className={deportsToday ? "text-slate-900 font-extrabold" : "text-gray-400 font-normal"}>
                                {deportsToday ? seg.leg.depTime : "NA"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  
                  {/* 4. Time arrived */}
                  <td className={`border border-black p-0.5 py-1 font-mono text-center font-bold ${c75}`}>
                    {journeySegs.length === 0 ? (
                      <span className="text-gray-400 font-normal">NA</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {journeySegs.map((seg: any, idx: number) => {
                          const arrivesToday = seg.leg.arrDate === row.dateStr;
                          return (
                            <div key={idx} className="min-h-[1.2rem] flex items-center justify-center">
                              <span className={arrivesToday ? "text-slate-900 font-extrabold" : "text-gray-400 font-normal"}>
                                {arrivesToday ? seg.leg.arrTime : "NA"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  
                  {/* 5. From Station */}
                  <td className={`border border-black p-0.5 py-1 text-left font-sans break-words ${c75}`}>
                    {journeySegs.length === 0 ? (
                      <div className="text-center">
                        <span className="text-gray-400 font-normal">NA</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 bg-slate-50/5">
                        {journeySegs.map((seg: any, idx: number) => {
                          const deportsToday = seg.leg.depDate === row.dateStr;
                          return (
                            <div key={idx} className="min-h-[1.2rem] flex items-center">
                              {deportsToday ? (
                                <div className="leading-none">
                                  <span className="font-extrabold text-slate-900">{seg.from}</span>
                                  {seg.from !== "NA" && seg.beyond8Km === false && (
                                    <span className={`text-rose-800 font-bold block leading-none mt-0.5 ${c60}`}>
                                      (HQ 8km)
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className={`text-gray-400 font-normal ${c75}`}>NA</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  
                  {/* 6. To Station */}
                  <td className={`border border-black p-0.5 py-1 text-left font-sans break-words ${c75}`}>
                    {journeySegs.length === 0 ? (
                      <div className="text-center">
                        <span className="text-gray-400 font-normal">NA</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1 bg-slate-50/5">
                        {journeySegs.map((seg: any, idx: number) => {
                          const arrivesToday = seg.leg.arrDate === row.dateStr;
                          return (
                            <div key={idx} className="min-h-[1.2rem] flex items-center">
                              {arrivesToday ? (
                                <span className="font-extrabold text-slate-900 leading-none">{seg.to}</span>
                              ) : (
                                <span className={`text-gray-400 font-normal ${c75}`}>NA</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  
                  {/* 7. Kms */}
                  <td className={`border border-black p-0.5 py-1 font-mono text-center align-middle ${c75}`}>
                    {journeySegs.some((seg: any) => seg.roadDistanceKm && seg.roadDistanceKm > 0) ? (
                      (() => {
                        const withKms = journeySegs.filter((seg: any) => seg.roadDistanceKm && seg.roadDistanceKm > 0);
                        const totalKms = withKms.reduce((sum: number, seg: any) => sum + (seg.roadDistanceKm || 0), 0);
                        const firstRoadSeg = withKms[0];
                        return (
                          <div className="leading-tight">
                            <span className={`font-extrabold block text-slate-900 ${c80}`}>{totalKms} KM</span>
                            {firstRoadSeg.mode === 'Road' ? (
                              <span className={`block font-sans text-amber-850 font-bold leading-none mt-0.5 text-amber-800 ${c60}`}>
                                @ ₹{firstRoadSeg.roadType === 'auto_scooter' ? '12' : '24'}/KM
                              </span>
                            ) : firstRoadSeg.mode === 'Train' ? (
                              <span className={`block font-sans text-emerald-850 leading-none mt-0.5 text-center font-semibold text-emerald-800 ${c60}`}>
                                (Rail)
                              </span>
                            ) : (
                              <span className={`block font-sans text-slate-705 leading-none mt-0.5 text-center font-semibold text-slate-700 ${c60}`}>
                                (Air)
                              </span>
                            )}
                          </div>
                        );
                      })()
                    ) : (
                      <span className="text-gray-400 font-normal">-</span>
                    )}
                  </td>
                  
                  {/* 8. Day/Night or Hours */}
                  <td className={`border border-black p-0.5 py-1 text-left font-medium bg-slate-50/5 leading-tight ${c75}`}>
                    <div className="text-black block w-full px-1">
                      {row.daySegments.map((seg: any, idx: number) => {
                        const isJourney = seg.type === 'journey';
                        const prefix = idx > 0 ? " ; " : "";
                        if (isJourney) {
                          return (
                            <span key={idx} className={`inline text-black font-extrabold uppercase ${c65}`}>
                              {prefix}• Jour: <span className="font-mono font-black">{seg.hoursOnDay.toFixed(1)}h</span>
                            </span>
                          );
                        } else {
                          const timeRange = seg.hoursOnDay === 24 
                            ? "24 Hrs" 
                            : `${formatLocalTime(seg.overlapStartMs)} - ${formatLocalTime(seg.overlapEndMs)} (${seg.hoursOnDay.toFixed(1)}h)`;
                          return (
                            <span key={idx} className={`inline text-slate-800 font-semibold ${c65}`}>
                              {prefix}• Halt at {seg.station} ({timeRange})
                            </span>
                          );
                        }
                      })}
                    </div>
                  </td>
                  
                  {/* 9. Object of journey */}
                  {purposeRowSpans[i] !== undefined && (
                    <td className={`border border-black p-1 text-left font-sans align-middle break-words ${c75}`} rowSpan={purposeRowSpans[i]}>
                      {row.purpose}
                    </td>
                  )}
                  
                  {/* 10. Rate */}
                  <td className="border border-black p-0.5 py-1 text-center align-middle font-serif bg-slate-50/5">
                    <div className={`font-extrabold text-indigo-950 leading-tight ${c75}`}>{pctDisplay}</div>
                    <div className={`font-black text-emerald-800 leading-none mt-1 ${c80}`}>₹{row.dayDaAmt}</div>
                    <div className={`text-gray-500 font-mono leading-none mt-1 ${c60}`}>
                      ({row.dayHrs.toFixed(1)}h)
                    </div>
                    {row.isTerritorialArmy && (
                      <div className={`text-amber-800 font-bold block leading-none mt-1 uppercase tracking-wide ${c60}`}>
                        Doubled
                      </div>
                    )}
                  </td>
                  
                  {/* 11. Claimed Amt */}
                  <td className="border border-black p-0.5 py-1 text-right font-bold font-mono bg-slate-50/15 align-middle pr-1.5">
                    <div className="leading-tight text-right w-full">
                      <div className={`text-slate-950 font-black ${c80}`}>₹{row.dayTotalClaimed}</div>
                      {row.totalMileageAmountOnDay > 0 && (
                        <div className={`text-amber-800 font-sans font-bold leading-none mt-1 ${c60}`} title="Road Mileage Portion">
                          (₹{row.totalMileageAmountOnDay} Mil)
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {/* The single summary row for total claimed amt */}
            <tr className="bg-gray-150 font-bold">
              <td colSpan={10} className={`border border-black p-2 text-right uppercase ${fh('text-[10.5pt]', 'text-[8.5pt]')}`}>
                TOTAL CLAIMED TA AMOUNT (दावा राशि कुल योग):
              </td>
              <td className={`border border-black p-2 text-right text-indigo-800 font-extrabold font-mono ${fh('text-[12.5pt]', 'text-[9.5pt]')}`}>
                ₹{totalAmount}
              </td>
            </tr>
          </tbody>
        </table>

        {showSummaryTable && (
          <div className="mt-5 mb-5 font-serif">
            <table className={`w-full border-collapse border border-black text-left ${fh('text-[9.5pt]', 'text-[8.2pt]')}`}>
              <thead>
                <tr className="bg-gray-100 text-center">
                  <th colSpan={3} className={`border border-black py-0.5 px-1.5 font-bold tracking-wider uppercase ${fh('text-[10.5pt]', 'text-[9.2pt]')}`}>
                    SUMMARY (सारांश)
                  </th>
                </tr>
                <tr className={`bg-gray-50 text-center font-bold ${fh('text-[9pt]', 'text-[8.0pt]')}`}>
                  <th className="border border-black py-0.5 px-1 w-[25%] font-serif">Percentage (प्रतिशत)</th>
                  <th className="border border-black py-0.5 px-1 w-[30%] font-serif">No. of total days (कुल दिनों की संख्या)</th>
                  <th className="border border-black py-0.5 px-1.5 w-[45%] font-serif text-left pl-4">Rate of TA X Days = Amount (दर X दिन = कुल राशि)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-center">
                  <td className="border border-black py-0.5 px-1 font-bold bg-gray-50/20 font-serif">30%</td>
                  <td className="border border-black py-0.5 px-1 font-mono">{count30 > 0 ? count30 : "—"}</td>
                  <td className="border border-black py-0.5 px-1.5 text-left font-mono pl-4">
                    {count30 > 0 ? (
                      <span>Rs. {Math.round(totalDailyRate * 0.30)} × {count30} = Rs. {amt30}</span>
                    ) : (
                      <span className="text-gray-400 font-serif">Rs. {Math.round(totalDailyRate * 0.30)} × 0 = Rs. 0</span>
                    )}
                  </td>
                </tr>
                <tr className="text-center">
                  <td className="border border-black py-0.5 px-1 font-bold bg-gray-50/20 font-serif">70%</td>
                  <td className="border border-black py-0.5 px-1 font-mono">{count70 > 0 ? count70 : "—"}</td>
                  <td className="border border-black py-0.5 px-1.5 text-left font-mono pl-4">
                    {count70 > 0 ? (
                      <span>Rs. {Math.round(totalDailyRate * 0.70)} × {count70} = Rs. {amt70}</span>
                    ) : (
                      <span className="text-gray-400 font-serif">Rs. {Math.round(totalDailyRate * 0.70)} × 0 = Rs. 0</span>
                    )}
                  </td>
                </tr>
                <tr className="text-center">
                  <td className="border border-black py-0.5 px-1 font-bold bg-gray-50/20 font-serif">100%</td>
                  <td className="border border-black py-0.5 px-1 font-mono">{count100 > 0 ? count100.toFixed(1) : "—"}</td>
                  <td className="border border-black py-0.5 px-1.5 text-left font-mono pl-4">
                    {count100 > 0 ? (
                      <span>Rs. {Math.round(totalDailyRate * 1.00)} × {count100.toFixed(1)} = Rs. {amt100}</span>
                    ) : (
                      <span className="text-gray-400 font-serif">Rs. {Math.round(totalDailyRate * 1.00)} × 0 = Rs. 0</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} className={`border border-black py-0.5 px-2 font-bold text-right uppercase bg-gray-50/35 font-serif ${fh('text-[9pt]', 'text-[8.2pt]')}`}>
                    Total Contingent Amount (कुल फुटकर व्यय)
                  </td>
                  <td className="border border-black py-0.5 px-1.5 text-left font-mono pl-4 font-bold text-emerald-800">
                    Rs. {(totalMileage || 0) + totalContingentAmount}
                  </td>
                </tr>
                <tr className={`bg-gray-100 font-bold ${fh('text-[10pt]', 'text-[9pt]')}`}>
                  <td colSpan={2} className="border border-black py-0.5 px-2 text-right uppercase tracking-wider font-serif">
                    Total Amount Rs. (कुल दावा राशि)
                  </td>
                  <td className={`border border-black py-0.5 px-1.5 text-left font-mono pl-4 text-indigo-900 font-extrabold ${fh('text-[10.5pt]', 'text-[9.5pt]')}`}>
                    Rs. {totalAmount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* CONTINGENT DYNAMIC BREAKDOWN TABLE */}
        {storeConfig.enableContingentSection !== "false" && contingentItems && contingentItems.length > 0 && (
          <div className="mt-4 mb-4 font-serif">
            <table className={`w-full border-collapse border border-black text-left ${fh('text-[9pt]', 'text-[7.8pt]')}`}>
              <thead>
                <tr className="bg-gray-105 bg-gray-100 text-center">
                  <th colSpan={3} className={`border border-black py-0.5 px-1.5 font-bold tracking-wider uppercase font-serif ${fh('text-[9.5pt]', 'text-[8.5pt]')}`}>
                    CONTINGENT EXPENSES DETAILED BREAKDOWN (फुटकर व्यय का पूर्ण विवरण)
                  </th>
                </tr>
                <tr className={`bg-gray-50 text-center font-bold ${fh('text-[8.5pt]', 'text-[7.8pt]')}`}>
                  <th className="border border-black py-0.5 px-1 w-[10%] text-center font-serif">S.No.</th>
                  <th className="border border-black py-0.5 px-1.5 w-[70%] font-serif pl-3">Particulars & Remarks / व्यय का विवरण</th>
                  <th className="border border-black py-0.5 px-1 w-[20%] text-right pr-4 font-serif">Amount (राशि ₹)</th>
                </tr>
              </thead>
              <tbody>
                {contingentItems.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="border border-black py-0.5 px-1 text-center font-mono">{idx + 1}</td>
                    <td className={`border border-black py-0.5 px-1.5 pl-3 font-sans font-semibold text-gray-800 ${fh('text-[8.5pt]', 'text-[7.8pt]')}`}>{item.remarks}</td>
                    <td className="border border-black py-0.5 px-1 text-right pr-4 font-mono font-bold">Rs. {item.amount || 0}</td>
                  </tr>
                ))}
                <tr className={`bg-gray-50/50 font-extrabold ${fh('text-[9.5pt]', 'text-[8.5pt]')}`}>
                  <td colSpan={2} className="border border-black py-0.5 px-2 text-right uppercase tracking-wider font-serif">
                    Total Contingent Amount Added (कुल जोड़ा गया फुटकर व्यय):
                  </td>
                  <td className={`border border-black py-0.5 px-2 text-right pr-4 font-mono text-emerald-800 ${fh('text-[10pt]', 'text-[9pt]')}`}>
                    Rs. {totalContingentAmount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Declarations (Matching PNG exactly) */}
        <div className={`text-justify space-y-1 font-serif mt-4 ${fh('text-[9.5pt]', 'text-[8.2pt]')}`}>
          <p className="font-bold border-b border-black pb-1 uppercase">Claimant Declarations & Conveyance Certificates:</p>
          <ol className="list-decimal pl-5 space-y-0.5 block leading-tight">
            <li>The TA claimed by me has not been claimed before and will not be claimed hereafter (मेरे द्वारा जिस यात्रा भत्ता का दावा किया गया है वह पहले नहीं किया गया है)।</li>
            <li>No free railway pass or other free mode of transit was checked for this duration (इस अवधि के दौरान किसी भी निःशुल्क रेलवे पास आदि का उपयोग नहीं किया गया था)।</li>
            <li>Cheapest mode of conveyance was utilized (यात्रा के लिए सबसे सस्ते साधन का उपयोग किया गया था)।</li>
            <li>The journey performed by road for which conveyance has been claimed was over 1.6 km (सड़क मार्ग से की गई यात्रा जिसके लिए वाहन भत्ता का दावा किया गया है वह 1.6 किमी से अधिक थी)।</li>
          </ol>
        </div>

        {/* Signature of Officer Claiming TA (aligning right with drawing overlay and seal) */}
        {showClaimantSig && (
          <div className="mt-2 flex justify-end">
            <div className={`text-center relative text-left py-1.5 ${fh('w-64', 'w-48')}`}>
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-none select-none z-10 font-sans">
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
              <div className="absolute -top-16 right-0 pointer-events-none select-none z-10 font-sans">
                <RenderPrintOverlaySeal seal={printSettings.seal} customSealText={printSettings.customSealText} sealImageData={printSettings.sealImageData} />
              </div>
              <div className="border-b border-black mb-1 w-44 mx-auto h-6"></div>
              <p className={`font-semibold text-gray-800 text-center font-serif ${fh('text-[9.5pt]', 'text-[8.2pt]')}`}>Signature of Officer Claiming TA</p>
              <p className={`text-gray-500 text-center italic font-serif ${fh('text-[8pt]', 'text-[7.2pt]')}`}>(दावा करने वाले अधिकारी के हस्ताक्षर)</p>
            </div>
          </div>
        )}

        {/* Headquarter absence certification section (Spans full page width, matching PNG) */}
        <div className={`border-t border-b border-black py-0.5 mt-0.5 text-justify font-serif leading-tight ${fh('text-[9.2pt]', 'text-[8.0pt]')}`}>
          <p>
            I hereby certify that Shri/Smt/Kumari <span className="font-bold underline px-1 text-indigo-950 uppercase">{employeeName || "______________________________"}</span> was absent on duty from his/her headquarters station during the period charged for in the bill on Railway business and that the officer performed the journey by Rail/Sea/Air/Road and was allowed/not allowed free Pass of locomotion at the expense of Government local fund of Indian State.
          </p>
          <p className="italic text-gray-650 mt-0.5 block leading-tight text-[8.2pt]">
            (प्रमाणित किया जाता है कि श्री/श्रीमती/कुमारी रेल कार्यवश अपने मुख्यालय रेलवे स्टेशन से अनुपस्थित थे तथा उन्होंने यात्रा रेल/समुद्र/हवाई मार्ग/सड़क मार्ग से की है और उन्हें सरकारी स्थानीय निधि के व्यय पर यात्रा का निःशुल्क पास स्वीकृत किया गया/नहीं किया गया था।)
          </p>
        </div>

        {/* Counter Signed & Controlling Officer signatures layout arranged exactly per PNG user request */}
        {(showCounterSig || showHeadOfficeSig || showControllingOfficerSig) && (
          <div className="mt-3 space-y-3 font-serif text-[10.5pt] tracking-normal leading-normal text-black printable-signatures-block">
            {/* Row 1: Counter Signed on Left */}
            {showCounterSig && (
              <div className="flex justify-start text-black">
                <div className="w-[200px] text-left">
                  <div className="h-6"></div> {/* Space for actual physical sign */}
                  <p className="font-bold whitespace-nowrap">Counter Signed</p>
                </div>
              </div>
            )}

            {/* Row 2: Head of Office in the middle (vertically), but aligned on the Right hand side */}
            {showHeadOfficeSig && (
              <div className="flex justify-end text-black">
                <div className="w-[280px] text-right">
                  <div className="h-6"></div> {/* Space for actual physical sign */}
                  <p className="font-bold whitespace-nowrap">Signature of Head of the Office</p>
                </div>
              </div>
            )}

            {/* Row 3: Controlling Officer on the Left */}
            {showControllingOfficerSig && (
              <div className="flex justify-start items-end text-black">
                <div className="w-[200px] text-left">
                  <div className="h-6"></div> {/* Space for actual physical sign */}
                  <p className="font-bold whitespace-nowrap">
                    <span className="border-b border-black pb-0.5 font-bold">Controlling Officer</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dynamic System Timestamp & System Generated Circular Stamp Metadata */}
        {storeConfig.enablePrintMetadata !== "false" && (
          <div className="mt-4 pt-1 rounded border border-gray-100 border-t border-dashed border-gray-400 flex justify-between items-center text-[7pt] font-mono text-gray-500 bg-gray-50/20 px-3 py-1">
            {/* Authentic Circular Rubber Stamp (Gol Muhar) for System Generated authenticity */}
            <div className="flex items-center justify-center p-1 bg-white/40 rounded-full">
              <div className="w-[74px] h-[74px] border-2 border-dashed border-indigo-600/70 rounded-full flex flex-col items-center justify-center text-center p-0.5 font-sans uppercase text-indigo-600 leading-none select-none pointer-events-none rotate-[-6deg]">
                <div className="w-[64px] h-[64px] border-double border-[3px] border-indigo-600/80 rounded-full flex flex-col items-center justify-center gap-0.5 font-serif font-black bg-white/20">
                  <span className="text-[5.0pt] font-extrabold tracking-widest text-indigo-600/95">SYSTEM</span>
                  <span className="text-[7.0pt] font-black border-y border-indigo-600/80 py-0.5 px-0.5 font-sans my-0.5 bg-indigo-50/30 whitespace-nowrap text-indigo-700">GENERATED</span>
                  <span className="text-[4.5pt] font-extrabold tracking-tight text-indigo-600/95">PLEASE VERIFY</span>
                </div>
              </div>
            </div>

            <div className="text-right flex flex-col items-end leading-snug">
              <span>Dynamic Auth Code: NFR-PERS-TA-{empNo || 'DRAFT'}-{Date.now().toString().slice(-6)}</span>
              <span>Printed At: <strong className="text-gray-900">{new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              })}</strong> (Local Standard Time)</span>
              <span className="text-[6.0pt] text-gray-400 italic mt-0.5">Authentic Verification Secured</span>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className={`flex flex-col gap-6 p-4 text-slate-800 font-sans ${
      isSidebarsShown
        ? "lg:flex-row h-full overflow-y-auto lg:overflow-hidden bg-slate-50"
        : "fixed inset-0 z-50 bg-slate-100 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-200 p-4 md:p-10 pb-28 text-slate-800"
    }`}>
      {/* Printable Sheet Panel (Hidden on web UI, triggered on print) */}
      <div style={{ display: 'none' }}>
        <div ref={componentRef} className={`pl-[4mm] pr-[4mm] pt-[4mm] pb-[4mm] text-black bg-white font-serif leading-tight text-[11pt] ${isLandscape ? 'w-[297mm]' : 'w-[210mm]'}`}>
          {renderPrintSheetContent()}
        </div>
      </div>

      {/* Editor Panel Left side */}
      <div className={`flex-1 flex flex-col gap-4 pr-1 ${isSidebarsShown ? "overflow-y-auto h-full min-h-0" : "h-auto pb-24"}`}>
        
        {/* Toggle Mode Switcher with Prominent "Tir ka Nishan" Toggler */}
        <div className="bg-white border border-gray-250 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm shrink-0">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setViewMode("editor")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "editor"
                  ? "bg-indigo-600 text-white shadow-sm scale-[1.02]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> 📝 Entry Form (दावा प्रविष्टि)
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "preview"
                  ? "bg-indigo-600 text-white shadow-sm scale-[1.02]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> 👁️ Print Preview (प्रिंट प्रीव्यू)
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Arrow Toggler / "Tir ka Nishan" Button */}
            <button
              type="button"
              onClick={toggleSidebars}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-300 border cursor-pointer ${
                isSidebarsShown
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-350 hover:text-slate-900"
                  : "bg-gradient-to-r from-emerald-500 via-indigo-600 to-indigo-700 hover:brightness-110 text-white border-transparent shadow-lg shadow-indigo-600/20 active:translate-y-[1px] animate-pulse"
              }`}
              title={isSidebarsShown ? "Hide sidebars / पूर्ण स्क्रीन" : "Show side options / विकल्प सूची दिखाएं"}
            >
              {isSidebarsShown ? (
                <>
                  <ChevronsRightLeft className="w-4 h-4 text-slate-700" />
                  <span>🖥️ Full Screen Form/Preview</span>
                </>
              ) : (
                <>
                  <ChevronsLeftRight className="w-5 h-5 text-yellow-100 animate-bounce" />
                  <span className="text-white font-extrabold tracking-wide">↔️ Show Options / विकल्प दिखाएं</span>
                </>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-2 pr-2 text-[11px] text-emerald-600 font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-100"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>A4 Instant Sync</span>
            </div>
          </div>
        </div>

        {/* Real-time Customizer Settings */}
        {isSidebarsShown && <PrintCustomizer settings={printSettings} onChange={setPrintSettings} />}

        {/* Real-time Signature Box Selectors */}
        {isSidebarsShown && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-4 font-sans text-slate-850 animate-fadeIn animate-duration-200">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-indigo-600 rounded"></span>
              Signature & Table Visibility Config / हस्ताक्षर एवं तालिका दृश्यता चयन
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <label className="flex items-center gap-2 text-xs bg-slate-50 border border-gray-200 hover:border-indigo-500 rounded-lg p-2.5 cursor-pointer select-none transition-all">
                <input
                  type="checkbox"
                  checked={showClaimantSig}
                  onChange={(e) => setShowClaimantSig(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 bg-white text-indigo-650 focus:ring-indigo-500 accent-indigo-650 cursor-pointer"
                />
                <div className="flex flex-col cursor-pointer">
                  <span className="font-bold text-slate-800">Claimant Signature</span>
                  <span className="text-[9px] text-slate-500">दावेदार के हस्ताक्षर</span>
                </div>
              </label>

              <label className="flex items-center gap-2 text-xs bg-slate-50 border border-gray-200 hover:border-indigo-500 rounded-lg p-2.5 cursor-pointer select-none transition-all">
                <input
                  type="checkbox"
                  checked={showCounterSig}
                  onChange={(e) => setShowCounterSig(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 bg-white text-indigo-650 focus:ring-indigo-500 accent-indigo-650 cursor-pointer"
                />
                <div className="flex flex-col cursor-pointer">
                  <span className="font-bold text-slate-800">Counter Signed</span>
                  <span className="text-[9px] text-slate-500">प्रतिहस्ताक्षरित</span>
                </div>
              </label>

              <label className="flex items-center gap-2 text-xs bg-slate-50 border border-gray-200 hover:border-indigo-500 rounded-lg p-2.5 cursor-pointer select-none transition-all">
                <input
                  type="checkbox"
                  checked={showHeadOfficeSig}
                  onChange={(e) => setShowHeadOfficeSig(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 bg-white text-indigo-650 focus:ring-indigo-500 accent-indigo-650 cursor-pointer"
                />
                <div className="flex flex-col cursor-pointer">
                  <span className="font-bold text-slate-800">Head of Office</span>
                  <span className="text-[9px] text-slate-500">कार्यालय प्रमुख के हस्ताक्षर</span>
                </div>
              </label>

              <label className="flex items-center gap-2 text-xs bg-slate-50 border border-gray-200 hover:border-indigo-500 rounded-lg p-2.5 cursor-pointer select-none transition-all">
                <input
                  type="checkbox"
                  checked={showControllingOfficerSig}
                  onChange={(e) => setShowControllingOfficerSig(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 bg-white text-indigo-650 focus:ring-indigo-500 accent-indigo-650 cursor-pointer"
                />
                <div className="flex flex-col cursor-pointer">
                  <span className="font-bold text-slate-800">Controlling Officer</span>
                  <span className="text-[9px] text-slate-500">नियंत्रण अधिकारी</span>
                </div>
              </label>

              <label className="flex items-center gap-2 text-xs bg-indigo-50/70 border border-indigo-200 hover:border-indigo-500 rounded-lg p-2.5 cursor-pointer select-none transition-all">
                <input
                  type="checkbox"
                  checked={showSummaryTable}
                  onChange={(e) => setShowSummaryTable(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 bg-white text-indigo-650 focus:ring-indigo-500 accent-indigo-650 cursor-pointer"
                />
                <div className="flex flex-col cursor-pointer">
                  <span className="font-bold text-indigo-900">Show Summary (सारांश)</span>
                  <span className="text-[9px] text-indigo-700">सारांश सारणी दिखाएं</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {viewMode === "editor" ? (
          <>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm relative overflow-hidden shrink-0 space-y-4">
              <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-5">
                <Coins className="w-40 h-40 text-indigo-200" />
              </div>

              <div className="border-b border-gray-200 pb-3.5">
                <h2 className="text-lg font-bold text-gray-950 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-5 bg-indigo-650 rounded inline-block"></span>
                  Travelling Allowance (TA) Claim Terminal (7th CPC rules)
                </h2>
                <p className="text-xs text-slate-550 leading-normal mt-1">
                  Configure personnel parameters, journey logs, intermediate halt durations, and instantly compute exact Travelling Allowance rates with fully compliant enterprise formats.
                </p>
              </div>

              <form onSubmit={handleSaveClaim} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">Employee Name *</label>
                  <input 
                    type="text" 
                    required
                    value={employeeName} 
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder="Type Employee Name..." 
                    className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">Designation *</label>
                  <input 
                    type="text" 
                    required
                    value={designation} 
                    onChange={(e) => setDesignation(e.target.value)}
                    list="railway-designations"
                    placeholder="Type or select designation..." 
                    className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm" 
                  />
                  <datalist id="railway-designations">
                    {RAILWAY_DESIGNATIONS.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">Employee PF No. *</label>
                  <input 
                    type="text" 
                    required
                    value={empNo} 
                    onChange={(e) => setEmpNo(e.target.value)}
                    placeholder="Type Employee PF Number..." 
                    className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">7th CPC Pay Scale *</label>
                  <select 
                    required
                    value={payLevel} 
                    onChange={(e) => setPayLevel(e.target.value)}
                    className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
                  >
                    <option value="">-- Choose Pay Level --</option>
                    {PAY_LEVELS.map(pl => (
                      <option key={pl.level} value={pl.level}>{pl.level} (Max ₹{pl.rate}/day)</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">Division * / मंडल</label>
                  <select 
                    required
                    value={division} 
                    onChange={(e) => setDivision(e.target.value)}
                    className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
                  >
                    <option value="">-- Choose Division --</option>
                    {INDIAN_RAILWAY_DIVISIONS.map(div => (
                      <option key={div} value={div}>{div}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">Department * / विभाग</label>
                  <select 
                    required
                    value={department} 
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
                  >
                    <option value="">-- Choose Department --</option>
                    {INDIAN_RAILWAY_DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">Claim Month * / महीना</label>
                  <select 
                    required
                    value={claimMonth} 
                    onChange={(e) => setClaimMonth(e.target.value)}
                    className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
                  >
                    <option value="">-- Choose Month --</option>
                    {MONTHS_LIST.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">Claim Year * / वर्ष</label>
                  <select 
                    required
                    value={claimYear} 
                    onChange={(e) => setClaimYear(e.target.value)}
                    className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
                  >
                    <option value="">-- Choose Year --</option>
                    {YEARS_LIST.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">Bill Unit * / बिल यूनिट</label>
                  <input 
                    type="text" 
                    required
                    value={billUnit} 
                    onChange={(e) => setBillUnit(e.target.value)}
                    placeholder="Type Bill Unit code..." 
                    className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm" 
                  />
                </div>

                <div className="space-y-1 sm:col-span-2 md:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">Purpose of Journey * / यात्रा का उद्देश्य</label>
                  <input 
                    type="text" 
                    required
                    value={globalPurpose} 
                    onChange={(e) => {
                      setGlobalPurpose(e.target.value);
                      // Sync with legs to be absolutely safe
                      setJourneyLegs(prev => prev.map(leg => ({ ...leg, purpose: e.target.value })));
                    }}
                    placeholder="e.g. Inspecting SSE Track registers / Attendance in Audit Meeting" 
                    className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm" 
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider">TA Calculation Rule / टीए गणना नियम</label>
                  <select 
                    value={calculationMode} 
                    onChange={(e) => setCalculationMode(e.target.value as 'calendar_day' | 'continuous')}
                    className="w-full text-[13px] font-semibold bg-white border border-amber-500 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-sm font-bold"
                  >
                    <option value="calendar_day">🗓️ Calendar Day Basis (Midnight to Midnight) - Official Railway Rule</option>
                    <option value="continuous">⏱️ Continuous Tour Duration basis (12-Hour Slots)</option>
                  </select>
                  <p className="text-[9.5px] text-amber-800 mt-1 leading-normal font-medium">
                    {calculationMode === 'calendar_day' ? 
                      "✓ Official Indian Railways Rule: Tour is split by date boundaries. Overlap hours under each date: < 6 hrs = 30%, 6 to 12 hrs = 70%, > 12 hrs = 100% Daily Allowance." : 
                      "✓ Ongoing Continuous Tour: Total elapsed hours divided by 12-hour intervals."}
                  </p>
                </div>
              </form>
            </div>

        {/* Journey Log Leg Table */}
        <div className={`bg-white border border-gray-200 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col gap-4 ${isSidebarsShown ? "flex-1" : "flex-initial h-auto"}`}>
          <div className="flex justify-between items-center border-b border-gray-200 pb-3 shrink-0">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-3 bg-indigo-600 rounded-sm"></span>
                Journey Logs & Stops / यात्रा विवरण
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">Add segments for your departure and arrival legs to determine duty periods.</p>
            </div>
            <button
              type="button"
              onClick={addLeg}
              className="flex items-center gap-1 bg-indigo-650 hover:bg-indigo-700 bg-indigo-600 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg mr-2 transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Journey Leg
            </button>
          </div>

          <div className={`space-y-4 pr-1 ${isSidebarsShown ? "flex-1 overflow-y-auto" : "h-auto"}`}>
            {processedLegs.map((leg, index) => {
              const hours = leg.hours;
              const filteredStations = stationSearch.trim() === ""
                ? [
                    { code: "BSP", name: "Bilaspur Jn", hindiName: "बिलासपुर" },
                    { code: "R", name: "Raipur Jn", hindiName: "रायपुर" },
                    { code: "DURG", name: "Durg Jn", hindiName: "दुर्ग" },
                    { code: "G", name: "Gondia Jn", hindiName: "गोंदिया" },
                    { code: "NGP", name: "Nagpur Jn", hindiName: "नागपुर" },
                    { code: "NDLS", name: "New Delhi", hindiName: "नई दिल्ली" },
                    { code: "HWH", name: "Howrah Jn", hindiName: "हावड़ा" },
                    { code: "PNBE", name: "Patna Jn", hindiName: "पटना जं." }
                  ]
                : INDIAN_STATIONS.filter(item => {
                    const s = stationSearch.toLowerCase().trim();
                    return (
                      item.code.toLowerCase().includes(s) ||
                      item.name.toLowerCase().includes(s) ||
                      item.hindiName.toLowerCase().includes(s)
                    );
                  }).slice(0, 8);
              return (
                <React.Fragment key={leg.id}>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 relative transition-all duration-205">
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                      <span className="text-[11px] font-bold text-indigo-700 px-2 py-0.5 bg-indigo-50 border border-indigo-200 rounded">
                        Leg #{index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLeg(leg.id)}
                        className="text-red-600 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors cursor-pointer"
                        title="Remove core journey item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Input parameters */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="space-y-1 relative text-left">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1 select-none">
                          🚉 Station From / से
                        </label>
                        <input 
                          type="text" 
                          required
                          value={leg.stationFrom} 
                          onFocus={() => {
                            setActiveAutocomplete({ legId: leg.id, field: 'stationFrom' });
                            setStationSearch(leg.stationFrom || "");
                          }}
                          onChange={(e) => {
                            updateLegField(leg.id, 'stationFrom', e.target.value);
                            setStationSearch(e.target.value);
                            setActiveAutocomplete({ legId: leg.id, field: 'stationFrom' });
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              setActiveAutocomplete(null);
                            }, 220);
                          }}
                          placeholder="Type or search station..." 
                          className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 transition-all shadow-sm" 
                        />
                        {activeAutocomplete?.legId === leg.id && activeAutocomplete?.field === 'stationFrom' && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded-xl shadow-2xl z-50 max-h-68 overflow-y-auto overflow-x-hidden py-1 text-xs select-none">
                            <div className="px-2.5 py-1 text-[9px] font-bold text-slate-500 bg-slate-50 border-b border-slate-200 sticky top-0 flex justify-between">
                              <span>{stationSearch.trim() === "" ? "⚡ SUGGESTED STATIONS" : "🔎 SEARCH RESULTS"}</span>
                              <span className="text-emerald-700 font-mono">STA CODES</span>
                            </div>
                            {filteredStations.map((station) => (
                              <div
                                key={station.code}
                                onMouseDown={() => handleSelectStation(leg.id, 'stationFrom', station.code)}
                                className="px-3 py-2 hover:bg-indigo-50 hover:text-indigo-900 border-b border-slate-100 last:border-b-0 cursor-pointer flex justify-between items-center transition-colors duration-100"
                              >
                                <div className="font-bold flex items-center gap-2">
                                  <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded font-mono text-[9px] border border-amber-200 min-w-[38px] text-center">
                                    {station.code}
                                  </span>
                                  <span className="text-slate-800">{station.name}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-bold">
                                  {station.hindiName}
                                </div>
                              </div>
                            ))}
                            {filteredStations.length === 0 && (
                              <div className="px-3 py-3 text-center text-slate-500 text-[10px]">
                                No offline match found. Try online search.
                              </div>
                            )}
                            {stationSearch.trim() !== "" && (
                              <div
                                onMouseDown={() => handleSearchStationOnline(leg.id, 'stationFrom', stationSearch)}
                                className="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-t border-slate-200 cursor-pointer flex items-center justify-between transition-colors text-[10px] font-bold uppercase tracking-wider"
                              >
                                <div className="flex items-center gap-2">
                                  {isSearchingStation[`${leg.id}-stationFrom`] ? (
                                    <span className="w-3 h-3 border-2 border-indigo-650 border-t-transparent rounded-full animate-spin"></span>
                                  ) : (
                                    <span>🌐</span>
                                  )}
                                  <span>Search Indian DB for "{stationSearch}"</span>
                                </div>
                                <span className="text-[8px] bg-indigo-600 px-1 py-0.5 rounded text-white font-mono">ONLINE</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1 relative text-left">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1 select-none">
                          🚉 Station To / तक
                        </label>
                        <input 
                          type="text" 
                          required
                          value={leg.stationTo} 
                          onFocus={() => {
                            setActiveAutocomplete({ legId: leg.id, field: 'stationTo' });
                            setStationSearch(leg.stationTo || "");
                          }}
                          onChange={(e) => {
                            updateLegField(leg.id, 'stationTo', e.target.value);
                            setStationSearch(e.target.value);
                            setActiveAutocomplete({ legId: leg.id, field: 'stationTo' });
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              setActiveAutocomplete(null);
                            }, 220);
                          }}
                          placeholder="Type or search station..." 
                          className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 transition-all shadow-sm" 
                        />
                        {activeAutocomplete?.legId === leg.id && activeAutocomplete?.field === 'stationTo' && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded-xl shadow-2xl z-50 max-h-68 overflow-y-auto overflow-x-hidden py-1 text-xs select-none">
                            <div className="px-2.5 py-1 text-[9px] font-bold text-slate-500 bg-slate-50 border-b border-slate-200 sticky top-0 flex justify-between">
                              <span>{stationSearch.trim() === "" ? "⚡ SUGGESTED STATIONS" : "🔎 SEARCH RESULTS"}</span>
                              <span className="text-emerald-755 font-mono text-emerald-700">STA CODES</span>
                            </div>
                            {filteredStations.map((station) => (
                              <div
                                key={station.code}
                                onMouseDown={() => handleSelectStation(leg.id, 'stationTo', station.code)}
                                className="px-3 py-2 hover:bg-indigo-50 hover:text-indigo-900 border-b border-slate-100 last:border-b-0 cursor-pointer flex justify-between items-center transition-colors duration-100"
                              >
                                <div className="font-bold flex items-center gap-2">
                                  <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded font-mono text-[9px] border border-amber-200 min-w-[38px] text-center">
                                    {station.code}
                                  </span>
                                  <span className="text-slate-800">{station.name}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-bold">
                                  {station.hindiName}
                                </div>
                              </div>
                            ))}
                            {filteredStations.length === 0 && (
                              <div className="px-3 py-3 text-center text-slate-500 text-[10px]">
                                No offline match found. Try online search.
                              </div>
                            )}
                            {stationSearch.trim() !== "" && (
                              <div
                                onMouseDown={() => handleSearchStationOnline(leg.id, 'stationTo', stationSearch)}
                                className="px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-t border-slate-200 cursor-pointer flex items-center justify-between transition-colors text-[10px] font-bold uppercase tracking-wider"
                              >
                                <div className="flex items-center gap-2">
                                  {isSearchingStation[`${leg.id}-stationTo`] ? (
                                    <span className="w-3 h-3 border-2 border-indigo-650 border-t-transparent rounded-full animate-spin"></span>
                                  ) : (
                                    <span>🌐</span>
                                  )}
                                  <span>Search Indian DB for "{stationSearch}"</span>
                                </div>
                                <span className="text-[8px] bg-indigo-600 px-1 py-0.5 rounded text-white font-mono">ONLINE</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase">Transport Mode *</label>
                        <select 
                          required
                          value={leg.mode} 
                          onChange={(e) => updateLegField(leg.id, 'mode', e.target.value)}
                          className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-850 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                        >
                          <option value="Train">Train (ट्रेन)</option>
                          <option value="Road">By Road (सड़क मार्ग)</option>
                          <option value="Air">Air (हवाई जहाज)</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase flex justify-between items-center">
                          <span>Train No / Vehicle Code</span>
                          {leg.mode === 'Train' && leg.trainNoOrVehNo.trim() !== "" && (
                            <button
                              type="button"
                              onClick={() => handleLookupTrain(leg.id, leg.trainNoOrVehNo)}
                              className="text-[9px] bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1 cursor-pointer transition-all border border-indigo-200"
                              title="Search Train details online"
                            >
                              {isSearchingTrain[leg.id] ? (
                                <span className="w-2.5 h-2.5 border border-indigo-650 border-t-transparent rounded-full animate-spin"></span>
                              ) : (
                                <span>🔍 VALIDATE</span>
                              )}
                            </button>
                          )}
                        </label>
                        <div className="relative">
                          <input 
                            type="text" 
                            required
                            value={leg.trainNoOrVehNo} 
                            placeholder="e.g. 12488 / UP-25" 
                            onChange={(e) => {
                              const val = e.target.value;
                              updateLegField(leg.id, 'trainNoOrVehNo', val);
                              if (/^\d{5}$/.test(val.trim())) {
                                handleLookupTrain(leg.id, val.trim());
                              }
                            }}
                            className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 transition-all shadow-sm" 
                          />
                          {leg.mode === 'Train' && isSearchingTrain[leg.id] && (
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                              <span className="block w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                            </div>
                          )}
                        </div>
                        {leg.mode === 'Train' && leg.trainName && (
                          <div className="mt-1 text-[10px] text-emerald-700 flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded animate-fade-in font-medium">
                            <span>🚆</span>
                            <span className="font-bold truncate">{leg.trainName}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase select-none">
                          Departure Date
                        </label>
                        <input 
                          id={`depDate-${leg.id}`}
                          type="date" 
                          required
                          value={leg.depDate} 
                          onChange={(e) => updateLegField(leg.id, 'depDate', e.target.value)}
                          onClick={(e) => {
                            try {
                              (e.target as any).showPicker();
                            } catch (_) {}
                          }}
                          className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 [color-scheme:light] cursor-pointer shadow-sm" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase select-none">
                          Departure Time (Left)
                        </label>
                        <input 
                          id={`depTime-${leg.id}`}
                          type="time" 
                          required
                          value={leg.depTime} 
                          onChange={(e) => {
                            const val = e.target.value;
                            updateLegField(leg.id, 'depTime', val);
                            if (val && val.length === 5) {
                              const inputEl = e.target;
                              setTimeout(() => {
                                if (document.activeElement === inputEl) {
                                  inputEl.blur();
                                }
                              }, 500);
                            }
                          }}
                          onClick={(e) => {
                            try {
                              (e.target as any).showPicker();
                            } catch (_) {}
                          }}
                          className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 [color-scheme:light] cursor-pointer shadow-sm" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase select-none">
                          Arrival Date
                        </label>
                        <input 
                          id={`arrDate-${leg.id}`}
                          type="date" 
                          required
                          value={leg.arrDate} 
                          onChange={(e) => updateLegField(leg.id, 'arrDate', e.target.value)}
                          onClick={(e) => {
                            try {
                              (e.target as any).showPicker();
                            } catch (_) {}
                          }}
                          className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 [color-scheme:light] cursor-pointer shadow-sm" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase select-none">
                          Arrival Time (Arrived)
                        </label>
                        <input 
                          id={`arrTime-${leg.id}`}
                          type="time" 
                          required
                          value={leg.arrTime} 
                          onChange={(e) => {
                            const val = e.target.value;
                            updateLegField(leg.id, 'arrTime', val);
                            if (val && val.length === 5) {
                              const inputEl = e.target;
                              setTimeout(() => {
                                if (document.activeElement === inputEl) {
                                  inputEl.blur();
                                }
                              }, 500);
                            }
                          }}
                          onClick={(e) => {
                            try {
                              (e.target as any).showPicker();
                            } catch (_) {}
                          }}
                          className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 [color-scheme:light] cursor-pointer shadow-sm" 
                        />
                      </div>
                    </div>

                    {/* BY ROAD SPECIFIC SUBSYSTEM PANEL */}
                    {leg.mode === 'Road' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-indigo-50/50 border border-indigo-200 p-3 rounded-lg animate-fadeIn">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-indigo-850 uppercase flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-indigo-600" /> Road Travel Distance (in KM)
                          </label>
                          <input
                            type="number"
                            value={leg.roadDistanceKm || 0}
                            onChange={(e) => updateLegField(leg.id, 'roadDistanceKm', parseFloat(e.target.value) || 0)}
                            placeholder="e.g. 12"
                            className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-700 uppercase">
                            Vehicle Type / Allowance Rate
                          </label>
                          <select
                            value={leg.roadType || 'car_taxi'}
                            onChange={(e) => updateLegField(leg.id, 'roadType', e.target.value)}
                            className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-850 cursor-pointer"
                          >
                            <option value="car_taxi">Own Car / Taxi (₹ 24 per KM)</option>
                            <option value="auto_scooter">Auto Rickshaw / Scooter / Own Bike (₹ 12 per KM)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* TRAIN / AIR DETAILED DISTANCE POPULATING BOX */}
                    {leg.mode !== 'Road' && (
                      <div className="bg-slate-100 border border-slate-200 p-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between text-xs gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-700">
                            <Coins className="w-3.5 h-3.5 text-indigo-650" />
                            <span>Track Distance / यात्रा की दूरी (KM)</span>
                          </div>
                          {leg.mode === 'Train' && leg.trainRouteVia && (
                            <div className="text-[10px] text-emerald-705 text-emerald-800 font-medium flex items-center gap-1">
                              <span>🛤️ Route:</span>
                              <span className="font-semibold">{leg.trainRouteVia} (Via Train Path)</span>
                            </div>
                          )}
                          {leg.mode === 'Train' && !leg.trainRouteVia && (
                            <div className="text-[10px] text-slate-500 font-medium">
                              Distance calculated by default. Tap "Query Route Distance" to fetch actual railway mileage.
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap text-slate-800">
                          <input
                            type="number"
                            value={leg.roadDistanceKm || 0}
                            onChange={(e) => updateLegField(leg.id, 'roadDistanceKm', parseFloat(e.target.value) || 0)}
                            className="w-24 text-center text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 font-mono"
                          />
                          <span className="text-slate-500 font-mono text-[10px] select-none">KM</span>
                          {leg.mode === 'Train' && leg.trainNoOrVehNo ? (
                            <button
                              type="button"
                              onClick={() => handleLookupTrain(leg.id, leg.trainNoOrVehNo)}
                              className="text-[9px] bg-slate-50 hover:bg-slate-100 text-indigo-700 hover:text-indigo-900 px-2.5 py-1.5 rounded font-bold border border-slate-300 transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                              title="Fetch precise Indian Railways route mileage between these stations"
                            >
                              {isSearchingTrain[leg.id] ? (
                                <span className="w-2.5 h-2.5 border border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                              ) : (
                                <span>🛤️ Query Route Distance</span>
                              )}
                            </button>
                          ) : leg.stationFrom && leg.stationTo ? (
                            <span className="text-[9px] text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded select-none font-bold">
                              ✔ Default Est.
                            </span>
                          ) : null}
                        </div>
                      </div>
                    )}

                    {/* CONTROLLER CHECKBOX MODIFIERS REGULATING CPC LAWS */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                      <label className="flex items-center gap-1.5 text-[10px] cursor-pointer select-none text-slate-700 hover:text-slate-900 transition-colors">
                        <input
                          type="checkbox"
                          checked={leg.beyond8Km !== false}
                          onChange={(e) => updateLegField(leg.id, 'beyond8Km', e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer accent-indigo-650"
                        />
                        <span>Beyond 8 km HQ</span>
                      </label>

                      <label className="flex items-center gap-1.5 text-[10px] cursor-pointer select-none text-slate-700 hover:text-slate-900 transition-colors" title="Attending breakdown duties guarantees flat 100% daily allowance without the 8 KM distance clause">
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
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer accent-indigo-650"
                        />
                        <span className="text-emerald-700 font-bold">Breakdown Duty</span>
                      </label>

                      <label className="flex items-center gap-1.5 text-[10px] cursor-pointer select-none text-slate-700 hover:text-slate-900 transition-colors" title="Undergoing training at centers with free boarding/messing allows 20% flat daily allowance rate">
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
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer accent-indigo-650"
                        />
                        <span className="text-indigo-600">Free Mess Training</span>
                      </label>

                      <label className="flex items-center gap-1.5 text-[10px] cursor-pointer select-none text-slate-700 hover:text-slate-900 transition-colors" title="Personnel of the Territorial Army receive double the rate of TA while undergoing training embodiment">
                        <input
                          type="checkbox"
                          checked={!!leg.isTerritorialArmy}
                          onChange={(e) => updateLegField(leg.id, 'isTerritorialArmy', e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer accent-indigo-650"
                        />
                        <span className="text-amber-800 font-bold">Territorial Army</span>
                      </label>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                      <div className="text-slate-600 font-mono">
                        Leg Duration: <strong className="text-slate-900">{hours.toFixed(1)} Hrs</strong>
                        {leg.beyond8Km === false && !leg.isBreakdownDuty && (
                          <span className="text-rose-600 ml-2 font-bold">(Ineligible: within 8 KM radius)</span>
                        )}
                        {(() => {
                          if (leg.isFreeMessingTraining) {
                            return <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 ml-2 inline-block font-bold">(Training Flat 20%)</span>;
                          }
                          if (leg.isBreakdownDuty) {
                            return <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 ml-2 inline-block font-bold">(Breakdown Flat 100%)</span>;
                          }
                          if (leg.beyond8Km === false) {
                            return <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-250 ml-2 inline-block font-bold">(Excluded HQ 8km)</span>;
                          }
                          if (totalAbsenceHrs > 0) {
                            const sharePct = ((leg.hours / totalAbsenceHrs) * 100).toFixed(0);
                            const totalPctStr = (continuousDaPct * 100).toFixed(0);
                            return (
                              <span className="text-[10px] text-slate-600 bg-indigo-50/50 px-1.5 py-0.5 rounded border border-indigo-200 ml-2 inline-block">
                                Share of continuous absence ({sharePct}% of {totalPctStr}%)
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <div className="text-slate-600 font-mono flex items-center gap-3">
                        {leg.daAmount > 0 && <span>Shared DA: <strong className="text-slate-900">₹ {leg.daAmount}</strong></span>}
                        {leg.mileageAmount > 0 && <span>Mileage: <strong className="text-slate-900">₹ {leg.mileageAmount}</strong></span>}
                        <span>Subtotal: <strong className="text-emerald-700 font-bold">₹{leg.amount}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* AUTOMATED TRANSIT HALT OPTION PANELS */}
                  {leg.haltHours > 0 && (
                    <div className="bg-indigo-50/75 border border-dashed border-indigo-300 rounded-xl p-4 space-y-3 relative animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                          ⌛ Intermediate Waiting/Halt at "{leg.stationTo || 'Destination'}" — {leg.haltHours.toFixed(1)} Hrs
                          {leg.haltDaContributed > 0 && (
                            <span className="text-emerald-700 font-black ml-1 font-mono">
                              (₹ {leg.haltDaContributed})
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-250 font-mono">
                          Halt Allowance (विराम भत्ता): ₹{leg.haltDaContributed}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 leading-normal">
                        Where was this waiting time of <strong>{leg.haltHours.toFixed(1)} hours</strong> spent between Leg #{index + 1} and Leg #{index + 2}?
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[9.5px] font-bold text-slate-600 uppercase mb-1">Halt Location Option / स्थान चयन</label>
                          <select
                            value={leg.haltSpentAt || 'destination'}
                            onChange={(e) => updateLegField(leg.id, 'haltSpentAt', e.target.value)}
                            className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="destination">Stay at "{leg.stationTo || 'Station'}" / रुकना (Official Duty के तहत)</option>
                            <option value="manual">Enter manually... / अन्य प्रविष्टि (विवरण मैन्युअल दर्ज करें)</option>
                          </select>
                        </div>

                        {leg.haltSpentAt === 'manual' && (
                          <div className="space-y-1">
                            <label className="block text-[9.5px] font-bold text-slate-600 uppercase mb-1">Custom Stoppage Description / विराम का कारण</label>
                            <input
                              type="text"
                              required
                              value={leg.haltManualText || ''}
                              onChange={(e) => updateLegField(leg.id, 'haltManualText', e.target.value)}
                              placeholder="e.g. Connected train waiting at DRM office / यार्ड निरीक्षण"
                              className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
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

          {/* DYNAMIC CONTINGENT EXPENSES SECTIONS */}
          {storeConfig.enableContingentSection !== "false" && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                    🪙 Custom Contingent Expenses (फुटकर व्यय का विवरण)
                  </h3>
                  <p className="text-[10px] text-slate-600 leading-normal">Add dynamic contingency costs. Provide clear remarks stating what & where it was spent.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setContingentItems([
                      ...contingentItems,
                      { id: `cnt-${Date.now()}`, amount: 0, remarks: "" }
                    ]);
                  }}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] px-2.5 py-1 rounded transition-all shadow active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Contingent Cost
                </button>
              </div>

              {contingentItems.length === 0 ? (
                <div className="text-center py-4 bg-white rounded-lg border border-slate-200 text-[11px] text-slate-500 italic">
                  No custom contingent costs added yet. Click "Add Contingent Cost" to add items like luggage carrying cost, coolie charges, bus/taxi fare details, auto parking, etc.
                </div>
              ) : (
                <div className="space-y-3">
                  {contingentItems.map((item, idx) => (
                    <div key={item.id} className="flex gap-3 items-end bg-white p-2.5 rounded-lg border border-slate-205 shadow-sm">
                      <div className="flex-1 text-left space-y-1">
                        <label className="block text-[9px] font-bold text-slate-500 uppercase">
                          Item #{idx + 1} Particulars & Remarks (व्यय का विवरण / कहाँ और किस चीज़ में खर्च हुआ)
                        </label>
                        <input
                          type="text"
                          required
                          value={item.remarks}
                          onChange={(e) => {
                            const updated = contingentItems.map(c => c.id === item.id ? { ...c, remarks: e.target.value } : c);
                            setContingentItems(updated);
                          }}
                          placeholder="e.g. Spent Rs 50 on coolie charges at Katihar Station / Auto fare from HQ to DRM Office"
                          className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="w-32 text-left space-y-1">
                        <label className="block text-[9px] font-bold text-slate-500 uppercase">
                          Amount (राशि ₹)
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={item.amount || ""}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = contingentItems.map(c => c.id === item.id ? { ...c, amount: val } : c);
                            setContingentItems(updated);
                          }}
                          placeholder="Amount in Rs."
                          className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setContingentItems(contingentItems.filter(c => c.id !== item.id));
                        }}
                        className="text-rose-600 hover:text-rose-750 p-2 rounded hover:bg-rose-50 transition-colors shrink-0 mb-0.5"
                        title="Delete expense item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <div className="flex justify-end pr-2 text-xs font-mono text-slate-600">
                    Total Added Contingent: <strong className="text-emerald-700 ml-1 font-bold">₹{totalContingentAmount}</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Declaration and Action buttons */}
          <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3 shrink-0 shadow-sm">
            <div className="flex items-start gap-2 text-xs">
              <input 
                id="declaration-chk"
                type="checkbox" 
                checked={hasDeclared}
                onChange={(e) => setHasDeclared(e.target.checked)}
                className="mt-0.5 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
              />
              <label htmlFor="declaration-chk" className="text-slate-700 select-none cursor-pointer leading-normal text-justify font-bold uppercase tracking-wide text-[10px]">
                I hereby declare that the particulars given above are true and complete, and that I did not draw any duplicate Travelling Allowance (TA) benefits for this period.
              </label>
            </div>

            <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-left font-mono text-xs text-slate-600">
                Total hours of absence: <span className="text-slate-900 font-extrabold">{totalAbsenceHrs.toFixed(1)} Hrs</span>, 
                Aggregate Sum Rate: <span className="text-emerald-700 font-extrabold text-sm ml-1">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold font-sans cursor-pointer transition-all border border-slate-300 shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" /> Clear
                </button>
                <button
                  type="button"
                  onClick={handleSaveClaim}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-750 text-white px-4 py-2 rounded-lg text-xs font-extrabold font-sans cursor-pointer transition-all shadow"
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
            <div className="text-center mb-4 flex flex-col sm:flex-row items-center gap-3 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
              <span className="text-xs bg-indigo-950/80 border border-indigo-800 text-indigo-400 py-1.5 px-4 rounded-lg font-mono font-bold tracking-wider">
                A4 Sheet Preview (ए4 शीट पूर्वावलोकन)
              </span>
              
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setIsLandscape(false)}
                  className={`text-[11px] px-3 py-1 rounded font-bold transition-all ${!isLandscape ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-slate-400 hover:text-white'}`}
                >
                  📄 Portrait
                </button>
                <button
                  type="button"
                  onClick={() => setIsLandscape(true)}
                  className={`text-[11px] px-3 py-1 rounded font-bold transition-all ${isLandscape ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'text-slate-400 hover:text-white'}`}
                >
                  📟 Landscape (Landscape recommended)
                </button>
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 bg-emerald-650 hover:bg-emerald-700 bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow cursor-pointer uppercase tracking-wider"
              >
                <Printer className="w-4 h-4" /> Print TA Bill (प्रिंट)
              </button>
            </div>
            <div className="w-full overflow-x-auto flex justify-start lg:justify-center p-1 md:p-4">
              <div className={`bg-white text-black pl-[8mm] pr-[8mm] pt-[15mm] pb-[15mm] font-serif leading-relaxed text-[13pt] shadow-[0_0_30px_rgba(0,0,0,0.6)] border border-gray-300 rounded shrink-0 my-2 select-text ${isLandscape ? 'w-[297mm] min-h-[210mm]' : 'w-[210mm] min-h-[297mm]'}`}>
                {renderPrintSheetContent()}
              </div>
            </div>
          </div>
        )}
      </div>

      {isSidebarsShown && (
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
                  <p className="text-[10px] text-slate-400 italic truncate leading-none flex flex-wrap gap-1 items-center">
                    <span>{claim.designation} ({claim.payLevel})</span>
                    {claim.claimMonth && <span className="text-violet-400 font-bold">• {claim.claimMonth.substring(0,3)} {claim.claimYear}</span>}
                    {claim.billUnit && <span className="text-amber-500 font-mono text-[9px] bg-amber-950/20 px-1 rounded border border-amber-900/30">BU: {claim.billUnit}</span>}
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

          {/* STATION & CODE DIRECTORY / स्टेशन डायरेक्टरी */}
          <div className="bg-[#0e1628]/95 border border-[#1e2a47] rounded-xl p-4 flex flex-col gap-3 shrink-0 text-left">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-[#223354] pb-2 flex items-center justify-between gap-1 shrink-0">
              <span className="flex items-center gap-1.5 font-bold">
                🚉 Station Directory / स्टेशन डायरेक्टरी
              </span>
              <span className="text-[9px] bg-violet-900/40 text-violet-300 px-1.5 py-0.5 rounded font-bold border border-violet-850/40 font-mono">
                {INDIAN_STATIONS.length} Loaded
              </span>
            </h3>

            {/* Mode selection / search */}
            <div className="space-y-2">
              <input
                type="text"
                placeholder="🔍 Search stations / स्टेशन खोजें..."
                value={stationQuerySearch}
                onChange={(e) => setStationQuerySearch(e.target.value)}
                className="w-full text-[11px] bg-slate-950 border border-slate-850 rounded px-2 py-1 text-white placeholder-slate-650 focus:outline-none focus:border-violet-500 font-sans"
              />

              {stationQuerySearch && (
                <div className="max-h-24 overflow-y-auto bg-slate-950 border border-slate-900 rounded p-1 space-y-1">
                  {INDIAN_STATIONS.filter(s => 
                    s.code.toLowerCase().includes(stationQuerySearch.toLowerCase()) || 
                    s.name.toLowerCase().includes(stationQuerySearch.toLowerCase()) ||
                    s.hindiName.toLowerCase().includes(stationQuerySearch.toLowerCase())
                  ).slice(0, 15).map(s => (
                    <div key={s.code} className="flex justify-between items-center text-[10px] p-1 border-b border-slate-900 last:border-0 hover:bg-slate-900">
                      <div className="font-bold flex items-center gap-1">
                        <span className="text-amber-500 font-mono">{s.code}</span>
                        <span className="text-slate-300">{s.name}</span>
                      </div>
                      <span className="text-[9px] text-slate-550 hindi-font">{s.hindiName}</span>
                    </div>
                  ))}
                  {INDIAN_STATIONS.filter(s => 
                    s.code.toLowerCase().includes(stationQuerySearch.toLowerCase()) || 
                    s.name.toLowerCase().includes(stationQuerySearch.toLowerCase()) ||
                    s.hindiName.toLowerCase().includes(stationQuerySearch.toLowerCase())
                  ).length === 0 && (
                    <div className="text-center py-2 text-[10px] text-slate-500">
                      No matches found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Add Form */}
            <div className="bg-slate-950/40 border border-slate-900 rounded-lg p-2.5 space-y-2">
              <div className="text-[10px] font-extrabold text-violet-400 uppercase tracking-wider flex justify-between">
                <span>➕ Add Custom Station / स्टेशन जोड़ें</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <input
                  type="text"
                  placeholder="Code (BSP)"
                  value={newStationCode}
                  onChange={(e) => setNewStationCode(e.target.value)}
                  className="text-[10px] bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-white uppercase text-center font-mono placeholder-slate-700 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="English Name"
                  value={newStationName}
                  onChange={(e) => setNewStationName(e.target.value)}
                  className="col-span-2 text-[10px] bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-white placeholder-slate-700 focus:outline-none"
                />
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Hindi Name (Optional)"
                  value={newStationHindi}
                  onChange={(e) => setNewStationHindi(e.target.value)}
                  className="flex-1 text-[10px] bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-white placeholder-slate-700 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleManualAddStation}
                  className="bg-violet-600 hover:bg-violet-500 text-white font-black text-[9px] px-3 py-1 rounded transition duration-150 cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Bulk Importer Section */}
            <div className="border-t border-slate-850 pt-2.5">
              {!stationShowImporter ? (
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStationShowImporter(true)}
                    className="w-full bg-slate-900 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-850 text-slate-350 font-bold text-[9.5px] py-1.5 px-2 rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>📥 Bulk Import / Paste Code List</span>
                  </button>
                  <p className="text-[9px] text-slate-500 text-center leading-normal">
                    💡 <span className="text-emerald-400 font-semibold">Tip:</span> You can also directly <span className="font-semibold text-slate-350">upload a PDF/TXT list in this chat</span>, and the agent will register all of them in the codebase!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9.5px] font-bold text-slate-400">Paste rows (One per line):</span>
                    <button 
                      type="button"
                      onClick={() => setStationShowImporter(false)}
                      className="text-[9px] text-red-400 hover:underline font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea
                    placeholder="E.g.&#10;BSP Bilaspur Jn (बिलासपुर)&#10;NDLS New Delhi (नई दिल्ली)&#10;HWH Howrah Jn"
                    value={bulkStationText}
                    onChange={(e) => setBulkStationText(e.target.value)}
                    rows={4}
                    className="w-full text-[9.5px] bg-slate-950 border border-slate-850 rounded p-1.5 text-white font-mono placeholder-slate-700 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleBulkImportStations}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] py-1.5 rounded transition duration-150 cursor-pointer uppercase"
                  >
                    Parse & Import Stations
                  </button>
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
                  <div className="flex justify-between"><span>Level-14 & above</span> <span>₹ 1500/-</span></div>
                  <div className="flex justify-between"><span>Level-12 & 13</span> <span>₹ 1250/-</span></div>
                  <div className="flex justify-between"><span>Level-09 to 11</span> <span>₹ 1125/-</span></div>
                  <div className="flex justify-between"><span>Level-06 to 08</span> <span>₹ 1000/-</span></div>
                  <div className="flex justify-between"><span>Level-05 & below</span> <span>₹ 625/-</span></div>
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
      )}

    </div>
  );
}
