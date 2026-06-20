import React, { useState, useEffect } from "react";
import { 
  Building,
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  FileSpreadsheet, 
  ArrowLeft, 
  Loader2, 
  Info,
  Search,
  Upload
} from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { 
  collection, 
  query, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  doc, 
  writeBatch 
} from "firebase/firestore";
import { toast } from "sonner";

interface CustomStation {
  code: string;
  name: string;
  hindiName: string;
  lat: number;
  lng: number;
}

export function CustomStationsManager() {
  const [stations, setStations] = useState<CustomStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [querySearch, setQuerySearch] = useState("");

  // Single Station Form State
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formHindi, setFormHindi] = useState("");

  // Bulk Excel Importer State
  const [isExcelOpen, setIsExcelOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  // Load Custom Stations in Real-Time
  useEffect(() => {
    setLoading(true);
    const colRef = collection(db, "custom_stations");
    const unsub = onSnapshot(
      colRef, 
      (snap) => {
        const list: CustomStation[] = [];
        snap.forEach((d) => {
          list.push(d.data() as CustomStation);
        });
        setStations(list.sort((a, b) => a.name.localeCompare(b.name)));
        setLoading(false);
      }, 
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "custom_stations");
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = formCode.trim().toUpperCase();
    const name = formName.trim();
    const hindi = formHindi.trim() || name;

    if (!code || !name) {
      toast.error("Station Code and Name are both required.");
      return;
    }

    setSaving(true);
    const newStation: CustomStation = {
      code,
      name,
      hindiName: hindi,
      lat: 20, // default coordinates
      lng: 78
    };

    try {
      await setDoc(doc(db, "custom_stations", code), newStation);
      toast.success(`Station ${name} (${code}) added successfully!`);
      setFormCode("");
      setFormName("");
      setFormHindi("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add custom station database record.");
    } finally {
      setSaving(false);
    }
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) {
      toast.error("Please paste Excel table data first.");
      return;
    }

    setSaving(true);
    const lines = bulkText.split("\n");
    let count = 0;
    const batch = writeBatch(db);

    try {
      for (const line of lines) {
        if (!line.trim()) continue;
        
        // Split by tabs (from Excel copy-paste) or commas or semicolons
        const parts = line.split(/[\t,\t;]/);
        if (parts.length >= 2) {
          const code = parts[0].trim().toUpperCase();
          const name = parts[1].trim();
          const hindi = parts[2] ? parts[2].trim() : name;
          
          if (code && name && code.length <= 10) {
            const docRef = doc(db, "custom_stations", code);
            batch.set(docRef, {
              code,
              name,
              hindiName: hindi,
              lat: 20,
              lng: 78
            });
            count++;
          }
        } else {
          // Fallback pattern: Space separated "CODE Station Name"
          const match = line.trim().match(/^([A-Za-z0-9]{1,10})\s+(.+)$/);
          if (match) {
            const code = match[1].trim().toUpperCase();
            const name = match[2].trim();
            const docRef = doc(db, "custom_stations", code);
            batch.set(docRef, {
              code,
              name,
              hindiName: name,
              lat: 20,
              lng: 78
            });
            count++;
          }
        }
      }

      if (count > 0) {
        await batch.commit();
        toast.success(`Successfully imported ${count} custom stations from Excel content!`);
        setBulkText("");
        setIsExcelOpen(false);
      } else {
        toast.error("No valid lines matched. Ensure column 1 is station Code and column 2 is station Name.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Bulk import failed. Please verify format.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (code: string) => {
    if (!confirm(`Are you sure you want to delete station ${code}?`)) return;
    try {
      await deleteDoc(doc(db, "custom_stations", code));
      toast.success(`Station ${code} deleted.`);
    } catch (err) {
      toast.error("Failed to delete custom station record.");
    }
  };

  const filteredStations = stations.filter(s => 
    s.code.toLowerCase().includes(querySearch.toLowerCase()) ||
    s.name.toLowerCase().includes(querySearch.toLowerCase()) ||
    s.hindiName.toLowerCase().includes(querySearch.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 space-y-8" id="custom-stations-mgr">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-850 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Building className="h-5 w-5 text-indigo-400" />
            Custom Railway Station Database Manager (रेल स्टेशन डेटाबेस)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Add or import new railway stations with their codes. These will instantly appear in the TA Claim Form autocompletes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExcelOpen(!isExcelOpen)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 border transition-all ${
              isExcelOpen 
                ? "bg-slate-800 border-indigo-500 text-indigo-300"
                : "bg-slate-850 border-slate-750 text-slate-200 hover:bg-slate-800"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            {isExcelOpen ? "Show Single Add" : "Excel Sheet Mass Import"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Single Station Add Form or Excel Importer */}
        <div className="lg:col-span-1 space-y-6">
          {!isExcelOpen ? (
            <form onSubmit={handleAddSingle} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-indigo-400" />
                Add Single Station (एकल स्टेशन जोड़ें)
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Station Code * (e.g. BSL, BSP)
                  </label>
                  <input
                    type="text"
                    required
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    placeholder="E.g. NDLS"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Station Name * (English)
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="E.g. New Delhi"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                    Station Name (Hindi / Optional)
                  </label>
                  <input
                    type="text"
                    value={formHindi}
                    onChange={(e) => setFormHindi(e.target.value)}
                    placeholder="E.g. नई दिल्ली"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Station Record
              </button>
            </form>
          ) : (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                Excel / Sheets Paste (एक्सेल कॉपी-पेस्ट)
              </h3>
              
              <div className="bg-slate-900 border border-slate-850 rounded-lg p-3 text-xs text-slate-400 space-y-2">
                <p className="font-semibold text-slate-300">Format rules:</p>
                <p>1. Copy any two or three columns from your Excel table (Code, Name, and optional Hindi name).</p>
                <p>2. Paste them below directly. Rows must be separated by new-lines.</p>
                <p className="text-slate-500 mt-1 italic">Example:<br />BSP &nbsp; &nbsp; Bilaspur Jn &nbsp; &nbsp; बिलासपुर जंक्शन</p>
              </div>

              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Paste columns from Excel sheet here..."
                rows={10}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 placeholder-slate-700 font-mono focus:outline-none focus:border-emerald-500 transition-colors"
              />

              <button
                onClick={handleBulkImport}
                disabled={saving}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Execute Bulk Import ({bulkText.split('\n').filter(l => l.trim()).length} Rows)
              </button>
            </div>
          )}
        </div>

        {/* Right Side: List of custom stations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-4 border border-slate-850 rounded-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search registered custom stations by code or name..."
                value={querySearch}
                onChange={(e) => setQuerySearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Registered Custom: <span className="text-indigo-400 font-bold">{stations.length}</span> / showing <span className="text-white font-bold">{filteredStations.length}</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                <p className="text-xs">Loading custom station data from server...</p>
              </div>
            ) : filteredStations.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <Building className="h-8 w-8 mx-auto text-slate-700" />
                <p className="text-xs">No custom station records found matching your query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-widest font-black">
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Name (English)</th>
                      <th className="px-4 py-3">Hindi Name</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStations.map((station) => (
                      <tr key={station.code} className="border-b border-slate-850 hover:bg-slate-900/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-300">{station.code}</td>
                        <td className="px-4 py-3 font-medium text-white">{station.name}</td>
                        <td className="px-4 py-3 text-slate-300">{station.hindiName}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDelete(station.code)}
                            className="p-1 px-2 rounded bg-red-950/40 border border-red-900/50 hover:bg-red-900/60 text-red-300 transition-all flex items-center justify-center gap-1.5 ml-auto text-[10px] font-semibold"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
