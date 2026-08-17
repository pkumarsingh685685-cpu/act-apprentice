import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { triggerPrint } from '../utils/printHelper';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, getDocs, onSnapshot, query, orderBy, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Printer, FileText, RotateCcw, Plus, PlusCircle, Trash2, ShieldCheck, CheckSquare, Coins, Info, Calendar, Edit3, Eye, Clock, ChevronsLeftRight, ChevronsRightLeft } from 'lucide-react';
import { PrintCustomizer, PrintSettings, RenderPrintOverlayWatermark, RenderPrintOverlaySeal, RenderPrintOverlaySignature } from './PrintCustomizer';
import { INDIAN_STATIONS, findStation, getStationDistance, registerStation } from '../utils/stationHelper';

interface JourneyLeg {
  id: string;
  tripId?: string;
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

export interface TripStay {
  tripId: string;
  startWithStay: boolean;
  stayType?: 'before' | 'after';
  initialStayStation: string;
  initialStayStartDate: string;
  initialStayStartTime: string;
  initialStayEndDate: string;
  initialStayEndTime: string;
  initialStayPurpose: string;
}

interface ContingentItem {
  id: string;
  tripId?: string;
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
  showNoFreePassDeclaration?: boolean;
  showClaimantSig?: boolean;
  showCounterSig?: boolean;
  showHeadOfficeSig?: boolean;
  showControllingOfficerSig?: boolean;
  startWithStay?: boolean;
  initialStayStation?: string;
  initialStayStartDate?: string;
  initialStayStartTime?: string;
  initialStayEndDate?: string;
  initialStayEndTime?: string;
  initialStayPurpose?: string;
  tripStays?: TripStay[];
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
  "General Assistant",
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

interface TimePickerInputProps {
  id: string;
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

const parse24To12 = (time24: string) => {
  if (!time24) return { hour: "12", minute: "00", ampm: "AM", display: "" };
  const parts = time24.split(":");
  if (parts.length !== 2) return { hour: "12", minute: "00", ampm: "AM", display: "" };
  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return { hour: "12", minute: "00", ampm: "AM", display: "" };
  
  const ampm = h >= 12 ? "PM" : "AM";
  let h12 = h % 12;
  if (h12 === 0) h12 = 12;
  
  const h12Str = h12.toString().padStart(2, "0");
  const m12Str = m.toString().padStart(2, "0");
  return {
    hour: h12Str,
    minute: m12Str,
    ampm,
    display: `${h12Str}:${m12Str} ${ampm}`
  };
};

const convert12To24 = (h12: string, m12: string, ampm: string) => {
  let h = parseInt(h12, 10) || 12;
  let m = parseInt(m12, 10) || 0;
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

function TimePickerInput({ id, value, onChange, required, className, placeholder = "Select Time / समय चुनें" }: TimePickerInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { hour, minute, ampm, display } = parse24To12(value);

  const selectHour = (h: string) => {
    const newVal = convert12To24(h, minute, ampm);
    onChange(newVal);
  };

  const selectMinute = (m: string) => {
    const newVal = convert12To24(hour, m, ampm);
    onChange(newVal);
  };

  const toggleAmPm = (newAmpm: string) => {
    const newVal = convert12To24(hour, minute, newAmpm);
    onChange(newVal);
  };

  const hoursList = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutesList = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div ref={containerRef} className="relative w-full select-none">
      <div className="relative">
        <input
          id={id}
          type="text"
          readOnly
          required={required}
          value={display}
          placeholder={placeholder}
          onClick={() => setIsOpen(!isOpen)}
          className={className || "w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg pl-3 pr-8 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm cursor-pointer"}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 focus:outline-none"
        >
          <Clock className="w-4 h-4" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-3 text-[12px] animate-fade-in">
          <div className="grid grid-cols-3 gap-1.5">
            {/* Hours Column */}
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-center">Hour</span>
              <div className="h-32 overflow-y-auto border border-slate-150 rounded bg-slate-50 scrollbar-thin">
                {hoursList.map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => selectHour(h)}
                    className={`w-full text-center py-1 text-[11px] transition-colors block ${
                      hour === h
                        ? "bg-indigo-600 text-white font-bold"
                        : "text-slate-700 hover:bg-indigo-50"
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes Column */}
            <div>
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-center">Min</span>
              <div className="h-32 overflow-y-auto border border-slate-150 rounded bg-slate-50 scrollbar-thin">
                {minutesList.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => selectMinute(m)}
                    className={`w-full text-center py-1 text-[11px] transition-colors block ${
                      minute === m
                        ? "bg-indigo-600 text-white font-bold"
                        : "text-slate-700 hover:bg-indigo-50"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* AM/PM Column */}
            <div className="flex flex-col justify-center space-y-2">
              <button
                type="button"
                onClick={() => toggleAmPm("AM")}
                className={`w-full py-2 rounded text-center font-bold border transition-colors ${
                  ampm === "AM"
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => toggleAmPm("PM")}
                className={`w-full py-2 rounded text-center font-bold border transition-colors ${
                  ampm === "PM"
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                PM
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="px-2 py-1 text-red-650 hover:text-red-750 rounded text-[11px] font-semibold transition-colors"
            >
              Clear / साफ़ करें
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-semibold transition-colors shadow-sm"
            >
              OK / ठीक है
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export interface ClaimTaManagerProps {
  showSidebars?: boolean;
  onToggleSidebars?: (show: boolean) => void;
  onBackToDashboard?: () => void;
}

export function ClaimTaManager({ showSidebars, onToggleSidebars, onBackToDashboard }: ClaimTaManagerProps) {
  const navigate = useNavigate();
  const storeConfig = useStore((state) => state.config);
  const isAdmin = useStore((state) => state.isAdmin);
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
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
  const [globalPurpose, setGlobalPurpose] = useState("");
  
  // States for starting the tour with a stationary stay instead of travel
  const [startWithStay, setStartWithStay] = useState(false);
  const [initialStayStation, setInitialStayStation] = useState("");
  const [initialStayStartDate, setInitialStayStartDate] = useState("");
  const [initialStayStartTime, setInitialStayStartTime] = useState("");
  const [initialStayEndDate, setInitialStayEndDate] = useState("");
  const [initialStayEndTime, setInitialStayEndTime] = useState("");
  const [initialStayPurpose, setInitialStayPurpose] = useState("");
  
  const [tripStays, setTripStays] = useState<TripStay[]>([]);

  const updateTripStayField = (tripId: string, field: keyof TripStay, value: any) => {
    setTripStays(prev => {
      const existing = prev.find(ts => ts.tripId === tripId);
      if (existing) {
        return prev.map(ts => ts.tripId === tripId ? { ...ts, [field]: value } : ts);
      } else {
        const newStay: TripStay = {
          tripId,
          startWithStay: false,
          initialStayStation: "",
          initialStayStartDate: "",
          initialStayStartTime: "",
          initialStayEndDate: "",
          initialStayEndTime: "",
          initialStayPurpose: "",
          [field]: value
        };
        return [...prev, newStay];
      }
    });
  };

  const updateTripStayFields = (tripId: string, updates: Partial<TripStay>) => {
    setTripStays(prev => {
      const existing = prev.find(ts => ts.tripId === tripId);
      if (existing) {
        return prev.map(ts => ts.tripId === tripId ? { ...ts, ...updates } : ts);
      } else {
        const newStay: TripStay = {
          tripId,
          startWithStay: false,
          initialStayStation: "",
          initialStayStartDate: "",
          initialStayStartTime: "",
          initialStayEndDate: "",
          initialStayEndTime: "",
          initialStayPurpose: "",
          ...updates
        };
        return [...prev, newStay];
      }
    });
  };

  const addContingentItemToTrip = (tripId: string) => {
    const newItem: ContingentItem = {
      id: `cont-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      tripId: tripId,
      amount: 0,
      remarks: ""
    };
    setContingentItems(prev => [...prev, newItem]);
  };

  const getTripInitialStayHrs = (ts: TripStay) => {
    if (ts.startWithStay && ts.initialStayStation && ts.initialStayStartDate && ts.initialStayStartTime && ts.initialStayEndDate && ts.initialStayEndTime) {
      const sTime = new Date(`${ts.initialStayStartDate}T${ts.initialStayStartTime}`);
      const eTime = new Date(`${ts.initialStayEndDate}T${ts.initialStayEndTime}`);
      const stayDiffMs = eTime.getTime() - sTime.getTime();
      if (!isNaN(stayDiffMs) && stayDiffMs > 0) {
        return stayDiffMs / (1000 * 60 * 60);
      }
    }
    return 0;
  };
  
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
  const [customTrains, setCustomTrains] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "custom_trains"), (snapshot) => {
      const trainsList = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          trainNo: d.trainNo || doc.id,
          trainName: d.trainName || "",
          routeDistanceKm: Number(d.routeDistanceKm) || 0,
          routeVia: d.routeVia || ""
        };
      });
      setCustomTrains(trainsList);
    }, (err) => {
      console.error("Error loading custom trains:", err);
    });
    return () => unsub();
  }, []);

  const [contingentItems, setContingentItems] = useState<ContingentItem[]>([]);
  const [isEditingOrDrafting, setIsEditingOrDrafting] = useState<boolean>(false);
  const [taSearchQuery, setTaSearchQuery] = useState("");
  const componentRef = useRef<HTMLDivElement>(null);

  // Signature selection visibility toggles
  const [showClaimantSig, setShowClaimantSig] = useState(true);
  const [showCounterSig, setShowCounterSig] = useState(false);
  const [showHeadOfficeSig, setShowHeadOfficeSig] = useState(true);
  const [showControllingOfficerSig, setShowControllingOfficerSig] = useState(true);
  const [showSummaryTable, setShowSummaryTable] = useState(false);
  const [showNoFreePassDeclaration, setShowNoFreePassDeclaration] = useState(false);

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
    sigYOffset: 0,
    tableFontSizeScale: 100
  });

  const [viewMode, setViewMode] = useState<"editor" | "preview">("editor");
  const [activeAutocomplete, setActiveAutocomplete] = useState<{ legId: string, field: 'stationFrom' | 'stationTo' } | null>(null);
  const [stationSearch, setStationSearch] = useState<string>("");
  const [isSearchingStation, setIsSearchingStation] = useState<Record<string, boolean>>({});
  const [isSearchingTrain, setIsSearchingTrain] = useState<Record<string, boolean>>({});
  const [autocompleteRevision, setAutocompleteRevision] = useState<number>(0);

  // Background Automatic Autocomplete for Stations as User Types
  useEffect(() => {
    const q = stationSearch.trim();
    if (q.length < 2) return;

    const legId = activeAutocomplete?.legId;
    const field = activeAutocomplete?.field;
    if (!legId || !field) return;

    const cacheKey = `${legId}-${field}`;

    // Set searching state immediately for instant, responsive UI feedback
    setIsSearchingStation(prev => ({ ...prev, [cacheKey]: true }));

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch("/api/railway/search-station", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q })
        });
        const data = await res.json();
        if (data.success) {
          let updated = false;
          if (data.stations && Array.isArray(data.stations)) {
            data.stations.forEach((st: any) => {
              if (st && st.code) {
                const codeUpper = st.code.toUpperCase();
                const exists = INDIAN_STATIONS.some(s => s.code.toUpperCase() === codeUpper);
                if (!exists) {
                  registerStation(st);
                  updated = true;
                }
              }
            });
          } else if (data.station && data.station.code) {
            const codeUpper = data.station.code.toUpperCase();
            const exists = INDIAN_STATIONS.some(s => s.code.toUpperCase() === codeUpper);
            if (!exists) {
              registerStation(data.station);
              updated = true;
            }
          }
          if (updated) {
            setAutocompleteRevision(prev => prev + 1);
          }
        }
      } catch (err) {
        console.warn("Background station autocomplete failed:", err);
      } finally {
        setIsSearchingStation(prev => ({ ...prev, [cacheKey]: false }));
      }
    }, 300); // Super-snappy 300ms debounce

    return () => {
      clearTimeout(delayDebounceFn);
      // Clean up searching status when query changes or on unmount
      setIsSearchingStation(prev => ({ ...prev, [cacheKey]: false }));
    };
  }, [stationSearch, activeAutocomplete]);

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
      // 1. Check custom trains list from local/firestore collection first
      const matchedLocal = customTrains.find(
        t => t.trainNo === cleanStr || t.trainName.toLowerCase() === cleanStr.toLowerCase()
      );
      if (matchedLocal) {
        updateLegField(legId, 'trainName', matchedLocal.trainName);
        if (matchedLocal.trainNo && cleanStr !== matchedLocal.trainNo) {
          updateLegField(legId, 'trainNoOrVehNo', matchedLocal.trainNo);
        }
        if (matchedLocal.routeVia) {
          updateLegField(legId, 'trainRouteVia', matchedLocal.routeVia);
        }
        if (typeof matchedLocal.routeDistanceKm === 'number' && matchedLocal.routeDistanceKm > 0) {
          updateLegField(legId, 'roadDistanceKm', matchedLocal.routeDistanceKm);
          toast.success(`Track distance updated from custom railway database: ${matchedLocal.routeDistanceKm} KM!`);
        } else {
          toast.success(`Verified from uploaded custom train database: ${matchedLocal.trainName}`);
        }
        setIsSearchingTrain(prev => ({ ...prev, [legId]: false }));
        return;
      }

      // 2. Fallback to online/backend lookup
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

        // Persistent save to Firebase "custom_trains"
        try {
          const tNo = data.train.trainNo || cleanStr;
          await setDoc(doc(db, "custom_trains", tNo), {
            trainNo: tNo,
            trainName: data.train.trainName,
            routeDistanceKm: Number(data.train.routeDistanceKm) || 0,
            routeVia: data.train.routeVia || ""
          });
          console.log(`Saved online train details to Firestore custom_trains for ${tNo}`);
        } catch (fbErr) {
          console.warn("Failed to persist online train query in Firestore:", fbErr);
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

  // Compute initial stay hours if enabled
  let initialStayHrs = 0;
  if (startWithStay && initialStayStation && initialStayStartDate && initialStayStartTime && initialStayEndDate && initialStayEndTime) {
    const sTime = new Date(`${initialStayStartDate}T${initialStayStartTime}`);
    const eTime = new Date(`${initialStayEndDate}T${initialStayEndTime}`);
    const stayDiffMs = eTime.getTime() - sTime.getTime();
    if (!isNaN(stayDiffMs) && stayDiffMs > 0) {
      initialStayHrs = stayDiffMs / (1000 * 60 * 60);
    }
  }

  const normalizedJourneyLegs = useMemo(() => {
    if (journeyLegs.length === 0) return [];
    const hqStation = journeyLegs[0]?.stationFrom || "";
    let currentTripNo = 1;
    let currentTripId = `trip-1`;
    
    return journeyLegs.map((leg, index) => {
      if (leg.tripId) {
        return leg;
      }
      const newLeg = { ...leg, tripId: currentTripId };
      const isReturnToHQ = leg.stationTo && hqStation && leg.stationTo.trim().toUpperCase() === hqStation.trim().toUpperCase();
      if (isReturnToHQ) {
        currentTripNo++;
        currentTripId = `trip-${currentTripNo}-${Date.now()}`;
      }
      return newLeg;
    });
  }, [journeyLegs]);

  const tripsGrouped = useMemo(() => {
    const groups: { tripId: string; legs: JourneyLeg[] }[] = [];
    normalizedJourneyLegs.forEach(leg => {
      const tId = leg.tripId || "trip-1";
      let group = groups.find(g => g.tripId === tId);
      if (!group) {
        group = { tripId: tId, legs: [] };
        groups.push(group);
      }
      group.legs.push(leg);
    });
    return groups;
  }, [normalizedJourneyLegs]);

  const calculatedTrips = useMemo(() => {
    let accumulatedProcessedLegs: any[] = [];
    let accumulatedCalendarDaysBreakdown: any[] = [];
    let sumTotalAbsenceHrs = 0;
    let sumTotalContinuousDaAmount = 0;

    tripsGrouped.forEach((trip, tripIndex) => {
      const tripLegs = trip.legs;
      if (tripLegs.length === 0) return;

      const tripStay = tripStays.find(ts => ts.tripId === trip.tripId);
      const tripInitialStayHrs = tripStay ? getTripInitialStayHrs(tripStay) : 0;

      const tripRawLegs = tripLegs.map((leg, index) => {
        let travelHrs = getLegHours(leg);
        if (index === 0 && tripStay?.startWithStay && (!tripStay.stayType || tripStay.stayType === 'before')) {
          travelHrs += tripInitialStayHrs;
        }
        if (index === tripLegs.length - 1 && tripStay?.startWithStay && tripStay.stayType === 'after') {
          travelHrs += tripInitialStayHrs;
        }
        
        let haltHrs = 0;
        const nextLeg = tripLegs[index + 1];
        const hqStation = tripLegs[0]?.stationFrom || "";
        const isReturnToHQ = leg.stationTo && leg.stationTo.trim().toUpperCase() === hqStation.trim().toUpperCase();
        if (nextLeg && !isReturnToHQ && leg.arrDate && leg.arrTime && nextLeg.depDate && nextLeg.depTime) {
          const start = new Date(`${leg.arrDate}T${leg.arrTime}`);
          const end = new Date(`${nextLeg.depDate}T${nextLeg.depTime}`);
          const diffMs = end.getTime() - start.getTime();
          if (!isNaN(diffMs) && diffMs > 0) {
            haltHrs = diffMs / (1000 * 60 * 60);
          }
        }

        let legGapHrs = 0;
        if (tripStay?.startWithStay) {
          if (index === 0 && (tripStay.stayType === 'before' || !tripStay.stayType)) {
            if (tripStay.initialStayEndDate && tripStay.initialStayEndTime && leg.depDate && leg.depTime) {
              const stayEnd = new Date(`${tripStay.initialStayEndDate}T${tripStay.initialStayEndTime}`);
              const firstLegDep = new Date(`${leg.depDate}T${leg.depTime}`);
              const diffMs = firstLegDep.getTime() - stayEnd.getTime();
              if (!isNaN(diffMs) && diffMs > 0) {
                legGapHrs = diffMs / (1000 * 60 * 60);
              }
            }
          }
          if (index === tripLegs.length - 1 && tripStay.stayType === 'after') {
            if (leg.arrDate && leg.arrTime && tripStay.initialStayStartDate && tripStay.initialStayStartTime) {
              const lastLegArr = new Date(`${leg.arrDate}T${leg.arrTime}`);
              const stayStart = new Date(`${tripStay.initialStayStartDate}T${tripStay.initialStayStartTime}`);
              const diffMs = stayStart.getTime() - lastLegArr.getTime();
              if (!isNaN(diffMs) && diffMs > 0) {
                legGapHrs = diffMs / (1000 * 60 * 60);
              }
            }
          }
        }
        haltHrs += legGapHrs;

        const totalLegHrs = travelHrs + haltHrs;
        return {
          ...leg,
          purpose: leg.purpose || globalPurpose || "",
          travelHours: travelHrs,
          haltHours: haltHrs,
          hours: totalLegHrs,
          gapHours: legGapHrs
        };
      });

      const tripAbsenceHrs = tripRawLegs.reduce((sum, current) => sum + current.hours, 0);
      sumTotalAbsenceHrs += tripAbsenceHrs;

      const getContinuousDaPctLocal = (hours: number) => {
        if (hours <= 0) return 0;
        const isFreeTraining = tripLegs.some(l => l.isFreeMessingTraining);
        const isBreakdown = tripLegs.some(l => l.isBreakdownDuty);
        
        if (isFreeTraining) return 0.20;
        if (isBreakdown) return 1.00;

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

      const getTripCalendarDaysBreakdown = () => {
        const list: { tripId?: string; date: string; hours: number; pct: number; detail: string; amount: number }[] = [];
        const firstLeg = tripRawLegs[0];
        const lastLeg = tripRawLegs[tripRawLegs.length - 1];
        if (!firstLeg?.depDate || !firstLeg?.depTime || !lastLeg?.arrDate || !lastLeg?.arrTime) return list;
        
        try {
          let startDt = new Date(`${firstLeg.depDate}T${firstLeg.depTime}`);
          if (tripStay?.startWithStay && (!tripStay.stayType || tripStay.stayType === 'before') && tripStay.initialStayStation && tripStay.initialStayStartDate && tripStay.initialStayStartTime) {
            const stayStartDt = new Date(`${tripStay.initialStayStartDate}T${tripStay.initialStayStartTime}`);
            if (!isNaN(stayStartDt.getTime()) && stayStartDt < startDt) {
              startDt = stayStartDt;
            }
          }
          let endDt = new Date(`${lastLeg.arrDate}T${lastLeg.arrTime}`);
          if (tripStay?.startWithStay && tripStay.stayType === 'after' && tripStay.initialStayEndDate && tripStay.initialStayEndTime) {
            const stayEndDt = new Date(`${tripStay.initialStayEndDate}T${tripStay.initialStayEndTime}`);
            if (!isNaN(stayEndDt.getTime()) && stayEndDt > endDt) {
              endDt = stayEndDt;
            }
          }
          
          if (isNaN(startDt.getTime()) || isNaN(endDt.getTime()) || endDt < startDt) {
            return list;
          }
          
          const hqStation = tripRawLegs[0]?.stationFrom || "";
          const tourIntervals = tripRawLegs.map((leg, index) => {
            let legS = new Date(`${leg.depDate}T${leg.depTime}`);
            if (index === 0 && tripStay?.startWithStay && (!tripStay.stayType || tripStay.stayType === 'before') && tripStay.initialStayStation && tripStay.initialStayStartDate && tripStay.initialStayStartTime) {
              const stayStartDt = new Date(`${tripStay.initialStayStartDate}T${tripStay.initialStayStartTime}`);
              if (!isNaN(stayStartDt.getTime()) && stayStartDt < legS) {
                legS = stayStartDt;
              }
            }
            let legE: Date;
            const nextLeg = tripRawLegs[index + 1];
            if (leg.stationTo && leg.stationTo.trim().toUpperCase() === hqStation.trim().toUpperCase()) {
              legE = new Date(`${leg.arrDate}T${leg.arrTime}`);
            } else if (nextLeg?.depDate && nextLeg?.depTime) {
              legE = new Date(`${nextLeg.depDate}T${nextLeg.depTime}`);
            } else {
              legE = new Date(`${leg.arrDate}T${leg.arrTime}`);
            }
            if (index === tripRawLegs.length - 1 && tripStay?.startWithStay && tripStay.stayType === 'after' && tripStay.initialStayEndDate && tripStay.initialStayEndTime) {
              const stayEndDt = new Date(`${tripStay.initialStayEndDate}T${tripStay.initialStayEndTime}`);
              if (!isNaN(stayEndDt.getTime()) && stayEndDt > legE) {
                legE = stayEndDt;
              }
            }
            return { start: legS, end: legE };
          });

          let current = new Date(startDt.getFullYear(), startDt.getMonth(), startDt.getDate());
          const endDay = new Date(endDt.getFullYear(), endDt.getMonth(), endDt.getDate());
          
          const isFreeTraining = tripLegs.some(l => l.isFreeMessingTraining);
          const isBreakdown = tripLegs.some(l => l.isBreakdownDuty);
          const isTAEnabled = tripLegs.some(l => l.isTerritorialArmy);

          let safetyCounter = 0;
          while (current <= endDay && safetyCounter < 100) {
            safetyCounter++;
            const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
            
            const dayStartMs = new Date(`${dateStr}T00:00:00`).getTime();
            const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000;
            
            let hoursInDay = 0;
            tourIntervals.forEach(interval => {
              if (!isNaN(interval.start.getTime()) && !isNaN(interval.end.getTime())) {
                const overlapStartMs = Math.max(interval.start.getTime(), dayStartMs);
                const overlapEndMs = Math.min(interval.end.getTime(), dayEndMs);
                if (overlapEndMs > overlapStartMs) {
                  hoursInDay += (overlapEndMs - overlapStartMs) / (1000 * 60 * 60);
                }
              }
            });

            if (hoursInDay > 24) hoursInDay = 24;

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
              tripId: trip.tripId,
              date: dateStr,
              hours: hoursInDay,
              pct: pct,
              detail: detail,
              amount: dayDaAmount
            });
            
            current.setDate(current.getDate() + 1);
          }
        } catch (e) {
          console.error("Error computing calendar breakdown for trip:", e);
        }
        return list;
      };

      const tripCalendarDaysBreakdown = getTripCalendarDaysBreakdown();
      accumulatedCalendarDaysBreakdown = [...accumulatedCalendarDaysBreakdown, ...tripCalendarDaysBreakdown];

      const tripContinuousDaPct = (calculationMode === 'calendar_day' && tripCalendarDaysBreakdown.length > 0)
        ? tripCalendarDaysBreakdown.reduce((sum, current) => sum + current.pct, 0)
        : getContinuousDaPctLocal(tripAbsenceHrs);
      
      const isTripEntireTourEligible = tripLegs.some(leg => (leg.beyond8Km !== false) || leg.isBreakdownDuty);
      
      let tripBaseContinuousDaAmount = isTripEntireTourEligible ? (totalDailyRate * tripContinuousDaPct) : 0;
      const isTripTAEnabled = tripLegs.some(leg => leg.isTerritorialArmy);
      if (isTripTAEnabled) {
        tripBaseContinuousDaAmount = tripBaseContinuousDaAmount * 2.0;
      }
      const tripTotalContinuousDaAmount = Math.round(tripBaseContinuousDaAmount);
      sumTotalContinuousDaAmount += tripTotalContinuousDaAmount;

      const getLegCalendarBreakdownLocal = (leg: any, index: number) => {
        const list: { date: string; hours: number; dayTotalHours: number; dayPct: number; amount: number }[] = [];
        if (!leg.depDate || !leg.depTime || !leg.arrDate || !leg.arrTime) return list;
        
        try {
          let legStartDt = new Date(`${leg.depDate}T${leg.depTime}`);
          if (index === 0 && tripStay?.startWithStay && (!tripStay.stayType || tripStay.stayType === 'before') && tripStay.initialStayStation && tripStay.initialStayStartDate && tripStay.initialStayStartTime) {
            const stayStartDt = new Date(`${tripStay.initialStayStartDate}T${tripStay.initialStayStartTime}`);
            if (!isNaN(stayStartDt.getTime()) && stayStartDt < legStartDt) {
              legStartDt = stayStartDt;
            }
          }
          let legEndDt: Date;
          const nextLeg = tripRawLegs[index + 1];
          const hqStation = tripRawLegs[0]?.stationFrom || "";
          const isReturnToHQ = leg.stationTo && leg.stationTo.trim().toUpperCase() === hqStation.trim().toUpperCase();
          if (nextLeg && !isReturnToHQ && nextLeg.depDate && nextLeg.depTime) {
            legEndDt = new Date(`${nextLeg.depDate}T${nextLeg.depTime}`);
          } else {
            legEndDt = new Date(`${leg.arrDate}T${leg.arrTime}`);
          }
          if (index === tripRawLegs.length - 1 && tripStay?.startWithStay && tripStay.stayType === 'after' && tripStay.initialStayEndDate && tripStay.initialStayEndTime) {
            const stayEndDt = new Date(`${tripStay.initialStayEndDate}T${tripStay.initialStayEndTime}`);
            if (!isNaN(stayEndDt.getTime()) && stayEndDt > legEndDt) {
              legEndDt = stayEndDt;
            }
          }
          
          if (isNaN(legStartDt.getTime()) || isNaN(legEndDt.getTime()) || legEndDt < legStartDt) {
            return list;
          }
          
          tripCalendarDaysBreakdown.forEach(day => {
            const dayStartMs = new Date(`${day.date}T00:00:00`).getTime();
            const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000;
            
            const overlapStartMs = Math.max(legStartDt.getTime(), dayStartMs);
            const overlapEndMs = Math.min(legEndDt.getTime(), dayEndMs);
            
            if (overlapEndMs > overlapStartMs) {
              const legHoursInDay = (overlapEndMs - overlapStartMs) / (1000 * 60 * 60);
              if (legHoursInDay > 0 && day.hours > 0) {
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

      const tripProcessedLegs = tripRawLegs.map((leg, index) => {
        const legCalendarBreakdown = getLegCalendarBreakdownLocal(leg, index);

        const legDaAmount = calculationMode === 'calendar_day'
          ? legCalendarBreakdown.reduce((sum, item) => sum + item.amount, 0)
          : (tripAbsenceHrs > 0 ? Math.round(tripTotalContinuousDaAmount * (leg.hours / tripAbsenceHrs)) : 0);

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
            : (tripAbsenceHrs > 0 ? (tripContinuousDaPct * (leg.hours / tripAbsenceHrs)) : 0),
          calendarBreakdown: legCalendarBreakdown,
          tripContinuousDaPct: tripContinuousDaPct
        };
      });

      accumulatedProcessedLegs = [...accumulatedProcessedLegs, ...tripProcessedLegs];
    });

    const isEntireTourEligible = normalizedJourneyLegs.some(leg => (leg.beyond8Km !== false) || leg.isBreakdownDuty);
    const isTAEnabled = normalizedJourneyLegs.some(leg => leg.isTerritorialArmy);
    const rateMultiplier = isTAEnabled ? 2 : 1;
    const continuousDaPct = sumTotalContinuousDaAmount / (totalDailyRate * rateMultiplier);

    return {
      processedLegs: accumulatedProcessedLegs,
      calendarDaysBreakdown: accumulatedCalendarDaysBreakdown,
      totalAbsenceHrs: sumTotalAbsenceHrs,
      totalContinuousDaAmount: sumTotalContinuousDaAmount,
      continuousDaPct: isNaN(continuousDaPct) ? 0 : continuousDaPct,
      isEntireTourEligible,
      isTAEnabled
    };
  }, [tripsGrouped, payLevel, tripStays, globalPurpose, calculationMode, totalDailyRate, normalizedJourneyLegs]);

  const { processedLegs, calendarDaysBreakdown, totalAbsenceHrs, totalContinuousDaAmount, continuousDaPct, isEntireTourEligible, isTAEnabled } = calculatedTrips;

  const totalContingentAmount = storeConfig.enableContingentSection !== "false"
    ? contingentItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    : 0;

  const totalAmount = processedLegs.reduce((sum, current) => sum + current.amount, 0) + totalContingentAmount;

  const addLegToTrip = (tripId: string) => {
    const tripLegs = normalizedJourneyLegs.filter(leg => leg.tripId === tripId);
    const lastLeg = tripLegs[tripLegs.length - 1];
    const newLeg: JourneyLeg = {
      id: `leg-${Date.now()}`,
      tripId: tripId,
      stationFrom: lastLeg?.stationTo || "",
      stationTo: "",
      mode: "Train",
      trainNoOrVehNo: "",
      depDate: "",
      depTime: "",
      arrDate: "",
      arrTime: "",
      purpose: globalPurpose || lastLeg?.purpose || "",
      stoppedDurationHrs: 0,
      isBreakdownDuty: false,
      isFreeMessingTraining: false,
      isTerritorialArmy: false,
      roadDistanceKm: 0,
      roadType: 'car_taxi',
      beyond8Km: true
    };
    
    const lastLegInStateIndex = journeyLegs.findIndex(l => l.id === lastLeg.id);
    if (lastLegInStateIndex !== -1) {
      const updated = [...journeyLegs];
      updated.splice(lastLegInStateIndex + 1, 0, newLeg);
      setJourneyLegs(updated);
    } else {
      setJourneyLegs([...journeyLegs, newLeg]);
    }
  };

  const addLeg = () => {
    // Backwards compatibility
    const lastLeg = journeyLegs[journeyLegs.length - 1];
    const currentTripId = lastLeg?.tripId || "trip-1";
    addLegToTrip(currentTripId);
  };

  const addNewTrip = () => {
    const hqStation = journeyLegs[0]?.stationFrom || "";
    const lastLeg = journeyLegs[journeyLegs.length - 1];
    const newTripId = `trip-${Date.now()}`;
    const newLeg: JourneyLeg = {
      id: `leg-${Date.now()}`,
      tripId: newTripId,
      stationFrom: hqStation,
      stationTo: "",
      mode: "Train",
      trainNoOrVehNo: "",
      depDate: "",
      depTime: "",
      arrDate: "",
      arrTime: "",
      purpose: globalPurpose || "",
      stoppedDurationHrs: 0,
      isBreakdownDuty: false,
      isFreeMessingTraining: false,
      isTerritorialArmy: false,
      roadDistanceKm: 0,
      roadType: 'car_taxi',
      beyond8Km: true
    };
    setJourneyLegs([...journeyLegs, newLeg]);
    toast.success(`New Trip Added! Starting from HQ Station: ${hqStation || 'Home Station'}`);
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

  const triggerDistanceLookup = async (legId: string, fromStation: string, toStation: string) => {
    if (!fromStation || !toStation) return;
    const fStr = fromStation.trim().toUpperCase();
    const tStr = toStation.trim().toUpperCase();
    if (fStr === tStr) {
      updateLegField(legId, 'roadDistanceKm', 0);
      return;
    }

    try {
      const res = await fetch("/api/railway/distance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: fStr, to: tStr })
      });
      const data = await res.json();
      if (data.success && typeof data.distance === "number" && data.distance > 0) {
        updateLegField(legId, 'roadDistanceKm', data.distance);
        toast.success(`Distance verified via Indian Railways DB: ${data.distance} KM`, {
          duration: 4000,
          id: `dist-calc-${legId}`
        });
      } else {
        // Fallback to offline coordinate estimation if online fetch returns null
        const localDist = getStationDistance(fStr, tStr);
        if (localDist) {
          updateLegField(legId, 'roadDistanceKm', localDist);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch accurate distance online:", err);
      const localDist = getStationDistance(fStr, tStr);
      if (localDist) {
        updateLegField(legId, 'roadDistanceKm', localDist);
      }
    }
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
      triggerDistanceLookup(legId, currentFrom, currentTo);
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
      const docData: any = {
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
        showNoFreePassDeclaration,
        showClaimantSig,
        showCounterSig,
        showHeadOfficeSig,
        showControllingOfficerSig,
        startWithStay,
        initialStayStation,
        initialStayStartDate,
        initialStayStartTime,
        initialStayEndDate,
        initialStayEndTime,
        initialStayPurpose,
        tripStays,
        createdAt: new Date().toISOString()
      };

      if (editingClaimId) {
        await updateDoc(doc(db, "ta_claims", editingClaimId), {
          ...docData,
          updatedAt: new Date().toISOString()
        });
        toast.success("Travelling Allowance claim record updated in database successfully!");
      } else {
        await addDoc(collection(db, "ta_claims"), docData);
        toast.success("Travelling Allowance claim record saved to database successfully!");
      }
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

  const handleDeleteClaim = async () => {
    if (!editingClaimId) return;
    if (!window.confirm("Are you sure you want to permanently delete this claim from the database?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, "ta_claims", editingClaimId));
      toast.success("Travelling Allowance claim record deleted from database successfully!");
      resetForm();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to delete claim: " + err.message);
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
    setEditingClaimId(claim.id || null);
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
    
    // Map existing contingent items to have tripId: 'trip-1' if none exists
    const loadedContingent = (claim.contingentItems || []).map(item => ({
      ...item,
      tripId: item.tripId || "trip-1"
    }));
    setContingentItems(loadedContingent);
    
    setHasDeclared(claim.hasDeclared);
    setGlobalPurpose(claim.globalPurpose || "");
    setShowSummaryTable(claim.showSummaryTable !== undefined ? claim.showSummaryTable : false);
    setShowNoFreePassDeclaration(claim.showNoFreePassDeclaration !== undefined ? claim.showNoFreePassDeclaration : false);
    setShowClaimantSig(claim.showClaimantSig !== undefined ? claim.showClaimantSig : true);
    setShowCounterSig(claim.showCounterSig !== undefined ? claim.showCounterSig : false);
    setShowHeadOfficeSig(claim.showHeadOfficeSig !== undefined ? claim.showHeadOfficeSig : true);
    setShowControllingOfficerSig(claim.showControllingOfficerSig !== undefined ? claim.showControllingOfficerSig : true);
    setStartWithStay(claim.startWithStay || false);
    setInitialStayStation(claim.initialStayStation || "");
    setInitialStayStartDate(claim.initialStayStartDate || "");
    setInitialStayStartTime(claim.initialStayStartTime || "");
    setInitialStayEndDate(claim.initialStayEndDate || "");
    setInitialStayEndTime(claim.initialStayEndTime || "");
    setInitialStayPurpose(claim.initialStayPurpose || "");
    
    const initialStays: TripStay[] = claim.tripStays || [];
    // Seed from old legacy fields if no tripStays exists but legacy startWithStay is true
    if (initialStays.length === 0 && claim.startWithStay) {
      initialStays.push({
        tripId: "trip-1",
        startWithStay: true,
        initialStayStation: claim.initialStayStation || "",
        initialStayStartDate: claim.initialStayStartDate || "",
        initialStayStartTime: claim.initialStayStartTime || "",
        initialStayEndDate: claim.initialStayEndDate || "",
        initialStayEndTime: claim.initialStayEndTime || "",
        initialStayPurpose: claim.initialStayPurpose || ""
      });
    }
    setTripStays(initialStays);

    setIsEditingOrDrafting(true);
    onToggleSidebars?.(false);
    toast.success(`Loaded details for "${claim.employeeName}" into the active editor!`);
  };

  const resetForm = () => {
    setEditingClaimId(null);
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
    setGlobalPurpose("");
    setShowSummaryTable(false);
    setShowNoFreePassDeclaration(false);
    setShowClaimantSig(true);
    setShowCounterSig(false);
    setShowHeadOfficeSig(true);
    setShowControllingOfficerSig(true);
    setStartWithStay(false);
    setInitialStayStation("");
    setInitialStayStartDate("");
    setInitialStayStartTime("");
    setInitialStayEndDate("");
    setInitialStayEndTime("");
    setInitialStayPurpose("");
    setTripStays([]);
    setContingentItems([]);
    setJourneyLegs([
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
    setIsEditingOrDrafting(true);
    onToggleSidebars?.(false);
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

    // Format duration in hours and minutes helper
    const formatDurationLabel = (hours: number) => {
      const totalMinutes = Math.round(hours * 60);
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      if (h > 0 && m > 0) {
        return `${h} Hour${h > 1 ? 's' : ''} ${m} Minute${m > 1 ? 's' : ''}`;
      } else if (h > 0) {
        return `${h} Hour${h > 1 ? 's' : ''}`;
      } else {
        return `${m} Minute${m > 1 ? 's' : ''}`;
      }
    };

    // Format duration in a shorter form for compact display
    const formatDurationLabelShort = (hours: number) => {
      const totalMinutes = Math.round(hours * 60);
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      if (h > 0 && m > 0) {
        return `${h}h ${m}m`;
      } else if (h > 0) {
        return `${h}h`;
      } else {
        return `${m}m`;
      }
    };

    // Let's group processedLegs by tripId to process each trip separately
    const tripsWithProcessedLegs: { tripId: string; legs: any[] }[] = [];
    processedLegs.forEach(leg => {
      const tId = leg.tripId || "trip-1";
      let group = tripsWithProcessedLegs.find(g => g.tripId === tId);
      if (!group) {
        group = { tripId: tId, legs: [] };
        tripsWithProcessedLegs.push(group);
      }
      group.legs.push(leg);
    });

    const tableRows: any[] = [];

    tripsWithProcessedLegs.forEach((trip, tripIndex) => {
      const tripNo = tripIndex + 1;
      const tripLegsSorted = [...trip.legs].sort((a, b) => {
        const d1 = new Date(`${a.depDate}T${a.depTime}`).getTime();
        const d2 = new Date(`${b.depDate}T${b.depTime}`).getTime();
        return d1 - d2;
      });

      if (tripLegsSorted.length === 0) return;

      // Generate chronological journey and stay segments for THIS trip
      const tripPrintSegments: any[] = [];

      // Add initial stationary stay segment for this trip if enabled and is before the journey
      const tripStay = tripStays.find(ts => ts.tripId === trip.tripId);
      if (tripStay?.startWithStay && (!tripStay.stayType || tripStay.stayType === 'before') && tripStay.initialStayStation && tripStay.initialStayStartDate && tripStay.initialStayStartTime && tripStay.initialStayEndDate && tripStay.initialStayEndTime) {
        const start = new Date(`${tripStay.initialStayStartDate}T${tripStay.initialStayStartTime}`);
        const end = new Date(`${tripStay.initialStayEndDate}T${tripStay.initialStayEndTime}`);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          tripPrintSegments.push({
            id: `initial-stay-${trip.tripId}`,
            type: 'stay',
            start,
            end,
            station: tripStay.initialStayStation,
            purpose: tripStay.initialStayPurpose || globalPurpose || ''
          });
          
          if (tripLegsSorted.length > 0) {
            const firstLeg = tripLegsSorted[0];
            if (firstLeg.depDate && firstLeg.depTime) {
              const firstLegStart = new Date(`${firstLeg.depDate}T${firstLeg.depTime}`);
              if (!isNaN(firstLegStart.getTime()) && firstLegStart > end) {
                tripPrintSegments.push({
                  id: `seg-s-initial-${firstLeg.id}`,
                  type: 'stay',
                  start: end,
                  end: firstLegStart,
                  station: tripStay.initialStayStation,
                  purpose: firstLeg.purpose || ''
                });
              }
            }
          }
        }
      }

      tripLegsSorted.forEach((leg, idx) => {
        const start = new Date(`${leg.depDate}T${leg.depTime}`);
        const end = new Date(`${leg.arrDate}T${leg.arrTime}`);
        
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          tripPrintSegments.push({
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
        const nextLeg = tripLegsSorted[idx + 1];
        const homeStation = tripLegsSorted[0]?.stationFrom || "";
        const isReturnToHQ = leg.stationTo && leg.stationTo.trim().toUpperCase() === homeStation.trim().toUpperCase();
        if (nextLeg && !isReturnToHQ) {
          const nextStart = new Date(`${nextLeg.depDate}T${nextLeg.depTime}`);
          if (!isNaN(end.getTime()) && !isNaN(nextStart.getTime()) && nextStart > end) {
            tripPrintSegments.push({
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

      // Add final stationary stay segment for this trip if enabled and is after the journey
      if (tripStay?.startWithStay && tripStay.stayType === 'after' && tripStay.initialStayStation && tripStay.initialStayStartDate && tripStay.initialStayStartTime && tripStay.initialStayEndDate && tripStay.initialStayEndTime) {
        const start = new Date(`${tripStay.initialStayStartDate}T${tripStay.initialStayStartTime}`);
        const end = new Date(`${tripStay.initialStayEndDate}T${tripStay.initialStayEndTime}`);
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          if (tripLegsSorted.length > 0) {
            const lastLeg = tripLegsSorted[tripLegsSorted.length - 1];
            if (lastLeg.arrDate && lastLeg.arrTime) {
              const lastLegEnd = new Date(`${lastLeg.arrDate}T${lastLeg.arrTime}`);
              if (!isNaN(lastLegEnd.getTime()) && start > lastLegEnd) {
                tripPrintSegments.push({
                  id: `seg-s-final-gap-${lastLeg.id}`,
                  type: 'stay',
                  start: lastLegEnd,
                  end: start,
                  station: lastLeg.stationTo || 'Halt',
                  purpose: lastLeg.purpose || ''
                });
              }
            }
          }

          tripPrintSegments.push({
            id: `final-stay-${trip.tripId}`,
            type: 'stay',
            start,
            end,
            station: tripStay.initialStayStation,
            purpose: tripStay.initialStayPurpose || globalPurpose || ''
          });
        }
      }

      // Generate printing dates for this trip
      const tripPrintDates: string[] = [];
      if (tripPrintSegments.length > 0) {
        const firstStart = tripPrintSegments[0].start;
        const lastEnd = tripPrintSegments[tripPrintSegments.length - 1].end;
        
        let curr = new Date(firstStart.getFullYear(), firstStart.getMonth(), firstStart.getDate());
        const finalDay = new Date(lastEnd.getFullYear(), lastEnd.getMonth(), lastEnd.getDate());
        
        let safety = 0;
        while (curr <= finalDay && safety < 100) {
          safety++;
          const y = curr.getFullYear();
          const m = String(curr.getMonth() + 1).padStart(2, '0');
          const d = String(curr.getDate()).padStart(2, '0');
          tripPrintDates.push(`${y}-${m}-${d}`);
          curr.setDate(curr.getDate() + 1);
        }
      }

      // Assemble each day-wise row for THIS trip
      const tripDayRows = tripPrintDates.map(dateStr => {
        const [year, month, day] = dateStr.split('-');
        const formattedDate = `${day}-${month}-${year}`; // DD-MM-YYYY format
        
        const dayStartMs = new Date(`${dateStr}T00:00:00`).getTime();
        const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000;
        
        const overlappingSegs: any[] = [];
        let totalMileageAmountOnDay = 0;
        
        tripPrintSegments.forEach(seg => {
          const overlapStartMs = Math.max(seg.start.getTime(), dayStartMs);
          const overlapEndMs = Math.min(seg.end.getTime(), dayEndMs);
          
          if (overlapEndMs > overlapStartMs) {
            const hoursOnDay = (overlapEndMs - overlapStartMs) / (1000 * 60 * 60);
            
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
        
        const dbRecord = calendarDaysBreakdown.find(d => d.date === dateStr && d.tripId === trip.tripId);
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
          purpose: overlappingSegs.map(s => s.purpose).find(p => !!p) || globalPurpose || '',
          isBreakdownDuty: overlappingSegs.some(s => s.isBreakdownDuty),
          isFreeMessingTraining: overlappingSegs.some(s => s.isFreeMessingTraining),
          isTerritorialArmy: overlappingSegs.some(s => s.isTerritorialArmy),
          beyond8Km: overlappingSegs.some(s => s.beyond8Km !== false)
        };
      }).filter(row => row.daySegments.length > 0);

      // Group contiguous stay rows for this trip
      const tripGroupedTableRows: any[] = [];
      let currentStayGroup: any[] = [];

      const flushStayGroup = () => {
        if (currentStayGroup.length === 0) return;
        if (currentStayGroup.length === 1) {
          tripGroupedTableRows.push(currentStayGroup[0]);
        } else {
          const first = currentStayGroup[0];
          const last = currentStayGroup[currentStayGroup.length - 1];
          
          const totalDaAmt = currentStayGroup.reduce((sum, r) => sum + r.dayDaAmt, 0);
          const totalHrs = currentStayGroup.reduce((sum, r) => sum + r.dayHrs, 0);
          const totalClaimed = currentStayGroup.reduce((sum, r) => sum + r.dayTotalClaimed, 0);
          
          const formatDateWithDots = (fDate: string) => fDate.replace(/-/g, '.');
          const formattedDateRange = `${formatDateWithDots(first.formattedDate)} to ${formatDateWithDots(last.formattedDate)}`;
          
          const aggregatedSegments = [
            {
              ...first.daySegments[0],
              hoursOnDay: totalHrs,
              overlapStartMs: first.daySegments[0].overlapStartMs,
              overlapEndMs: last.daySegments[last.daySegments.length - 1].overlapEndMs,
              start: first.daySegments[0].start,
              end: last.daySegments[last.daySegments.length - 1].end
            }
          ];

          tripGroupedTableRows.push({
            dateStr: first.dateStr,
            formattedDate: formattedDateRange,
            daySegments: aggregatedSegments,
            dayDaAmt: totalDaAmt,
            dayPct: first.dayPct,
            dayHrs: totalHrs,
            totalMileageAmountOnDay: 0,
            dayTotalClaimed: totalClaimed,
            purpose: first.purpose,
            isBreakdownDuty: false,
            isFreeMessingTraining: first.isFreeMessingTraining,
            isTerritorialArmy: first.isTerritorialArmy,
            beyond8Km: first.beyond8Km,
            isGroupedStay: true,
            stayDaysCount: currentStayGroup.length,
            groupedDays: [...currentStayGroup]
          });
        }
        currentStayGroup = [];
      };

      tripDayRows.forEach(row => {
        const isStay = row.daySegments.length > 0 && row.daySegments.every((s: any) => s.type === 'stay');
        if (isStay) {
          if (currentStayGroup.length > 0) {
            const prev = currentStayGroup[currentStayGroup.length - 1];
            const prevStation = prev.daySegments[0]?.station || "";
            const currStation = row.daySegments[0]?.station || "";
            if (prevStation === currStation && prev.purpose === row.purpose) {
              currentStayGroup.push(row);
            } else {
              flushStayGroup();
              currentStayGroup.push(row);
            }
          } else {
            currentStayGroup.push(row);
          }
        } else {
          flushStayGroup();
          tripGroupedTableRows.push(row);
        }
      });
      flushStayGroup();

      // Push a Trip Header / separator row if there are actual rows
      if (tripGroupedTableRows.length > 0) {
        if (tripsWithProcessedLegs.length > 1) {
          tableRows.push({
            isTripHeader: true,
            tripNo: tripNo,
            tripId: trip.tripId,
            purpose: "Header",
            daySegments: []
          });
        }
        tableRows.push(...tripGroupedTableRows);
      }
    });

    const purposeRowSpans: { [key: number]: number } = {};
    let currentPurposeIndex = 0;
    while (currentPurposeIndex < tableRows.length) {
      if (tableRows[currentPurposeIndex].isTripHeader) {
        purposeRowSpans[currentPurposeIndex] = 1;
        currentPurposeIndex++;
        continue;
      }
      
      const currentPurpose = tableRows[currentPurposeIndex].purpose || "";
      let count = 1;
      let firstRowJourneySegs = tableRows[currentPurposeIndex].daySegments.filter((seg: any) => seg.type === 'journey');
      let totalRowSpan = Math.max(1, firstRowJourneySegs.length);
      
      let nextIndex = currentPurposeIndex + 1;
      while (
        nextIndex < tableRows.length && 
        !tableRows[nextIndex].isTripHeader && 
        (tableRows[nextIndex].purpose || "") === currentPurpose
      ) {
        let nextRowJourneySegs = tableRows[nextIndex].daySegments.filter((seg: any) => seg.type === 'journey');
        totalRowSpan += Math.max(1, nextRowJourneySegs.length);
        count++;
        nextIndex++;
      }
      
      purposeRowSpans[currentPurposeIndex] = totalRowSpan;
      for (let j = currentPurposeIndex + 1; j < nextIndex; j++) {
        purposeRowSpans[j] = 0;
      }
      currentPurposeIndex = nextIndex;
    }

    const fh = (sizeL: string, sizeP: string) => isLandscape ? sizeL : sizeP;

    return (
      <>
        {/* Dynamic Landscape/Portrait Orientation Injection & Sandbox-safe Print Overrides */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: A4 ${isLandscape ? 'landscape' : 'portrait'};
              margin: 0.75in !important;
            }
            body.printing-mode {
              background-color: white !important;
              color: black !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
            }
            body.printing-mode #print-container {
              padding: 0 !important;
              margin: 0 auto !important;
              width: 100% !important;
              max-width: 100% !important;
              height: auto !important;
              overflow: visible !important;
              display: block !important;
              box-sizing: border-box !important;
            }
            body.printing-mode #print-container > div {
              padding: 0 !important;
              margin: 0 auto !important;
              width: 100% !important;
              max-width: 100% !important;
              box-sizing: border-box !important;
              overflow: visible !important;
            }
            /* Fast fix: prevent any background clipping in table headers and keep height compact */
            th, td {
              page-break-inside: avoid !important;
              padding-top: 1px !important;
              padding-bottom: 1px !important;
            }
            /* Table width safety override */
            table {
              width: 100% !important;
              max-width: 100% !important;
              table-layout: fixed !important;
            }
          }
          .c75-scaled {
            font-size: ${((isLandscape ? 8.5 : 6.8) * (printSettings.tableFontSizeScale ?? 100) / 100).toFixed(2)}pt !important;
          }
          .c80-scaled {
            font-size: ${((isLandscape ? 9.5 : 7.2) * (printSettings.tableFontSizeScale ?? 100) / 100).toFixed(2)}pt !important;
          }
          .c60-scaled {
            font-size: ${((isLandscape ? 7.5 : 5.8) * (printSettings.tableFontSizeScale ?? 100) / 100).toFixed(2)}pt !important;
          }
          .c65-scaled {
            font-size: ${((isLandscape ? 8.0 : 6.2) * (printSettings.tableFontSizeScale ?? 100) / 100).toFixed(2)}pt !important;
          }
        `}} />
        <RenderPrintOverlayWatermark watermark={printSettings.watermark} />
        
        {/* Authentic 3-Column Railway Header Layout from PNG */}
        <div className={`grid grid-cols-[25%_50%_25%] items-end w-full border-b border-double border-black pt-[22px] pb-1 mb-2 font-serif leading-tight text-black ${fh('text-[10pt]', 'text-[8pt]')}`}>
          <div className="text-left font-bold whitespace-nowrap">
            <div className={`${fh('text-[11pt]', 'text-[9pt]')} text-slate-900 mb-0.5 leading-none`}>पूर्वोत्तर सीमांत रेलवे</div>
            <div className={`${fh('text-[11.5pt]', 'text-[9.5pt]')} uppercase tracking-tight font-extrabold leading-none`}>NORTHEAST FRONTIER RAILWAY</div>
            <div className={`${fh('text-[10pt]', 'text-[8.5pt]')} text-slate-850 italic font-semibold mt-1 leading-none`}>{division} Div.</div>
          </div>
          
          <div className="text-center font-bold self-center space-y-0.5 whitespace-nowrap translate-x-[75px]">
            <div className={`${fh('text-[12pt]', 'text-[10.5pt]')} text-slate-900 leading-none`}>यात्रा भत्ता जर्नल</div>
            <div className={`${fh('text-[13pt]', 'text-[11.5pt]')} font-extrabold uppercase tracking-wide leading-none`}>TRAVELLING ALLOWANCE JOURNAL</div>
            <div className={`${fh('text-[8.5pt]', 'text-[7.2pt]')} text-gray-600 block leading-tight font-medium italic`}>
              JOURNAL & CLAIM FOR TRAVELLING ALLOWANCE (TA) — Rule CPC-7
            </div>
          </div>
          
          <div className={`relative -translate-y-[24px] text-right font-bold leading-tight text-slate-800 space-y-0.5 whitespace-nowrap ${fh('text-[10pt]', 'text-[8.5pt]')}`}>
            <div className="font-semibold text-slate-900">जी. ए. 31 एस आर सी/जी 1677</div>
            <div className="font-semibold">G. A. 31 S.R.C. / G. 1677</div>
            <div className={`text-slate-700 font-mono font-bold tracking-tight ${fh('text-[8.5pt]', 'text-[7.2pt]')}`}>NFR-PERS-CLERICAL-TA-V3</div>
          </div>
        </div>

        {/* Compact 3-Column Employee Parameters Grid */}
        <div className={`grid grid-cols-3 gap-x-4 gap-y-1 mb-2 border border-black p-2 rounded bg-white text-left leading-tight text-slate-900 font-serif ${fh('text-[10pt]', 'text-[8.5pt]')}`}>
          <div className="whitespace-nowrap">
            <strong>Emp Name:</strong> <span className="font-sans font-extrabold ml-1">{employeeName}</span>
          </div>
          <div className="whitespace-nowrap">
            <strong>Desig. (पद):</strong> <span className="font-sans font-bold ml-1">{designation}</span>
          </div>
          <div className="whitespace-nowrap">
            <strong>Employee/PF No:</strong> <span className="font-mono font-bold ml-1">{empNo}</span>
          </div>
          
          <div className="whitespace-nowrap">
            <strong>Pay Level:</strong> <span className="font-mono font-bold ml-1">{payLevel}</span>
          </div>
          <div className="whitespace-nowrap">
            <strong>Daily TA Rate (100%):</strong> <span className="font-mono font-bold ml-1">₹ {totalDailyRate}</span>
          </div>
          <div className="whitespace-nowrap">
            <strong>Bill Unit (बी.यू.):</strong> <span className="font-mono font-bold ml-1">{billUnit}</span>
          </div>
          
          <div className="col-span-2 whitespace-nowrap">
            <strong>Department:</strong> <span className="font-sans font-bold ml-1">{department}</span>
          </div>
          <div className="whitespace-nowrap">
            <strong>Claim Month/Year:</strong> <span className="font-bold text-slate-950 font-mono ml-1">{claimMonth} {claimYear}</span>
          </div>
        </div>

        <table className="w-full text-left border-collapse border border-black mb-2 font-serif table-fixed">
          <colgroup>
            <col style={{ width: isLandscape ? '8%' : '8.5%' }} />
            <col style={{ width: isLandscape ? '6.5%' : '7%' }} />
            <col style={{ width: isLandscape ? '9%' : '9.5%' }} />
            <col style={{ width: isLandscape ? '9%' : '9.5%' }} />
            <col style={{ width: isLandscape ? '7%' : '7.5%' }} />
            <col style={{ width: isLandscape ? '7%' : '7.5%' }} />
            <col style={{ width: isLandscape ? '8.5%' : '9%' }} />
            <col style={{ width: isLandscape ? '9%' : '9.5%' }} />
            <col style={{ width: isLandscape ? '22%' : '18%' }} />
            <col style={{ width: isLandscape ? '7%' : '7%' }} />
            <col style={{ width: isLandscape ? '7%' : '7%' }} />
          </colgroup>
          <thead>
            {/* Row 1 Headers (Matching PNG format) */}
            <tr className="bg-gray-150 text-center font-bold">
              <th className={`border border-black p-0.5 py-1 leading-tight ${fh('text-[9pt]', 'text-[7.5pt]')}`} rowSpan={2}>
                Month & Date / <span className={`block ${fh('text-[8pt]', 'text-[6.5pt]')}`}>तारीख व तिथि</span>
              </th>
              <th className={`border border-black p-0.5 py-1 leading-tight ${fh('text-[9pt]', 'text-[7.5pt]')}`} rowSpan={2}>
                Train No. / <span className={`block ${fh('text-[8pt]', 'text-[6.5pt]')}`}>गाड़ी सं.</span>
              </th>
              <th className={`border border-black p-0.5 py-1 leading-tight ${fh('text-[9pt]', 'text-[7.5pt]')}`} rowSpan={2}>
                Departure / <span className={`block ${fh('text-[8pt]', 'text-[6.5pt]')}`}>प्रस्थान</span>
              </th>
              <th className={`border border-black p-0.5 py-1 leading-tight ${fh('text-[9pt]', 'text-[7.5pt]')}`} rowSpan={2}>
                Arrival / <span className={`block ${fh('text-[8pt]', 'text-[6.5pt]')}`}>आगमन</span>
              </th>
              <th className={`border border-black p-0.5 py-1 leading-tight ${fh('text-[9pt]', 'text-[7.5pt]')}`} colSpan={2}>
                Station / <span className={`block ${fh('text-[8pt]', 'text-[6.5pt]')}`}>स्टेशन</span>
              </th>
              <th className={`border border-black p-0.5 py-1 leading-tight ${fh('text-[9pt]', 'text-[7.5pt]')}`} rowSpan={2}>
                Kms / <span className={`block ${fh('text-[8pt]', 'text-[6.5pt]')}`}>कि.मी.</span>
              </th>
              <th className={`border border-black p-0.5 py-1 leading-tight ${fh('text-[9pt]', 'text-[7.5pt]')}`} rowSpan={2}>
                Journey/
                <span className="block">Stay/</span>
                <span className="block">Hrs /</span>
                <span className={`block mt-0.5 ${fh('text-[8pt]', 'text-[6.5pt]')}`}>अवधि</span>
              </th>
              <th className={`border border-black p-0.5 py-1 leading-tight ${fh('text-[9pt]', 'text-[7.5pt]')}`} rowSpan={2}>
                Purpose / <span className={`block ${fh('text-[8pt]', 'text-[6.5pt]')}`}>उद्देश्य</span>
              </th>
              <th className={`border border-black p-0.5 py-1 leading-tight ${fh('text-[9pt]', 'text-[7.5pt]')}`} rowSpan={2}>
                Rate / <span className={`block ${fh('text-[8pt]', 'text-[6.5pt]')}`}>दर</span>
              </th>
              <th className={`border border-black p-0.5 py-1 text-center font-extrabold leading-tight ${fh('text-[9pt]', 'text-[7.5pt]')}`} rowSpan={2}>
                Amount / <span className={`block ${fh('text-[8pt]', 'text-[6.5pt]')}`}>राशि (₹)</span>
              </th>
            </tr>
            {/* Row 2: Subheaders for Station (From / To) */}
            <tr className={`bg-gray-150 text-center font-bold leading-tight ${fh('text-[9pt]', 'text-[7.5pt]')}`}>
              <th className="border border-black p-0.5">
                From / <span className={`block ${fh('text-[8pt]', 'text-[6.5pt]')}`}>से</span>
              </th>
              <th className="border border-black p-0.5">
                To / <span className={`block ${fh('text-[8pt]', 'text-[6.5pt]')}`}>तक</span>
              </th>
            </tr>
            {/* Row 3: Column Numbers 1 to 11 */}
            <tr className={`bg-gray-100 text-center font-mono text-gray-650 ${fh('text-[8pt]', 'text-[6.5pt]')}`}>
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
              if (row.isTripHeader) {
                return (
                  <React.Fragment key={`trip-hdr-${row.tripId}-${row.tripNo}`}>
                    {i > 0 && (
                      <tr className="select-none" style={{ height: '14px', border: 'none' }}>
                        <td colSpan={11} className="p-0 bg-transparent" style={{ height: '14px', border: 'none' }}></td>
                      </tr>
                    )}
                    <tr className="bg-indigo-50/20 text-indigo-950 font-sans font-bold text-left border border-black">
                      <td colSpan={11} className="border border-black px-2 py-1 tracking-wide text-[8.5pt]">
                        <div className="flex items-center gap-1.5 justify-start">
                          <span className="font-extrabold text-indigo-950 uppercase tracking-wider">🌟 TRIP #{row.tripNo}</span>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              }

              const cleanTrainNo = (val: string) => {
                if (!val) return "";
                const match = val.match(/\b\d{5}\b/);
                if (match) {
                  return match[0];
                }
                let clean = val;
                if (clean.includes('/')) {
                  clean = clean.split('/')[0];
                }
                if (clean.includes('-')) {
                  clean = clean.split('-')[0];
                }
                if (clean.includes('(')) {
                  clean = clean.split('(')[0];
                }
                return clean.trim();
              };

              const getDayEffectivePct = (r: any) => {
                if (r.beyond8Km === false) return 0;
                if (r.isFreeMessingTraining) return 20;
                if (r.isBreakdownDuty) return 100;
                
                const rawPctVal = r.dayPct * 100;
                if (rawPctVal <= 0) return 0;
                if (rawPctVal <= 30) return 30;
                if (rawPctVal <= 70) return 70;
                return 100;
              };

              const getRowTotalPct = (r: any) => {
                if (r.isGroupedStay && r.groupedDays) {
                  return r.groupedDays.reduce((sum: number, d: any) => sum + getDayEffectivePct(d), 0);
                }
                return getDayEffectivePct(r);
              };

              const rowTotalPct = getRowTotalPct(row);
              let pctDisplay = `${rowTotalPct}%`;

              const dayStartMs = new Date(`${row.dateStr}T00:00:00`).getTime();
              const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000;

              // Filter only journey segments for traveling details
              const journeySegs = row.daySegments.filter((seg: any) => seg.type === 'journey');
              const subRowCount = Math.max(1, journeySegs.length);

              // Dynamic text scaling helpers for cells - optimized for space saving
              const c75 = fh('text-[8.5pt] c75-scaled', 'text-[6.8pt] c75-scaled');
              const c80 = fh('text-[9.5pt] c80-scaled', 'text-[7.2pt] c80-scaled');
              const c60 = fh('text-[7.5pt] c60-scaled', 'text-[5.8pt] c60-scaled');
              const c65 = fh('text-[8.0pt] c65-scaled', 'text-[6.2pt] c65-scaled');

              if (journeySegs.length === 0) {
                const staySeg = row.daySegments.find((s: any) => s.type === 'stay');
                const stayStation = staySeg?.station || "HQ";
                const resolvedStay = findStation(stayStation);
                const stayStationName = resolvedStay ? `${resolvedStay.name} (${resolvedStay.code})` : stayStation;
                
                // Helper to format stay details with date & time
                const formatStayPeriod = (start: any, end: any) => {
                  if (!start || !end) return "";
                  const sD = new Date(start);
                  const eD = new Date(end);
                  if (isNaN(sD.getTime()) || isNaN(eD.getTime())) return "";
                  
                  const sDay = String(sD.getDate()).padStart(2, '0');
                  const sMon = String(sD.getMonth() + 1).padStart(2, '0');
                  const sYear = sD.getFullYear();
                  const sHour = String(sD.getHours()).padStart(2, '0');
                  const sMin = String(sD.getMinutes()).padStart(2, '0');
                  
                  const eDay = String(eD.getDate()).padStart(2, '0');
                  const eMon = String(eD.getMonth() + 1).padStart(2, '0');
                  const eYear = eD.getFullYear();
                  const eHour = String(eD.getHours()).padStart(2, '0');
                  const eMin = String(eD.getMinutes()).padStart(2, '0');
                  
                  return `(From: ${sDay}-${sMon}-${sYear} ${sHour}:${sMin} to ${eDay}-${eMon}-${eYear} ${eHour}:${eMin})`;
                };
                
                const stayPeriodStr = staySeg ? formatStayPeriod(staySeg.start, staySeg.end) : "";

                return (
                  <React.Fragment key={row.dateStr}>
                    <tr 
                      className={`leading-tight text-center align-middle hover:bg-slate-50/10 text-gray-900 border border-black ${c80}`}
                    >
                      {/* 1. Month & Date */}
                      <td 
                        className={`border border-black p-0 py-0.5 font-mono text-center font-bold bg-slate-50/5 whitespace-nowrap align-middle ${c75}`}
                      >
                        {row.formattedDate.includes(" to ") ? (
                           <div className="flex flex-col items-center justify-center leading-tight py-0.5">
                             <span className="text-slate-950 block font-bold">{row.formattedDate.split(" to ")[0]}</span>
                             <span className={`text-gray-550 font-bold block my-0.5 leading-none ${c60}`}>to</span>
                             <span className="text-slate-950 block font-bold">{row.formattedDate.split(" to ")[1]}</span>
                           </div>
                        ) : (
                          row.formattedDate
                        )}
                      </td>

                      {/* 2 to 7. Merged Stay Details */}
                      <td 
                        colSpan={6} 
                        className={`border border-black p-0 py-1 text-center font-sans font-bold bg-slate-50/5 text-slate-800 ${c75}`}
                      >
                        🏨 Stay at {stayStationName} {stayPeriodStr && <span className="text-slate-600 font-mono text-[90%] ml-1.5 font-normal">{stayPeriodStr}</span>}
                      </td>

                      {/* 8. Journey/Stay/Hrs */}
                      <td 
                        className="border border-black p-0 py-0 text-center align-middle font-medium bg-slate-50/5 leading-none"
                      >
                        <div className="flex flex-col gap-0 w-full items-center justify-center leading-tight">
                          <span className="text-black font-semibold font-mono">
                            {row.isGroupedStay ? `${row.stayDaysCount} days` : (() => {
                              const totMin = Math.round(row.dayHrs * 60);
                              const h = Math.floor(totMin / 60);
                              const m = totMin % 60;
                              return `${h} h:${String(m).padStart(2, '0')}m`;
                            })()}
                          </span>
                        </div>
                      </td>

                      {/* 9. Object of journey */}
                      {purposeRowSpans[i] > 0 && (
                        <td 
                          rowSpan={purposeRowSpans[i]} 
                          className={`border border-black p-0 py-0.5 text-center font-sans align-middle break-words ${c75}`}
                        >
                          {row.purpose}
                        </td>
                      )}

                      {/* 10. Rate */}
                      <td 
                        className="border border-black p-0 py-0.5 text-center align-middle font-serif bg-slate-50/5"
                      >
                        <div className={`font-extrabold text-indigo-950 leading-tight ${c75}`}>{pctDisplay}</div>
                      </td>

                      {/* 11. Claimed Amt */}
                      <td 
                        className="border border-black p-0 py-0.5 text-center font-bold font-mono bg-slate-50/15 align-middle"
                      >
                        <div className="leading-tight text-center w-full">
                          <div className={`text-slate-950 font-black ${c80}`}>₹{row.dayTotalClaimed}</div>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              }

              return (
                <React.Fragment key={row.dateStr}>
                  {Array.from({ length: subRowCount }).map((_, idx) => {
                    const isFirst = idx === 0;
                    const seg = journeySegs[idx];

                    return (
                      <tr 
                        key={`${row.dateStr}-${idx}`} 
                        className={`leading-tight text-center align-middle hover:bg-slate-50/10 text-gray-900 border border-black ${c80}`}
                      >
                        {/* 1. Month & Date */}
                        {isFirst && (
                          <td 
                            rowSpan={subRowCount} 
                            className={`border border-black p-0 py-0.5 font-mono text-center font-bold bg-slate-50/5 whitespace-nowrap align-middle ${c75}`}
                          >
                            {row.formattedDate}
                          </td>
                        )}
                        
                        {/* 2. Train/Vehicle No */}
                        <td className={`border border-black p-0 py-0.5 text-center align-middle font-sans font-bold break-words ${c75}`}>
                          {!seg ? (
                            <span className="text-gray-400 font-normal">-</span>
                          ) : (
                            <div className="leading-tight text-center px-1">
                              <span className="text-gray-950 block font-extrabold">{cleanTrainNo(seg.trainNo)}</span>
                              {seg.leg?.trainName && seg.leg.trainName !== seg.trainNo && (
                                <span className="text-slate-650 block text-[8.5pt] md:text-[6.2pt] font-semibold leading-tight mt-0.5 max-w-[125px] mx-auto break-words">
                                  {seg.leg.trainName.replace(/\(\d+\)/g, "").trim()}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        
                        {/* 3. Time left (Departure) */}
                        <td className={`border border-black p-0 py-0.5 font-mono text-center align-middle font-bold ${c75}`}>
                          {!seg ? (
                            <span className="text-gray-400 font-normal">NA</span>
                          ) : (
                            (() => {
                              const deportsToday = seg.leg.depDate === row.dateStr;
                              return (
                                <span className={deportsToday ? "text-slate-950 font-black" : "text-gray-400 font-normal"}>
                                  {deportsToday ? seg.leg.depTime : "NA"}
                                </span>
                              );
                            })()
                          )}
                        </td>
                        
                        {/* 4. Time arrived */}
                        <td className={`border border-black p-0 py-0.5 font-mono text-center align-middle font-bold ${c75}`}>
                          {!seg ? (
                            <span className="text-gray-400 font-normal">NA</span>
                          ) : (
                            (() => {
                              const arrivesToday = seg.leg.arrDate === row.dateStr;
                              return (
                                <span className={arrivesToday ? "text-slate-950 font-black" : "text-gray-400 font-normal"}>
                                  {arrivesToday ? seg.leg.arrTime : "NA"}
                                </span>
                              );
                            })()
                          )}
                        </td>
                        
                        {/* 5. From Station */}
                        <td className={`border border-black p-0 py-0.5 text-center align-middle font-sans break-words ${c75}`}>
                          {!seg ? (
                            <span className="text-gray-400 font-normal">NA</span>
                          ) : (
                            (() => {
                              const deportsToday = seg.leg.depDate === row.dateStr;
                              const resolvedFrom = findStation(seg.from);
                              return deportsToday ? (
                                <div className="leading-tight text-center px-1">
                                  <span className="font-extrabold text-slate-950">
                                    {resolvedFrom ? resolvedFrom.name : seg.from}
                                  </span>
                                  {resolvedFrom && resolvedFrom.code !== resolvedFrom.name && (
                                    <span className="text-slate-500 font-mono text-[9px] font-bold block leading-none mt-0.5">
                                      ({resolvedFrom.code})
                                    </span>
                                  )}
                                  {seg.from !== "NA" && seg.beyond8Km === false && (
                                    <span className={`text-rose-800 font-bold block leading-none mt-0.5 ${c60}`}>
                                      (HQ 8km)
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className={`text-gray-400 font-normal ${c75}`}>NA</span>
                              );
                            })()
                          )}
                        </td>
                        
                        {/* 6. To Station */}
                        <td className={`border border-black p-0 py-0.5 text-center align-middle font-sans break-words ${c75}`}>
                          {!seg ? (
                            <span className="text-gray-400 font-normal">NA</span>
                          ) : (
                            (() => {
                              const arrivesToday = seg.leg.arrDate === row.dateStr;
                              const resolvedTo = findStation(seg.to);
                              return arrivesToday ? (
                                <div className="leading-tight text-center px-1">
                                  <span className="font-extrabold text-slate-950">
                                    {resolvedTo ? resolvedTo.name : seg.to}
                                  </span>
                                  {resolvedTo && resolvedTo.code !== resolvedTo.name && (
                                    <span className="text-slate-500 font-mono text-[9px] font-bold block leading-none mt-0.5">
                                      ({resolvedTo.code})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className={`text-gray-400 font-normal ${c75}`}>NA</span>
                              );
                            })()
                          )}
                        </td>
                        
                        {/* 7. Kms */}
                        {isFirst && (
                          <td 
                            rowSpan={subRowCount} 
                            className={`border border-black p-0 py-0.5 font-mono text-center align-middle ${c75}`}
                          >
                            {journeySegs.some((s: any) => s.roadDistanceKm && s.roadDistanceKm > 0) ? (
                              (() => {
                                const withKms = journeySegs.filter((s: any) => s.roadDistanceKm && s.roadDistanceKm > 0);
                                const totalKms = withKms.reduce((sum: number, s: any) => sum + (s.roadDistanceKm || 0), 0);
                                const firstRoadSeg = withKms[0];
                                return (
                                  <div className="leading-tight text-center">
                                    <span className={`font-black block text-slate-950 ${c80}`}>{totalKms} KM Aprx.</span>
                                    {firstRoadSeg.mode === 'Road' ? (
                                      <span className={`block font-sans text-amber-850 font-bold leading-none mt-0.5 text-amber-800 ${c60}`}>
                                        @ ₹{firstRoadSeg.roadType === 'auto_scooter' ? '12' : '24'}/KM
                                      </span>
                                    ) : firstRoadSeg.mode === 'Train' ? (
                                      null
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
                        )}
                        
                        {/* 8. Journey/Stay/Hrs */}
                        {isFirst && (
                          <td 
                            rowSpan={subRowCount} 
                            className="border border-black p-0 py-0.5 text-center align-middle font-medium bg-slate-50/5 leading-none"
                          >
                            <div className="flex flex-col gap-0 w-full items-center justify-center leading-tight">
                              <span className="text-black font-semibold font-mono font-bold">
                                {row.isGroupedStay ? `${row.stayDaysCount} days` : (() => {
                                  const totMin = Math.round(row.dayHrs * 60);
                                  const h = Math.floor(totMin / 60);
                                  const m = totMin % 60;
                                  return `${h} h:${String(m).padStart(2, '0')}m`;
                                })()}
                              </span>
                            </div>
                          </td>
                        )}
                        
                        {/* 9. Object of journey */}
                        {isFirst && purposeRowSpans[i] > 0 && (
                          <td 
                            rowSpan={purposeRowSpans[i]} 
                            className={`border border-black p-0 py-0.5 text-center font-sans align-middle break-words ${c75}`}
                          >
                            {row.purpose}
                          </td>
                        )}
                        
                        {/* 10. Rate */}
                        {isFirst && (
                          <td 
                            rowSpan={subRowCount} 
                            className="border border-black p-0 py-0.5 text-center align-middle font-serif bg-slate-50/5"
                          >
                            <div className={`font-extrabold text-indigo-950 leading-tight ${c75}`}>{pctDisplay}</div>
                          </td>
                        )}
                        
                        {/* 11. Claimed Amt */}
                        {isFirst && (
                          <td 
                            rowSpan={subRowCount} 
                            className="border border-black p-0 py-0.5 text-center font-bold font-mono bg-slate-50/15 align-middle"
                          >
                            <div className="leading-tight text-center w-full">
                              <div className={`text-slate-950 font-black ${c80}`}>₹{row.dayTotalClaimed}</div>
                              {row.totalMileageAmountOnDay > 0 && (
                                <div className={`text-amber-800 font-sans font-bold leading-none mt-1 ${c60}`} title="Road Mileage Portion">
                                  (₹{row.totalMileageAmountOnDay} Mil)
                                </div>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
            
            {/* The single summary row for total claimed amt */}
            <tr className={`bg-gray-150 font-bold ${fh('text-[10pt]', 'text-[8.5pt]')}`}>
              <td colSpan={10} className={`border border-black py-0.5 px-2 text-right uppercase ${fh('text-[9.5pt]', 'text-[8.2pt]')}`}>
                TOTAL CLAIMED TA AMOUNT:
              </td>
              <td className={`border border-black py-0.5 px-2 text-right text-indigo-800 font-extrabold font-mono ${fh('text-[11pt]', 'text-[9.5pt]')}`}>
                ₹{totalAmount}
              </td>
            </tr>
          </tbody>
        </table>

        {showSummaryTable && (
          <div className="mt-5 mb-5 font-serif">
            <table className={`w-full border-collapse border border-black text-left ${fh('text-[9pt]', 'text-[8.2pt]')}`}>
              <thead>
                <tr className="bg-gray-100 text-center">
                  <th colSpan={3} className={`border border-black py-1 px-1.5 font-bold tracking-wider uppercase ${fh('text-[10pt]', 'text-[9pt]')}`}>
                    SUMMARY
                  </th>
                </tr>
                <tr className={`bg-gray-50 text-center font-bold ${fh('text-[9pt]', 'text-[8pt]')}`}>
                  <th className="border border-black py-1 px-1 w-[25%] font-serif">Percentage</th>
                  <th className="border border-black py-1 px-1 w-[30%] font-serif">No. of total days</th>
                  <th className="border border-black py-1 px-1.5 w-[45%] font-serif text-left pl-4">Rate of TA X Days = Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-center">
                  <td className="border border-black py-1 px-1 font-bold bg-gray-50/20 font-serif">30%</td>
                  <td className="border border-black py-1 px-1 font-mono">{count30 > 0 ? count30 : "—"}</td>
                  <td className="border border-black py-1 px-1.5 text-left font-mono pl-4">
                    {count30 > 0 ? (
                      <span>Rs. {Math.round(totalDailyRate * 0.30)} × {count30} = Rs. {amt30}</span>
                    ) : (
                      <span className="text-gray-400 font-serif">Rs. {Math.round(totalDailyRate * 0.30)} × 0 = Rs. 0</span>
                    )}
                  </td>
                </tr>
                <tr className="text-center">
                  <td className="border border-black py-1 px-1 font-bold bg-gray-50/20 font-serif">70%</td>
                  <td className="border border-black py-1 px-1 font-mono">{count70 > 0 ? count70 : "—"}</td>
                  <td className="border border-black py-1 px-1.5 text-left font-mono pl-4">
                    {count70 > 0 ? (
                      <span>Rs. {Math.round(totalDailyRate * 0.70)} × {count70} = Rs. {amt70}</span>
                    ) : (
                      <span className="text-gray-400 font-serif">Rs. {Math.round(totalDailyRate * 0.70)} × 0 = Rs. 0</span>
                    )}
                  </td>
                </tr>
                <tr className="text-center">
                  <td className="border border-black py-1 px-1 font-bold bg-gray-50/20 font-serif">100%</td>
                  <td className="border border-black py-1 px-1 font-mono">{count100 > 0 ? count100.toFixed(1) : "—"}</td>
                  <td className="border border-black py-1 px-1.5 text-left font-mono pl-4">
                    {count100 > 0 ? (
                      <span>Rs. {Math.round(totalDailyRate * 1.00)} × {count100.toFixed(1)} = Rs. {amt100}</span>
                    ) : (
                      <span className="text-gray-400 font-serif">Rs. {Math.round(totalDailyRate * 1.00)} × 0 = Rs. 0</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td colSpan={2} className={`border border-black py-1 px-2 font-bold text-right uppercase bg-gray-50/35 font-serif ${fh('text-[9pt]', 'text-[8pt]')}`}>
                    Total Contingent Amount
                  </td>
                  <td className={`border border-black py-1 px-1.5 text-left font-mono pl-4 font-bold text-emerald-800 ${fh('text-[9.5pt]', 'text-[8.5pt]')}`}>
                    Rs. {(totalMileage || 0) + totalContingentAmount}
                  </td>
                </tr>
                <tr className={`bg-gray-100 font-bold ${fh('text-[10pt]', 'text-[8.5pt]')}`}>
                  <td colSpan={2} className="border border-black py-1 px-2 text-right uppercase tracking-wider font-serif">
                    Total Amount (Rs.)
                  </td>
                  <td className={`border border-black py-1 px-1.5 text-left font-mono pl-4 text-indigo-900 font-extrabold ${fh('text-[10.5pt]', 'text-[9.5pt]')}`}>
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
            <table className={`w-full border-collapse border border-black text-left ${fh('text-[9pt]', 'text-[8.2pt]')}`}>
              <thead>
                <tr className="bg-gray-105 bg-gray-100 text-center">
                  <th colSpan={3} className={`border border-black py-1 px-1.5 font-bold tracking-wider uppercase font-serif ${fh('text-[10pt]', 'text-[9pt]')}`}>
                    CONTINGENT EXPENSES DETAILED BREAKDOWN
                  </th>
                </tr>
                <tr className={`bg-gray-50 text-center font-bold ${fh('text-[9pt]', 'text-[8pt]')}`}>
                  <th className="border border-black py-1 px-1 w-[10%] text-center font-serif">S.No.</th>
                  <th className="border border-black py-1 px-1.5 w-[70%] font-serif pl-3 text-left">Particulars & Remarks</th>
                  <th className="border border-black py-1 px-1 w-[20%] text-right pr-4 font-serif">Amount (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                {contingentItems.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="border border-black py-1 px-1 text-center font-mono">{idx + 1}</td>
                    <td className={`border border-black py-1 px-1.5 pl-3 font-sans font-semibold text-gray-800 ${fh('text-[9pt]', 'text-[8pt]')}`}>{item.remarks}</td>
                    <td className="border border-black py-1 px-1 text-right pr-4 font-mono font-bold">Rs. {item.amount || 0}</td>
                  </tr>
                ))}
                <tr className={`bg-gray-50/50 font-extrabold ${fh('text-[9pt]', 'text-[8.2pt]')}`}>
                  <td colSpan={2} className="border border-black py-1 px-2 text-right uppercase tracking-wider font-serif">
                    Total Contingent Amount Added:
                  </td>
                  <td className={`border border-black py-1 px-2 text-right pr-4 font-mono text-emerald-800 ${fh('text-[10pt]', 'text-[8.5pt]')}`}>
                    Rs. {totalContingentAmount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Declarations (Matching PNG exactly) */}
        <div className={`text-justify space-y-1 font-serif mt-2 ${fh('text-[8.5pt]', 'text-[7.2pt]')}`}>
          <ol className={`list-decimal pl-5 space-y-1 block leading-tight ${fh('text-[8.5pt]', 'text-[7.2pt]')}`}>
            <li>The TA claimed by me has not been claimed before and will not be claimed hereafter / <span>मेरे द्वारा दावा किया गया यात्रा भत्ता पहले दावा नहीं किया गया है और इसके बाद भी दावा नहीं किया जाएगा।</span></li>
            {showNoFreePassDeclaration && (
              <li>No free railway pass or other free mode of transit was checked for this duration / <span>इस अवधि के दौरान कोई मुफ्त रेलवे पास या अन्य मुफ्त पारगमन साधन का उपयोग नहीं किया गया था।</span></li>
            )}
            <li>Cheapest mode of conveyance was utilized / <span>सबसे सस्ते परिवहन साधन का उपयोग किया गया था।</span></li>
            <li>The journey performed by road for which conveyance has been claimed was over 1.6 km / <span>सड़क मार्ग से की गई यात्रा जिसके लिए वाहन भत्ता मांगा गया है, वह 1.6 किमी से अधिक थी।</span></li>
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
              <div className="mb-1 w-44 mx-auto h-6"></div>
              <p className={`font-semibold text-gray-800 text-center font-serif leading-tight ${fh('text-[9pt]', 'text-[7.5pt]')}`}>
                Signature of Claiming TA
                <span className="block mt-0.5">दावाकर्ता के हस्ताक्षर</span>
              </p>
            </div>
          </div>
        )}

        {/* Headquarter absence certification section (Spans full page width, matching PNG) */}
        <div className={`border-t border-b border-black py-1 mt-1 text-justify font-serif leading-tight ${fh('text-[8.5pt]', 'text-[7.2pt]')}`}>
          <p>
            I hereby certify that Shri/Smt/Kumari <span className="font-bold underline px-1 text-indigo-950">{employeeName || "______________________________"}</span> was absent on duty from his/her headquarters station during the period charged for in the bill on Railway business and that the officer performed the journey by Rail/Sea/Air/Road and was allowed/not allowed free Pass of locomotion at the expense of Government local fund of Indian State.
          </p>
          <p className="mt-1 border-t border-dotted border-gray-300 pt-1">
            मैं प्रमाणित करता हूँ कि श्री/श्रीमती/कुमारी <span className="font-bold underline px-1 text-indigo-950">{employeeName || "______________________________"}</span> अपने मुख्यालय स्टेशन से रेलवे व्यवसाय पर ड्यूटी से अनुपस्थित थे और उन्होंने रेल/समुद्र/हवा/सड़क द्वारा यात्रा की।
          </p>
        </div>

        {/* Counter Signed & Controlling Officer signatures layout arranged exactly per PNG user request */}
        {(showCounterSig || showHeadOfficeSig || showControllingOfficerSig) && (
          <div className={`mt-3 space-y-3 font-serif tracking-normal leading-normal text-black relative w-full printable-signatures-block min-h-[140px] ${fh('text-[8.5pt]', 'text-[7.5pt]')}`}>
            {/* Absolute centered stamp/seal with 50% transparency between these signature blocks */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-10 opacity-50 flex items-center justify-center scale-110">
              <RenderPrintOverlaySeal seal={printSettings.seal} customSealText={printSettings.customSealText} sealImageData={printSettings.sealImageData} />
            </div>

            {/* System Generated Circular Rubber Stamp (Gol Muhar) centered in the signature section as requested */}
            {storeConfig.enablePrintMetadata !== "false" && (
              <div 
                className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none z-10 flex items-center justify-center"
                style={{ opacity: 0.35 }}
              >
                <div className="w-[138px] h-[138px] border border-dashed border-indigo-600/90 rounded-full flex flex-col items-center justify-center text-center p-0.5 font-sans uppercase text-indigo-600 leading-none select-none pointer-events-none rotate-[-6deg] bg-white/65 backdrop-blur-[0.5px]">
                  <div className="w-[124px] h-[124px] border-double border-[3.5px] border-indigo-600/100 rounded-full flex flex-col items-center justify-center gap-1.5 font-serif font-black bg-indigo-50/10">
                    <span className="text-[8.5pt] font-extrabold tracking-widest text-indigo-600/100">SYSTEM</span>
                    <span className="text-[11.5pt] font-black border-y border-[1px] border-indigo-600/100 py-0.5 px-2 font-sans my-0.5 bg-indigo-50/20 whitespace-nowrap text-indigo-700 font-extrabold">GENERATED</span>
                    <span className="text-[7.5pt] font-extrabold tracking-tight text-indigo-600/100 font-sans">PLEASE VERIFY</span>
                  </div>
                </div>
              </div>
            )}

            {/* Row 1: Counter Signed on Left */}
            {showCounterSig && (
              <div className="flex justify-start text-black">
                <div className="w-[280px] text-left">
                  <div className="h-6"></div> {/* Space for actual physical sign */}
                  <p className={`font-bold leading-tight ${fh('text-[9pt]', 'text-[7.5pt]')}`}>
                    Counter Signed
                    <span className="block mt-0.5">प्रतिहस्ताक्षरित</span>
                  </p>
                </div>
              </div>
            )}

            {/* Row 2: Head of Office in the middle (vertically), but aligned on the Right hand side */}
            {showHeadOfficeSig && (
              <div className="flex justify-end text-black">
                <div className="w-[450px] text-right">
                  <div className="h-6"></div> {/* Space for actual physical sign */}
                  <p className={`font-bold leading-tight ${fh('text-[9pt]', 'text-[7.5pt]')}`}>
                    Signature of Supervisor/In-charge
                    <span className="block mt-0.5">पर्यवेक्षक/प्रभारी के हस्ताक्षर</span>
                  </p>
                </div>
              </div>
            )}

            {/* Row 3: Controlling Officer on the Left */}
            {showControllingOfficerSig && (
              <div className="flex justify-start items-end text-black">
                <div className="w-[280px] text-left">
                  <div className="h-6"></div> {/* Space for actual physical sign */}
                  <p className={`font-bold leading-tight ${fh('text-[9pt]', 'text-[7.5pt]')}`}>
                    Controlling Officer
                    <span className="block mt-0.5">नियंत्रण अधिकारी</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dynamic System Timestamp & System Generated Circular Stamp Metadata */}
        {storeConfig.enablePrintMetadata !== "false" && (
          <div className={`mt-4 pt-2 border-t border-dashed border-gray-400 flex justify-end items-center font-mono text-gray-500 px-1 py-1 ${fh('text-[8.5pt]', 'text-[7.2pt]')}`}>
            <div className={`text-right flex flex-col items-end leading-tight ${fh('text-[8.5pt]', 'text-[7.2pt]')}`}>
              <span>Dynamic Auth Code: NFR-PERS-TA-{empNo || 'DRAFT'}-{Date.now().toString().slice(-6)}</span>
              <span className={`text-slate-850 font-bold mt-0.5 font-mono ${fh('text-[8.5pt]', 'text-[7.2pt]')}`}>
                Time: {new Date().toLocaleTimeString('en-IN', {
                  hour12: true,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </span>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderWelcomeDashboard = () => {
    const filtered = savedClaims.filter(claim => 
      (claim.employeeName || "").toLowerCase().includes(taSearchQuery.toLowerCase()) ||
      (claim.empNo || "").toLowerCase().includes(taSearchQuery.toLowerCase()) ||
      (claim.designation || "").toLowerCase().includes(taSearchQuery.toLowerCase())
    );

    return (
      <div className="flex-1 bg-slate-50 min-h-[500px] p-4 md:p-8 flex flex-col justify-start items-center font-sans w-full animate-fadeIn relative">
        {/* Navigation header for returning key portals */}
        <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-gray-200 mb-4 shrink-0 z-20">
          <button
            onClick={() => {
              if (onBackToDashboard) {
                onBackToDashboard();
              } else {
                navigate(-1);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 border border-slate-355 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
          >
            ← Back
          </button>
          
          <button
            onClick={() => onToggleSidebars?.(!showSidebars)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:border-indigo-500 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-700 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer"
          >
            📋 {showSidebars ? "Hide Menu" : "Show Options Menu"}
          </button>
        </div>

        <div className="max-w-4xl w-full space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2 mt-4">
            <div className="w-14 h-14 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <Coins className="w-8 h-8" />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Travelling Allowance (TA) Claim System
            </h1>
            <p className="text-xs md:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
              Select an existing claim record from the list below to view and edit, or start a fresh claim to auto-fill.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Create Card */}
            <div 
              onClick={resetForm}
              className="bg-white border-2 border-dashed border-indigo-200 hover:border-indigo-500 hover:shadow-md rounded-2xl p-5 flex flex-col items-center text-center cursor-pointer transition-all duration-200 group active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5 font-bold" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Create New TA Claim Sheet
              </h3>
              <p className="text-[10px] text-slate-400 mt-2 max-w-xs leading-normal">
                Starts with a clean form conforming to 7th PC rules, allowing manual entry or instant station kilometrage checks.
              </p>
            </div>

            {/* General Info Card */}
            <div className="bg-white border border-gray-250 shadow-sm rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <span className="bg-emerald-50 text-emerald-800 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-2">
                  System Rates & Guidelines
                </span>
                <div className="space-y-1.5 mt-1">
                  <div className="flex justify-between text-[11px] text-slate-600 border-b border-gray-100 pb-1">
                    <span>Database TA Claim Records:</span>
                    <strong className="text-slate-900 font-bold font-mono">{savedClaims.length} Records</strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600 border-b border-gray-100 pb-1">
                    <span>7th CPC DA Rates:</span>
                    <span className="text-indigo-605 font-semibold text-indigo-700">L1-L5: ₹625 | L6-L8: ₹1000 | L9-L11: ₹1125</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-600">
                    <span>System Authentic Stamp:</span>
                    <span className="text-emerald-600 font-bold">Enabled (Gol Stamp)</span>
                  </div>
                </div>
              </div>
              <p className="text-[9.5px] text-slate-400 italic leading-snug mt-3">
                Select a claim below to view, update, verify or issue.
              </p>
            </div>
          </div>

          {/* Database Claims Selector List */}
          <div className="bg-white border border-gray-250 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-2.5">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-indigo-600 rounded"></span>
                  Select Saved TA Claim to Edit
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Click on any employee record below to open and review.
                </p>
              </div>

              {/* Search Claim input */}
              <div className="relative w-full sm:w-auto">
                <input 
                  type="text"
                  placeholder="🔍 Search name, BU or level..."
                  value={taSearchQuery}
                  onChange={(e) => setTaSearchQuery(e.target.value)}
                  className="pl-2.5 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-205 border-gray-300 rounded-lg w-full sm:w-[260px] focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all text-slate-800 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-1">
              {filtered.map(claim => (
                <div 
                  key={claim.id}
                  onClick={() => loadCase(claim)}
                  className="border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/10 p-3 rounded-xl cursor-pointer transition-all duration-200 flex flex-col gap-1 text-left relative group bg-white hover:shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-extrabold text-xs text-slate-900 uppercase truncate pr-1 group-hover:text-indigo-600">
                      {claim.employeeName}
                    </h4>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">
                      ₹{claim.totalAmount ? claim.totalAmount.toFixed(0) : "0"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {claim.designation} ({claim.payLevel})
                  </p>
                  <div className="flex justify-between items-center text-[9.5px] text-slate-400 mt-2 pt-1 border-t border-slate-100 font-mono">
                    <span>BU: {claim.billUnit || "N/A"}</span>
                    <span className="font-bold text-slate-600">{claim.claimMonth} {claim.claimYear}</span>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="col-span-full text-center py-10 text-slate-400 text-xs font-semibold">
                  {taSearchQuery ? "No matching records found." : "No records found in database. Create one above."}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  };

  if (!isEditingOrDrafting) {
    return (
      <div className="w-full h-full min-h-[500px] overflow-y-auto bg-slate-50">
        {renderWelcomeDashboard()}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-6 p-4 text-slate-800 font-sans ${
      isSidebarsShown
        ? "lg:flex-row h-full overflow-y-auto lg:overflow-hidden bg-slate-50"
        : "fixed inset-0 z-50 bg-slate-100 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-200 p-4 md:p-10 pb-28 text-slate-800"
    }`}>
      {/* Printable Sheet Panel (Hidden on web UI, triggered on print) */}
      <div style={{ display: 'none' }}>
        <div ref={componentRef} className={`pl-[4mm] pr-[4mm] pt-[4mm] pb-[4mm] text-black bg-white font-serif leading-tight text-[11pt] ${isLandscape ? 'w-[297mm]' : 'w-[210mm]'} print:w-full print:max-w-full print:p-0 print:m-0 box-border`}>
          {renderPrintSheetContent()}
        </div>
      </div>

      {/* Editor Panel Left side */}
      <div className={`flex-1 flex flex-col gap-4 pr-1 ${isSidebarsShown ? "overflow-y-auto h-full min-h-0" : "h-auto pb-24"}`}>
        
        {/* Toggle Mode Switcher with Prominent "Tir ka Nishan" Toggler */}
        <div className="bg-white border border-gray-250 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm shrink-0">
          <div className="flex gap-1.5 flex-wrap items-center">
            <button
              type="button"
              onClick={() => {
                setIsEditingOrDrafting(false);
                onToggleSidebars?.(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 border border-transparent transition-all cursor-pointer mr-1.5 active:scale-95"
              title="Return to claims list dashboard"
            >
              ← Back to List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("editor")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "editor"
                  ? "bg-indigo-600 text-white shadow-sm scale-[1.02]"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> 📝 Entry Form
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
              <Eye className="w-3.5 h-3.5" /> 👁️ Print Preview
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
              title={isSidebarsShown ? "Hide sidebars" : "Show side options"}
            >
              {isSidebarsShown ? (
                <>
                  <ChevronsRightLeft className="w-4 h-4 text-slate-700" />
                  <span>🖥️ Full Screen Form/Preview</span>
                </>
              ) : (
                <>
                  <ChevronsLeftRight className="w-5 h-5 text-yellow-100 animate-bounce" />
                  <span className="text-white font-extrabold tracking-wide">↔️ Show Options</span>
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
        {isSidebarsShown && <PrintCustomizer settings={printSettings} onChange={setPrintSettings} isAdmin={isAdmin} />}

        {/* Real-time Signature Box Selectors */}
        {isSidebarsShown && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-4 font-sans text-slate-850 animate-fadeIn animate-duration-200">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-indigo-600 rounded"></span>
              Signature & Table Visibility Config
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <label className="flex items-center gap-2 text-xs bg-slate-50 border border-gray-200 hover:border-indigo-500 rounded-lg p-2.5 cursor-pointer select-none transition-all">
                <input
                  type="checkbox"
                  checked={showClaimantSig}
                  onChange={(e) => setShowClaimantSig(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 bg-white text-indigo-650 focus:ring-indigo-500 accent-indigo-650 cursor-pointer"
                  id="claimantSigCheckbox"
                />
                <div className="flex flex-col cursor-pointer">
                  <span className="font-bold text-slate-800">Claimant Signature</span>
                </div>
              </label>

              <label className="flex items-center gap-2 text-xs bg-slate-50 border border-gray-200 hover:border-indigo-500 rounded-lg p-2.5 cursor-pointer select-none transition-all">
                <input
                  type="checkbox"
                  checked={showCounterSig}
                  onChange={(e) => setShowCounterSig(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 bg-white text-indigo-650 focus:ring-indigo-500 accent-indigo-650 cursor-pointer"
                  id="counterSigCheckbox"
                />
                <div className="flex flex-col cursor-pointer">
                  <span className="font-bold text-slate-800">Counter Signed</span>
                </div>
              </label>

              <label className="flex items-center gap-2 text-xs bg-slate-50 border border-gray-200 hover:border-indigo-500 rounded-lg p-2.5 cursor-pointer select-none transition-all">
                <input
                  type="checkbox"
                  checked={showHeadOfficeSig}
                  onChange={(e) => setShowHeadOfficeSig(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 bg-white text-indigo-650 focus:ring-indigo-500 accent-indigo-650 cursor-pointer"
                  id="headOfficeSigCheckbox"
                />
                <div className="flex flex-col cursor-pointer">
                  <span className="font-bold text-slate-800">Head of Office</span>
                </div>
              </label>

              <label className="flex items-center gap-2 text-xs bg-slate-50 border border-gray-200 hover:border-indigo-500 rounded-lg p-2.5 cursor-pointer select-none transition-all">
                <input
                  type="checkbox"
                  checked={showControllingOfficerSig}
                  onChange={(e) => setShowControllingOfficerSig(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 bg-white text-indigo-650 focus:ring-indigo-500 accent-indigo-650 cursor-pointer"
                  id="controllingOfficerSigCheckbox"
                />
                <div className="flex flex-col cursor-pointer">
                  <span className="font-bold text-slate-800">Controlling Officer</span>
                </div>
              </label>

              <label className="flex items-center gap-2 text-xs bg-indigo-50/70 border border-indigo-200 hover:border-indigo-500 rounded-lg p-2.5 cursor-pointer select-none transition-all">
                <input
                  type="checkbox"
                  checked={showSummaryTable}
                  onChange={(e) => setShowSummaryTable(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 bg-white text-indigo-650 focus:ring-indigo-500 accent-indigo-650 cursor-pointer"
                  id="summaryTableCheckbox"
                />
                <div className="flex flex-col cursor-pointer">
                  <span className="font-bold text-indigo-900">Show Summary</span>
                </div>
              </label>

              <label className="flex items-center gap-2 text-xs bg-[#fffbeb] border border-amber-300 hover:border-amber-500 rounded-lg p-2.5 cursor-pointer select-none transition-all">
                <input
                  type="checkbox"
                  checked={showNoFreePassDeclaration}
                  onChange={(e) => setShowNoFreePassDeclaration(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 bg-white text-amber-600 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                  id="noFreePassCheckbox"
                />
                <div className="flex flex-col cursor-pointer">
                  <span className="font-bold text-amber-900">Declaration 2 (No Free Pass)</span>
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

              {editingClaimId && (
                <div className="bg-indigo-50 border border-indigo-200 text-indigo-850 rounded-xl p-3.5 mb-4 flex justify-between items-center text-xs shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black">🔧 Mode: Editing Claim</span>
                    <span>(Record ID: <span className="font-mono font-bold text-indigo-900 bg-indigo-100 px-1.5 py-0.5 rounded">{editingClaimId}</span>)</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      resetForm();
                      toast.info("Cleared editing mode. Now drafting a new claim.");
                    }}
                    className="text-indigo-700 hover:text-indigo-900 font-extrabold underline cursor-pointer bg-white border border-indigo-200 px-2.5 py-1 rounded-lg transition-all"
                  >
                    Clear Edit Mode (Create New)
                  </button>
                </div>
              )}

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
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">Division *</label>
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
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">Department *</label>
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
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">Claim Month *</label>
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
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">Claim Year *</label>
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
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">Bill Unit *</label>
                  <input 
                    type="text" 
                    required
                    value={billUnit} 
                    onChange={(e) => setBillUnit(e.target.value)}
                    placeholder="Type Bill Unit code..." 
                    className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Default Object of Journey *</label>
                  <input 
                    type="text" 
                    required
                    value={globalPurpose} 
                    onChange={(e) => setGlobalPurpose(e.target.value)}
                    placeholder="e.g. Duty / Inspecting Station Registers" 
                    className="w-full text-[13px] font-semibold bg-white border border-indigo-300 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm font-bold" 
                  />
                </div>



                <div className="space-y-1 md:col-span-2">
                  <label className="block text-[10px] font-bold text-amber-700 uppercase tracking-wider">TA Calculation Rule</label>
                  <select 
                    value={calculationMode} 
                    onChange={(e) => setCalculationMode(e.target.value as 'calendar_day' | 'continuous')}
                    className="w-full text-[13px] font-semibold bg-white border border-amber-500 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-sm font-bold"
                  >
                    <option value="calendar_day">🗓️ Calendar Day Basis (Midnight to Midnight) - Railway Rule</option>
                    <option value="continuous">⏱️ Continuous Tour Duration basis (12-Hour Slots)</option>
                  </select>
                  <p className="text-[9.5px] text-amber-800 mt-1 leading-normal font-medium">
                    {calculationMode === 'calendar_day' ? 
                      "✓ Indian Railways Rule: Tour is split by date boundaries. Overlap hours under each date: < 6 hrs = 30%, 6 to 12 hrs = 70%, > 12 hrs = 100% Daily Allowance." : 
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
                Journey Logs & Stops
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">Add segments for your departure and arrival legs to determine duty periods.</p>
            </div>
            <div className="flex gap-2 mr-2">
              <button
                type="button"
                onClick={addNewTrip}
                className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Start a fresh trip from your HQ/Home Station"
              >
                <PlusCircle className="w-4 h-4" /> Add Other Trip
              </button>
            </div>
          </div>

          <div className={`space-y-4 pr-1 ${isSidebarsShown ? "flex-1 overflow-y-auto" : "h-auto"}`}>
            {(() => {
              const processedTripsGrouped: { tripId: string; legs: any[] }[] = [];
              processedLegs.forEach(leg => {
                const tId = leg.tripId || "trip-1";
                let group = processedTripsGrouped.find(g => g.tripId === tId);
                if (!group) {
                  group = { tripId: tId, legs: [] };
                  processedTripsGrouped.push(group);
                }
                group.legs.push(leg);
              });

              return processedTripsGrouped.flatMap((tripGroup, tripIdx) => {
                const tripNo = tripIdx + 1;
                const tripLegs = tripGroup.legs;
                return tripLegs.map((leg, legIdx) => {
                  const index = processedLegs.findIndex(l => l.id === leg.id);
                  const showTripHeader = legIdx === 0;
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
                    {showTripHeader && (
                      <div className="space-y-3 mt-4 first:mt-0">
                        <div className="flex items-center gap-2 py-2 border-b border-dashed border-emerald-200">
                          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 font-extrabold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-200/60 shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            ✈️ Trip #{tripNo}
                          </span>
                          <div className="h-px bg-gradient-to-r from-emerald-100 to-transparent flex-1"></div>
                        </div>

                        {/* Trip-Specific Initial Stay Sub-Section */}
                        {(() => {
                          const currentTripStay = tripStays.find(ts => ts.tripId === tripGroup.tripId) || {
                            tripId: tripGroup.tripId,
                            startWithStay: false,
                            stayType: 'before' as const,
                            initialStayStation: "",
                            initialStayStartDate: "",
                            initialStayStartTime: "",
                            initialStayEndDate: "",
                            initialStayEndTime: "",
                            initialStayPurpose: ""
                          };
                          return (
                            <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-xl space-y-3">
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input 
                                  type="checkbox"
                                  checked={currentTripStay.startWithStay}
                                  onChange={(e) => {
                                    updateTripStayField(tripGroup.tripId, 'startWithStay', e.target.checked);
                                    if (e.target.checked && !currentTripStay.stayType) {
                                      updateTripStayField(tripGroup.tripId, 'stayType', 'before');
                                    }
                                  }}
                                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                                  id={`stayCheck-${tripNo}`}
                                />
                                <span className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                  🏨 Add a Stay/Halt to this Trip?
                                </span>
                              </label>
                              <p className="text-[10px] text-slate-500 ml-6 leading-normal">
                                Toggle this on if this trip has a stationary stay or on-duty period at a specific outstation (either before your travel starts, or after your travel ends).
                              </p>

                              {currentTripStay.startWithStay && (
                                <div className="mt-2 ml-6 space-y-3">
                                  <div className="bg-white border border-indigo-100/85 p-3 rounded-lg space-y-2 shadow-sm max-w-xl">
                                    <label className="block text-[9.5px] font-bold text-indigo-950 uppercase tracking-wide">
                                      Where should this Stay be placed? *
                                    </label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-750">
                                        <input
                                          type="radio"
                                          name={`stayType-${tripGroup.tripId}`}
                                          value="before"
                                          checked={!currentTripStay.stayType || currentTripStay.stayType === 'before'}
                                          onChange={() => updateTripStayField(tripGroup.tripId, 'stayType', 'before')}
                                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                        <span>Before travel begins</span>
                                      </label>
                                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-750">
                                        <input
                                          type="radio"
                                          name={`stayType-${tripGroup.tripId}`}
                                          value="after"
                                          checked={currentTripStay.stayType === 'after'}
                                          onChange={() => updateTripStayField(tripGroup.tripId, 'stayType', 'after')}
                                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                        <span>After travel ends</span>
                                      </label>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    <div className="space-y-1">
                                      <label className="block text-[9px] font-bold text-slate-600 uppercase">Stay Station Code *</label>
                                      <input 
                                        type="text" 
                                        required={currentTripStay.startWithStay}
                                        value={currentTripStay.initialStayStation} 
                                        onChange={(e) => updateTripStayField(tripGroup.tripId, 'initialStayStation', e.target.value.toUpperCase())}
                                        placeholder="e.g. KIR, HWH" 
                                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 uppercase" 
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <label className="block text-[9px] font-bold text-slate-600 uppercase">From Date *</label>
                                      <input 
                                        type="date" 
                                        required={currentTripStay.startWithStay}
                                        value={currentTripStay.initialStayStartDate} 
                                        onChange={(e) => updateTripStayField(tripGroup.tripId, 'initialStayStartDate', e.target.value)}
                                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800" 
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <label className="block text-[9px] font-bold text-slate-600 uppercase">From Time *</label>
                                      <TimePickerInput 
                                        id={`stayFromTime-${tripGroup.tripId}`}
                                        required={currentTripStay.startWithStay}
                                        value={currentTripStay.initialStayStartTime} 
                                        onChange={(val) => updateTripStayField(tripGroup.tripId, 'initialStayStartTime', val)}
                                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg pl-2.5 pr-8 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm cursor-pointer"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <label className="block text-[9px] font-bold text-slate-600 uppercase">To Date *</label>
                                      <input 
                                        type="date" 
                                        required={currentTripStay.startWithStay}
                                        value={currentTripStay.initialStayEndDate} 
                                        onChange={(e) => updateTripStayField(tripGroup.tripId, 'initialStayEndDate', e.target.value)}
                                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800" 
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <label className="block text-[9px] font-bold text-slate-600 uppercase">To Time *</label>
                                      <TimePickerInput 
                                        id={`stayToTime-${tripGroup.tripId}`}
                                        required={currentTripStay.startWithStay}
                                        value={currentTripStay.initialStayEndTime} 
                                        onChange={(val) => updateTripStayField(tripGroup.tripId, 'initialStayEndTime', val)}
                                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg pl-2.5 pr-8 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm cursor-pointer"
                                      />
                                    </div>

                                    <div className="space-y-1 sm:col-span-2 md:col-span-3">
                                      <label className="block text-[9px] font-bold text-slate-600 uppercase">Object/Purpose of Stay</label>
                                      <input 
                                        type="text" 
                                        value={currentTripStay.initialStayPurpose || ""} 
                                        onChange={(e) => updateTripStayField(tripGroup.tripId, 'initialStayPurpose', e.target.value)}
                                        placeholder="e.g. Outstation duty, night halt before train" 
                                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800" 
                                      />
                                    </div>
                                  </div>

                                  {/* Gap/Overlap interactive warning and auto-align widget */}
                                  {(() => {
                                    const firstLeg = tripLegs[0];
                                    const lastLeg = tripLegs[tripLegs.length - 1];
                                    const isStayBefore = !currentTripStay.stayType || currentTripStay.stayType === 'before';

                                    if (isStayBefore) {
                                      if (currentTripStay.initialStayEndDate && currentTripStay.initialStayEndTime && firstLeg?.depDate && firstLeg?.depTime) {
                                        const stayEndDt = new Date(`${currentTripStay.initialStayEndDate}T${currentTripStay.initialStayEndTime}`);
                                        const legStartDt = new Date(`${firstLeg.depDate}T${firstLeg.depTime}`);
                                        const diffMs = legStartDt.getTime() - stayEndDt.getTime();
                                        if (!isNaN(diffMs)) {
                                          const diffHrs = diffMs / (1000 * 60 * 60);
                                          if (diffHrs > 0.01) {
                                            return (
                                              <div className="mt-3 bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-left text-slate-800 space-y-2 max-w-xl shadow-sm animate-fadeIn">
                                                <div className="flex items-start gap-2">
                                                  <span className="text-amber-600 text-sm mt-0.5">⚠️</span>
                                                  <div className="space-y-1 text-slate-800">
                                                    <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide block">
                                                      Time Gap Detected ({diffHrs.toFixed(1)} Hours)
                                                    </span>
                                                    <p className="text-[11px] leading-relaxed text-slate-700">
                                                      There is a gap of <strong>{diffHrs.toFixed(1)} hours</strong> between your Stay end time (<strong>{currentTripStay.initialStayEndDate} {currentTripStay.initialStayEndTime}</strong>) and travel departure (<strong>{firstLeg.depDate} {firstLeg.depTime}</strong>).
                                                    </p>
                                                    <p className="text-[10px] text-amber-800 font-medium bg-amber-100/50 px-2 py-1 rounded border border-amber-250">
                                                      ✓ Under Railway Rules: This gap is counted as <strong>Transit/Waiting Halt time</strong> so your Traveling Allowance remains fully continuous and unreduced.
                                                    </p>
                                                  </div>
                                                </div>
                                                <div className="flex gap-2 pl-6 pt-1">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      updateTripStayFields(tripGroup.tripId, {
                                                        initialStayEndDate: firstLeg.depDate,
                                                        initialStayEndTime: firstLeg.depTime
                                                      });
                                                    }}
                                                    className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-3 py-1.5 rounded shadow active:scale-95 transition-all cursor-pointer uppercase tracking-wider animate-fadeIn"
                                                  >
                                                    ⚡ Auto-Align: Extend Stay to departure ({firstLeg.depTime})
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          } else if (diffHrs < -0.01) {
                                            return (
                                              <div className="mt-3 bg-red-50 border border-red-200 p-3.5 rounded-xl text-left text-slate-800 space-y-2 max-w-xl shadow-sm animate-fadeIn">
                                                <div className="flex items-start gap-2">
                                                  <span className="text-red-600 text-sm mt-0.5">❌</span>
                                                  <div className="space-y-1">
                                                    <span className="text-[11px] font-bold text-red-900 uppercase tracking-wide block">
                                                      Overlap Error ({Math.abs(diffHrs).toFixed(1)} Hours)
                                                    </span>
                                                    <p className="text-[11px] leading-relaxed text-slate-700">
                                                      Your Stay ends at <strong>{currentTripStay.initialStayEndDate} {currentTripStay.initialStayEndTime}</strong>, which overlaps with your journey starting at <strong>{firstLeg.depDate} {firstLeg.depTime}</strong>.
                                                    </p>
                                                  </div>
                                                </div>
                                                <div className="flex gap-2 pl-6 pt-1">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      updateTripStayFields(tripGroup.tripId, {
                                                        initialStayEndDate: firstLeg.depDate,
                                                        initialStayEndTime: firstLeg.depTime
                                                      });
                                                    }}
                                                    className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-3 py-1.5 rounded shadow active:scale-95 transition-all cursor-pointer uppercase tracking-wider animate-fadeIn"
                                                  >
                                                    ⚡ Fix Overlap: End Stay at departure ({firstLeg.depTime})
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          }
                                        }
                                      }
                                    } else {
                                      // Stay type is after
                                      if (currentTripStay.initialStayStartDate && currentTripStay.initialStayStartTime && lastLeg?.arrDate && lastLeg?.arrTime) {
                                        const lastLegArrDt = new Date(`${lastLeg.arrDate}T${lastLeg.arrTime}`);
                                        const stayStartDt = new Date(`${currentTripStay.initialStayStartDate}T${currentTripStay.initialStayStartTime}`);
                                        const diffMs = stayStartDt.getTime() - lastLegArrDt.getTime();
                                        if (!isNaN(diffMs)) {
                                          const diffHrs = diffMs / (1000 * 60 * 60);
                                          if (diffHrs > 0.01) {
                                            return (
                                              <div className="mt-3 bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-left text-slate-800 space-y-2 max-w-xl shadow-sm animate-fadeIn">
                                                <div className="flex items-start gap-2">
                                                  <span className="text-amber-600 text-sm mt-0.5">⚠️</span>
                                                  <div className="space-y-1">
                                                    <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide block">
                                                      Time Gap Detected ({diffHrs.toFixed(1)} Hours)
                                                    </span>
                                                    <p className="text-[11px] leading-relaxed text-slate-700">
                                                      There is a gap of <strong>{diffHrs.toFixed(1)} hours</strong> between your journey arrival (<strong>{lastLeg.arrDate} {lastLeg.arrTime}</strong>) and Stay start time (<strong>{currentTripStay.initialStayStartDate} {currentTripStay.initialStayStartTime}</strong>).
                                                    </p>
                                                    <p className="text-[10px] text-amber-850 font-medium bg-amber-100/50 px-2 py-1 rounded border border-amber-200 leading-normal">
                                                      ✓ Under Railway Rules: This gap is counted as <strong>Transit/Waiting Halt time</strong> so your Traveling Allowance remains fully continuous and unreduced.
                                                    </p>
                                                  </div>
                                                </div>
                                                <div className="flex gap-2 pl-6 pt-1">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      updateTripStayFields(tripGroup.tripId, {
                                                        initialStayStartDate: lastLeg.arrDate,
                                                        initialStayStartTime: lastLeg.arrTime
                                                      });
                                                    }}
                                                    className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-3 py-1.5 rounded shadow active:scale-95 transition-all cursor-pointer uppercase tracking-wider animate-fadeIn"
                                                  >
                                                    ⚡ Auto-Align: Start Stay immediately at arrival ({lastLeg.arrTime})
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          } else if (diffHrs < -0.01) {
                                            return (
                                              <div className="mt-3 bg-red-50 border border-red-200 p-3.5 rounded-xl text-left text-slate-800 space-y-2 max-w-xl shadow-sm animate-fadeIn">
                                                <div className="flex items-start gap-2">
                                                  <span className="text-red-600 text-sm mt-0.5">❌</span>
                                                  <div className="space-y-1">
                                                    <span className="text-[11px] font-bold text-red-900 uppercase tracking-wide block">
                                                      Overlap Error ({Math.abs(diffHrs).toFixed(1)} Hours)
                                                    </span>
                                                    <p className="text-[11px] leading-relaxed text-slate-700">
                                                      Your Stay starts at <strong>{currentTripStay.initialStayStartDate} {currentTripStay.initialStayStartTime}</strong>, which overlaps with your journey ending at <strong>{lastLeg.arrDate} {lastLeg.arrTime}</strong>.
                                                    </p>
                                                  </div>
                                                </div>
                                                <div className="flex gap-2 pl-6 pt-1">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      updateTripStayFields(tripGroup.tripId, {
                                                        initialStayStartDate: lastLeg.arrDate,
                                                        initialStayStartTime: lastLeg.arrTime
                                                      });
                                                    }}
                                                    className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-3 py-1.5 rounded shadow active:scale-95 transition-all cursor-pointer uppercase tracking-wider animate-fadeIn"
                                                  >
                                                    ⚡ Fix Overlap: Start Stay at arrival ({lastLeg.arrTime})
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          }
                                        }
                                      }
                                    }
                                    return null;
                                  })()}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
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
                          🚉 Station From
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
                              // Auto trigger precise online route distance calculation on blur
                              if (leg.stationFrom && leg.stationTo) {
                                triggerDistanceLookup(leg.id, leg.stationFrom, leg.stationTo);
                              }
                            }, 220);
                          }}
                          placeholder="Type or search station..." 
                          className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 transition-all shadow-sm" 
                        />
                        {leg.stationFrom && (() => {
                          const station = findStation(leg.stationFrom);
                          return station ? (
                            <div className="mt-1 text-[11px] text-indigo-700 font-semibold flex items-center gap-1 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded max-w-full truncate">
                              <span>🚉</span>
                              <span className="font-bold text-[11px]">{station.name}</span>
                              {station.hindiName && station.hindiName !== station.name && (
                                <span className="text-slate-500 font-normal text-[10px]">({station.hindiName})</span>
                              )}
                            </div>
                          ) : (
                            <div className="mt-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                              ⚠️ Code not mapped offline. Use online search below.
                            </div>
                          );
                        })()}
                        {activeAutocomplete?.legId === leg.id && activeAutocomplete?.field === 'stationFrom' && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded-xl shadow-2xl z-50 max-h-68 overflow-y-auto overflow-x-hidden py-1 text-xs select-none">
                            <div className="px-2.5 py-1 text-[9px] font-bold text-slate-500 bg-slate-50 border-b border-slate-200 sticky top-0 flex justify-between">
                              <span>{stationSearch.trim() === "" ? "⚡ SUGGESTED STATIONS" : "🔎 SEARCH RESULTS"}</span>
                              <span className="text-emerald-700 font-mono">STA CODES</span>
                            </div>
                            {/* Live automatic search row indicator */}
                            {isSearchingStation[`${leg.id}-stationFrom`] && (
                              <div className="px-3 py-2 bg-amber-50 text-amber-900 text-[10.5px] font-bold flex items-center gap-2 border-b border-amber-150 animate-pulse">
                                <span className="w-3.5 h-3.5 border-2 border-amber-800 border-t-transparent rounded-full animate-spin"></span>
                                <span>ONLINE AUTO-SEARCHING FOR "{stationSearch}"...</span>
                              </div>
                            )}
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
                          🚉 Station To
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
                              // Auto trigger precise online route distance calculation on blur
                              if (leg.stationFrom && leg.stationTo) {
                                triggerDistanceLookup(leg.id, leg.stationFrom, leg.stationTo);
                              }
                            }, 220);
                          }}
                          placeholder="Type or search station..." 
                          className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 transition-all shadow-sm" 
                        />
                        {leg.stationTo && (() => {
                          const station = findStation(leg.stationTo);
                          return station ? (
                            <div className="mt-1 text-[11px] text-indigo-700 font-semibold flex items-center gap-1 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded max-w-full truncate">
                              <span>🚉</span>
                              <span className="font-bold text-[11px]">{station.name}</span>
                              {station.hindiName && station.hindiName !== station.name && (
                                <span className="text-slate-500 font-normal text-[10px]">({station.hindiName})</span>
                              )}
                            </div>
                          ) : (
                            <div className="mt-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                              ⚠️ Code not mapped offline. Use online search below.
                            </div>
                          );
                        })()}
                        {activeAutocomplete?.legId === leg.id && activeAutocomplete?.field === 'stationTo' && (
                          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded-xl shadow-2xl z-50 max-h-68 overflow-y-auto overflow-x-hidden py-1 text-xs select-none">
                            <div className="px-2.5 py-1 text-[9px] font-bold text-slate-500 bg-slate-50 border-b border-slate-200 sticky top-0 flex justify-between">
                              <span>{stationSearch.trim() === "" ? "⚡ SUGGESTED STATIONS" : "🔎 SEARCH RESULTS"}</span>
                              <span className="text-emerald-755 font-mono text-emerald-700">STA CODES</span>
                            </div>
                            {/* Live automatic search row indicator */}
                            {isSearchingStation[`${leg.id}-stationTo`] && (
                              <div className="px-3 py-2 bg-amber-50 text-amber-900 text-[10.5px] font-bold flex items-center gap-2 border-b border-amber-150 animate-pulse">
                                <span className="w-3.5 h-3.5 border-2 border-amber-800 border-t-transparent rounded-full animate-spin"></span>
                                <span>ONLINE AUTO-SEARCHING FOR "{stationSearch}"...</span>
                              </div>
                            )}
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
                          <option value="Train">Train</option>
                          <option value="Road">By Road</option>
                          <option value="Air">Air</option>
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
                            list={`custom-trains-list-${leg.id}`}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateLegField(leg.id, 'trainNoOrVehNo', val);
                              const cleanVal = val.trim();
                              
                              // Real-time offline match inside onChange
                              const matchedLocal = customTrains.find(
                                t => t.trainNo === cleanVal || t.trainName.toLowerCase() === cleanVal.toLowerCase()
                              );
                              if (matchedLocal) {
                                updateLegField(leg.id, 'trainName', matchedLocal.trainName);
                                if (matchedLocal.routeVia) {
                                  updateLegField(leg.id, 'trainRouteVia', matchedLocal.routeVia);
                                }
                                if (matchedLocal.routeDistanceKm) {
                                  updateLegField(leg.id, 'roadDistanceKm', matchedLocal.routeDistanceKm);
                                }
                              } else if (/^\d{5}$/.test(cleanVal)) {
                                handleLookupTrain(leg.id, cleanVal);
                              }
                            }}
                            className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 transition-all shadow-sm" 
                          />
                          {leg.mode === 'Train' && (
                            <datalist id={`custom-trains-list-${leg.id}`}>
                              {customTrains.map((item) => (
                                <option key={item.id || item.trainNo} value={item.trainNo}>
                                  {item.trainName} {item.routeDistanceKm ? `(${item.routeDistanceKm} KM)` : ""} {item.routeVia ? `- ${item.routeVia}` : ""}
                                </option>
                              ))}
                            </datalist>
                          )}
                          {leg.mode === 'Train' && isSearchingTrain[leg.id] && (
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                              <span className="block w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
                            </div>
                          )}
                        </div>
                        {leg.mode === 'Train' && (
                          (() => {
                            const matchedTrain = customTrains.find(t => t.trainNo === leg.trainNoOrVehNo.trim());
                            const displayName = leg.trainName || matchedTrain?.trainName;
                            const displayKm = leg.roadDistanceKm || matchedTrain?.routeDistanceKm;
                            
                            return displayName ? (
                              <div className="mt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded animate-fade-in truncate">
                                <span>🚆</span>
                                <span className="font-bold">{displayName}</span>
                                {displayKm ? (
                                  <span className="text-emerald-600 font-mono text-[10px]">({displayKm} KM)</span>
                                ) : null}
                              </div>
                            ) : null;
                          })()
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
                        <TimePickerInput 
                          id={`depTime-${leg.id}`}
                          required
                          value={leg.depTime} 
                          onChange={(val) => updateLegField(leg.id, 'depTime', val)}
                          className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg pl-3 pr-8 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm cursor-pointer"
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
                        <TimePickerInput 
                          id={`arrTime-${leg.id}`}
                          required
                          value={leg.arrTime} 
                          onChange={(val) => updateLegField(leg.id, 'arrTime', val)}
                          className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg pl-3 pr-8 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-650 uppercase">
                        Object of Journey *
                      </label>
                      <input 
                        type="text" 
                        required
                        value={leg.purpose || ""} 
                        onChange={(e) => updateLegField(leg.id, 'purpose', e.target.value)}
                        placeholder="e.g. Inspecting SSE Track registers / Attendance in Audit Meeting" 
                        className="w-full text-[13px] font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 placeholder-slate-400 transition-all shadow-sm" 
                      />
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
                            <span>Track Distance (KM)</span>
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
                          Halt Allowance: ₹{leg.haltDaContributed}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 leading-normal">
                        Where was this waiting time of <strong>{leg.haltHours.toFixed(1)} hours</strong> spent between Leg #{index + 1} and Leg #{index + 2}?
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[9.5px] font-bold text-slate-600 uppercase mb-1">Halt Location Option</label>
                          <select
                            value={leg.haltSpentAt || 'destination'}
                            onChange={(e) => updateLegField(leg.id, 'haltSpentAt', e.target.value)}
                            className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                          >
                            <option value="destination">Stay at "{leg.stationTo || 'Station'}" (On Duty)</option>
                            <option value="manual">Enter manually...</option>
                          </select>
                        </div>

                        {leg.haltSpentAt === 'manual' && (
                          <div className="space-y-1">
                            <label className="block text-[9.5px] font-bold text-slate-600 uppercase mb-1">Custom Stoppage Description</label>
                            <input
                              type="text"
                              required
                              value={leg.haltManualText || ''}
                              onChange={(e) => updateLegField(leg.id, 'haltManualText', e.target.value)}
                              placeholder="e.g. Connected train waiting at DRM office"
                              className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {legIdx === tripLegs.length - 1 && (
                    <div className="space-y-4 w-full">
                      <button
                        type="button"
                        onClick={() => addLegToTrip(tripGroup.tripId)}
                        className="flex items-center justify-center gap-1.5 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 font-extrabold text-[11px] py-2.5 rounded-xl border border-indigo-200 transition-all shadow-sm active:scale-95 cursor-pointer w-full mt-3"
                      >
                        <Plus className="w-4 h-4" /> Add Journey Leg to Trip #{tripNo}
                      </button>



                      {/* Trip-Specific Contingent Section */}
                      {storeConfig.enableContingentSection !== "false" && (
                        <div className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-xl space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="text-[10.5px] font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                              🪙 Contingent Expenses for Trip #{tripNo}
                            </h4>
                            <button
                              type="button"
                              onClick={() => addContingentItemToTrip(tripGroup.tripId)}
                              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1 rounded transition-all shadow cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> Add Contingent Cost
                            </button>
                          </div>

                          {contingentItems.filter(item => (item.tripId || "trip-1") === tripGroup.tripId).length === 0 ? (
                            <p className="text-[10px] text-slate-500 italic leading-normal">
                              No contingent expenses added for Trip #{tripNo} yet.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {contingentItems.filter(item => (item.tripId || "trip-1") === tripGroup.tripId).map((item, itemIdx) => (
                                <div key={item.id} className="flex gap-2 items-end bg-white p-2 border border-slate-200 rounded-lg shadow-sm">
                                  <div className="flex-1 text-left">
                                    <label className="block text-[8.5px] font-bold text-slate-500 uppercase">
                                      Particulars & Remarks
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      value={item.remarks}
                                      onChange={(e) => {
                                        setContingentItems(prev => prev.map(c => c.id === item.id ? { ...c, remarks: e.target.value } : c));
                                      }}
                                      placeholder="e.g. Spent Rs 50 on coolie charges"
                                      className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800"
                                    />
                                  </div>
                                  <div className="w-24 text-left">
                                    <label className="block text-[8.5px] font-bold text-slate-500 uppercase">
                                      Amount (₹)
                                    </label>
                                    <input
                                      type="number"
                                      required
                                      min="0"
                                      value={item.amount || ""}
                                      onChange={(e) => {
                                        const val = parseFloat(e.target.value) || 0;
                                        setContingentItems(prev => prev.map(c => c.id === item.id ? { ...c, amount: val } : c));
                                      }}
                                      placeholder="Amount"
                                      className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-mono"
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setContingentItems(prev => prev.filter(c => c.id !== item.id));
                                    }}
                                    className="text-rose-600 hover:text-rose-750 p-1.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Delete contingent cost"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </React.Fragment>
              );
            });
          });
        })()}
        </div>

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
              <div className="flex gap-2 font-sans">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold font-sans cursor-pointer transition-all border border-slate-300 shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" /> Clear
                </button>
                {editingClaimId && isAdmin && (
                  <button
                    type="button"
                    onClick={handleDeleteClaim}
                    className="flex items-center gap-1 bg-rose-650 hover:bg-rose-750 text-white px-4 py-2 rounded-lg text-xs font-extrabold font-sans cursor-pointer transition-all shadow"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Claim
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveClaim}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-750 text-white px-4 py-2 rounded-lg text-xs font-extrabold font-sans cursor-pointer transition-all shadow"
                >
                  <CheckSquare className="w-4 h-4" /> 
                  {editingClaimId ? (isAdmin ? "Update Record (Admin)" : "Update Record") : "Save Record"}
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
                A4 Sheet Preview
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
                <Printer className="w-4 h-4" /> Print TA Bill
              </button>
            </div>
            <div className="w-full overflow-x-auto flex justify-start lg:justify-center p-1 md:p-4">
              <div className={`bg-white text-black pl-[8mm] pr-[8mm] pt-[4mm] pb-[8mm] font-serif leading-relaxed text-[13pt] shadow-[0_0_30px_rgba(0,0,0,0.6)] border border-gray-300 rounded shrink-0 my-2 select-text ${isLandscape ? 'w-[297mm] min-h-[210mm]' : 'w-[210mm] min-h-[297mm]'}`}>
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
              Recent TA Claims
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

          {/* STATION & CODE DIRECTORY */}
          <div className="bg-[#0e1628]/95 border border-[#1e2a47] rounded-xl p-4 flex flex-col gap-3 shrink-0 text-left">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-[#223354] pb-2 flex items-center justify-between gap-1 shrink-0">
              <span className="flex items-center gap-1.5 font-bold">
                🚉 Station Directory
              </span>
              <span className="text-[9px] bg-violet-900/40 text-violet-300 px-1.5 py-0.5 rounded font-bold border border-violet-850/40 font-mono">
                {INDIAN_STATIONS.length} Loaded
              </span>
            </h3>

            {/* Mode selection / search */}
            <div className="space-y-2">
              <input
                type="text"
                placeholder="🔍 Search stations..."
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
                <span>➕ Add Custom Station</span>
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
                    placeholder="E.g.&#10;BSP Bilaspur Jn&#10;NDLS New Delhi&#10;HWH Howrah Jn"
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
              TA Rules Reference
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
