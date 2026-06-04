import React, { useState, useEffect } from "react";
import { Database, Plus, Trash2, RefreshCw, CheckCircle, AlertTriangle, FileSpreadsheet, ArrowLeft, Loader2, Info } from "lucide-react";
import { db } from "../firebase";
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, writeBatch } from "firebase/firestore";
import { toast } from "sonner";

export function GoogleSheetManager() {
  const [sheets, setSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formCategory, setFormCategory] = useState("Database");

  useEffect(() => {
    const q = query(collection(db, "google_sheets_sources"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setSheets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const extractSheetId = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const extractGid = (url: string) => {
    const match = url.match(/[#&?]gid=([0-9]+)/);
    return match ? match[1] : "0";
  };

  const handleAddSheet = async () => {
    if (!formName || !formUrl) {
      toast.error("Name and URL are required");
      return;
    }

    const sheetId = extractSheetId(formUrl);
    const gid = extractGid(formUrl);
    
    if (!sheetId) {
      toast.error("Invalid Google Sheet URL. Ensure it contains the /d/ structure.");
      return;
    }

    try {
      await addDoc(collection(db, "google_sheets_sources"), {
        name: formName.trim(),
        description: formDesc.trim(),
        url: formUrl.trim(),
        sheetId: sheetId,
        gid: gid,
        category: formCategory,
        status: "Pending Sync",
        recordCount: 0,
        createdAt: serverTimestamp()
      });
      toast.success("Sheet added successfully");
      setIsFormOpen(false);
      setFormName("");
      setFormDesc("");
      setFormUrl("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to add sheet");
    }
  };

  const handleDeleteSheet = async (id: string, sheetId: string) => {
    if (confirm("Remove this Google Sheet connection? AI Search will no longer query this data.")) {
      try {
        await deleteDoc(doc(db, "google_sheets_sources", id));
        toast.success("Sheet source removed");
      } catch (err) {
        toast.error("Failed to remove sheet");
      }
    }
  };

  // Simple CSV parser for standard data (avoids full papaparse import)
  const parseCSV = (str: string) => {
    const lines = str.split(/\r?\n/);
    if(lines.length === 0) return [];
    
    // Naive split, handles standard comma separation (quotes might be tricky but works for flat data)
    const splitLine = (l: string) => {
      const match = l.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      return match ? match.map(s => s.replace(/(^"|"$)/g, '').trim()) : l.split(",").map(s => s.trim());
    };
    
    const headers = splitLine(lines[0]);
    const results = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if(!line.trim()) continue;
        const vals = splitLine(line);
        const obj: any = {};
        for(let c = 0; c < headers.length; c++) {
            obj[headers[c] || `Column${c}`] = vals[c] || "";
        }
        results.push(obj);
    }
    return results;
  };

  const handleSync = async (sheetObj: any) => {
    setSyncingId(sheetObj.id);
    try {
      // Use the Google Sheets export endpoint for public sheets
      const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetObj.sheetId}/export?format=csv&gid=${sheetObj.gid || '0'}`;
      
      const response = await fetch(exportUrl);
      if (!response.ok) throw new Error("Failed to fetch. Is the sheet public?");
      
      const csvText = await response.text();
      
      if (csvText.startsWith("<!DOCTYPE html>")) {
         throw new Error("Access denied. Please ensure the Google Sheet's link sharing is set to 'Anyone with the link' can view.");
      }

      const records = parseCSV(csvText);

      // We will store the synced records in a dedicated collection "sheet_sync_records", tagged with the source ID.
      // 1. Delete old records for this sheet
      const oldRecordsQuery = query(collection(db, "sheet_sync_records"));
      const oldSnapshot = await getDocs(oldRecordsQuery);
      
      const batch = writeBatch(db);
      oldSnapshot.docs.forEach((d) => {
         // Filter client side as we don't have composite indexes guaranteed
         if(d.data().sourceSheetObjId === sheetObj.id) {
             batch.delete(d.ref);
         }
      });
      await batch.commit();

      // 2. Insert new records in batch (Firestore batches max 500, but we'll do sequential chunks if large)
      // For simplicity in UI demo, pushing first 100 rows manually
      const limitRecords = records.slice(0, 1000); 
      for(let i = 0; i < limitRecords.length; i++) {
         await addDoc(collection(db, "sheet_sync_records"), {
             sourceSheetObjId: sheetObj.id,
             sourceName: sheetObj.name,
             data: limitRecords[i],
             recordDate: new Date().toISOString(),
             createdAt: serverTimestamp() // For freshness tracking
         });
      }

      // Update Sheet status
      await updateDoc(doc(db, "google_sheets_sources", sheetObj.id), {
        status: "🟢 Connected",
        lastSyncAt: new Date().toISOString(),
        recordCount: records.length,
        updatedAt: serverTimestamp()
      });

      toast.success(`Successfully synced ${records.length} records!`);

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Sync failed.");
      await updateDoc(doc(db, "google_sheets_sources", sheetObj.id), {
        status: "🔴 Access Error",
        lastError: err.message
      });
    } finally {
      setSyncingId(null);
    }
  };

  const formatDate = (isoString?: string) => {
     if(!isoString) return "Never";
     const d = new Date(isoString);
     return `${d.toLocaleDateString('en-GB').replace(/\//g, '-')} ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  if (isFormOpen) {
    return (
      <div className="space-y-6 animate-fade-in bg-white p-6 rounded-xl border shadow-sm max-w-2xl mx-auto mt-6">
        <div className="flex items-center gap-4 mb-6 border-b pb-4">
          <button onClick={() => setIsFormOpen(false)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full">
             <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Add New Google Sheet</h2>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex flex-col gap-2 text-yellow-800 text-sm mb-6">
           <div className="flex items-start">
             <Info className="w-5 h-5 mr-3 shrink-0 flex-none" />
             <p><strong>Note:</strong> Ensure the Google Sheet is shared as <strong>"Anyone with the link can view"</strong> before connecting.</p>
           </div>
           <div className="flex items-start">
             <Info className="w-5 h-5 mr-3 shrink-0 flex-none opacity-0" />
             <p><strong>Multiple Tabs?</strong> To sync multiple tabs (sheets) from the same file, you must add each tab separately. Open the tab in Google Sheets, copy its unique URL (it should have <code>#gid=...</code> at the end), and connect it as a new Data Source.</p>
           </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sheet Name *</label>
            <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. Retirement Data" className="w-full px-4 py-2.5 border rounded-lg outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose/Description</label>
            <input type="text" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Optional description..." className="w-full px-4 py-2.5 border rounded-lg outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Google Sheet URL *</label>
            <input type="text" value={formUrl} onChange={e => setFormUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." className="w-full px-4 py-2.5 border rounded-lg outline-none focus:border-blue-500" />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
             <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg outline-none focus:border-blue-500 bg-white">
               <option>Database</option>
               <option>HR</option>
               <option>Finance</option>
               <option>General</option>
             </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t mt-6">
           <button onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition">Cancel</button>
           <button onClick={handleAddSheet} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">Connect Sheet</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <FileSpreadsheet className="text-[#0f9d58]" />
            Data Sources (Google Sheets)
          </h2>
          <p className="text-gray-500">Connect and sync external Google Sheets to the AI Search system.</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-[#0f9d58] hover:bg-[#0b8043] text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus size={18} /> Add Google Sheet
        </button>
      </div>

       {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
       ) : sheets.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-xl shadow-sm">
          <FileSpreadsheet className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Connected Data Sources</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">You can import real-time data from any public Google Sheet to be queried by the AI system seamlessly.</p>
        </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {sheets.map((sheet, i) => (
             <div key={sheet.id} className="bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition">
               <div className="flex justify-between items-start mb-4">
                 <div>
                   <h3 className="text-lg font-bold text-gray-900 border-b-2 border-green-500 pb-0.5 inline-block mb-1">{sheet.name}</h3>
                   <div className="text-sm text-gray-500 mt-1 max-w-[280px] break-all truncate" title={sheet.url}>
                      <a href={sheet.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Link to Sheet</a>
                   </div>
                 </div>
                 <button onClick={() => handleDeleteSheet(sheet.id, sheet.sheetId)} className="p-2 text-gray-400 hover:text-red-500 transition hover:bg-red-50 rounded-lg">
                   <Trash2 size={18} />
                 </button>
               </div>
               
               <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm text-gray-600 mb-5 bg-gray-50 p-3 rounded-lg border">
                 <div>
                   <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Status</span>
                   <span className="font-medium text-gray-800">{sheet.status || "🟡 Pending Sync"}</span>
                 </div>
                 <div>
                   <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Category</span>
                   <span className="font-medium text-gray-800">{sheet.category}</span>
                 </div>
                 <div>
                   <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Record Count</span>
                   <span className="font-medium text-gray-800">{sheet.recordCount ?? 0}</span>
                 </div>
                 <div>
                   <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Last Sync</span>
                   <span className="font-medium text-gray-800">{formatDate(sheet.lastSyncAt)}</span>
                 </div>
               </div>

               <div className="border-t pt-4">
                  <button 
                    onClick={() => handleSync(sheet)}
                    disabled={syncingId === sheet.id}
                    className="w-full flex justify-center items-center gap-2 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 font-semibold shadow-sm disabled:opacity-50 transition"
                  >
                     {syncingId === sheet.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                     ) : (
                        <RefreshCw className="w-5 h-5 text-green-600" />
                     )}
                     SYNC NOW
                  </button>
               </div>
             </div>
           ))}
         </div>
       )}
    </div>
  );
}
