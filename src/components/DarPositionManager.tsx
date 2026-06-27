import React, { useState, useEffect, useRef } from "react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Download, 
  Upload, 
  Search, 
  RotateCcw,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface DarPositionRow {
  id: string;
  sn: number;
  name: string;
  designation: string;
  memorandumNo: string;
  natureOfCharge: string;
  issuedDate: string;
  nameOfDa: string;
  designationOfDa: string;
  natureOfCase: string;
  presentStatus: string;
  charges: string;
  dateOfDaNip: string;
  penalty: string;
  createdAt?: any;
}

const DESIGNATIONS = [
  "Ch.OS",
  "OS",
  "Sr.Clerk",
  "Jr.Clerk",
  "CS&WI",
  "S&WI",
  "Peon",
  "Steno",
  "Record Sorter",
  "Others"
];

const NATURE_OF_CHARGES = [
  "SF-5",
  "SF-11",
  "SF-14(II)",
  "Others"
];

const DA_NAMES = [
  "Shri A.K.Singh",
  "Shri Atul Kumar",
  "Shri Anjani Kumar",
  "Shri Lalit Kumar",
  "Others"
];

const formatDaName = (name: string | undefined | null): string => {
  if (!name) return "";
  const trimmed = name.trim();
  if (trimmed === "" || trimmed.toLowerCase() === "others") return trimmed;
  if (/^shri\b/i.test(trimmed)) {
    return "Shri " + trimmed.substring(4).trim();
  }
  return "Shri " + trimmed;
};

const DA_DESIGNATIONS = [
  "Sr.DPO",
  "DPO",
  "APO",
  "ADRM",
  "Others"
];

const CASE_NATURES = [
  "Non-Vig",
  "Vig"
];

const STATUS_LIST = [
  "Pending",
  "Finalized"
];

export function DarPositionManager() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.split('-')[0] || 'en';

  const [rows, setRows] = useState<DarPositionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [summaryFilter, setSummaryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Finalized">("All");
  const [subStatusFilter, setSubStatusFilter] = useState<"All" | "SF-5" | "SF-11" | "SF-14(II)">("All");
  const [selectedDa, setSelectedDa] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  // Edit/Add Row Form states
  const [editForm, setEditForm] = useState<Partial<DarPositionRow>>({});

  // Pop up state for displaying truncated details fully
  const [selectedTextDetail, setSelectedTextDetail] = useState<{ title: string; content: string } | null>(null);

  // Ref for the scrollable table container
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Smooth scroll handler for horizontal movement
  const scrollTable = (direction: 'left' | 'right') => {
    if (tableContainerRef.current) {
      const amount = direction === 'left' ? -350 : 350;
      tableContainerRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  // Fetch real-time data
  useEffect(() => {
    const colRef = collection(db, "dar_positions");
    const unsubscribe = onSnapshot(colRef, 
      (snapshot) => {
        const fetchedRows: DarPositionRow[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetchedRows.push({
            id: docSnap.id,
            ...data,
            nameOfDa: formatDaName(data.nameOfDa || "")
          } as unknown as DarPositionRow);
        });
        // Sort by SN (Serial Number) numerically
        fetchedRows.sort((a, b) => (Number(a.sn) || 0) - (Number(b.sn) || 0));
        setRows(fetchedRows);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "dar_positions");
        toast.error("Failed to load DAR positions database records");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Quick Action: Add blank row
  const handleAddRow = async () => {
    try {
      const nextSn = rows.length > 0 ? Math.max(...rows.map(r => Number(r.sn) || 0)) + 1 : 1;
      const blankRow: Omit<DarPositionRow, "id"> = {
        sn: nextSn,
        name: "",
        designation: "OS",
        memorandumNo: "",
        natureOfCharge: "SF-5",
        issuedDate: "",
        nameOfDa: "Shri Atul Kumar",
        designationOfDa: "Sr.DPO",
        natureOfCase: "Non-Vig",
        presentStatus: "Pending",
        charges: "",
        dateOfDaNip: "",
        penalty: "",
      };

      const docRef = await addDoc(collection(db, "dar_positions"), {
        ...blankRow,
        createdAt: serverTimestamp()
      });

      // Automatically place this new row in edit mode
      setEditingId(docRef.id);
      setEditForm({ id: docRef.id, ...blankRow });
      toast.success(currentLang === 'hi' ? "नई खाली पंक्ति जोड़ी गई!" : "Added new dynamic row! Double click grid or click edit to write.");
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      toast.error(currentLang === 'hi' ? `डेटाबेस में पंक्ति जोड़ने में त्रुटि: ${errMsg}` : `Error adding row to database: ${errMsg}`);
      try {
        handleFirestoreError(e, OperationType.CREATE, "dar_positions");
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Begin cell / row edit
  const startEditingRow = (row: DarPositionRow) => {
    setEditingId(row.id);
    const initialStatus = row.presentStatus === "Ongoing" ? "Pending" : (row.presentStatus || "Pending");
    setEditForm({ 
      ...row,
      presentStatus: initialStatus
    });
  };

  // Cancel edit
  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Edit fields handler
  const handleFieldChange = (key: keyof DarPositionRow, value: any) => {
    setEditForm((prev) => ({
      ...prev,
      [key]: key === 'sn' ? Number(value) || 0 : value
    }));
  };

  // Save row
  const saveRow = async (id: string) => {
    try {
      const rowRef = doc(db, "dar_positions", id);
      const { id: _, createdAt: __, ...updatePayload } = editForm;
      
      await updateDoc(rowRef, {
        ...updatePayload,
        updatedAt: serverTimestamp()
      });

      setEditingId(null);
      setEditForm({});
      toast.success(currentLang === 'hi' ? "डेटा सफलतापूर्वक सुरक्षित किया गया!" : "Row database status updated successfully!");
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      toast.error(currentLang === 'hi' ? `त्रुटि: ${errMsg}` : `Error updating record: ${errMsg}`);
      try {
        handleFirestoreError(e, OperationType.UPDATE, `dar_positions/${id}`);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Delete row
  const deleteRow = async (id: string) => {
    try {
      const rowRef = doc(db, "dar_positions", id);
      await deleteDoc(rowRef);
      toast.success(currentLang === 'hi' ? "पंक्ति सफलतापूर्वक हटा दी गई" : "Row deleted successfully");
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      toast.error(currentLang === 'hi' ? `हटाने में त्रुटि: ${errMsg}` : `Error deleting record: ${errMsg}`);
      try {
        handleFirestoreError(e, OperationType.DELETE, `dar_positions/${id}`);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Export CSV
  const exportToCsv = () => {
    if (rows.length === 0) {
      toast.error("No data records available to export");
      return;
    }

    const csvData = rows.map((r) => ({
      "SN": r.sn,
      "NAME": r.name,
      "Designation": r.designation,
      "Memorandum No": r.memorandumNo,
      "Nature of Charge Memorandum": r.natureOfCharge,
      "Issued Date": r.issuedDate,
      "Name of DA": r.nameOfDa,
      "Designation of DA": r.designationOfDa,
      "Nature of Case": r.natureOfCase,
      "Present Status": r.presentStatus,
      "Charges": r.charges,
      "Date of DA's NIP": r.dateOfDaNip,
      "Penalty": r.penalty
    }));

    const csvStr = Papa.unparse(csvData);
    const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `DAR_POSITION_PERSONNEL_BRANCH_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file downloaded successfully!");
  };

  // Import CSV
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsedData = results.data as any[];
          if (parsedData.length === 0) {
            toast.error("No valid entries found in uploaded CSV file");
            return;
          }

          const originalHeaders = results.meta.fields || [];
          // Get all possible keys, ensuring we trim them
          const rowKeys = Object.keys(parsedData[0] || {});
          const headersSet = new Set([...originalHeaders, ...rowKeys]);
          const headers = Array.from(headersSet).map(h => String(h).trim()).filter(Boolean);

          toast.loading("Bulk syncing registry rows...", { id: "csv_import" });

          // Clean string helper for case & script insensitive matching
          const cleanStr = (s: string) => {
            return String(s)
              .toLowerCase()
              .replace(/[^a-z0-9\u0900-\u097f]/g, ""); // keeps english alphanumeric and Devanagari Hindi characters
          };

          interface FieldSpec {
            prop: string;
            aliases: string[];
            indexFallback: number;
            defaultVal: string;
          }

          const specs: FieldSpec[] = [
            {
              prop: "sn",
              aliases: ["sn", "sno", "sn.", "s.n.", "s.no", "serialno", "serialnumber", "क्रसं", "क्रमसंख्या", "sr", "no"],
              indexFallback: 0,
              defaultVal: ""
            },
            {
              prop: "name",
              aliases: ["name", "employeename", "empname", "nameofemployee", "कर्मचारीकानाम", "कर्मचारी", "नाम", "employee"],
              indexFallback: 1,
              defaultVal: ""
            },
            {
              prop: "designation",
              aliases: ["designation", "desig", "पदनाम", "पद", "empdesig", "employeedesignation", "emp_designation"],
              indexFallback: 2,
              defaultVal: "OS"
            },
            {
              prop: "memorandumNo",
              aliases: ["memorandumno", "memono", "memo.no", "memo", "memorandum", "ज्ञापनसंख्या", "ज्ञापन", "मेमो", "memo_no"],
              indexFallback: 3,
              defaultVal: ""
            },
            {
              prop: "natureOfCharge",
              aliases: ["natureofchargememorandum", "natureofcharge", "chargeofnature", "chargetype", "charge", "आरोपकीप्रकृति", "आरोप", "natureofchargememo", "natureofcharges", "charge_type"],
              indexFallback: 4,
              defaultVal: "SF-5"
            },
            {
              prop: "issuedDate",
              aliases: ["issueddate", "dateofissue", "date", "जारीदिनांक", "तिथि", "दिनांक", "जारीतिथि", "issued_date"],
              indexFallback: 5,
              defaultVal: ""
            },
            {
              prop: "nameOfDa",
              aliases: ["nameofda", "daname", "disciplinaryauthority", "अनुशासनात्मकअधिकारी", "डीएकानाम", "name_of_da"],
              indexFallback: 6,
              defaultVal: "Shri Atul Kumar"
            },
            {
              prop: "designationOfDa",
              aliases: ["designationofda", "dadesignation", "डीएकापद", "disciplinaryauthoritydesignation", "designation_of_da"],
              indexFallback: 7,
              defaultVal: "Sr.DPO"
            },
            {
              prop: "natureOfCase",
              aliases: ["natureofcase", "casenature", "vig/non-vig", "मामलेकीप्रकृति", "सतर्कता", "case_nature"],
              indexFallback: 8,
              defaultVal: "Non-Vig"
            },
            {
              prop: "presentStatus",
              aliases: ["presentstatus", "status", "state", "वर्तमानस्थिति", "स्थिति", "present_status"],
              indexFallback: 9,
              defaultVal: "Pending"
            },
            {
              prop: "charges",
              aliases: ["charges", "natureofoffense", "आरोपविवरण", "chargeparticulars", "chargelist"],
              indexFallback: 10,
              defaultVal: ""
            },
            {
              prop: "dateOfDaNip",
              aliases: ["dateofdasnip", "dateofdanip", "dateofnip", "nipdate", "एनआईपीकीतिथि", "एनआईपीतिथि", "nip_date"],
              indexFallback: 11,
              defaultVal: ""
            },
            {
              prop: "penalty",
              aliases: ["penalty", "penaltydetails", "दंडकाविवरण", "दंड", "जुर्माना", "penalty_details"],
              indexFallback: 12,
              defaultVal: ""
            }
          ];

          // Align schema: target field to EXACT CSV header name
          const fieldToHeaderKey: Record<string, string> = {};
          const matchedHeadersSet = new Set<string>();

          // Pass 1: Strict Exact or Normalized Match
          for (const spec of specs) {
            let matchedHeader: string | null = null;
            for (const header of headers) {
              const normHeader = cleanStr(header);
              if (spec.aliases.includes(normHeader)) {
                matchedHeader = header;
                break;
              }
            }
            if (matchedHeader) {
              fieldToHeaderKey[spec.prop] = matchedHeader;
              matchedHeadersSet.add(matchedHeader);
            }
          }

          // Pass 2: Substring matches for remaining (only longer words to prevent false positives)
          const unalignedSpecs = specs.filter(s => !fieldToHeaderKey[s.prop]);
          for (const spec of unalignedSpecs) {
            let matchedHeader: string | null = null;
            for (const header of headers) {
              if (matchedHeadersSet.has(header)) continue;
              const normHeader = cleanStr(header);
              for (const alias of spec.aliases) {
                if (alias.length > 4 && (normHeader.includes(alias) || alias.includes(normHeader))) {
                  matchedHeader = header;
                  break;
                }
              }
              if (matchedHeader) break;
            }
            if (matchedHeader) {
              fieldToHeaderKey[spec.prop] = matchedHeader;
              matchedHeadersSet.add(matchedHeader);
            }
          }

          // Pass 3: Hard Fallback by position index
          for (const spec of specs) {
            if (!fieldToHeaderKey[spec.prop]) {
              const idx = spec.indexFallback;
              if (headers.length > idx) {
                fieldToHeaderKey[spec.prop] = headers[idx];
              }
            }
          }

          // safe row extractor
          const getRowVal = (row: any, prop: string, defaultVal = ""): string => {
            const mappedHeader = fieldToHeaderKey[prop];
            if (!mappedHeader) return defaultVal;
            const val = row[mappedHeader];
            if (val === undefined || val === null) return defaultVal;
            return String(val).trim();
          };

          // Basic validation match
          for (let i = 0; i < parsedData.length; i++) {
            const rowItem = parsedData[i];
            
            const name = getRowVal(rowItem, "name", "");
            if (!name) continue; // Skip blank rows with no employee name

            const rawSn = getRowVal(rowItem, "sn", "");
            const sn = Number(rawSn) || (i + 1);
            
            const desig = getRowVal(rowItem, "designation", "OS") || "OS";
            const memo = getRowVal(rowItem, "memorandumNo", "");
            
            const chargeType = getRowVal(rowItem, "natureOfCharge", "SF-5") || "SF-5";
            let cleanedChargeType = "SF-5";
            const upperCharge = chargeType.toUpperCase().replace(/[\s_\-]/g, "");
            if (upperCharge.includes("SF11")) {
              cleanedChargeType = "SF-11";
            } else if (upperCharge.includes("SF5")) {
              cleanedChargeType = "SF-5";
            } else {
              cleanedChargeType = chargeType || "SF-5";
            }

            const issuedDate = getRowVal(rowItem, "issuedDate", "");
            
            const nameOfDa = formatDaName(getRowVal(rowItem, "nameOfDa", "Shri Atul Kumar") || "Shri Atul Kumar");
            const desigOfDa = getRowVal(rowItem, "designationOfDa", "Sr.DPO") || "Sr.DPO";
            
            const caseNature = getRowVal(rowItem, "natureOfCase", "Non-Vig") || "Non-Vig";
            let cleanedCaseNature = "Non-Vig";
            const lowerCaseNature = caseNature.toLowerCase();
            if (lowerCaseNature.includes("non") || lowerCaseNature.includes("गैर") || lowerCaseNature.includes("बिना")) {
              cleanedCaseNature = "Non-Vig";
            } else if (lowerCaseNature.includes("vig") || lowerCaseNature.includes("सतर") || lowerCaseNature.includes("विज") || lowerCaseNature === "v") {
              cleanedCaseNature = "Vig";
            }

            // Precise status parsing
            const rawStatus = getRowVal(rowItem, "presentStatus", "Pending").toLowerCase().trim();
            let mappedStatus: "Pending" | "Finalized" = "Pending";
            if (
              rawStatus.includes("final") || 
              rawStatus.includes("fin") || 
              rawStatus.includes("done") || 
              rawStatus.includes("complete") ||
              rawStatus === "f" ||
              rawStatus.includes("समाप्त") ||
              rawStatus.includes("निस्तारित") ||
              rawStatus.includes("पूर्ण") ||
              rawStatus.includes("yes")
            ) {
              mappedStatus = "Finalized";
            } else {
              mappedStatus = "Pending";
            }

            const charges = getRowVal(rowItem, "charges", "");
            const nipDate = getRowVal(rowItem, "dateOfDaNip", "");
            const penalty = getRowVal(rowItem, "penalty", "");

            const newRecord: Omit<DarPositionRow, "id"> = {
              sn,
              name,
              designation: desig,
              memorandumNo: memo,
              natureOfCharge: cleanedChargeType,
              issuedDate,
              nameOfDa,
              designationOfDa: desigOfDa,
              natureOfCase: cleanedCaseNature,
              presentStatus: mappedStatus,
              charges,
              dateOfDaNip: nipDate,
              penalty,
            };

            // Push each to firestore
            await addDoc(collection(db, "dar_positions"), {
              ...newRecord,
              createdAt: serverTimestamp()
            });
          }

          toast.success("Bilingual CSV import processed and synced safely!", { id: "csv_import" });
          setFileInputKey(Date.now()); // reset file input
        } catch (err) {
          console.error(err);
          toast.error("Import failed due to data matching errors", { id: "csv_import" });
        }
      }
    });
  };

  // Clear entire register database
  const handleClearDatabase = async () => {
    try {
      toast.loading("Purging records...", { id: "purge" });
      const deletePromises = rows.map(r => deleteDoc(doc(db, "dar_positions", r.id)));
      await Promise.all(deletePromises);
      toast.success("Database purged", { id: "purge" });
    } catch (e) {
      toast.error("Failed to purge database records", { id: "purge" });
    }
  };

  // Counts for the summary panel
  const sf5Pending = rows.filter(r => (r.natureOfCharge === "SF-5" || r.natureOfCharge?.startsWith("SF-5")) && (r.presentStatus === "Pending" || r.presentStatus === "Ongoing" || !r.presentStatus)).length;
  const sf5Finalized = rows.filter(r => (r.natureOfCharge === "SF-5" || r.natureOfCharge?.startsWith("SF-5")) && r.presentStatus === "Finalized").length;
  const sf11Pending = rows.filter(r => (r.natureOfCharge === "SF-11" || r.natureOfCharge?.startsWith("SF-11")) && (r.presentStatus === "Pending" || r.presentStatus === "Ongoing" || !r.presentStatus)).length;
  const sf11Finalized = rows.filter(r => (r.natureOfCharge === "SF-11" || r.natureOfCharge?.startsWith("SF-11")) && r.presentStatus === "Finalized").length;

  // Dynamic DA performance matrix calculation
  const daStats = React.useMemo(() => {
    const statsMap: Record<string, {
      name: string;
      designation: string;
      sf5Total: number;
      sf5Pending: number;
      sf11Total: number;
      sf11Pending: number;
      sf14Total: number;
      sf14Pending: number;
    }> = {};

    rows.forEach(r => {
      const daName = (r.nameOfDa || "").trim();
      if (!daName) return; // Skip blank DA names
      const desig = (r.designationOfDa || "DA").trim();
      const charge = (r.natureOfCharge || "").trim();
      const isSF5 = charge === "SF-5" || charge.startsWith("SF-5");
      const isSF11 = charge === "SF-11" || charge.startsWith("SF-11");
      const isSF14 = charge === "SF-14(II)" || charge === "SF-14" || charge.startsWith("SF-14");
      const isPending = r.presentStatus === "Pending" || r.presentStatus === "Ongoing" || !r.presentStatus;

      if (!statsMap[daName]) {
        statsMap[daName] = {
          name: daName,
          designation: desig,
          sf5Total: 0,
          sf5Pending: 0,
          sf11Total: 0,
          sf11Pending: 0,
          sf14Total: 0,
          sf14Pending: 0,
        };
      }

      // Update stats
      if (isSF5) {
        statsMap[daName].sf5Total += 1;
        if (isPending) statsMap[daName].sf5Pending += 1;
      } else if (isSF11) {
        statsMap[daName].sf11Total += 1;
        if (isPending) statsMap[daName].sf11Pending += 1;
      } else if (isSF14) {
        statsMap[daName].sf14Total += 1;
        if (isPending) statsMap[daName].sf14Pending += 1;
      }
    });

    return Object.values(statsMap);
  }, [rows]);

  // Filter by summary status card selection
  const getSummaryFilteredRows = () => {
    if (!summaryFilter) return rows;
    return rows.filter((r) => {
      const isSF5 = r.natureOfCharge === "SF-5" || r.natureOfCharge?.startsWith("SF-5");
      const isSF11 = r.natureOfCharge === "SF-11" || r.natureOfCharge?.startsWith("SF-11");
      const isFinalized = r.presentStatus === "Finalized";
      const isPendingOrOngoing = r.presentStatus === "Pending" || r.presentStatus === "Ongoing" || !r.presentStatus;

      if (summaryFilter === "sf5_pending") return isSF5 && isPendingOrOngoing;
      if (summaryFilter === "sf5_finalized") return isSF5 && isFinalized;
      if (summaryFilter === "sf11_pending") return isSF11 && isPendingOrOngoing;
      if (summaryFilter === "sf11_finalized") return isSF11 && isFinalized;
      return true;
    });
  };

  const filteredRows = getSummaryFilteredRows()
    .filter((r) => {
      if (statusFilter === "All") return true;
      const isFinalized = r.presentStatus === "Finalized";
      
      // Major status check (Pending vs Finalized)
      const matchesMajor = statusFilter === "Finalized" ? isFinalized : !isFinalized;
      if (!matchesMajor) return false;

      // Sub-status check (All vs SF-5 vs SF-11 vs SF-14(II))
      if (subStatusFilter === "SF-5") {
        return r.natureOfCharge === "SF-5" || r.natureOfCharge?.startsWith("SF-5");
      }
      if (subStatusFilter === "SF-11") {
        return r.natureOfCharge === "SF-11" || r.natureOfCharge?.startsWith("SF-11");
      }
      if (subStatusFilter === "SF-14(II)") {
        return r.natureOfCharge === "SF-14(II)" || r.natureOfCharge === "SF-14" || r.natureOfCharge?.startsWith("SF-14");
      }
      return true;
    })
    .filter((r) => {
      if (!selectedDa) return true;
      return (r.nameOfDa || "").trim().toLowerCase() === selectedDa.trim().toLowerCase();
    })
    .filter((r) => {
      const term = searchQuery.toLowerCase();
      return (
        (r.name || "").toLowerCase().includes(term) ||
        (r.memorandumNo || "").toLowerCase().includes(term) ||
        (r.charges || "").toLowerCase().includes(term) ||
        (r.designation || "").toLowerCase().includes(term) ||
        (r.penalty || "").toLowerCase().includes(term) ||
        (r.nameOfDa || "").toLowerCase().includes(term)
      );
    });

  return (
    <div className="space-y-4 h-full flex flex-col overflow-hidden">
      {/* Title & Headline Header Panel */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-100 tracking-wide uppercase">
                {currentLang === 'hi' 
                  ? "★ कार्मिक शाखा की डीएआर स्थिति" 
                  : "★ DAR POSITION OF PERSONNEL BRANCH"}
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {currentLang === 'hi'
                  ? "अनुशासन विभाग की वास्तविक समय स्थिति पत्रक और संपादन ग्रिड"
                  : "Interactive real-time database ledger and Excel-style spreadsheets editor for office use."}
              </p>
            </div>
          </div>
        </div>

        {/* Top Control buttons panel */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Add row */}
          <button
            onClick={handleAddRow}
            className="px-4 py-2 bg-gradient-to-b from-indigo-600 to-indigo-700 hover:brightness-110 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all active:translate-y-[2px] flex items-center gap-1.5 cursor-pointer select-none"
          >
            <Plus size={14} />
            {currentLang === 'hi' ? "नई पंक्ति जोड़ें" : "Add New Row"}
          </button>

          {/* Export CSV */}
          <button
            onClick={exportToCsv}
            className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all active:translate-y-[1px] flex items-center gap-1.5 cursor-pointer select-none"
            title="Download the entire ledger to Excel-friendly CSV"
          >
            <Download size={14} />
            {currentLang === 'hi' ? "एक्सेल डाउनलोड" : "Export Backup (.CSV)"}
          </button>

          {/* Import CSV */}
          <label className="px-3.5 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all active:translate-y-[1px] flex items-center gap-1.5 cursor-pointer select-none">
            <Upload size={14} />
            <span>{currentLang === 'hi' ? "एक्सेल अपलोड" : "Import (.CSV)"}</span>
            <input 
              key={fileInputKey}
              type="file" 
              accept=".csv" 
              onChange={handleCsvUpload} 
              className="hidden" 
            />
          </label>

          {/* Clear database completely */}
          {rows.length > 0 && (
            <div className="relative">
              {!showPurgeConfirm ? (
                <button
                  onClick={() => setShowPurgeConfirm(true)}
                  className="px-3.5 py-2 bg-red-950/45 border border-red-900/60 hover:bg-red-950 text-red-400 hover:text-red-300 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:translate-y-[1px] flex items-center gap-1.5 cursor-pointer select-none"
                  title="Delete all rows in Firestore database"
                >
                  <Trash2 size={13} />
                  {currentLang === 'hi' ? "पूरा साफ करें" : "Purge All"}
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-red-950/90 border border-red-700 p-1.5 rounded-xl animate-bounce shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                  <span className="text-[10px] font-black uppercase text-red-300 px-1">
                    {currentLang === 'hi' ? "विशेष चेतावनी: क्या आप निश्चित हैं?" : "Are you sure?"}
                  </span>
                  <button
                    onClick={() => {
                      handleClearDatabase();
                      setShowPurgeConfirm(false);
                    }}
                    className="px-2 py-1 bg-red-650 hover:bg-red-500 text-white rounded text-[10px] font-black uppercase cursor-pointer"
                  >
                    {currentLang === 'hi' ? "हाँ, हटाएं (YES)" : "Yes, Purge"}
                  </button>
                  <button
                    onClick={() => setShowPurgeConfirm(false)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-black uppercase cursor-pointer"
                  >
                    {currentLang === 'hi' ? "रद्द (NO)" : "Cancel"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Summary Cards Tab-like Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: SF-5 Pending */}
        <div 
          onClick={() => setSummaryFilter(summaryFilter === "sf5_pending" ? null : "sf5_pending")}
          className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none relative overflow-hidden ${
            summaryFilter === "sf5_pending"
              ? "bg-[#7f1d1d]/45 border-[#ef4444]/80 shadow-[0_0_15px_rgba(239,68,68,0.25)] scale-[1.02]"
              : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/70"
          }`}
        >
          <div className="absolute top-0 right-0 p-3 opacity-15">
            <AlertTriangle className="w-16 h-16 text-[#ef4444]" />
          </div>
          <div className="text-[11px] font-black uppercase tracking-wider text-red-400">
            {currentLang === 'hi' ? "★ SF-5 पेंडिंग / जारी" : "★ SF-5 Pending / Ongoing"}
          </div>
          <div className="text-3xl font-black text-slate-100 mt-1">
            {sf5Pending}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-semibold">
            {currentLang === 'hi' ? "विवरण देखने के लिए क्लिक करें" : "Click to view details"}
          </p>
          {summaryFilter === "sf5_pending" && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-ping" />
          )}
        </div>

        {/* Card 2: SF-5 Finalized */}
        <div 
          onClick={() => setSummaryFilter(summaryFilter === "sf5_finalized" ? null : "sf5_finalized")}
          className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none relative overflow-hidden ${
            summaryFilter === "sf5_finalized"
              ? "bg-[#064e3b]/45 border-[#10b981]/80 shadow-[0_0_15px_rgba(16,185,129,0.25)] scale-[1.02]"
              : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/70"
          }`}
        >
          <div className="absolute top-0 right-0 p-3 opacity-15">
            <CheckCircle className="w-16 h-16 text-[#10b981]" />
          </div>
          <div className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
            {currentLang === 'hi' ? "★ SF-5 पूर्ण (Finalized)" : "★ SF-5 Finalized"}
          </div>
          <div className="text-3xl font-black text-slate-100 mt-1">
            {sf5Finalized}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-semibold">
            {currentLang === 'hi' ? "विवरण देखने के लिए क्लिक करें" : "Click to view details"}
          </p>
          {summaryFilter === "sf5_finalized" && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          )}
        </div>

        {/* Card 3: SF-11 Pending */}
        <div 
          onClick={() => setSummaryFilter(summaryFilter === "sf11_pending" ? null : "sf11_pending")}
          className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none relative overflow-hidden ${
            summaryFilter === "sf11_pending"
              ? "bg-[#78350f]/40 border-[#eab308]/80 shadow-[0_0_15px_rgba(234,179,8,0.25)] scale-[1.02]"
              : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/70"
          }`}
        >
          <div className="absolute top-0 right-0 p-3 opacity-15">
            <AlertTriangle className="w-16 h-16 text-[#eab308]" />
          </div>
          <div className="text-[11px] font-black uppercase tracking-wider text-amber-400">
            {currentLang === 'hi' ? "★ SF-11 पेंडिंग / जारी" : "★ SF-11 Pending / Ongoing"}
          </div>
          <div className="text-3xl font-black text-slate-100 mt-1">
            {sf11Pending}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-semibold">
            {currentLang === 'hi' ? "विवरण देखने के लिए क्लिक करें" : "Click to view details"}
          </p>
          {summaryFilter === "sf11_pending" && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          )}
        </div>

        {/* Card 4: SF-11 Finalized */}
        <div 
          onClick={() => setSummaryFilter(summaryFilter === "sf11_finalized" ? null : "sf11_finalized")}
          className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer select-none relative overflow-hidden ${
            summaryFilter === "sf11_finalized"
              ? "bg-[#1e3a8a]/45 border-[#3b82f6]/80 shadow-[0_0_15px_rgba(59,130,246,0.25)] scale-[1.02]"
              : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/70"
          }`}
        >
          <div className="absolute top-0 right-0 p-3 opacity-15">
            <CheckCircle className="w-16 h-16 text-[#3b82f6]" />
          </div>
          <div className="text-[11px] font-black uppercase tracking-wider text-blue-400">
            {currentLang === 'hi' ? "★ SF-11 पूर्ण (Finalized)" : "★ SF-11 Finalized"}
          </div>
          <div className="text-3xl font-black text-slate-100 mt-1">
            {sf11Finalized}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-semibold">
            {currentLang === 'hi' ? "विवरण देखने के लिए क्लिक करें" : "Click to view details"}
          </p>
        </div>
      </div>

      {/* Dynamic DA-wise Status Performance Table Column */}
      <div className="bg-slate-900/10 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-md bg-slate-950/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-black uppercase text-indigo-400 tracking-wider">
              {currentLang === 'hi' ? "★ अनुशासन अधिकारी (DA) वार स्थिति एवं विश्लेषण" : "★ Disciplinary Authority (DA) Wise Position Stats"}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {currentLang === 'hi'
                ? "किस DA ने कितने SF-5/SF-11 जारी किए और कितने अभी पेंडिंग हैं (फ़िल्टर करने के लिए डीए प्रविष्टि पर क्लिक करें)"
                : "Dynamic report of SF-5 and SF-11 issued and pending counts per Disciplinary Authority. Click to filter."}
            </p>
          </div>
          {selectedDa && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md font-bold flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span>{currentLang === 'hi' ? `सक्रिय फ़िल्टर: ${selectedDa}` : `Active filter: ${selectedDa}`}</span>
              </span>
              <button 
                onClick={() => setSelectedDa(null)}
                className="text-[10px] px-2 py-0.5 bg-red-950/40 hover:bg-red-900 border border-red-800 text-red-200 rounded font-black uppercase cursor-pointer"
              >
                {currentLang === 'hi' ? "साफ करें" : "Reset"}
              </button>
            </div>
          )}
        </div>

        {daStats.length === 0 ? (
          <p className="text-[11px] text-slate-500 italic py-1">
            {currentLang === 'hi' ? "आंकड़े तैयार करने के लिए कोई DA प्रविष्टि उपलब्ध नहीं है" : "No DA statistics available. Add records with DA details to view analysis."}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {daStats.map((da) => {
              const isSelected = selectedDa?.trim().toLowerCase() === da.name.trim().toLowerCase();
              return (
                <div 
                  key={da.name}
                  onClick={() => setSelectedDa(isSelected ? null : da.name)}
                  className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer select-none flex flex-col justify-between ${
                    isSelected 
                      ? "bg-indigo-950/40 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.2)]" 
                      : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-1.5 mb-2">
                    <div>
                      <span className="text-xs font-black text-slate-200 block">{da.name}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">{da.designation}</span>
                    </div>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                    <div className="bg-slate-950/30 p-1.5 rounded-lg border border-slate-900/50">
                      <div className="font-extrabold text-[#ef4444] text-[8px] uppercase tracking-wider mb-0.5">SF-5</div>
                      <div className="flex flex-col gap-0.5 text-slate-300 font-semibold">
                        <div className="flex justify-between gap-1">
                          <span>{currentLang === 'hi' ? "कुल:" : "Tot:"}</span>
                          <strong className="text-slate-100">{da.sf5Total}</strong>
                        </div>
                        <div className="flex justify-between gap-1">
                          <span>{currentLang === 'hi' ? "लंबित:" : "Pend:"}</span>
                          <strong className={da.sf5Pending > 0 ? "text-[#ef4444]" : "text-slate-400"}>{da.sf5Pending}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-950/30 p-1.5 rounded-lg border border-slate-900/50">
                      <div className="font-extrabold text-[#eab308] text-[8px] uppercase tracking-wider mb-0.5">SF-11</div>
                      <div className="flex flex-col gap-0.5 text-slate-300 font-semibold">
                        <div className="flex justify-between gap-1">
                          <span>{currentLang === 'hi' ? "कुल:" : "Tot:"}</span>
                          <strong className="text-slate-100">{da.sf11Total}</strong>
                        </div>
                        <div className="flex justify-between gap-1">
                          <span>{currentLang === 'hi' ? "लंबित:" : "Pend:"}</span>
                          <strong className={da.sf11Pending > 0 ? "text-[#eab308]" : "text-slate-400"}>{da.sf11Pending}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-950/30 p-1.5 rounded-lg border border-slate-900/50">
                      <div className="font-extrabold text-[#3b82f6] text-[8px] uppercase tracking-wider mb-0.5">SF-14</div>
                      <div className="flex flex-col gap-0.5 text-slate-300 font-semibold">
                        <div className="flex justify-between gap-1">
                          <span>{currentLang === 'hi' ? "कुल:" : "Tot:"}</span>
                          <strong className="text-slate-100">{da.sf14Total}</strong>
                        </div>
                        <div className="flex justify-between gap-1">
                          <span>{currentLang === 'hi' ? "लंबित:" : "Pend:"}</span>
                          <strong className={da.sf14Pending > 0 ? "text-[#3b82f6]" : "text-slate-400"}>{da.sf14Pending}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {summaryFilter && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="font-semibold text-indigo-300">
              {currentLang === 'hi' 
                ? `सक्रिय फ़िल्टर: केवल ${
                    summaryFilter === 'sf5_pending' ? 'SF-5 पेंडिंग/जारी' :
                    summaryFilter === 'sf5_finalized' ? 'SF-5 पूर्ण हुआ' :
                    summaryFilter === 'sf11_pending' ? 'SF-11 पेंडिंग/जारी' : 'SF-11 पूर्ण हुआ'
                  } वाले मामले दिखाए जा रहे हैं` 
                : `Active Filter: Showing only ${
                    summaryFilter === 'sf5_pending' ? 'SF-5 Pending/Ongoing' :
                    summaryFilter === 'sf5_finalized' ? 'SF-5 Finalized' :
                    summaryFilter === 'sf11_pending' ? 'SF-11 Pending/Ongoing' : 'SF-11 Finalized'
                  } records`}
            </span>
          </div>
          <button 
            onClick={() => setSummaryFilter(null)}
            className="px-2.5 py-1 bg-indigo-900/40 hover:bg-indigo-900 border border-indigo-700 rounded-lg text-[10px] font-bold text-indigo-200 uppercase cursor-pointer"
          >
            {currentLang === 'hi' ? "फ़िल्टर हटाएं (RESET)" : "Clear Filter"}
          </button>
        </div>
      )}

      {/* Live Search and stats panel */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-slate-950/50 border border-slate-900 rounded-2xl p-4">
        {/* Search Input bar */}
        <div className="relative w-full lg:w-80">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search size={15} />
          </span>
          <input
            type="text"
            placeholder={currentLang === 'hi' ? "नाम, संख्या या अपराध से खोजें..." : "Filter by Name, Memo, Penalty, Charges..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-800 rounded-xl text-xs bg-slate-950 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Interactive Status-Based Filter Tab Group */}
        <div className="flex items-center gap-1.5 bg-slate-905/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setStatusFilter("All");
              setSubStatusFilter("All");
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer select-none ${
              statusFilter === "All"
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            {currentLang === 'hi' ? "सभी मामले" : "All Cases"}
          </button>
          
          <button
            onClick={() => {
              setStatusFilter("Pending");
              setSubStatusFilter("All");
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer select-none ${
              statusFilter === "Pending"
                ? "bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-pulse"
                : "text-red-400 hover:text-red-300 hover:bg-red-950/20"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            {currentLang === 'hi' ? "पेंडिंग केवल (PENDING)" : "Pending Only"}
          </button>

          <button
            onClick={() => {
              setStatusFilter("Finalized");
              setSubStatusFilter("All");
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer select-none ${
              statusFilter === "Finalized"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/20"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {currentLang === 'hi' ? "पूर्ण (FINALIZED)" : "Finalized Only"}
          </button>
        </div>

        {/* Counter of cases */}
        <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
          <div>
            {currentLang === 'hi' ? "कुल प्रविष्टियां" : "Total Cases"}:{" "}
            <span className="text-indigo-400 font-extrabold">{rows.length}</span>
          </div>
          {(searchQuery || statusFilter !== "All") && (
            <div className="bg-slate-900 border border-slate-800 px-2 py-1 rounded">
              {currentLang === 'hi' ? "परिणाम" : "Filtered Matches"}:{" "}
              <span className="text-amber-400 font-extrabold">{filteredRows.length}</span>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Sub-Status Interactive Filtering row */}
      {statusFilter !== "All" && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-slate-950/30 border border-slate-900 rounded-2xl animate-fade-in">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${statusFilter === "Pending" ? "bg-red-500 animate-pulse" : "bg-emerald-500"} shrink-0`} />
            <span className="text-xs font-black uppercase tracking-wide text-slate-300">
              {currentLang === 'hi'
                ? `सक्रिय श्रेणी: ${statusFilter === 'Pending' ? 'पेंडिंग मामले' : 'पूर्ण हुए मामले'}`
                : `Active Category: ${statusFilter === 'Pending' ? 'Pending Cases' : 'Finalized Cases'}`}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Sub-option 1: All in this category */}
            <button
              onClick={() => setSubStatusFilter("All")}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                subStatusFilter === "All"
                  ? statusFilter === "Pending"
                    ? "bg-red-950/65 border-red-500/80 text-red-200 shadow-[0_0_10px_rgba(239,68,68,0.25)]"
                    : "bg-emerald-950/65 border-emerald-500/80 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.25)]"
                  : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
              }`}
            >
              {currentLang === 'hi' 
                ? (statusFilter === "Pending" ? "★ सभी पेंडिंग (ALL)" : "★ सभी पूर्ण (ALL)")
                : (statusFilter === "Pending" ? "★ All Pending" : "★ All Finalized")}
            </button>

            {/* Sub-option 2: SF-5 in this category */}
            <button
              onClick={() => setSubStatusFilter("SF-5")}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                subStatusFilter === "SF-5"
                  ? statusFilter === "Pending"
                    ? "bg-red-600 border-red-400 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                    : "bg-emerald-600 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                  : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
              }`}
            >
              {currentLang === 'hi'
                ? (statusFilter === "Pending" ? "● SF-5 पेंडिंग" : "● SF-5 पूर्ण")
                : (statusFilter === "Pending" ? "● SF-5 Pending" : "● SF-5 Finalized")}
            </button>

            {/* Sub-option 3: SF-11 in this category */}
            <button
              onClick={() => setSubStatusFilter("SF-11")}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                subStatusFilter === "SF-11"
                  ? statusFilter === "Pending"
                    ? "bg-red-600 border-red-400 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                    : "bg-emerald-600 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                  : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
              }`}
            >
              {currentLang === 'hi'
                ? (statusFilter === "Pending" ? "● SF-11 पेंडिंग" : "● SF-11 पूर्ण")
                : (statusFilter === "Pending" ? "● SF-11 Pending" : "● SF-11 Finalized")}
            </button>

            {/* Sub-option 4: SF-14(II) in this category */}
            <button
              onClick={() => setSubStatusFilter("SF-14(II)")}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                subStatusFilter === "SF-14(II)"
                  ? statusFilter === "Pending"
                    ? "bg-red-600 border-red-400 text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                    : "bg-emerald-600 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                  : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
              }`}
            >
              {currentLang === 'hi'
                ? (statusFilter === "Pending" ? "● SF-14(II) पेंडिंग" : "● SF-14(II) पूर्ण")
                : (statusFilter === "Pending" ? "● SF-14(II) Pending" : "● SF-14(II) Finalized")}
            </button>
          </div>
        </div>
      )}

      {/* THE EMBEDDED EXCEL SHEET CONTAINER */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <RotateCcw className="animate-spin text-indigo-500" size={32} />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Loading dynamic spreadsheet data matrix...
          </p>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="border border-dashed border-slate-800 rounded-2xl p-12 text-center text-slate-500 bg-slate-950/20">
          <FileSpreadsheet className="mx-auto mb-4 opacity-25" size={48} />
          <p className="text-sm font-bold text-slate-400">
            {currentLang === 'hi' ? "कोई प्रविष्टि नहीं मिली" : "No DAR database records found"}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {currentLang === 'hi'
              ? "नई पंक्ति जोड़ने के लिए ऊपर दिए गए बटन का उपयोग करें या एक्सेल फाइल अपलोड करें।"
              : "Click 'Add New Row' to create a spreadsheet line item, or upload a CSV file to load offline ledgers."}
          </p>
        </div>
      ) : (
        <>
          {/* Table horizontal smooth scroll assistant controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-900/40 border border-slate-850/80 px-4 py-2.5 rounded-xl text-xs">
            <div className="flex items-center gap-2 text-slate-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] animate-pulse shrink-0" />
              <span>
                {currentLang === 'hi' 
                  ? "💡 टेबल को दाएँ/बाएँ खिसकाने के लिए बटन दबाएं या Shift दबाकर माउस व्हील घुमाएँ:" 
                  : "💡 Click arrow buttons below to scroll table horizontally or press Shift + Mouse Wheel:"}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => scrollTable('left')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-slate-750 text-[11px] font-black uppercase rounded-lg transition-all active:translate-y-[1px] cursor-pointer"
                title="Scroll Table Left / बाएँ स्क्रॉल करें"
              >
                <ChevronLeft size={14} className="text-[#38bdf8]" />
                <span>{currentLang === 'hi' ? "बाएँ (Left)" : "◀ Scroll Left"}</span>
              </button>

              <button 
                onClick={() => scrollTable('right')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-slate-750 text-[11px] font-black uppercase rounded-lg transition-all active:translate-y-[1px] cursor-pointer"
                title="Scroll Table Right / दाएँ स्क्रॉल करें"
              >
                <span>{currentLang === 'hi' ? "दाएँ (Right)" : "Scroll Right ▶"}</span>
                <ChevronRight size={14} className="text-[#38bdf8]" />
              </button>
            </div>
          </div>

          <div 
            ref={tableContainerRef}
            className="w-full flex-1 min-h-[350px] max-h-[calc(100vh-360px)] lg:max-h-[calc(100vh-450px)] overflow-auto border border-slate-900 rounded-2xl bg-slate-950 shadow-2xl relative scrollbar-thin scrollbar-thumb-slate-850"
          >
          {/* Main Excel Sheet Style Table */}
          <table className="w-full text-left border-collapse table-auto text-[13px] min-w-[1240px]">
            <thead className="sticky top-0 z-20">
              {/* Sheet headers - colored in elegant gold/amber like traditional register books */}
              <tr className="bg-amber-950 border-b border-slate-900 divide-x divide-slate-900/80">
                <th className="py-1.5 px-2 text-center text-[#f1f5f9] font-black uppercase tracking-wider w-[40px] bg-[#2d1203]">
                  SN
                </th>
                <th className="py-1.5 px-2 text-[#f1f5f9] font-black uppercase tracking-wider w-[120px] bg-[#2d1203]">
                  Employee Name
                </th>
                <th className="py-1.5 px-2 text-[#f1f5f9] font-black uppercase tracking-wider w-[90px] bg-[#2d1203]">
                  Designation
                </th>
                <th className="py-1.5 px-2 text-[#f1f5f9] font-black uppercase tracking-wider w-[130px] bg-[#2d1203]">
                  Memorandum No
                </th>
                <th className="py-1.5 px-1.5 text-center text-[#f1f5f9] font-black uppercase tracking-wider w-[80px] bg-[#2d1203]">
                  Nature of Charge
                </th>
                <th className="py-1.5 px-1.5 text-center text-[#f1f5f9] font-black uppercase tracking-wider w-[80px] bg-[#2d1203]">
                  Issued Date
                </th>
                <th className="py-1.5 px-2 text-[#f1f5f9] font-black uppercase tracking-wider w-[100px] bg-[#2d1203]">
                  Name of DA
                </th>
                <th className="py-1.5 px-1.5 text-center text-[#f1f5f9] font-black uppercase tracking-wider w-[80px] bg-[#2d1203]">
                  Designation DA
                </th>
                <th className="py-1.5 px-1.5 text-center text-[#f1f5f9] font-black uppercase tracking-wider w-[75px] bg-[#2d1203]">
                  Nature Case
                </th>
                <th className="py-1.5 px-1.5 text-center text-[#f1f5f9] font-black uppercase tracking-wider w-[90px] bg-[#2d1203]">
                  Present Status
                </th>
                <th className="py-1.5 px-2 text-[#f1f5f9] font-black uppercase tracking-wider max-w-[150px] bg-[#2d1203]">
                  Charges
                </th>
                <th className="py-1.5 px-1.5 text-center text-[#f1f5f9] font-black uppercase tracking-wider w-[80px] bg-[#2d1203]">
                  Date of NIP
                </th>
                <th className="py-1.5 px-2 text-[#f1f5f9] font-black uppercase tracking-wider w-[110px] bg-[#2d1203]">
                  Penalty Details
                </th>
                <th className="py-1.5 px-1.5 text-center text-[#f1f5f9] font-black uppercase tracking-wider w-[80px] bg-[#2d1203]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60 font-semibold">
              {filteredRows.map((row) => {
                const isEditing = editingId === row.id;

                return (
                  <tr 
                    key={row.id} 
                    className={`hover:bg-slate-900/35 transition-colors divide-x divide-slate-900/40 ${
                      isEditing ? "bg-indigo-950/25" : ""
                    }`}
                  >
                    {/* SN COLUMN */}
                    <td className="py-1 px-1.5 text-center font-bold text-slate-400">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editForm.sn || ""}
                          onChange={(e) => handleFieldChange("sn", e.target.value)}
                          className="w-full text-center bg-slate-950 border border-indigo-500 rounded p-0.5 text-slate-100 font-extrabold focus:outline-none"
                        />
                      ) : (
                        row.sn
                      )}
                    </td>

                    {/* NAME COLUMN */}
                    <td 
                      className={`py-1.5 px-2 font-bold text-slate-200 min-w-[120px] max-w-[180px] ${
                        !isEditing ? "cursor-pointer hover:bg-slate-900/80 hover:text-white transition-all group/cell" : ""
                      }`}
                      title={row.name && !isEditing ? "Click to view full name" : ""}
                      onClick={() => {
                        if (!isEditing && row.name) {
                          setSelectedTextDetail({
                            title: "Employee Name / कर्मचारी का नाम",
                            content: row.name
                          });
                        }
                      }}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.name || ""}
                          onChange={(e) => handleFieldChange("name", e.target.value)}
                          className="w-full bg-slate-950 border border-indigo-500 rounded p-0.5 text-slate-100 focus:outline-none font-bold text-xs"
                          placeholder="e.g. Shri Biren Oraon"
                        />
                      ) : (
                        <div className="flex items-center justify-between gap-1 overflow-hidden">
                          <span className="truncate">{row.name || <span className="text-slate-600 italic">No Name Entered</span>}</span>
                          {row.name && (
                            <span className="opacity-0 group-hover/cell:opacity-100 text-[9px] text-[#38bdf8] bg-slate-950 px-1 py-0.5 rounded transition-opacity shrink-0">
                              🔍 Details
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* DESIGNATION COLUMN */}
                    <td 
                      className={`py-1.5 px-2 font-bold text-slate-300 min-w-[90px] ${
                        !isEditing ? "cursor-pointer hover:bg-slate-900/80 hover:text-white transition-all group/cell" : ""
                      }`}
                      title={row.designation && !isEditing ? "Click to view designation" : ""}
                      onClick={() => {
                        if (!isEditing && row.designation) {
                          setSelectedTextDetail({
                            title: "Employee Designation / कर्मचारी का पद",
                            content: row.designation
                          });
                        }
                      }}
                    >
                      {isEditing ? (
                        <div className="space-y-0.5">
                          <select
                            value={DESIGNATIONS.slice(0, -1).includes(editForm.designation || "") ? editForm.designation : "Others"}
                            onChange={(e) => handleFieldChange("designation", e.target.value)}
                            className="w-full bg-slate-950 border border-indigo-500 rounded p-0.5 text-slate-100 focus:outline-none text-xs"
                          >
                            {DESIGNATIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          {(!DESIGNATIONS.slice(0, -1).includes(editForm.designation || "") || editForm.designation === "Others") && (
                            <input
                              type="text"
                              value={editForm.designation === "Others" ? "" : (editForm.designation || "")}
                              onChange={(e) => handleFieldChange("designation", e.target.value)}
                              placeholder="Enter Designation..."
                              className="w-full bg-slate-900 border border-amber-500/80 rounded p-0.5 text-[10px] text-amber-200 placeholder-slate-500 focus:outline-none"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-1">
                          <span className="bg-slate-900/60 px-1.5 py-0.5 rounded text-indigo-300 text-[11.5px] border border-indigo-950 font-extrabold truncate">
                            {row.designation}
                          </span>
                          {row.designation && (
                            <span className="opacity-0 group-hover/cell:opacity-100 text-[9px] text-[#38bdf8] bg-slate-950 px-1 py-0.5 rounded transition-opacity shrink-0">
                              🔍 Details
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* MEMORANDUM NO COLUMN */}
                    <td 
                      className={`py-1.5 px-2 text-[#f1f5f9] font-mono font-bold min-w-[130px] max-w-[160px] ${
                        !isEditing ? "cursor-pointer hover:bg-slate-900/80 hover:text-white transition-all group/cell" : ""
                      }`}
                      title={row.memorandumNo && !isEditing ? "Click to view full memorandum" : ""}
                      onClick={() => {
                        if (!isEditing && row.memorandumNo) {
                          setSelectedTextDetail({
                            title: "Memorandum Number / ज्ञापन संख्या",
                            content: row.memorandumNo
                          });
                        }
                      }}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.memorandumNo || ""}
                          onChange={(e) => handleFieldChange("memorandumNo", e.target.value)}
                          className="w-full bg-slate-950 border border-indigo-500 rounded p-0.5 text-slate-100 focus:outline-none font-mono text-xs"
                          placeholder="MEMO..."
                        />
                      ) : (
                        <div className="flex items-center justify-between gap-1 overflow-hidden">
                          <span className="truncate">{row.memorandumNo || <span className="text-slate-600">-</span>}</span>
                          {row.memorandumNo && (
                            <span className="opacity-0 group-hover/cell:opacity-100 text-[8px] text-[#38bdf8] bg-slate-950 px-1 py-0.5 rounded transition-opacity shrink-0 font-sans">
                              🔍 Details
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* NATURE OF CHARGE */}
                    <td className="py-1.5 px-1.5 text-center min-w-[80px]">
                      {isEditing ? (
                        <div className="space-y-0.5">
                          <select
                            value={NATURE_OF_CHARGES.slice(0, -1).includes(editForm.natureOfCharge || "") ? editForm.natureOfCharge : "Others"}
                            onChange={(e) => handleFieldChange("natureOfCharge", e.target.value)}
                            className="w-full bg-slate-950 border border-indigo-500 rounded p-0.5 text-slate-100 focus:outline-none text-center font-black text-xs"
                          >
                            {NATURE_OF_CHARGES.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          {(!NATURE_OF_CHARGES.slice(0, -1).includes(editForm.natureOfCharge || "") || editForm.natureOfCharge === "Others") && (
                            <input
                              type="text"
                              value={editForm.natureOfCharge === "Others" ? "" : (editForm.natureOfCharge || "")}
                              onChange={(e) => handleFieldChange("natureOfCharge", e.target.value)}
                              placeholder="Enter Charge type..."
                              className="w-full bg-slate-900 border border-amber-500/80 rounded p-0.5 text-[10px] text-amber-200 placeholder-slate-500 focus:outline-none text-center"
                            />
                          )}
                        </div>
                      ) : (
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase border select-none ${
                          row.natureOfCharge === "SF-5" 
                            ? "bg-red-950/80 border-red-850 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.1)]"
                            : row.natureOfCharge === "SF-11"
                            ? "bg-yellow-950/80 border-yellow-850 text-yellow-300"
                            : "bg-slate-900 border-slate-700 text-slate-400"
                        }`}>
                          {row.natureOfCharge}
                        </span>
                      )}
                    </td>

                    {/* ISSUED DATE */}
                    <td className="py-1.5 px-1.5 text-center text-[#f1f5f9] font-mono font-bold min-w-[80px]">
                      {isEditing ? (
                        <input
                          type="text"
                          placeholder="DD/MM/YYYY"
                          value={editForm.issuedDate || ""}
                          onChange={(e) => handleFieldChange("issuedDate", e.target.value)}
                          className="w-full bg-slate-950 border border-indigo-500 rounded p-0.5 text-slate-100 focus:outline-none text-center font-mono text-xs"
                        />
                      ) : (
                        row.issuedDate || <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* NAME OF DA */}
                    <td 
                      className={`py-1.5 px-2 text-center min-w-[100px] ${
                        !isEditing ? "cursor-pointer hover:bg-slate-900/80 hover:text-white transition-all group/cell" : ""
                      }`}
                      title={row.nameOfDa && !isEditing ? "Click to view full Name of DA" : ""}
                      onClick={() => {
                        if (!isEditing && row.nameOfDa) {
                          setSelectedTextDetail({
                            title: "Name of Disciplinary Authority / अनुशासनिक अधिकारी का नाम",
                            content: row.nameOfDa
                          });
                        }
                      }}
                    >
                      {isEditing ? (
                        <div className="space-y-0.5">
                          <select
                            value={DA_NAMES.slice(0, -1).includes(editForm.nameOfDa || "") ? editForm.nameOfDa : "Others"}
                            onChange={(e) => handleFieldChange("nameOfDa", e.target.value)}
                            className="w-full bg-slate-950 border border-indigo-500 rounded p-0.5 text-slate-100 focus:outline-none text-center font-bold text-xs"
                          >
                            {DA_NAMES.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          {(!DA_NAMES.slice(0, -1).includes(editForm.nameOfDa || "") || editForm.nameOfDa === "Others") && (
                            <input
                              type="text"
                              value={editForm.nameOfDa === "Others" ? "" : (editForm.nameOfDa || "")}
                              onChange={(e) => handleFieldChange("nameOfDa", e.target.value)}
                              placeholder="Name..."
                              className="w-full bg-slate-900 border border-amber-500/80 rounded p-0.5 text-[10px] text-amber-200 placeholder-slate-500 focus:outline-none text-center"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-1">
                          <span className={`inline-block mx-auto px-2.5 py-0.5 rounded-md text-[11px] font-extrabold border ${
                            row.nameOfDa === "Shri Atul Kumar" || row.nameOfDa === "Atul Kumar"
                              ? "bg-red-950 text-red-300 border-red-900"
                              : row.nameOfDa === "Shri A.K.Singh" || row.nameOfDa === "A.K.Singh" || row.nameOfDa === "Shri Anjani Kumar" || row.nameOfDa === "Anjani Kumar"
                              ? "bg-emerald-950 text-emerald-300 border-emerald-900"
                              : row.nameOfDa === "Shri Lalit Kumar" || row.nameOfDa === "Lalit Kumar"
                              ? "bg-sky-950 text-sky-300 border-sky-900"
                              : "bg-slate-900 text-slate-200 border-slate-800"
                          }`}>
                            {row.nameOfDa}
                          </span>
                          {row.nameOfDa && (
                            <span className="opacity-0 group-hover/cell:opacity-100 text-[8px] text-[#38bdf8] bg-slate-950 px-0.5 py-0.5 rounded transition-opacity shrink-0">
                              🔍
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* DESIGNATION OF DA */}
                    <td 
                      className={`py-1.5 px-1.5 text-center font-bold text-[#f1f5f9] min-w-[80px] ${
                        !isEditing ? "cursor-pointer hover:bg-slate-900/80 hover:text-white transition-all group/cell" : ""
                      }`}
                      title={row.designationOfDa && !isEditing ? "Click to view Designation of DA" : ""}
                      onClick={() => {
                        if (!isEditing && row.designationOfDa) {
                          setSelectedTextDetail({
                            title: "Designation of Disciplinary Authority / अनुशासनिक अधिकारी का पद",
                            content: row.designationOfDa
                          });
                        }
                      }}
                    >
                      {isEditing ? (
                        <div className="space-y-0.5">
                          <select
                            value={DA_DESIGNATIONS.slice(0, -1).includes(editForm.designationOfDa || "") ? editForm.designationOfDa : "Others"}
                            onChange={(e) => handleFieldChange("designationOfDa", e.target.value)}
                            className="w-full bg-slate-950 border border-indigo-500 rounded p-0.5 text-slate-100 focus:outline-none text-center text-xs"
                          >
                            {DA_DESIGNATIONS.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          {(!DA_DESIGNATIONS.slice(0, -1).includes(editForm.designationOfDa || "") || editForm.designationOfDa === "Others") && (
                            <input
                              type="text"
                              value={editForm.designationOfDa === "Others" ? "" : (editForm.designationOfDa || "")}
                              onChange={(e) => handleFieldChange("designationOfDa", e.target.value)}
                              placeholder="Designation..."
                              className="w-full bg-slate-900 border border-amber-500/80 rounded p-0.5 text-[10px] text-amber-200 placeholder-slate-500 focus:outline-none text-center"
                            />
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate mx-auto font-bold">{row.designationOfDa || <span className="text-slate-600">-</span>}</span>
                          {row.designationOfDa && (
                            <span className="opacity-0 group-hover/cell:opacity-100 text-[8px] text-[#38bdf8] bg-slate-950 px-0.5 py-0.5 rounded transition-opacity shrink-0">
                              🔍
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* NATURE OF CASE */}
                    <td className="py-1.5 px-1.5 text-center min-w-[75px]">
                      {isEditing ? (
                        <select
                          value={editForm.natureOfCase || ""}
                          onChange={(e) => handleFieldChange("natureOfCase", e.target.value)}
                          className="w-full bg-slate-950 border border-indigo-500 rounded p-0.5 text-slate-100 focus:outline-none text-center font-extrabold text-xs"
                        >
                          {CASE_NATURES.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-black uppercase tracking-wider ${
                          row.natureOfCase === "Vig"
                            ? "bg-red-950/40 border border-red-900/60 text-red-400"
                            : "bg-slate-900/60 border border-slate-800 text-slate-400"
                        }`}>
                          {row.natureOfCase}
                        </span>
                      )}
                    </td>

                    {/* PRESENT STATUS */}
                    <td className="py-1.5 px-1.5 text-center min-w-[90px]">
                      {isEditing ? (
                        <select
                          value={editForm.presentStatus || "Pending"}
                          onChange={(e) => handleFieldChange("presentStatus", e.target.value)}
                          className="w-full bg-slate-950 border border-indigo-500 rounded p-0.5 text-slate-100 focus:outline-none text-center font-bold text-[11px]"
                        >
                          {STATUS_LIST.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        (() => {
                          const isFinalized = row.presentStatus === "Finalized";
                          if (!isFinalized) {
                            return (
                              <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#ef4444] text-white border border-red-300 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)] select-none">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                                ⚠️ PENDING
                              </span>
                            );
                          } else {
                            return (
                              <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950/80 border border-emerald-600 text-emerald-400 select-none">
                                ✅ FINALIZED
                              </span>
                            );
                          }
                        })()
                      )}
                    </td>

                    {/* CHARGES */}
                    <td 
                      className={`py-1.5 px-2 text-slate-300 max-w-[180px] ${
                        !isEditing ? "cursor-pointer hover:bg-slate-900/80 hover:text-white transition-all group/cell" : ""
                      }`}
                      title={row.charges && !isEditing ? "Click to view full charges detail" : ""}
                      onClick={() => {
                        if (!isEditing && row.charges) {
                          setSelectedTextDetail({
                            title: "Articles of Charges / आरोप (चार्जशीट का विवरण)",
                            content: row.charges
                          });
                        }
                      }}
                    >
                      {isEditing ? (
                        <textarea
                          value={editForm.charges || ""}
                          onChange={(e) => handleFieldChange("charges", e.target.value)}
                          className="w-full bg-slate-950 border border-indigo-500 rounded p-0.5 text-slate-100 focus:outline-none font-medium text-xs resize-none h-6"
                          placeholder="Charges details..."
                        />
                      ) : (
                        <div className="flex items-center justify-between gap-1">
                          <span className="truncate">{row.charges || <span className="text-slate-650 italic">- None -</span>}</span>
                          {row.charges && (
                            <span className="opacity-0 group-hover/cell:opacity-100 text-[8.5px] text-[#38bdf8] bg-slate-950 px-1 py-0.5 rounded transition-opacity shrink-0">
                              🔍 Details
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* DATE OF NIP */}
                    <td className="py-1.5 px-1.5 text-center text-[#f1f5f9] font-mono font-bold min-w-[80px]">
                      {isEditing ? (
                        <input
                          type="text"
                          placeholder="DD/MM/YYYY"
                          value={editForm.dateOfDaNip || ""}
                          onChange={(e) => handleFieldChange("dateOfDaNip", e.target.value)}
                          className="w-full bg-slate-950 border border-indigo-500 rounded p-0.5 text-slate-100 focus:outline-none text-center font-mono text-xs"
                        />
                      ) : (
                        row.dateOfDaNip || <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* PENALTY DETAILS */}
                    <td 
                      className={`py-1.5 px-2 text-slate-200 max-w-xs ${
                        !isEditing ? "cursor-pointer hover:bg-slate-900/80 hover:text-white transition-all group/cell" : ""
                      }`}
                      title={row.penalty && !isEditing ? "Click to view penalty details" : ""}
                      onClick={() => {
                        if (!isEditing && row.penalty) {
                          setSelectedTextDetail({
                            title: "Penalty Details / दण्ड का विवरण",
                            content: row.penalty
                          });
                        }
                      }}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.penalty || ""}
                          onChange={(e) => handleFieldChange("penalty", e.target.value)}
                          className="w-full bg-slate-950 border border-indigo-500 rounded p-0.5 text-slate-100 focus:outline-none text-xs"
                          placeholder="Penalty details..."
                        />
                      ) : (
                        <div className="flex items-center justify-between gap-1 overflow-hidden">
                          <span className="truncate">{row.penalty || <span className="text-slate-600 italic">No Penalty Yet</span>}</span>
                          {row.penalty && (
                            <span className="opacity-0 group-hover/cell:opacity-100 text-[8.5px] text-[#38bdf8] bg-slate-950 px-1 py-0.5 rounded transition-opacity shrink-0 font-sans">
                              🔍 Details
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="py-1 px-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={() => saveRow(row.id)}
                              className="p-1 px-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[8px] font-black uppercase flex items-center gap-0.5 cursor-pointer transition-all active:scale-95 shadow"
                              title="Save Changes"
                            >
                              <Save size={10} />
                              Save
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-1 px-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[8px] font-black uppercase flex items-center gap-0.5 cursor-pointer transition-all active:scale-95"
                              title="Discard"
                            >
                              <X size={10} />
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditingRow(row)}
                              className="p-1 bg-slate-900 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white rounded cursor-pointer transition-all duration-150 active:scale-95"
                              title="Click to Edit Row"
                            >
                              <Edit2 size={11} />
                            </button>
                            {deleteConfirmId === row.id ? (
                              <div className="flex items-center gap-0.5 bg-red-950/80 border border-red-500/60 p-0.5 rounded animate-pulse">
                                <button
                                  onClick={() => {
                                    deleteRow(row.id);
                                    setDeleteConfirmId(null);
                                  }}
                                  className="px-1 py-0.5 bg-red-650 hover:bg-red-500 text-white rounded text-[8px] font-black uppercase cursor-pointer"
                                  title="Confirm Delete"
                                >
                                  OK
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="p-0.5 bg-slate-850 hover:bg-slate-750 text-slate-300 rounded text-[8px] font-black uppercase cursor-pointer"
                                  title="Cancel"
                                >
                                  <X size={9} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(row.id)}
                                className="p-1 bg-slate-900 border border-slate-800 hover:bg-red-950/60 hover:border-red-900 text-slate-400 hover:text-red-400 rounded cursor-pointer transition-all duration-150 active:scale-95"
                                title="Delete Row"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}

      {/* Embedded spreadsheet tips panel */}
      <div className="flex gap-4 p-4 rounded-xl bg-indigo-950/15 border border-indigo-900/40 text-slate-400 text-xs mt-4">
        <div className="w-5 h-5 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 self-start mt-0.5 text-indigo-400">
          <HelpCircle size={14} />
        </div>
        <div>
          <span className="font-extrabold text-slate-300 block mb-0.5 uppercase tracking-wider">
            {currentLang === 'hi' ? "★ डेटा संपादन निर्देश" : "★ Matrix Editor Instructions"}
          </span>
          <p className="leading-relaxed">
            {currentLang === 'hi'
              ? "आप दाईं ओर दिए गए 'एडिट' बटन पर क्लिक करके किसी भी प्रविष्टि को बदल सकते हैं। डेटा सीधे डेटाबेस से जुड़ा हुआ है और सुरक्षित रूप से सहेज लिया जाता है। एक्सेल इम्पोर्ट करने के लिए टेम्पलेट डाउनलोड करके आवश्यक बदलाव करें और अपलोड करें।"
              : "Click the pencil icon on the right end of any row to enable inline cell writing mode. Clicking 'Save' instantly commits adjustments to the production Firestore database in real-time. Use 'Export Backup' to download full archives."}
          </p>
        </div>
      </div>

      {/* SELECTED TEXT DETAIL VIEW POPUP MODAL */}
      {selectedTextDetail && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-700/80 rounded-3xl p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_4px_20px_rgba(99,102,241,0.2)] transition-all duration-300 transform scale-100 flex flex-col gap-5 text-white overflow-hidden outline-none">
            {/* Top ambient line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent blur-sm" />

            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-800/80 pb-3">
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-[#38bdf8]">
                  Information Detail / विस्तृत विवरण
                </span>
                <h3 className="text-lg font-black tracking-tight text-white leading-normal mt-0.5">
                  {selectedTextDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTextDetail(null)}
                className="p-1.5 hover:bg-slate-800/80 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl shadow-inner max-h-[300px] overflow-y-auto font-sans leading-relaxed text-[13.5px] select-text selection:bg-indigo-500 selection:text-white whitespace-pre-wrap text-slate-200">
              {selectedTextDetail.content}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-1">
              <button
                onClick={() => setSelectedTextDetail(null)}
                className="px-5 py-2 bg-gradient-to-b from-slate-800 to-slate-900 hover:from-slate-750 hover:to-slate-800 border border-slate-700 text-slate-100 font-extrabold text-[11px] tracking-wider uppercase rounded-xl shadow transition-all active:translate-y-[1px] cursor-pointer"
              >
                {currentLang === 'hi' ? "बंद करें" : "Close Window"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
