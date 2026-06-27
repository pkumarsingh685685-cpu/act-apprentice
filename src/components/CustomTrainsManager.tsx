import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Search, 
  Upload,
  FileSpreadsheet
} from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { 
  collection, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  doc, 
  writeBatch 
} from "firebase/firestore";
import { toast } from "sonner";

interface CustomTrain {
  trainNo: string;
  trainName: string;
  routeDistanceKm: number;
  routeVia: string;
}

export function CustomTrainsManager() {
  const [trains, setTrains] = useState<CustomTrain[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [querySearch, setQuerySearch] = useState("");

  // Single Train Form State
  const [formNumber, setFormNumber] = useState("");
  const [formName, setFormName] = useState("");
  const [formDistance, setFormDistance] = useState("");
  const [formRouteVia, setFormRouteVia] = useState("");

  // Load Custom Trains in Real-Time
  useEffect(() => {
    setLoading(true);
    const colRef = collection(db, "custom_trains");
    const unsub = onSnapshot(
      colRef, 
      (snap) => {
        const list: CustomTrain[] = [];
        snap.forEach((d) => {
          const data = d.data();
          list.push({
            trainNo: data.trainNo || d.id,
            trainName: data.trainName || "",
            routeDistanceKm: Number(data.routeDistanceKm) || 0,
            routeVia: data.routeVia || ""
          });
        });
        setTrains(list.sort((a, b) => a.trainNo.localeCompare(b.trainNo)));
        setLoading(false);
      }, 
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "custom_trains");
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const handleCSVFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) {
        toast.error("Could not read file content");
        return;
      }
      
      setSaving(true);
      // Strip UTF-8 Byte Order Mark (BOM) if present
      const cleanText = text.replace(/^\uFEFF/, "").trim();
      const lines = cleanText.split(/\r?\n/);
      let count = 0;
      const batch = writeBatch(db);

      try {
        for (const line of lines) {
          if (!line.trim()) continue;
          
          // Auto-detect delimiter: check for Tab, Semicolon, or fall back to Comma
          let delimiter = ",";
          if (line.includes("\t")) {
            delimiter = "\t";
          } else if (line.includes(";") && !line.includes(",")) {
            delimiter = ";";
          } else if (line.includes(";")) {
            const commas = (line.match(/,/g) || []).length;
            const semis = (line.match(/;/g) || []).length;
            if (semis > commas) delimiter = ";";
          }
          
          let parts: string[] = [];
          if (delimiter === ",") {
            try {
              parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            } catch (e) {
              parts = line.split(",");
            }
          } else {
            parts = line.split(delimiter);
          }
          
          if (parts.length >= 2) {
            // Strip leading/trailing quotes and control characters (e.g. carriage returns or UTF BOM)
            const rawNo = parts[0].replace(/^["']|["']$/g, '').trim();
            const trainNo = rawNo.replace(/[\u0000-\u001F\u007F-\u009F\uFEFF]/g, "").trim();
            
            const trainName = parts[1].replace(/^["']|["']$/g, '').trim();
            
            const rawDistance = parts[2] ? parts[2].replace(/^["']|["']$/g, '').trim() : "0";
            const routeDistanceKm = Number(rawDistance) || 0;

            const routeVia = parts[3] ? parts[3].replace(/^["']|["']$/g, '').trim() : "";
            
            if (trainNo && trainName) {
              // Ignore typical columns header rows
              const cleanNoWord = trainNo.toUpperCase().replace(/[^A-Z]/g, "");
              if (cleanNoWord === "TRAIN" || cleanNoWord === "TRAINNUMBER" || cleanNoWord === "NUMBER" || cleanNoWord === "TRAINNO") {
                continue;
              }
              const docRef = doc(db, "custom_trains", trainNo);
              batch.set(docRef, {
                trainNo,
                trainName,
                routeDistanceKm,
                routeVia
              });
              count++;
            }
          }
        }

        if (count > 0) {
          await batch.commit();
          toast.success(`Successfully imported ${count} custom trains from CSV file!`);
          e.target.value = ""; // reset input elements
        } else {
          toast.error("No valid lines matched. Format must be: TRAIN_NO,TRAIN_NAME (केवल 2 कॉलम भी चलेंगे!)");
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || "CSV parsing or database write failed.");
      } finally {
        setSaving(false);
      }
    };
    reader.readAsText(file);
  };

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    const trainNo = formNumber.trim();
    const trainName = formName.trim();
    const routeDistanceKm = Number(formDistance) || 0;
    const routeVia = formRouteVia.trim();

    if (!trainNo || !trainName) {
      toast.error("Train Number and Name are both required.");
      return;
    }

    setSaving(true);
    const newTrain: CustomTrain = {
      trainNo,
      trainName,
      routeDistanceKm,
      routeVia
    };

    try {
      await setDoc(doc(db, "custom_trains", trainNo), newTrain);
      toast.success(`Train ${trainName} (${trainNo}) added successfully!`);
      setFormNumber("");
      setFormName("");
      setFormDistance("");
      setFormRouteVia("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add custom train database record.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (trainNo: string) => {
    if (!confirm(`Are you sure you want to delete custom train ${trainNo}?`)) return;
    try {
      await deleteDoc(doc(db, "custom_trains", trainNo));
      toast.success(`Train ${trainNo} deleted.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete custom train record.");
    }
  };

  const filteredTrains = trains.filter(t => 
    t.trainNo.toLowerCase().includes(querySearch.toLowerCase()) ||
    t.trainName.toLowerCase().includes(querySearch.toLowerCase()) ||
    t.routeVia.toLowerCase().includes(querySearch.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-100 space-y-8" id="custom-trains-mgr">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-850 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-indigo-400" />
            Custom Train Database Manager (ट्रेन डेटाबेस प्रबंधक)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Upload custom Indian Railways train numbers and names. These will instantly match during TA Claim journey entries and fetch name details.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Single Train Add Form AND Direct CSV Importer */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleAddSingle} className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-5">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-400" />
              Add Single Train (एकल ट्रेन जोड़ें)
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Train Number * (e.g. 12424, 12505)
                </label>
                <input
                  type="text"
                  required
                  value={formNumber}
                  onChange={(e) => setFormNumber(e.target.value.trim())}
                  placeholder="E.g. 12488"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Train Name * (e.g. Seemanchal Express)
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="E.g. Seemanchal Express"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Route Distance KM (Optional)
                </label>
                <input
                  type="number"
                  value={formDistance}
                  onChange={(e) => setFormDistance(e.target.value)}
                  placeholder="E.g. 1250"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Route Via / Key Junctions (Optional)
                </label>
                <input
                  type="text"
                  value={formRouteVia}
                  onChange={(e) => setFormRouteVia(e.target.value)}
                  placeholder="E.g. via Patna, Katihar"
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
              Add Train Record
            </button>
          </form>

          {/* Direct CSV Importer */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="h-4 w-4 text-indigo-400" />
              Direct CSV Import (सीएसवी फ़ाइल अपलोड)
            </h3>

             <div className="bg-slate-900/80 border border-indigo-950/50 rounded-lg p-3 text-xs text-slate-300 space-y-2">
              <p className="font-extrabold text-indigo-300">📌 Only 2-Column CSV is fully Supported!</p>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                अगर आपके पास <strong>सिर्फ ट्रेन नंबर और ट्रेन का नाम</strong> (2 Columns) है, तो वह पूरी तरह से स्वीकार्य है! अतिरिक्त दूरी (Distance) या मार्ग (Route Via) भरना आवश्यक नहीं है।
              </p>
              <p className="text-slate-400 font-bold text-[10px]">
                स्वीकृत फ़ाइल प्रारूप (Supported Formats):
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[10px] pl-1">
                <li><code className="text-emerald-300 font-mono">TRAIN_NO,TRAIN_NAME</code> (केवल 2 कॉलम)</li>
                <li><code className="text-amber-400 font-mono">TRAIN_NO,TRAIN_NAME,DISTANCE_KM,ROUTE_VIA</code> (4 कॉलम)</li>
              </ul>
            </div>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-indigo-500 rounded-xl p-6 cursor-pointer bg-slate-900/60 hover:bg-slate-900 transition-all text-center">
              <Upload className="h-8 w-8 text-indigo-400 mb-2" />
              <span className="text-xs font-bold text-slate-200">Select `.csv` File</span>
              <span className="text-[10px] text-slate-500 mt-1">Accepts standard semicolon or tab delimited train files</span>
              <input
                type="file"
                accept=".csv"
                disabled={saving}
                onChange={handleCSVFileInput}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Right Side: List of custom trains */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-4 border border-slate-850 rounded-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search trains by number, name, or route..."
                value={querySearch}
                onChange={(e) => setQuerySearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="text-xs text-slate-400 font-medium whitespace-nowrap">
              Registered Custom: <span className="text-indigo-400 font-bold">{trains.length}</span> / showing <span className="text-white font-bold">{filteredTrains.length}</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                <p className="text-xs">Loading custom train data from cloud...</p>
              </div>
            ) : filteredTrains.length === 0 ? (
              <div className="py-16 text-center text-slate-500 space-y-2">
                <FileSpreadsheet className="h-8 w-8 mx-auto text-slate-700" />
                <p className="text-xs">No train records found matching your query.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-widest font-black">
                      <th className="px-4 py-3">Train No</th>
                      <th className="px-4 py-3">Train Name</th>
                      <th className="px-4 py-3">Distance</th>
                      <th className="px-4 py-3">Via / Route</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTrains.slice(0, 150).map((train) => (
                      <tr key={train.trainNo} className="border-b border-slate-850 hover:bg-slate-900/40 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-300">{train.trainNo}</td>
                        <td className="px-4 py-3 font-medium text-white">{train.trainName}</td>
                        <td className="px-4 py-3 font-mono text-emerald-400">{train.routeDistanceKm ? `${train.routeDistanceKm} KM` : "-"}</td>
                        <td className="px-4 py-3 text-slate-300 max-w-xs truncate" title={train.routeVia}>{train.routeVia || "-"}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDelete(train.trainNo)}
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
                {filteredTrains.length > 150 && (
                  <div className="p-3 text-center text-[10px] text-indigo-300 bg-slate-900/40 border-t border-slate-850">
                    Showing first 150 of {filteredTrains.length} registered trains. Use search to locate specific trains.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
